import { NextRequest, NextResponse } from 'next/server'
import { requireTenantContext, validateSiteBelongsToOrganization } from '@/lib/tenant-security'
import { StructuredLogger } from '@/lib/observability/logger'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'

export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('wordpress.create-page', correlationId)

  try {
    const { 
      title,
      content,
      status = 'draft',
      excerpt = '',
      template = 'default',
      parent = 0,
      menu_order = 0,
      acf_fields = {},
      wordpressUrl,
      username,
      password,
      organizationId,
      siteId
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

    logger.info('Creating WordPress page', {
      organizationId: tenantContext.organizationId,
      siteId: tenantContext.siteId,
      wordpressUrl,
      title
    })

    if (!title || !content || !wordpressUrl || !username || !password) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'Título, conteúdo, URL do WordPress e credenciais são obrigatórios' },
          { status: 400 }
        ),
        correlationId
      )
    }

    console.log('🚀 Criando página no WordPress...', { title, status, wordpressUrl })

    // Preparar dados da página
    const pageData = {
      title,
      content,
      status,
      excerpt,
      template,
      parent,
      menu_order,
      meta: {
        acf_fields: acf_fields
      }
    }

    // Fazer requisição para o WordPress via proxy
    const response = await fetch('/api/wordpress/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `${wordpressUrl}/wp-json/wp/v2/pages`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`
        },
        data: pageData
      })
    })

    const result = await response.json()
    
    if (!result.success) {
      logger.error('Error creating WordPress page', { error: result.error })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'Erro ao criar página no WordPress', details: result.error },
          { status: 500 }
        ),
        correlationId
      )
    }

    const createdPage = JSON.parse(result.data)
    
    logger.info('WordPress page created successfully', {
      pageId: createdPage.id,
      title: createdPage.title.rendered,
      status: createdPage.status
    })

    // ✅ CORREÇÃO: Retornar 201 Created para criação de recurso
    return addCorrelationIdToResponse(
      NextResponse.json({
        success: true,
        data: {
          id: createdPage.id,
          title: createdPage.title.rendered,
          slug: createdPage.slug,
          link: createdPage.link,
          edit_link: createdPage._links?.self?.[0]?.href,
          status: createdPage.status,
          template: createdPage.template,
          date: createdPage.date
        },
        message: 'Página criada com sucesso no WordPress!'
      }, { status: 201 }),
      correlationId
    )

  } catch (error) {
    if (error instanceof Error && error.message.includes('Tenant context required')) {
      logger.warn('Tenant validation failed in catch', { error: error.message })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { 
            error: 'organizationId e siteId são obrigatórios',
            errorCode: 'INVALID_TENANT_CONTEXT'
          },
          { status: 400 }
        ),
        correlationId
      )
    }

    logger.error('Error creating WordPress page', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return addCorrelationIdToResponse(
      NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      ),
      correlationId
    )
  }
}








