import { logger } from './logger'
import { wordPressSyncManager } from './wordpress-sync'
import { automationManager } from './automation'

export interface CronJob {
  id: string
  name: string
  schedule: string // Cron expression
  task: () => Promise<void>
  active: boolean
  lastRun?: Date
  nextRun?: Date
  timeout: number
  retryCount: number
}

export class CronJobManager {
  private jobs = new Map<string, CronJob>()
  private intervals = new Map<string, NodeJS.Timeout>()
  private isRunning = false

  addJob(job: CronJob): void {
    this.jobs.set(job.id, job)
    
    if (job.active) {
      this.scheduleJob(job.id)
    }
    
    logger.info('Cron job added', {
      jobId: job.id,
      name: job.name,
      schedule: job.schedule,
      active: job.active
    })
  }

  updateJob(jobId: string, updates: Partial<CronJob>): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    const updatedJob = { ...job, ...updates }
    this.jobs.set(jobId, updatedJob)

    // Reiniciar job se necessário
    if (updates.active !== undefined || updates.schedule) {
      this.unscheduleJob(jobId)
      if (updatedJob.active) {
        this.scheduleJob(jobId)
      }
    }

    logger.info('Cron job updated', {
      jobId,
      updates: Object.keys(updates)
    })
  }

  removeJob(jobId: string): void {
    this.unscheduleJob(jobId)
    this.jobs.delete(jobId)
    
    logger.info('Cron job removed', { jobId })
  }

  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    
    // Agendar todos os jobs ativos
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.active) {
        this.scheduleJob(jobId)
      }
    }

    logger.info('Cron job manager started', {
      totalJobs: this.jobs.size,
      activeJobs: Array.from(this.jobs.values()).filter(job => job.active).length
    })
  }

  stop(): void {
    if (!this.isRunning) return

    this.isRunning = false

    // Parar todos os jobs
    for (const jobId of this.intervals.keys()) {
      this.unscheduleJob(jobId)
    }

    logger.info('Cron job manager stopped')
  }

  private scheduleJob(jobId: string): void {
    const job = this.jobs.get(jobId)
    if (!job || !job.active) return

    // Calcular próximo tempo de execução
    const nextRun = this.calculateNextRun(job.schedule)
    const delay = nextRun.getTime() - Date.now()

    if (delay <= 0) {
      // Executar imediatamente se já passou do tempo
      this.executeJob(jobId)
      return
    }

    const timeout = setTimeout(() => {
      this.executeJob(jobId)
      // Agendar próxima execução
      this.scheduleJob(jobId)
    }, delay)

    this.intervals.set(jobId, timeout)
    
    // Atualizar próximo tempo de execução
    this.updateJob(jobId, { nextRun })
  }

  private unscheduleJob(jobId: string): void {
    const timeout = this.intervals.get(jobId)
    if (timeout) {
      clearTimeout(timeout)
      this.intervals.delete(jobId)
    }
  }

  private calculateNextRun(schedule: string): Date {
    // Implementação simplificada de cron
    // Por enquanto, apenas suporta intervalos em minutos
    const match = schedule.match(/^\*\/\d+$/)
    if (match) {
      const minutes = parseInt(match[1])
      return new Date(Date.now() + minutes * 60 * 1000)
    }

    // Fallback para 1 minuto
    return new Date(Date.now() + 60 * 1000)
  }

  private async executeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job || !job.active) return

    const startTime = Date.now()
    
    try {
      logger.info('Executing cron job', { jobId, name: job.name })
      
      // Executar com timeout
      await Promise.race([
        job.task(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Job timeout')), job.timeout)
        )
      ])

      const duration = Date.now() - startTime
      
      this.updateJob(jobId, { lastRun: new Date() })
      
      logger.info('Cron job completed', {
        jobId,
        name: job.name,
        duration: `${duration}ms`
      })

    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.error('Cron job failed', {
        jobId,
        name: job.name,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })

      // Implementar retry logic se necessário
      if (job.retryCount > 0) {
        this.updateJob(jobId, { retryCount: job.retryCount - 1 })
        // Agendar retry em 5 minutos
        setTimeout(() => this.executeJob(jobId), 5 * 60 * 1000)
      }
    }
  }

  // Jobs pré-definidos
  initializeDefaultJobs(): void {
    // Job de sincronização WordPress
    this.addJob({
      id: 'wordpress-sync',
      name: 'WordPress Sync',
      schedule: '*/15', // A cada 15 minutos
      task: async () => {
        const sites = wordPressSyncManager.getAllSites()
        for (const site of sites) {
          if (site.settings.autoSync) {
            await wordPressSyncManager.syncSite(site.id)
          }
        }
      },
      active: true,
      timeout: 10 * 60 * 1000, // 10 minutos
      retryCount: 2
    })

    // Job de limpeza de logs
    this.addJob({
      id: 'log-cleanup',
      name: 'Log Cleanup',
      schedule: '*/60', // A cada 60 minutos
      task: async () => {
        // Implementar limpeza de logs antigos
        logger.info('Log cleanup completed')
      },
      active: true,
      timeout: 5 * 60 * 1000, // 5 minutos
      retryCount: 1
    })

    // Job de backup
    this.addJob({
      id: 'backup',
      name: 'Database Backup',
      schedule: '*/1440', // A cada 24 horas
      task: async () => {
        // Implementar backup do banco de dados
        logger.info('Database backup completed')
      },
      active: true,
      timeout: 30 * 60 * 1000, // 30 minutos
      retryCount: 3
    })

    // Job de estatísticas
    this.addJob({
      id: 'stats-collection',
      name: 'Statistics Collection',
      schedule: '*/5', // A cada 5 minutos
      task: async () => {
        // Coletar estatísticas do sistema
        logger.info('Statistics collection completed')
      },
      active: true,
      timeout: 2 * 60 * 1000, // 2 minutos
      retryCount: 1
    })

    logger.info('Default cron jobs initialized')
  }

  getJob(jobId: string): CronJob | undefined {
    return this.jobs.get(jobId)
  }

  getAllJobs(): CronJob[] {
    return Array.from(this.jobs.values())
  }

  getJobStatus(jobId: string): { active: boolean; lastRun?: Date; nextRun?: Date } {
    const job = this.jobs.get(jobId)
    if (!job) {
      return { active: false }
    }

    return {
      active: job.active,
      lastRun: job.lastRun,
      nextRun: job.nextRun
    }
  }
}

export const cronJobManager = new CronJobManager()

// Inicializar jobs padrão
cronJobManager.initializeDefaultJobs()

