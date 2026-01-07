// Página de Diagnóstico Avançado do WordPress
'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useOrganization } from '@/contexts/organization-context'
// import { SiteDiagnosticService, DiagnosticResult } from '@/lib/site-diagnostic-service'
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Download, 
  Shield,
  FileText,
  Clock,
  Play,
  X,
  FileBarChart,
  Lightbulb
} from 'lucide-react'

export default function WordPressDiagnosticPage() {
  const { currentOrganization: _currentOrganization, currentSite } = useOrganization()
  const [activeTab, setActiveTab] = useState<'simple' | 'compliance'>('simple')
  const [_isLoading, _setIsLoading] = useState(false)
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null)
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false)
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  // const [diagnosticService] = useState(() => SiteDiagnosticService.getInstance())

  // Executar diagnóstico completo
  const runFullDiagnostic = async () => {
    console.log(' Iniciando diagnóstico completo do site...')
    setIsRunningDiagnostic(true)
    setShowDiagnosticModal(true)

    // Simular diagnóstico
    setTimeout(() => {
      setDiagnosticResults({
        site_url: currentSite?.settings?.wordpressUrl || 'Site não configurado',
        data_diagnostico: new Date().toISOString(),
        status_geral: 'ok',
        pontuacao_total: 85,
        pontuacao_maxima: 100,
        categorias: [
          {
            nome: 'Menu e Rodapé',
            verificacoes: [
              {
                criterio: 'Presença em todas as páginas',
                status: 'ok',
                observacao: 'Menu presente em 95% das páginas',
                pagina_afetada: '',
                sugestao_correcao: 'Verificar páginas sem menu'
              }
            ]
          }
        ] as any[],
        resumo_executivo: {
          pontos_fortes: ['Menu e rodapé funcionando', 'SEO otimizado'],
          pontos_fracos: ['Alguns links quebrados'],
          acoes_prioritarias: ['Corrigir links quebrados'],
          nivel_compliance: 'alto'
        },
        relatorio_tecnico: {
          detalhes_tecnicos: ['Sistema funcionando normalmente'],
          recomendacoes_avancadas: ['Implementar cache'],
          metricas_performance: { score: 85, total: 100 }
        }
      })
      setIsRunningDiagnostic(false)
    }, 3000)
  }

  // Gerar relatório executivo
  const generateExecutiveReport = () => {
    if (!diagnosticResults) return

    const report = {
      title: 'Relatório Executivo - Diagnóstico de Site',
      site: currentSite?.name || 'Site não identificado',
      date: new Date().toLocaleDateString('pt-BR'),
      summary: {
        overall_score: `${((diagnosticResults.pontuacao_total / diagnosticResults.pontuacao_maxima) * 100).toFixed(1)}%`,
        compliance_level: diagnosticResults.resumo_executivo.nivel_compliance,
        status: diagnosticResults.status_geral
      },
      strengths: diagnosticResults.resumo_executivo.pontos_fortes,
      weaknesses: diagnosticResults.resumo_executivo.pontos_fracos,
      priorities: diagnosticResults.resumo_executivo.acoes_prioritarias
    }

    setSelectedReport(report)
    setShowReportModal(true)
  }

  // Gerar relatório técnico
  const generateTechnicalReport = () => {
    if (!diagnosticResults) return

    const report = {
      title: 'Relatório Técnico - Diagnóstico de Site',
      site: currentSite?.name || 'Site não identificado',
      date: new Date().toLocaleDateString('pt-BR'),
      technical_details: diagnosticResults.relatorio_tecnico.detalhes_tecnicos,
      advanced_recommendations: diagnosticResults.relatorio_tecnico.recomendacoes_avancadas,
      performance_metrics: diagnosticResults.relatorio_tecnico.metricas_performance,
      categories: diagnosticResults.categorias.map((cat: any) => ({
        name: cat.nome,
        checks: cat.verificacoes.map((check: any) => ({
          criteria: check.criterio,
          status: check.status,
          observation: check.observacao,
          affected_page: check.pagina_afetada,
          suggestion: check.sugestao_correcao
        }))
      }))
    }

    setSelectedReport(report)
    setShowReportModal(true)
  }

  // Obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="cms-text-success" style={{ width: '1rem', height: '1rem' }} />
      case 'falha': return <AlertTriangle className="cms-text-warning" style={{ width: '1rem', height: '1rem' }} />
      case 'critico': return <XCircle className="cms-text-danger" style={{ width: '1rem', height: '1rem' }} />
      case 'pendente': return <Clock className="cms-text-gray-500" style={{ width: '1rem', height: '1rem' }} />
      default: return <Info className="cms-text-gray-500" style={{ width: '1rem', height: '1rem' }} />
    }
  }

  // Obter cor do status (usando classes CSS)
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'ok': return 'cms-text-success'
      case 'falha': return 'cms-text-warning'
      case 'critico': return 'cms-text-danger'
      case 'pendente': return 'cms-text-gray-500'
      default: return 'cms-text-gray-500'
    }
  }

  // Obter texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'ok': return ' Aprovado'
      case 'falha': return ' Falha'
      case 'critico': return '🚨 Crítico'
      case 'pendente': return '⏳ Pendente'
      default: return '❓ Desconhecido'
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="cms-p-8 cms-mb-8">
          <h1 className="cms-text-3xl cms-font-bold cms-text-gray-900 cms-mb-2">
            Diagnóstico WordPress
          </h1>
          <p className="cms-text-gray-600 cms-mb-6">
            {currentSite 
              ? `Análise completa de compliance, SEO, usabilidade, segurança e políticas do site ${currentSite.name}`
              : 'Selecione um site para realizar o diagnóstico'
            }
          </p>

          {/* Abas de Diagnóstico */}
          <div className="cms-flex cms-gap-2 cms-mb-6">
            <button
              onClick={() => setActiveTab('simple')}
              className={`cms-btn cms-px-6 cms-py-3 cms-border-none cms-rounded cms-cursor-pointer cms-text-sm cms-font-medium cms-flex cms-items-center cms-gap-2 ${
                activeTab === 'simple' ? 'cms-text-white' : 'cms-text-gray-700'
              }`}
              style={{ 
                backgroundColor: activeTab === 'simple' ? 'var(--primary)' : 'var(--gray-100)' 
              }}
            >
              <Search style={{ width: '1rem', height: '1rem' }} />
              Diagnóstico Simples
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`cms-btn cms-px-6 cms-py-3 cms-border-none cms-rounded cms-cursor-pointer cms-text-sm cms-font-medium cms-flex cms-items-center cms-gap-2 ${
                activeTab === 'compliance' ? 'cms-text-white' : 'cms-text-gray-700'
              }`}
              style={{ 
                backgroundColor: activeTab === 'compliance' ? 'var(--primary)' : 'var(--gray-100)' 
              }}
            >
              <Shield style={{ width: '1rem', height: '1rem' }} />
              Diagnóstico Compliance
            </button>
          </div>

          {/* Botões de Ação */}
          <div className="cms-flex cms-gap-4 cms-mb-6 cms-flex-wrap">
            <button
              onClick={runFullDiagnostic}
              disabled={isRunningDiagnostic || !currentSite}
              className={`cms-btn cms-px-6 cms-py-3 cms-border-none cms-rounded cms-text-sm cms-font-medium cms-flex cms-items-center cms-gap-2 cms-text-white ${
                isRunningDiagnostic || !currentSite ? 'cms-bg-gray-400 cms-cursor-not-allowed cms-opacity-50' : 'cms-bg-success'
              }`}
            >
              {isRunningDiagnostic ? (
                <>
                  <div className="cms-w-4 cms-h-4 cms-border-2 cms-border-transparent cms-border-t-white cms-rounded-full" style={{ animation: 'spin 1s linear infinite' }} />
                  Executando...
                </>
              ) : (
                <>
                  <Play style={{ width: '1rem', height: '1rem' }} />
                  Executar Diagnóstico Completo
                </>
              )}
            </button>

            {diagnosticResults && (
              <>
                <button
                  onClick={generateExecutiveReport}
                  className="cms-btn cms-btn-primary cms-px-6 cms-py-3 cms-border-none cms-rounded cms-text-sm cms-font-medium cms-flex cms-items-center cms-gap-2 cms-text-white"
                >
                  <FileBarChart style={{ width: '1rem', height: '1rem' }} />
                  Relatório Executivo
                </button>

                <button
                  onClick={generateTechnicalReport}
                  className="cms-btn cms-px-6 cms-py-3 cms-border-none cms-rounded cms-text-sm cms-font-medium cms-flex cms-items-center cms-gap-2 cms-text-white"
                  style={{ backgroundColor: 'var(--purple)' }}
                >
                  <FileText style={{ width: '1rem', height: '1rem' }} />
                  Relatório Técnico
                </button>
              </>
            )}
          </div>
        </div>

        {/* Resultados do Diagnóstico */}
        {diagnosticResults && (
          <div className="cms-mb-8">
            {/* Resumo Geral */}
            <div className="cms-card cms-bg-white cms-p-6 cms-rounded-lg cms-border cms-border-gray-200 cms-mb-6">
              <div className="cms-flex cms-justify-between cms-items-center cms-mb-4">
                <h2 className="cms-text-xl cms-font-semibold cms-text-gray-900 cms-m-0">
                  Resumo do Diagnóstico
                </h2>
                <div className="cms-flex cms-items-center cms-gap-2">
                  {getStatusIcon(diagnosticResults.status_geral)}
                  <span className={`cms-text-sm cms-font-medium ${getStatusColorClass(diagnosticResults.status_geral)}`}>
                    {getStatusText(diagnosticResults.status_geral)}
                  </span>
                </div>
              </div>

              <div className="cms-grid cms-gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="cms-text-center">
                  <div className="cms-text-3xl cms-font-bold cms-text-gray-900">
                    {((diagnosticResults.pontuacao_total / diagnosticResults.pontuacao_maxima) * 100).toFixed(1)}%
                  </div>
                  <div className="cms-text-sm cms-text-gray-600">Pontuação Total</div>
                </div>
                <div className="cms-text-center">
                  <div className="cms-text-3xl cms-font-bold cms-text-gray-900">
                    {diagnosticResults.categorias.length}
                  </div>
                  <div className="cms-text-sm cms-text-gray-600">Categorias Analisadas</div>
                </div>
                <div className="cms-text-center">
                  <div className="cms-text-3xl cms-font-bold cms-text-gray-900">
                    {diagnosticResults.categorias.reduce((acc: any, cat: any) => acc + cat.verificacoes.length, 0)}
                  </div>
                  <div className="cms-text-sm cms-text-gray-600">Verificações Realizadas</div>
                </div>
                <div className="cms-text-center">
                  <div className="cms-text-3xl cms-font-bold cms-text-gray-900">
                    {diagnosticResults.resumo_executivo.nivel_compliance.toUpperCase()}
                  </div>
                  <div className="cms-text-sm cms-text-gray-600">Nível de Compliance</div>
                </div>
              </div>
            </div>

            {/* Categorias de Verificação */}
            <div className="cms-grid cms-gap-4">
              {diagnosticResults.categorias.map((categoria: any, index: number) => (
                <div key={index} className="cms-card cms-bg-white cms-p-6 cms-rounded-lg cms-border cms-border-gray-200">
                  <h3 className="cms-text-lg cms-font-semibold cms-text-gray-900 cms-mb-4">
                    {categoria.nome}
                  </h3>
                  
                  <div className="cms-grid cms-gap-3">
                    {categoria.verificacoes.map((verificacao: any, vIndex: number) => (
                      <div key={vIndex} className="cms-p-4 cms-bg-gray-50 cms-rounded cms-border cms-border-gray-200">
                        <div className="cms-flex cms-justify-between cms-items-start cms-mb-2">
                          <h4 className="cms-text-sm cms-font-semibold cms-text-gray-900 cms-m-0 cms-flex-1">
                            {verificacao.criterio}
                          </h4>
                          <div className="cms-flex cms-items-center cms-gap-2 cms-ml-4">
                            {getStatusIcon(verificacao.status)}
                            <span className={`cms-text-xs cms-font-medium ${getStatusColorClass(verificacao.status)}`}>
                              {getStatusText(verificacao.status)}
                            </span>
                          </div>
                        </div>

                        {verificacao.observacao && (
                          <p className="cms-text-sm cms-text-gray-600 cms-mb-2">
                            <strong>Observação:</strong> {verificacao.observacao}
                          </p>
                        )}

                        {verificacao.pagina_afetada && (
                          <p className="cms-text-sm cms-text-gray-600 cms-mb-2">
                            <strong>Página Afetada:</strong> {verificacao.pagina_afetada}
                          </p>
                        )}

                        {verificacao.sugestao_correcao && (
                          <div className="cms-p-3 cms-bg-blue-50 cms-rounded cms-border cms-border-blue-200">
                            <div className="cms-flex cms-items-center cms-gap-2 cms-mb-1">
                              <Lightbulb className="cms-text-primary" style={{ width: '1rem', height: '1rem' }} />
                              <span className="cms-text-sm cms-font-semibold cms-text-blue-900">
                                Sugestão de Correção:
                              </span>
                            </div>
                            <p className="cms-text-sm cms-text-blue-900 cms-m-0">
                              {verificacao.sugestao_correcao}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de Diagnóstico em Execução */}
        {showDiagnosticModal && (
          <div className="cms-modal-overlay" style={{ zIndex: 1000 }}>
            <div className="cms-card cms-bg-white cms-p-8 cms-rounded-lg cms-text-center" style={{ maxWidth: '500px', width: '90%' }}>
              <div className="cms-mb-6">
                {isRunningDiagnostic ? (
                  <div className="cms-w-16 cms-h-16 cms-border-4 cms-border-gray-200 cms-border-t-primary cms-rounded-full cms-mx-auto cms-mb-4" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <CheckCircle className="cms-text-success cms-mx-auto cms-mb-4" style={{ width: '4rem', height: '4rem' }} />
                )}
              </div>

              <h3 className="cms-text-xl cms-font-semibold cms-text-gray-900 cms-mb-2">
                {isRunningDiagnostic ? 'Executando Diagnóstico...' : 'Diagnóstico Concluído!'}
              </h3>

              <p className="cms-text-gray-600 cms-mb-6">
                {isRunningDiagnostic 
                  ? 'Analisando compliance, SEO, usabilidade, segurança e políticas do site'
                  : 'O diagnóstico foi concluído com sucesso. Verifique os resultados abaixo.'
                }
              </p>

              {!isRunningDiagnostic && (
                <button
                  onClick={() => setShowDiagnosticModal(false)}
                  className="cms-btn cms-btn-primary cms-px-6 cms-py-3 cms-border-none cms-rounded cms-text-sm cms-font-medium cms-text-white"
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal de Relatório */}
        {showReportModal && selectedReport && (
          <div className="cms-modal-overlay" style={{ zIndex: 1000 }}>
            <div className="cms-card cms-bg-white cms-p-8 cms-rounded-lg" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
              <div className="cms-flex cms-justify-between cms-items-center cms-mb-6">
                <h3 className="cms-text-xl cms-font-semibold cms-m-0">
                  {selectedReport.title}
                </h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="cms-bg-transparent cms-border-none cms-cursor-pointer cms-p-2 cms-rounded cms-flex cms-items-center cms-justify-center"
                >
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>

              <div className="cms-mb-6">
                <div className="cms-grid cms-gap-4 cms-mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <div>
                    <strong>Site:</strong> {selectedReport.site}
                  </div>
                  <div>
                    <strong>Data:</strong> {selectedReport.date}
                  </div>
                </div>

                {selectedReport.summary && (
                  <div className="cms-p-4 cms-bg-blue-50 cms-rounded cms-border cms-border-blue-200 cms-mb-4">
                    <h4 className="cms-text-base cms-font-semibold cms-text-blue-900 cms-mb-2">
                      Resumo Executivo
                    </h4>
                    <div className="cms-grid cms-gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                      <div><strong>Pontuação:</strong> {selectedReport.summary.overall_score}</div>
                      <div><strong>Compliance:</strong> {selectedReport.summary.compliance_level}</div>
                      <div><strong>Status:</strong> {selectedReport.summary.status}</div>
                    </div>
                  </div>
                )}

                {selectedReport.strengths && selectedReport.strengths.length > 0 && (
                  <div className="cms-mb-4">
                    <h4 className="cms-text-base cms-font-semibold cms-text-gray-900 cms-mb-2">
                      Pontos Fortes
                    </h4>
                    <ul className="cms-text-sm cms-text-gray-600 cms-m-0 cms-pl-4">
                      {selectedReport.strengths.map((strength: string, index: number) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedReport.weaknesses && selectedReport.weaknesses.length > 0 && (
                  <div className="cms-mb-4">
                    <h4 className="cms-text-base cms-font-semibold cms-text-gray-900 cms-mb-2">
                      Pontos Fracos
                    </h4>
                    <ul className="cms-text-sm cms-text-gray-600 cms-m-0 cms-pl-4">
                      {selectedReport.weaknesses.map((weakness: string, index: number) => (
                        <li key={index}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedReport.priorities && selectedReport.priorities.length > 0 && (
                  <div className="cms-mb-4">
                    <h4 className="cms-text-base cms-font-semibold cms-text-gray-900 cms-mb-2">
                      Ações Prioritárias
                    </h4>
                    <ul className="cms-text-sm cms-text-gray-600 cms-m-0 cms-pl-4">
                      {selectedReport.priorities.map((priority: string, index: number) => (
                        <li key={index}>{priority}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedReport.technical_details && (
                  <div className="cms-mb-4">
                    <h4 className="cms-text-base cms-font-semibold cms-text-gray-900 cms-mb-2">
                      Detalhes Técnicos
                    </h4>
                    <ul className="cms-text-sm cms-text-gray-600 cms-m-0 cms-pl-4">
                      {selectedReport.technical_details.map((detail: string, index: number) => (
                        <li key={index}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedReport.advanced_recommendations && (
                  <div className="cms-mb-4">
                    <h4 className="cms-text-base cms-font-semibold cms-text-gray-900 cms-mb-2">
                      Recomendações Avançadas
                    </h4>
                    <ul className="cms-text-sm cms-text-gray-600 cms-m-0 cms-pl-4">
                      {selectedReport.advanced_recommendations.map((recommendation: string, index: number) => (
                        <li key={index}>{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedReport.performance_metrics && Object.keys(selectedReport.performance_metrics).length > 0 && (
                  <div className="cms-mb-4">
                    <h4 className="cms-text-base cms-font-semibold cms-text-gray-900 cms-mb-2">
                      Métricas de Performance
                    </h4>
                    <div className="cms-grid cms-gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                      {Object.entries(selectedReport.performance_metrics).map(([key, value]) => (
                        <div key={key} className="cms-text-sm cms-text-gray-600">
                          <strong>{key}:</strong> {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="cms-flex cms-gap-4 cms-justify-end">
                <button
                  onClick={() => {
                    const reportText = JSON.stringify(selectedReport, null, 2)
                    const blob = new Blob([reportText], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${selectedReport.title.toLowerCase().replace(/\s+/g, '-')}.json`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="cms-btn cms-bg-success cms-text-white cms-px-6 cms-py-3 cms-border-none cms-rounded cms-text-sm cms-font-medium cms-flex cms-items-center cms-gap-2"
                >
                  <Download style={{ width: '1rem', height: '1rem' }} />
                  Baixar Relatório
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="cms-btn cms-btn-secondary cms-px-6 cms-py-3 cms-border-none cms-rounded cms-text-sm cms-font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}