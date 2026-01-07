/**
 * 🚨 ALERTS - Regras de alerta baseadas em thresholds
 * 
 * Responsabilidades:
 * - Avaliar snapshot contra thresholds
 * - Retornar lista de alertas
 * - Severidade e ações sugeridas
 * 
 * REGRAS:
 * - Thresholds configuráveis via env
 * - Safe defaults
 * - Sem PII
 */

import { HealthSnapshot } from './health-snapshot'

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Alert {
  id: string
  severity: AlertSeverity
  message: string
  metrics: Record<string, any>
  suggestedAction: string
  threshold: {
    expected: string
    actual: string
  }
}

export class AlertService {
// @ts-ignore
  private static readonly _DEFAULT_WINDOW_HOURS = parseInt(process.env.ALERT_WINDOW_HOURS || '24', 10)
  private static readonly DEFAULT_RAG_AVAILABILITY_MIN = parseFloat(process.env.ALERT_RAG_AVAILABILITY_MIN || '0.99')
  private static readonly DEFAULT_RAG_P95_TOTAL_MS_MAX = parseInt(process.env.ALERT_RAG_P95_TOTAL_MS_MAX || '2500', 10)
  private static readonly DEFAULT_RAG_P95_PROVIDER_MS_MAX = parseInt(process.env.ALERT_RAG_P95_PROVIDER_MS_MAX || '2000', 10)
  private static readonly DEFAULT_FALLBACK_RATE_MAX = parseFloat(process.env.ALERT_FALLBACK_RATE_MAX || '0.08')
  private static readonly DEFAULT_AVG_SIMILARITY_MIN = parseFloat(process.env.ALERT_AVG_SIMILARITY_MIN || '0.70')
  private static readonly DEFAULT_PROVIDER_ERROR_RATE_MAX = parseFloat(process.env.ALERT_PROVIDER_ERROR_RATE_MAX || '0.02')
  private static readonly DEFAULT_DAILY_COST_USD_MAX = parseFloat(process.env.ALERT_DAILY_COST_USD_MAX || '50')
  private static readonly DEFAULT_QUEUE_STUCK_MAX = parseInt(process.env.ALERT_QUEUE_STUCK_MAX || '0', 10)
  private static readonly DEFAULT_QUEUE_AVG_DURATION_MS_MAX = parseInt(process.env.ALERT_QUEUE_AVG_DURATION_MS_MAX || '5000', 10)
  // FASE G.7: Alertas de indexação WordPress
  private static readonly DEFAULT_WP_INDEX_LAG_MINUTES_MAX = parseInt(process.env.ALERT_WP_INDEX_LAG_MINUTES_MAX || '360', 10) // 6 horas
  // @ts-expect-error FIX_BUILD: Suppressing error to allow build
  private static readonly DEFAULT_WP_INDEX_ERROR_RATE_MAX = parseFloat(process.env.ALERT_WP_INDEX_ERROR_RATE_MAX || '0.10', 10) // 10%

