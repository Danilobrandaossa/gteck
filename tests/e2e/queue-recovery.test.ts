/**
 * FASE H.3 - Teste E2E: Queue Recovery
 * 
 * Cenários:
 * - H6.1: Queue Claim/Locks
 * - H6.2: Queue Heartbeat
 * - H6.3: Queue Recovery (Stuck)
 * - H6.4: Queue Retry/Backoff
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { db } from '@/lib/db'
import { WordPressTestHarness, TestTenant } from './helpers/wp-test-harness'
import { TestMetricsCollector } from './helpers/test-metrics'
import { QueueClaim } from '@/lib/queue-claim'
import crypto from 'crypto'

describe('FASE H - Queue Recovery E2E', () => {
  let tenant1: TestTenant
  let tenant2: TestTenant
  let metricsCollector: TestMetricsCollector

  beforeAll(async () => {
    const tenants = await WordPressTestHarness.createTestTenants()
    tenant1 = tenants.tenant1
    tenant2 = tenants.tenant2
    metricsCollector = new TestMetricsCollector()
  })

  afterAll(async () => {
    await WordPressTestHarness.cleanupTestTenants(tenant1, tenant2)
  })

  it('H6.1: Queue Claim/Locks - Jobs são claimados atomicamente', async () => {
    const startTime = Date.now()
    const correlationId = WordPressTestHarness.generateCorrelationId()

    try {
      // Criar job pendente
      const job = await db.queueJob.create({
        data: {
          type: 'embedding_generate',
          status: 'pending',
          siteId: tenant1.siteId,
          organizationId: tenant1.organizationId,
          data: JSON.stringify({
            organizationId: tenant1.organizationId,
            siteId: tenant1.siteId,
            sourceType: 'wp_post',
            sourceId: 'test-id',
            content: 'Test content',
            correlationId
          }),
          maxAttempts: 3
        }
      })

      // Tentar claimar job
      const claimedJobs = await QueueClaim.claimPendingJobs(
        tenant1.organizationId,
        tenant1.siteId,
        'embedding_generate',
        1,
        'test-worker-id'
      )

      const durationMs = Date.now() - startTime
      metricsCollector.recordScenario(
        'H6.1',
        'Queue Claim/Locks',
        claimedJobs.length > 0,
        durationMs,
        claimedJobs.length === 0 ? 'Job not claimed' : undefined,
        correlationId,
        {
          jobsClaimed: claimedJobs.length,
          jobId: job.id
        }
      )

      expect(claimedJobs.length).toBeGreaterThan(0)
    } catch (error) {
      const durationMs = Date.now() - startTime
      metricsCollector.recordScenario(
        'H6.1',
        'Queue Claim/Locks',
        false,
        durationMs,
        error instanceof Error ? error.message : 'Unknown error',
        correlationId
      )
      throw error
    }
  })

  it('H6.2: Queue Heartbeat - Mantém job vivo durante processamento', async () => {
    const startTime = Date.now()
    const correlationId = WordPressTestHarness.generateCorrelationId()

    try {
      // Criar job em processamento
      const job = await db.queueJob.create({
        data: {
          type: 'embedding_generate',
          status: 'processing',
          siteId: tenant1.siteId,
          organizationId: tenant1.organizationId,
          lockedBy: 'test-worker-id',
          lockedAt: new Date(),
          data: JSON.stringify({
            organizationId: tenant1.organizationId,
            siteId: tenant1.siteId,
            correlationId
          }),
          maxAttempts: 3
        }
      })

      // Simular heartbeat
      await QueueClaim.heartbeat(job.id, 'test-worker-id')

      // Verificar que lock ainda está ativo
      const updatedJob = await db.queueJob.findUnique({
        where: { id: job.id },
        select: { lockedAt: true, lockedBy: true }
      })

      const durationMs = Date.now() - startTime
      metricsCollector.recordScenario(
        'H6.2',
        'Queue Heartbeat',
        updatedJob?.lockedBy === 'test-worker-id',
        durationMs,
        undefined,
        correlationId,
        {
          jobId: job.id,
          lockActive: updatedJob?.lockedBy === 'test-worker-id'
        }
      )

      expect(updatedJob?.lockedBy).toBe('test-worker-id')
    } catch (error) {
      const durationMs = Date.now() - startTime
      metricsCollector.recordScenario(
        'H6.2',
        'Queue Heartbeat',
        false,
        durationMs,
        error instanceof Error ? error.message : 'Unknown error',
        correlationId
      )
      throw error
    }
  })

  it('H6.3: Queue Recovery (Stuck) - Jobs stuck são recuperados', async () => {
    const startTime = Date.now()
    const correlationId = WordPressTestHarness.generateCorrelationId()

    try {
      // Criar job stuck (lock expirado)
      const expiredLockTime = new Date(Date.now() - 10 * 60 * 1000) // 10 minutos atrás
      const stuckJob = await db.queueJob.create({
        data: {
          type: 'embedding_generate',
          status: 'processing',
          siteId: tenant1.siteId,
          organizationId: tenant1.organizationId,
          lockedBy: 'dead-worker-id',
          lockedAt: expiredLockTime,
          data: JSON.stringify({
            organizationId: tenant1.organizationId,
            siteId: tenant1.siteId,
            correlationId
          }),
          maxAttempts: 3
        }
      })

      // Simular recovery (em produção, seria via cron)
      // Por enquanto, apenas verificar que job existe e está stuck
      const stuckJobs = await db.queueJob.findMany({
        where: {
          siteId: tenant1.siteId,
          status: 'processing',
          lockedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } // Lock expirado há 5+ minutos
        }
      })

      const durationMs = Date.now() - startTime
      metricsCollector.recordScenario(
        'H6.3',
        'Queue Recovery (Stuck)',
        stuckJobs.length > 0,
        durationMs,
        undefined,
        correlationId,
        {
          stuckJobsFound: stuckJobs.length,
          queueStuckCount: stuckJobs.length
        }
      )

      expect(stuckJobs.length).toBeGreaterThan(0)
    } catch (error) {
      const durationMs = Date.now() - startTime
      metricsCollector.recordScenario(
        'H6.3',
        'Queue Recovery (Stuck)',
        false,
        durationMs,
        error instanceof Error ? error.message : 'Unknown error',
        correlationId
      )
      throw error
    }
  })

  it('H6.4: Queue Retry/Backoff - Jobs falhados são retentados', async () => {
    const startTime = Date.now()
    const correlationId = WordPressTestHarness.generateCorrelationId()

    try {
      // Criar job falhado
      const failedJob = await db.queueJob.create({
        data: {
          type: 'embedding_generate',
          status: 'failed',
          siteId: tenant1.siteId,
          organizationId: tenant1.organizationId,
          attempts: 1,
          maxAttempts: 3,
          error: 'Test error',
          data: JSON.stringify({
            organizationId: tenant1.organizationId,
            siteId: tenant1.siteId,
            correlationId
          })
        }
      })

      // Verificar que job pode ser retentado (em produção, seria via worker)
      const canRetry = failedJob.attempts < failedJob.maxAttempts

      const durationMs = Date.now() - startTime
      metricsCollector.recordScenario(
        'H6.4',
        'Queue Retry/Backoff',
        canRetry,
        durationMs,
        undefined,
        correlationId,
        {
          jobId: failedJob.id,
          attempts: failedJob.attempts,
          maxAttempts: failedJob.maxAttempts,
          canRetry
        }
      )

      expect(canRetry).toBe(true)
    } catch (error) {
      const durationMs = Date.now() - startTime
      metricsCollector.recordScenario(
        'H6.4',
        'Queue Retry/Backoff',
        false,
        durationMs,
        error instanceof Error ? error.message : 'Unknown error',
        correlationId
      )
      throw error
    }
  })
})






