'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OrganizationSelector } from './organization-selector'
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
  Sparkles
} from 'lucide-react'

const navigation = [
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

  return (
    <div className="cms-sidebar">
      {/* Logo */}
      <div className="cms-logo">
        <div className="cms-logo-icon">CMS</div>
        <div className="cms-logo-text">
          <h1>CMS Moderno</h1>
          <p>Sistema de Conteúdo</p>
        </div>
      </div>

              {/* Organization Selector */}
              <OrganizationSelector />

              {/* Navigation */}
              <nav className="cms-nav">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`cms-nav-item ${isActive ? 'active' : ''}`}
                    >
                      <item.icon />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--gray-200)', padding: '1rem' }}>
        <div className="cms-header-user">
          <div className="cms-user-avatar">U</div>
          <div className="cms-user-info">
            <p>Usuário Admin</p>
            <p>admin@cms.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
