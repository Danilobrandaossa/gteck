'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
  requiredRoles?: string[]
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredRoles, 
  fallback 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    // Aguardar um pouco para garantir que o AuthContext carregue do localStorage
    const timer = setTimeout(() => {
      setHasCheckedAuth(true)
    }, 200)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Apenas redirecionar se já verificou autenticação, não estiver carregando e não estiver autenticado
    if (isMounted && hasCheckedAuth && !isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isMounted, hasCheckedAuth, isAuthenticated, isLoading, router])

  // Evitar hidratação até o componente estar montado
  if (!isMounted || !hasCheckedAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: 'var(--gray-50)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid var(--gray-200)',
            borderTop: '3px solid var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: 'var(--gray-600)' }}>Carregando...</p>
        </div>
      </div>
    )
  }

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--gray-50)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid var(--gray-200)',
            borderTop: '3px solid var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: 'var(--gray-600)' }}>Carregando...</p>
        </div>
      </div>
    )
  }

  // Redirecionar se não autenticado (o useEffect já cuida disso, mas garantindo aqui também)
  if (!isAuthenticated) {
    return null
  }

  // Verificar permissões de role
  if (requiredRole && user?.role !== requiredRole) {
    return fallback || (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--gray-50)'
      }}>
        <div className="cms-card" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Acesso Negado</h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
            Você não tem permissão para acessar esta página.
          </p>
          <button
            className="cms-btn cms-btn-primary"
            onClick={() => router.push('/dashboard')}
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return fallback || (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--gray-50)'
      }}>
        <div className="cms-card" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Acesso Negado</h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
            Você não tem permissão para acessar esta página.
          </p>
          <button
            className="cms-btn cms-btn-primary"
            onClick={() => router.push('/dashboard')}
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

