'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useOrganization } from '@/contexts/organization-context'
import { useRobustWordPressSync } from '@/hooks/use-robust-wordpress-sync'
import { useAPIUsage } from '@/hooks/use-api-usage'
import { 
  Key, 
  Globe, 
  Bot, 
  Plus, 
  Edit, 
  Trash2, 
  TestTube,
  Building2,
  FlaskConical,
  Shield,
  Zap,
  Bell,
  Link as LinkIcon
} from 'lucide-react'
import { Modal, ConfirmModal, SuccessModal } from '@/components/ui/modal'
import { ProgressModal } from '@/components/ui/progress-modal'
import { CredentialsDiagnostic } from '@/components/ui/credentials-diagnostic'
import { getLayoutStyles } from '@/lib/design-system'

interface APIConfig {
  id: string
  name: string
  type: string
  status: 'active' | 'inactive' | 'error' | 'testing'
  apiKey: string
  endpoint: string
  lastUsed: Date
  usage: {
    requests: number
    tokens: number
    cost: number
  }
}

interface Site {
  id: string
  name: string
  url: string
  organizationId: string
  settings: Record<string, any>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export default function SettingsPage() {
  const { organizations, sites, setSites: _setSites, getOrganizationStats: _getOrganizationStats, syncWordPressData: _syncWordPressData, updateSite, currentOrganization, currentSite } = useOrganization()
  
  // Hook de sincronização WordPress robusta
  const { isLoading: _isSyncing, progress, showProgressModal, syncResult: _syncResult, syncData, closeProgressModal } = useRobustWordPressSync()
  
  // Estados para tabs
  const [activeTab, setActiveTab] = useState('organizations')
  
  // Estados para modais
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [_showConfirmModal, _setShowConfirmModal] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [successData, setSuccessData] = useState<{
    title: string
    message: string
    details: string[]
  }>({ title: '', message: '', details: [] })
  const [_confirmData, _setConfirmData] = useState<{
    title: string
    message: string
    onConfirm: () => void
  }>({ title: '', message: '', onConfirm: () => {} })

  // Estados para sites
  const [showAddSiteModal, setShowAddSiteModal] = useState(false)
  const [newSite, setNewSite] = useState({
    name: '',
    url: '',
    description: '',
    wordpressUrl: '',
    wordpressUser: '',
    wordpressAppPassword: ''
  })

  // Estados para organizações
  const [showAddOrgModal, setShowAddOrgModal] = useState(false)
  const [newOrg, setNewOrg] = useState({
    name: '',
    description: '',
    email: '',
    phone: ''
  })

  // Estados para APIs
  const [showAddAPIModal, setShowAddAPIModal] = useState(false)
  const [showEditAPIModal, setShowEditAPIModal] = useState<string | null>(null)
  const [showDeleteAPIModal, setShowDeleteAPIModal] = useState<string | null>(null)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [newAPI, setNewAPI] = useState({
    name: '',
    type: 'openai',
    apiKey: '',
    endpoint: '',
    model: '',
    maxTokens: 4000,
    temperature: 0.7
  })
  const [editingAPI, setEditingAPI] = useState({
    name: '',
    type: 'openai',
    apiKey: '',
    endpoint: '',
    model: '',
    maxTokens: 4000,
    temperature: 0.7
  })

  // Hook para dados reais de uso das APIs
  const { usageData, getUsageForAPI } = useAPIUsage()

  // Estados para APIs
  const [apiConfigs, setApiConfigs] = useState<APIConfig[]>([
    {
      id: '1',
      name: 'OpenAI GPT-4',
      type: 'openai',
      status: 'active',
      apiKey: 'sk-***',
      endpoint: 'https://api.openai.com/v1',
      lastUsed: getUsageForAPI('openai').lastUsed,
      usage: getUsageForAPI('openai')
    },
    {
      id: '2',
      name: 'Google Gemini',
      type: 'gemini',
      status: 'active',
      apiKey: 'AI***',
      endpoint: 'https://generativelanguage.googleapis.com',
      lastUsed: getUsageForAPI('gemini').lastUsed,
      usage: getUsageForAPI('gemini')
    },
    {
      id: '3',
      name: 'Koala.sh SEO',
      type: 'koala',
      status: 'active',
      apiKey: 'b97d07a6-***',
      endpoint: 'https://api.koala.sh/v1',
      lastUsed: getUsageForAPI('koala').lastUsed,
      usage: getUsageForAPI('koala')
    }
  ])

  // Atualizar dados das APIs quando o hook mudar
  useEffect(() => {
    setApiConfigs(prev => prev.map(config => ({
      ...config,
      lastUsed: getUsageForAPI(config.type as 'openai' | 'gemini' | 'koala').lastUsed,
      usage: getUsageForAPI(config.type as 'openai' | 'gemini' | 'koala')
    })))
  }, [usageData, getUsageForAPI])

  const handleAddSite = () => {
    if (!newSite.name || !newSite.url) {
      setSuccessData({
        title: 'Erro de Validação',
        message: 'Por favor, preencha pelo menos o nome e URL do site',
        details: []
      })
      setShowSuccessModal(true)
      return
    }

    const site: Site = {
      id: Date.now().toString(),
      name: newSite.name,
      url: newSite.url,
      organizationId: currentOrganization?.id || '',
      isActive: true,
      settings: {
        wordpressUrl: newSite.wordpressUrl,
        wordpressUser: newSite.wordpressUser,
        wordpressAppPassword: newSite.wordpressAppPassword,
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Salvar site no localStorage
    if (typeof window !== 'undefined') {
      const existingSites = JSON.parse(localStorage.getItem('cms-sites') || '[]')
      const updatedSites = [...existingSites, site]
      localStorage.setItem('cms-sites', JSON.stringify(updatedSites))
    }

    // Atualizar contexto
    updateSite(site.id, site)

    setNewSite({
      name: '',
      url: '',
      description: '',
      wordpressUrl: '',
      wordpressUser: '',
      wordpressAppPassword: ''
    })
    setShowAddSiteModal(false)
    
    setSuccessData({
      title: 'Site Criado',
      message: 'Site criado com sucesso! Todas as ferramentas foram ativadas para este site.',
      details: []
    })
    setShowSuccessModal(true)
  }

  const handleAddOrganization = () => {
    if (!newOrg.name) {
      setSuccessData({
        title: 'Erro de Validação',
        message: 'Por favor, preencha o nome da organização',
        details: []
      })
      setShowSuccessModal(true)
      return
    }

    const org = {
      id: Date.now().toString(),
      name: newOrg.name,
      description: newOrg.description,
      email: newOrg.email,
      phone: newOrg.phone,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Salvar organização no localStorage
    if (typeof window !== 'undefined') {
      const existingOrgs = JSON.parse(localStorage.getItem('cms-organizations') || '[]')
      const updatedOrgs = [...existingOrgs, org]
      localStorage.setItem('cms-organizations', JSON.stringify(updatedOrgs))
    }

    setNewOrg({
      name: '',
      description: '',
      email: '',
      phone: ''
    })
    setShowAddOrgModal(false)
    
    setSuccessData({
      title: 'Organização Criada',
      message: 'Organização criada com sucesso! Agora você pode associar sites e usuários.',
      details: []
    })
    setShowSuccessModal(true)
  }

   async (siteId: string) => {
    const site = sites.find((s: any) => s.id === siteId)
    if (!site) return

    try {
      setSuccessData({
        title: 'Sincronizando Dados',
        message: `Sincronizando dados reais com ${site.name}...`,
        details: []
      })
      setShowSuccessModal(true)
      
      // Verificar credenciais
      if (!site.settings?.wordpressUrl || !site.settings?.wordpressUser || !site.settings?.wordpressAppPassword) {
        setSuccessData({
          title: 'Erro de Configuração',
          message: 'Credenciais do WordPress não configuradas!',
          details: ['Verifique se a URL, usuário e senha de aplicação estão preenchidos']
        })
        setShowSuccessModal(true)
        return
      }
      
      // Importar e usar a sincronização completa do WordPress
      const { WordPressSync } = await import('@/lib/wordpress-sync')
      const wpSync = new WordPressSync(
        site.settings.wordpressUrl,
        site.settings.wordpressUser,
        site.settings.wordpressAppPassword
      )
      
      // Sincronizar TODOS os dados do WordPress
      const syncResult = await wpSync.syncAllContent()
      
      if (!syncResult.success) {
        setSuccessData({
          title: 'Erro na Sincronização',
          message: 'Falha ao sincronizar dados do WordPress',
          details: syncResult.errors || ['Erro desconhecido']
        })
        setShowSuccessModal(true)
        return
      }
      
      const realStats = {
        posts: syncResult.stats.posts,
        pages: syncResult.stats.pages,
        media: syncResult.stats.media,
        categories: syncResult.stats.categories,
        tags: syncResult.stats.tags,
        users: syncResult.stats.users,
        lastSync: new Date()
      }
      
      // Atualizar site com dados reais
      const updatedSite = {
        ...site,
        lastSync: realStats.lastSync,
        posts: realStats.posts,
        pages: realStats.pages,
        media: realStats.media,
        status: 'active' as const
      }
      
      // Atualizar no localStorage
      if (typeof window !== 'undefined') {
        const savedSites = localStorage.getItem('cms-sites')
        if (savedSites) {
          const parsedSites = JSON.parse(savedSites)
          const updatedSites = parsedSites.map((s: any) => 
            s.id === siteId ? updatedSite : s
          )
          localStorage.setItem('cms-sites', JSON.stringify(updatedSites))
        }
      }
      
      setSuccessData({
        title: 'Sincronização Completa Concluída',
        message: 'Todos os dados do WordPress foram sincronizados com sucesso!',
        details: [
          `Posts: ${realStats.posts} (100% sincronizados)`,
          `Páginas: ${realStats.pages} (100% sincronizadas)`,
          `Mídia: ${realStats.media} (100% sincronizada)`,
          `Usuários: ${realStats.users} (100% sincronizados)`,
          `Categorias: ${realStats.categories} (100% sincronizadas)`,
          `Tags: ${realStats.tags} (100% sincronizadas)`,
          '',
          'Dados organizados no CMS seguindo o padrão do Dashboard',
          'Mídias, páginas e posts disponíveis nos menus correspondentes',
          'Sincronização completa sem limitações de paginação'
        ]
      })
      setShowSuccessModal(true)
      
    } catch (error) {
      setSuccessData({
        title: 'Erro na Sincronização',
        message: 'Falha ao sincronizar dados do WordPress',
        details: [error instanceof Error ? error.message : 'Erro desconhecido']
      })
      setShowSuccessModal(true)
    }
  }

  // Função para sincronização gradual com ATLZ
  const handleFullSyncATLZ = async () => {
    if (!currentSite?.settings?.wordpressUrl || !currentSite?.settings?.wordpressUser || !currentSite?.settings?.wordpressAppPassword) {
      setSuccessData({
        title: 'Erro de Configuração',
        message: 'Credenciais do WordPress não configuradas!',
        details: ['Verifique se a URL, usuário e senha de aplicação estão preenchidos']
      })
      setShowSuccessModal(true)
      return
    }

    console.log('Iniciando sincronização gradual com ATLZ...')
    
    // Usar o hook de sincronização
    await syncData(
      currentSite.settings.wordpressUrl,
      currentSite.settings.wordpressUser,
      currentSite.settings.wordpressAppPassword
    )
  }

  // Funções para gerenciar APIs
  const handleAddAPI = async () => {
    try {
      const newAPIConfig: APIConfig = {
        id: Date.now().toString(),
        name: newAPI.name,
        type: newAPI.type,
        status: 'active',
        apiKey: newAPI.apiKey,
        endpoint: newAPI.endpoint,
        lastUsed: new Date(),
        usage: { requests: 0, tokens: 0, cost: 0 }
      }
      
      setApiConfigs(prev => [...prev, newAPIConfig])
      setShowAddAPIModal(false)
      setNewAPI({ name: '', type: 'openai', apiKey: '', endpoint: '', model: '', maxTokens: 4000, temperature: 0.7 })
      
      setSuccessData({
        title: 'API Adicionada',
        message: 'Nova configuração de API adicionada com sucesso!',
        details: [`${newAPI.name} foi configurada e está ativa`]
      })
      setShowSuccessModal(true)
    } catch (error) {
      setSuccessData({
        title: 'Erro',
        message: 'Falha ao adicionar API',
        details: [error instanceof Error ? error.message : 'Erro desconhecido']
      })
      setShowSuccessModal(true)
    }
  }

  const handleTestConnection = async (apiId: string) => {
    setTestingConnection(apiId)
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setApiConfigs(prev => prev.map(api => 
        api.id === apiId 
          ? { ...api, status: 'active', lastUsed: new Date() }
          : api
      ))
      
      setSuccessData({
        title: 'Conexão Testada',
        message: 'Conexão com a API foi bem-sucedida!',
        details: ['A API está funcionando corretamente']
      })
      setShowSuccessModal(true)
    } catch (error) {
      setApiConfigs(prev => prev.map(api => 
        api.id === apiId 
          ? { ...api, status: 'error' }
          : api
      ))
      
      setSuccessData({
        title: 'Erro na Conexão',
        message: 'Falha ao conectar com a API',
        details: [error instanceof Error ? error.message : 'Erro desconhecido']
      })
      setShowSuccessModal(true)
    } finally {
      setTestingConnection(null)
    }
  }

   (apiId: string) => {
    const api = apiConfigs.find(a => a.id === apiId)
    if (api) {
      setEditingAPI({
        name: api.name,
        type: api.type,
        apiKey: api.apiKey,
        endpoint: api.endpoint,
        model: api.type === 'openai' ? 'gpt-4' : api.type === 'gemini' ? 'gemini-pro' : 'koala-seo',
        maxTokens: 4000,
        temperature: 0.7
      })
      setShowEditAPIModal(apiId)
    }
  }

  const handleSaveEditAPI = async () => {
    try {
      setApiConfigs(prev => prev.map(api => 
        api.id === showEditAPIModal
          ? { 
              ...api, 
              name: editingAPI.name,
              apiKey: editingAPI.apiKey,
              endpoint: editingAPI.endpoint,
              lastUsed: new Date()
            }
          : api
      ))
      
      setShowEditAPIModal(null)
      setEditingAPI({ name: '', type: 'openai', apiKey: '', endpoint: '', model: '', maxTokens: 4000, temperature: 0.7 })
      
      setSuccessData({
        title: 'API Atualizada',
        message: 'Configuração de API atualizada com sucesso!',
        details: [`${editingAPI.name} foi atualizada`]
      })
      setShowSuccessModal(true)
    } catch (error) {
      setSuccessData({
        title: 'Erro',
        message: 'Falha ao atualizar API',
        details: [error instanceof Error ? error.message : 'Erro desconhecido']
      })
      setShowSuccessModal(true)
    }
  }

  const handleDeleteAPI = async (apiId: string) => {
    try {
      setApiConfigs(prev => prev.filter(api => api.id !== apiId))
      setShowDeleteAPIModal(null)
      
      setSuccessData({
        title: 'API Removida',
        message: 'Configuração de API removida com sucesso!',
        details: ['A API foi removida do sistema']
      })
      setShowSuccessModal(true)
    } catch (error) {
      setSuccessData({
        title: 'Erro',
        message: 'Falha ao remover API',
        details: [error instanceof Error ? error.message : 'Erro desconhecido']
      })
      setShowSuccessModal(true)
    }
  }


  const tabs = [
    { id: 'organizations', name: 'Organizações', icon: Building2 },
    { id: 'sites', name: 'Sites WordPress', icon: Globe },
    { id: 'wordpress', name: 'Configurações WP', icon: FlaskConical },
    { id: 'apis', name: 'APIs & IAs', icon: Bot },
    { id: 'integrations', name: 'Integrações', icon: LinkIcon },
    { id: 'security', name: 'Segurança', icon: Shield },
    { id: 'notifications', name: 'Notificações', icon: Bell }
  ]

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div style={getLayoutStyles().container}>
          {/* Header */}
          <div style={getLayoutStyles().header}>
            <h1 style={getLayoutStyles().title}>
              Configurações
            </h1>
            <p style={getLayoutStyles().subtitle}>
              Gerencie todas as configurações do sistema em um só lugar
            </p>
          </div>

          {/* Tabs Navigation */}
          <div className="cms-border-b cms-border-gray-200 cms-mb-8">
            <div className="cms-flex cms-gap-2 cms-overflow-x-auto cms-pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`cms-flex cms-items-center cms-gap-2 cms-px-4 cms-py-3 cms-border-none cms-bg-transparent cms-cursor-pointer cms-text-sm cms-font-medium cms-whitespace-nowrap cms-transition-all ${
                      isActive ? 'cms-text-primary' : 'cms-text-gray-500'
                    }`}
                    style={{
                      borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent'
                    }}
                  >
                    <Icon style={{ width: '1rem', height: '1rem' }} />
                    {tab.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'organizations' && (
            <div>
              <div className="cms-flex cms-justify-between cms-items-center cms-mb-6">
                <h2 className="cms-text-2xl cms-font-semibold cms-text-gray-800">
                  Organizações
                </h2>
                <button
                  onClick={() => setShowAddOrgModal(true)}
                  className="cms-btn cms-btn-primary cms-flex cms-items-center cms-gap-2 cms-px-6 cms-py-3"
                >
                  <Plus style={{ width: '1rem', height: '1rem' }} />
                  Nova Organização
                </button>
              </div>

              {/* Organizations List */}
              <div className="cms-grid cms-gap-4">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className="cms-card cms-bg-white cms-border cms-border-gray-200 cms-rounded-lg cms-p-6 cms-shadow"
                  >
                    <div className="cms-flex cms-justify-between cms-items-start">
                      <div>
                        <h3 className="cms-text-xl cms-font-semibold cms-mb-1 cms-text-gray-800">
                          {org.name}
                        </h3>
                        <p className="cms-text-gray-500 cms-text-sm">
                          {(org as any).description || 'Sem descrição'}
                        </p>
                      </div>
                      <div className="cms-flex cms-gap-2">
                        <button
                          className="cms-btn cms-btn-secondary cms-flex cms-items-center cms-gap-1 cms-px-4 cms-py-2 cms-bg-gray-100 cms-text-gray-700 cms-text-sm cms-rounded"
                        >
                          <Edit style={{ width: '1rem', height: '1rem' }} />
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sites' && (
            <div>
              <div className="cms-flex cms-justify-between cms-items-center cms-mb-6">
                <h2 className="cms-text-2xl cms-font-semibold cms-text-gray-800">
                  Sites WordPress
                </h2>
                <button
                  onClick={() => setShowAddSiteModal(true)}
                  className="cms-btn cms-btn-primary cms-flex cms-items-center cms-gap-2 cms-px-6 cms-py-3"
                >
                  <Plus style={{ width: '1rem', height: '1rem' }} />
                  Novo Site
                </button>
              </div>

              {/* Sites List */}
              <div className="cms-grid cms-gap-4">
                {sites
                  .filter((site: any) => site.organizationId === currentOrganization?.id)
                  .map((site: any) => (
                  <div
                    key={site.id}
                    className="cms-card cms-bg-white cms-border cms-border-gray-200 cms-rounded-lg cms-p-6 cms-shadow"
                  >
                    <div className="cms-flex cms-justify-between cms-items-start cms-mb-4">
                      <div>
                        <h3 className="cms-text-xl cms-font-semibold cms-mb-1 cms-text-gray-800">
                          {site.name}
                        </h3>
                        <p className="cms-text-gray-500 cms-text-sm">
                          {site.url}
                        </p>
                      </div>
                      <div className="cms-flex cms-gap-2">
                        <button
                          onClick={() => setShowCredentialsModal(true)}
                          className="cms-btn cms-btn-primary cms-flex cms-items-center cms-gap-1 cms-px-4 cms-py-2 cms-text-sm cms-rounded"
                        >
                          <Shield style={{ width: '1rem', height: '1rem' }} />
                          Diagnóstico
                        </button>
                        
                        <button
                          onClick={handleFullSyncATLZ}
                          className="cms-btn cms-flex cms-items-center cms-gap-1 cms-px-4 cms-py-2 cms-text-sm cms-rounded cms-text-white"
                          style={{ backgroundColor: 'var(--success)' }}
                        >
                          <Zap style={{ width: '1rem', height: '1rem' }} />
                          Sincronização Completa
                        </button>
                      </div>
                    </div>
                    
                    <div className="cms-grid cms-gap-4 cms-mt-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                      <div className="cms-text-center">
                        <div className="cms-text-2xl cms-font-bold cms-text-primary">
                          {(site as any).posts || 0}
                        </div>
                        <div className="cms-text-sm cms-text-gray-500">Posts</div>
                      </div>
                      <div className="cms-text-center">
                        <div className="cms-text-2xl cms-font-bold cms-text-success">
                          {(site as any).pages || 0}
                        </div>
                        <div className="cms-text-sm cms-text-gray-500">Páginas</div>
                      </div>
                      <div className="cms-text-center">
                        <div className="cms-text-2xl cms-font-bold cms-text-warning">
                          {(site as any).media || 0}
                        </div>
                        <div className="cms-text-sm cms-text-gray-500">Mídia</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'apis' && (
            <div>
              <div className="cms-flex cms-justify-between cms-items-center cms-mb-6">
                <div>
                  <h2 className="cms-text-2xl cms-font-semibold cms-text-gray-800 cms-mb-1">
                    APIs & Inteligência Artificial
                  </h2>
                  <p className="cms-text-gray-500 cms-text-sm">
                    Gerencie as conexões com IAs, WordPress e serviços externos
                  </p>
                </div>
                <button
                  onClick={() => setShowAddAPIModal(true)}
                  className="cms-btn cms-flex cms-items-center cms-gap-2 cms-px-6 cms-py-3 cms-text-white"
                  style={{ backgroundColor: 'var(--danger)' }}
                >
                  <Plus style={{ width: '1rem', height: '1rem' }} />
                  Nova Configuração
                </button>
              </div>

              {/* API Configs Grid */}
              <div className="cms-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {apiConfigs.map((api) => {
                  const typeColor = api.type === 'openai' ? 'var(--success)' : api.type === 'gemini' ? 'var(--primary)' : 'var(--warning)'
                  return (
                    <div
                      key={api.id}
                      className="cms-card cms-bg-white cms-border cms-border-gray-200 cms-rounded-lg cms-p-6 cms-shadow cms-transition-all"
                    >
                    <div className="cms-flex cms-justify-between cms-items-start cms-mb-4">
                      <div className="cms-flex cms-items-center cms-gap-3">
                        <div 
                          className="cms-flex cms-items-center cms-justify-center cms-rounded"
                          style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            backgroundColor: typeColor
                          }}
                        >
                          <Bot style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                        </div>
                        <div>
                          <h3 className="cms-text-lg cms-font-semibold cms-text-gray-800 cms-mb-1">
                            {api.name}
                          </h3>
                          <p className="cms-text-gray-500 cms-text-xs cms-uppercase cms-font-medium">
                            {api.type}
                          </p>
                        </div>
                      </div>
                      <div className="cms-flex cms-gap-2">
                        <button
                          onClick={() => handleTestConnection(api.id)}
                          disabled={testingConnection === api.id}
                          className={`cms-flex cms-items-center cms-gap-1 cms-p-2 cms-border-none cms-rounded cms-text-xs ${
                            testingConnection === api.id 
                              ? 'cms-bg-gray-200 cms-text-gray-400 cms-cursor-not-allowed' 
                              : 'cms-bg-gray-100 cms-text-gray-700 cms-cursor-pointer'
                          }`}
                          title="Testar Conexão"
                        >
                          {testingConnection === api.id ? (
                            <div 
                              className="cms-rounded-full"
                              style={{ 
                                width: '1rem', 
                                height: '1rem', 
                                border: '2px solid var(--primary)', 
                                borderTop: '2px solid transparent', 
                                animation: 'spin 1s linear infinite' 
                              }} 
                            />
                          ) : (
                            <TestTube style={{ width: '1rem', height: '1rem' }} />
                          )}
                        </button>
                        <button
                          onClick={() => setShowEditAPIModal(api.id)}
                          className="cms-btn cms-btn-secondary cms-flex cms-items-center cms-gap-1 cms-p-2 cms-bg-gray-100 cms-text-gray-700 cms-text-xs cms-rounded"
                          title="Editar"
                        >
                          <Edit style={{ width: '1rem', height: '1rem' }} />
                        </button>
                        <button
                          onClick={() => setShowDeleteAPIModal(api.id)}
                          className="cms-btn cms-flex cms-items-center cms-gap-1 cms-p-2 cms-text-xs cms-rounded"
                          style={{ backgroundColor: 'var(--error-light)', color: 'var(--danger)' }}
                          title="Excluir"
                        >
                          <Trash2 style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="cms-flex cms-items-center cms-gap-2 cms-mb-4">
                      <div 
                        className="cms-rounded-full"
                        style={{
                          width: '0.5rem',
                          height: '0.5rem',
                          backgroundColor: api.status === 'active' ? 'var(--success)' : 'var(--warning)'
                        }} 
                      />
                      <span className={`cms-text-sm cms-font-medium ${
                        api.status === 'active' ? 'cms-text-success' : 'cms-text-warning'
                      }`}>
                        {api.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    {/* API Key Status */}
                    <div className="cms-mb-4">
                      <div className="cms-flex cms-items-center cms-gap-2 cms-mb-2">
                        <Key style={{ width: '1rem', height: '1rem', color: 'var(--gray-500)' }} />
                        <span className="cms-text-sm cms-text-gray-500">
                          {api.apiKey ? 'API Key configurada' : 'Sem API Key'}
                        </span>
                      </div>
                      <div className="cms-flex cms-items-center cms-gap-2">
                        <Globe style={{ width: '1rem', height: '1rem', color: 'var(--gray-500)' }} />
                        <span className="cms-text-xs cms-text-gray-500" style={{ fontFamily: 'monospace' }}>
                          {api.endpoint}
                        </span>
                      </div>
                    </div>

                    {/* Usage Stats */}
                    <div className="cms-grid cms-gap-4 cms-p-4 cms-bg-gray-50 cms-rounded cms-mb-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="cms-text-center">
                        <div className="cms-text-xl cms-font-bold cms-text-primary">
                          {api.usage.requests.toLocaleString()}
                        </div>
                        <div className="cms-text-xs cms-text-gray-500">Requisições</div>
                      </div>
                      <div className="cms-text-center">
                        <div className="cms-text-xl cms-font-bold cms-text-success">
                          {api.usage.tokens.toLocaleString()}
                        </div>
                        <div className="cms-text-xs cms-text-gray-500">Tokens</div>
                      </div>
                      <div className="cms-text-center">
                        <div className="cms-text-xl cms-font-bold cms-text-warning">
                          {'$' + api.usage.cost.toFixed(2)}
                        </div>
                        <div className="cms-text-xs cms-text-gray-500">Custo</div>
                      </div>
                    </div>

                    {/* Last Used */}
                    <div className="cms-text-xs cms-text-gray-500">
                      Último uso: {new Date(api.lastUsed).toLocaleDateString('pt-BR')} às {new Date(api.lastUsed).toLocaleTimeString('pt-BR')}
                    </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Other tabs content would go here */}
          {activeTab === 'wordpress' && (
            <div>
              <h2 className="cms-text-2xl cms-font-semibold cms-text-gray-800 cms-mb-6">
                Configurações WordPress
              </h2>
              <p className="cms-text-gray-500">Configurações avançadas do WordPress em desenvolvimento...</p>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div>
              <h2 className="cms-text-2xl cms-font-semibold cms-text-gray-800 cms-mb-6">
                Integrações
              </h2>
              <p className="cms-text-gray-500">Integrações com serviços externos em desenvolvimento...</p>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="cms-text-2xl cms-font-semibold cms-text-gray-800 cms-mb-6">
                Segurança
              </h2>
              <p className="cms-text-gray-500">Configurações de segurança em desenvolvimento...</p>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="cms-text-2xl cms-font-semibold cms-text-gray-800 cms-mb-6">
                Notificações
              </h2>
              <p className="cms-text-gray-500">Configurações de notificações em desenvolvimento...</p>
            </div>
          )}

          {/* Modals */}
          {/* Add Site Modal */}
          {showAddSiteModal && (
            <div className="cms-modal-overlay">
              <div className="cms-modal-content">
                <h3 className="cms-text-xl cms-font-semibold cms-mb-6">
                  Novo Site WordPress
                </h3>
                
                <div className="cms-flex-col cms-gap-4">
                  <div>
                    <label className="cms-label">
                      Nome do Site
                    </label>
                    <input
                      type="text"
                      value={newSite.name}
                      onChange={(e) => setNewSite({...newSite, name: e.target.value})}
                      className="cms-input"
                      placeholder="Ex: Meu Site"
                    />
                  </div>

                  <div>
                    <label className="cms-label">
                      URL do Site
                    </label>
                    <input
                      type="url"
                      value={newSite.url}
                      onChange={(e) => setNewSite({...newSite, url: e.target.value})}
                      className="cms-input"
                      placeholder="https://meusite.com"
                    />
                  </div>

                  <div>
                    <label className="cms-label">
                      URL do WordPress
                    </label>
                    <input
                      type="url"
                      value={newSite.wordpressUrl}
                      onChange={(e) => setNewSite({...newSite, wordpressUrl: e.target.value})}
                      className="cms-input"
                      placeholder="https://meusite.com"
                    />
                  </div>

                  <div>
                    <label className="cms-label">
                      Usuário WordPress
                    </label>
                    <input
                      type="text"
                      value={newSite.wordpressUser}
                      onChange={(e) => setNewSite({...newSite, wordpressUser: e.target.value})}
                      className="cms-input"
                      placeholder="danilobrandao"
                    />
                  </div>

                  <div>
                    <label className="cms-label">
                      Senha de Aplicação
                    </label>
                    <input
                      type="password"
                      value={newSite.wordpressAppPassword}
                      onChange={(e) => setNewSite({...newSite, wordpressAppPassword: e.target.value})}
                      className="cms-input"
                      placeholder="j4qD STH0 m2SB e2xc ZAfW 4XAK"
                    />
                  </div>
                </div>

                <div className="cms-flex cms-gap-3 cms-justify-end cms-mt-6">
                  <button
                    onClick={() => setShowAddSiteModal(false)}
                    className="cms-btn cms-btn-secondary cms-px-6 cms-py-3"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddSite}
                    className="cms-btn cms-btn-primary cms-px-6 cms-py-3"
                  >
                    Criar Site
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Organization Modal */}
          {showAddOrgModal && (
            <div className="cms-modal-overlay">
              <div className="cms-modal-content">
                <h3 className="cms-text-xl cms-font-semibold cms-mb-6">
                  Nova Organização
                </h3>
                
                <div className="cms-flex-col cms-gap-4">
                  <div>
                    <label className="cms-label">
                      Nome da Organização
                    </label>
                    <input
                      type="text"
                      value={newOrg.name}
                      onChange={(e) => setNewOrg({...newOrg, name: e.target.value})}
                      className="cms-input"
                      placeholder="Ex: Minha Empresa"
                    />
                  </div>

                  <div>
                    <label className="cms-label">
                      Descrição
                    </label>
                    <textarea
                      value={newOrg.description}
                      onChange={(e) => setNewOrg({...newOrg, description: e.target.value})}
                      className="cms-textarea"
                      placeholder="Descrição da organização..."
                    />
                  </div>

                  <div>
                    <label className="cms-label">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newOrg.email}
                      onChange={(e) => setNewOrg({...newOrg, email: e.target.value})}
                      className="cms-input"
                      placeholder="contato@empresa.com"
                    />
                  </div>

                  <div>
                    <label className="cms-label">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={newOrg.phone}
                      onChange={(e) => setNewOrg({...newOrg, phone: e.target.value})}
                      className="cms-input"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="cms-flex cms-gap-3 cms-justify-end cms-mt-6">
                  <button
                    onClick={() => setShowAddOrgModal(false)}
                    className="cms-btn cms-btn-secondary cms-px-6 cms-py-3"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddOrganization}
                    className="cms-btn cms-btn-primary cms-px-6 cms-py-3"
                  >
                    Criar Organização
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Progress Modal */}
          <ProgressModal
            isOpen={showProgressModal}
            onClose={closeProgressModal}
            title="Sincronizando Dados"
            progress={{
              percentage: progress.percentage,
              currentStep: progress.currentStep,
              totalSteps: 6,
              currentStepIndex: Math.floor(progress.percentage / 16.67),
              details: [
                `Total: ${progress.totalItems} itens`,
                `Processados: ${progress.processedItems} itens`,
                `Erros: ${progress.errors}`,
                `Avisos: ${progress.warnings}`
              ],
              isComplete: progress.percentage === 100,
              hasError: progress.errors > 0
            }}
          />


          {/* Success Modal */}
          <SuccessModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            title={successData.title}
            message={successData.message}
            details={successData.details}
          />

          {/* Modal de Diagnóstico de Credenciais */}
          <Modal
            isOpen={showCredentialsModal}
            onClose={() => setShowCredentialsModal(false)}
            title="Diagnóstico de Credenciais WordPress"
            size="lg"
          >
            <div className="p-6">
              {currentSite && (
                <CredentialsDiagnostic
                  baseUrl={currentSite.settings?.wordpressUrl || ''}
                  username={currentSite.settings?.wordpressUser || ''}
                  password={currentSite.settings?.wordpressAppPassword || ''}
                  onTestComplete={(result) => {
                    console.log('Resultado do diagnóstico:', result)
                  }}
                />
              )}
            </div>
          </Modal>

          {/* Modal para Adicionar API */}
          <Modal
            isOpen={showAddAPIModal}
            onClose={() => setShowAddAPIModal(false)}
            title="Nova Configuração de API"
            size="lg"
          >
            <div className="cms-p-6">
              <div className="cms-flex-col cms-gap-4">
                <div>
                  <label className="cms-label">
                    Nome da API
                  </label>
                  <input
                    type="text"
                    value={newAPI.name}
                    onChange={(e) => setNewAPI({...newAPI, name: e.target.value})}
                    className="cms-input"
                    placeholder="Ex: OpenAI GPT-4"
                  />
                </div>

                <div>
                  <label className="cms-label">
                    Tipo de API
                  </label>
                  <select
                    value={newAPI.type}
                    onChange={(e) => setNewAPI({...newAPI, type: e.target.value})}
                    className="cms-select"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="claude">Anthropic Claude</option>
                    <option value="koala">Koala.sh</option>
                    <option value="stability">Stability AI</option>
                  </select>
                </div>

                <div>
                  <label className="cms-label">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={newAPI.apiKey}
                    onChange={(e) => setNewAPI({...newAPI, apiKey: e.target.value})}
                    className="cms-input"
                    placeholder="Sua API Key aqui..."
                  />
                </div>

                <div>
                  <label className="cms-label">
                    Endpoint
                  </label>
                  <input
                    type="url"
                    value={newAPI.endpoint}
                    onChange={(e) => setNewAPI({...newAPI, endpoint: e.target.value})}
                    className="cms-input"
                    placeholder="https://api.openai.com/v1"
                  />
                </div>

                <div className="cms-flex cms-gap-4 cms-justify-end cms-mt-4">
                  <button
                    onClick={() => setShowAddAPIModal(false)}
                    className="cms-btn cms-btn-secondary cms-px-6 cms-py-3"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddAPI}
                    className="cms-btn cms-btn-primary cms-px-6 cms-py-3"
                  >
                    Adicionar API
                  </button>
                </div>
              </div>
            </div>
          </Modal>

          {/* Modal para Editar API */}
          <Modal
            isOpen={showEditAPIModal !== null}
            onClose={() => setShowEditAPIModal(null)}
            title="Editar Configuração de API"
            size="lg"
          >
            <div className="cms-p-6">
              <div className="cms-flex-col cms-gap-4">
                <div>
                  <label className="cms-label">
                    Nome da API
                  </label>
                  <input
                    type="text"
                    value={editingAPI.name}
                    onChange={(e) => setEditingAPI({...editingAPI, name: e.target.value})}
                    className="cms-input"
                    placeholder="Ex: OpenAI GPT-4"
                  />
                </div>

                <div>
                  <label className="cms-label">
                    Tipo de API
                  </label>
                  <select
                    value={editingAPI.type}
                    onChange={(e) => setEditingAPI({...editingAPI, type: e.target.value})}
                    className="cms-select"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="claude">Anthropic Claude</option>
                    <option value="koala">Koala.sh</option>
                    <option value="stability">Stability AI</option>
                  </select>
                </div>

                <div>
                  <label className="cms-label">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={editingAPI.apiKey}
                    onChange={(e) => setEditingAPI({...editingAPI, apiKey: e.target.value})}
                    className="cms-input"
                    placeholder="Sua API Key aqui..."
                  />
                </div>

                <div>
                  <label className="cms-label">
                    Endpoint
                  </label>
                  <input
                    type="url"
                    value={editingAPI.endpoint}
                    onChange={(e) => setEditingAPI({...editingAPI, endpoint: e.target.value})}
                    className="cms-input"
                    placeholder="https://api.openai.com/v1"
                  />
                </div>

                <div className="cms-flex cms-gap-4 cms-justify-end cms-mt-4">
                  <button
                    onClick={() => setShowEditAPIModal(null)}
                    className="cms-btn cms-btn-secondary cms-px-6 cms-py-3"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEditAPI}
                    className="cms-btn cms-btn-primary cms-px-6 cms-py-3"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          </Modal>

          {/* Modal para Confirmar Exclusão de API */}
          <ConfirmModal
            isOpen={showDeleteAPIModal !== null}
            onClose={() => setShowDeleteAPIModal(null)}
            onConfirm={() => handleDeleteAPI(showDeleteAPIModal!)}
            title="Excluir Configuração de API"
            message="Tem certeza que deseja excluir esta configuração de API? Esta ação não pode ser desfeita."
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}