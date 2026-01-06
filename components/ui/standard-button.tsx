// Botão Padrão Reutilizável
import React from 'react'
import { LucideIcon } from 'lucide-react'

interface StandardButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function StandardButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  type = 'button'
}: StandardButtonProps) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease-in-out',
    textDecoration: 'none',
    outline: 'none',
    position: 'relative' as const,
    overflow: 'hidden'
  }

  const sizeStyles = {
    sm: {
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem',
      minHeight: '2rem'
    },
    md: {
      padding: '0.75rem 1rem',
      fontSize: '0.875rem',
      minHeight: '2.5rem'
    },
    lg: {
      padding: '1rem 1.5rem',
      fontSize: '1rem',
      minHeight: '3rem'
    }
  }

  const variantStyles = {
    primary: {
      backgroundColor: '#3B82F6',
      color: 'white',
      '&:hover': {
        backgroundColor: '#2563EB'
      },
      '&:active': {
        backgroundColor: '#1D4ED8'
      }
    },
    secondary: {
      backgroundColor: '#6B7280',
      color: 'white',
      '&:hover': {
        backgroundColor: '#4B5563'
      },
      '&:active': {
        backgroundColor: '#374151'
      }
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#374151',
      border: '1px solid #D1D5DB',
      '&:hover': {
        backgroundColor: '#F9FAFB',
        borderColor: '#9CA3AF'
      },
      '&:active': {
        backgroundColor: '#F3F4F6'
      }
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#6B7280',
      '&:hover': {
        backgroundColor: '#F3F4F6',
        color: '#374151'
      },
      '&:active': {
        backgroundColor: '#E5E7EB'
      }
    },
    danger: {
      backgroundColor: '#EF4444',
      color: 'white',
      '&:hover': {
        backgroundColor: '#DC2626'
      },
      '&:active': {
        backgroundColor: '#B91C1C'
      }
    }
  }

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...(fullWidth && { width: '100%' }),
    ...(disabled && {
      opacity: 0.5,
      cursor: 'not-allowed',
      pointerEvents: 'none' as const
    })
  }

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || loading) {
      e.preventDefault()
      return
    }
    onClick?.(e)
  }

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      style={combinedStyles}
      onMouseEnter={(e) => {
        if (!disabled && !loading && variantStyles[variant]['&:hover']) {
          Object.assign(e.currentTarget.style, variantStyles[variant]['&:hover'])
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, variantStyles[variant])
        }
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading && variantStyles[variant]['&:active']) {
          Object.assign(e.currentTarget.style, variantStyles[variant]['&:active'])
        }
      }}
    >
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)'
        }}>
          <div style={{
            width: '1rem',
            height: '1rem',
            border: '2px solid #E5E7EB',
            borderTop: '2px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        opacity: loading ? 0 : 1 
      }}>
        {Icon && iconPosition === 'left' && (
          <Icon style={{ width: '1rem', height: '1rem' }} />
        )}
        {children}
        {Icon && iconPosition === 'right' && (
          <Icon style={{ width: '1rem', height: '1rem' }} />
        )}
      </div>
    </button>
  )
}









