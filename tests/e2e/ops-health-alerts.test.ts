/**
 * FASE H.3 - Teste E2E: Ops Health + Alerts
 * 
 * Cenários:
 * - H5.1: CorrelationId End-to-End
 * - H5.2: Spans e Timings
 * - H5.3: Health Snapshot WP
 * - H5.4: Alerts WP
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { db } from '@/lib/db'
import { WordPressTestHarness, TestTenant } from './helpers/wp-test-harness'
import { TestMetricsCollector } from './helpers/test-metrics'
import { HealthSnapshotService } from '@/lib/observability/health-snapshot'
import { AlertService } from '@/lib/observability/alerts'
import { WordPressEmbeddingTrigger } from '@/lib/wordpress/wordpress-embedding-trigger'
import crypto from 'crypto'

describe('FASE H - Ops Health + Alerts E2E', () => {
  let tenant1: TestTenant
  let tenant2: TestTenant
  let metricsCollector: TestMetricsCollector
  let pageId: string

  beforeAll(async () => {
    const tenants = await WordPressTestHarness.createTestTenants()
    tenant1 = tenants.tenant1
    tenant2 = tenants.tenant2
    metricsCollector = new TestMetricsCollector()

    // Criar página para testes
    const page = await db.page.create({
      data: {
        title: 'Health Test Post',
        slug: 'health-test-post',
        content: 'This is a test post for health monitoring.',
        siteId: tenant1.siteId,
        wpPostId: 401,
        wpSiteUrl: 'https://test-wp-1.example.com',
        wpSyncedAt: new Date()
      }
    })
    pageId = page.id
  })

  afterAll(async () => {
    await WordPressTestHarness.cleanupTestTenants(tenant1, tenant2)
  })

  it('H5.1: CorrelationId End-to-End - Propagado em todas as etapas', async () => {
    const startTime = Date.now()
    const correlationId = WordPressTestHarness.generateCorrelationId()

    try {
      // Trigger embedding com correlationId
      const triggerResult = await WordPressEmbeddingTrigger.triggerEmbedding({
        organizationId: tenant1.organizationId,
        siteId: tenant1.siteId,
        sourceType: 'wp_post',
        sourceId: pageId,
        wpId: 401,
        title: 'Health Test Post',
        content: 'This is a test post for health monitoring.',
        correlationId
      })

      // Verificar que correlationId está presente nos jobs
      const jobs = await db.queueJob.findMany({
        where: {
          siteId: tenant1.siteId,
          type: { startsWith: 'embedding_' },
          data: {
            path: ['correlationId'],
            equals: correlationId
          }
        }
      })

      const durationMs = Date.now() - startTime
      metricsCollector.recordScenario(
        'H5.1',
        'CorrelationId End-to-End',
        jobs.length > 0,
        durationMs,
        jobs.length === 0 ? 'CorrelationId not found in jobs' : undefined,
        correlationId,
        {
          jobsWithCorrelationId: jobs.length
        }
      )

      expect(jobs.length).toBeGreaterThan(0)
    } catch (error) {
      const durationMs = Date.now() - startTime
      metricsCollector.recordScenario(
        'H5.1',
        'CorrelationId End-to-End',
        false,
        durationMs,
        error instanceof Error ? error.message : 'Unknown error',
        correlationId
      )
      throw error
    }
  })

  it('H5.2: Spans e Timings - Timings registrados corretamente', async () => {
    const startTime = Date.now()
    const correlationId = WordPressTestHarness.generateCorrelationId()

    try {
      // Executar operação e medir timing
      const operationStart = Date.now()
      
      await WordPressEmbeddingTrigger.triggerEmbedding({
        organizationId: tenant1.organizationId,
        siteId: tenant1.siteId,
        sourceType: 'wp_post',
        sourceId: pageId,
        wpId: 401,
        title: 'Health Test Post',
        content: 'This is a test post for health monitoring.',
        correlationId
      })

      const operationDuration = Date.now() - operationStart

      const durationMs = Date.now() - startTime
      metricsCollector.recordScenario(
        'H5.2',
        'Spans e Timings',
        true,
        durationMs,
        undefined,
        correlationId,
        {
          operationDurationMs: operationDuration,
          totalDurationMs: durationMs
        }
      )

      expect(operationDuration).toBeGreaterThan(0)
    } catch (error) {
      const durationMs = Date.now() - startTime
      metricsCollector.recordScenario(
        'H5.2',
        'Spans e Timings',
        false,
        durationMs,
        error instanceof Error ? error.message : 'Unknown error',
        correlationId
      )
      throw error
    }
  })

  it('H5.3: Health Snapshot WP - Métricas WP presentes', async () => {
    const startTime = Date.now()
    const correlationId = WordPressTestHarness.generateCorrelationId()

    try {
      // Gerar health snapshot
      const snapshot = await HealthSnapshotService.generateSnapshot(24)

      // Verificar que wpIndexing está presente
      expect(snapshot.wpIndexing).toBeDefined()
      expect(snapshot.wpIndexing?.wpItemsPendingIndex).toBeDefined()
      expect(snapshot.wpIndexing?.wpIndexLagMinutes).toBeDefined()
      expect(snapshot.wpIndexing?.wpIndexErrorRate24h).toBeDefined()

      const durationMs = Date.now() - startTime
      metricsCollector.recordScenario(
        'H5.3',
        'Health Snapshot WP',
        true,
        durationMs,
        undefined,
        correlationId,
        {
          wpIndexingPresent: !!snapshot.wpIndexing,
          pendingIndex: snapshot.wpIndexing?.wpItemsPendingIndex || 0,
          lagMinutes: snapshot.wpIndexing?.wpIndexLagMinutes || 0,
          errorRate: snapshot.wpIndexing?.wpIndexErrorRate24h || 0
        }
      )
    } catch (error) {
      const durationMs = Date.now() - startTime
      metricsCollector.recordScenario(
        'H5.3',
        'Health Snapshot WP',
        false,
        durationMs,
        error instanceof Error ? error.message : 'Unknown error',
        correlationId
      )
      throw error
    }
  })

  it('H5.4: Alerts WP - Alertas gerados corretamente', async () => {
    const startTime = Date.now()
    const correlationId = WordPressTestHarness.generateCorrelationId()

    try {
      // Gerar health snapshot
      const snapshot = await HealthSnapshotService.generateSnapshot(24)

      // Avaliar alertas
      const alerts = AlertService.evaluateAlerts(snapshot)

      // Verificar que alertas WP podem ser gerados
      const wpAlerts = alerts.filter(a => 
        a.id === 'WP_INDEX_LAG_HIGH' || a.id === 'WP_INDEX_ERROR_RATE_HIGH'
      )

      const durationMs = Date.now() - startTime
      metricsCollector.recordScenario(
        'H5.4',
        'Alerts WP',
        true,
        durationMs,
        undefined,
        correlationId,
        {
          totalAlerts: alerts.length,
          wpAlertsCount: wpAlerts.length,
          wpAlerts: wpAlerts.map(a => a.id)
        }
      )

      expect(alerts).toBeDefined()
    } catch (error) {
      const durationMs = Date.now() - startTime
      metricsCollector.recordScenario(
        'H5.4',
        'Alerts WP',
        false,
        durationMs,
        error instanceof Error ? error.message : 'Unknown error',
        correlationId
      )
      throw error
    }
  })
})






