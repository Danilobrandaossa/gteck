/**
 * 🔄 REINDEX INCREMENTAL - FASE 8 ETAPA 3
 * 
 * Reindexação incremental de conteúdo alterado
 */

import { db } from '../db'
import { EmbeddingService } from '../embedding-service'
import { TenantCostPolicyService } from '../finops/tenant-cost-policy'
import { StructuredLogger } from '../observability/logger'

const REINDEX_BATCH_LIMIT = parseInt(process.env.REINDEX_BATCH_LIMIT || '100', 10)
const REINDEX_MAX_PER_TENANT = parseInt(process.env.REINDEX_MAX_PER_TENANT || '50', 10)

export interface ReindexResult {
  queued: number
  skippedThrottled: number
  skippedBlocked: number
  byType: {
    page: number
    aiContent: number
    template: number
  }
  byTenant: Record<string, number>
  errors: Array<{
    type: string
    id: string
    error: string
  }>
}

export class ReindexIncrementalService {
  /**
   * Seleciona conteúdo que precisa ser reindexado
   */
  static async findContentNeedingReindex(limit: number = REINDEX_BATCH_LIMIT) {
    // Pages que precisam reindex
    const pages = await db.page.findMany({
      where: {
        OR: [
          // Nunca teve embedding
          {
            embeddings: {
              none: {}
            },
            embeddingChunks: {
              none: {}
            }
          },
          // Atualizado após último embedding (usando updatedAt como proxy)
          {
            updatedAt: {
              gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 dias
            }
          }
        ],
        published: true, // Apenas páginas publicadas
        deleted: false
      },
      select: {
        id: true,
        siteId: true,
        site: {
          select: {
            organizationId: true
          }
        },
        title: true,
        updatedAt: true
      },
      take: Math.floor(limit / 2), // Metade do limite para pages
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // AIContent que precisa reindex
    const aiContents = await db.aIContent.findMany({
      where: {
        OR: [
          {
            embeddings: {
              none: {}
            },
            embeddingChunks: {
              none: {}
            }
          },
          {
            updatedAt: {
              gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        ]
      },
      select: {
        id: true,
        siteId: true,
        site: {
          select: {
            organizationId: true
          }
        },
        title: true,
        updatedAt: true
      },
      take: Math.floor(limit / 4), // Um quarto do limite
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Templates que precisam reindex
    const templates = await db.template.findMany({
      where: {
        OR: [
          {
            embeddings: {
              none: {}
            },
            embeddingChunks: {
              none: {}
            }
          },
          {
            updatedAt: {
              gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        ]
      },
      select: {
        id: true,
        siteId: true,
        site: {
          select: {
            organizationId: true
          }
        },
        name: true,
        updatedAt: true
      },
      take: Math.floor(limit / 4), // Um quarto do limite
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return {
      pages: pages.map(p => ({
        id: p.id,
        type: 'page' as const,
        siteId: p.siteId,
        organizationId: p.site.organizationId,
        title: p.title,
        updatedAt: p.updatedAt
      })),
      aiContents: aiContents.map(c => ({
        id: c.id,
        type: 'ai_content' as const,
        siteId: c.siteId,
        organizationId: c.site.organizationId,
        title: c.title,
        updatedAt: c.updatedAt
      })),
      templates: templates.map(t => ({
        id: t.id,
        type: 'template' as const,
        siteId: t.siteId,
        organizationId: t.site.organizationId,
        title: t.name,
        updatedAt: t.updatedAt
      }))
    }
  }

  /**
   * Executa reindexação incremental
   */
  static async reindexIncremental(
    limit: number = REINDEX_BATCH_LIMIT,
    correlationId: string,
    logger: ReturnType<typeof StructuredLogger.withCorrelation>
  ): Promise<ReindexResult> {
    const result: ReindexResult = {
      queued: 0,
      skippedThrottled: 0,
      skippedBlocked: 0,
      byType: {
        page: 0,
        aiContent: 0,
        template: 0
      },
      byTenant: {},
      errors: []
    }

    try {
      // 1. Buscar conteúdo que precisa reindex
      const content = await this.findContentNeedingReindex(limit)
      const allItems = [...content.pages, ...content.aiContents, ...content.templates]

      logger.info('Found content needing reindex', {
        action: 'reindex_find_content',
        component: 'maintenance',
        totalItems: allItems.length,
        pages: content.pages.length,
        aiContents: content.aiContents.length,
        templates: content.templates.length
      })

      // 2. Agrupar por tenant e respeitar limite por tenant
      const byTenant = allItems.reduce((acc, item) => {
        const key = `${item.organizationId}:${item.siteId}`
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(item)
        return acc
      }, {} as Record<string, typeof allItems>)

      // 3. Processar cada tenant
      for (const [tenantKey, items] of Object.entries(byTenant)) {
        const [organizationId, siteId] = tenantKey.split(':')

        // Verificar estado de custo do tenant
        const costInfo = await TenantCostPolicyService.getTenantCostInfo(
          organizationId,
          siteId
        )

        // Se tenant está THROTTLED ou BLOCKED, pular reindex automático
        if (costInfo.state === 'THROTTLED') {
          result.skippedThrottled += items.length
          logger.warn('Skipping reindex for throttled tenant', {
            action: 'reindex_skip_throttled',
            component: 'maintenance',
            organizationId,
            siteId,
            skippedCount: items.length,
            costState: costInfo.state
          })
          continue
        }

        if (costInfo.state === 'BLOCKED') {
          result.skippedBlocked += items.length
          logger.warn('Skipping reindex for blocked tenant', {
            action: 'reindex_skip_blocked',
            component: 'maintenance',
            organizationId,
            siteId,
            skippedCount: items.length,
            costState: costInfo.state
          })
          continue
        }

        // Limitar por tenant
        const itemsToProcess = items.slice(0, REINDEX_MAX_PER_TENANT)

        // Enfileirar jobs de embedding
        for (const item of itemsToProcess) {
          try {
            await EmbeddingService.enqueueEmbeddingJob({
              sourceType: item.type,
              sourceId: item.id,
              organizationId,
              siteId,
              correlationId
            })

            result.queued++
            result.byType[item.type === 'ai_content' ? 'aiContent' : item.type]++
            result.byTenant[tenantKey] = (result.byTenant[tenantKey] || 0) + 1

            logger.info('Queued reindex job', {
              action: 'reindex_queue_job',
              component: 'maintenance',
              type: item.type,
              id: item.id,
              organizationId,
              siteId
            })
          } catch (error) {
            result.errors.push({
              type: item.type,
              id: item.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            })

            logger.error('Failed to queue reindex job', {
              action: 'reindex_queue_error',
              component: 'maintenance',
              type: item.type,
              id: item.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
      }

      return result
    } catch (error) {
      logger.error('Reindex incremental failed', {
        action: 'reindex_error',
        component: 'maintenance',
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      throw error
    }
  }
}








