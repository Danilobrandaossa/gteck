// Card Padrão Reutilizável
import React from 'react'

interface StandardCardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  padding?: 'sm' | 'md' | 'lg'
  shadow?: 'sm' | 'md' | 'lg'
  border?: boolean
  hover?: boolean
  className?: string
}

export function StandardCard({
  children,
  title,
  subtitle,
  actions,
  padding = 'md',
  shadow = 'md',
  border = true,
  hover = false,
  className
}: StandardCardProps) {
  const paddingStyles = {
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem'
  }

  const shadowStyles = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  }

  const baseStyles = {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    boxShadow: shadowStyles[shadow],
    border: border ? '1px solid #E5E7EB' : 'none',
    transition: hover ? 'all 0.2s ease-in-out' : 'none',
    overflow: 'hidden' as const
  }

   hover ? {
    '&:hover': {
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      transform: 'translateY(-1px)'
    }
  } : {}

  return (
    <div 
      style={baseStyles}
      className={className}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.boxShadow = shadowStyles[shadow]
          e.currentTarget.style.transform = 'translateY(0)'
        }
      }}
    >
      {/* Header */}
      {(title || subtitle || actions) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${paddingStyles[padding]} ${paddingStyles[padding]} 0 ${paddingStyles[padding]}`,
          borderBottom: title || subtitle ? '1px solid #F3F4F6' : 'none',
          marginBottom: title || subtitle ? paddingStyles[padding] : '0'
        }}>
          <div>
            {title && (
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#1F2937',
                margin: 0,
                marginBottom: subtitle ? '0.25rem' : '0'
              }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{
                fontSize: '0.875rem',
                color: '#6B7280',
                margin: 0
              }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: paddingStyles[padding] }}>
        {children}
      </div>
    </div>
  )
}









