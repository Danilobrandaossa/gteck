import { useState, useEffect } from 'react'
import APIUsageTracker from '@/lib/api-usage-tracker'

interface APIUsage {
  requests: number
  tokens: number
  cost: number
  lastUsed: Date
}

interface APIUsageData {
  openai: APIUsage
  gemini: APIUsage
  koala: APIUsage
}

export function useAPIUsage() {
  const [usageData, setUsageData] = useState<APIUsageData>({
    openai: { requests: 0, tokens: 0, cost: 0, lastUsed: new Date() },
    gemini: { requests: 0, tokens: 0, cost: 0, lastUsed: new Date() },
    koala: { requests: 0, tokens: 0, cost: 0, lastUsed: new Date() }
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setIsLoading(true)
        
        const tracker = APIUsageTracker.getInstance()
        tracker.loadFromStorage()
        
        // Se não há dados, inicializar com dados de demonstração
        const allUsage = tracker.getAllUsage()
        if (Object.keys(allUsage).length === 0) {
          tracker.initializeDemoData()
        }
        
        const updatedUsage = tracker.getAllUsage()
        setUsageData({
          openai: updatedUsage.openai || { requests: 0, tokens: 0, cost: 0, lastUsed: new Date() },
          gemini: updatedUsage.gemini || { requests: 0, tokens: 0, cost: 0, lastUsed: new Date() },
          koala: updatedUsage.koala || { requests: 0, tokens: 0, cost: 0, lastUsed: new Date() }
        })
      } catch (error) {
        console.error('Erro ao buscar dados de uso das APIs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsageData()
  }, [])

  const updateUsage = (apiType: 'openai' | 'gemini' | 'koala', tokens: number = 0) => {
    const tracker = APIUsageTracker.getInstance()
    tracker.trackUsage(apiType, tokens)
    
    const updatedUsage = tracker.getAllUsage()
    setUsageData({
      openai: updatedUsage.openai || { requests: 0, tokens: 0, cost: 0, lastUsed: new Date() },
      gemini: updatedUsage.gemini || { requests: 0, tokens: 0, cost: 0, lastUsed: new Date() },
      koala: updatedUsage.koala || { requests: 0, tokens: 0, cost: 0, lastUsed: new Date() }
    })
  }

  const getUsageForAPI = (apiType: 'openai' | 'gemini' | 'koala') => {
    return usageData[apiType]
  }

  return {
    usageData,
    isLoading,
    updateUsage,
    getUsageForAPI
  }
}