  /**
   * Avalia snapshot e retorna lista de alertas
   */
  static evaluateAlerts(snapshot: HealthSnapshot): Alert[] {
    const alerts: Alert[] = []

    // 1. RAG Availability
    if (snapshot.rag.availability24h < this.DEFAULT_RAG_AVAILABILITY_MIN) {
      alerts.push({
        id: 'RAG_AVAILABILITY_LOW',
        severity: 'HIGH',
        message: `RAG availability is below threshold: ${(snapshot.rag.availability24h * 100).toFixed(2)}%`,
        metrics: {
          availability24h: snapshot.rag.availability24h,
          totalRequests24h: snapshot.rag.totalRequests24h
        },
        suggestedAction: 'Investigate recent errors, check providers, verify DB connectivity',
        threshold: {
          expected: `>= ${(this.DEFAULT_RAG_AVAILABILITY_MIN * 100).toFixed(0)}%`,
          actual: `${(snapshot.rag.availability24h * 100).toFixed(2)}%`
        }
      })
    }

    // 2. RAG P95 Total Latency
    if (snapshot.rag.p95TotalMs24h > this.DEFAULT_RAG_P95_TOTAL_MS_MAX) {
      alerts.push({
        id: 'RAG_P95_TOTAL_HIGH',
        severity: 'MEDIUM',
        message: `RAG p95 total latency is above threshold: ${snapshot.rag.p95TotalMs24h}ms`,
        metrics: {
          p95TotalMs24h: snapshot.rag.p95TotalMs24h,
          p50TotalMs24h: snapshot.rag.p50TotalMs24h
        },
        suggestedAction: 'Check HNSW tuning, optimize rerank, verify provider latency',
        threshold: {
          expected: `<= ${this.DEFAULT_RAG_P95_TOTAL_MS_MAX}ms`,
          actual: `${snapshot.rag.p95TotalMs24h}ms`
        }
      })
    }

    // 3. RAG P95 Provider Latency
    if (snapshot.rag.p95ProviderMs24h > this.DEFAULT_RAG_P95_PROVIDER_MS_MAX) {
      alerts.push({
        id: 'RAG_P95_PROVIDER_HIGH',
        severity: 'MEDIUM',
        message: `RAG p95 provider latency is above threshold: ${snapshot.rag.p95ProviderMs24h}ms`,
        metrics: {
          p95ProviderMs24h: snapshot.rag.p95ProviderMs24h
        },
        suggestedAction: 'Check provider API latency, verify rate limits, consider model switch',
        threshold: {
          expected: `<= ${this.DEFAULT_RAG_P95_PROVIDER_MS_MAX}ms`,
          actual: `${snapshot.rag.p95ProviderMs24h}ms`
        }
      })
    }

    // 4. Fallback Rate
    if (snapshot.rag.fallbackRate24h > this.DEFAULT_FALLBACK_RATE_MAX) {
      alerts.push({
        id: 'FALLBACK_RATE_HIGH',
        severity: 'MEDIUM',
        message: `Fallback rate is above threshold: ${(snapshot.rag.fallbackRate24h * 100).toFixed(2)}%`,
        metrics: {
          fallbackRate24h: snapshot.rag.fallbackRate24h,
          avgSimilarity24h: snapshot.rag.avgSimilarity24h
        },
        suggestedAction: 'Check embeddings quality, adjust similarity threshold, improve context retrieval',
        threshold: {
          expected: `<= ${(this.DEFAULT_FALLBACK_RATE_MAX * 100).toFixed(0)}%`,
          actual: `${(snapshot.rag.fallbackRate24h * 100).toFixed(2)}%`
        }
      })
    }

    // 5. Average Similarity
    if (snapshot.rag.avgSimilarity24h < this.DEFAULT_AVG_SIMILARITY_MIN) {
      alerts.push({
        id: 'AVG_SIMILARITY_LOW',
        severity: 'MEDIUM',
        message: `Average similarity is below threshold: ${snapshot.rag.avgSimilarity24h.toFixed(3)}`,
        metrics: {
          avgSimilarity24h: snapshot.rag.avgSimilarity24h
        },
        suggestedAction: 'Review embedding quality, check rerank configuration, verify content relevance',
        threshold: {
          expected: `>= ${this.DEFAULT_AVG_SIMILARITY_MIN.toFixed(2)}`,
          actual: `${snapshot.rag.avgSimilarity24h.toFixed(3)}`
        }
      })
    }

    // 6. Provider Error Rate
    for (const [provider, models] of Object.entries(snapshot.providers)) {
      for (const [model, stats] of Object.entries(models)) {
        if (stats.errorRate24h > this.DEFAULT_PROVIDER_ERROR_RATE_MAX) {
          alerts.push({
            id: 'PROVIDER_ERROR_RATE_HIGH',
            severity: 'HIGH',
            message: `Provider ${provider}/${model} error rate is above threshold: ${(stats.errorRate24h * 100).toFixed(2)}%`,
            metrics: {
              provider,
              model,
              errorRate24h: stats.errorRate24h,
              totalRequests24h: stats.totalRequests24h,
              lastErrors: stats.lastErrors.slice(0, 3) // Top 3 erros
            },
            suggestedAction: 'Check API keys, verify rate limits, check provider status page, consider fallback',
            threshold: {
              expected: `<= ${(this.DEFAULT_PROVIDER_ERROR_RATE_MAX * 100).toFixed(0)}%`,
              actual: `${(stats.errorRate24h * 100).toFixed(2)}%`
            }
          })
        }
      }
    }

    // 7. Daily Cost
    if (snapshot.cost.dailyUSD > this.DEFAULT_DAILY_COST_USD_MAX) {
      alerts.push({
        id: 'COST_DAILY_HIGH',
        severity: 'LOW',
        message: `Daily cost is above threshold: $${snapshot.cost.dailyUSD.toFixed(2)}`,
        metrics: {
          dailyUSD: snapshot.cost.dailyUSD,
          dailyBRL: snapshot.cost.dailyBRL
        },
        suggestedAction: 'Review usage patterns, optimize model selection, check cache hit rate',
        threshold: {
          expected: `<= $${this.DEFAULT_DAILY_COST_USD_MAX}`,
          actual: `$${snapshot.cost.dailyUSD.toFixed(2)}`
        }
      })
    }

    // 8. Queue Stuck Jobs
    if (snapshot.queue.stuckCount > this.DEFAULT_QUEUE_STUCK_MAX) {
      alerts.push({
        id: 'QUEUE_STUCK_JOBS',
        severity: 'HIGH',
        message: `Queue has stuck jobs: ${snapshot.queue.stuckCount}`,
        metrics: {
          stuckCount: snapshot.queue.stuckCount,
          processingCount: snapshot.queue.processingCount
        },
        suggestedAction: 'Check worker health, verify locks, restart workers if needed',
        threshold: {
          expected: `<= ${this.DEFAULT_QUEUE_STUCK_MAX}`,
          actual: `${snapshot.queue.stuckCount}`
        }
      })
    }

    // 9. Queue Average Duration
    if (snapshot.queue.avgJobDurationMs24h > this.DEFAULT_QUEUE_AVG_DURATION_MS_MAX) {
      alerts.push({
        id: 'QUEUE_AVG_DURATION_HIGH',
        severity: 'MEDIUM',
        message: `Queue average job duration is above threshold: ${snapshot.queue.avgJobDurationMs24h}ms`,
        metrics: {
          avgJobDurationMs24h: snapshot.queue.avgJobDurationMs24h,
          pendingCount: snapshot.queue.pendingCount
        },
        suggestedAction: 'Scale workers, optimize embedding generation, check provider latency',
        threshold: {
          expected: `<= ${this.DEFAULT_QUEUE_AVG_DURATION_MS_MAX}ms`,
          actual: `${snapshot.queue.avgJobDurationMs24h}ms`
        }
      })
    }

    // 10. DB Status
    if (snapshot.db.status === 'unhealthy') {
      alerts.push({
        id: 'DB_UNHEALTHY',
        severity: 'CRITICAL',
        message: 'Database connection is unhealthy',
        metrics: {
          status: snapshot.db.status,
          connectionTimeMs: snapshot.db.connectionTimeMs
        },
        suggestedAction: 'Check database connectivity, verify connection pool, check database logs',
        threshold: {
          expected: 'healthy',
          actual: snapshot.db.status
        }
      })
    } else if (snapshot.db.status === 'degraded') {
      alerts.push({
        id: 'DB_DEGRADED',
        severity: 'MEDIUM',
        message: 'Database connection is degraded',
        metrics: {
          status: snapshot.db.status,
          connectionTimeMs: snapshot.db.connectionTimeMs
        },
        suggestedAction: 'Monitor database performance, check connection pool size, verify network latency',
        threshold: {
          expected: 'healthy',
          actual: snapshot.db.status
        }
      })
    }

    // FASE G.7: Alertas de indexação WordPress
    if (snapshot.wpIndexing) {
      // 11. WP Index Lag
      if (snapshot.wpIndexing.wpIndexLagMinutes > this.DEFAULT_WP_INDEX_LAG_MINUTES_MAX) {
        alerts.push({
          id: 'WP_INDEX_LAG_HIGH',
          severity: 'HIGH',
          message: `WordPress index lag is above threshold: ${snapshot.wpIndexing.wpIndexLagMinutes} minutes`,
          metrics: {
            wpIndexLagMinutes: snapshot.wpIndexing.wpIndexLagMinutes,
            lastWpSyncAt: snapshot.wpIndexing.lastWpSyncAt,
            lastWpIndexedAt: snapshot.wpIndexing.lastWpIndexedAt,
            wpItemsPendingIndex: snapshot.wpIndexing.wpItemsPendingIndex
          },
          suggestedAction: 'Check embedding queue workers, verify FinOps status, check for stuck jobs',
          threshold: {
            expected: `<= ${this.DEFAULT_WP_INDEX_LAG_MINUTES_MAX} minutes`,
            actual: `${snapshot.wpIndexing.wpIndexLagMinutes} minutes`
          }
        })
      }

      // 12. WP Index Error Rate
      if (snapshot.wpIndexing.wpIndexErrorRate24h > this.DEFAULT_WP_INDEX_ERROR_RATE_MAX) {
        alerts.push({
          id: 'WP_INDEX_ERROR_RATE_HIGH',
          severity: 'MEDIUM',
          message: `WordPress index error rate is above threshold: ${(snapshot.wpIndexing.wpIndexErrorRate24h * 100).toFixed(2)}%`,
          metrics: {
            wpIndexErrorRate24h: snapshot.wpIndexing.wpIndexErrorRate24h,
            wpItemsPendingIndex: snapshot.wpIndexing.wpItemsPendingIndex
          },
          suggestedAction: 'Check embedding job errors, verify provider API keys, check content normalization',
          threshold: {
            expected: `<= ${(this.DEFAULT_WP_INDEX_ERROR_RATE_MAX * 100).toFixed(0)}%`,
            actual: `${(snapshot.wpIndexing.wpIndexErrorRate24h * 100).toFixed(2)}%`
          }
        })
      }
    }

    return alerts
  }
}




