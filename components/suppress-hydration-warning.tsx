'use client'

import { useEffect } from 'react'

export function SuppressHydrationWarning() {
  useEffect(() => {
    // Suprimir warnings específicos de hidratação
    const originalError = console.error
    console.error = (...args) => {
      // Filtrar warnings específicos de hidratação
      if (
        typeof args[0] === 'string' && 
        (args[0].includes('Extra attributes from the server') || 
         args[0].includes('bis_skin_checked') ||
         args[0].includes('Warning: Extra attributes'))
      ) {
        return
      }
      originalError.apply(console, args)
    }

    // Restaurar console.error quando o componente for desmontado
    return () => {
      console.error = originalError
    }
  }, [])

  return null
}

