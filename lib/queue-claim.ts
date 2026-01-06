/**
 * 🔒 QUEUE CLAIM - Claim atômico de jobs para múltiplas instâncias
 * 
 * Responsabilidades:
 * - Claim atômico de jobs pendentes
 * - Recuperação de jobs stuck
 * - Heartbeat para manter locks vivos
 * 
 * REGRAS:
 * - Claim sempre atômico (UPDATE ... WHERE ... RETURNING)
 * - Nunca permitir dois workers claimarem o mesmo job
 * - Locks expiram automaticamente (TTL)
 */

import { Prisma } from '@prisma/client'
import { db } from './db'
import { safeQueryRaw, safeExecuteRaw } from './tenant-security'

export interface ClaimJobsOptions {
  batchSize?: number
  workerId: string
  jobType?: string
  lockTtlMs?: number
}

export interface ClaimedJob {
  id: string
  type: string
  status: string
  data: string
  attempts: number
  maxAttempts: number
  lockedBy: string | null
  lockedAt: Date | null
  lockExpiresAt: Date | null
  processingStartedAt: Date | null
  createdAt: Date
}

export interface ClaimResult {
  jobs: ClaimedJob[]
  count: number
}

export interface WorkerMetrics {
  jobsClaimed: number
  jobsCompleted: number
  jobsFailed: number
  jobsRetried: number
  jobsRecovered: number
  avgJobDurationMs: number
  stuckJobCount: number
}

export class QueueClaim {
  private static readonly DEFAULT_LOCK_TTL_MS = parseInt(process.env.JOB_LOCK_TTL_MS || '60000', 10)
  private static readonly DEFAULT_HEARTBEAT_INTERVAL_MS = parseInt(process.env.JOB_HEARTBEAT_INTERVAL_MS || '10000', 10)

