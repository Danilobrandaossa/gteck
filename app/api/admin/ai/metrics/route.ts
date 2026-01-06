/**
 * 📊 API ENDPOINT - Métricas de IA (Admin)
 * 
 * GET /api/admin/ai/metrics
 * Query params:
 *   period: 'day' | 'week' | 'month'
 *   organizationId?: string
 *   siteId?: string
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'day'
    const organizationId = searchParams.get('organizationId')
    const siteId = searchParams.get('siteId')

    // Calcular período
    const periodStart = new Date()
    switch (period) {
      case 'day':
        periodStart.setDate(periodStart.getDate() - 1)
        break
      case 'week':
        periodStart.setDate(periodStart.getDate() - 7)
        break
      case 'month':
        periodStart.setMonth(periodStart.getMonth() - 1)
        break
    }

    // Construir filtros
    const filters: Prisma.Sql[] = [Prisma.sql`created_at >= ${periodStart}`]
    
    if (organizationId) {
      filters.push(Prisma.sql`organization_id = ${organizationId}`)
    }
    
    if (siteId) {
      filters.push(Prisma.sql`site_id = ${siteId}`)
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}`

    // Métricas gerais
    const metricsQuery = Prisma.sql`
      SELECT 
        COALESCE(SUM(cost_usd), 0) as total_cost_usd,
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_requests,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_requests,
        COUNT(*) FILTER (WHERE rag_used = true AND rag_chunks_count = 0)::float / NULLIF(COUNT(*) FILTER (WHERE rag_used = true), 0) as fallback_rate,
        AVG(rag_similarity_threshold) FILTER (WHERE rag_used = true) as avg_similarity,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) FILTER (WHERE duration_ms IS NOT NULL) as p50_latency,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) FILTER (WHERE duration_ms IS NOT NULL) as p95_latency
      FROM ai_interactions
      ${whereClause}
    `

    const metricsResult = await db.$queryRaw<Array<{
      total_cost_usd: number
      total_requests: bigint
      successful_requests: bigint
      failed_requests: bigint
      fallback_rate: number
      avg_similarity: number
      p50_latency: number
      p95_latency: number
    }>>(metricsQuery)

    const metrics = metricsResult[0] || {
      total_cost_usd: 0,
      total_requests: 0n,
      successful_requests: 0n,
      failed_requests: 0n,
      fallback_rate: 0,
      avg_similarity: 0,
      p50_latency: 0,
      p95_latency: 0
    }

    // Por provider
    const byProviderQuery = Prisma.sql`
      SELECT 
        provider,
        COALESCE(SUM(cost_usd), 0) as cost_usd,
        COUNT(*) as requests
      FROM ai_interactions
      ${whereClause}
      GROUP BY provider
      ORDER BY cost_usd DESC
    `

    const byProvider = await db.$queryRaw<Array<{
      provider: string
      cost_usd: number
      requests: bigint
    }>>(byProviderQuery)

    // Por modelo
    const byModelQuery = Prisma.sql`
      SELECT 
        model,
        COALESCE(SUM(cost_usd), 0) as cost_usd,
        COUNT(*) as requests
      FROM ai_interactions
      ${whereClause}
      GROUP BY model
      ORDER BY cost_usd DESC
      LIMIT 10
    `

    const byModel = await db.$queryRaw<Array<{
      model: string
      cost_usd: number
      requests: bigint
    }>>(byModelQuery)

    return NextResponse.json({
      success: true,
      data: {
        totalCostUSD: parseFloat(metrics.total_cost_usd?.toString() || '0'),
        totalCostBRL: parseFloat(metrics.total_cost_usd?.toString() || '0') * 5, // Taxa aproximada
        totalRequests: Number(metrics.total_requests || 0),
        successfulRequests: Number(metrics.successful_requests || 0),
        failedRequests: Number(metrics.failed_requests || 0),
        fallbackRate: parseFloat(metrics.fallback_rate?.toString() || '0'),
        averageSimilarity: parseFloat(metrics.avg_similarity?.toString() || '0'),
        p50Latency: Math.round(parseFloat(metrics.p50_latency?.toString() || '0')),
        p95Latency: Math.round(parseFloat(metrics.p95_latency?.toString() || '0')),
        byProvider: byProvider.map(item => ({
          provider: item.provider,
          costUSD: parseFloat(item.cost_usd?.toString() || '0'),
          requests: Number(item.requests || 0)
        })),
        byModel: byModel.map(item => ({
          model: item.model,
          costUSD: parseFloat(item.cost_usd?.toString() || '0'),
          requests: Number(item.requests || 0)
        }))
      }
    })

  } catch (error) {
    console.error('[API] Error loading AI metrics:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}









