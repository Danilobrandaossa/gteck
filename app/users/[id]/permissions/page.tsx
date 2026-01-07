'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useUsers } from '@/contexts/users-context'
import { Save, ArrowLeft, Settings, FileText, Palette, FolderOpen, Bot } from 'lucide-react'

export default function UserPermissionsPage() {
  const params = useParams()
  if (!params) return null
  const router = useRouter()
  const { users, updateUserPermissions, isLoading: _isLoading, error } = useUsers()
  const [user, setUser] = useState<any>(null)
  const [permissions, setPermissions] = useState({
    canCreatePages: false,
    canEditPages: false,
    canDeletePages: false,
    canManageUsers: false,
    canManageMedia: false,
    canManageTemplates: false,
    canAccessAI: false,
    canManageSettings: false
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (params.id && users.length > 0) {
      const foundUser = users.find(u => u.id === params.id)
      if (foundUser) {
        setUser(foundUser)
        setPermissions(foundUser.permissions)
      }
    }
  }, [params.id, users])

  const handlePermissionChange = (permission: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: value
    }))
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      await updateUserPermissions(user.id, permissions)
      router.push('/users')
    } catch (err) {
      console.error('Erro ao salvar permissões:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const permissionGroups = [
    {
      title: 'Gerenciamento de Conteúdo',
      icon: FileText,
      permissions: [
        { key: 'canCreatePages', label: 'Criar Páginas', description: 'Permite criar novas páginas de conteúdo' },
        { key: 'canEditPages', label: 'Editar Páginas', description: 'Permite editar páginas existentes' },
        { key: 'canDeletePages', label: 'Excluir Páginas', description: 'Permite excluir páginas' }
      ]
    },
    {
      title: 'Gerenciamento de Mídia',
      icon: FolderOpen,
      permissions: [
        { key: 'canManageMedia', label: 'Gerenciar Mídia', description: 'Permite upload e gerenciamento de arquivos de mídia' }
      ]
    },
    {
      title: 'Templates e Design',
      icon: Palette,
      permissions: [
        { key: 'canManageTemplates', label: 'Gerenciar Templates', description: 'Permite criar e editar templates' }
      ]
    },
    {
      title: 'Inteligência Artificial',
      icon: Bot,
      permissions: [
        { key: 'canAccessAI', label: 'Acesso à IA', description: 'Permite usar funcionalidades de IA' }
      ]
    },
    {
      title: 'Administração',
      icon: Settings,
      permissions: [
        { key: 'canManageUsers', label: 'Gerenciar Usuários', description: 'Permite gerenciar outros usuários' },
        { key: 'canManageSettings', label: 'Configurações', description: 'Permite acessar configurações do sistema' }
      ]
    }
  ]

  if (!user) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              border: '3px solid var(--gray-200)',
              borderTop: '3px solid var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }} />
            <p style={{ color: 'var(--gray-600)' }}>Carregando usuário...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <button
              className="cms-btn cms-btn-secondary"
              onClick={() => router.back()}
            >
              <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              Voltar
            </button>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                Permissões de {user.name}
              </h1>
              <p style={{ color: 'var(--gray-600)' }}>
                Gerencie as permissões e acessos do usuário
              </p>
            </div>
          </div>

          {/* User Info */}
          <div className="cms-card" style={{ marginBottom: '2rem' }}>
            <div className="cms-card-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  fontWeight: 'bold',
                  fontSize: '1.5rem'
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                    {user.name}
                  </h3>
                  <p style={{ color: 'var(--gray-600)', marginBottom: '0.25rem' }}>{user.email}</p>
                  <span className={`cms-badge ${user.role === 'admin' ? 'cms-badge-danger' :
                      user.role === 'editor' ? 'cms-badge-warning' :
                        user.role === 'author' ? 'cms-badge-info' :
                          'cms-badge-secondary'
                    }`}>
                    {user.role === 'admin' ? 'Administrador' :
                      user.role === 'editor' ? 'Editor' :
                        user.role === 'author' ? 'Autor' :
                          'Visualizador'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--error-light)',
            border: '1px solid var(--red-300)',
            borderRadius: 'var(--radius)',
            color: 'var(--danger)',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Permissions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {permissionGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="cms-card">
              <div className="cms-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    backgroundColor: 'var(--primary-light)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)'
                  }}>
                    <group.icon style={{ width: '1rem', height: '1rem' }} />
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                    {group.title}
                  </h3>
                </div>
              </div>
              <div className="cms-card-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {group.permissions.map((permission) => (
                    <div key={permission.key} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      backgroundColor: 'var(--gray-50)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--gray-200)'
                    }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                          {permission.label}
                        </h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                          {permission.description}
                        </p>
                      </div>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}>
                        <input
                          type="checkbox"
                          checked={permissions[permission.key as keyof typeof permissions]}
                          onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                          style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            accentColor: 'var(--primary)',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                          {permissions[permission.key as keyof typeof permissions] ? 'Permitido' : 'Negado'}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div style={{
          position: 'sticky',
          bottom: '1rem',
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: 'var(--white)',
          borderTop: '1px solid var(--gray-200)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow)'
        }}>
          <button
            className="cms-btn cms-btn-primary"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              opacity: isSaving ? 0.7 : 1,
              cursor: isSaving ? 'not-allowed' : 'pointer'
            }}
          >
            <Save style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            {isSaving ? 'Salvando...' : 'Salvar Permissões'}
          </button>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

