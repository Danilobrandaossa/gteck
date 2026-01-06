'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export interface APIConfig {
  id: string
  name: string
  type: 'openai' | 'claude' | 'gemini' | 'stable-diffusion' | 'dalle' | 'wordpress' | 'n8n' | 'zapier' | 'webhook'
  status: 'active' | 'inactive' | 'error'
  credentials: {
    apiKey?: string
    endpoint?: string
    username?: string
    password?: string
    token?: string
    webhookUrl?: string
  }
  settings: {
    model?: string
    maxTokens?: number
    temperature?: number
    timeout?: number
    retries?: number
  }
  lastUsed?: Date
  usage: {
    requests: number
    tokens: number
    cost: number
  }
  createdAt: Date
  updatedAt: Date
}

interface APIConfigContextType {
  configs: APIConfig[]
  isLoading: boolean
  error: string | null
  addConfig: (config: Omit<APIConfig, 'id' | 'createdAt' | 'updatedAt' | 'usage'>) => Promise<APIConfig>
  updateConfig: (id: string, updates: Partial<APIConfig>) => Promise<APIConfig>
  deleteConfig: (id: string) => Promise<void>
  testConnection: (id: string) => Promise<boolean>
  getConfig: (type: string) => APIConfig | null
  refreshConfigs: () => Promise<void>
}

const APIConfigContext = createContext<APIConfigContextType | undefined>(undefined)

export function APIConfigProvider({ children }: { children: React.ReactNode }) {
  const [configs, setConfigs] = useState<APIConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dados mock para demonstração
  const mockConfigs: APIConfig[] = [
    {
      id: '1',
      name: 'OpenAI GPT-4',
      type: 'openai',
      status: 'active',
      credentials: {
        apiKey: 'sk-***',
        endpoint: 'https://api.openai.com/v1'
      },
      settings: {
        model: 'gpt-4',
        maxTokens: 4000,
        temperature: 0.7,
        timeout: 30000,
        retries: 3
      },
      lastUsed: new Date('2024-01-15T10:00:00'),
      usage: {
        requests: 1250,
        tokens: 150000,
        cost: 45.50
      },
      createdAt: new Date('2024-01-01T00:00:00'),
      updatedAt: new Date('2024-01-15T10:00:00')
    },
    {
      id: '2',
      name: 'Claude 3 Sonnet',
      type: 'claude',
      status: 'active',
      credentials: {
        apiKey: 'sk-ant-***',
        endpoint: 'https://api.anthropic.com/v1'
      },
      settings: {
        model: 'claude-3-sonnet-20240229',
        maxTokens: 4000,
        temperature: 0.7,
        timeout: 30000,
        retries: 3
      },
      lastUsed: new Date('2024-01-15T09:30:00'),
      usage: {
        requests: 890,
        tokens: 120000,
        cost: 32.40
      },
      createdAt: new Date('2024-01-01T00:00:00'),
      updatedAt: new Date('2024-01-15T09:30:00')
    },
    {
      id: '3',
      name: 'Google Gemini Pro',
      type: 'gemini',
      status: 'active',
      credentials: {
        apiKey: 'AIza***',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta'
      },
      settings: {
        model: 'gemini-pro',
        maxTokens: 8000,
        temperature: 0.7,
        timeout: 30000,
        retries: 3
      },
      lastUsed: new Date('2024-01-15T08:45:00'),
      usage: {
        requests: 650,
        tokens: 95000,
        cost: 18.75
      },
      createdAt: new Date('2024-01-01T00:00:00'),
      updatedAt: new Date('2024-01-15T08:45:00')
    },
    {
      id: '4',
      name: 'Stable Diffusion XL',
      type: 'stable-diffusion',
      status: 'active',
      credentials: {
        apiKey: 'sk-***',
        endpoint: 'https://api.stability.ai/v1'
      },
      settings: {
        model: 'stable-diffusion-xl-1024-v1-0',
        maxTokens: 0,
        temperature: 0.7,
        timeout: 60000,
        retries: 2
      },
      lastUsed: new Date('2024-01-15T07:20:00'),
      usage: {
        requests: 320,
        tokens: 0,
        cost: 25.60
      },
      createdAt: new Date('2024-01-01T00:00:00'),
      updatedAt: new Date('2024-01-15T07:20:00')
    },
    {
      id: '5',
      name: 'Meu Site WordPress',
      type: 'wordpress',
      status: 'active',
      credentials: {
        endpoint: 'https://meusite.com',
        username: 'admin',
        password: '***',
        token: 'wp_***'
      },
      settings: {
        timeout: 30000,
        retries: 3
      },
      lastUsed: new Date('2024-01-15T11:15:00'),
      usage: {
        requests: 2450,
        tokens: 0,
        cost: 0
      },
      createdAt: new Date('2024-01-01T00:00:00'),
      updatedAt: new Date('2024-01-15T11:15:00')
    }
  ]

  const refreshConfigs = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setConfigs(mockConfigs)
    } catch (err) {
      setError('Erro ao carregar configurações de API')
      console.error('Erro ao carregar configurações de API:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const addConfig = async (configData: Omit<APIConfig, 'id' | 'createdAt' | 'updatedAt' | 'usage'>): Promise<APIConfig> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const newConfig: APIConfig = {
        ...configData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: {
          requests: 0,
          tokens: 0,
          cost: 0
        }
      }
      
      setConfigs(prev => [newConfig, ...prev])
      return newConfig
    } catch (err) {
      setError('Erro ao adicionar configuração')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateConfig = async (id: string, updates: Partial<APIConfig>): Promise<APIConfig> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const updatedConfig = {
        ...configs.find(c => c.id === id),
        ...updates,
        updatedAt: new Date()
      } as APIConfig
      
      setConfigs(prev => prev.map(c => c.id === id ? updatedConfig : c))
      return updatedConfig
    } catch (err) {
      setError('Erro ao atualizar configuração')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteConfig = async (id: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      setConfigs(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError('Erro ao deletar configuração')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const config = configs.find(c => c.id === id)
      if (!config) throw new Error('Configuração não encontrada')
      
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simular resultado do teste
      const isConnected = Math.random() > 0.2 // 80% de chance de sucesso
      
      if (isConnected) {
        await updateConfig(id, { 
          status: 'active',
          lastUsed: new Date()
        })
      } else {
        await updateConfig(id, { status: 'error' })
      }
      
      return isConnected
    } catch (err) {
      setError('Erro ao testar conexão')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const getConfig = (type: string): APIConfig | null => {
    return configs.find(c => c.type === type && c.status === 'active') || null
  }

  useEffect(() => {
    refreshConfigs()
  }, [])

  const value: APIConfigContextType = {
    configs,
    isLoading,
    error,
    addConfig,
    updateConfig,
    deleteConfig,
    testConnection,
    getConfig,
    refreshConfigs
  }

  return (
    <APIConfigContext.Provider value={value}>
      {children}
    </APIConfigContext.Provider>
  )
}

export function useAPIConfig() {
  const context = useContext(APIConfigContext)
  if (context === undefined) {
    throw new Error('useAPIConfig deve ser usado dentro de um APIConfigProvider')
  }
  return context
}

