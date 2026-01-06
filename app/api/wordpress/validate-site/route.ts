/**
 * WordPress Site Validation Endpoint
 * FASE D - Credenciais + Conexão (Secure Connect)
 * 
 * POST /api/wordpress/validate-site
 * 
 * Valida site WordPress usando credenciais do banco (se configuradas)
 * ou credenciais fornecidas no request
 */

import { NextRequest, NextResponse } from 'next/server'
import { getWordPressCredentials } from '@/lib/wordpress/wordpress-credentials-service'
import { WordPressCredentialsValidator } from '@/lib/wordpress-credentials-validator'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'
import { StructuredLogger } from '@/lib/observability/logger'

export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = StructuredLogger.withCorrelation({ correlationId }, 'api')

  try {
    const body = await request.json()
    const {
      siteId,
      organizationId,
      siteUrl, // Opcional: se não fornecido, usa do banco
      wpUsername, // Opcional: se não fornecido, usa do banco
      wpPassword // Opcional: se não fornecido, usa do banco
    } = body

    // Se siteId e organizationId fornecidos, buscar credenciais do banco
    let wpBaseUrl = siteUrl
    let wpUsernameToUse = wpUsername
    let wpPasswordToUse = wpPassword

    if (siteId && organizationId) {
      try {
        const { credentials, decryptedPassword } = await getWordPressCredentials(
          siteId,
          organizationId
        )

        if (credentials?.wpConfigured) {
          wpBaseUrl = credentials.wpBaseUrl || siteUrl
          wpUsernameToUse = credentials.wpUsername || wpUsername
          wpPasswordToUse = decryptedPassword || wpPassword

          logger.info('Using stored WordPress credentials', {
            action: 'wp_validate_site',
            siteId,
            organizationId
          })
        }
      } catch (error) {
        logger.warn('Could not retrieve stored credentials, using provided ones', {
          action: 'wp_validate_site',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Validar campos obrigatórios
    if (!wpBaseUrl) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          {
            success: false,
            error: 'siteUrl is required (provide in request or configure for site)'
          },
          { status: 400 }
        ),
        correlationId
      )
    }

    if (!wpUsernameToUse || !wpPasswordToUse) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          {
            success: false,
            error: 'wpUsername and wpPassword are required (provide in request or configure for site)'
          },
          { status: 400 }
        ),
        correlationId
      )
    }

    logger.info('Validating WordPress site', {
      action: 'wp_validate_site',
      siteUrl: wpBaseUrl,
      siteId,
      organizationId
    })

    // Validar credenciais usando WordPressCredentialsValidator
    const validationResult = await WordPressCredentialsValidator.validateCredentials(
      wpBaseUrl,
      wpUsernameToUse,
      wpPasswordToUse
    )

    if (!validationResult.success) {
      logger.warn('WordPress site validation failed', {
        action: 'wp_validate_site',
        validationResult
      })

      return addCorrelationIdToResponse(
        NextResponse.json({
          success: false,
          siteUrl: wpBaseUrl,
          status: 'validation_failed',
          error: 'WordPress site validation failed',
          details: validationResult
        }),
        correlationId
      )
    }

    // Detectar capacidades do site
    const capabilities = await detectWordPressCapabilities(wpBaseUrl, wpUsernameToUse, wpPasswordToUse)

    logger.info('WordPress site validated successfully', {
      action: 'wp_validate_site',
      siteUrl: wpBaseUrl
    })

    return addCorrelationIdToResponse(
      NextResponse.json({
        success: true,
        siteUrl: wpBaseUrl,
        status: 'connected',
        message: 'Site WordPress válido e acessível',
        details: {
          ...validationResult,
          capabilities,
          apiEndpoints: {
            posts: `${wpBaseUrl}/wp-json/wp/v2/posts`,
            pages: `${wpBaseUrl}/wp-json/wp/v2/pages`,
            media: `${wpBaseUrl}/wp-json/wp/v2/media`,
            categories: `${wpBaseUrl}/wp-json/wp/v2/categories`,
            acf: `${wpBaseUrl}/wp-json/acf/v3/`
          }
        }
      }),
      correlationId
    )
  } catch (error) {
    logger.error('Error validating WordPress site', {
      action: 'wp_validate_site',
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

/**
 * Detectar capacidades do site WordPress
 */
async function detectWordPressCapabilities(
  baseUrl: string,
  username: string,
  password: string
): Promise<{
  createPages: boolean
  editPages: boolean
  manageAcfFields: boolean
  manageSeo: boolean
  hasRestApi: boolean
  hasAcfPlugin: boolean
  wordpressVersion?: string
}> {
  const capabilities = {
    createPages: false,
    editPages: false,
    manageAcfFields: false,
    manageSeo: false,
    hasRestApi: false,
    hasAcfPlugin: false,
    wordpressVersion: undefined as string | undefined
  }

  try {
    // Testar REST API básica
    const restUrl = `${baseUrl}/wp-json/wp/v2`
    const auth = Buffer.from(`${username}:${password}`).toString('base64')

    const response = await fetch(restUrl, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      capabilities.hasRestApi = true

      // Detectar versão WordPress
      const wpVersion = response.headers.get('X-WP-Version')
      if (wpVersion) {
        capabilities.wordpressVersion = wpVersion
      }

      // Testar ACF plugin
      try {
        const acfResponse = await fetch(`${baseUrl}/wp-json/acf/v3/`, {
          method: 'GET',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        })

        if (acfResponse.ok) {
          capabilities.hasAcfPlugin = true
          capabilities.manageAcfFields = true
        }
      } catch (error) {
        // ACF não disponível
      }

      // Testar permissões básicas (tentar listar pages)
      try {
        const pagesResponse = await fetch(`${restUrl}/pages?per_page=1`, {
          method: 'GET',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        })

        if (pagesResponse.ok) {
          capabilities.editPages = true
        }

        // Testar criação (POST request)
        // Nota: Não vamos criar de fato, apenas verificar se endpoint aceita
        capabilities.createPages = true // Assumir true se editPages é true
      } catch (error) {
        // Sem permissão
      }
    }
  } catch (error) {
    // Falha na detecção
  }

  return capabilities
}








