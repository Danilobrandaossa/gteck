import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { jsonData, wpUrl, username, password } = await request.json()

    if (!jsonData || !wpUrl || !username || !password) {
      return NextResponse.json(
        { error: 'jsonData, wpUrl, username e password são obrigatórios' },
        { status: 400 }
      )
    }

    const endpoint = `${wpUrl.replace(/\/$/, '')}/wp-json/pressel-automation-v2/v1/publish`
    const auth = Buffer.from(`${username}:${password}`).toString('base64')

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'CMS-Moderno/1.0',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(jsonData)
    })

    const data = await response.json()

    if (!response.ok) {
      logger.error('Erro ao publicar no WordPress', undefined, {
        status: response.status,
        error: data.error || data.message,
        code: data.code
      })
      return NextResponse.json(
        { error: data.error || data.message || 'Erro ao publicar', code: data.code },
        { status: response.status }
      )
    }

    logger.info('Página publicada com sucesso', { wpUrl, postId: data.data?.post_id })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('Erro ao publicar no WordPress', error instanceof Error ? error : new Error(String(error)), {
      wpUrl: request.body ? 'presente' : 'ausente'
    })
    return NextResponse.json(
      { error: 'Erro ao conectar com WordPress', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

