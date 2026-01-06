import { NextRequest, NextResponse } from 'next/server'

// Função para retry com backoff exponencial e tratamento inteligente de erros
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Tentativa ${attempt}/${maxRetries} para ${url}`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s timeout
      
      // Limpar URL de parâmetros problemáticos
      const cleanUrl = cleanWordPressUrl(url)
      
      const response = await fetch(cleanUrl, {
        ...options,
        signal: controller.signal,
        // Configurações adicionais para estabilidade
        keepalive: true,
        // Headers para melhor compatibilidade
        headers: {
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Accept': 'application/json',
          'User-Agent': 'CMS-Moderno/1.0 (WordPress Integration)',
          ...options.headers
        }
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        console.log(` Sucesso na tentativa ${attempt}`)
        return response
      } else {
        console.log(`⚠️ Status ${response.status} na tentativa ${attempt}`)
        
        // Para erros 400, tentar com parâmetros diferentes
        if (response.status === 400 && attempt < maxRetries) {
          console.log(`🔄 Tentando com parâmetros alternativos...`)
          const alternativeUrl = getAlternativeUrl(url)
          if (alternativeUrl !== url) {
            console.log(`🔄 URL alternativa: ${alternativeUrl}`)
            const altResponse = await fetch(alternativeUrl, {
              ...options,
              signal: controller.signal,
              keepalive: true,
              headers: {
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache',
                'Accept': 'application/json',
                'User-Agent': 'CMS-Moderno/1.0 (WordPress Integration)',
                ...options.headers
              }
            })
            
            if (altResponse.ok) {
              console.log(` Sucesso com URL alternativa`)
              return altResponse
            }
          }
        }
        
        if (attempt === maxRetries) {
          return response
        }
      }
    } catch (error) {
      console.log(` Erro na tentativa ${attempt}:`, error instanceof Error ? error.message : 'Erro desconhecido')
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Backoff exponencial: 2s, 4s, 8s
      const delay = Math.pow(2, attempt) * 1000
      console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error('Todas as tentativas falharam')
}

// Função para limpar URL do WordPress
function cleanWordPressUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    
    // Remover parâmetros problemáticos
    const params = new URLSearchParams(urlObj.search)
    
    // Limitar per_page para evitar timeouts
    if (params.get('per_page')) {
      const perPage = parseInt(params.get('per_page') || '10')
      if (perPage > 20) {
        params.set('per_page', '20')
      }
    }
    
    // Garantir que page seja válida
    if (params.get('page')) {
      const page = parseInt(params.get('page') || '1')
      if (page < 1) {
        params.set('page', '1')
      }
    }
    
    // Reconstruir URL
    urlObj.search = params.toString()
    return urlObj.toString()
  } catch (error) {
    console.log(`⚠️ Erro ao limpar URL: ${error}`)
    return url
  }
}

// Função para obter URL alternativa com parâmetros diferentes
function getAlternativeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const params = new URLSearchParams(urlObj.search)
    
    // Reduzir per_page se for muito alto
    if (params.get('per_page')) {
      const perPage = parseInt(params.get('per_page') || '10')
      if (perPage > 10) {
        params.set('per_page', '10')
      }
    }
    
    // Remover orderby se estiver causando problemas
    if (params.get('orderby') === 'date') {
      params.delete('orderby')
      params.delete('order')
    }
    
    // Reconstruir URL
    urlObj.search = params.toString()
    return urlObj.toString()
  } catch (error) {
    console.log(`⚠️ Erro ao criar URL alternativa: ${error}`)
    return url
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, method = 'GET', headers = {}, data } = body

    // Validar URL
    if (!url || !url.includes('wp-json')) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
    }

    // Configurar headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'CMS-Moderno/1.0',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      ...headers
    }

    console.log(` Iniciando requisição para: ${url}`)

    // Fazer requisição com retry
    const response = await fetchWithRetry(url, {
      method,
      headers: requestHeaders,
      body: data ? JSON.stringify(data) : undefined
    })

    const responseData = await response.text()
    
    console.log(` Resposta recebida: ${response.status} - ${responseData.length} bytes`)

    return NextResponse.json({
      success: true,
      data: responseData,
      status: response.status,
      statusText: response.statusText
    })

  } catch (error) {
    console.error(' Erro no proxy WordPress:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Falha ao conectar com WordPress',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CMS-Moderno/1.0'
      }
    })

    const data = await response.text()

    return NextResponse.json({
      success: true,
      data,
      status: response.status
    })

  } catch (error) {
    console.error('Erro no proxy GET:', error)
    return NextResponse.json({ 
      error: 'Erro ao conectar com WordPress',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

