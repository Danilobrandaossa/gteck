// Hook para verificar permissões de usuário
import { useAuth } from '@/contexts/auth-context'

export interface Permission {
  canCreateOrganizations: boolean
  canCreateSites: boolean
  canEditOrganizations: boolean
  canEditSites: boolean
  canDeleteOrganizations: boolean
  canDeleteSites: boolean
  canManageUsers: boolean
  canViewDiagnostics: boolean
  canRunDiagnostics: boolean
  canManageContent: boolean
  canManageMedia: boolean
  canManageSEO: boolean
}

export function usePermissions(): Permission {
  const { user } = useAuth()

  const isAdmin = user?.role === 'admin'
  const isEditor = user?.role === 'editor'
  const isViewer = user?.role === 'viewer'

  return {
    // Apenas ADMIN pode criar organizações e sites
    canCreateOrganizations: isAdmin,
    canCreateSites: isAdmin,
    canEditOrganizations: isAdmin,
    canEditSites: isAdmin,
    canDeleteOrganizations: isAdmin,
    canDeleteSites: isAdmin,
    
    // ADMIN e EDITOR podem gerenciar usuários
    canManageUsers: isAdmin || isEditor,
    
    // Todos podem visualizar diagnósticos
    canViewDiagnostics: true,
    
    // ADMIN e EDITOR podem executar diagnósticos
    canRunDiagnostics: isAdmin || isEditor,
    
    // ADMIN e EDITOR podem gerenciar conteúdo
    canManageContent: isAdmin || isEditor,
    canManageMedia: isAdmin || isEditor,
    canManageSEO: isAdmin || isEditor
  }
}

// Hook para verificar se usuário tem acesso a uma organização específica
export function useOrganizationAccess(organizationId: string): boolean {
  const { user } = useAuth()
  
  // ADMIN tem acesso a todas as organizações
  if (user?.role === 'admin') {
    return true
  }
  
  // Outros usuários só têm acesso à sua organização
  return user?.organizationId === organizationId
}

// Hook para verificar se usuário tem acesso a um site específico
export function useSiteAccess(siteId: string, organizationId: string): boolean {
  const { user } = useAuth()
  
  // ADMIN tem acesso a todos os sites
  if (user?.role === 'admin') {
    return true
  }
  
  // Outros usuários só têm acesso aos sites de sua organização
  return user?.organizationId === organizationId
}

// Hook para verificar se usuário pode acessar funcionalidades administrativas
export function useAdminAccess(): boolean {
  const { user } = useAuth()
  return user?.role === 'admin'
}

// Hook para verificar se usuário pode editar conteúdo
export function useEditAccess(): boolean {
  const { user } = useAuth()
  return user?.role === 'admin' || user?.role === 'editor'
}




