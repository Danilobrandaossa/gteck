/**
 * WordPress Webhook Endpoint
 * FASE F.1 - Contrato de Webhook (WP → APP)
 * 
 * POST /api/wordpress/webhook
 * 
 * Recebe webhooks do WordPress e enfileira jobs incrementais
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSiteBelongsToOrganization } from '@/lib/tenant-security'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'
import { StructuredLogger } from '@/lib/observability/logger'
import { WordPressPushService } from '@/lib/wordpress/wordpress-push'
import crypto from 'crypto'

export interface WordPressWebhookPayload {
  event: 'post' | 'page' | 'media' | 'term'
  action: 'created' | 'updated' | 'deleted'
  wpId: number
  wpType?: string
  modifiedGmt?: string
  siteUrl: string
  siteId?: string // Opcional: se WP enviar
  organizationId?: string // Opcional: se WP enviar
  timestamp?: number // Para replay protection
  signature?: string // HMAC signature
}

export interface WebhookValidationResult {
  valid: boolean
  error?: string
  siteId?: string
  organizationId?: string
  webhookSecret?: string
}

/**
 * Validar assinatura HMAC do webhook
 */
function validateWebhookSignature(
  payload: WordPressWebhookPayload,
  body: string,
  webhookSecret: string
): boolean {
  if (!payload.signature) {
    return false
  }

  // Calcular HMAC SHA-256
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  // Comparar assinaturas (timing-safe)
  return crypto.timingSafeEqual(
    Buffer.from(payload.signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Validar timestamp para replay protection (opcional)
 */
function validateTimestamp(timestamp?: number): boolean {
  if (!timestamp) {
    return true // Timestamp opcional
  }

  const now = Math.floor(Date.now() / 1000)
  const webhookTime = timestamp
  const diff = Math.abs(now - webhookTime)

  // Permitir até 5 minutos de diferença
  return diff <= 300
}

/**
 * Validar webhook e obter credenciais
 */
async function validateWebhook(
  payload: WordPressWebhookPayload
): Promise<WebhookValidationResult> {
  // 1. Validar campos obrigatórios
  if (!payload.event || !payload.action || !payload.wpId || !payload.siteUrl) {
    return {
      valid: false,
      error: 'Missing required fields: event, action, wpId, siteUrl'
    }
  }

  // 2. Buscar site por siteUrl (wpBaseUrl)
  const site = await db.site.findFirst({
    where: {
      wpBaseUrl: payload.siteUrl
    },
    select: {
      id: true,
      organizationId: true,
      wpConfigured: true
    }
  })

  if (!site) {
    return {
      valid: false,
      error: 'Site not found for the provided siteUrl'
    }
  }

  if (!site.wpConfigured) {
    return {
      valid: false,
      error: 'WordPress not configured for this site'
    }
  }

  // 3. Buscar webhookSecret (do AIPluginConfig ou Site)
  const pluginConfig = await db.aIPluginConfig.findUnique({
    where: { siteId: site.id },
    select: { webhookSecret: true }
  })

  const webhookSecret = pluginConfig?.webhookSecret

  if (!webhookSecret) {
    return {
      valid: false,
      error: 'Webhook secret not configured for this site'
    }
  }

  // 4. Validar ownership (se siteId/organizationId fornecidos)
  if (payload.siteId && payload.siteId !== site.id) {
    return {
      valid: false,
      error: 'SiteId mismatch'
    }
  }

  if (payload.organizationId && payload.organizationId !== site.organizationId) {
    return {
      valid: false,
      error: 'OrganizationId mismatch'
    }
  }

  return {
    valid: true,
    siteId: site.id,
    organizationId: site.organizationId,
    webhookSecret
  }
}

export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = StructuredLogger.withCorrelation({ correlationId }, 'api')

  let acceptedCount = 0
  let rejectedCount = 0
  let queuedCount = 0

  try {
    // Ler body como string para validação HMAC
    const bodyText = await request.text()
    const payload: WordPressWebhookPayload = JSON.parse(bodyText)

    logger.info('WordPress webhook received', {
      action: 'wp_webhook_received',
      event: payload.event,
      action: payload.action,
      wpId: payload.wpId
    })

    // 1. Validar webhook (ownership, site, secret)
    const validation = await validateWebhook(payload)

    if (!validation.valid) {
      rejectedCount++
      logger.warn('Webhook validation failed', {
        action: 'wp_webhook_validation',
        error: validation.error
      })

      return addCorrelationIdToResponse(
        NextResponse.json(
          { success: false, error: validation.error },
          { status: 403 }
        ),
        correlationId
      )
    }

    // 2. Validar assinatura HMAC
    if (!validateWebhookSignature(payload, bodyText, validation.webhookSecret!)) {
      rejectedCount++
      logger.warn('Webhook signature validation failed', {
        action: 'wp_webhook_signature'
      })

      return addCorrelationIdToResponse(
        NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        ),
        correlationId
      )
    }

    // 3. Validar timestamp (replay protection)
    if (!validateTimestamp(payload.timestamp)) {
      rejectedCount++
      logger.warn('Webhook timestamp validation failed', {
        action: 'wp_webhook_timestamp'
      })

      return addCorrelationIdToResponse(
        NextResponse.json(
          { success: false, error: 'Invalid timestamp (possible replay attack)' },
          { status: 401 }
        ),
        correlationId
      )
    }

    // 3.5. Verificar se webhook veio de mudança originada no CMS (anti-loop)
    if (payload.action === 'updated' || payload.action === 'created') {
      const isCmsOriginated = await WordPressPushService.isCmsOriginated(
        validation.siteId!,
        payload.wpId
      )

      if (isCmsOriginated) {
        // Ignorar webhook (veio de push do CMS)
        logger.info('Webhook ignored (CMS originated)', {
          action: 'wp_webhook_ignored',
          wpId: payload.wpId
        })

        return addCorrelationIdToResponse(
          NextResponse.json({
            success: true,
            message: 'Webhook ignored (CMS originated)',
            ignored: true
          }),
          correlationId
        )
      }
    }

    acceptedCount++

    // 4. Mapear evento para tipo de job
    const jobTypeMap: Record<string, string> = {
      term: 'wp_sync_item_term',
      media: 'wp_sync_item_media',
      page: 'wp_sync_item_page',
      post: 'wp_sync_item_post'
    }

    const jobType = jobTypeMap[payload.event] || `wp_sync_item_${payload.event}`

    // 5. Criar job incremental
    const jobData = {
      organizationId: validation.organizationId!,
      siteId: validation.siteId!,
      correlationId,
      wpEntityType: payload.event,
      wpId: payload.wpId,
      action: payload.action,
      wpType: payload.wpType,
      modifiedGmt: payload.modifiedGmt,
      siteUrl: payload.siteUrl,
      receivedAt: new Date().toISOString(),
      source: 'webhook' as const
    }

    const job = await db.queueJob.create({
      data: {
        type: jobType,
        status: 'pending',
        data: JSON.stringify(jobData),
        maxAttempts: 3
      }
    })

    queuedCount++

    // 6. Atualizar lastWebhookReceivedAt (adicionar ao Site se necessário)
    // Por enquanto, vamos apenas logar

    logger.info('WordPress webhook processed', {
      action: 'wp_webhook_processed',
      jobId: job.id,
      event: payload.event,
      action: payload.action,
      wpId: payload.wpId
    })

    // 7. Retornar resposta rápida (200 OK)
    return addCorrelationIdToResponse(
      NextResponse.json({
        success: true,
        message: 'Webhook received and queued',
        jobId: job.id,
        acceptedCount,
        rejectedCount,
        queuedCount
      }),
      correlationId
    )
  } catch (error) {
    logger.error('Error processing WordPress webhook', {
      action: 'wp_webhook_error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return addCorrelationIdToResponse(
      NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      ),
      correlationId
    )
  }
}

