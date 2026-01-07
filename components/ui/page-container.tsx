import React from 'react'
import { getLayoutStyles, getCardStyles, getButtonStyles, getInputStyles } from '@/lib/design-system'

interface PageContainerProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function PageContainer({ title, subtitle, children }: PageContainerProps) {
  return (
    <div style={getLayoutStyles().container}>
      {/* Header */}
      <div style={getLayoutStyles().header}>
        <h1 style={getLayoutStyles().title}>
          {title}
        </h1>
        {subtitle && (
          <p style={getLayoutStyles().subtitle}>
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Content */}
      {children}
    </div>
  )
}

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div style={getCardStyles()} className={className}>
      {children}
    </div>
  )
}

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
}

export function Button({ 
  children, 
  variant = 'primary', 
  onClick, 
  type = 'button',
  disabled = false,
  className 
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        ...getButtonStyles(variant),
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {children}
    </button>
  )
}

interface InputProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
  required?: boolean
}

export function Input({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  className,
  required = false 
}: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={className}
      style={getInputStyles()}
    />
  )
}

interface BadgeProps {
  children: React.ReactNode
  status: 'published' | 'draft' | 'review'
  className?: string
}

export function Badge({ children, status, className }: BadgeProps) {
  const { getBadgeStyles } = require('@/lib/design-system')
  return (
    <span style={getBadgeStyles(status)} className={className}>
      {children}
    </span>
  )
}

interface GridProps {
  children: React.ReactNode
  columns?: number
  gap?: string
  className?: string
}

export function Grid({ children, columns: _columns = 4, gap = '1.5rem', className }: GridProps) {
  return (
    <div 
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(250px, 1fr))`,
        gap,
        marginBottom: '2rem'
      }}
    >
      {children}
    </div>
  )
}











