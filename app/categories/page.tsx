// Página de Categorias - Versão Corrigida
'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useCategories } from '@/contexts/categories-context'
import { useOrganization } from '@/contexts/organization-context'
import { CreateCategoryForm } from '@/components/forms/create-category-form'
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, EyeOff, ChevronRight, ChevronDown, Tag, Settings, RefreshCw } from 'lucide-react'

export default function CategoriesPage() {
  const { categories, isLoading, error, deleteCategory, toggleCategoryStatus, searchCategories, filterCategories, getCategoryTree } = useCategories()
  const { currentOrganization } = useOrganization()
  const [searchTerm, setSearchTerm] = useState('')
  const [parentFilter, setParentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCategoryType, setSelectedCategoryType] = useState<'pages' | 'pressels' | 'quizzes' | 'articles' | 'general'>('general')
  const [activeTab, setActiveTab] = useState<'site' | 'cms'>('site')
  const [siteCategories, setSiteCategories] = useState<any[]>([])
  const [cmsCategories, setCmsCategories] = useState<any[]>([])
  const [isLoadingSiteCategories, setIsLoadingSiteCategories] = useState(false)
  const [isLoadingCmsCategories, setIsLoadingCmsCategories] = useState(false)

  const filteredCategories = searchTerm 
    ? searchCategories(searchTerm)
    : filterCategories(
        parentFilter === 'all' ? undefined : parentFilter === 'root' ? undefined : parentFilter,
        statusFilter === 'all' ? undefined : statusFilter
      )

  const categoryTree = getCategoryTree()

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // Funções para criação de categorias
  const handleCreateCategory = (type: 'pages' | 'pressels' | 'quizzes' | 'articles' | 'general') => {
    console.log(' Criando nova categoria do tipo:', type)
    setSelectedCategoryType(type)
    setShowCreateModal(true)
  }

  const handleCategoryCreated = (category: any) => {
    console.log(' Categoria criada com sucesso:', category)
    // Atualizar lista baseada no tipo de categoria
    if (activeTab === 'site') {
      setSiteCategories(prev => [...prev, category])
    } else {
      setCmsCategories(prev => [...prev, category])
    }
    setShowCreateModal(false)
  }

  // Funções para carregar categorias do site e CMS
  const loadSiteCategories = async () => {
    console.log(' Carregando categorias do site...')
    setIsLoadingSiteCategories(true)
    
    try {
      // Simular carregamento de categorias do WordPress
      const mockSiteCategories = [
        {
          id: 'site-1',
          name: 'Notícias',
          slug: 'noticias',
          description: 'Categoria para notícias do site',
          color: 'var(--primary)',
          type: 'pages',
          count: 15,
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: 'site-2',
          name: 'Produtos',
          slug: 'produtos',
          description: 'Categoria para produtos',
          color: 'var(--success)',
          type: 'pages',
          count: 8,
          status: 'active',
          created_at: new Date().toISOString()
        }
      ]
      
      setSiteCategories(mockSiteCategories)
      console.log(' Categorias do site carregadas:', mockSiteCategories.length)
    } catch (error) {
      console.error(' Erro ao carregar categorias do site:', error)
    } finally {
      setIsLoadingSiteCategories(false)
    }
  }

  const loadCmsCategories = async () => {
    console.log(' Carregando categorias do CMS...')
    setIsLoadingCmsCategories(true)
    
    try {
      // Simular carregamento de categorias do CMS
      const mockCmsCategories = [
        {
          id: 'cms-1',
          name: 'Templates Pressel',
          slug: 'templates-pressel',
          description: 'Categoria para templates Pressel',
          color: 'var(--purple)',
          type: 'pressels',
          count: 5,
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: 'cms-2',
          name: 'Quizzes',
          slug: 'quizzes',
          description: 'Categoria para quizzes',
          color: 'var(--warning)',
          type: 'quizzes',
          count: 3,
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: 'cms-3',
          name: 'Artigos IA',
          slug: 'artigos-ia',
          description: 'Categoria para artigos gerados por IA',
          color: 'var(--danger)',
          type: 'articles',
          count: 12,
          status: 'active',
          created_at: new Date().toISOString()
        }
      ]
      
      setCmsCategories(mockCmsCategories)
      console.log(' Categorias do CMS carregadas:', mockCmsCategories.length)
    } catch (error) {
      console.error(' Erro ao carregar categorias do CMS:', error)
    } finally {
      setIsLoadingCmsCategories(false)
    }
  }

  // Carregar categorias quando a aba mudar
  useEffect(() => {
    if (activeTab === 'site') {
      loadSiteCategories()
    } else {
      loadCmsCategories()
    }
  }, [activeTab])

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id)
      setShowDeleteModal(null)
    } catch (err) {
      console.error('Erro ao excluir categoria:', err)
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleCategoryStatus(id)
    } catch (err) {
      console.error('Erro ao alterar status da categoria:', err)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="cms-p-8 cms-mb-8">
          <h1 className="cms-text-3xl cms-font-bold cms-text-gray-900 cms-mb-2">
            Categorias
          </h1>
          <p className="cms-text-gray-600 cms-mb-6">
            {currentOrganization 
              ? `Gerencie as categorias da organização ${currentOrganization.name}` 
              : 'Gerencie as categorias do sistema'
            }
          </p>

          {/* Abas para Site e CMS */}
          <div className="cms-flex cms-gap-2 cms-mb-6">
            <button
              onClick={() => setActiveTab('site')}
              className={`cms-btn cms-px-6 cms-py-3 cms-border-none cms-rounded cms-cursor-pointer cms-text-sm cms-font-medium cms-flex cms-items-center cms-gap-2 ${
                activeTab === 'site' ? 'cms-text-white' : 'cms-text-gray-700'
              }`}
              style={{ 
                backgroundColor: activeTab === 'site' ? 'var(--primary)' : 'var(--gray-100)' 
              }}
            >
              <Tag style={{ width: '1rem', height: '1rem' }} />
              Categorias do Site
            </button>
            <button
              onClick={() => setActiveTab('cms')}
              className={`cms-btn cms-px-6 cms-py-3 cms-border-none cms-rounded cms-cursor-pointer cms-text-sm cms-font-medium cms-flex cms-items-center cms-gap-2 ${
                activeTab === 'cms' ? 'cms-text-white' : 'cms-text-gray-700'
              }`}
              style={{ 
                backgroundColor: activeTab === 'cms' ? 'var(--primary)' : 'var(--gray-100)' 
              }}
            >
              <Settings style={{ width: '1rem', height: '1rem' }} />
              Categorias do CMS
            </button>
          </div>

          {/* Botões de criação por tipo */}
          <div className="cms-flex cms-gap-4 cms-mb-6 cms-flex-wrap">
            <button
              onClick={() => handleCreateCategory('pages')}
              className="cms-btn cms-px-4 cms-py-3 cms-border-none cms-rounded cms-cursor-pointer cms-text-sm cms-font-medium cms-flex cms-items-center cms-gap-2 cms-text-white cms-bg-success"
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
              Nova Categoria - Páginas
            </button>
            <button
              onClick={() => handleCreateCategory('pressels')}
              className="cms-btn cms-px-4 cms-py-3 cms-border-none cms-rounded cms-cursor-pointer cms-text-sm cms-font-medium cms-flex cms-items-center cms-gap-2 cms-text-white"
              style={{ backgroundColor: 'var(--purple)' }}
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
              Nova Categoria - Pressels
            </button>
            <button
              onClick={() => handleCreateCategory('quizzes')}
              className="cms-btn cms-px-4 cms-py-3 cms-border-none cms-rounded cms-cursor-pointer cms-text-sm cms-font-medium cms-flex cms-items-center cms-gap-2 cms-text-white cms-bg-warning"
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
              Nova Categoria - Quizzes
            </button>
            <button
              onClick={() => handleCreateCategory('articles')}
              className="cms-btn cms-px-4 cms-py-3 cms-border-none cms-rounded cms-cursor-pointer cms-text-sm cms-font-medium cms-flex cms-items-center cms-gap-2 cms-text-white cms-bg-danger"
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
              Nova Categoria - Artigos
            </button>
            <button
              onClick={() => handleCreateCategory('general')}
              className="cms-btn cms-px-4 cms-py-3 cms-border-none cms-rounded cms-cursor-pointer cms-text-sm cms-font-medium cms-flex cms-items-center cms-gap-2 cms-text-white"
              style={{ backgroundColor: 'var(--gray-500)' }}
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
              Nova Categoria - Geral
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="cms-p-3 cms-bg-error-light cms-border cms-border-red-300 cms-rounded cms-text-danger cms-mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="cms-text-center cms-p-12">
            <div className="cms-w-12 cms-h-12 cms-border-4 cms-border-gray-200 cms-border-t-primary cms-rounded-full cms-mx-auto cms-mb-4" style={{ animation: 'spin 1s linear infinite' }} />
            <p className="cms-text-gray-600">Carregando categorias...</p>
          </div>
        )}

        {/* Categories List - Site */}
        {activeTab === 'site' && (
          <div className="cms-card">
            <div className="cms-card-header">
              <h2 className="cms-card-title">
                <Tag style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', display: 'inline' }} />
                Categorias do Site WordPress
              </h2>
            </div>
            <div className="cms-card-content">
              {isLoadingSiteCategories ? (
                <div className="cms-text-center cms-p-8">
                  <div className="cms-w-12 cms-h-12 cms-border-4 cms-border-gray-200 cms-border-t-primary cms-rounded-full cms-mx-auto cms-mb-4" style={{ animation: 'spin 1s linear infinite' }} />
                  <p className="cms-text-gray-600">Carregando categorias do site...</p>
                </div>
              ) : siteCategories.length === 0 ? (
                <div className="cms-text-center cms-p-8">
                  <h3 className="cms-text-lg cms-font-semibold cms-text-gray-900 cms-mb-2">
                    Nenhuma categoria do site encontrada
                  </h3>
                  <p className="cms-text-gray-600 cms-mb-6">
                    As categorias do site são sincronizadas automaticamente do WordPress
                  </p>
                  <a
                    href="/settings"
                    className="cms-btn cms-btn-primary"
                    style={{ textDecoration: 'none' }}
                  >
                    <Settings style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Configurações
                  </a>
                </div>
              ) : (
                <div>
                  {siteCategories.map(category => (
                    <div key={category.id} className="cms-page-item">
                      <div className="cms-page-info">
                        <div className="cms-flex cms-items-center cms-gap-4">
                          <div 
                            className="cms-w-10 cms-h-10 cms-rounded cms-flex cms-items-center cms-justify-center cms-text-xl"
                            style={{ backgroundColor: category.color || 'var(--primary-light)' }}
                          >
                          </div>
                          <div>
                            <h3 className="cms-text-base cms-font-semibold cms-text-gray-900 cms-m-0">
                              {category.name}
                            </h3>
                            <p className="cms-text-sm cms-text-gray-600 cms-m-0">
                              {category.description}
                            </p>
                            <div className="cms-flex cms-gap-4 cms-mt-2">
                              <span className="cms-text-xs cms-text-gray-500">
                                {category.count} itens
                              </span>
                              <span className="cms-text-xs cms-text-gray-500">
                                {category.slug}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories List - CMS */}
        {activeTab === 'cms' && (
          <div className="cms-card">
            <div className="cms-card-header">
              <h2 className="cms-card-title">
                <Settings style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', display: 'inline' }} />
                Categorias do CMS
              </h2>
            </div>
            <div className="cms-card-content">
              {isLoadingCmsCategories ? (
                <div className="cms-text-center cms-p-8">
                  <div className="cms-w-12 cms-h-12 cms-border-4 cms-border-gray-200 cms-border-t-primary cms-rounded-full cms-mx-auto cms-mb-4" style={{ animation: 'spin 1s linear infinite' }} />
                  <p className="cms-text-gray-600">Carregando categorias do CMS...</p>
                </div>
              ) : cmsCategories.length === 0 ? (
                <div className="cms-text-center cms-p-8">
                  <h3 className="cms-text-lg cms-font-semibold cms-text-gray-900 cms-mb-2">
                    Nenhuma categoria do CMS encontrada
                  </h3>
                  <p className="cms-text-gray-600 cms-mb-6">
                    Crie categorias para organizar seu conteúdo no CMS
                  </p>
                  <button
                    className="cms-btn cms-btn-primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Criar Primeira Categoria
                  </button>
                </div>
              ) : (
                <div>
                  {cmsCategories.map(category => (
                    <div key={category.id} className="cms-page-item">
                      <div className="cms-page-info">
                        <div className="cms-flex cms-items-center cms-gap-4">
                          <div 
                            className="cms-w-10 cms-h-10 cms-rounded cms-flex cms-items-center cms-justify-center cms-text-xl"
                            style={{ backgroundColor: category.color || 'var(--primary-light)' }}
                          >
                            {category.type === 'pressels' ? '' : category.type === 'quizzes' ? '' : category.type === 'articles' ? '' : ''}
                          </div>
                          <div>
                            <h3 className="cms-text-base cms-font-semibold cms-text-gray-900 cms-m-0">
                              {category.name}
                            </h3>
                            <p className="cms-text-sm cms-text-gray-600 cms-m-0">
                              {category.description}
                            </p>
                            <div className="cms-flex cms-gap-4 cms-mt-2">
                              <span className="cms-text-xs cms-text-gray-500">
                                {category.count} itens
                              </span>
                              <span className="cms-text-xs cms-text-gray-500">
                                {category.slug}
                              </span>
                              <span 
                                className="cms-text-xs cms-text-white cms-px-2 cms-py-1 cms-rounded"
                                style={{ backgroundColor: category.color || 'var(--gray-500)' }}
                              >
                                {category.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Criação de Categoria */}
        <CreateCategoryForm
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCategoryCreated}
          categoryType={selectedCategoryType}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="cms-modal-overlay" style={{ zIndex: 1000 }}>
            <div className="cms-card" style={{ maxWidth: '400px', margin: '1rem' }}>
              <div className="cms-card-header">
                <h3 className="cms-text-lg cms-font-semibold cms-text-gray-900">
                  Confirmar exclusão
                </h3>
              </div>
              <div className="cms-card-content">
                <p className="cms-text-gray-600 cms-mb-6">
                  Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
                </p>
                <div className="cms-flex cms-gap-3 cms-justify-end">
                  <button 
                    className="cms-btn cms-btn-secondary"
                    onClick={() => setShowDeleteModal(null)}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="cms-btn cms-btn-danger"
                    onClick={() => handleDelete(showDeleteModal)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}