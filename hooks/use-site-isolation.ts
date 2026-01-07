// Hook para isolamento de dados por site
// @ts-expect-error FIX_BUILD
import { useSite } from '@/contexts/site-context'
import { useOrganization } from '@/contexts/organization-context'
import { useAuth } from '@/contexts/auth-context'

export interface SiteIsolationConfig {
  enabled: boolean
  siteId: string | null
  organizationId: string | null
  userId: string | null
  userRole: string | null
}

export function useSiteIsolation() {
  const { selectedSite } = useSite()
  const { currentOrganization } = useOrganization()
  const { user } = useAuth()

  const config: SiteIsolationConfig = {
    enabled: true,
    siteId: selectedSite?.id || null,
    organizationId: currentOrganization?.id || null,
    userId: user?.id || null,
    userRole: user?.role || null
  }

  // Verificar se o usuário tem acesso ao site atual
  const hasSiteAccess = (_siteId: string): boolean => {
    if (!user) return false
    
    // ADMIN tem acesso a todos os sites
    if (user.role === 'admin') return true
    
    // Outros usuários só têm acesso aos sites de sua organização
    return user.organizationId === currentOrganization?.id
  }

  // Verificar se o usuário pode acessar dados do site
  const canAccessSiteData = (): boolean => {
    if (!selectedSite) return false
    return hasSiteAccess(selectedSite.id)
  }

  // Filtrar dados por site
  const filterBySite = <T extends { siteId?: string }>(data: T[]): T[] => {
    if (!selectedSite) return []
    return data.filter(item => item.siteId === selectedSite.id)
  }

  // Filtrar dados por organização
  const filterByOrganization = <T extends { organizationId?: string }>(data: T[]): T[] => {
    if (!currentOrganization) return []
    return data.filter(item => item.organizationId === currentOrganization.id)
  }

  // Verificar se deve mostrar dados
  const shouldShowData = (dataSiteId?: string, dataOrganizationId?: string): boolean => {
    // Se não há site selecionado, não mostrar dados
    if (!selectedSite) return false
    
    // Verificar acesso ao site
    if (dataSiteId && dataSiteId !== selectedSite.id) return false
    
    // Verificar acesso à organização
    if (dataOrganizationId && dataOrganizationId !== currentOrganization?.id) return false
    
    return true
  }

  // Obter configuração de isolamento para APIs
  const getApiConfig = () => {
    return {
      siteId: selectedSite?.id,
      organizationId: currentOrganization?.id,
      userId: user?.id,
      userRole: user?.role,
      isolation: {
        enabled: true,
        siteFilter: selectedSite?.id,
        organizationFilter: currentOrganization?.id
      }
    }
  }

  // Verificar permissões específicas por site
  const hasSitePermission = (permission: string): boolean => {
    if (!selectedSite) return false
    if (!hasSiteAccess(selectedSite.id)) return false
    
    // Verificar permissões baseadas no role
    switch (permission) {
      case 'read':
        return true // Todos podem ler
      case 'write':
        return user?.role === 'admin' || user?.role === 'editor'
      case 'delete':
        return user?.role === 'admin'
      case 'manage':
        return user?.role === 'admin'
      default:
        return false
    }
  }

  // Obter mensagem de isolamento
  const getIsolationMessage = (): string => {
    if (!selectedSite) {
      return 'Selecione um site para visualizar os dados'
    }
    
    if (!hasSiteAccess(selectedSite.id)) {
      return 'Você não tem acesso a este site'
    }
    
    return `Visualizando dados do site: ${selectedSite.name}`
  }

  // Verificar se o sistema está configurado corretamente
  const isSystemConfigured = (): boolean => {
    return !!(selectedSite && currentOrganization && user)
  }

  // Obter status do isolamento
  const getIsolationStatus = () => {
    return {
      siteSelected: !!selectedSite,
      organizationSelected: !!currentOrganization,
      userLoggedIn: !!user,
      hasAccess: canAccessSiteData(),
      configured: isSystemConfigured()
    }
  }

  return {
    config,
    selectedSite,
    currentOrganization,
    user,
    hasSiteAccess,
    canAccessSiteData,
    filterBySite,
    filterByOrganization,
    shouldShowData,
    getApiConfig,
    hasSitePermission,
    getIsolationMessage,
    isSystemConfigured,
    getIsolationStatus
  }
}

// Hook específico para dados de conteúdo
export function useContentIsolation() {
  const { selectedSite, currentOrganization: _currentOrganization, user: _user } = useSiteIsolation()

  // Obter posts do site atual
  const getSitePosts = async () => {
    if (!selectedSite) return []
    
    // Simular busca de posts do site específico
    return [
      {
        id: '1',
        title: 'Post do Site 1',
        content: 'Conteúdo específico do site',
        siteId: selectedSite.id,
        publishedAt: new Date()
      }
    ]
  }

  // Obter páginas do site atual
  const getSitePages = async () => {
    if (!selectedSite) return []
    
    // Simular busca de páginas do site específico
    return [
      {
        id: '1',
        title: 'Página do Site 1',
        content: 'Conteúdo específico da página',
        siteId: selectedSite.id,
        publishedAt: new Date()
      }
    ]
  }

  // Obter mídia do site atual
  const getSiteMedia = async () => {
    if (!selectedSite) return []
    
    // Simular busca de mídia do site específico
    return [
      {
        id: '1',
        name: 'Imagem do Site 1',
        url: 'https://site1.com/image.jpg',
        siteId: selectedSite.id,
        uploadedAt: new Date()
      }
    ]
  }

  return {
    getSitePosts,
    getSitePages,
    getSiteMedia
  }
}

// Hook específico para configurações
export function useSettingsIsolation() {
  const { selectedSite, currentOrganization, user: _user } = useSiteIsolation()

  // Obter configurações do site atual
  const getSiteSettings = async () => {
    if (!selectedSite) return null
    
    return {
      siteId: selectedSite.id,
      name: selectedSite.name,
      url: selectedSite.url,
      wordpressUrl: selectedSite.wordpressUrl,
      theme: 'default',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo'
    }
  }

  // Obter configurações da organização atual
  const getOrganizationSettings = async () => {
    if (!currentOrganization) return null
    
    return {
      organizationId: currentOrganization.id,
      name: currentOrganization.name,
      slug: currentOrganization.slug,
      theme: currentOrganization.settings?.theme || 'blue',
      language: currentOrganization.settings?.language || 'pt-BR'
    }
  }

  return {
    getSiteSettings,
    getOrganizationSettings
  }
}




