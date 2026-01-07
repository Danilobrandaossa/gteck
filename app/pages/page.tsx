'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { usePages } from '@/contexts/pages-context'
import { useOrganization } from '@/contexts/organization-context'
// import { WordPressDataManager } from '@/lib/wordpress-data-manager'
import { EditPageForm } from '@/components/forms/edit-page-form'
// import { getLayoutStyles, getCardStyles, getButtonStyles, getBadgeStyles } from '@/lib/design-system'
import { Plus, Search, Filter, Edit, Trash2, Eye, EyeOff, Calendar, User, Settings } from 'lucide-react'

export default function PagesPage() {
  const { pages, isLoading, error, deletePage, publishPage, unpublishPage } = usePages()
  const { currentOrganization, currentSite } = useOrganization()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [wordpressPages, setWordpressPages] = useState<any[]>([])
  const [isLoadingWordPress, _setIsLoadingWordPress] = useState(false)
  // const [wordpressDataManager] = useState(() => WordPressDataManager.getInstance())
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPage, setSelectedPage] = useState<any>(null)

  // Carregar dados do WordPress
  useEffect(() => {
    if (currentSite) {
      console.log(' Carregando páginas do WordPress...', currentSite.name)
      loadWordPressPages()
    }
  }, [currentSite])

  // Função para carregar páginas do WordPress
  const loadWordPressPages = () => {
    // const data = wordpressDataManager.loadFromLocalStorage()
    // if (data && data.pages) {
    //   setWordpressPages(data.pages)
    //   console.log(` ${data.pages.length} páginas carregadas do WordPress`)
    // } else {
    //   console.log(' Nenhuma página do WordPress encontrada no localStorage')
    // }
    console.log(' Carregamento de páginas WordPress temporariamente desabilitado')
  }

  // Função para sincronizar páginas do WordPress gradualmente
   async () => {
    console.log(' Sincronização WordPress temporariamente desabilitada')
    // if (!currentSite?.settings?.wordpressUrl || !currentSite?.settings?.wordpressUser || !currentSite?.settings?.wordpressAppPassword) {
    //   console.log(' Credenciais WordPress não configuradas')
    //   return
    // }

    // console.log(' Sincronizando páginas do WordPress gradualmente...')
    // console.log(' Carregamento: 15 itens por vez')
    // setIsLoadingWordPress(true)

    // try {
    //   const stats = await wordpressDataManager.syncAllData(
    //     currentSite.settings.wordpressUrl,
    //     currentSite.settings.wordpressUser,
    //     currentSite.settings.wordpressAppPassword,
    //     (type, progress) => {
    //       console.log(` ${type}: Página ${progress.currentPage}/${progress.totalPages} - ${progress.percentage}%`)
    //     }
    //   )

    //   console.log(' Sincronização gradual concluída:', stats)
      
    //   // Processar dados das páginas para incluir informações adicionais
    //   if (stats.pages > 0) {
    //     console.log(' Processando dados detalhados das páginas...')
    //     const data = wordpressDataManager.loadFromLocalStorage()
    //     if (data && data.pages) {
    //       const processedPages = data.pages.map((page: any) => ({
    //         ...page,
    //         word_count: page.content?.rendered ? page.content.rendered.replace(/<[^>]*>/g, '').split(/\s+/).length : 0,
    //         reading_time: page.content?.rendered ? Math.ceil(page.content.rendered.replace(/<[^>]*>/g, '').split(/\s+/).length / 200) : 0,
    //         author_name: page.author_name || 'Autor desconhecido',
    //         slug: page.slug || 'sem-slug',
    //         template: page.template || 'default',
    //         featured_media: page.featured_media || null
    //       }))
          
    //       setWordpressPages(processedPages)
    //       console.log(' Páginas processadas com dados detalhados:', processedPages.length)
    //     }
    //   } else {
    //     loadWordPressPages()
    //   }
    // } catch (error) {
    //   console.error(' Erro na sincronização gradual:', error)
    // } finally {
    //   setIsLoadingWordPress(false)
    // }
  }

  // Funções para edição de páginas
  const handleEditPage = (page: any) => {
    console.log(' Editando página:', page.title?.rendered)
    setSelectedPage(page)
    setShowEditModal(true)
  }

  const handlePageUpdated = (updatedPage: any) => {
    console.log(' Página atualizada com sucesso:', updatedPage)
    // Atualizar a lista de páginas
    setWordpressPages(prev => 
      prev.map(page => page.id === updatedPage.id ? updatedPage : page)
    )
    setShowEditModal(false)
    setSelectedPage(null)
  }

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.slug.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Filtrar páginas do WordPress
  const filteredWordPressPages = wordpressPages.filter(page => {
    const matchesSearch = page.title?.rendered?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return 'cms-badge-success'
      case 'draft':
        return 'cms-badge-warning'
      case 'archived':
        return 'cms-badge-info'
      default:
        return 'cms-badge-secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Publicada'
      case 'draft':
        return 'Rascunho'
      case 'archived':
        return 'Arquivada'
      default:
        return status
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePage(id)
      setShowDeleteModal(null)
    } catch (err) {
      console.error('Erro ao deletar página:', err)
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await publishPage(id)
    } catch (err) {
      console.error('Erro ao publicar página:', err)
    }
  }

  const handleUnpublish = async (id: string) => {
    try {
      await unpublishPage(id)
    } catch (err) {
      console.error('Erro ao despublicar página:', err)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="cms-p-8 cms-mb-8">
          <h1 className="cms-text-3xl cms-font-bold cms-text-gray-900 cms-mb-2">
            Páginas
          </h1>
          <p className="cms-text-gray-600 cms-text-lg cms-mb-6">
            {currentOrganization && currentSite 
              ? `Gerencie as páginas do site ${currentSite.name}`
              : 'Gerencie suas páginas de conteúdo'
            }
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="cms-p-3 cms-bg-error-light cms-border cms-border-red-300 cms-rounded cms-text-danger cms-text-sm cms-mb-4">
            {error}
          </div>
        )}

        {/* Header with Add Button */}
        <div className="cms-flex cms-items-center cms-justify-between cms-mb-8">
          <div className="cms-flex cms-items-center cms-gap-4">
            <div className="cms-text-sm cms-text-gray-600">
              {filteredPages.length} de {pages.length} páginas
            </div>
          </div>
          <button className="cms-btn cms-btn-primary cms-px-6 cms-py-3 cms-border-none cms-rounded cms-text-sm cms-font-medium cms-flex cms-items-center cms-gap-2 cms-text-white">
            <Plus style={{ width: '1rem', height: '1rem' }} />
            Nova Página
          </button>
        </div>

        {/* Filters */}
        <div className="cms-flex cms-items-center cms-gap-4 cms-mb-6">
          <div className="cms-flex-1" style={{ maxWidth: '24rem' }}>
            <div style={{ position: 'relative' }}>
              <Search className="cms-text-gray-400" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem' }} />
              <input 
                type="text" 
                placeholder="Buscar páginas..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="cms-input cms-pl-10"
              />
            </div>
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cms-select"
          >
            <option value="all">Todos os status</option>
            <option value="published">Publicadas</option>
            <option value="draft">Rascunhos</option>
            <option value="archived">Arquivadas</option>
          </select>
          <button className="cms-btn cms-btn-secondary">
            <Filter style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Mais filtros
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="cms-text-center cms-p-12">
            <div className="cms-w-12 cms-h-12 cms-border-4 cms-border-gray-200 cms-border-t-primary cms-rounded-full cms-mx-auto cms-mb-4" style={{ animation: 'spin 1s linear infinite' }} />
            <p className="cms-text-gray-600">Carregando páginas...</p>
          </div>
        )}

        {/* WordPress Pages Section */}
        {currentSite && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: 'var(--blue-50)', 
              borderRadius: '0.5rem',
              border: '1px solid var(--blue-200)',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--blue-800)' }}>
                  Páginas do WordPress - {currentSite.name}
                </h3>
                <a
                  href="/settings"
                  className="cms-btn cms-btn-primary cms-no-underline"
                >
                  <Settings style={{ width: '1rem', height: '1rem' }} />
                  Configurações
                </a>
              </div>
              
              {wordpressPages.length > 0 ? (
                <div className="cms-grid cms-gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                  {filteredWordPressPages.slice(0, 6).map((page: any) => (
                    <div key={page.id} className="cms-bg-white cms-border cms-border-gray-200 cms-rounded cms-p-4">
                      <div className="cms-flex cms-justify-between cms-items-start cms-mb-2">
                        <h4 className="cms-text-base cms-font-semibold cms-text-gray-900 cms-m-0" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {page.title?.rendered || 'Sem título'}
                        </h4>
                        <span className="cms-text-xs cms-text-white cms-px-2 cms-py-1 cms-rounded" style={{ backgroundColor: page.status === 'publish' ? 'var(--success)' : page.status === 'draft' ? 'var(--warning)' : 'var(--gray-500)' }}>
                          {page.status === 'publish' ? 'Publicado' : page.status === 'draft' ? 'Rascunho' : page.status || 'Desconhecido'}
                        </span>
                      </div>
                      
                      {/* Informações detalhadas */}
                      <div className="cms-mb-3">
                        <div className="cms-flex cms-justify-between cms-items-center cms-mb-1">
                          <span className="cms-text-xs cms-text-gray-500">
                            📅 {new Date(page.date).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="cms-text-xs cms-text-gray-500">
                            🕒 {new Date(page.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className="cms-flex cms-justify-between cms-items-center cms-mb-1">
                          <span className="cms-text-xs cms-text-gray-500">
                            🔗 {page.slug || 'sem-slug'}
                          </span>
                          <span className="cms-text-xs cms-text-gray-500">
                            👤 {page.author_name || 'Autor desconhecido'}
                          </span>
                        </div>
                        
                        {page.template && page.template !== 'default' && (
                          <div className="cms-mb-1">
                            <span className="cms-text-xs cms-text-gray-500">
                              🎨 Template: {page.template}
                            </span>
                          </div>
                        )}
                        
                        {page.featured_media && (
                          <div className="cms-mb-1">
                            <span className="cms-text-xs cms-text-gray-500">
                              Com imagem destacada
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <p className="cms-text-sm cms-text-gray-600 cms-line-clamp-2" style={{ margin: '0.5rem 0' }}>
                        {page.excerpt?.rendered?.replace(/<[^>]*>/g, '') || 'Sem descrição'}
                      </p>
                      
                      <div className="cms-flex cms-justify-between cms-items-center cms-mt-3">
                        <div className="cms-flex cms-gap-2">
                          <span className="cms-text-xs cms-text-gray-500">
                            {page.word_count || 'N/A'} palavras
                          </span>
                          <span className="cms-text-xs cms-text-gray-500">
                            {page.reading_time || 'N/A'} min
                          </span>
                        </div>
                        <div className="cms-flex cms-gap-2">
                          <button
                            onClick={() => handleEditPage(page)}
                            className="cms-btn cms-btn-primary cms-text-xs cms-px-2 cms-py-1 cms-border-none cms-rounded cms-flex cms-items-center cms-gap-1"
                          >
                            <Edit style={{ width: '0.75rem', height: '0.75rem' }} />
                            Editar
                          </button>
                           <a 
                            href={page.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="cms-text-primary cms-no-underline"
                            style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Eye style={{ width: '0.75rem', height: '0.75rem' }} />
                            Ver
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="cms-text-gray-600" style={{ textAlign: 'center', padding: '1rem' }}>
                  {isLoadingWordPress ? 'Sincronizando páginas...' : 'Nenhuma página do WordPress encontrada'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Pages List */}
        {!isLoading && (
          <div className="cms-card">
            <div className="cms-card-header">
              <h2 className="cms-card-title">Lista de Páginas</h2>
            </div>
            <div className="cms-card-content">
              {filteredPages.length === 0 ? (
                <div className="cms-text-center cms-p-8">
                  <h3 className="cms-text-lg cms-font-semibold cms-text-gray-900 cms-mb-2">
                    Nenhuma página encontrada
                  </h3>
                  <p className="cms-text-gray-600 cms-mb-6">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Tente ajustar os filtros de busca'
                      : 'Crie sua primeira página para começar'
                    }
                  </p>
                  <button className="cms-btn cms-btn-primary">
                    <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Nova Página
                  </button>
                </div>
              ) : (
                <div>
                  {filteredPages.map((page) => (
                    <div key={page.id} className="cms-page-item">
                      <div className="cms-page-info">
                        <h4 className="cms-mb-1">{page.title}</h4>
                        <div className="cms-flex cms-items-center cms-gap-4 cms-text-sm cms-text-gray-500">
                          <span className="cms-flex cms-items-center cms-gap-1">
                            <Calendar style={{ width: '0.875rem', height: '0.875rem' }} />
                            {page.updatedAt.toLocaleDateString('pt-BR')}
                          </span>
                          <span className="cms-flex cms-items-center cms-gap-1">
                            <User style={{ width: '0.875rem', height: '0.875rem' }} />
                            Admin
                          </span>
                          <span>/ {page.slug}</span>
                        </div>
                        {page.excerpt && (
                          <p className="cms-text-sm cms-text-gray-600" style={{ marginTop: '0.25rem' }}>
                            {page.excerpt}
                          </p>
                        )}
                      </div>
                      <div className="cms-flex cms-items-center cms-gap-3">
                        <span className={`cms-badge ${getStatusBadge(page.status)}`}>
                          {getStatusText(page.status)}
                        </span>
                        <div className="cms-flex cms-gap-1">
                          <button 
                            className="cms-btn cms-btn-icon cms-btn-secondary"
                            title="Editar"
                          >
                            <Edit style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          <button 
                            className="cms-btn cms-btn-icon cms-btn-secondary"
                            title="Publicar"
                            onClick={() => handlePublish(page.id)}
                          >
                            <Eye style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          <button 
                            className="cms-btn cms-btn-icon cms-btn-secondary"
                            title="Despublicar"
                            onClick={() => handleUnpublish(page.id)}
                          >
                            <EyeOff style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          <button 
                            className="cms-btn cms-btn-icon cms-btn-danger"
                            title="Excluir"
                            onClick={() => setShowDeleteModal(page.id)}
                          >
                            <Trash2 style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
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
            <div className="cms-card" style={{ maxWidth: '400px', margin: '1rem' }}>
              <div className="cms-card-header">
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Confirmar exclusão
                </h3>
              </div>
              <div className="cms-card-content">
                <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
                  Tem certeza que deseja excluir esta página? Esta ação não pode ser desfeita.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button 
                    className="cms-btn cms-btn-secondary"
                    onClick={() => setShowDeleteModal(null)}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="cms-btn"
                    onClick={() => handleDelete(showDeleteModal)}
                    style={{ backgroundColor: 'var(--danger)', color: 'var(--white)' }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição de Página */}
        <EditPageForm
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedPage(null)
          }}
          page={selectedPage}
          onSuccess={handlePageUpdated}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
