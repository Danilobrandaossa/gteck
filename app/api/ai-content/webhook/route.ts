import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

// POST /api/ai-content/webhook - Webhook para receber atualizações do WordPress
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      apiKey, 
      contentId, 
      wordpressPostId, 
      wordpressUrl,
      status,
      signature 
    } = body

    if (!apiKey || !contentId) {
      return NextResponse.json(
        { error: 'apiKey e contentId são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar configuração do plugin
    const pluginConfig = await db.aIPluginConfig.findFirst({
      where: { apiKey }
    })

    if (!pluginConfig) {
      return NextResponse.json(
        { error: 'API key inválida' },
        { status: 401 }
      )
    }

    if (!pluginConfig.isActive) {
      return NextResponse.json(
        { error: 'Plugin inativo' },
        { status: 403 }
      )
    }

    // Validar assinatura HMAC se configurada
    if (pluginConfig.webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', pluginConfig.webhookSecret)
        .update(JSON.stringify({ contentId, wordpressPostId, wordpressUrl, status }))
        .digest('hex')
      
      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: 'Assinatura inválida' },
          { status: 401 }
        )
      }
    }

    // Buscar conteúdo
    const content = await db.aIContent.findUnique({
      where: { id: contentId }
    })

    if (!content) {
      return NextResponse.json(
        { error: 'Conteúdo não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se pertence ao site correto
    if (content.siteId !== pluginConfig.siteId) {
      return NextResponse.json(
        { error: 'Conteúdo não pertence ao site configurado' },
        { status: 403 }
      )
    }

    // Atualizar conteúdo
    const updateData: any = {}
    if (wordpressPostId !== undefined) updateData.wordpressPostId = wordpressPostId
    if (wordpressUrl !== undefined) updateData.wordpressUrl = wordpressUrl
    if (status === 'published') {
      updateData.status = 'published'
      updateData.publishedAt = new Date()
    } else if (status === 'draft') {
      updateData.status = 'draft'
    }

    const updated = await db.aIContent.update({
      where: { id: contentId },
      data: updateData
    })

    // Registrar histórico
    await db.aIContentHistory.create({
      data: {
        contentId: contentId,
        action: 'webhook_update',
        metadata: JSON.stringify({ wordpressPostId, wordpressUrl, status })
      }
    })

    return NextResponse.json({
      success: true,
      content: updated,
      message: 'Conteúdo atualizado via webhook'
    })
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}



