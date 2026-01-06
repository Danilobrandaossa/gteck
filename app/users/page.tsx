'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useUsers } from '@/contexts/users-context'
import { useOrganization } from '@/contexts/organization-context'
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, UserCheck, UserX, Shield, Mail, Calendar, Settings } from 'lucide-react'

export default function UsersPage() {
  const { users, isLoading, error, deleteUser, toggleUserStatus, searchUsers, filterUsers } = useUsers()
  const { currentOrganization } = useOrganization()
  const { sites } = useOrganization()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const filteredUsers = searchTerm 
    ? searchUsers(searchTerm)
    : filterUsers(roleFilter, statusFilter)

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'cms-badge-danger'
      case 'editor':
        return 'cms-badge-warning'
      case 'author':
        return 'cms-badge-info'
      case 'viewer':
        return 'cms-badge-secondary'
      default:
        return 'cms-badge-secondary'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'editor':
        return 'Editor'
      case 'author':
        return 'Autor'
      case 'viewer':
        return 'Visualizador'
      default:
        return role
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id)
      setShowDeleteModal(null)
    } catch (err) {
      console.error('Erro ao deletar usuário:', err)
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleUserStatus(id)
    } catch (err) {
      console.error('Erro ao alterar status do usuário:', err)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
            Usuários
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>
            {currentOrganization 
              ? `Gerencie os usuários da organização ${currentOrganization.name}`
              : 'Gerencie os usuários do sistema'
            }
          </p>
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

        {/* Header with Add Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              {filteredUsers.length} de {users.length} usuários
            </div>
          </div>
          <button 
            className="cms-btn cms-btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Novo Usuário
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, maxWidth: '24rem' }}>
            <div className="cms-search">
              <Search />
              <input 
                type="text" 
                placeholder="Buscar usuários..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ 
              padding: '0.5rem 1rem', 
              border: '1px solid var(--gray-300)', 
              borderRadius: 'var(--radius-lg)', 
              fontSize: '0.875rem', 
              color: 'var(--gray-700)',
              backgroundColor: 'var(--white)'
            }}
          >
            <option value="all">Todos os cargos</option>
            <option value="admin">Administradores</option>
            <option value="editor">Editores</option>
            <option value="author">Autores</option>
            <option value="viewer">Visualizadores</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ 
              padding: '0.5rem 1rem', 
              border: '1px solid var(--gray-300)', 
              borderRadius: 'var(--radius-lg)', 
              fontSize: '0.875rem', 
              color: 'var(--gray-700)',
              backgroundColor: 'var(--white)'
            }}
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          <button className="cms-btn cms-btn-secondary">
            <Filter style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Mais filtros
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
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
            <p style={{ color: 'var(--gray-600)' }}>Carregando usuários...</p>
          </div>
        )}

        {/* Users List */}
        {!isLoading && (
          <div className="cms-card">
            <div className="cms-card-header">
              <h2 className="cms-card-title">Lista de Usuários</h2>
            </div>
            <div className="cms-card-content">
              {filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                    Nenhum usuário encontrado
                  </h3>
                  <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
                    {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                      ? 'Tente ajustar os filtros de busca'
                      : 'Adicione o primeiro usuário para começar'
                    }
                  </p>
                  <button 
                    className="cms-btn cms-btn-primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Novo Usuário
                  </button>
                </div>
              ) : (
                <div>
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="cms-page-item">
                      <div className="cms-page-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ 
                            width: '3rem', 
                            height: '3rem', 
                            borderRadius: '50%', 
                            backgroundColor: 'var(--primary-light)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'var(--primary)',
                            fontWeight: 'bold',
                            fontSize: '1.125rem'
                          }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {user.name}
                              {!user.isActive && (
                                <span style={{ 
                                  fontSize: '0.75rem', 
                                  color: 'var(--gray-500)', 
                                  fontStyle: 'italic' 
                                }}>
                                  (Inativo)
                                </span>
                              )}
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Mail style={{ width: '0.875rem', height: '0.875rem' }} />
                                {user.email}
                              </span>
                              {user.lastLogin && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Calendar style={{ width: '0.875rem', height: '0.875rem' }} />
                                  Último acesso: {user.lastLogin.toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className={`cms-badge ${getRoleBadge(user.role)}`}>
                          {getRoleText(user.role)}
                        </span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button 
                            className="cms-btn cms-btn-icon cms-btn-secondary"
                            title="Visualizar"
                          >
                            <Eye style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          <button 
                            className="cms-btn cms-btn-icon cms-btn-secondary"
                            title="Editar"
                          >
                            <Edit style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          <button 
                            className="cms-btn cms-btn-icon cms-btn-secondary"
                            title="Permissões"
                            onClick={() => window.location.href = `/users/${user.id}/permissions`}
                          >
                            <Shield style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          <button 
                            className="cms-btn cms-btn-icon cms-btn-secondary"
                            title={user.isActive ? 'Desativar' : 'Ativar'}
                            onClick={() => handleToggleStatus(user.id)}
                            style={{ color: user.isActive ? 'var(--warning)' : 'var(--success)' }}
                          >
                            {user.isActive ? (
                              <UserX style={{ width: '1rem', height: '1rem' }} />
                            ) : (
                              <UserCheck style={{ width: '1rem', height: '1rem' }} />
                            )}
                          </button>
                          <button 
                            className="cms-btn cms-btn-icon cms-btn-secondary"
                            title="Mais opções"
                          >
                            <MoreHorizontal style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          <button 
                            className="cms-btn cms-btn-icon cms-btn-secondary"
                            title="Excluir"
                            onClick={() => setShowDeleteModal(user.id)}
                            style={{ color: 'var(--danger)' }}
                          >
                            <Trash2 style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="cms-card" style={{ maxWidth: '400px', margin: '1rem' }}>
              <div className="cms-card-header">
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Confirmar exclusão
                </h3>
              </div>
              <div className="cms-card-content">
                <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
                  Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button 
                    className="cms-btn cms-btn-secondary"
                    onClick={() => setShowDeleteModal(null)}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="cms-btn"
                    onClick={() => handleDelete(showDeleteModal)}
                    style={{ backgroundColor: 'var(--danger)', color: 'var(--white)' }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="cms-card" style={{ maxWidth: '500px', margin: '1rem', width: '100%' }}>
              <div className="cms-card-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                    Novo Usuário
                  </h3>
                  <button 
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2rem',
                      height: '2rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      color: 'var(--gray-400)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <MoreHorizontal style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>
              </div>
              <div className="cms-card-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do usuário"
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--gray-300)', 
                        borderRadius: 'var(--radius-lg)', 
                        fontSize: '0.875rem' 
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="usuario@exemplo.com"
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--gray-300)', 
                        borderRadius: 'var(--radius-lg)', 
                        fontSize: '0.875rem' 
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Cargo
                    </label>
                    <select style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      fontSize: '0.875rem',
                      backgroundColor: 'var(--white)'
                    }}>
                      <option value="viewer">Visualizador</option>
                      <option value="author">Autor</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      🏢 Organização
                    </label>
                    <select style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      fontSize: '0.875rem',
                      backgroundColor: 'var(--white)'
                    }}>
                      <option value="">Selecione uma organização</option>
                      <option value="org1">Organização Principal</option>
                      <option value="org2">Organização Secundária</option>
                    </select>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                      Organização à qual o usuário pertencerá
                    </p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      🌐 Sites com Acesso
                    </label>
                    <div style={{ 
                      maxHeight: '120px', 
                      overflowY: 'auto', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)',
                      padding: '0.5rem',
                      backgroundColor: 'var(--white)'
                    }}>
                      {sites.length > 0 ? (
                        sites.map(site => (
                          <label key={site.id} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            padding: '0.5rem',
                            cursor: 'pointer'
                          }}>
                            <input 
                              type="checkbox" 
                              value={site.id}
                              style={{ margin: 0 }}
                            />
                            <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                              {site.name} ({site.url})
                            </span>
                          </label>
                        ))
                      ) : (
                        <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', textAlign: 'center', padding: '1rem' }}>
                          Nenhum site cadastrado. Configure sites em Configurações → Sites.
                        </p>
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                      Selecione os sites aos quais o usuário terá acesso
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button 
                      className="cms-btn cms-btn-secondary"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancelar
                    </button>
                    <button 
                      className="cms-btn cms-btn-primary"
                    >
                      Criar Usuário
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
