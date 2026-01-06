import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/ai-content - Listar conteúdos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const status = searchParams.get('status')

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId é obrigatório' },
        { status: 400 }
      )
    }

    const where: any = { siteId }
    if (status && status !== 'all') {
      where.status = status
    }

    const contents = await db.aIContent.findMany({
      where,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            url: true
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      contents
    })
  } catch (error) {
    console.error('Erro ao listar conteúdos:', error)
    return NextResponse.json(
      { error: 'Erro ao listar conteúdos', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}





