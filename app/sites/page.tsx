'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SitesRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para configurações com a aba de sites
    router.replace('/settings?tab=sites')
  }, [router])

  return (
    <div className="cms-flex cms-items-center cms-justify-center cms-h-screen">
      <div className="cms-text-center">
        <h2 className="cms-text-2xl cms-font-semibold cms-mb-2">Redirecionando para Configurações...</h2>
        <p className="cms-text-base cms-text-gray-600">Gerenciamento de sites agora está centralizado em Configurações.</p>
      </div>
    </div>
  )
}













