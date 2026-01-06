/**
 * 🔄 EMBEDDING WORKER - Processa jobs de embedding de forma assíncrona
 * 
 * Este worker deve ser executado em background (cron job ou processo dedicado).
 * 
 * Funcionalidades:
 * - Processa jobs pendentes
 * - Retry automático com backoff
 * - Dead-letter queue para jobs falhados
 * - Observabilidade completa
 */

import { db } from './db'
import { EmbeddingService } from './embedding-service'
import { QueueClaim, ClaimedJob } from './queue-claim'
import crypto from 'crypto'

export interface WorkerConfig {
  batchSize?: number // Quantos jobs processar por vez
  pollInterval?: number // Intervalo entre polls (ms)
  maxConcurrent?: number // Máximo de jobs simultâneos
  retryBackoff?: number[] // Backoff em ms para cada tentativa
}

export class EmbeddingWorker {
  private config: Required<WorkerConfig>
  private isRunning: boolean = false
  private processingJobs: Set<string> = new Set()
  private workerId: string // FASE 7 ETAPA 4: ID único da instância
  private heartbeatInterval?: NodeJS.Timeout // FASE 7 ETAPA 4: Intervalo de heartbeat
  private recoverInterval?: NodeJS.Timeout // FASE 7 ETAPA 4: Intervalo de recuperação

  constructor(config: WorkerConfig = {}) {
    this.config = {
      batchSize: config.batchSize || 10,
      pollInterval: config.pollInterval || 5000, // 5 segundos
      maxConcurrent: config.maxConcurrent || 3,
      retryBackoff: config.retryBackoff || [1000, 5000, 30000] // 1s, 5s, 30s
    }
    
    // FASE 7 ETAPA 4: Gerar ID único para esta instância do worker
    this.workerId = `worker-${crypto.randomUUID()}`
  }

  /**
   * Inicia o worker (loop infinito) - FASE 7 ETAPA 4: Com claim atômico
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('[EmbeddingWorker] Worker already running')
      return
    }

    this.isRunning = true
    console.log('[EmbeddingWorker] Starting worker', {
      workerId: this.workerId,
      batchSize: this.config.batchSize,
      pollInterval: this.config.pollInterval,
      maxConcurrent: this.config.maxConcurrent
    })

    // FASE 7 ETAPA 4: Iniciar heartbeat e recuperação de stuck jobs
    this.startHeartbeat()
    this.startRecovery()

    while (this.isRunning) {
      try {
        // FASE 7 ETAPA 4: Recuperar jobs stuck antes de processar
        await QueueClaim.recoverStuckJobs(this.workerId)

        // Processar batch com claim atômico
        await this.processBatch()
      } catch (error) {
        console.error('[EmbeddingWorker] Error processing batch:', error)
      }

      // Aguardar antes do próximo poll
      await this.sleep(this.config.pollInterval)
    }

    // Limpar intervalos
    this.stopHeartbeat()
    this.stopRecovery()
  }

  /**
   * Para o worker - FASE 7 ETAPA 4: Limpar locks e intervalos
   */
  stop(): void {
    this.isRunning = false
    this.stopHeartbeat()
    this.stopRecovery()
    console.log('[EmbeddingWorker] Stopping worker', { workerId: this.workerId })
  }

  /**
   * Processa um lote de jobs - FASE 7 ETAPA 4: Com claim atômico
   */
  private async processBatch(): Promise<void> {
    // Verificar se há capacidade para processar mais jobs
    if (this.processingJobs.size >= this.config.maxConcurrent) {
      return
    }

    // FASE 7 ETAPA 4: Claim atômico de jobs pendentes
    const claimResult = await QueueClaim.claimPendingJobs({
      batchSize: this.config.batchSize,
      workerId: this.workerId,
      jobType: 'generate_embedding'
    })

    if (claimResult.jobs.length === 0) {
      return
    }

    console.log('[EmbeddingWorker] Claimed jobs', {
      workerId: this.workerId,
      count: claimResult.count,
      jobIds: claimResult.jobs.map(j => j.id)
    })

    // Processar jobs em paralelo (limitado por maxConcurrent)
    const availableSlots = this.config.maxConcurrent - this.processingJobs.size
    const jobsToProcess = claimResult.jobs.slice(0, availableSlots)

    const promises = jobsToProcess.map(job => this.processJobWithClaim(job))
    await Promise.allSettled(promises)
  }

