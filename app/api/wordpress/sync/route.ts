import { NextRequest, NextResponse } from 'next/server'
import { WordPressService } from '@/lib/ai-services'

export async function POST(request: NextRequest) {
  try {
    const { 
      action,
      siteUrl,
      username,
      password,
      data 
    } = await request.json()

    if (!action || !siteUrl || !username || !password) {
      return NextResponse.json(
        { error: 'Ação, URL do site, usuário e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Simular configuração do WordPress
    const mockConfig = {
      id: '1',
      name: 'WordPress Site',
      type: 'wordpress' as const,
      status: 'active' as const,
      credentials: {
        endpoint: siteUrl,
        username,
        password
      },
      settings: {
        timeout: 30000,
        retries: 3
      },
      usage: {
        requests: 0,
        tokens: 0,
        cost: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const wpService = new WordPressService(mockConfig)

    let result

    switch (action) {
      case 'create_post':
        result = await wpService.createPost(data)
        break
      case 'upload_media':
        result = await wpService.uploadMedia(data.file, data.title, data.alt)
        break
      case 'create_acf_field':
        result = await wpService.createACFField(data)
        break
      case 'test_connection':
        const isConnected = await wpService.testConnection()
        result = {
          success: isConnected,
          data: { connected: isConnected }
        }
        break
      default:
        return NextResponse.json(
          { error: 'Ação não suportada' },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro na operação do WordPress' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `Operação ${action} executada com sucesso`
    })

  } catch (error) {
    console.error('Erro na API do WordPress:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteUrl = searchParams.get('url')
    const username = searchParams.get('username')
    const password = searchParams.get('password')

    if (!siteUrl || !username || !password) {
      return NextResponse.json(
        { error: 'URL do site, usuário e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Simular teste de conexão
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Simular resultado do teste
    const isConnected = Math.random() > 0.2 // 80% de chance de sucesso

    return NextResponse.json({
      success: isConnected,
      message: isConnected ? 'Conexão estabelecida com sucesso' : 'Falha na conexão',
      data: {
        url: siteUrl,
        connected: isConnected,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erro ao testar conexão WordPress:', error)
    return NextResponse.json(
      { error: 'Erro ao testar conexão' },
      { status: 500 }
    )
  }
}

