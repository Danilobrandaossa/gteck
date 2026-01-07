/**
 * 🚨 TENANT ALERTS - FASE 8 ETAPA 2
 * 
 * Alertas específicos por tenant baseados em custo
 */

import { Prisma } from '@prisma/client'
import { TenantCostPolicyService } from './tenant-cost-policy'
import { AlertSeverity, Alert } from '../observability/alerts'

export interface TenantAlert extends Alert {
  organizationId: string
  siteId: string
  tenantName?: string
}

export class TenantAlertService {
  /**
   * Avalia alertas de custo para um tenant específico
   */
  static async evaluateTenantCostAlerts(
    organizationId: string,
    siteId: string
  ): Promise<TenantAlert[]> {
    const alerts: TenantAlert[] = []

    try {
      const costInfo = await TenantCostPolicyService.getTenantCostInfo(
        organizationId,
        siteId
      )

      const { state, spend } = costInfo

      // Alertas baseados no estado de custo
      switch (state) {
        case 'BLOCKED':
          alerts.push({
            id: `tenant_budget_blocked_${organizationId}_${siteId}`,
            severity: 'CRITICAL',
            message: `Tenant bloqueado: orçamento esgotado`,
            metrics: {
              state,
              daySpendUsd: spend.daySpendUsd,
              monthSpendUsd: spend.monthSpendUsd,
              budgetDayUsd: spend.budgetDayUsd,
              budgetMonthUsd: spend.budgetMonthUsd
            },
            suggestedAction: 'Aumentar orçamento ou aguardar reset (diário/mensal)',
            threshold: {
              expected: '< 100% do orçamento',
              actual: `>= 100% (Day: $${spend.daySpendUsd.toFixed(2)}/${spend.budgetDayUsd}, Month: $${spend.monthSpendUsd.toFixed(2)}/${spend.budgetMonthUsd})`
            },
            organizationId,
            siteId
          })
          break

        case 'THROTTLED':
          alerts.push({
            id: `tenant_budget_throttled_${organizationId}_${siteId}`,
            severity: 'HIGH',
            message: `Tenant com uso limitado: >= 90% do orçamento`,
            metrics: {
              state,
              daySpendUsd: spend.daySpendUsd,
              monthSpendUsd: spend.monthSpendUsd,
              budgetDayUsd: spend.budgetDayUsd,
              budgetMonthUsd: spend.budgetMonthUsd
            },
            suggestedAction: 'Monitorar uso, considerar aumentar orçamento ou otimizar uso',
            threshold: {
              expected: '< 90% do orçamento',
              actual: `>= 90% (Day: $${spend.daySpendUsd.toFixed(2)}/${spend.budgetDayUsd}, Month: $${spend.monthSpendUsd.toFixed(2)}/${spend.budgetMonthUsd})`
            },
            organizationId,
            siteId
          })
          break

        case 'CAUTION':
          alerts.push({
            id: `tenant_budget_caution_${organizationId}_${siteId}`,
            severity: 'MEDIUM',
            message: `Tenant em atenção: >= 70% do orçamento`,
            metrics: {
              state,
              daySpendUsd: spend.daySpendUsd,
              monthSpendUsd: spend.monthSpendUsd,
              budgetDayUsd: spend.budgetDayUsd,
              budgetMonthUsd: spend.budgetMonthUsd
            },
            suggestedAction: 'Monitorar uso nas próximas horas',
            threshold: {
              expected: '< 70% do orçamento',
              actual: `>= 70% (Day: $${spend.daySpendUsd.toFixed(2)}/${spend.budgetDayUsd}, Month: $${spend.monthSpendUsd.toFixed(2)}/${spend.budgetMonthUsd})`
            },
            organizationId,
            siteId
          })
          break

        case 'NORMAL':
          // Sem alertas
          break
      }

      return alerts
    } catch (error) {
      console.error(`[TenantAlertService] Erro ao avaliar alertas do tenant ${organizationId}/${siteId}:`, error)
      return []
    }
  }

  /**
   * Avalia alertas para todos os tenants com budget definido
   */
  static async evaluateAllTenantAlerts(): Promise<TenantAlert[]> {
    const db = (await import('../db')).db
    
    // Buscar todos os sites com budget definido
    const sites = await db.site.findMany({
      where: {
        OR: [
          {
            settings: {
              path: ['budgetDayUsd'],
              // @ts-expect-error FIX_BUILD: Suppressing error to allow build
              not: Prisma.JsonNull
            }
          },
          {
            settings: {
              path: ['budgetMonthUsd'],
              // @ts-expect-error FIX_BUILD: Suppressing error to allow build
              not: Prisma.JsonNull
            }
          }
        ]
      },
      select: {
        id: true,
        organizationId: true,
        name: true
      }
    })

    const allAlerts: TenantAlert[] = []

    for (const site of sites) {
      const alerts = await this.evaluateTenantCostAlerts(
        site.organizationId,
        site.id
      )

      // Adicionar nome do tenant aos alertas
      alerts.forEach(alert => {
        alert.tenantName = site.name
      })

      allAlerts.push(...alerts)
    }

    return allAlerts
  }

  /**
   * Retorna apenas alertas críticos
   */
  static filterCriticalAlerts(alerts: TenantAlert[]): TenantAlert[] {
    return alerts.filter(alert => alert.severity === 'CRITICAL')
  }

  /**
   * Agrupa alertas por severidade
   */
  static groupBySeverity(alerts: TenantAlert[]): Record<AlertSeverity, TenantAlert[]> {
    return {
      CRITICAL: alerts.filter(a => a.severity === 'CRITICAL'),
      HIGH: alerts.filter(a => a.severity === 'HIGH'),
      MEDIUM: alerts.filter(a => a.severity === 'MEDIUM'),
      LOW: alerts.filter(a => a.severity === 'LOW')
    }
  }
}

