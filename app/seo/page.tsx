'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useSEO } from '@/contexts/seo-context'
import { useOrganization } from '@/contexts/organization-context'
import { getLayoutStyles, getCardStyles, getButtonStyles, getBadgeStyles } from '@/lib/design-system'
import { Search, AlertTriangle, CheckCircle, Info, Download, RefreshCw, Eye, Zap, Target, FileText, Globe, Settings } from 'lucide-react'

export default function SEOPage() {
  const { analyses, sitemap, robotsTxt, isLoading, error, analyzePage, generateSitemap, generateRobotsTxt, optimizeContent, generateMetaTags } = useSEO()
  const { currentOrganization } = useOrganization()
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null)
  const [showSitemap, setShowSitemap] = useState(false)
  const [showRobotsTxt, setShowRobotsTxt] = useState(false)
  const [contentToOptimize, setContentToOptimize] = useState('')
  const [keywords, setKeywords] = useState('')
  const [optimizedContent, setOptimizedContent] = useState('')

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--success)'
    if (score >= 60) return 'var(--warning)'
    return 'var(--danger)'
  }

  const getScoreText = (score: number) => {
    if (score >= 80) return 'Excelente'
    if (score >= 60) return 'Bom'
    if (score >= 40) return 'Regular'
    return 'Ruim'
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle style={{ width: '1rem', height: '1rem', color: 'var(--danger)' }} />
      case 'warning':
        return <AlertTriangle style={{ width: '1rem', height: '1rem', color: 'var(--warning)' }} />
      case 'info':
        return <Info style={{ width: '1rem', height: '1rem', color: 'var(--info)' }} />
      default:
        return <Info style={{ width: '1rem', height: '1rem', color: 'var(--gray-400)' }} />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'var(--danger)'
      case 'medium':
        return 'var(--warning)'
      case 'low':
        return 'var(--info)'
      default:
        return 'var(--gray-400)'
    }
  }

  const handleAnalyzePage = async () => {
    try {
      const mockContent = `
        <html>
          <head>
            <title>Página de Teste</title>
            <meta name="description" content="Esta é uma página de teste para análise de SEO">
          </head>
          <body>
            <h1>Título Principal</h1>
            <p>Conteúdo da página...</p>
          </body>
        </html>
      `
      await analyzePage('1', 'https://meusite.com/teste', mockContent)
    } catch (err) {
      console.error('Erro ao analisar página:', err)
    }
  }

  const handleOptimizeContent = async () => {
    if (!contentToOptimize.trim() || !keywords.trim()) return

    try {
      const keywordArray = keywords.split(',').map(k => k.trim())
      const optimized = await optimizeContent(contentToOptimize, keywordArray)
      setOptimizedContent(optimized)
    } catch (err) {
      console.error('Erro ao otimizar conteúdo:', err)
    }
  }

  const handleGenerateSitemap = async () => {
    try {
      await generateSitemap()
      setShowSitemap(true)
    } catch (err) {
      console.error('Erro ao gerar sitemap:', err)
    }
  }

  const handleGenerateRobotsTxt = async () => {
    try {
      await generateRobotsTxt()
      setShowRobotsTxt(true)
    } catch (err) {
      console.error('Erro ao gerar robots.txt:', err)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
            Ferramentas de SEO
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>
            {currentOrganization 
              ? `Otimize o SEO das páginas da organização ${currentOrganization.name}`
              : 'Otimize o SEO das suas páginas'
            }
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: 'var(--error-light)', 
            border: '1px solid var(--red-300)', 
            borderRadius: 'var(--radius)', 
            color: 'var(--danger)',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Quick Actions */}
        <div className="cms-grid cms-grid-cols-3" style={{ marginBottom: '2rem' }}>
          <div className="cms-card">
            <div className="cms-card-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  backgroundColor: 'var(--primary-light)', 
                  borderRadius: 'var(--radius-lg)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Search style={{ width: '1.5rem', height: '1.5rem', color: 'var(--primary)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                    Análise de Páginas
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    Analise o SEO das suas páginas
                  </p>
                </div>
              </div>
              <button 
                className="cms-btn cms-btn-primary"
                onClick={handleAnalyzePage}
                disabled={isLoading}
                style={{ width: '100%' }}
              >
                <Search style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Analisar Página
              </button>
            </div>
          </div>

          <div className="cms-card">
            <div className="cms-card-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  backgroundColor: 'var(--success-light)', 
                  borderRadius: 'var(--radius-lg)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Globe style={{ width: '1.5rem', height: '1.5rem', color: 'var(--success)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                    Sitemap
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    Gere sitemap XML
                  </p>
                </div>
              </div>
              <button 
                className="cms-btn cms-btn-primary"
                onClick={handleGenerateSitemap}
                disabled={isLoading}
                style={{ width: '100%' }}
              >
                <FileText style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Gerar Sitemap
              </button>
            </div>
          </div>

          <div className="cms-card">
            <div className="cms-card-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  backgroundColor: 'var(--info-light)', 
                  borderRadius: 'var(--radius-lg)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Settings style={{ width: '1.5rem', height: '1.5rem', color: 'var(--info)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                    Robots.txt
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    Configure robots.txt
                  </p>
                </div>
              </div>
              <button 
                className="cms-btn cms-btn-primary"
                onClick={handleGenerateRobotsTxt}
                disabled={isLoading}
                style={{ width: '100%' }}
              >
                <Settings style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Gerar Robots.txt
              </button>
            </div>
          </div>
        </div>

        {/* Content Optimizer */}
        <div className="cms-card" style={{ marginBottom: '2rem' }}>
          <div className="cms-card-header">
            <h2 className="cms-card-title">Otimizador de Conteúdo</h2>
          </div>
          <div className="cms-card-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                  Conteúdo para Otimizar
                </label>
                <textarea
                  placeholder="Cole o conteúdo HTML aqui..."
                  rows={6}
                  value={contentToOptimize}
                  onChange={(e) => setContentToOptimize(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                  Palavras-chave (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: marketing digital, tecnologia, inovação"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    fontSize: '0.875rem' 
                  }}
                />
              </div>
              <button 
                className="cms-btn cms-btn-primary"
                onClick={handleOptimizeContent}
                disabled={!contentToOptimize.trim() || !keywords.trim() || isLoading}
                style={{ 
                  opacity: (!contentToOptimize.trim() || !keywords.trim() || isLoading) ? 0.7 : 1,
                  cursor: (!contentToOptimize.trim() || !keywords.trim() || isLoading) ? 'not-allowed' : 'pointer'
                }}
              >
                <Zap style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Otimizar Conteúdo
              </button>
              
              {optimizedContent && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    Conteúdo Otimizado
                  </label>
                  <textarea
                    value={optimizedContent}
                    readOnly
                    rows={6}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--success)', 
                      borderRadius: 'var(--radius-lg)', 
                      fontSize: '0.875rem',
                      backgroundColor: 'var(--success-light)',
                      resize: 'vertical'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEO Analyses */}
        {analyses.length > 0 && (
          <div className="cms-card" style={{ marginBottom: '2rem' }}>
            <div className="cms-card-header">
              <h2 className="cms-card-title">Análises de SEO</h2>
            </div>
            <div className="cms-card-content">
              <div>
                {analyses.map((analysis) => (
                  <div key={analysis.id} className="cms-page-item">
                    <div className="cms-page-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ 
                          width: '2rem', 
                          height: '2rem', 
                          borderRadius: '50%', 
                          backgroundColor: getScoreColor(analysis.score),
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'var(--white)',
                          fontWeight: 'bold',
                          fontSize: '0.875rem'
                        }}>
                          {analysis.score}
                        </div>
                        <div>
                          <h4 style={{ marginBottom: '0.25rem' }}>{analysis.title}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                            <span>{analysis.url}</span>
                            <span style={{ color: getScoreColor(analysis.score), fontWeight: '500' }}>
                              {getScoreText(analysis.score)}
                            </span>
                            <span>{analysis.createdAt.toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                      {analysis.issues.length > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <AlertTriangle style={{ width: '1rem', height: '1rem', color: 'var(--warning)' }} />
                            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                              {analysis.issues.length} problema(s) encontrado(s)
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {analysis.issues.slice(0, 3).map((issue) => (
                              <span 
                                key={issue.id}
                                className="cms-badge"
                                style={{ 
                                  backgroundColor: getPriorityColor(issue.priority) + '20',
                                  color: getPriorityColor(issue.priority),
                                  fontSize: '0.75rem'
                                }}
                              >
                                {issue.title}
                              </span>
                            ))}
                            {analysis.issues.length > 3 && (
                              <span className="cms-badge cms-badge-secondary" style={{ fontSize: '0.75rem' }}>
                                +{analysis.issues.length - 3} mais
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`cms-badge ${analysis.score >= 80 ? 'cms-badge-success' : analysis.score >= 60 ? 'cms-badge-warning' : 'cms-badge-danger'}`}>
                        {analysis.score}/100
                      </span>
                      <button 
                        className="cms-btn cms-btn-icon cms-btn-secondary"
                        onClick={() => setSelectedAnalysis(analysis.id)}
                        title="Ver detalhes"
                      >
                        <Eye style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sitemap Modal */}
        {showSitemap && sitemap.length > 0 && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="cms-card" style={{ maxWidth: '800px', margin: '1rem', width: '100%' }}>
              <div className="cms-card-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                    Sitemap XML
                  </h3>
                  <button 
                    onClick={() => setShowSitemap(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2rem',
                      height: '2rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      color: 'var(--gray-400)'
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="cms-card-content">
                <div style={{ marginBottom: '1rem' }}>
                  <button className="cms-btn cms-btn-secondary">
                    <Download style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Baixar Sitemap
                  </button>
                </div>
                <div style={{ 
                  backgroundColor: 'var(--gray-50)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius)', 
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  overflow: 'auto',
                  maxHeight: '400px'
                }}>
                  <pre>{`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified.toISOString()}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Robots.txt Modal */}
        {showRobotsTxt && robotsTxt && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="cms-card" style={{ maxWidth: '600px', margin: '1rem', width: '100%' }}>
              <div className="cms-card-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                    Robots.txt
                  </h3>
                  <button 
                    onClick={() => setShowRobotsTxt(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2rem',
                      height: '2rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      color: 'var(--gray-400)'
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="cms-card-content">
                <div style={{ marginBottom: '1rem' }}>
                  <button className="cms-btn cms-btn-secondary">
                    <Download style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Baixar Robots.txt
                  </button>
                </div>
                <div style={{ 
                  backgroundColor: 'var(--gray-50)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius)', 
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  overflow: 'auto',
                  maxHeight: '400px'
                }}>
                  <pre>{robotsTxt}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}

