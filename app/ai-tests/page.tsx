'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { 
  Bot, 
  CheckCircle, 
  XCircle, 
  Loader, 
  TestTube,
  Brain,
  Sparkles,
  Settings,
  Play,
  BarChart3
} from 'lucide-react'

interface TestResult {
  api: string
  status: 'testing' | 'success' | 'error'
  response?: any
  error?: string
  duration?: number
  isRealAPI?: boolean
}

interface APIUsage {
  requests: number
  tokens: number
  cost: number
  lastUsed: Date
}

export default function AITestsPage() {
  const [activeTab, setActiveTab] = useState<'tests' | 'usage' | 'settings'>('tests')
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [testPrompt, setTestPrompt] = useState('Crie um título para um artigo sobre inteligência artificial')

  const testAPIs = [
    {
      name: 'OpenAI GPT-4',
      type: 'openai',
      endpoint: '/api/ai/test',
      icon: Brain,
      color: 'bg-green-500',
      description: 'Geração de texto avançada com GPT-4'
    },
    {
      name: 'Google Gemini',
      type: 'gemini', 
      endpoint: '/api/ai/test',
      icon: Sparkles,
      color: 'bg-blue-500',
      description: 'IA multimodal do Google'
    },
  ]

  const runSingleTest = async (api: any) => {
    const startTime = Date.now()
    
    // Atualizar status para testing
    setTestResults(prev => prev.map(result => 
      result.api === api.name 
        ? { ...result, status: 'testing' as const }
        : result
    ))

    try {
      const response = await fetch(api.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: testPrompt,
          model: api.type
        })
      })

      const data = await response.json()
      const duration = Date.now() - startTime

      if (response.ok && data.success) {
        setTestResults(prev => prev.map(result => 
          result.api === api.name 
            ? { 
                ...result, 
                status: 'success' as const,
                response: data,
                duration,
                isRealAPI: data.isRealAPI
              }
            : result
        ))
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (error) {
      const duration = Date.now() - startTime
      setTestResults(prev => prev.map(result => 
        result.api === api.name 
          ? { 
              ...result, 
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Erro desconhecido',
              duration
            }
          : result
      ))
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    
    // Inicializar resultados
    const initialResults = testAPIs.map(api => ({
      api: api.name,
      status: 'testing' as const
    }))
    setTestResults(initialResults)

    // Executar testes em paralelo
    await Promise.all(testAPIs.map(api => runSingleTest(api)))
    
    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'testing':
        return <Loader className="w-4 h-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <TestTube className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'testing':
        return 'border-blue-200 bg-blue-50'
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="cms-p-8">
          {/* Header */}
          <div className="cms-mb-8">
            <div className="cms-flex cms-items-center cms-gap-3 cms-mb-2">
              <Bot className="cms-text-primary" style={{ width: '2rem', height: '2rem' }} />
              <h1 className="cms-text-3xl cms-font-bold cms-text-gray-800 cms-m-0">
                Laboratório de IA
              </h1>
            </div>
            <p className="cms-text-gray-500 cms-text-lg cms-m-0">
              Teste, monitore e configure todas as integrações de IA do CMS
            </p>
          </div>

          {/* Tabs */}
          <div className="cms-flex cms-gap-2 cms-mb-8 cms-border-b cms-border-gray-200 cms-overflow-x-auto cms-pb-2">
            <button
              onClick={() => setActiveTab('tests')}
              className={`cms-px-6 cms-py-3 cms-border-none cms-rounded-t-lg cms-cursor-pointer cms-text-sm cms-font-medium cms-flex cms-items-center cms-gap-2 cms-whitespace-nowrap cms-transition-all ${
                activeTab === 'tests' 
                  ? 'cms-text-white' 
                  : 'cms-text-gray-500'
              }`}
              style={{ 
                backgroundColor: activeTab === 'tests' ? 'var(--primary)' : 'transparent' 
              }}
            >
              <TestTube style={{ width: '1rem', height: '1rem' }} />
              Testes de Conectividade
            </button>
            
            <button
              onClick={() => setActiveTab('usage')}
              className={`cms-px-6 cms-py-3 cms-border-none cms-rounded-t-lg cms-cursor-pointer cms-text-sm cms-font-medium cms-flex cms-items-center cms-gap-2 cms-whitespace-nowrap cms-transition-all ${
                activeTab === 'usage' 
                  ? 'cms-text-white' 
                  : 'cms-text-gray-500'
              }`}
              style={{ 
                backgroundColor: activeTab === 'usage' ? 'var(--primary)' : 'transparent' 
              }}
            >
              <BarChart3 style={{ width: '1rem', height: '1rem' }} />
              Monitoramento de Uso
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`cms-px-6 cms-py-3 cms-border-none cms-rounded-t-lg cms-cursor-pointer cms-text-sm cms-font-medium cms-flex cms-items-center cms-gap-2 cms-whitespace-nowrap cms-transition-all ${
                activeTab === 'settings' 
                  ? 'cms-text-white' 
                  : 'cms-text-gray-500'
              }`}
              style={{ 
                backgroundColor: activeTab === 'settings' ? 'var(--primary)' : 'transparent' 
              }}
            >
              <Settings style={{ width: '1rem', height: '1rem' }} />
              Configurações
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'tests' && (
            <div>
              {/* Configuração do Teste */}
              <div className="cms-card cms-bg-gray-50 cms-p-6 cms-rounded-lg cms-border cms-border-gray-200 cms-mb-8">
                <h2 className="cms-text-xl cms-font-semibold cms-text-gray-700 cms-mb-4">
                  Configuração do Teste
                </h2>
                
                <div className="cms-mb-4">
                  <label className="cms-label">
                    Prompt de Teste:
                  </label>
                  <textarea
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    className="cms-textarea"
                    style={{ minHeight: '80px' }}
                    placeholder="Digite o prompt que será testado em todas as IAs..."
                  />
                </div>

                <button
                  onClick={runAllTests}
                  disabled={isRunning}
                  className={`cms-btn cms-flex cms-items-center cms-gap-2 cms-px-6 cms-py-3 cms-text-sm cms-font-medium cms-text-white ${
                    isRunning ? 'cms-bg-gray-400 cms-cursor-not-allowed' : 'cms-btn-primary'
                  }`}
                >
                  {isRunning ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {isRunning ? 'Testando...' : 'Executar Todos os Testes'}
                </button>
              </div>

              {/* Resultados dos Testes */}
              <div>
                <h2 className="cms-text-xl cms-font-semibold cms-text-gray-700 cms-mb-4">
                  Resultados dos Testes
                </h2>

                <div className="cms-grid cms-gap-4">
                  {testAPIs.map((api, index) => {
                    const result = testResults.find(r => r.api === api.name)
                    const IconComponent = api.icon

                    return (
                      <div
                        key={api.name}
                        className="cms-card cms-bg-white cms-p-6 cms-rounded-lg cms-border"
                        style={{
                          borderColor: result 
                            ? (result.status === 'success' ? 'var(--success)' : 
                               result.status === 'error' ? 'var(--danger)' : 'var(--primary)')
                            : 'var(--gray-200)'
                        }}
                      >
                        <div className="cms-flex cms-items-center cms-justify-between cms-mb-4">
                          <div className="cms-flex cms-items-center cms-gap-3">
                            <div 
                              className="cms-w-10 cms-h-10 cms-rounded cms-flex cms-items-center cms-justify-center cms-text-white"
                              style={{ 
                                backgroundColor: api.color.replace('bg-', '#').replace('-500', '')
                              }}
                            >
                              <IconComponent style={{ width: '1.25rem', height: '1.25rem' }} />
                            </div>
                            <div>
                              <h3 className="cms-text-lg cms-font-semibold cms-text-gray-700 cms-m-0">
                                {api.name}
                              </h3>
                              <p className="cms-text-sm cms-text-gray-500 cms-m-0">
                                {api.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="cms-flex cms-items-center cms-gap-2">
                            {result && (
                              <span className="cms-text-xs cms-text-gray-500 cms-font-mono">
                                {result.duration}ms
                              </span>
                            )}
                            {getStatusIcon(result?.status || 'pending')}
                          </div>
                        </div>

                        {/* Status e Resultado */}
                        {result && (
                          <div>
                            {result.status === 'success' && result.response && (
                              <div className="cms-bg-green-50 cms-border cms-border-green-200 cms-rounded cms-p-4 cms-mb-4">
                                <div className="cms-flex cms-items-center cms-gap-2 cms-mb-2">
                                  <CheckCircle className="cms-text-green-700" style={{ width: '1rem', height: '1rem' }} />
                                  <h4 className="cms-text-sm cms-font-semibold cms-text-green-700 cms-m-0">
                                    Resposta Recebida:
                                  </h4>
                                  {result.isRealAPI && (
                                    <span className="cms-text-xs cms-bg-success cms-text-white cms-px-2 cms-py-1 cms-rounded cms-font-medium">
                                      API REAL
                                    </span>
                                  )}
                                </div>
                                <div className="cms-bg-white cms-p-3 cms-rounded cms-text-sm cms-text-gray-700 cms-border cms-border-gray-300">
                                  {result.response.data?.content || 'Resposta vazia'}
                                </div>
                              </div>
                            )}

                            {result.status === 'error' && (
                              <div className="cms-bg-error-light cms-border cms-border-red-300 cms-rounded cms-p-4">
                                <h4 className="cms-text-sm cms-font-semibold cms-text-danger cms-mb-2">
                                  ❌ Erro:
                                </h4>
                                <p className="cms-text-sm cms-text-danger cms-m-0">
                                  {result.error}
                                </p>
                              </div>
                            )}

                            {result.status === 'testing' && (
                              <div className="cms-bg-blue-50 cms-border cms-border-blue-200 cms-rounded cms-p-4 cms-flex cms-items-center cms-gap-2">
                                <Loader className="w-4 h-4 animate-spin cms-text-primary" />
                                <span className="cms-text-sm cms-text-primary">
                                  Testando conexão...
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Botão de Teste Individual */}
                        <div className="cms-mt-4">
                          <button
                            onClick={() => runSingleTest(api)}
                            disabled={isRunning}
                            className={`cms-btn cms-flex cms-items-center cms-gap-2 cms-px-4 cms-py-2 cms-text-sm cms-font-medium ${
                              isRunning ? 'cms-bg-gray-100 cms-text-gray-400 cms-cursor-not-allowed' : 'cms-btn-secondary'
                            }`}
                          >
                            <TestTube style={{ width: '1rem', height: '1rem' }} />
                            Testar Individualmente
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Resumo dos Resultados */}
              {testResults.length > 0 && (
                <div className="cms-card cms-bg-gray-50 cms-p-6 cms-rounded-lg cms-border cms-border-gray-200 cms-mt-8">
                  <h3 className="cms-text-lg cms-font-semibold cms-text-gray-700 cms-mb-4">
                    Resumo dos Testes
                  </h3>
                  
                  <div className="cms-grid cms-gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className="cms-text-center">
                      <div className="cms-text-3xl cms-font-bold cms-text-success">
                        {testResults.filter(r => r.status === 'success').length}
                      </div>
                      <div className="cms-text-sm cms-text-gray-500">Sucessos</div>
                    </div>
                    
                    <div className="cms-text-center">
                      <div className="cms-text-3xl cms-font-bold cms-text-danger">
                        {testResults.filter(r => r.status === 'error').length}
                      </div>
                      <div className="cms-text-sm cms-text-gray-500">Erros</div>
                    </div>
                    
                    <div className="cms-text-center">
                      <div className="cms-text-3xl cms-font-bold cms-text-primary">
                        {testResults.filter(r => r.status === 'testing').length}
                      </div>
                      <div className="cms-text-sm cms-text-gray-500">Testando</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'usage' && (
            <div>
              <h2 className="cms-text-xl cms-font-semibold cms-text-gray-700 cms-mb-4">
                Monitoramento de Uso das IAs
              </h2>
              
              <div className="cms-card cms-bg-gray-50 cms-p-6 cms-rounded-lg cms-border cms-border-gray-200">
                <p className="cms-text-gray-500 cms-text-center cms-m-0">
                  Em desenvolvimento - Em breve você poderá monitorar o uso real das APIs aqui
                </p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="cms-text-xl cms-font-semibold cms-text-gray-700 cms-mb-4">
                Configurações das APIs de IA
              </h2>
              
              <div className="cms-card cms-bg-gray-50 cms-p-6 cms-rounded-lg cms-border cms-border-gray-200">
                <p className="cms-text-gray-500 cms-text-center cms-m-0">
                  Acesse <a href="/settings" className="cms-text-primary" style={{ textDecoration: 'underline' }}>Configurações {'>'} APIs {'&'} IAs</a> para gerenciar as chaves das APIs
                </p>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
