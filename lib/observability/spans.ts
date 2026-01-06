/**
 * ⏱️ SPANS - Medição de tempo e tracing de fases
 * 
 * Responsabilidades:
 * - Medir tempo de execução de operações
 * - Registrar spans com tags
 * - Integrar com logger estruturado
 * 
 * REGRAS:
 * - Sempre medir tempo
 * - Tags para contexto (provider/model/topN/etc)
 * - Logs estruturados
 */

import { StructuredLogger, LogContext } from './logger'
import { CorrelationContext } from './correlation'

export interface SpanTags {
  provider?: string
  model?: string
  topN?: number
  topK?: number
  efSearch?: number
  chunksConsidered?: number
  chunksSelected?: number
  similarityThreshold?: number
  [key: string]: any
}

export interface SpanResult<T> {
  result: T
  durationMs: number
}

/**
 * Executa função dentro de um span (mede tempo e loga)
 */
export async function withSpan<T>(
  name: string,
  correlationContext: CorrelationContext,
  component: string,
  action: string,
  fn: () => Promise<T>,
  tags?: SpanTags
): Promise<SpanResult<T>> {
  const startTime = Date.now()
  const logger = StructuredLogger.withCorrelation(correlationContext, component)

  // Log início do span
  logger.debug(`Span started: ${name}`, {
    action,
    ...tags
  })

  try {
    // Executar função
    const result = await fn()

    const durationMs = Date.now() - startTime

    // Log fim do span (sucesso)
    logger.info(`Span completed: ${name}`, {
      action,
      durationMs,
      ...tags
    })

    return {
      result,
      durationMs
    }
  } catch (error) {
    const durationMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Log fim do span (erro)
    logger.error(`Span failed: ${name}`, {
      action,
      durationMs,
      error: errorMessage,
      errorCode: error instanceof Error ? error.name : 'UnknownError',
      ...tags
    })

    throw error
  }
}

/**
 * Executa função síncrona dentro de um span
 */
export function withSpanSync<T>(
  name: string,
  correlationContext: CorrelationContext,
  component: string,
  action: string,
  fn: () => T,
  tags?: SpanTags
): SpanResult<T> {
  const startTime = Date.now()
  const logger = StructuredLogger.withCorrelation(correlationContext, component)

  // Log início do span
  logger.debug(`Span started: ${name}`, {
    action,
    ...tags
  })

  try {
    // Executar função
    const result = fn()

    const durationMs = Date.now() - startTime

    // Log fim do span (sucesso)
    logger.info(`Span completed: ${name}`, {
      action,
      durationMs,
      ...tags
    })

    return {
      result,
      durationMs
    }
  } catch (error) {
    const durationMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Log fim do span (erro)
    logger.error(`Span failed: ${name}`, {
      action,
      durationMs,
      error: errorMessage,
      errorCode: error instanceof Error ? error.name : 'UnknownError',
      ...tags
    })

    throw error
  }
}

/**
 * Cria um span aninhado (para composição)
 */
export function createSpan(
  name: string,
  correlationContext: CorrelationContext,
  component: string,
  action: string,
  tags?: SpanTags
) {
  const startTime = Date.now()
  const logger = StructuredLogger.withCorrelation(correlationContext, component)

  logger.debug(`Span started: ${name}`, {
    action,
    ...tags
  })

  return {
    end: (success: boolean = true, error?: Error) => {
      const durationMs = Date.now() - startTime

      if (success) {
        logger.info(`Span completed: ${name}`, {
          action,
          durationMs,
          ...tags
        })
      } else {
        logger.error(`Span failed: ${name}`, {
          action,
          durationMs,
          error: error?.message,
          errorCode: error?.name,
          ...tags
        })
      }

      return durationMs
    },
    log: (message: string, additionalContext?: LogContext) => {
      logger.debug(message, {
        action,
        ...tags,
        ...additionalContext
      })
    }
  }
}









