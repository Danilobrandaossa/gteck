'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { isPathEnabled } from '@/lib/feature-access'

interface ProtectedFeatureProps {
  path: string
  children: React.ReactNode
}

/**
 * Componente de proteção de funcionalidades
 * Bloqueia acesso a funcionalidades não liberadas
 * Admin tem acesso a tudo
 */
export function ProtectedFeature({ path, children }: ProtectedFeatureProps) {
  const router = useRouter()
  const { user } = useAuth()
  const userRole = user?.role

  useEffect(() => {
    if (!isPathEnabled(path, userRole)) {
      // Redireciona para /criativos se a funcionalidade não estiver liberada
      router.push('/criativos')
    }
  }, [path, userRole, router])

  // Se não estiver liberada, não renderiza nada (será redirecionado)
  if (!isPathEnabled(path, userRole)) {
    return null
  }

  return <>{children}</>
}

