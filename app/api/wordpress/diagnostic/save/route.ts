import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const diagnostic = await request.json()
    
    console.log('📊 Salvando diagnóstico:', {
      data_execucao: diagnostic.data_execucao,
      site_url: diagnostic.site_url,
      resultado_keys: Object.keys(diagnostic.resultado || {})
    })

    // Por enquanto, apenas retornar sucesso sem salvar no banco
    // TODO: Implementar salvamento no banco quando necessário
    return NextResponse.json({
      success: true,
      message: 'Diagnóstico processado com sucesso',
      diagnostic: {
        id: 'temp-' + Date.now(),
        dataExecucao: new Date(diagnostic.data_execucao),
        resultado: diagnostic.resultado,
        siteUrl: diagnostic.site_url || 'N/A'
      }
    })

  } catch (error) {
    console.error('Erro ao processar diagnóstico:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Por enquanto, retornar lista vazia
    // TODO: Implementar busca no banco quando necessário
    return NextResponse.json({
      success: true,
      diagnostics: [],
      pagination: {
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false
      }
    })

  } catch (error) {
    console.error('Erro ao buscar diagnósticos:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
