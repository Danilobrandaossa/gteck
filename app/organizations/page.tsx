'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OrganizationsRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para /settings com tab=organizations
    router.replace('/settings?tab=organizations')
  }, [router])

  return (
    <div className="cms-flex cms-flex-col cms-items-center cms-justify-center cms-h-screen cms-gap-4">
      <div className="cms-text-lg cms-text-gray-600">
        Redirecionando para Configurações...
      </div>
      <div className="cms-text-sm cms-text-gray-500">
        A página de organizações foi movida para Configurações
      </div>
    </div>
  )
}




