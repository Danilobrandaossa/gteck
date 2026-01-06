'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useOrganization } from '@/contexts/organization-context'
import { Rocket, Eye, CheckCircle, XCircle, AlertTriangle, Loader2, Code2 } from 'lucide-react'

export default function PresselPage() {
  const { currentSite } = useOrganization()
  const [jsonContent, setJsonContent] = useState('')
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [previewResult, setPreviewResult] = useState<any>(null)
  const [publishResult, setPublishResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // JSON exemplo V1 (template completo baseado no ACF real)
  const exampleV1 = JSON.stringify({
    pressel: { model: 'V1', template_name: 'Pressel V1' },
    page: { title: 'Página V1 de Exemplo', slug: 'pagina-v1-exemplo', status: 'publish', excerpt: 'Resumo curto da página' },
    seo: {
      seo_title: 'Título SEO otimizado (até 60 caracteres)',
      meta_description: 'Descrição SEO otimizada para busca (até 160 caracteres)',
      focus_keyphrase: 'palavra-chave principal',
      og_title: 'Título para Open Graph',
      og_description: 'Descrição para Open Graph',
      og_image: 'https://atlz.online/wp-content/uploads/2024/og-image.jpg',
      canonical_url: 'https://atlz.online/pagina-v1-exemplo/',
      robots: 'index, follow'
    },
    acf: {
      hero_description: 'Subtítulo curto e objetivo para o topo da página',
      link_h1: 'https://atlz.online/',
      botao_tipo_selecao: 'normal',
      titulo_da_secao: 'Baixe agora',
      cor_botao: '#2352AE',
      texto_botao_p1: 'Download Android',
      link_botao_p1: 'https://play.google.com/store/apps/details?id=app.id',
      texto_botao_p2: 'Download iOS',
      link_botao_p2: 'https://apps.apple.com/app/id123456',
      texto_botao_p3: 'Site Oficial',
      link_botao_p3: 'https://exemplo.com',
      texto_usuario: 'Você permanecerá no mesmo site',
      titulo_h2_: 'Introdução',
      info_content: '<p>Conteúdo rico formatado (WYSIWYG) explicando os detalhes do app ou serviço.</p>',
      titulo_h2_02: 'Como funciona',
      info_content_2: '<p>Passos resumidos para começar a usar o aplicativo ou serviço.</p>',
      titulo_beneficios: 'Por que usar este aplicativo?',
      titulo_beneficios_1: 'Simples de usar',
      _beneficio_text_1: 'Interface intuitiva e comandos claros para todos os usuários.',
      titulo_beneficios_2: 'Totalmente gratuito',
      _beneficio_text_2: 'Sem custos escondidos, todas as funções básicas são gratuitas.',
      titulo_beneficios_3: 'Seguro e confiável',
      _beneficio_text_3: 'Proteção total de dados e privacidade garantida.',
      titulo_beneficios_4: 'Rápido e eficiente',
      _beneficio_text_4: 'Operações completas em poucos toques, economia de tempo.',
      titulo_faq: 'Perguntas frequentes',
      pergunta_1: 'O aplicativo é gratuito?',
      resposta_1: 'Sim, todas as funções básicas são completamente gratuitas.',
      pergunta_2: 'Está disponível para iOS e Android?',
      resposta_2: 'Sim, você pode baixar nas duas lojas oficiais.',
      pergunta_3: 'Preciso fazer cadastro para usar?',
      resposta_3: 'O cadastro é opcional, necessário apenas para recursos extras.',
      aviso: 'aviso_pt'
    }
  }, null, 2)

  // JSON exemplo V4 (template completo baseado no ACF real)
  const exampleV4 = JSON.stringify({
    pressel: { model: 'V4', template_name: 'Pressel V4' },
    page: { title: 'Página V4 de Exemplo', slug: 'pagina-v4-exemplo', status: 'publish', excerpt: 'Resumo curto da página' },
    seo: {
      seo_title: 'Título SEO otimizado (até 60 caracteres)',
      meta_description: 'Descrição SEO otimizada para busca (até 160 caracteres)',
      focus_keyphrase: 'palavra-chave principal',
      og_title: 'Título para Open Graph',
      og_description: 'Descrição para Open Graph',
      og_image: 'https://atlz.online/wp-content/uploads/2024/og-image.jpg',
      canonical_url: 'https://atlz.online/pagina-v4-exemplo/',
      robots: 'index, follow'
    },
    acf: {
      idioma_footer: 'pt',
      title_h1: 'Título Principal da Página',
      sub_title: 'Subtítulo descritivo e atrativo',
      imagem_destaque: 'https://atlz.online/wp-content/uploads/2024/exemplo.jpg',
      tipo_botao: 'normal',
      download_button_url: 'https://play.google.com/store/apps/details?id=app.id',
      download_button_text: 'Baixar Agora',
      disclaimer: 'Você permanecerá no mesmo site',
      description: '<p>Descrição detalhada do aplicativo ou serviço. Use formatação HTML para destacar informações importantes.</p>',
      benefits_title: 'Principais Benefícios',
      benefits: [
        { benefit_text: 'Interface intuitiva e fácil de usar' },
        { benefit_text: '100% gratuito sem custos ocultos' },
        { benefit_text: 'Proteção total de dados e privacidade' },
        { benefit_text: 'Atualizações constantes e suporte' }
      ],
      title2: 'Como Funciona',
      description1: '<p>Passo a passo detalhado sobre como usar o aplicativo ou serviço.</p>',
      faq_title: 'Perguntas Frequentes',
      faqs: [
        { question: 'O aplicativo é gratuito?', answer: 'Sim, todas as funcionalidades básicas são completamente gratuitas.' },
        { question: 'Está disponível para iOS e Android?', answer: 'Sim, você pode baixar nas duas lojas oficiais.' },
        { question: 'Preciso fazer cadastro para usar?', answer: 'O cadastro é opcional, necessário apenas para recursos avançados.' }
      ]
    }
  }, null, 2)

  const hasWordPressConfig = currentSite?.settings?.wordpressUrl && 
                             currentSite?.settings?.wordpressUser && 
                             currentSite?.settings?.wordpressAppPassword

  const handlePreview = async () => {
    if (!hasWordPressConfig) {
      setError('Configure as credenciais do WordPress nas configurações do site primeiro.')
      return
    }

    try {
      const jsonData = JSON.parse(jsonContent)
    } catch (e) {
      setError('JSON inválido. Verifique a sintaxe.')
      return
    }

    setIsPreviewing(true)
    setError(null)
    setPreviewResult(null)

    try {
      const jsonData = JSON.parse(jsonContent)
      const response = await fetch('/api/pressel/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonData,
          wpUrl: currentSite?.settings?.wordpressUrl,
          username: currentSite?.settings?.wordpressUser,
          password: currentSite?.settings?.wordpressAppPassword
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Erro no preview')
        setPreviewResult(null)
      } else {
        setPreviewResult(result.data)
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer preview')
      setPreviewResult(null)
    } finally {
      setIsPreviewing(false)
    }
  }

  const handlePublish = async () => {
    if (!hasWordPressConfig) {
      setError('Configure as credenciais do WordPress nas configurações do site primeiro.')
      return
    }

    try {
      const jsonData = JSON.parse(jsonContent)
    } catch (e) {
      setError('JSON inválido. Verifique a sintaxe.')
      return
    }

    setIsPublishing(true)
    setError(null)
    setPublishResult(null)

    try {
      const jsonData = JSON.parse(jsonContent)
      const response = await fetch('/api/pressel/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonData,
          wpUrl: currentSite?.settings?.wordpressUrl,
          username: currentSite?.settings?.wordpressUser,
          password: currentSite?.settings?.wordpressAppPassword
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Erro ao publicar')
        setPublishResult(null)
      } else {
        setPublishResult(result.data)
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar')
      setPublishResult(null)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Rocket className="w-8 h-8 text-blue-600" />
                Pressel Automation
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Crie e publique páginas no WordPress via JSON (V1, V4+)
              </p>
            </div>
          </div>

          {!hasWordPressConfig && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Configuração WordPress necessária
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Configure a URL do WordPress, usuário e senha de aplicação nas configurações do site.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor JSON */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  JSON do Conteúdo
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setJsonContent(exampleV1)}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                  >
                    Exemplo V1
                  </button>
                  <button
                    onClick={() => setJsonContent(exampleV4)}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                  >
                    Exemplo V4
                  </button>
                </div>
              </div>
              <textarea
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                placeholder='{ "pressel": { "model": "V1" }, "page": { "title": "...", "slug": "...", "status": "publish" }, "acf": { ... } }'
                className="w-full h-[600px] font-mono text-sm p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Resultados e Ações */}
            <div className="space-y-4">
              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={handlePreview}
                  disabled={isPreviewing || isPublishing || !jsonContent.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {isPreviewing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Preview...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Preview
                    </>
                  )}
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isPreviewing || isPublishing || !jsonContent.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      Publicar
                    </>
                  )}
                </button>
              </div>

              {/* Erro */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">Erro</p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Preview Result */}
              {previewResult && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-medium text-blue-900 dark:text-blue-200">Preview</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-blue-800 dark:text-blue-300">Modelo:</span>{' '}
                      <span className="text-blue-700 dark:text-blue-400">{previewResult.detected?.model || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800 dark:text-blue-300">Template:</span>{' '}
                      <span className="text-blue-700 dark:text-blue-400">{previewResult.template_file || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800 dark:text-blue-300">Validação:</span>{' '}
                      {previewResult.required_ok ? (
                        <span className="text-green-700 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          OK
                        </span>
                      ) : (
                        <span className="text-red-700 dark:text-red-400">Campos obrigatórios ausentes</span>
                      )}
                    </div>
                    {previewResult.issues && previewResult.issues.length > 0 && (
                      <div>
                        <span className="font-medium text-blue-800 dark:text-blue-300">Avisos:</span>
                        <ul className="list-disc list-inside mt-1 text-blue-700 dark:text-blue-400">
                          {previewResult.issues.map((issue: any, i: number) => (
                            <li key={i}>{issue.mensagem || issue.codigo}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Publish Result */}
              {publishResult && publishResult.data && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-medium text-green-900 dark:text-green-200">Publicado com sucesso!</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-green-800 dark:text-green-300">ID:</span>{' '}
                      <span className="text-green-700 dark:text-green-400">{publishResult.data.post_id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-800 dark:text-green-300">Template:</span>{' '}
                      <span className="text-green-700 dark:text-green-400">{publishResult.data.template || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-800 dark:text-green-300">ACF salvos:</span>{' '}
                      <span className="text-green-700 dark:text-green-400">{publishResult.data.acf_saved || 0}</span>
                    </div>
                    {publishResult.data.seo_saved !== undefined && (
                      <div>
                        <span className="font-medium text-green-800 dark:text-green-300">SEO salvos:</span>{' '}
                        <span className="text-green-700 dark:text-green-400">{publishResult.data.seo_saved || 0}</span>
                      </div>
                    )}
                    {publishResult.data.view_link && (
                      <div>
                        <a
                          href={publishResult.data.view_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 dark:text-green-400 hover:underline"
                        >
                          Ver página →
                        </a>
                        {' | '}
                        <a
                          href={publishResult.data.edit_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 dark:text-green-400 hover:underline"
                        >
                          Editar →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
