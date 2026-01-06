import { NextRequest, NextResponse } from 'next/server'
import { requireTenantContext, validateSiteBelongsToOrganization } from '@/lib/tenant-security'
import { StructuredLogger } from '@/lib/observability/logger'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'

export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('pressel.create', correlationId)

  try {
    const { 
      pageData, 
      siteId, 
      wordpressUrl, 
      authType, 
      credentials,
      organizationId
    } = await request.json()

    // ✅ CORREÇÃO CRÍTICA: Validar contexto de tenant
    let tenantContext
    try {
      tenantContext = requireTenantContext(organizationId, siteId)
    } catch (error) {
      logger.warn('Tenant validation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { 
            error: 'organizationId e siteId são obrigatórios e devem ser CUIDs válidos',
            errorCode: 'INVALID_TENANT_CONTEXT'
          },
          { status: 400 }
        ),
        correlationId
      )
    }

    // ✅ CORREÇÃO: Validar que site pertence à organização
    const siteBelongsToOrg = await validateSiteBelongsToOrganization(siteId, organizationId)
    if (!siteBelongsToOrg) {
      logger.warn('Site ownership validation failed', { siteId, organizationId })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { 
            error: 'Site não pertence à organização especificada',
            errorCode: 'SITE_OWNERSHIP_MISMATCH'
          },
          { status: 403 }
        ),
        correlationId
      )
    }

    logger.info('Creating Pressel page', {
      organizationId: tenantContext.organizationId,
      siteId: tenantContext.siteId,
      wordpressUrl,
      hasPageData: !!pageData
    })

    if (!pageData || !siteId || !wordpressUrl) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'Dados da página, siteId e wordpressUrl são obrigatórios' },
          { status: 400 }
        ),
        correlationId
      )
    }

    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Simular envio para WordPress
    const wordpressResponse = await sendToWordPress({
      url: wordpressUrl,
      authType,
      credentials,
      data: pageData
    })

    if (!wordpressResponse.success) {
      return NextResponse.json(
        { error: 'Erro ao criar página no WordPress', details: wordpressResponse.error },
        { status: 500 }
      )
    }

    // ✅ CORREÇÃO: Validar data antes de usar (guard clause)
    if (!wordpressResponse.data) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'Resposta inválida do WordPress: data ausente' },
          { status: 502 }
        ),
        correlationId
      )
    }

    // ✅ CORREÇÃO: Retornar 201 Created para criação de recurso
    return addCorrelationIdToResponse(
      NextResponse.json({
        success: true,
        data: {
          pageId: wordpressResponse.data.id,
          pageUrl: wordpressResponse.data.link,
          status: 'published'
        },
        message: 'Página Pressel criada com sucesso no WordPress'
      }, { status: 201 }),
      correlationId
    )

  } catch (error) {
    console.error('Erro ao criar página Pressel:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para enviar dados para WordPress
async function sendToWordPress({
  url,
  authType,
  credentials,
  data
}: {
  url: string
  authType: string
  credentials: any
  data: any
}) {
  try {
    // Simular chamada para API do WordPress
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Simular resposta do WordPress
    return {
      success: true,
      data: {
        id: Math.floor(Math.random() * 10000),
        link: `${url}/${data.page_slug}`,
        status: 'publish',
        title: data.page_title
      }
    }
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao conectar com WordPress'
    }
  }
}

// Função para testar conexão com WordPress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wordpressUrl = searchParams.get('url')
    const authType = searchParams.get('authType')
    const credentials = searchParams.get('credentials')

    if (!wordpressUrl) {
      return NextResponse.json(
        { error: 'URL do WordPress é obrigatória' },
        { status: 400 }
      )
    }

    // Simular teste de conexão
    await new Promise(resolve => setTimeout(resolve, 500))

    return NextResponse.json({
      success: true,
      message: 'Conexão com WordPress estabelecida com sucesso',
      data: {
        url: wordpressUrl,
        authType: authType || 'basic',
        status: 'connected'
      }
    })

  } catch (error) {
    console.error('Erro ao testar conexão:', error)
    return NextResponse.json(
      { error: 'Erro ao testar conexão com WordPress' },
      { status: 500 }
    )
  }
}