  /**
   * Claim atômico de jobs pendentes
   * 
   * IMPORTANTE: Esta função usa SQL raw, mas é segura porque:
   * - Não expõe dados de tenant (QueueJob é fila de infra)
   * - Claim é atômico (UPDATE ... WHERE ... RETURNING)
   * - Não permite race conditions
   */
  static async claimPendingJobs(options: ClaimJobsOptions): Promise<ClaimResult> {
    const {
      batchSize = 10,
      workerId,
      jobType,
      lockTtlMs = this.DEFAULT_LOCK_TTL_MS
    } = options

    // Validar workerId
    if (!workerId || workerId.trim() === '') {
      throw new Error('workerId is required for job claiming')
    }

    // Calcular lockExpiresAt
    const lockExpiresAt = new Date(Date.now() + lockTtlMs)
    const now = new Date()

    // Construir query de claim atômico
    // IMPORTANTE: Esta query é atômica - apenas jobs que estão 'pending' OU
    // que têm lock expirado serão claimados
    const whereConditions: Prisma.Sql[] = [
      Prisma.sql`status = 'pending'`,
      Prisma.sql`(lock_expires_at IS NULL OR lock_expires_at < NOW())`,
      Prisma.sql`attempts < max_attempts`
    ]

    if (jobType) {
      whereConditions.push(Prisma.sql`type = ${jobType}`)
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`

    // Claim atômico: UPDATE ... WHERE ... RETURNING
    // Esta query é executada diretamente (sem tenant context) porque QueueJob é fila de infra
    // Mas ainda assim, não expõe dados sensíveis
    const nowStr = now.toISOString()
    const lockExpiresAtStr = lockExpiresAt.toISOString()
    
    const query = Prisma.sql`
      UPDATE queue_jobs
      SET 
        status = 'processing',
        locked_by = ${workerId},
        locked_at = ${nowStr}::timestamp,
        lock_expires_at = ${lockExpiresAtStr}::timestamp,
        processing_started_at = ${nowStr}::timestamp,
        updated_at = ${nowStr}::timestamp
      ${whereClause}
      ORDER BY created_at ASC
      LIMIT ${batchSize}
      RETURNING 
        id,
        type,
        status,
        data,
        attempts,
        max_attempts,
        locked_by,
        locked_at,
        lock_expires_at,
        processing_started_at,
        created_at
    `

    try {
      const results = await db.$queryRaw<Array<{
        id: string
        type: string
        status: string
        data: string
        attempts: number
        max_attempts: number
        locked_by: string | null
        locked_at: Date | null
        lock_expires_at: Date | null
        processing_started_at: Date | null
        created_at: Date
      }>>(query)

      const jobs: ClaimedJob[] = results.map(row => ({
        id: row.id,
        type: row.type,
        status: row.status,
        data: row.data,
        attempts: row.attempts,
        maxAttempts: row.max_attempts,
        lockedBy: row.locked_by,
        lockedAt: row.locked_at,
        lockExpiresAt: row.lock_expires_at,
        processingStartedAt: row.processing_started_at,
        createdAt: row.created_at
      }))

      return {
        jobs,
        count: jobs.length
      }
    } catch (error) {
      console.error('[QueueClaim] Error claiming jobs:', error)
      throw new Error(`Failed to claim jobs: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Atualiza heartbeat de um job (estende lock)
   */
  static async updateHeartbeat(
    jobId: string,
    workerId: string,
    lockTtlMs: number = this.DEFAULT_LOCK_TTL_MS
  ): Promise<void> {
    const lockExpiresAt = new Date(Date.now() + lockTtlMs)
    const now = new Date()

    try {
      // Atualizar heartbeat apenas se o job ainda está locked por este worker
      const nowStr = now.toISOString()
      const lockExpiresAtStr = lockExpiresAt.toISOString()
      
      const query = Prisma.sql`
        UPDATE queue_jobs
        SET 
          last_heartbeat_at = ${nowStr}::timestamp,
          lock_expires_at = ${lockExpiresAtStr}::timestamp,
          updated_at = ${nowStr}::timestamp
        WHERE id = ${jobId}
          AND locked_by = ${workerId}
          AND status = 'processing'
      `

      const count = await db.$executeRaw(query)

      if (count === 0) {
        // Job não está mais locked por este worker (pode ter sido recuperado)
        console.warn(`[QueueClaim] Job ${jobId} not found or not locked by worker ${workerId}`)
      }
    } catch (error) {
      console.error(`[QueueClaim] Error updating heartbeat for job ${jobId}:`, error)
      // Não falhar o processamento por erro de heartbeat
    }
  }

  /**
   * Recupera jobs stuck (processing com lock expirado)
   */
  static async recoverStuckJobs(
    workerId?: string,
    lockTtlMs: number = this.DEFAULT_LOCK_TTL_MS
  ): Promise<{
    recovered: number
    movedToFailed: number
  }> {
    const now = new Date()

    try {
      // Buscar jobs stuck (processing com lock expirado)
      const stuckQuery = Prisma.sql`
        SELECT id, attempts, max_attempts
        FROM queue_jobs
        WHERE status = 'processing'
          AND lock_expires_at < NOW()
          ${workerId ? Prisma.sql`AND locked_by = ${workerId}` : Prisma.sql``}
      `

      const stuckJobs = await db.$queryRaw<Array<{
        id: string
        attempts: number
        max_attempts: number
      }>>(stuckQuery)

      let recovered = 0
      let movedToFailed = 0

      for (const job of stuckJobs) {
        if (job.attempts >= job.max_attempts) {
          // Mover para failed (DLQ)
          const nowStr = now.toISOString()
          const failedQuery = Prisma.sql`
            UPDATE queue_jobs
            SET 
              status = 'failed',
              error = 'Job stuck and exceeded max attempts',
              updated_at = ${nowStr}::timestamp,
              locked_by = NULL,
              locked_at = NULL,
              lock_expires_at = NULL,
              last_heartbeat_at = NULL
            WHERE id = ${job.id}
          `

          await db.$executeRaw(failedQuery)
          movedToFailed++
        } else {
          // Resetar para pending (retry)
          const nowStr = now.toISOString()
          const resetQuery = Prisma.sql`
            UPDATE queue_jobs
            SET 
              status = 'pending',
              attempts = attempts + 1,
              updated_at = ${nowStr}::timestamp,
              locked_by = NULL,
              locked_at = NULL,
              lock_expires_at = NULL,
              last_heartbeat_at = NULL,
              processing_started_at = NULL
            WHERE id = ${job.id}
          `

          await db.$executeRaw(resetQuery)
          recovered++
        }
      }

      return {
        recovered,
        movedToFailed
      }
    } catch (error) {
      console.error('[QueueClaim] Error recovering stuck jobs:', error)
      return {
        recovered: 0,
        movedToFailed: 0
      }
    }
  }

  /**
   * Finaliza job (completo ou falho)
   */
  static async finalizeJob(
    jobId: string,
    workerId: string,
    status: 'completed' | 'failed',
    result?: string,
    error?: string
  ): Promise<void> {
    const now = new Date()

    try {
      const nowStr = now.toISOString()
      const query = Prisma.sql`
        UPDATE queue_jobs
        SET 
          status = ${status},
          ${result ? Prisma.sql`result = ${result},` : Prisma.empty}
          ${error ? Prisma.sql`error = ${error},` : Prisma.empty}
          processed_at = ${nowStr}::timestamp,
          updated_at = ${nowStr}::timestamp,
          locked_by = NULL,
          locked_at = NULL,
          lock_expires_at = NULL,
          last_heartbeat_at = NULL
        WHERE id = ${jobId}
          AND locked_by = ${workerId}
      `

      const count = await db.$executeRaw(query)

      if (count === 0) {
        console.warn(`[QueueClaim] Job ${jobId} not found or not locked by worker ${workerId}`)
      }
    } catch (error) {
      console.error(`[QueueClaim] Error finalizing job ${jobId}:`, error)
      throw error
    }
  }

  /**
   * Retry job (incrementa attempts e reseta para pending)
   */
  static async retryJob(
    jobId: string,
    workerId: string,
    error: string
  ): Promise<void> {
    const now = new Date()

    try {
      const nowStr = now.toISOString()
      const query = Prisma.sql`
        UPDATE queue_jobs
        SET 
          status = 'pending',
          attempts = attempts + 1,
          error = ${error},
          updated_at = ${nowStr}::timestamp,
          locked_by = NULL,
          locked_at = NULL,
          lock_expires_at = NULL,
          last_heartbeat_at = NULL,
          processing_started_at = NULL
        WHERE id = ${jobId}
          AND locked_by = ${workerId}
      `

      const count = await db.$executeRaw(query)

      if (count === 0) {
        console.warn(`[QueueClaim] Job ${jobId} not found or not locked by worker ${workerId}`)
      }
    } catch (error) {
      console.error(`[QueueClaim] Error retrying job ${jobId}:`, error)
      throw error
    }
  }

  /**
   * Obtém métricas do worker
   */
  static async getWorkerMetrics(workerId: string, since?: Date): Promise<WorkerMetrics> {
    const sinceDate = since || new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h

    try {
      // Jobs claimados por este worker
      const claimedQuery = Prisma.sql`
        SELECT COUNT(*) as count
        FROM queue_jobs
        WHERE locked_by = ${workerId}
          AND processing_started_at >= ${sinceDate}
      `

      const claimedResult = await db.$queryRaw<Array<{ count: bigint }>>(claimedQuery)
      const jobsClaimed = Number(claimedResult[0]?.count || 0)

      // Jobs completados
      const completedQuery = Prisma.sql`
        SELECT COUNT(*) as count
        FROM queue_jobs
        WHERE status = 'completed'
          AND processed_at >= ${sinceDate}
      `

      const completedResult = await db.$queryRaw<Array<{ count: bigint }>>(completedQuery)
      const jobsCompleted = Number(completedResult[0]?.count || 0)

      // Jobs falhados
      const failedQuery = Prisma.sql`
        SELECT COUNT(*) as count
        FROM queue_jobs
        WHERE status = 'failed'
          AND processed_at >= ${sinceDate}
      `

      const failedResult = await db.$queryRaw<Array<{ count: bigint }>>(failedQuery)
      const jobsFailed = Number(failedResult[0]?.count || 0)

      // Jobs retried (attempts > 0 e completed/failed)
      const retriedQuery = Prisma.sql`
        SELECT COUNT(*) as count
        FROM queue_jobs
        WHERE attempts > 0
          AND status IN ('completed', 'failed')
          AND processed_at >= ${sinceDate}
      `

      const retriedResult = await db.$queryRaw<Array<{ count: bigint }>>(retriedQuery)
      const jobsRetried = Number(retriedResult[0]?.count || 0)

      // Jobs stuck (processing com lock expirado)
      const stuckQuery = Prisma.sql`
        SELECT COUNT(*) as count
        FROM queue_jobs
        WHERE status = 'processing'
          AND lock_expires_at < NOW()
      `

      const stuckResult = await db.$queryRaw<Array<{ count: bigint }>>(stuckQuery)
      const stuckJobCount = Number(stuckResult[0]?.count || 0)

      // Jobs recuperados (não temos histórico direto, usar estimativa)
      const jobsRecovered = 0 // Será preenchido quando recoverStuckJobs() for chamado

      // Duração média de jobs completados
      const avgDurationQuery = Prisma.sql`
        SELECT AVG(EXTRACT(EPOCH FROM (processed_at - processing_started_at)) * 1000) as avg_ms
        FROM queue_jobs
        WHERE status = 'completed'
          AND processed_at >= ${sinceDate}
          AND processing_started_at IS NOT NULL
      `

      const avgDurationResult = await db.$queryRaw<Array<{ avg_ms: number | null }>>(avgDurationQuery)
      const avgJobDurationMs = Math.round(avgDurationResult[0]?.avg_ms || 0)

      return {
        jobsClaimed,
        jobsCompleted,
        jobsFailed,
        jobsRetried,
        jobsRecovered,
        avgJobDurationMs,
        stuckJobCount
      }
    } catch (error) {
      console.error('[QueueClaim] Error getting worker metrics:', error)
      return {
        jobsClaimed: 0,
        jobsCompleted: 0,
        jobsFailed: 0,
        jobsRetried: 0,
        jobsRecovered: 0,
        avgJobDurationMs: 0,
        stuckJobCount: 0
      }
    }
  }
}

