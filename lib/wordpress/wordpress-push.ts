/**
 * WordPress Push Service
 * FASE F.5 - Bidirecional (CMS → WP) Controlado
 * 
 * Push de conteúdo do CMS para WordPress
 */

import { db } from '@/lib/db'
import { validateTenantContext } from '@/lib/tenant-security'
import { getWordPressCredentials } from './wordpress-credentials-service'
// import {  } from './wordpress-sync-map'
import { StructuredLogger } from '@/lib/observability/logger'
import crypto from 'crypto'

export interface PushToWordPressOptions {
  organizationId: string
  siteId: string
  pageId: string
  action: 'create' | 'update' | 'publish'
  correlationId?: string
}

export interface PushResult {
  success: boolean
  wpPostId?: number
  wpPostUrl?: string
  error?: string
}

export class WordPressPushService {
  /**
   * Push Page para WordPress
   */
  static async pushPage(
    options: PushToWordPressOptions
  ): Promise<PushResult> {
    const logger = StructuredLogger.withCorrelation(
      { correlationId: options.correlationId || 'push' },
      'api'
    )

    try {
      // Validar tenant context
      const validation = validateTenantContext(
        options.organizationId,
        options.siteId
      )

      if (!validation.valid) {
        throw new Error(`Invalid tenant context: ${validation.error}`)
      }

      // Buscar page
      const page = await db.page.findUnique({
        where: { id: options.pageId },
        select: {
          id: true,
          title: true,
          content: true,
          excerpt: true,
          slug: true,
          status: true,
          siteId: true,
          wpPostId: true,
          acfFields: true
        }
      })

      if (!page) {
        throw new Error('Page not found')
      }

      if (page.siteId !== options.siteId) {
        throw new Error('Page does not belong to the specified site')
      }

      // Obter credenciais WordPress
      const { credentials, decryptedPassword } = await getWordPressCredentials(
        options.siteId,
        options.organizationId
      )

      if (!credentials?.wpConfigured || !decryptedPassword) {
        throw new Error('WordPress credentials not configured')
      }

      // Criar idempotency key para evitar loops
      const idempotencyKey = crypto.randomUUID()

      // Preparar dados para WordPress
      const wpData: any = {
        title: page.title,
        content: page.content || '',
        excerpt: page.excerpt || '',
        status: page.status === 'published' ? 'publish' : 'draft',
        slug: page.slug
      }

      // Adicionar ACF fields se existirem
      if (page.acfFields) {
        try {
          const acfFields = JSON.parse(page.acfFields)
          wpData.meta = {}
          for (const [key, value] of Object.entries(acfFields)) {
            wpData.meta[key] = value
          }
        } catch (error) {
          // Ignorar erro de parse ACF
        }
      }

      // Criar auth header
      let authHeader: string
      if (credentials.wpAuthType === 'basic' || credentials.wpAuthType === 'application_password') {
        authHeader = `Basic ${Buffer.from(`${credentials.wpUsername}:${decryptedPassword}`).toString('base64')}`
      } else if (credentials.wpAuthType === 'jwt' || credentials.wpAuthType === 'oauth') {
        authHeader = `Bearer ${decryptedPassword}`
      } else {
        throw new Error(`Unsupported auth type: ${credentials.wpAuthType}`)
      }

      let wpPostId: number | undefined = page.wpPostId || undefined

      // Push para WordPress
      if (options.action === 'create' || !wpPostId) {
        // Criar novo post
        const response = await fetch(`${credentials.wpBaseUrl!.replace(/\/$/, '')}/wp-json/wp/v2/pages`, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': idempotencyKey // Para evitar loops
          },
          body: JSON.stringify(wpData)
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`WordPress API error: ${response.status} ${errorText}`)
        }

        const wpPost = await response.json()
        wpPostId = wpPost.id

        // Atualizar page com wpPostId
        await db.page.update({
          where: { id: options.pageId },
          data: {
            wpPostId,
            wpSiteUrl: credentials.wpBaseUrl,
            wpSyncedAt: new Date()
          }
        })
      } else {
        // Atualizar post existente
        const response = await fetch(`${credentials.wpBaseUrl!.replace(/\/$/, '')}/wp-json/wp/v2/pages/${wpPostId}`, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': idempotencyKey
          },
          body: JSON.stringify(wpData)
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`WordPress API error: ${response.status} ${errorText}`)
        }

         await response.json()

        // Atualizar wpSyncedAt
        await db.page.update({
          where: { id: options.pageId },
          data: {
            wpSyncedAt: new Date()
          }
        })
      }

      logger.info('Page pushed to WordPress', {
        action: 'wp_push_page',
        pageId: options.pageId,
        wpPostId
      })

      return {
        success: true,
        wpPostId,
        wpPostUrl: `${credentials.wpBaseUrl}?p=${wpPostId}`
      }
    } catch (error) {
      logger.error('Error pushing page to WordPress', {
        action: 'wp_push_page_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Verificar se webhook veio de mudança originada no CMS (anti-loop)
   */
  static async isCmsOriginated(
    siteId: string,
    wpId: number,
    _idempotencyKey?: string
  ): Promise<boolean> {
    // Verificar se há registro recente de push do CMS
    // Por enquanto, verificar se wpSyncedAt é muito recente (< 5 segundos)
    const page = await db.page.findFirst({
      where: {
        siteId,
        wpPostId: wpId
      },
      select: {
        wpSyncedAt: true
      }
    })

    if (!page || !page.wpSyncedAt) {
      return false
    }

    const now = new Date()
    const syncedAt = new Date(page.wpSyncedAt)
    const diff = now.getTime() - syncedAt.getTime()

    // Se foi sincronizado há menos de 5 segundos, provavelmente veio do CMS
    return diff < 5000
  }
}








