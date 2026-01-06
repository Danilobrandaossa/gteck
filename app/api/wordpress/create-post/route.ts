import { NextRequest, NextResponse } from 'next/server'
import { requireTenantContext, validateSiteBelongsToOrganization } from '@/lib/tenant-security'
import { StructuredLogger } from '@/lib/observability/logger'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'

export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('wordpress.create-post', correlationId)

  try {
    const { 
      title,
      content,
      status = 'draft',
      excerpt = '',
      categories = [],
      tags = [],
      featured_media = null,
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

    logger.info('Creating WordPress post', {
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

    console.log('🚀 Criando post no WordPress...', { title, status, wordpressUrl })

    // Preparar dados do post
    const postData = {
      title,
      content,
      status,
      excerpt,
      categories,
      tags,
      featured_media,
      meta: {
        acf_fields: acf_fields
      }
    }

    // Fazer requisição para o WordPress via proxy
    const response = await fetch('/api/wordpress/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `${wordpressUrl}/wp-json/wp/v2/posts`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`
        },
        data: postData
      })
    })

    const result = await response.json()
    
    if (!result.success) {
      logger.error('Error creating WordPress post', { error: result.error })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'Erro ao criar post no WordPress', details: result.error },
          { status: 500 }
        ),
        correlationId
      )
    }

    const createdPost = JSON.parse(result.data)
    
    logger.info('WordPress post created successfully', {
      postId: createdPost.id,
      title: createdPost.title.rendered,
      status: createdPost.status
    })

    // ✅ CORREÇÃO: Retornar 201 Created para criação de recurso
    return addCorrelationIdToResponse(
      NextResponse.json({
        success: true,
        data: {
          id: createdPost.id,
          title: createdPost.title.rendered,
          slug: createdPost.slug,
          link: createdPost.link,
          edit_link: createdPost._links?.self?.[0]?.href,
          status: createdPost.status,
          date: createdPost.date
        },
        message: 'Post criado com sucesso no WordPress!'
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

    logger.error('Error creating WordPress post', { 
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








