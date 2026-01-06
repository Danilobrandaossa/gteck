/**
 * 💰 TENANT COST API - FASE 8 ETAPA 2
 * 
 * Dashboard de custo por tenant
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TenantCostPolicyService } from '@/lib/finops/tenant-cost-policy'
import { TenantAlertService } from '@/lib/finops/tenant-alerts'

// Proteção de autenticação
const ADMIN_SECRET = process.env.ADMIN_HEALTH_SECRET

function validateAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !ADMIN_SECRET) {
    return false
  }

  const token = authHeader.replace('Bearer ', '')
  return token === ADMIN_SECRET
}

export async function GET(request: NextRequest) {
  // 1. Validar autenticação
  if (!validateAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // 2. Buscar todos os sites
    const sites = await db.site.findMany({
      select: {
        id: true,
        name: true,
        organizationId: true,
        settings: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // 3. Calcular custo e estado para cada tenant
    const tenants = await Promise.all(
      sites.map(async (site) => {
        const spend = await TenantCostPolicyService.getTenantSpend(
          site.organizationId,
          site.id
        )

        const state = TenantCostPolicyService.getCostState(spend)

        // Calcular tendência (últimos 7 dias - simplificado)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const recentInteractions = await db.aIInteraction.findMany({
          where: {
            organizationId: site.organizationId,
            siteId: site.id,
            createdAt: {
              gte: sevenDaysAgo
            },
            type: {
              in: ['rag_query', 'chat_message']
            }
          },
          select: {
            createdAt: true,
            costUSD: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        })

        // Agrupar por dia
        const dailyCosts: Record<string, number> = {}
        recentInteractions.forEach((interaction: { createdAt: Date; costUSD: number | null }) => {
          const day = interaction.createdAt.toISOString().split('T')[0]
          if (day) {
            dailyCosts[day] = (dailyCosts[day] || 0) + (interaction.costUSD || 0)
          }
        })

        const trend = Object.entries(dailyCosts).map(([date, cost]) => ({
          date,
          cost
        }))

        return {
          organizationId: site.organizationId,
          siteId: site.id,
          siteName: site.name,
          state,
          spend: {
            daySpendUsd: spend.daySpendUsd,
            monthSpendUsd: spend.monthSpendUsd,
            budgetDayUsd: spend.budgetDayUsd,
            budgetMonthUsd: spend.budgetMonthUsd
          },
          percentages: {
            day: spend.budgetDayUsd ? (spend.daySpendUsd / spend.budgetDayUsd) * 100 : 0,
            month: spend.budgetMonthUsd ? (spend.monthSpendUsd / spend.budgetMonthUsd) * 100 : 0
          },
          trend
        }
      })
    )

    // 4. Ordenar por custo (maior primeiro)
    const sortedTenants = tenants.sort((a, b) => b.spend.monthSpendUsd - a.spend.monthSpendUsd)

    // 5. Top 10
    const top10 = sortedTenants.slice(0, 10)

    // 6. Avaliar alertas
    const alerts = await TenantAlertService.evaluateAllTenantAlerts()

    // 7. Estatísticas gerais
    const stats = {
      totalTenants: tenants.length,
      normalTenants: tenants.filter(t => t.state === 'NORMAL').length,
      cautionTenants: tenants.filter(t => t.state === 'CAUTION').length,
      throttledTenants: tenants.filter(t => t.state === 'THROTTLED').length,
      blockedTenants: tenants.filter(t => t.state === 'BLOCKED').length,
      totalDaySpend: tenants.reduce((sum, t) => sum + t.spend.daySpendUsd, 0),
      totalMonthSpend: tenants.reduce((sum, t) => sum + t.spend.monthSpendUsd, 0),
      criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length,
      highAlerts: alerts.filter(a => a.severity === 'HIGH').length
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      stats,
      top10,
      alerts,
      allTenants: sortedTenants
    })
  } catch (error) {
    console.error('[TenantCostAPI] Erro:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}








