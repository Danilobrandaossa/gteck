/**
 * 🧹 CRON: EMBEDDING HOUSEKEEPING - FASE 8 ETAPA 3
 * 
 * Compactação/limpeza de embeddings antigos
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createCorrelationContext } from '@/lib/observability/correlation'
import { StructuredLogger } from '@/lib/observability/logger'
import crypto from 'crypto'

const CRON_SECRET = process.env.CRON_SECRET
const EMBEDDING_KEEP_INACTIVE_DAYS = parseInt(process.env.EMBEDDING_KEEP_INACTIVE_DAYS || '90', 10)

function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !CRON_SECRET) {
    return false
  }

  const token = authHeader.replace('Bearer ', '')
  return token === CRON_SECRET
}

export async function GET(request: NextRequest) {
  // 1. Validar autenticação
  if (!validateCronAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const startTime = Date.now()
  const correlationId = crypto.randomUUID()
  const correlationContext = createCorrelationContext(correlationId, '', '', '')
  const logger = StructuredLogger.withCorrelation(correlationContext, 'maintenance')

  logger.info('Embedding housekeeping started', {
    action: 'embedding_housekeeping_start',
    component: 'cron'
  })

  try {
    // 2. Contar embeddings inativos antigos (por tipo)
    const now = new Date()
    const retentionDate = new Date(now.getTime() - EMBEDDING_KEEP_INACTIVE_DAYS * 24 * 60 * 60 * 1000)

    // Chunks inativos
    const inactiveChunksCount = await db.embeddingChunk.count({
      where: {
        isActive: false,
        updatedAt: {
          lt: retentionDate
        }
      }
    })

    // Embeddings antigos (old model)
    const inactiveEmbeddingsCount = await db.embedding.count({
      where: {
        isActive: false,
        updatedAt: {
          lt: retentionDate
        }
      }
    })

    // 3. Por padrão, não deletar - apenas reportar
    // Se quiser deletar, descomentar:
    /*
    const deletedChunks = await db.embeddingChunk.deleteMany({
      where: {
        isActive: false,
        updatedAt: {
          lt: retentionDate
        }
      }
    })

    const deletedEmbeddings = await db.embedding.deleteMany({
      where: {
        isActive: false,
        updatedAt: {
          lt: retentionDate
        }
      }
    })
    */

    // 4. Estatísticas gerais
    const stats = {
      activeChunks: await db.embeddingChunk.count({
        where: { isActive: true }
      }),
      inactiveChunks: await db.embeddingChunk.count({
        where: { isActive: false }
      }),
      activeEmbeddings: await db.embedding.count({
        where: { isActive: true }
      }),
      inactiveEmbeddings: await db.embedding.count({
        where: { isActive: false }
      })
    }

    const durationMs = Date.now() - startTime

    logger.info('Embedding housekeeping completed', {
      action: 'embedding_housekeeping_complete',
      component: 'cron',
      inactiveChunksOld: inactiveChunksCount,
      inactiveEmbeddingsOld: inactiveEmbeddingsCount,
      durationMs
    })

    // 5. Retornar relatório
    return NextResponse.json({
      success: true,
      correlationId,
      type: 'embedding_housekeeping',
      timestamp: new Date().toISOString(),
      result: {
        inactiveChunksOldCount: inactiveChunksCount,
        inactiveEmbeddingsOldCount: inactiveEmbeddingsCount,
        deleted: 0, // Por padrão, não deletamos
        stats,
        durationMs
      },
      config: {
        keepInactiveDays: EMBEDDING_KEEP_INACTIVE_DAYS,
        deletionEnabled: false // Mudar para true se implementar deleção
      },
      note: 'Deletion is disabled by default. Set EMBEDDING_KEEP_INACTIVE_DAYS=0 to enable.'
    })
  } catch (error) {
    const durationMs = Date.now() - startTime

    logger.error('Embedding housekeeping failed', {
      action: 'embedding_housekeeping_error',
      component: 'cron',
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs
    })

    return NextResponse.json({
      success: false,
      correlationId,
      type: 'embedding_housekeeping',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      result: {
        inactiveChunksOldCount: 0,
        inactiveEmbeddingsOldCount: 0,
        deleted: 0,
        durationMs
      }
    }, { status: 500 })
  }
}








