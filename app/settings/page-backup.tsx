'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useOrganization } from '@/contexts/organization-context'
import { 
  Settings, 
  Key, 
  Globe, 
  Bot, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Save,
  TestTube,
  Building2,
  FlaskConical,
  Shield,
  Mail,
  Users,
  MoreHorizontal
} from 'lucide-react'
import { Modal, ConfirmModal, SuccessModal } from '@/components/ui/modal'

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
  const { organizations, sites, setSites, getOrganizationStats, syncWordPressData, updateSite, currentOrganization } = useOrganization()
  
  // Estados para modais
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [successData, setSuccessData] = useState<{
    title: string
    message: string
    details: string[]
  }>({ title: '', message: '', details: [] })
  const [confirmData, setConfirmData] = useState<{
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

  const handleSyncSite = async (siteId: string) => {
    const site = sites.find(s => s.id === siteId)
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
      
      // Importar e usar a API real do WordPress
      const { WordPressAPI } = await import('@/lib/wordpress-api')
      const wpApi = new WordPressAPI(
        site.settings.wordpressUrl,
        site.settings.wordpressUser,
        site.settings.wordpressAppPassword
      )
      
      // Obter estatísticas reais do site
      const realStats = await wpApi.getSiteStats()
      
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
        title: 'Sincronização Concluída',
        message: 'Sincronização concluída! Dados reais obtidos:',
        details: [
          `Posts: ${realStats.posts}`,
          `Páginas: ${realStats.pages}`,
          `Mídia: ${realStats.media}`,
          `Usuários: ${realStats.users}`,
          `Categorias: ${realStats.categories}`,
          `Tags: ${realStats.tags}`
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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div style={{ padding: '2rem' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings style={{ width: '2rem', height: '2rem' }} />
              Configurações
            </h1>
            <p className="cms-text-gray-500 cms-text-lg">
              Gerencie todas as configurações do sistema em um só lugar
            </p>
          </div>

          {/* Sites Section */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'semibold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe style={{ width: '1.5rem', height: '1.5rem' }} />
                Sites WordPress
              </h2>
              <button
                onClick={() => setShowAddSiteModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 'medium'
                }}
              >
                <Plus style={{ width: '1rem', height: '1rem' }} />
                Novo Site
              </button>
            </div>

            {/* Sites List */}
            <div style={{ display: 'grid', gap: '1rem' }}>
              {sites.filter(site => site.organizationId === currentOrganization?.id).map((site) => (
                <div
                  key={site.id}
                  style={{
                    border: '1px solid var(--gray-200)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'semibold', marginBottom: '0.25rem' }}>
                        {site.name}
                      </h3>
                      <p className="cms-text-gray-500 cms-text-sm">
                        {site.url}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleSyncSite(site.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--success)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        <TestTube style={{ width: '1rem', height: '1rem' }} />
                        Sincronizar
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div className="cms-text-2xl cms-font-bold cms-text-primary">
                        {site.posts || 0}
                      </div>
                      <div className="cms-text-sm cms-text-gray-500">Posts</div>
                    </div>
                    <div className="cms-text-center">
                      <div className="cms-text-2xl cms-font-bold cms-text-success">
                        {site.pages || 0}
                      </div>
                      <div className="cms-text-sm cms-text-gray-500">Páginas</div>
                    </div>
                    <div className="cms-text-center">
                      <div className="cms-text-2xl cms-font-bold cms-text-warning">
                        {site.media || 0}
                      </div>
                      <div className="cms-text-sm cms-text-gray-500">Mídia</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modals */}
          <SuccessModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            title={successData.title}
            message={successData.message}
            details={successData.details}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}











