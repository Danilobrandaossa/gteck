'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader,
  Brain,
  Shield,
  Link,
  Eye,
  BarChart3,
  Clock,
  Star,
  TrendingUp,
  FileText,
  Settings,
  Play,
  Download,
  RefreshCw,
  Terminal
} from 'lucide-react'

interface DiagnosticResult {
  seo: {
    meta_tags: boolean
    titles: boolean
    headings: boolean
    performance: number
    indexacao: boolean
    score: number
  }
  compliance: {
    termos: boolean
    politica_privacidade: boolean
    contato: boolean
    sobre: boolean
    score: number
  }
  seguranca: {
    ssl: boolean
    headers: boolean
    plugins_vulneraveis: string[]
    score: number
  }
  links_quebrados: Array<{
    url: string
    status: number
    page: string
  }>
  anuncios_sensiveis: {
    termos_com_anuncios: boolean
    politica_com_anuncios: boolean
    contato_com_anuncios: boolean
    score: number
  }
  usabilidade: {
    acessibilidade: boolean
    design_responsivo: boolean
    ux_score: number
  }
}

export default function WordPressDiagnosticAIPage() {
  const [siteUrl, setSiteUrl] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [feedback, setFeedback] = useState('')
  const [actionsCorrected, setActionsCorrected] = useState(false)
  const [diagnosticType, setDiagnosticType] = useState<'simple' | 'compliance' | 'complete'>('simple')
  const [logMessages, setLogMessages] = useState<string[]>([])
  const [diagnosticHistory, setDiagnosticHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [investigationMode, setInvestigationMode] = useState<'standard' | 'investigate' | 'agent'>('standard')
  const [investigationResult, setInvestigationResult] = useState<any>(null)

  const addLogMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogMessages(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const runDiagnostic = async () => {
    if (!siteUrl) return

    setIsRunning(true)
    setResult(null)
    setInvestigationResult(null)
    setLogMessages([])

    try {
      addLogMessage('🚀 Iniciando diagnóstico...')
      addLogMessage(`📊 Tipo: ${diagnosticType === 'simple' ? 'Diagnóstico Simples' : diagnosticType === 'compliance' ? 'Diagnóstico Compliance' : 'Diagnóstico Completo'}`)
      addLogMessage(`🌐 Site: ${siteUrl}`)
      addLogMessage(`🔍 Modo: ${investigationMode === 'standard' ? 'Padrão' : investigationMode === 'investigate' ? 'Investigar' : 'Modo Agente'}`)

      if (investigationMode === 'investigate' || investigationMode === 'agent') {
        addLogMessage('🔍 Executando investigação avançada...')
        const investigationResponse = await fetch('/api/wordpress/investigate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteUrl,
            investigationType: 'deep_analysis',
            focusAreas: ['security', 'performance', 'seo', 'compliance'],
            priority: 'high',
            mode: investigationMode
          })
        })

        addLogMessage('📡 Processando resposta da investigação...')
        const investigationData = await investigationResponse.json()
        
        if (investigationData.success) {
          addLogMessage('✅ Investigação concluída com sucesso!')
          setInvestigationResult(investigationData.data)
        } else {
          addLogMessage(`❌ Erro na investigação: ${investigationData.error}`)
        }
      } else {
        addLogMessage('🤖 Conectando com GPT-4o-mini...')
        const response = await fetch('/api/ai/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'openai', // Usar GPT-4o-mini para análise estruturada
            prompt: siteUrl,
            type: 'wordpress_diagnostic',
            diagnosticType: diagnosticType
          })
        })

        addLogMessage('📡 Processando resposta da IA...')
        const data = await response.json()
        
        if (data.success) {
          addLogMessage('✅ Análise concluída com sucesso!')
          addLogMessage('📋 Gerando relatório...')
          
          // Parse do resultado do diagnóstico
          try {
            let diagnosticResult
            if (typeof data.content === 'string') {
              diagnosticResult = JSON.parse(data.content)
            } else {
              diagnosticResult = data.content
            }
            setResult(diagnosticResult)
          } catch (parseError) {
            addLogMessage(`⚠️ Erro ao processar resposta da IA: ${parseError instanceof Error ? parseError.message : 'Erro desconhecido'}`)
            addLogMessage('🔄 Gerando resultado padrão...')
            
            // Gerar resultado padrão se o parsing falhar
            const defaultResult = {
              seo: {
                meta_tags: false,
                titles: false,
                headings: false,
                performance: 0,
                indexacao: false,
                score: 0
              },
              compliance: {
                termos: false,
                politica_privacidade: false,
                contato: false,
                sobre: false,
                score: 0
              },
              seguranca: {
                ssl: false,
                headers: false,
                plugins_vulneraveis: [],
                score: 0
              },
              links_quebrados: [],
              anuncios_sensiveis: {
                termos_com_anuncios: false,
                politica_com_anuncios: false,
                contato_com_anuncios: false,
                score: 0
              },
              usabilidade: {
                acessibilidade: false,
                design_responsivo: false,
                ux_score: 0
              }
            }
            setResult(defaultResult)
          }

          addLogMessage('💾 Salvando no banco de dados...')
          // Salvar no banco de dados
          await fetch('/api/wordpress/diagnostic/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data_execucao: new Date().toISOString(),
              resultado: result,
              acoes_corrigidas: false,
              site_url: siteUrl,
              tipo_diagnostico: diagnosticType
            })
          })

          addLogMessage('🎉 Diagnóstico finalizado!')
        } else {
          addLogMessage(`❌ Erro: ${data.error}`)
        }
      }
    } catch (error) {
      addLogMessage(`💥 Erro crítico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      console.error('Erro no diagnóstico:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const loadDiagnosticHistory = async () => {
    try {
      const response = await fetch('/api/wordpress/diagnostic/save')
      const data = await response.json()
      if (data.success) {
        setDiagnosticHistory(data.diagnostics)
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    }
  }

  const saveFeedback = async () => {
    if (!result) return

    try {
      await fetch('/api/wordpress/diagnostic/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_execucao: new Date().toISOString(),
          resultado: result,
          acoes_corrigidas: actionsCorrected,
          feedback_usuario: feedback,
          site_url: siteUrl
        })
      })

      alert('Feedback salvo com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar feedback:', error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'cms-text-success'
    if (score >= 60) return 'cms-text-warning'
    return 'cms-text-danger'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (score >= 60) return <AlertTriangle className="w-5 h-5 text-yellow-600" />
    return <XCircle className="w-5 h-5 text-red-600" />
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="cms-p-8 cms-container">
          {/* Header */}
          <div className="cms-mb-8">
            <h1 className="cms-text-3xl cms-font-bold cms-text-gray-800 cms-flex cms-items-center cms-gap-3 cms-mb-2">
              <Brain className="w-8 h-8 cms-text-primary" />
              Diagnóstico WordPress com IA
            </h1>
            <p className="cms-text-gray-500 cms-text-lg">
              Análise completa e inteligente do seu site WordPress usando IA avançada
            </p>
          </div>

          {/* Input Section */}
          <div className="cms-card cms-bg-white cms-p-6 cms-rounded-lg cms-border cms-border-gray-200 cms-mb-8">
            <div className="cms-flex cms-gap-4 cms-items-end cms-mb-4">
              <div className="cms-flex-1">
                <label className="cms-label">
                  URL do Site WordPress
                </label>
                <input
                  type="url"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://seusite.com"
                  className="cms-input cms-text-base"
                />
              </div>
            </div>

            {/* Botões de Tipo de Diagnóstico */}
            <div className="cms-flex cms-gap-4 cms-mb-4">
              <button
                onClick={() => setDiagnosticType('simple')}
                className={`cms-btn cms-flex cms-items-center cms-gap-2 cms-px-4 cms-py-3 cms-text-sm cms-font-medium ${
                  diagnosticType === 'simple' 
                    ? 'cms-btn-primary' 
                    : 'cms-btn-secondary'
                }`}
              >
                <Search className="w-4 h-4" />
                Diagnóstico Simples
              </button>

              <button
                onClick={() => setDiagnosticType('compliance')}
                className={`cms-btn cms-flex cms-items-center cms-gap-2 cms-px-4 cms-py-3 cms-text-sm cms-font-medium ${
                  diagnosticType === 'compliance' 
                    ? 'cms-btn-primary' 
                    : 'cms-btn-secondary'
                }`}
              >
                <Shield className="w-4 h-4" />
                Diagnóstico Compliance
              </button>
            </div>

            {/* Botões de Modo de Investigação */}
            <div className="cms-flex cms-gap-4 cms-mb-4">
              <button
                onClick={() => setInvestigationMode('standard')}
                className={`cms-btn cms-flex cms-items-center cms-gap-2 cms-px-4 cms-py-3 cms-text-sm cms-font-medium ${
                  investigationMode === 'standard' 
                    ? 'cms-text-white' 
                    : 'cms-btn-secondary'
                }`}
                style={{ 
                  backgroundColor: investigationMode === 'standard' ? 'var(--success)' : undefined 
                }}
              >
                <Brain className="w-4 h-4" />
                Padrão
              </button>

              <button
                onClick={() => setInvestigationMode('investigate')}
                className={`cms-btn cms-flex cms-items-center cms-gap-2 cms-px-4 cms-py-3 cms-text-sm cms-font-medium ${
                  investigationMode === 'investigate' 
                    ? 'cms-bg-error cms-text-white' 
                    : 'cms-btn-secondary'
                }`}
              >
                <Search className="w-4 h-4" />
                🔍 Investigar
              </button>

              <button
                onClick={() => setInvestigationMode('agent')}
                className={`cms-btn cms-flex cms-items-center cms-gap-2 cms-px-4 cms-py-3 cms-text-sm cms-font-medium ${
                  investigationMode === 'agent' 
                    ? 'cms-bg-purple cms-text-white' 
                    : 'cms-btn-secondary'
                }`}
              >
                <Brain className="w-4 h-4" />
                🤖 Modo Agente
              </button>
            </div>

            {/* Botão Executar Diagnóstico Completo */}
            <div className="cms-flex cms-gap-4 cms-items-center">
              <button
                onClick={runDiagnostic}
                disabled={isRunning || !siteUrl}
                className={`cms-btn cms-flex cms-items-center cms-gap-2 cms-px-8 cms-py-4 cms-text-base cms-font-semibold cms-flex-1 ${
                  isRunning || !siteUrl 
                    ? 'cms-bg-gray-400 cms-text-white cms-cursor-not-allowed' 
                    : 'cms-text-white'
                }`}
                style={{ 
                  backgroundColor: isRunning || !siteUrl ? 'var(--gray-400)' : 'var(--success)' 
                }}
              >
                {isRunning ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                Executar Diagnóstico Completo
              </button>

              <button
                onClick={() => {
                  setShowHistory(!showHistory)
                  if (!showHistory) loadDiagnosticHistory()
                }}
                className={`cms-btn cms-flex cms-items-center cms-gap-2 cms-px-6 cms-py-4 cms-text-sm cms-font-medium ${
                  showHistory 
                    ? 'cms-text-white' 
                    : 'cms-btn-secondary'
                }`}
                style={{ 
                  backgroundColor: showHistory ? 'var(--gray-500)' : undefined 
                }}
              >
                <Clock className="w-4 h-4" />
                {showHistory ? 'Ocultar' : 'Histórico'}
              </button>
            </div>
          </div>

          {/* Log em Tempo Real */}
          {logMessages.length > 0 && (
            <div className="cms-bg-gray-800 cms-text-gray-50 cms-p-4 cms-rounded-lg cms-mb-8 cms-overflow-y-auto cms-font-mono cms-text-sm cms-max-h-48">
              <div className="cms-flex cms-items-center cms-gap-2 cms-mb-2">
                <Terminal className="w-4 h-4" />
                <span className="cms-font-semibold">Log em Tempo Real</span>
              </div>
              {logMessages.map((message, index) => (
                <div key={index} className="cms-mb-1">
                  {message}
                </div>
              ))}
            </div>
          )}

          {/* Histórico de Diagnósticos */}
          {showHistory && (
            <div className="cms-card cms-bg-white cms-p-6 cms-rounded-lg cms-border cms-border-gray-200 cms-mb-8">
              <h3 className="cms-text-xl cms-font-semibold cms-text-gray-800 cms-mb-4">
                📊 Histórico de Diagnósticos
              </h3>
              
              {diagnosticHistory.length > 0 ? (
                <div className="cms-grid cms-gap-4">
                  {diagnosticHistory.map((diagnostic, index) => (
                    <div key={index} className="cms-p-4 cms-border cms-border-gray-200 cms-rounded cms-bg-gray-50">
                      <div className="cms-flex cms-justify-between cms-items-center cms-mb-2">
                        <div className="cms-font-semibold cms-text-gray-800">
                          {diagnostic.siteUrl || 'Site não especificado'}
                        </div>
                        <div className="cms-text-sm cms-text-gray-500">
                          {new Date(diagnostic.dataExecucao).toLocaleString()}
                        </div>
                      </div>
                      <div className="cms-text-sm cms-text-gray-500">
                        Tipo: {diagnostic.tipo_diagnostico || 'Completo'} | 
                        Ações Corrigidas: {diagnostic.acoesCorrigidas ? 'Sim' : 'Não'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="cms-text-center cms-text-gray-500 cms-p-8">
                  Nenhum diagnóstico encontrado
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="cms-grid cms-gap-6">
              {/* Resumo Executivo */}
              <div className="cms-card cms-bg-white cms-p-6 cms-rounded-lg cms-border cms-border-gray-200">
                <h3 className="cms-text-xl cms-font-semibold cms-text-gray-800 cms-mb-4">
                  📋 Resumo Executivo
                </h3>
                
                <div className="cms-grid cms-gap-4 cms-mb-6 cms-grid-cols-3">
                  <div className="cms-text-center cms-p-4 cms-rounded cms-bg-error-light">
                    <div className="cms-text-3xl cms-font-bold cms-text-danger">
                      {result.links_quebrados.length}
                    </div>
                    <div className="cms-text-sm cms-font-medium cms-text-danger">
                      Erros Encontrados
                    </div>
                  </div>
                  
                  <div className="cms-text-center cms-p-4 cms-rounded cms-bg-warning-light">
                    <div className="cms-text-3xl cms-font-bold cms-text-warning">
                      {Object.values(result).filter(v => typeof v === 'object' && v !== null && 'score' in v).length}
                    </div>
                    <div className="cms-text-sm cms-font-medium cms-text-warning">
                      Áreas com Pendências
                    </div>
                  </div>
                  
                  <div className="cms-text-center cms-p-4 cms-rounded cms-bg-success-light">
                    <div className="cms-text-3xl cms-font-bold cms-text-success">
                      {Math.round((result.seo.score + result.compliance.score + result.seguranca.score + result.usabilidade.ux_score) / 4)}
                    </div>
                    <div className="cms-text-sm cms-font-medium cms-text-success">
                      Score Geral
                    </div>
                  </div>
                </div>

                {/* Lista de Erros Críticos */}
                <div className="cms-mb-4">
                  <h4 className="cms-text-base cms-font-semibold cms-text-danger cms-mb-2">
                    🚨 Erros Críticos
                  </h4>
                  <div className="cms-grid cms-gap-2">
                    {!result.seguranca.ssl && (
                      <div className="cms-flex cms-items-center cms-gap-2 cms-text-danger">
                        <XCircle className="w-4 h-4" />
                        <span>Certificado SSL ausente</span>
                      </div>
                    )}
                    {result.seguranca.plugins_vulneraveis.length > 0 && (
                      <div className="cms-flex cms-items-center cms-gap-2 cms-text-danger">
                        <XCircle className="w-4 h-4" />
                        <span>{result.seguranca.plugins_vulneraveis.length} plugins vulneráveis</span>
                      </div>
                    )}
                    {result.links_quebrados.length > 0 && (
                      <div className="cms-flex cms-items-center cms-gap-2 cms-text-danger">
                        <XCircle className="w-4 h-4" />
                        <span>{result.links_quebrados.length} links quebrados</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lista de Pendências */}
                <div className="cms-mb-4">
                  <h4 className="cms-text-base cms-font-semibold cms-text-warning cms-mb-2">
                    ⚠️ Pendências
                  </h4>
                  <div className="cms-grid cms-gap-2">
                    {!result.compliance.termos && (
                      <div className="cms-flex cms-items-center cms-gap-2 cms-text-warning">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Página de Termos de Uso ausente</span>
                      </div>
                    )}
                    {!result.compliance.politica_privacidade && (
                      <div className="cms-flex cms-items-center cms-gap-2 cms-text-warning">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Política de Privacidade ausente</span>
                      </div>
                    )}
                    {!result.seo.meta_tags && (
                      <div className="cms-flex cms-items-center cms-gap-2 cms-text-warning">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Meta tags não configuradas</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lista de Melhorias */}
                <div>
                  <h4 className="cms-text-base cms-font-semibold cms-text-success cms-mb-2">
                    💡 Melhorias Sugeridas
                  </h4>
                  <div className="cms-grid cms-gap-2">
                    {result.seo.performance > 3000 && (
                      <div className="cms-flex cms-items-center cms-gap-2 cms-text-success">
                        <TrendingUp className="w-4 h-4" />
                        <span>Otimizar performance (atual: {result.seo.performance}ms)</span>
                      </div>
                    )}
                    {result.usabilidade.ux_score < 80 && (
                      <div className="cms-flex cms-items-center cms-gap-2 cms-text-success">
                        <TrendingUp className="w-4 h-4" />
                        <span>Melhorar experiência do usuário (score: {result.usabilidade.ux_score}/100)</span>
                      </div>
                    )}
                    {result.anuncios_sensiveis.score < 100 && (
                      <div className="cms-flex cms-items-center cms-gap-2 cms-text-success">
                        <TrendingUp className="w-4 h-4" />
                        <span>Remover anúncios de páginas institucionais</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* SEO Analysis */}
              <div className="cms-card cms-bg-white cms-p-6 cms-rounded-lg cms-border cms-border-gray-200">
                <div className="cms-flex cms-items-center cms-gap-3 cms-mb-4">
                  <Search className="w-6 h-6 cms-text-primary" />
                  <h3 className="cms-text-xl cms-font-semibold cms-text-gray-800">
                    Análise SEO
                  </h3>
                  <div className="cms-ml-auto cms-flex cms-items-center cms-gap-2">
                    {getScoreIcon(result.seo.score)}
                    <span className={`${getScoreColor(result.seo.score)} cms-font-semibold-600`}>
                      {result.seo.score}/100
                    </span>
                  </div>
                </div>
                
                <div className="cms-grid cms-gap-4 cms-mb-4 cms-grid-cols-2">
                  <div className="cms-flex cms-items-center cms-gap-2">
                    {result.seo.meta_tags ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Meta Tags</span>
                  </div>
                  <div className="cms-flex cms-items-center cms-gap-2">
                    {result.seo.titles ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Títulos</span>
                  </div>
                  <div className="cms-flex cms-items-center cms-gap-2">
                    {result.seo.headings ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Estrutura de Headings</span>
                  </div>
                  <div className="cms-flex cms-items-center cms-gap-2">
                    {result.seo.indexacao ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Indexação</span>
                  </div>
                </div>
                <div className="cms-mt-4 cms-p-3 cms-bg-gray-100 cms-rounded">
                  <strong>Performance:</strong> {result.seo.performance}ms
                </div>
              </div>

              {/* Compliance Analysis */}
              <div className="cms-card cms-bg-white cms-p-6 cms-rounded-lg cms-border cms-border-gray-200">
                <div className="cms-flex cms-items-center cms-gap-3 cms-mb-4">
                  <FileText className="w-6 h-6 text-green-600" />
                  <h3 className="cms-text-xl cms-font-semibold cms-text-gray-800">
                    Conformidade Legal
                  </h3>
                  <div className="cms-ml-auto cms-flex cms-items-center cms-gap-2">
                    {getScoreIcon(result.compliance.score)}
                    <span className={`${getScoreColor(result.compliance.score)} cms-font-semibold-600`}>
                      {result.compliance.score}/100
                    </span>
                  </div>
                </div>
                
                <div className="cms-grid cms-gap-4 cms-grid-cols-2">
                  <div className="cms-flex cms-items-center cms-gap-2">
                    {result.compliance.termos ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Termos de Uso</span>
                  </div>
                  <div className="cms-flex cms-items-center cms-gap-2">
                    {result.compliance.politica_privacidade ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Política de Privacidade</span>
                  </div>
                  <div className="cms-flex cms-items-center cms-gap-2">
                    {result.compliance.contato ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Página de Contato</span>
                  </div>
                  <div className="cms-flex cms-items-center cms-gap-2">
                    {result.compliance.sobre ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Página Sobre</span>
                  </div>
                </div>
              </div>

              {/* Security Analysis */}
              <div className="cms-card cms-bg-white cms-p-6 cms-rounded-lg cms-border cms-border-gray-200">
                <div className="cms-flex cms-items-center cms-gap-3 cms-mb-4">
                  <Shield className="w-6 h-6 text-red-600" />
                  <h3 className="cms-text-xl cms-font-semibold cms-text-gray-800">
                    Segurança
                  </h3>
                  <div className="cms-ml-auto cms-flex cms-items-center cms-gap-2">
                    {getScoreIcon(result.seguranca.score)}
                    <span className={`${getScoreColor(result.seguranca.score)} cms-font-semibold-600`}>
                      {result.seguranca.score}/100
                    </span>
                  </div>
                </div>
                
                <div className="cms-grid cms-gap-4 cms-mb-4 cms-grid-cols-2">
                  <div className="cms-flex cms-items-center cms-gap-2">
                    {result.seguranca.ssl ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Certificado SSL</span>
                  </div>
                  <div className="cms-flex cms-items-center cms-gap-2">
                    {result.seguranca.headers ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Headers de Segurança</span>
                  </div>
                </div>
                
                {result.seguranca.plugins_vulneraveis.length > 0 && (
                  <div className="cms-mt-4 cms-p-3 cms-rounded cms-bg-error-light">
                    <strong className="cms-text-error">Plugins Vulneráveis:</strong>
                    <ul className="cms-mt-2 cms-text-error">
                      {result.seguranca.plugins_vulneraveis.map((plugin, index) => (
                        <li key={index}>• {plugin}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Broken Links */}
              {result.links_quebrados.length > 0 && (
                <div className="cms-card cms-bg-white cms-p-6 cms-rounded-lg cms-border cms-border-gray-200">
                  <div className="cms-flex cms-items-center cms-gap-3 cms-mb-4">
                    <Link className="w-6 h-6 text-orange-600" />
                    <h3 className="cms-text-xl cms-font-semibold cms-text-gray-800">
                      Links Quebrados ({result.links_quebrados.length})
                    </h3>
                  </div>
                  
                  <div className="cms-overflow-y-auto cms-max-h-48">
                    {result.links_quebrados.map((link, index) => (
                      <div key={index} className="cms-p-2 cms-border-b cms-border-gray-100 cms-flex cms-justify-between cms-items-center">
                        <div>
                          <div className="cms-font-medium">{link.url}</div>
                          <div className="cms-text-sm cms-text-gray-500">Página: {link.page}</div>
                        </div>
                        <span className={`cms-font-medium ${
                          link.status === 404 ? 'cms-text-danger' : 'cms-text-gray-500'
                        }`}>
                          {link.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sensitive Ads */}
              <div className="cms-card cms-bg-white cms-p-6 cms-rounded-lg cms-border cms-border-gray-200">
                <div className="cms-flex cms-items-center cms-gap-3 cms-mb-4">
                  <Eye className="w-6 h-6 text-purple-600" />
                  <h3 className="cms-text-xl cms-font-semibold cms-text-gray-800">
                    Anúncios Sensíveis
                  </h3>
                  <div className="cms-ml-auto cms-flex cms-items-center cms-gap-2">
                    {getScoreIcon(result.anuncios_sensiveis.score)}
                    <span className={`${getScoreColor(result.anuncios_sensiveis.score)} cms-font-semibold-600`}>
                      {result.anuncios_sensiveis.score}/100
                    </span>
                  </div>
                </div>
                
                <div className="cms-grid cms-gap-4 cms-grid-cols-2">
                  <div className="cms-flex cms-items-center cms-gap-2">
                    {result.anuncios_sensiveis.termos_com_anuncios ? <XCircle className="w-4 h-4 text-red-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                    <span>Termos sem anúncios</span>
                  </div>
                  <div className="cms-flex cms-items-center cms-gap-2">
                    {result.anuncios_sensiveis.politica_com_anuncios ? <XCircle className="w-4 h-4 text-red-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                    <span>Política sem anúncios</span>
                  </div>
                  <div className="cms-flex cms-items-center cms-gap-2">
                    {result.anuncios_sensiveis.contato_com_anuncios ? <XCircle className="w-4 h-4 text-red-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                    <span>Contato sem anúncios</span>
                  </div>
                </div>
              </div>

              {/* Usability */}
              <div className="cms-card cms-bg-white cms-p-6 cms-rounded-lg cms-border cms-border-gray-200">
                <div className="cms-flex cms-items-center cms-gap-3 cms-mb-4">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                  <h3 className="cms-text-xl cms-font-semibold cms-text-gray-800">
                    Usabilidade
                  </h3>
                  <div className="cms-ml-auto cms-flex cms-items-center cms-gap-2">
                    {getScoreIcon(result.usabilidade.ux_score)}
                    <span className={`${getScoreColor(result.usabilidade.ux_score)} cms-font-semibold-600`}>
                      {result.usabilidade.ux_score}/100
                    </span>
                  </div>
                </div>
                
                <div className="cms-grid cms-gap-4 cms-grid-cols-2">
                  <div className="cms-flex cms-items-center cms-gap-2">
                    {result.usabilidade.acessibilidade ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Acessibilidade (WCAG)</span>
                  </div>
                  <div className="cms-flex cms-items-center cms-gap-2">
                    {result.usabilidade.design_responsivo ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Design Responsivo</span>
                  </div>
                </div>
              </div>

              {/* Feedback Section */}
              <div className="cms-card cms-bg-white cms-p-6 cms-rounded-lg cms-border cms-border-gray-200">
                <h3 className="cms-text-xl cms-font-semibold cms-text-gray-800 cms-mb-4">
                  Feedback e Aprendizado
                </h3>
                
                <div className="cms-flex-col cms-gap-4">
                  <div>
                    <label className="cms-label">
                      Comentários sobre o diagnóstico
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Compartilhe sua opinião sobre o diagnóstico..."
                      className="cms-textarea cms-text-base cms-min-h-25"
                    />
                  </div>
                  
                  <div className="cms-flex cms-items-center cms-gap-2">
                    <input
                      type="checkbox"
                      checked={actionsCorrected}
                      onChange={(e) => setActionsCorrected(e.target.checked)}
                      className="cms-m-0"
                    />
                    <label className="cms-text-sm cms-text-gray-700">
                      Ações de correção foram implementadas
                    </label>
                  </div>
                  
                  <button
                    onClick={saveFeedback}
                    className="cms-btn cms-flex cms-items-center cms-gap-2 cms-px-6 cms-py-3 cms-text-white cms-self-start"
                    style={{ backgroundColor: 'var(--success)' }}
                  >
                    <Download className="w-4 h-4" />
                    Salvar Feedback
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
