'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OrganizationSelector } from './organization-selector'
import { Logo } from '@/components/logo'
import { useAuth } from '@/contexts/auth-context'
import { isPathEnabled } from '@/lib/feature-access'
import { 
  LayoutDashboard, 
  FileText, 
  Palette, 
  FolderOpen, 
  Users, 
  Building2, 
  Bot, 
  Settings,
  BarChart3,
  Globe,
  Zap,
  Tag,
  Clock,
  Search,
  Target,
  BookOpen,
  FlaskConical,
  HardDrive,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const allNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Páginas', href: '/pages', icon: FileText },
  { name: 'Conteúdo', href: '/conteudo', icon: Sparkles },
  { name: 'Criativos', href: '/criativos', icon: Zap },
  { name: 'Templates', href: '/templates', icon: Palette },
  { name: 'Mídia', href: '/media', icon: FolderOpen },
  { name: 'Usuários', href: '/users', icon: Users },
  { name: 'Categorias', href: '/categories', icon: Tag },
  { name: 'IA', href: '/ia', icon: Bot },
  { name: 'Laboratório de IA', href: '/ai-tests', icon: FlaskConical },
  { name: 'Templates Prompts', href: '/templates-prompts', icon: FileText },
  { name: 'Diagnóstico IA', href: '/wordpress-diagnostic-ai', icon: Bot },
  { name: 'Backup', href: '/backup', icon: HardDrive },
  { name: 'Fila', href: '/queue', icon: Clock },
  { name: 'SEO', href: '/seo', icon: Search },
  { name: 'Operações em Massa', href: '/bulk-operations', icon: Zap },
  { name: 'Pressel Automation', href: '/pressel', icon: Target },
  { name: 'Automações', href: '/automation', icon: Zap },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Ferramentas', href: '/tools', icon: Zap },
  { name: 'Configurações', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user } = useAuth()
  const userRole = user?.role

  // Filtrar funcionalidades: admin vê tudo, outros apenas liberadas
  const filteredNavigation = userRole === 'admin'
    ? allNavigation // Admin vê todas as funcionalidades
    : allNavigation.filter(item => isPathEnabled(item.href, userRole)) // Usuários normais veem apenas funcionalidades liberadas

  return (
    <div className={`cms-sidebar ${isCollapsed ? 'cms-sidebar-collapsed' : ''}`}>
      {/* Logo */}
      <div className="cms-logo">
        {isCollapsed ? (
          <Logo size="small" showText={false} />
        ) : (
          <Logo size="small" showText={true} />
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="cms-sidebar-toggle"
          title={isCollapsed ? 'Expandir menu' : 'Colapsar menu'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Organization Selector - Oculto quando colapsado */}
      {!isCollapsed && <OrganizationSelector />}

      {/* Navigation */}
      <nav className="cms-nav">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`cms-nav-item ${isActive ? 'active' : ''}`}
              title={isCollapsed ? item.name : ''}
            >
              <item.icon />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer - Oculto quando colapsado */}
      {!isCollapsed && (
        <div style={{ borderTop: '1px solid var(--gray-200)', padding: '1rem' }}>
          <div className="cms-header-user">
            <div className="cms-user-avatar">U</div>
            <div className="cms-user-info">
              <p>Usuário Admin</p>
              <p>admin@cms.com</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
