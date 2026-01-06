interface RateLimitConfig {
  requestsPerMinute: number
  burst: number
  windowMs: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  isAllowed(key: string): boolean {
    const now = Date.now()
    const entry = this.limits.get(key)

    if (!entry || now > entry.resetTime) {
      // Reset ou criar nova entrada
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      })
      return true
    }

    if (entry.count >= this.config.requestsPerMinute) {
      return false
    }

    entry.count++
    return true
  }

  getRemainingRequests(key: string): number {
    const entry = this.limits.get(key)
    if (!entry || Date.now() > entry.resetTime) {
      return this.config.requestsPerMinute
    }
    return Math.max(0, this.config.requestsPerMinute - entry.count)
  }

  getResetTime(key: string): number {
    const entry = this.limits.get(key)
    return entry?.resetTime || Date.now() + this.config.windowMs
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key)
      }
    }
  }
}

export const rateLimiter = new RateLimiter({
  requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
  burst: parseInt(process.env.RATE_LIMIT_BURST || '10'),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || `${60 * 1000}`) // padrão 1 minuto
})

// Limpeza automática a cada 5 minutos
setInterval(() => {
  rateLimiter.cleanup()
}, 5 * 60 * 1000)

