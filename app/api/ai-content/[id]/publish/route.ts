import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/ai-content/[id]/publish - Publicar/Despublicar conteúdo
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const content = await db.aIContent.findUnique({
      where: { id: params.id },
      include: { site: true }
    })

    if (!content) {
      return NextResponse.json(
        { error: 'Conteúdo não encontrado' },
        { status: 404 }
      )
    }

    if (!content.content) {
      return NextResponse.json(
        { error: 'Conteúdo vazio. Não é possível publicar.' },
        { status: 400 }
      )
    }

    const isPublished = content.status === 'published'
    const newStatus = isPublished ? 'draft' : 'published'

    // Atualizar status
    const updated = await db.aIContent.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        publishedAt: isPublished ? null : new Date()
      }
    })

    // Registrar histórico
    await db.aIContentHistory.create({
      data: {
        contentId: params.id,
        action: isPublished ? 'unpublish' : 'publish',
        metadata: JSON.stringify({ status: newStatus })
      }
    })

    return NextResponse.json({
      success: true,
      content: updated,
      message: isPublished ? 'Conteúdo despublicado' : 'Conteúdo publicado'
    })
  } catch (error) {
    console.error('Erro ao publicar:', error)
    return NextResponse.json(
      { error: 'Erro ao publicar conteúdo', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
