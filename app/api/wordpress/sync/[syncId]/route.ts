/**
 * WordPress Sync Report Endpoint
 * FASE E.9 - Relatório Final do Sync
 * 
 * GET /api/wordpress/sync/[syncId]
 * 
 * Retorna relatório completo de uma sincronização
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'
import { StructuredLogger } from '@/lib/observability/logger'

export interface SyncReport {
  syncId: string
  siteId: string
  organizationId: string
  startedAt: Date
  finishedAt: Date | null
  status: 'queued' | 'processing' | 'completed' | 'failed'
  totals: {
    terms: number
    media: number
    pages: number
    posts: number
  }
  created: number
  updated: number
  skipped: number
  failed: number
  embeddingsQueued: number
  embeddingsSkipped: number
  durationMs: number | null
  jobs: Array<{
    jobId: string
    type: string
    status: string
    result?: any
    error?: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: { params: { syncId: string } }
) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = StructuredLogger.withCorrelation({ correlationId }, 'api')

  try {
    const { syncId } = params

    // Buscar todos os jobs desta sincronização
    const jobs = await db.queueJob.findMany({
      where: {
        type: {
          in: [
            'wordpress_sync_terms',
            'wordpress_sync_media',
            'wordpress_sync_pages',
            'wordpress_sync_posts'
          ]
        },
        data: {
          contains: syncId
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (jobs.length === 0) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          { success: false, error: 'Sync not found' },
          { status: 404 }
        ),
        correlationId
      )
    }

    // Parse do primeiro job para obter metadados
    const firstJob = jobs[0]

    if (!firstJob) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          {
            success: false,
            error: {
              code: "SYNC_NOT_FOUND",
              message: "Nenhum job encontrado para este syncId."
            }
          },
          { status: 404 }
        ),
        correlationId
      )
    }

    const firstJobData = JSON.parse(firstJob.data)
    const { siteId, organizationId } = firstJobData

    // Calcular totais
    const totals = {
      terms: 0,
      media: 0,
      pages: 0,
      posts: 0
    }

    let created = 0
    let updated = 0
    let skipped = 0
    let failed = 0
    let embeddingsQueued = 0
    let embeddingsSkipped = 0

    const jobReports: SyncReport['jobs'] = []

    for (const job of jobs) {
      const jobData = JSON.parse(job.data)
      const entityType = jobData.entityType

      // Contar por tipo
      if (entityType === 'terms') totals.terms++
      else if (entityType === 'media') totals.media++
      else if (entityType === 'pages') totals.pages++
      else if (entityType === 'posts') totals.posts++

      // Processar resultado se houver
      if (job.result) {
        try {
          const result = JSON.parse(job.result)
          created += result.created || 0
          updated += result.updated || 0
          skipped += result.skipped || 0
          failed += result.failed || 0
          embeddingsQueued += result.embeddingsQueued || 0
          embeddingsSkipped += result.embeddingsSkipped || 0
        } catch (error) {
          // Ignorar erro de parse
        }
      }

      jobReports.push({
        jobId: job.id,
        type: job.type,
        status: job.status,
        result: job.result ? JSON.parse(job.result) : undefined,
        error: job.error || undefined
      })
    }

    // Determinar status geral
    const allCompleted = jobs.every(j => j.status === 'completed')
    const anyFailed = jobs.some(j => j.status === 'failed')
    const anyProcessing = jobs.some(j => j.status === 'processing')

    let status: SyncReport['status'] = 'queued'
    if (allCompleted) status = 'completed'
    else if (anyFailed) status = 'failed'
    else if (anyProcessing) status = 'processing'

    // Calcular timestamps
    const startedAt = firstJob.createdAt
    const lastJob = jobs[jobs.length - 1]
    
    // ✅ CORREÇÃO: Guard clause para lastJob
    if (!lastJob) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          { success: false, error: 'Sync jobs not found' },
          { status: 404 }
        ),
        correlationId
      )
    }
    
    const finishedAt = lastJob.processedAt || (status === 'completed' ? lastJob.updatedAt : null)
    const durationMs = finishedAt ? finishedAt.getTime() - startedAt.getTime() : null

    const report: SyncReport = {
      syncId,
      siteId,
      organizationId,
      startedAt,
      finishedAt,
      status,
      totals,
      created,
      updated,
      skipped,
      failed,
      embeddingsQueued,
      embeddingsSkipped,
      durationMs,
      jobs: jobReports
    }

    logger.info('Sync report generated', {
      action: 'wp_sync_report',
      syncId,
      status,
      totals
    })

    return addCorrelationIdToResponse(NextResponse.json(report), correlationId)
  } catch (error) {
    logger.error('Error generating sync report', {
      action: 'wp_sync_report',
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return addCorrelationIdToResponse(
      NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      ),
      correlationId
    )
  }
}







