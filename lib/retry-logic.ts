interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  onRetry?: (error: Error, attempt: number) => void
}

export class RetryLogic {
  private config: RetryConfig

  constructor(config: RetryConfig) {
    this.config = config
  }

  async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = this.config.maxRetries,
      baseDelay = this.config.baseDelay,
      maxDelay = this.config.maxDelay,
      backoffMultiplier = this.config.backoffMultiplier,
      onRetry
    } = options

    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        if (attempt === maxRetries) {
          throw lastError
        }

        // Calcular delay com backoff exponencial
        const delay = Math.min(
          baseDelay * Math.pow(backoffMultiplier, attempt),
          maxDelay
        )

        // Adicionar jitter para evitar thundering herd
        const jitter = Math.random() * 0.1 * delay
        const finalDelay = delay + jitter

        if (onRetry) {
          onRetry(lastError, attempt + 1)
        }

        console.log(`Tentativa ${attempt + 1} falhou, tentando novamente em ${Math.round(finalDelay)}ms...`)
        await this.sleep(finalDelay)
      }
    }

    throw lastError!
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Configurações padrão para diferentes tipos de operações
export const retryConfigs = {
  ai: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  },
  wordpress: {
    maxRetries: 5,
    baseDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 1.5
  },
  webhook: {
    maxRetries: 2,
    baseDelay: 2000,
    maxDelay: 8000,
    backoffMultiplier: 2
  },
  database: {
    maxRetries: 3,
    baseDelay: 100,
    maxDelay: 1000,
    backoffMultiplier: 2
  }
}

export const retryLogic = new RetryLogic(retryConfigs.ai)

