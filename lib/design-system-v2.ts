// Sistema de Design V2 - Padronizado e Completo
import React from 'react'

// ===== CORES =====
export const colors = {
  // Cores Primárias
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE', 
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Cor principal
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A'
  },
  
  // Cores Secundárias
  secondary: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A'
  },

  // Cores de Status
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B'
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F'
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D'
  },

  // Cores Neutras
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  },

  // Cores Especiais
  accent: {
    orange: '#FF6B35',
    purple: '#8B5CF6',
    pink: '#EC4899',
    cyan: '#06B6D4'
  }
} as const

// ===== TIPOGRAFIA =====
export const typography = {
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(', '),
    mono: [
      'JetBrains Mono',
      'Fira Code',
      'Monaco',
      'Consolas',
      'monospace'
    ].join(', ')
  },

  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem'  // 60px
  },

  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800'
  },

  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  }
} as const

// ===== ESPAÇAMENTO =====
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',   // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem'      // 128px
} as const

// ===== BORDAS =====
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px'
} as const

// ===== SOMBRAS =====
export const boxShadow = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none'
} as const

// ===== ANIMAÇÕES =====
export const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out'
  },
  transitions: {
    all: 'all 0.2s ease-in-out',
    colors: 'color 0.2s ease-in-out, background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
    transform: 'transform 0.2s ease-in-out',
    opacity: 'opacity 0.2s ease-in-out'
  }
} as const

// ===== BREAKPOINTS =====
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const

// ===== UTILITÁRIOS =====
export const utilities = {
  // Z-index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060
  },

  // Opacidade
  opacity: {
    0: '0',
    25: '0.25',
    50: '0.5',
    75: '0.75',
    100: '1'
  },

  // Visibilidade
  visibility: {
    visible: 'visible',
    hidden: 'hidden'
  },

  // Display
  display: {
    block: 'block',
    inline: 'inline',
    inlineBlock: 'inline-block',
    flex: 'flex',
    inlineFlex: 'inline-flex',
    grid: 'grid',
    inlineGrid: 'inline-grid',
    none: 'none'
  }
} as const

// ===== FUNÇÕES AUXILIARES =====
export const createStyleObject = (styles: Record<string, any>) => styles

export const getColor = (colorPath: string) => {
  const keys = colorPath.split('.')
  let current: any = colors
  
  for (const key of keys) {
    current = current[key]
    if (!current) return undefined
  }
  
  return current
}

export const getSpacing = (size: keyof typeof spacing) => spacing[size]

export const getFontSize = (size: keyof typeof typography.fontSize) => typography.fontSize[size]

export const getBorderRadius = (size: keyof typeof borderRadius) => borderRadius[size]

export const getBoxShadow = (size: keyof typeof boxShadow) => boxShadow[size]

// ===== TEMAS =====
export const themes = {
  light: {
    background: colors.gray[50],
    surface: colors.gray[100],
    primary: colors.primary[500],
    text: colors.gray[900],
    textSecondary: colors.gray[600],
    border: colors.gray[200],
    success: colors.success[500],
    warning: colors.warning[500],
    error: colors.error[500]
  },
  
  dark: {
    background: colors.gray[900],
    surface: colors.gray[800],
    primary: colors.primary[400],
    text: colors.gray[100],
    textSecondary: colors.gray[400],
    border: colors.gray[700],
    success: colors.success[400],
    warning: colors.warning[400],
    error: colors.error[400]
  }
} as const

// ===== EXPORT DEFAULT =====
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  boxShadow,
  animations,
  breakpoints,
  utilities,
  themes,
  createStyleObject,
  getColor,
  getSpacing,
  getFontSize,
  getBorderRadius,
  getBoxShadow
}









