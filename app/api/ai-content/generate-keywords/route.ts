import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/lib/ai-services'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, language } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
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
      id: 'keyword-generation',
      name: 'Keyword Generation Service',
      type: 'openai',
      status: 'active',
      credentials: {
        apiKey: apiKey,
        endpoint: 'https://api.openai.com/v1'
      },
      settings: {
        model: 'gpt-4',
        maxTokens: 800,
        temperature: 0.7
      },
      usage: { requests: 0, tokens: 0, cost: 0 },
      lastUsed: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Prompt para gerar palavras-chave baseadas nos melhores artigos do Google
    const prompt = `Você é um especialista em SEO e análise de conteúdo. 
Analise o tema "${title}" e identifique as palavras-chave mais relevantes que aparecem nos 10 melhores artigos do Google para esse tema.

Considere:
- Palavras-chave principais e secundárias
- Termos relacionados e sinônimos
- Long-tail keywords (frases-chave mais específicas)
- Tendências de busca para o tema
- Idioma: ${language || 'pt-BR'}

Gere uma lista de 10 a 15 palavras-chave relevantes, separadas por vírgula, que sejam:
1. Altamente relevantes para o tema
2. Com boa intenção de busca
3. Otimizadas para SEO
4. Variadas (curtas, médias e long-tail)

Responda APENAS com as palavras-chave separadas por vírgula, sem numeração, sem explicações, sem citações. Exemplo: palavra1, palavra2, frase-chave longa, termo relacionado`

    let result
    try {
      result = await aiService.generateContent({
        prompt,
        model: 'gpt-4',
        maxTokens: 800,
        temperature: 0.7,
        type: 'text'
      })
    } catch (apiError) {
      console.error('❌ Erro na chamada da API OpenAI:', apiError)
      // ✅ CORREÇÃO: Retornar erro em vez de mock
      return NextResponse.json({
        success: false,
        error: 'Erro ao chamar API OpenAI para gerar palavras-chave',
        errorDetails: apiError instanceof Error ? apiError.message : 'Erro desconhecido',
        errorCode: 'OPENAI_API_ERROR'
      }, { status: 500 })
    }

    if (!result.success || !result.data?.content) {
      // ✅ CORREÇÃO: Retornar erro em vez de mock
      return NextResponse.json({
        success: false,
        error: 'Falha ao gerar palavras-chave',
        errorDetails: result.error || 'Resposta da API não contém conteúdo',
        errorCode: 'KEYWORD_GENERATION_FAILED'
      }, { status: 500 })
    }

    // Processar resposta e extrair palavras-chave
    const keywordsText = result.data.content.trim()
    const keywords = keywordsText
      .split(',')
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0)

    return NextResponse.json({
      success: true,
      keywords
    })
  } catch (error) {
    console.error('❌ Erro ao gerar palavras-chave:', error)
    // ✅ CORREÇÃO: Retornar erro em vez de mock
    return NextResponse.json({
      success: false,
      error: 'Erro interno ao gerar palavras-chave',
      errorDetails: error instanceof Error ? error.message : 'Erro desconhecido',
      errorCode: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}

