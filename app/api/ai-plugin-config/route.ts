import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

// GET /api/ai-plugin-config - Buscar configuração do plugin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId é obrigatório' },
        { status: 400 }
      )
    }

    let config = await db.aIPluginConfig.findUnique({
      where: { siteId }
    })

    // Se não existir, criar uma configuração padrão
    if (!config) {
      const apiKey = crypto.randomBytes(32).toString('hex')
      const webhookSecret = crypto.randomBytes(32).toString('hex')

      config = await db.aIPluginConfig.create({
        data: {
          siteId,
          apiKey,
          webhookSecret,
          isActive: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        siteId: config.siteId,
        apiKey: config.apiKey,
        webhookUrl: config.webhookUrl,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
        // Não retornar webhookSecret por segurança
      }
    })
  } catch (error) {
    console.error('Erro ao buscar configuração:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configuração', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

// POST /api/ai-plugin-config - Criar ou atualizar configuração
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { siteId, webhookUrl, isActive } = body

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se site existe
    const site = await db.site.findUnique({
      where: { id: siteId }
    })

    if (!site) {
      return NextResponse.json(
        { error: 'Site não encontrado' },
        { status: 404 }
      )
    }

    // Buscar configuração existente
    let config = await db.aIPluginConfig.findUnique({
      where: { siteId }
    })

    if (config) {
      // Atualizar
      config = await db.aIPluginConfig.update({
        where: { siteId },
        data: {
          webhookUrl: webhookUrl !== undefined ? webhookUrl : config.webhookUrl,
          isActive: isActive !== undefined ? isActive : config.isActive
        }
      })
    } else {
      // Criar nova configuração
      const apiKey = crypto.randomBytes(32).toString('hex')
      const webhookSecret = crypto.randomBytes(32).toString('hex')

      config = await db.aIPluginConfig.create({
        data: {
          siteId,
          apiKey,
          webhookSecret,
          webhookUrl: webhookUrl || null,
          isActive: isActive !== undefined ? isActive : true
        }
      })
    }

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        siteId: config.siteId,
        apiKey: config.apiKey,
        webhookUrl: config.webhookUrl,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      }
    })
  } catch (error) {
    console.error('Erro ao salvar configuração:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar configuração', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}



