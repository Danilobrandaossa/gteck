interface APIUsage {
  requests: number
  tokens: number
  cost: number
  lastUsed: Date
}

class APIUsageTracker {
  private static instance: APIUsageTracker
  private usage: Record<string, APIUsage> = {}

  static getInstance(): APIUsageTracker {
    if (!APIUsageTracker.instance) {
      APIUsageTracker.instance = new APIUsageTracker()
    }
    return APIUsageTracker.instance
  }

  // Simular uso real das APIs
  trackUsage(apiType: string, tokens: number = 0) {
    const now = new Date()
    
    if (!this.usage[apiType]) {
      this.usage[apiType] = {
        requests: 0,
        tokens: 0,
        cost: 0,
        lastUsed: now
      }
    }

    // Incrementar contadores
    this.usage[apiType].requests += 1
    this.usage[apiType].tokens += tokens
    this.usage[apiType].lastUsed = now

    // Calcular custo baseado no tipo de API
    let costPerToken = 0
    switch (apiType) {
      case 'openai':
        costPerToken = 0.00003 // $0.03 per 1K tokens
        break
      case 'gemini':
        costPerToken = 0.00002 // $0.02 per 1K tokens
        break
      case 'koala':
        costPerToken = 0.00001 // $0.01 per 1K tokens
        break
      default:
        costPerToken = 0.00001
    }

    this.usage[apiType].cost += (tokens * costPerToken)

    // Salvar no localStorage
    this.saveToStorage()
  }

  getUsage(apiType: string): APIUsage {
    return this.usage[apiType] || {
      requests: 0,
      tokens: 0,
      cost: 0,
      lastUsed: new Date()
    }
  }

  getAllUsage(): Record<string, APIUsage> {
    return this.usage
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cms-api-usage', JSON.stringify(this.usage))
    }
  }

  loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cms-api-usage')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // Converter strings de data de volta para objetos Date
          Object.keys(parsed).forEach(key => {
            if (parsed[key] && parsed[key].lastUsed) {
              parsed[key].lastUsed = new Date(parsed[key].lastUsed)
            }
          })
          this.usage = parsed
        } catch (error) {
          console.error('Erro ao carregar dados de uso das APIs:', error)
        }
      }
    }
  }

  // Simular uso inicial para demonstração
  initializeDemoData() {
    const now = new Date()
    
    this.usage = {
      openai: {
        requests: Math.floor(Math.random() * 50) + 10,
        tokens: Math.floor(Math.random() * 10000) + 5000,
        cost: Math.random() * 5 + 1,
        lastUsed: new Date(now.getTime() - Math.random() * 86400000) // Últimas 24h
      },
      gemini: {
        requests: Math.floor(Math.random() * 30) + 5,
        tokens: Math.floor(Math.random() * 8000) + 3000,
        cost: Math.random() * 3 + 0.5,
        lastUsed: new Date(now.getTime() - Math.random() * 86400000)
      },
      koala: {
        requests: Math.floor(Math.random() * 20) + 3,
        tokens: Math.floor(Math.random() * 5000) + 2000,
        cost: Math.random() * 2 + 0.3,
        lastUsed: new Date(now.getTime() - Math.random() * 86400000)
      }
    }

    this.saveToStorage()
  }
}

export default APIUsageTracker
