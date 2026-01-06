/**
 * 📊 LOGGER ESTRUTURADO - Logs JSON padronizados
 * 
 * Responsabilidades:
 * - Logs estruturados em JSON
 * - Campos padronizados
 * - Sem vazar PII
 * 
 * REGRAS:
 * - Sempre JSON
 * - Nunca logar prompt/resposta completos
 * - Usar hashes para dados sensíveis
 */

import { createHash } from 'crypto'
import { CorrelationContext } from './correlation'

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogContext {
  correlationId?: string
  organizationId?: string
  siteId?: string
  userId?: string
  component?: string // api, rag, chat, provider, worker, db
  action?: string // vector_search, rerank, call_provider, claim_jobs, etc.
  durationMs?: number
  provider?: string
  model?: string
  jobId?: string
  promptHash?: string // sha256 do prompt (não o prompt completo)
  inputSizeChars?: number
  chunksUsed?: number
  error?: string
  errorCode?: string
  [key: string]: any // Campos adicionais
}

export class StructuredLogger {
  private component: string
  private correlationId?: string

  /**
   * Construtor para criar instância com contexto
   */
  constructor(component: string, correlationId?: string) {
    this.component = component
    this.correlationId = correlationId
  }

  /**
   * Log info (instância)
   */
  info(message: string, context: LogContext = {}): void {
    StructuredLogger.log('info', message, {
      ...context,
      component: this.component,
      correlationId: this.correlationId || context.correlationId
    })
  }

  /**
   * Log warn (instância)
   */
  warn(message: string, context: LogContext = {}): void {
    StructuredLogger.log('warn', message, {
      ...context,
      component: this.component,
      correlationId: this.correlationId || context.correlationId
    })
  }

  /**
   * Log error (instância)
   */
  error(message: string, context: LogContext = {}): void {
    StructuredLogger.log('error', message, {
      ...context,
      component: this.component,
      correlationId: this.correlationId || context.correlationId
    })
  }

  /**
   * Log debug (instância)
   */
  debug(message: string, context: LogContext = {}): void {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      StructuredLogger.log('debug', message, {
        ...context,
        component: this.component,
        correlationId: this.correlationId || context.correlationId
      })
    }
  }

  /**
   * Log info (estático)
   */
  static info(message: string, context: LogContext = {}): void {
    this.log('info', message, context)
  }

  /**
   * Log warn (estático)
   */
  static warn(message: string, context: LogContext = {}): void {
    this.log('warn', message, context)
  }

  /**
   * Log error (estático)
   */
  static error(message: string, context: LogContext = {}): void {
    this.log('error', message, context)
  }

  /**
   * Log debug (estático)
   */
  static debug(message: string, context: LogContext = {}): void {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      this.log('debug', message, context)
    }
  }

  /**
   * Log genérico
   */
  private static log(level: LogLevel, message: string, context: LogContext = {}): void {
    const logEntry: any = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.sanitizeContext(context)
    }

    // Output JSON
    console.log(JSON.stringify(logEntry))
  }

  /**
   * Sanitiza contexto (remove PII, adiciona hashes)
   */
  private static sanitizeContext(context: LogContext): LogContext {
    const sanitized: LogContext = { ...context }

    // Se tem prompt/resposta, substituir por hash
    if (context.prompt && typeof context.prompt === 'string') {
      sanitized.promptHash = this.hashString(context.prompt)
      sanitized.inputSizeChars = context.prompt.length
      delete sanitized.prompt
    }

    if (context.response && typeof context.response === 'string') {
      sanitized.responseHash = this.hashString(context.response)
      sanitized.responseSizeChars = context.response.length
      delete sanitized.response
    }

    // Limitar tamanho de strings longas
    Object.keys(sanitized).forEach(key => {
      const value = sanitized[key]
      if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '... [truncated]'
      }
    })

    return sanitized
  }

  /**
   * Gera hash SHA256 de string
   */
  static hashString(str: string): string {
    return createHash('sha256').update(str).digest('hex').substring(0, 16) // Primeiros 16 chars
  }

  /**
   * Log com contexto de correlação
   */
  static withCorrelation(
    correlationContext: CorrelationContext,
    component: string
  ) {
    return {
      info: (message: string, context: LogContext = {}) => {
        this.info(message, {
          ...context,
          correlationId: correlationContext.correlationId,
          organizationId: correlationContext.organizationId,
          siteId: correlationContext.siteId,
          userId: correlationContext.userId,
          component
        })
      },
      warn: (message: string, context: LogContext = {}) => {
        this.warn(message, {
          ...context,
          correlationId: correlationContext.correlationId,
          organizationId: correlationContext.organizationId,
          siteId: correlationContext.siteId,
          userId: correlationContext.userId,
          component
        })
      },
      error: (message: string, context: LogContext = {}) => {
        this.error(message, {
          ...context,
          correlationId: correlationContext.correlationId,
          organizationId: correlationContext.organizationId,
          siteId: correlationContext.siteId,
          userId: correlationContext.userId,
          component
        })
      },
      debug: (message: string, context: LogContext = {}) => {
        this.debug(message, {
          ...context,
          correlationId: correlationContext.correlationId,
          organizationId: correlationContext.organizationId,
          siteId: correlationContext.siteId,
          userId: correlationContext.userId,
          component
        })
      }
    }
  }
}






