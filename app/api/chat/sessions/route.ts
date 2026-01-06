/**
 * 💬 API ENDPOINT - Chat Sessions
 * 
 * GET /api/chat/sessions - Lista sessões
 * POST /api/chat/sessions - Cria nova sessão
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireTenantContext, validateUserSiteAccess } from '@/lib/tenant-security'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')
    const siteId = searchParams.get('siteId')
    const userId = searchParams.get('userId')

    // Validar contexto de tenant
    requireTenantContext(organizationId, siteId)

    // Validar acesso do usuário (se userId fornecido)
    if (userId) {
      const hasAccess = await validateUserSiteAccess(userId, siteId!)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'User does not have access to this site' },
          { status: 403 }
        )
      }
    }

    // Buscar sessões
    const sessions = await db.chatSession.findMany({
      where: {
        organizationId: organizationId!,
        siteId: siteId!,
        ...(userId ? { userId } : {})
      },
      orderBy: {
        lastMessageAt: 'desc'
      },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: sessions.map(s => ({
        id: s.id,
        title: s.title,
        organizationId: s.organizationId,
        siteId: s.siteId,
        userId: s.userId,
        metadata: s.metadata ? JSON.parse(s.metadata) : {},
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        lastMessageAt: s.lastMessageAt,
        messageCount: s._count.messages
      }))
    })

  } catch (error) {
    console.error('[API] Error listing chat sessions:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      siteId,
      userId,
      title,
      metadata
    } = body

    // Validar contexto de tenant
    requireTenantContext(organizationId, siteId)

    // Validar acesso do usuário (se userId fornecido)
    if (userId) {
      const hasAccess = await validateUserSiteAccess(userId, siteId)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'User does not have access to this site' },
          { status: 403 }
        )
      }
    }

    // Criar sessão
    const session = await db.chatSession.create({
      data: {
        organizationId,
        siteId,
        userId: userId || null,
        title: title || null,
        metadata: metadata ? JSON.stringify(metadata) : '{}'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: session.id,
        title: session.title,
        organizationId: session.organizationId,
        siteId: session.siteId,
        userId: session.userId,
        metadata: session.metadata ? JSON.parse(session.metadata) : {},
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        lastMessageAt: session.lastMessageAt
      }
    })

  } catch (error) {
    console.error('[API] Error creating chat session:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}









