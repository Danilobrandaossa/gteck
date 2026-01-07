'use client'

import _Image from 'next/image'
import { useState } from 'react'

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  showText?: boolean
  className?: string
}

const sizeMap = {
  small: { width: 32, height: 32 },
  medium: { width: 64, height: 64 },
  large: { width: 128, height: 128 },
  xlarge: { width: 192, height: 192 },
}

export function Logo({ size = 'medium', showText = false, className = '' }: LogoProps) {
  const [imageError, setImageError] = useState(false)
  const [useFallback, _setUseFallback] = useState(false)
  const [horizontalLogoError, setHorizontalLogoError] = useState(false)
  const [iconError, setIconError] = useState(false)
  
  const dimensions = sizeMap[size]
  
  // Se showText for true, usar logo horizontal, senão usar logo ícone
  const logoPath = showText 
    ? '/images/logo/logo-horizontal.svg'
    : (useFallback ? '/images/logo/logo.png' : '/images/logo/logo.svg')
  
  // Tentar icone.svg quando não há texto (modo colapsado)
  const iconLogoPath = '/images/logo/icone.svg'

  // Se a imagem não carregar, mostra fallback com texto
  if (imageError || (showText && horizontalLogoError)) {
    return (
      <div 
        className={className}
        style={{
          width: showText ? 'auto' : dimensions.width,
          height: showText ? 'auto' : dimensions.height,
          background: showText ? 'transparent' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
          borderRadius: showText ? 0 : 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: showText ? 'var(--gray-900)' : 'var(--white)',
          fontWeight: 'bold',
          fontSize: size === 'small' ? '0.75rem' : size === 'medium' ? '1rem' : '1.5rem'
        }}
      >
        {showText ? (
          <div className="cms-logo-text">
            <h1>CMS Moderno</h1>
            <p>Sistema de Conteúdo</p>
          </div>
        ) : (
          'CMS'
        )}
      </div>
    )
  }

  // Para SVG, usar img tag diretamente (melhor compatibilidade)
   logoPath.endsWith('.svg')

  // Se showText for true, mostrar apenas a logo horizontal (sem ícone separado)
  if (showText) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={logoPath}
          alt="Logo da empresa"
          style={{
            height: '48px', // Altura padrão para logo horizontal
            width: 'auto',
            objectFit: 'contain'
          }}
          onError={() => {
            setHorizontalLogoError(true)
          }}
        />
      </div>
    )
  }

  // Logo padrão (sem texto) - tenta logo-icon.svg primeiro, depois logo.svg
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ 
        width: dimensions.width, 
        height: dimensions.height,
        position: 'relative',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img
          src={iconError ? '/images/logo/logo.svg' : iconLogoPath}
          alt="Logo da empresa"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
          onError={() => {
            // Se icone.svg não existir, tenta logo.svg
            if (!iconError) {
              setIconError(true)
            } else {
              setImageError(true)
            }
          }}
        />
      </div>
    </div>
  )
}

