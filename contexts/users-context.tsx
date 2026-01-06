'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useOrganization } from '@/contexts/organization-context'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'author' | 'viewer'
  avatar?: string
  organizationId: string
  siteIds: string[]
  permissions: {
    canCreatePages: boolean
    canEditPages: boolean
    canDeletePages: boolean
    canManageUsers: boolean
    canManageMedia: boolean
    canManageTemplates: boolean
    canAccessAI: boolean
    canManageSettings: boolean
  }
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

interface UsersContextType {
  users: User[]
  currentUser: User | null
  isLoading: boolean
  error: string | null
  createUser: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<User>
  updateUser: (id: string, updates: Partial<User>) => Promise<User>
  deleteUser: (id: string) => Promise<void>
  toggleUserStatus: (id: string) => Promise<void>
  updateUserPermissions: (id: string, permissions: Partial<User['permissions']>) => Promise<void>
  assignUserToSites: (id: string, siteIds: string[]) => Promise<void>
  searchUsers: (query: string) => User[]
  filterUsers: (role: string, status: string) => User[]
  refreshUsers: () => Promise<void>
}

const UsersContext = createContext<UsersContextType | undefined>(undefined)

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganization } = useOrganization()
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dados mock para demonstração
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Admin Principal',
      email: 'admin@cms.com',
      role: 'admin',
      avatar: '/avatars/admin.jpg',
      organizationId: '1',
      siteIds: ['1', '2'],
      permissions: {
        canCreatePages: true,
        canEditPages: true,
        canDeletePages: true,
        canManageUsers: true,
        canManageMedia: true,
        canManageTemplates: true,
        canAccessAI: true,
        canManageSettings: true
      },
      isActive: true,
      lastLogin: new Date('2024-01-15T10:30:00'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Editor Senior',
      email: 'editor@cms.com',
      role: 'editor',
      avatar: '/avatars/editor.jpg',
      organizationId: '1',
      siteIds: ['1'],
      permissions: {
        canCreatePages: true,
        canEditPages: true,
        canDeletePages: true,
        canManageUsers: false,
        canManageMedia: true,
        canManageTemplates: true,
        canAccessAI: true,
        canManageSettings: false
      },
      isActive: true,
      lastLogin: new Date('2024-01-14T15:45:00'),
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-14')
    },
    {
      id: '3',
      name: 'Autor Conteúdo',
      email: 'author@cms.com',
      role: 'author',
      avatar: '/avatars/author.jpg',
      organizationId: '1',
      siteIds: ['1', '2'],
      permissions: {
        canCreatePages: true,
        canEditPages: true,
        canDeletePages: false,
        canManageUsers: false,
        canManageMedia: true,
        canManageTemplates: false,
        canAccessAI: true,
        canManageSettings: false
      },
      isActive: true,
      lastLogin: new Date('2024-01-13T09:20:00'),
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-13')
    },
    {
      id: '4',
      name: 'Visualizador',
      email: 'viewer@cms.com',
      role: 'viewer',
      avatar: '/avatars/viewer.jpg',
      organizationId: '1',
      siteIds: ['1'],
      permissions: {
        canCreatePages: false,
        canEditPages: false,
        canDeletePages: false,
        canManageUsers: false,
        canManageMedia: false,
        canManageTemplates: false,
        canAccessAI: false,
        canManageSettings: false
      },
      isActive: true,
      lastLogin: new Date('2024-01-12T14:10:00'),
      createdAt: new Date('2024-01-04'),
      updatedAt: new Date('2024-01-12')
    },
    {
      id: '5',
      name: 'Usuário Inativo',
      email: 'inactive@cms.com',
      role: 'author',
      avatar: '/avatars/inactive.jpg',
      organizationId: '1',
      siteIds: ['2'],
      permissions: {
        canCreatePages: true,
        canEditPages: true,
        canDeletePages: false,
        canManageUsers: false,
        canManageMedia: true,
        canManageTemplates: false,
        canAccessAI: false,
        canManageSettings: false
      },
      isActive: false,
      lastLogin: new Date('2024-01-05T11:30:00'),
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-10')
    }
  ]

  const refreshUsers = async () => {
    if (!currentOrganization) return

    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Filtrar usuários pela organização atual
      const orgUsers = mockUsers.filter(user => user.organizationId === currentOrganization.id)
      
      setUsers(orgUsers)
    } catch (err) {
      setError('Erro ao carregar usuários')
      console.error('Erro ao carregar usuários:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newUser: User = {
        ...userData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setUsers(prev => [newUser, ...prev])
      return newUser
    } catch (err) {
      setError('Erro ao criar usuário')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const updatedUser = {
        ...users.find(u => u.id === id)!,
        ...updates,
        updatedAt: new Date()
      }
      
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u))
      if (currentUser?.id === id) {
        setCurrentUser(updatedUser)
      }
      
      return updatedUser
    } catch (err) {
      setError('Erro ao atualizar usuário')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteUser = async (id: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setUsers(prev => prev.filter(u => u.id !== id))
      if (currentUser?.id === id) {
        setCurrentUser(null)
      }
    } catch (err) {
      setError('Erro ao deletar usuário')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUserStatus = async (id: string): Promise<void> => {
    const user = users.find(u => u.id === id)
    if (user) {
      await updateUser(id, { isActive: !user.isActive })
    }
  }

  const updateUserPermissions = async (id: string, permissions: Partial<User['permissions']>): Promise<void> => {
    const user = users.find(u => u.id === id)
    if (user) {
      await updateUser(id, { 
        permissions: { ...user.permissions, ...permissions }
      })
    }
  }

  const assignUserToSites = async (id: string, siteIds: string[]): Promise<void> => {
    await updateUser(id, { siteIds })
  }

  const searchUsers = (query: string): User[] => {
    if (!query.trim()) return users
    
    const lowercaseQuery = query.toLowerCase()
    return users.filter(user => 
      user.name.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery) ||
      user.role.toLowerCase().includes(lowercaseQuery)
    )
  }

  const filterUsers = (role: string, status: string): User[] => {
    let filtered = users
    
    if (role !== 'all') {
      filtered = filtered.filter(user => user.role === role)
    }
    
    if (status !== 'all') {
      const isActive = status === 'active'
      filtered = filtered.filter(user => user.isActive === isActive)
    }
    
    return filtered
  }

  useEffect(() => {
    if (currentOrganization) {
      refreshUsers()
    }
  }, [currentOrganization])

  const value: UsersContextType = {
    users,
    currentUser,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    updateUserPermissions,
    assignUserToSites,
    searchUsers,
    filterUsers,
    refreshUsers
  }

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  )
}

export function useUsers() {
  const context = useContext(UsersContext)
  if (context === undefined) {
    throw new Error('useUsers deve ser usado dentro de um UsersProvider')
  }
  return context
}

