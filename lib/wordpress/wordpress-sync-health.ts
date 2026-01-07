/**
 * WordPress Sync Health Service
 * FASE F.7 - Observabilidade + SLOs do Sync
 * 
 * Coleta métricas de saúde do sync WordPress
 */

import { db } from '@/lib/db'
// import {  } from '@/lib/observability/logger'

export interface WordPressSyncHealth {
  siteId: string
  organizationId: string
  lastFullSyncAt: Date | null
  lastIncrementalSyncAt: Date | null
  lastWebhookReceivedAt: Date | null
  pendingQueueJobs: number
  errorRate24h: number
  syncLagMs: number | null
  status: 'healthy' | 'warning' | 'critical'
  alerts: string[]
}

export class WordPressSyncHealthService {
  /**
   * Obter saúde do sync para um site
   */
  static async getSyncHealth(
    organizationId: string,
    siteId: string
  ): Promise<WordPressSyncHealth> {
    // Buscar site
    const site = await db.site.findUnique({
      where: { id: siteId },
      select: {
        organizationId: true,
        wpLastSyncAt: true,
        wpConfigured: true
      }
    })

    if (!site || site.organizationId !== organizationId) {
      throw new Error('Site not found or does not belong to organization')
    }

    if (!site.wpConfigured) {
      return {
        siteId,
        organizationId,
        lastFullSyncAt: null,
        lastIncrementalSyncAt: site.wpLastSyncAt,
        lastWebhookReceivedAt: null,
        pendingQueueJobs: 0,
        errorRate24h: 0,
        syncLagMs: null,
        status: 'warning',
        alerts: ['WordPress not configured']
      }
    }

    // Contar jobs pendentes
    const pendingJobs = await db.queueJob.count({
      where: {
        type: {
          in: [
            'wordpress_sync_terms',
            'wordpress_sync_media',
            'wordpress_sync_pages',
            'wordpress_sync_posts',
            'wp_sync_item_term',
            'wp_sync_item_media',
            'wp_sync_item_page',
            'wp_sync_item_post'
          ]
        },
        status: 'pending'
      }
    })

    // Calcular error rate (últimas 24h)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const totalJobs24h = await db.queueJob.count({
      where: {
        type: {
          in: [
            'wordpress_sync_terms',
            'wordpress_sync_media',
            'wordpress_sync_pages',
            'wordpress_sync_posts',
            'wp_sync_item_term',
            'wp_sync_item_media',
            'wp_sync_item_page',
            'wp_sync_item_post'
          ]
        },
        createdAt: {
          gte: last24h
        }
      }
    })

    const failedJobs24h = await db.queueJob.count({
      where: {
        type: {
          in: [
            'wordpress_sync_terms',
            'wordpress_sync_media',
            'wordpress_sync_pages',
            'wordpress_sync_posts',
            'wp_sync_item_term',
            'wp_sync_item_media',
            'wp_sync_item_page',
            'wp_sync_item_post'
          ]
        },
        status: 'failed',
        createdAt: {
          gte: last24h
        }
      }
    })

    const errorRate24h = totalJobs24h > 0 ? failedJobs24h / totalJobs24h : 0

    // Calcular sync lag (último sync vs agora)
    const syncLagMs = site.wpLastSyncAt
      ? Date.now() - site.wpLastSyncAt.getTime()
      : null

    // Determinar status e alertas
    const alerts: string[] = []
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'

    // Alerta: Sem webhook há muito tempo (se configurado)
    // Por enquanto, vamos apenas verificar sync lag

    // Alerta: Sync lag alto (> 1 hora)
    if (syncLagMs && syncLagMs > 60 * 60 * 1000) {
      alerts.push('WP_SYNC_LAG_HIGH')
      status = 'warning'
    }

    // Alerta: Error rate alto (> 10%)
    if (errorRate24h > 0.1) {
      alerts.push('WP_SYNC_ERROR_RATE_HIGH')
      status = errorRate24h > 0.3 ? 'critical' : 'warning'
    }

    // Alerta: Muitos jobs pendentes (> 50)
    if (pendingJobs > 50) {
      alerts.push('WP_SYNC_PENDING_JOBS_HIGH')
      status = pendingJobs > 100 ? 'critical' : 'warning'
    }

    return {
      siteId,
      organizationId,
      lastFullSyncAt: site.wpLastSyncAt, // Por enquanto, usar wpLastSyncAt para ambos
      lastIncrementalSyncAt: site.wpLastSyncAt,
      lastWebhookReceivedAt: null, // TODO: Adicionar campo ao Site
      pendingQueueJobs: pendingJobs,
      errorRate24h,
      syncLagMs,
      status,
      alerts
    }
  }

  /**
   * Obter saúde de todos os sites de uma organização
   */
  static async getOrganizationSyncHealth(
    organizationId: string
  ): Promise<WordPressSyncHealth[]> {
    const sites = await db.site.findMany({
      where: {
        organizationId,
        wpConfigured: true
      },
      select: {
        id: true
      }
    })

    const healthPromises = sites.map(site =>
      this.getSyncHealth(organizationId, site.id)
    )

    return Promise.all(healthPromises)
  }
}








