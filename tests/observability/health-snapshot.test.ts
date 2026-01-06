/**
 * 🧪 TESTES - Health Snapshot (FASE 7 ETAPA 6)
 * 
 * Testes obrigatórios para health snapshot e alertas
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { HealthSnapshotService } from '@/lib/observability/health-snapshot'
import { AlertService } from '@/lib/observability/alerts'

describe('HealthSnapshotService', () => {
  describe('generateSnapshot', () => {
    it('deve retornar snapshot com estrutura correta', async () => {
      const snapshot = await HealthSnapshotService.generateSnapshot(24)

      expect(snapshot).toHaveProperty('timestamp')
      expect(snapshot).toHaveProperty('windowHours', 24)
      expect(snapshot).toHaveProperty('rag')
      expect(snapshot).toHaveProperty('providers')
      expect(snapshot).toHaveProperty('queue')
      expect(snapshot).toHaveProperty('db')
      expect(snapshot).toHaveProperty('cost')
    })

    it('deve retornar métricas RAG com valores coerentes', async () => {
      const snapshot = await HealthSnapshotService.generateSnapshot(24)

      // Disponibilidade deve estar entre 0 e 1
      expect(snapshot.rag.availability24h).toBeGreaterThanOrEqual(0)
      expect(snapshot.rag.availability24h).toBeLessThanOrEqual(1)

      // Taxas devem estar entre 0 e 1
      expect(snapshot.rag.fallbackRate24h).toBeGreaterThanOrEqual(0)
      expect(snapshot.rag.fallbackRate24h).toBeLessThanOrEqual(1)

      expect(snapshot.rag.errorRate24h).toBeGreaterThanOrEqual(0)
      expect(snapshot.rag.errorRate24h).toBeLessThanOrEqual(1)

      // Latências devem ser >= 0
      expect(snapshot.rag.p50TotalMs24h).toBeGreaterThanOrEqual(0)
      expect(snapshot.rag.p95TotalMs24h).toBeGreaterThanOrEqual(0)
      expect(snapshot.rag.p95ProviderMs24h).toBeGreaterThanOrEqual(0)

      // Similaridade deve estar entre 0 e 1
      expect(snapshot.rag.avgSimilarity24h).toBeGreaterThanOrEqual(0)
      expect(snapshot.rag.avgSimilarity24h).toBeLessThanOrEqual(1)
    })

    it('deve retornar métricas de queue com valores coerentes', async () => {
      const snapshot = await HealthSnapshotService.generateSnapshot(24)

      expect(snapshot.queue.pendingCount).toBeGreaterThanOrEqual(0)
      expect(snapshot.queue.processingCount).toBeGreaterThanOrEqual(0)
      expect(snapshot.queue.failedCount).toBeGreaterThanOrEqual(0)
      expect(snapshot.queue.stuckCount).toBeGreaterThanOrEqual(0)
      expect(snapshot.queue.avgJobDurationMs24h).toBeGreaterThanOrEqual(0)
    })

    it('deve retornar status DB válido', async () => {
      const snapshot = await HealthSnapshotService.generateSnapshot(24)

      expect(['healthy', 'degraded', 'unhealthy']).toContain(snapshot.db.status)
    })
  })
})

describe('AlertService', () => {
  describe('evaluateAlerts', () => {
    it('deve retornar lista de alertas quando thresholds são violados', () => {
      const snapshot: any = {
        timestamp: new Date().toISOString(),
        windowHours: 24,
        rag: {
          availability24h: 0.95, // < 0.99
          p95TotalMs24h: 3000, // > 2500
          p95ProviderMs24h: 2500, // > 2000
          fallbackRate24h: 0.10, // > 0.08
          avgSimilarity24h: 0.65, // < 0.70
          errorRate24h: 0.01,
          totalRequests24h: 100
        },
        providers: {},
        queue: {
          pendingCount: 0,
          processingCount: 0,
          failedCount: 0,
          stuckCount: 0,
          avgJobDurationMs24h: 0
        },
        db: {
          status: 'healthy'
        },
        cost: {
          dailyUSD: 0,
          dailyBRL: 0
        }
      }

      const alerts = AlertService.evaluateAlerts(snapshot)

      expect(alerts.length).toBeGreaterThan(0)
      
      // Verificar que alertas têm estrutura correta
      alerts.forEach(alert => {
        expect(alert).toHaveProperty('id')
        expect(alert).toHaveProperty('severity')
        expect(alert).toHaveProperty('message')
        expect(alert).toHaveProperty('metrics')
        expect(alert).toHaveProperty('suggestedAction')
        expect(alert).toHaveProperty('threshold')
        expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(alert.severity)
      })
    })

    it('não deve retornar alertas quando thresholds são respeitados', () => {
      const snapshot: any = {
        timestamp: new Date().toISOString(),
        windowHours: 24,
        rag: {
          availability24h: 0.995, // > 0.99
          p95TotalMs24h: 2000, // < 2500
          p95ProviderMs24h: 1500, // < 2000
          fallbackRate24h: 0.05, // < 0.08
          avgSimilarity24h: 0.75, // > 0.70
          errorRate24h: 0.01,
          totalRequests24h: 100
        },
        providers: {},
        queue: {
          pendingCount: 0,
          processingCount: 0,
          failedCount: 0,
          stuckCount: 0,
          avgJobDurationMs24h: 0
        },
        db: {
          status: 'healthy'
        },
        cost: {
          dailyUSD: 0,
          dailyBRL: 0
        }
      }

      const alerts = AlertService.evaluateAlerts(snapshot)

      // Pode ter alertas de DB ou outros, mas não de RAG
      const ragAlerts = alerts.filter(a => a.id.startsWith('RAG_') || a.id.startsWith('FALLBACK_') || a.id.startsWith('AVG_SIMILARITY'))
      expect(ragAlerts.length).toBe(0)
    })
  })
})









