'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthState, authService } from '@/lib/auth'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = () => {
    try {
      const currentUser = authService.getCurrentUser()
      setUser(currentUser)
      setIsLoading(false)
    } catch (error) {
      console.error('Erro ao recuperar usuário:', error)
      setUser(null)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Verificar se há usuário logado ao carregar a página
    // Executar imediatamente para evitar delay desnecessário
    refreshUser()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    
    try {
      const result = await authService.login(email, password)
      
      if (result.success && result.user) {
        setUser(result.user)
        setIsLoading(false)
        return { success: true }
      } else {
        setIsLoading(false)
        return { success: false, error: result.error || 'Erro no login' }
      }
    } catch (error) {
      setIsLoading(false)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  const logout = async () => {
    setIsLoading(true)
    
    try {
      await authService.logout()
      setUser(null)
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

