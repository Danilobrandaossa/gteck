import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/lib/ai-services'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category, language } = body

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria é obrigatória' },
        { status: 400 }
      )
    }

    // Usar API key do ambiente
    const apiKey = process.env.OPENAI_API_KEY || ''
    
    // ✅ CORREÇÃO: Retornar erro em vez de mock
    if (!apiKey || apiKey.startsWith('sk-mock')) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key não configurada. Configure OPENAI_API_KEY no ambiente.',
        errorCode: 'API_KEY_NOT_CONFIGURED'
      }, { status: 500 })
    }

    // Configurar AIService
    const aiService = new AIService({
      id: 'topic-suggestion',
      name: 'Topic Suggestion Service',
      type: 'openai',
      status: 'active',
      credentials: {
        apiKey: apiKey,
        endpoint: 'https://api.openai.com/v1'
      },
      settings: {
        model: 'gpt-4',
        maxTokens: 500,
        temperature: 0.8
      },
      usage: { requests: 0, tokens: 0, cost: 0 },
      lastUsed: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Prompt para sugerir pauta
    const prompt = `Você é um especialista em criação de conteúdo digital. 
Com base na categoria "${category}" e no idioma "${language || 'pt-BR'}", 
sugira UMA pauta de artigo interessante e relevante que:
- Seja atrativa para o público-alvo dessa categoria
- Tenha potencial de engajamento
- Seja atual e relevante
- Tenha um título chamativo e otimizado para SEO (máximo 70 caracteres)

Responda APENAS com o título da pauta sugerida, sem explicações adicionais.`

    let result
    try {
      result = await aiService.generateContent({
        prompt,
        model: 'gpt-4',
        maxTokens: 500,
        temperature: 0.8,
        type: 'text'
      })
    } catch (apiError) {
      console.error('❌ Erro na chamada da API OpenAI:', apiError)
      // ✅ CORREÇÃO: Retornar erro em vez de mock
      return NextResponse.json({
        success: false,
        error: 'Erro ao chamar API OpenAI para sugerir pauta',
        errorDetails: apiError instanceof Error ? apiError.message : 'Erro desconhecido',
        errorCode: 'OPENAI_API_ERROR'
      }, { status: 500 })
    }

    if (!result.success || !result.data?.content) {
      // ✅ CORREÇÃO: Retornar erro em vez de mock
      return NextResponse.json({
        success: false,
        error: 'Falha ao gerar sugestão de pauta',
        errorDetails: result.error || 'Resposta da API não contém conteúdo',
        errorCode: 'TOPIC_SUGGESTION_FAILED'
      }, { status: 500 })
    }

    const suggestion = result.data.content.trim()

    return NextResponse.json({
      success: true,
      suggestion
    })
  } catch (error) {
    console.error('❌ Erro ao gerar sugestão de pauta:', error)
    // ✅ CORREÇÃO: Retornar erro em vez de mock
    return NextResponse.json({
      success: false,
      error: 'Erro interno ao gerar sugestão de pauta',
      errorDetails: error instanceof Error ? error.message : 'Erro desconhecido',
      errorCode: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}

