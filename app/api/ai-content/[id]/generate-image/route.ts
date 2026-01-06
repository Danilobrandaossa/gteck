import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AIService } from '@/lib/ai-services'

// POST /api/ai-content/[id]/generate-image - Gerar imagem destacada
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const content = await db.aIContent.findUnique({
      where: { id: params.id }
    })

    if (!content) {
      return NextResponse.json(
        { error: 'Conteúdo não encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { prompt: customPrompt } = body

    // Criar prompt para imagem
    const imagePrompt = customPrompt || 
      `Fotografia profissional de pessoas ${content.title || 'realistas'}, estilo clean, realista, sem texto`

    // Obter API key
    const apiKey = process.env.OPENAI_API_KEY || ''
    
    if (!apiKey || apiKey.startsWith('sk-mock')) {
      return NextResponse.json(
        { error: 'OpenAI API key não configurada' },
        { status: 400 }
      )
    }

    // Configurar AIService
    const aiService = new AIService({
      id: 'image-generation',
      name: 'Image Generation Service',
      type: 'openai',
      status: 'active',
      credentials: {
        apiKey: apiKey,
        endpoint: 'https://api.openai.com/v1'
      },
      settings: {
        model: 'dall-e-3'
      },
      usage: { requests: 0, tokens: 0, cost: 0 },
      lastUsed: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Gerar imagem
    const result = await aiService.generateContent({
      prompt: imagePrompt,
      model: 'dall-e-3',
      type: 'image'
    })

    if (!result.success || !result.data?.images?.[0]?.url) {
      return NextResponse.json(
        { error: result.error || 'Erro ao gerar imagem' },
        { status: 500 }
      )
    }

    const imageUrl = result.data.images[0].url
    const revisedPrompt = result.data.images[0].revisedPrompt || imagePrompt

    // Atualizar conteúdo com imagem
    const updated = await db.aIContent.update({
      where: { id: params.id },
      data: {
        featuredImage: imageUrl,
        featuredImageAlt: revisedPrompt
      }
    })

    // Registrar histórico
    await db.aIContentHistory.create({
      data: {
        contentId: params.id,
        action: 'generate_image',
        prompt: imagePrompt,
        metadata: JSON.stringify({ imageUrl, revisedPrompt })
      }
    })

    return NextResponse.json({
      success: true,
      content: updated,
      imageUrl,
      revisedPrompt
    })
  } catch (error) {
    console.error('Erro ao gerar imagem:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar imagem', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

