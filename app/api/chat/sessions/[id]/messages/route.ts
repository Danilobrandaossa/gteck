/**
 * 💬 API ENDPOINT - Chat Messages
 * 
 * GET /api/chat/sessions/:id/messages - Lista mensagens de uma sessão
 * POST /api/chat/sessions/:id/messages - Cria nova mensagem
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireTenantContext, validateUserSiteAccess } from '@/lib/tenant-security'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')
    const siteId = searchParams.get('siteId')
    const userId = searchParams.get('userId')

    // Validar contexto de tenant
    requireTenantContext(organizationId, siteId)

    // Buscar sessão e validar acesso
    const session = await db.chatSession.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Validar que sessão pertence ao tenant
    if (session.organizationId !== organizationId || session.siteId !== siteId) {
      return NextResponse.json(
        { error: 'Session does not belong to this tenant' },
        { status: 403 }
      )
    }

    // Validar acesso do usuário (se userId fornecido e sessão tem userId)
    if (userId && session.userId && session.userId !== userId) {
      const hasAccess = await validateUserSiteAccess(userId, siteId!)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'User does not have access to this session' },
          { status: 403 }
        )
      }
    }

    // Buscar mensagens
    const messages = await db.chatMessage.findMany({
      where: {
        sessionId
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: messages.map((m: { id: string; sessionId: string; role: string; content: string; tokens: number | null; provider: string | null; model: string | null; aiInteractionId: string | null; ragSources: string | null; ragMetadata: string | null; createdAt: Date }) => ({
        id: m.id,
        sessionId: m.sessionId,
        role: m.role,
        content: m.content,
        tokens: m.tokens,
        provider: m.provider,
        model: m.model,
        aiInteractionId: m.aiInteractionId,
        ragSources: m.ragSources ? JSON.parse(m.ragSources) : [],
        ragMetadata: m.ragMetadata ? JSON.parse(m.ragMetadata) : {},
        createdAt: m.createdAt
      }))
    })

  } catch (error) {
    console.error('[API] Error listing chat messages:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id
    const body = await request.json()
    const {
      organizationId,
      siteId,
      userId,
      role,
      content,
      tokens,
      provider,
      model,
      aiInteractionId,
      ragSources,
      ragMetadata
    } = body

    // Validar contexto de tenant
    requireTenantContext(organizationId, siteId)

    // Validar role
    if (!['system', 'user', 'assistant'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be: system, user, or assistant' },
        { status: 400 }
      )
    }

    // Buscar sessão e validar acesso
    const session = await db.chatSession.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Validar que sessão pertence ao tenant
    if (session.organizationId !== organizationId || session.siteId !== siteId) {
      return NextResponse.json(
        { error: 'Session does not belong to this tenant' },
        { status: 403 }
      )
    }

    // Validar acesso do usuário (se userId fornecido e sessão tem userId)
    if (userId && session.userId && session.userId !== userId) {
      const hasAccess = await validateUserSiteAccess(userId, siteId)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'User does not have access to this session' },
          { status: 403 }
        )
      }
    }

    // Criar mensagem
    const message = await db.chatMessage.create({
      data: {
        sessionId,
        role,
        content,
        tokens: tokens || null,
        provider: provider || null,
        model: model || null,
        aiInteractionId: aiInteractionId || null,
        ragSources: ragSources ? JSON.stringify(ragSources) : '[]',
        ragMetadata: ragMetadata ? JSON.stringify(ragMetadata) : '{}'
      }
    })

    // Atualizar lastMessageAt da sessão
    await db.chatSession.update({
      where: { id: sessionId },
      data: {
        lastMessageAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        sessionId: message.sessionId,
        role: message.role,
        content: message.content,
        tokens: message.tokens,
        provider: message.provider,
        model: message.model,
        aiInteractionId: message.aiInteractionId,
        ragSources: message.ragSources ? JSON.parse(message.ragSources) : [],
        ragMetadata: message.ragMetadata ? JSON.parse(message.ragMetadata) : {},
        createdAt: message.createdAt
      }
    })

  } catch (error) {
    console.error('[API] Error creating chat message:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}









