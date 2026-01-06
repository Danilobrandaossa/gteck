import { NextRequest, NextResponse } from 'next/server'
import { chatGPTAgent } from '@/lib/chatgpt-agent'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { siteUrl, investigationType, focusAreas, priority, mode } = body

    if (!siteUrl) {
      return NextResponse.json({
        success: false,
        error: 'URL do site é obrigatória'
      }, { status: 400 })
    }

    const investigationRequest = {
      siteUrl,
      investigationType: investigationType || 'deep_analysis',
      focusAreas: focusAreas || [],
      priority: priority || 'medium'
    }

    let response
    if (mode === 'agent') {
      response = await chatGPTAgent.agentMode(investigationRequest)
    } else {
      response = await chatGPTAgent.investigate(investigationRequest)
    }

    return NextResponse.json({
      success: true,
      data: response,
      mode: mode || 'investigate',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na investigação:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
