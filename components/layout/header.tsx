'use client'

import Link from 'next/link'
import { Bell, Search, Settings, User, LogOut, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export function Header() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="cms-header">
      <div className="cms-header-content">
        {/* Search */}
        <div className="cms-search">
          <Search />
          <input
            type="text"
            placeholder="Buscar páginas, templates, usuários..."
          />
        </div>

        {/* Right side */}
        <div className="cms-header-actions">
          <Link href="/conteudo" className="cms-btn cms-btn-primary cms-flex cms-items-center cms-gap-2">
            <Sparkles style={{ width: '1rem', height: '1rem' }} />
            Conteúdo
          </Link>

          {/* Notifications */}
          <button className="cms-btn cms-btn-icon" style={{ position: 'relative' }}>
            <Bell />
            <span style={{
              position: 'absolute',
              top: '-0.25rem',
              right: '-0.25rem',
              width: '1rem',
              height: '1rem',
              borderRadius: '50%',
              backgroundColor: 'var(--danger)',
              color: 'var(--white)',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              3
            </span>
          </button>

          {/* Settings */}
          <button className="cms-btn cms-btn-icon">
            <Settings />
          </button>

          {/* User Menu */}
          <div className="cms-header-user">
            <div className="cms-user-info">
              <p>{user?.name || 'Usuário'}</p>
              <p>{user?.email || 'user@cms.com'}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="cms-btn cms-btn-icon">
                <User />
              </button>
              <button 
                className="cms-btn cms-btn-icon" 
                onClick={handleLogout}
                title="Sair"
                style={{ color: 'var(--danger)' }}
              >
                <LogOut />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