  /**
   * Processa um job individual - FASE 7 ETAPA 4: Com heartbeat e finalização segura
   */
  private async processJobWithClaim(claimedJob: ClaimedJob): Promise<void> {
    const { id: jobId, attempts, maxAttempts } = claimedJob

    if (this.processingJobs.has(jobId)) {
      return // Já está sendo processado
    }

    this.processingJobs.add(jobId)

    // FASE 7 ETAPA 4: Intervalo de heartbeat
    const heartbeatInterval = setInterval(async () => {
      await QueueClaim.updateHeartbeat(jobId, this.workerId)
    }, parseInt(process.env.JOB_HEARTBEAT_INTERVAL_MS || '10000', 10))

    try {
      const startTime = Date.now()

      console.log('[EmbeddingWorker] Processing job', {
        workerId: this.workerId,
        jobId,
        type: claimedJob.type,
        attempts,
        maxAttempts
      })

      // FASE 7 ETAPA 5: Extrair ou gerar correlationId do job
      const jobData = JSON.parse(claimedJob.data)
      const correlationId = extractCorrelationId(jobData) || crypto.randomUUID()
      const correlationContext = createCorrelationContext(
        correlationId,
        jobData.organizationId,
        jobData.siteId,
        jobData.userId
      )
      const logger = StructuredLogger.withCorrelation(correlationContext, 'worker')

      logger.info('Processing embedding job', {
        action: 'process_embedding_job',
        jobId,
        jobType: claimedJob.type,
        attempts
      })

      // FASE 7 ETAPA 4: Verificar idempotência (deduplicação já feita no EmbeddingService)
      // Processar embedding (com span)
      const processSpan = await withSpan(
        'process_embedding_job',
        correlationContext,
        'worker',
        'process_embedding',
        async () => {
          return await EmbeddingService.processEmbeddingJob(jobId, correlationId)
        },
        {
          jobId,
          jobType: claimedJob.type
        }
      )

      const duration = Date.now() - startTime

      // FASE 7 ETAPA 4: Finalizar job como completo
      await QueueClaim.finalizeJob(
        jobId,
        this.workerId,
        'completed',
        JSON.stringify({ durationMs: duration })
      )

      console.log('[EmbeddingWorker] Job completed', {
        workerId: this.workerId,
        jobId,
        duration: `${duration}ms`,
        attempts
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      console.error('[EmbeddingWorker] Job failed', {
        workerId: this.workerId,
        jobId,
        error: errorMessage,
        attempts,
        maxAttempts
      })

      // FASE 7 ETAPA 4: Verificar se deve fazer retry
      if (attempts < maxAttempts) {
        // Calcular backoff
        const backoffIndex = Math.min(attempts, this.config.retryBackoff.length - 1)
        const backoffMs = this.config.retryBackoff[backoffIndex]

        // Retry: resetar para pending
        await QueueClaim.retryJob(jobId, this.workerId, errorMessage)

        console.log('[EmbeddingWorker] Job scheduled for retry', {
          workerId: this.workerId,
          jobId,
          nextAttempt: attempts + 1,
          backoffMs
        })
      } else {
        // Máximo de tentativas atingido → Dead-letter queue
        await QueueClaim.finalizeJob(
          jobId,
          this.workerId,
          'failed',
          undefined,
          errorMessage
        )

        console.error('[EmbeddingWorker] Job moved to DLQ', {
          workerId: this.workerId,
          jobId,
          attempts,
          maxAttempts
        })
      }

    } finally {
      // Limpar heartbeat
      clearInterval(heartbeatInterval)
      this.processingJobs.delete(jobId)
    }
  }

  /**
   * Processa um job individual (compatibilidade - mantido para backward compatibility)
   */
  private async processJob(jobId: string): Promise<void> {
    // Buscar job (pode não estar claimed)
    const job = await db.queueJob.findUnique({
      where: { id: jobId }
    })

    if (!job) {
      console.warn('[EmbeddingWorker] Job not found', { jobId })
      return
    }

    // Se job não está claimed, claimar primeiro
    if (!job.lockedBy) {
      // Tentar claimar
      const claimResult = await QueueClaim.claimPendingJobs({
        batchSize: 1,
        workerId: this.workerId,
        jobType: job.type
      })

      if (claimResult.jobs.length === 0 || claimResult.jobs[0].id !== jobId) {
        console.warn('[EmbeddingWorker] Could not claim job', { jobId })
        return
      }

      await this.processJobWithClaim(claimResult.jobs[0])
    } else if (job.lockedBy === this.workerId) {
      // Já está claimed por este worker
      const claimedJob: ClaimedJob = {
        id: job.id,
        type: job.type,
        status: job.status,
        data: job.data,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        lockedBy: job.lockedBy,
        lockedAt: job.lockedAt,
        lockExpiresAt: job.lockExpiresAt,
        processingStartedAt: job.processingStartedAt,
        createdAt: job.createdAt
      }
      await this.processJobWithClaim(claimedJob)
    } else {
      console.warn('[EmbeddingWorker] Job locked by another worker', {
        jobId,
        lockedBy: job.lockedBy,
        workerId: this.workerId
      })
    }
  }

  /**
   * Processa um job específico (para uso externo)
   */
  async processJobById(jobId: string): Promise<void> {
    await this.processJob(jobId)
  }

  /**
   * Processa todos os jobs pendentes (para uso em cron)
   */
  async processAllPending(): Promise<{ processed: number; failed: number }> {
    let processed = 0
    let failed = 0

    while (true) {
      const jobs = await db.queueJob.findMany({
        where: {
          type: 'generate_embedding',
          status: 'pending'
        },
        take: this.config.batchSize
      })

      // Filtrar jobs que ainda podem ser tentados
      const validJobs = jobs.filter(job => job.attempts < job.maxAttempts)
      
      if (validJobs.length === 0) {
        break
      }

      if (jobs.length === 0) {
        break
      }

      const results = await Promise.allSettled(
        validJobs.map(job => this.processJob(job.id))
      )

      processed += results.filter(r => r.status === 'fulfilled').length
      failed += results.filter(r => r.status === 'rejected').length

      // Evitar sobrecarga
      await this.sleep(1000)
    }

    return { processed, failed }
  }

  /**
   * FASE 7 ETAPA 4: Inicia heartbeat para jobs em processamento
   */
  private startHeartbeat(): void {
    const heartbeatIntervalMs = parseInt(process.env.JOB_HEARTBEAT_INTERVAL_MS || '10000', 10)

    this.heartbeatInterval = setInterval(async () => {
      // Atualizar heartbeat de todos os jobs em processamento por este worker
      for (const jobId of this.processingJobs) {
        await QueueClaim.updateHeartbeat(jobId, this.workerId)
      }
    }, heartbeatIntervalMs)

    console.log('[EmbeddingWorker] Heartbeat started', {
      workerId: this.workerId,
      intervalMs: heartbeatIntervalMs
    })
  }

  /**
   * FASE 7 ETAPA 4: Para heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = undefined
      console.log('[EmbeddingWorker] Heartbeat stopped', { workerId: this.workerId })
    }
  }

  /**
   * FASE 7 ETAPA 4: Inicia recuperação periódica de stuck jobs
   */
  private startRecovery(): void {
    const recoveryIntervalMs = 60000 // 1 minuto

    this.recoverInterval = setInterval(async () => {
      try {
        const result = await QueueClaim.recoverStuckJobs(this.workerId)
        
        if (result.recovered > 0 || result.movedToFailed > 0) {
          console.log('[EmbeddingWorker] Recovered stuck jobs', {
            workerId: this.workerId,
            recovered: result.recovered,
            movedToFailed: result.movedToFailed
          })
        }
      } catch (error) {
        console.error('[EmbeddingWorker] Error recovering stuck jobs:', error)
      }
    }, recoveryIntervalMs)

    console.log('[EmbeddingWorker] Recovery started', {
      workerId: this.workerId,
      intervalMs: recoveryIntervalMs
    })
  }

  /**
   * FASE 7 ETAPA 4: Para recuperação
   */
  private stopRecovery(): void {
    if (this.recoverInterval) {
      clearInterval(this.recoverInterval)
      this.recoverInterval = undefined
      console.log('[EmbeddingWorker] Recovery stopped', { workerId: this.workerId })
    }
  }

  /**
   * FASE 7 ETAPA 4: Obtém métricas do worker
   */
  async getMetrics(since?: Date): Promise<import('./queue-claim').WorkerMetrics> {
    return QueueClaim.getWorkerMetrics(this.workerId, since)
  }

  /**
   * Utilitário: sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Instância singleton do worker (opcional)
 */
let workerInstance: EmbeddingWorker | null = null

export function getEmbeddingWorker(config?: WorkerConfig): EmbeddingWorker {
  if (!workerInstance) {
    workerInstance = new EmbeddingWorker(config)
  }
  return workerInstance
}

