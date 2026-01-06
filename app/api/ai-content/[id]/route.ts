import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireTenantContext } from '@/lib/tenant-security'
import { StructuredLogger } from '@/lib/observability/logger'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'

// GET /api/ai-content/[id] - Buscar conteúdo por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('ai-content.get', correlationId)

  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')
    const siteId = searchParams.get('siteId')

    // ✅ CORREÇÃO ALTA: Validar contexto de tenant
    let tenantContext
    try {
      tenantContext = requireTenantContext(organizationId, siteId)
    } catch (error) {
      logger.warn('Tenant validation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'organizationId e siteId são obrigatórios (query params)', errorCode: 'INVALID_TENANT_CONTEXT' },
          { status: 400 }
        ),
        correlationId
      )
    }

    logger.info('Fetching AI content', {
      organizationId: tenantContext.organizationId,
      siteId: tenantContext.siteId,
      contentId: params.id
    })

    const content = await db.aIContent.findUnique({
      where: { id: params.id },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            url: true,
            organizationId: true
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!content) {
      logger.warn('Content not found', { contentId: params.id })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'Conteúdo não encontrado' },
          { status: 404 }
        ),
        correlationId
      )
    }

    // ✅ CORREÇÃO ALTA: Validar ownership do conteúdo
    if (content.siteId !== siteId || content.organizationId !== organizationId) {
      logger.warn('Content ownership mismatch', {
        contentSiteId: content.siteId,
        contentOrganizationId: content.organizationId,
        requestedSiteId: siteId,
        requestedOrganizationId: organizationId
      })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'Conteúdo não pertence ao tenant especificado', errorCode: 'CONTENT_OWNERSHIP_MISMATCH' },
          { status: 403 }
        ),
        correlationId
      )
    }

    return addCorrelationIdToResponse(
      NextResponse.json({
        success: true,
        content
      }),
      correlationId
    )
  } catch (error) {
    logger.error('Error fetching AI content', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return addCorrelationIdToResponse(
      NextResponse.json(
        { error: 'Erro ao buscar conteúdo', details: error instanceof Error ? error.message : 'Erro desconhecido' },
        { status: 500 }
      ),
      correlationId
    )
  }
}

// PATCH /api/ai-content/[id] - Atualizar conteúdo
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('ai-content.patch', correlationId)

  try {
    const body = await request.json()
    const { 
      title, 
      slug,
      excerpt, 
      content,
      tags,
      featuredImage,
      featuredImageAlt,
      metaDescription,
      keywords,
      secondaryKeywords,
      additionalInstructions,
      organizationId,
      siteId
    } = body

    // ✅ CORREÇÃO ALTA: Validar contexto de tenant
    let tenantContext
    try {
      tenantContext = requireTenantContext(organizationId, siteId)
    } catch (error) {
      logger.warn('Tenant validation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'organizationId e siteId são obrigatórios', errorCode: 'INVALID_TENANT_CONTEXT' },
          { status: 400 }
        ),
        correlationId
      )
    }

    // ✅ CORREÇÃO ALTA: Validar ownership do conteúdo antes de atualizar
    const existingContent = await db.aIContent.findUnique({
      where: { id: params.id },
      select: { siteId: true, organizationId: true }
    })

    if (!existingContent) {
      logger.warn('Content not found for update', { contentId: params.id })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'Conteúdo não encontrado' },
          { status: 404 }
        ),
        correlationId
      )
    }

    if (existingContent.siteId !== siteId || existingContent.organizationId !== organizationId) {
      logger.warn('Content ownership mismatch on update', {
        contentSiteId: existingContent.siteId,
        contentOrganizationId: existingContent.organizationId,
        requestedSiteId: siteId,
        requestedOrganizationId: organizationId
      })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'Conteúdo não pertence ao tenant especificado', errorCode: 'CONTENT_OWNERSHIP_MISMATCH' },
          { status: 403 }
        ),
        correlationId
      )
    }

    logger.info('Updating AI content', {
      organizationId: tenantContext.organizationId,
      siteId: tenantContext.siteId,
      contentId: params.id
    })

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (content !== undefined) {
      updateData.content = content
      updateData.wordCount = content ? content.split(/\s+/).filter((word: string) => word.length > 0).length : null
    }
    if (tags !== undefined) updateData.tags = tags
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage
    if (featuredImageAlt !== undefined) updateData.featuredImageAlt = featuredImageAlt
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription
    if (keywords !== undefined) updateData.keywords = keywords
    if (secondaryKeywords !== undefined) updateData.secondaryKeywords = secondaryKeywords
    if (additionalInstructions !== undefined) updateData.additionalInstructions = additionalInstructions

    const updated = await db.aIContent.update({
      where: { id: params.id },
      data: updateData
    })

    // Registrar histórico
    await db.aIContentHistory.create({
      data: {
        contentId: params.id,
        action: 'edit',
        metadata: JSON.stringify({ title, excerpt, hasContent: !!content })
      }
    })

    return NextResponse.json({
      success: true,
      content: updated
    })
  } catch (error) {
    console.error('Erro ao atualizar conteúdo:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar conteúdo', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

// DELETE /api/ai-content/[id] - Deletar conteúdo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('ai-content.delete', correlationId)

  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')
    const siteId = searchParams.get('siteId')

    // ✅ CORREÇÃO ALTA: Validar contexto de tenant
    let tenantContext
    try {
      tenantContext = requireTenantContext(organizationId, siteId)
    } catch (error) {
      logger.warn('Tenant validation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'organizationId e siteId são obrigatórios (query params)', errorCode: 'INVALID_TENANT_CONTEXT' },
          { status: 400 }
        ),
        correlationId
      )
    }

    // ✅ CORREÇÃO ALTA: Validar ownership do conteúdo antes de deletar
    const existingContent = await db.aIContent.findUnique({
      where: { id: params.id },
      select: { siteId: true, organizationId: true }
    })

    if (!existingContent) {
      logger.warn('Content not found for deletion', { contentId: params.id })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'Conteúdo não encontrado' },
          { status: 404 }
        ),
        correlationId
      )
    }

    if (existingContent.siteId !== siteId || existingContent.organizationId !== organizationId) {
      logger.warn('Content ownership mismatch on deletion', {
        contentSiteId: existingContent.siteId,
        contentOrganizationId: existingContent.organizationId,
        requestedSiteId: siteId,
        requestedOrganizationId: organizationId
      })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'Conteúdo não pertence ao tenant especificado', errorCode: 'CONTENT_OWNERSHIP_MISMATCH' },
          { status: 403 }
        ),
        correlationId
      )
    }

    logger.info('Deleting AI content', {
      organizationId: tenantContext.organizationId,
      siteId: tenantContext.siteId,
      contentId: params.id
    })

    await db.aIContent.delete({
      where: { id: params.id }
    })

    logger.info('AI content deleted successfully', { contentId: params.id })

    return addCorrelationIdToResponse(
      NextResponse.json({
        success: true,
        message: 'Conteúdo deletado com sucesso'
      }, { status: 204 }),
      correlationId
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes('Tenant context required')) {
      logger.warn('Tenant validation failed in catch', { error: error.message })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'organizationId e siteId são obrigatórios', errorCode: 'INVALID_TENANT_CONTEXT' },
          { status: 400 }
        ),
        correlationId
      )
    }

    logger.error('Error deleting AI content', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return addCorrelationIdToResponse(
      NextResponse.json(
        { error: 'Erro ao deletar conteúdo', details: error instanceof Error ? error.message : 'Erro desconhecido' },
        { status: 500 }
      ),
      correlationId
    )
  }
}
