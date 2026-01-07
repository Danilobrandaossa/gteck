/**
 * Sistema Centralizado de Controle de Acesso e Liberação de Funcionalidades
 * 
 * Esta é a fonte única de verdade sobre quais funcionalidades estão liberadas.
 * Qualquer mudança aqui afeta todo o sistema.
 * 
 * REGRA: Admin tem acesso a tudo, usuários normais apenas a funcionalidades liberadas
 */

export type FeatureStatus = 'enabled' | 'disabled' | 'beta' | 'coming_soon'

export interface Feature {
  id: string
  name: string
  status: FeatureStatus
  path: string
  description?: string
}

/**
 * Lista de todas as funcionalidades do sistema
 * Apenas funcionalidades com status 'enabled' estão liberadas para usuários normais
 * Admin sempre tem acesso a tudo
 */
export const FEATURES: Record<string, Feature> = {
  criativos: {
    id: 'criativos',
    name: 'Criativos',
    status: 'enabled',
    path: '/criativos',
    description: 'Criação de criativos com IA'
  },
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard',
    status: 'disabled',
    path: '/dashboard',
    description: 'Painel principal'
  },
  pages: {
    id: 'pages',
    name: 'Páginas',
    status: 'disabled',
    path: '/pages',
    description: 'Gerenciamento de páginas'
  },
  conteudo: {
    id: 'conteudo',
    name: 'Conteúdo',
    status: 'disabled',
    path: '/conteudo',
    description: 'Gerenciamento de conteúdo'
  },
  templates: {
    id: 'templates',
    name: 'Templates',
    status: 'disabled',
    path: '/templates',
    description: 'Gerenciamento de templates'
  },
  media: {
    id: 'media',
    name: 'Mídia',
    status: 'disabled',
    path: '/media',
    description: 'Gerenciamento de mídia'
  },
  users: {
    id: 'users',
    name: 'Usuários',
    status: 'disabled',
    path: '/users',
    description: 'Gerenciamento de usuários'
  },
  categories: {
    id: 'categories',
    name: 'Categorias',
    status: 'disabled',
    path: '/categories',
    description: 'Gerenciamento de categorias'
  },
  ia: {
    id: 'ia',
    name: 'IA',
    status: 'disabled',
    path: '/ia',
    description: 'Ferramentas de IA'
  },
  aiTests: {
    id: 'aiTests',
    name: 'Laboratório de IA',
    status: 'disabled',
    path: '/ai-tests',
    description: 'Testes de IA'
  },
  templatesPrompts: {
    id: 'templatesPrompts',
    name: 'Templates Prompts',
    status: 'disabled',
    path: '/templates-prompts',
    description: 'Templates de prompts'
  },
  wordpressDiagnostic: {
    id: 'wordpressDiagnostic',
    name: 'Diagnóstico IA',
    status: 'disabled',
    path: '/wordpress-diagnostic-ai',
    description: 'Diagnóstico WordPress com IA'
  },
  backup: {
    id: 'backup',
    name: 'Backup',
    status: 'disabled',
    path: '/backup',
    description: 'Sistema de backup'
  },
  queue: {
    id: 'queue',
    name: 'Fila',
    status: 'disabled',
    path: '/queue',
    description: 'Gerenciamento de filas'
  },
  seo: {
    id: 'seo',
    name: 'SEO',
    status: 'disabled',
    path: '/seo',
    description: 'Ferramentas de SEO'
  },
  bulkOperations: {
    id: 'bulkOperations',
    name: 'Operações em Massa',
    status: 'disabled',
    path: '/bulk-operations',
    description: 'Operações em massa'
  },
  pressel: {
    id: 'pressel',
    name: 'Pressel Automation',
    status: 'disabled',
    path: '/pressel',
    description: 'Automação Pressel'
  },
  automation: {
    id: 'automation',
    name: 'Automações',
    status: 'disabled',
    path: '/automation',
    description: 'Sistema de automações'
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    status: 'disabled',
    path: '/analytics',
    description: 'Analytics e métricas'
  },
  tools: {
    id: 'tools',
    name: 'Ferramentas',
    status: 'disabled',
    path: '/tools',
    description: 'Ferramentas diversas'
  },
  settings: {
    id: 'settings',
    name: 'Configurações',
    status: 'disabled',
    path: '/settings',
    description: 'Configurações do sistema'
  },
  sites: {
    id: 'sites',
    name: 'Sites',
    status: 'disabled',
    path: '/sites',
    description: 'Gerenciamento de sites'
  },
  organizations: {
    id: 'organizations',
    name: 'Organizações',
    status: 'disabled',
    path: '/organizations',
    description: 'Gerenciamento de organizações'
  }
}

/**
 * Verifica se uma funcionalidade está liberada
 * @param featureId - ID da funcionalidade
 * @param userRole - Role do usuário (admin tem acesso a tudo)
 */
export function isFeatureEnabled(featureId: string, userRole?: string): boolean {
  // Admin tem acesso a todas as funcionalidades
  if (userRole === 'admin') {
    return true
  }

  const feature = FEATURES[featureId]
  return feature?.status === 'enabled'
}

/**
 * Verifica se um caminho está liberado
 * @param path - Caminho da rota
 * @param userRole - Role do usuário (admin tem acesso a tudo)
 */
export function isPathEnabled(path: string, userRole?: string): boolean {
  // Admin tem acesso a todas as rotas
  if (userRole === 'admin') {
    return true
  }

  const feature = Object.values(FEATURES).find(f => f.path === path)
  return feature?.status === 'enabled'
}

/**
 * Obtém a funcionalidade por caminho
 */
export function getFeatureByPath(path: string): Feature | undefined {
  return Object.values(FEATURES).find(f => f.path === path)
}

/**
 * Obtém todas as funcionalidades liberadas
 */
export function getEnabledFeatures(): Feature[] {
  return Object.values(FEATURES).filter(f => f.status === 'enabled')
}

/**
 * Mensagem padronizada para funcionalidades bloqueadas
 */
export const BLOCKED_FEATURE_MESSAGE =
  'Essa funcionalidade ainda está em fase de validação e será liberada gradualmente. No momento, apenas o recurso /criativos está disponível.'



