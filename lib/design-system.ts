// Sistema de Design Unificado do CMS
export const designSystem = {
  // Cores principais
  colors: {
    // Backgrounds
    background: {
      main: '#F8F8F8',      // Fundo principal (cinza claro)
      card: '#FFFFFF',      // Fundo dos cards (branco)
      sidebar: '#FFFFFF',   // Fundo da sidebar (branco)
      header: '#FFFFFF',    // Fundo do header (branco)
    },

    // Textos
    text: {
      primary: '#333333',   // Texto principal (cinza escuro)
      secondary: '#666666', // Texto secundário (cinza médio)
      light: '#999999',     // Texto claro (cinza claro)
    },

    // Cores de destaque
    accent: {
      orange: '#FF6B35',    // Laranja principal (logo, ativo)
      success: '#66BB6A',   // Verde sucesso (publicado)
      warning: '#FFD54F',   // Amarelo aviso (rascunho)
      info: '#90CAF9',      // Azul informação (revisão)
      system: '#66BB6A',    // Verde sistema (operacional)
    },

    // Bordas e divisores
    border: {
      light: '#E5E7EB',     // Bordas claras
      medium: '#D1D5DB',     // Bordas médias
    }
  },

  // Sombras
  shadow: {
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    search: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },

  // Tipografia
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

    // Tamanhos
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '2rem',   // 32px
    },

    // Pesos
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    }
  },

  // Espaçamentos
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    '3xl': '3rem',   // 48px
  },

  // Bordas
  borderRadius: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
  },

  // Componentes padrão
  components: {
    // Cards
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: '0.75rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
      border: '1px solid #E5E7EB',
    },

    // Botões
    button: {
      primary: {
        backgroundColor: '#FF6B35',
        color: '#FFFFFF',
        borderRadius: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          backgroundColor: '#E55A2B',
        }
      },
      secondary: {
        backgroundColor: '#F3F4F6',
        color: '#374151',
        borderRadius: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          backgroundColor: '#E5E7EB',
        }
      }
    },

    // Inputs
    input: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #D1D5DB',
      borderRadius: '0.5rem',
      padding: '0.75rem',
      fontSize: '0.875rem',
      color: '#374151',
      '&:focus': {
        outline: 'none',
        borderColor: '#FF6B35',
        boxShadow: '0 0 0 3px rgba(255, 107, 53, 0.1)',
      }
    },

    // Status badges
    badge: {
      published: {
        backgroundColor: '#66BB6A',
        color: '#FFFFFF',
        borderRadius: '0.25rem',
        padding: '0.25rem 0.5rem',
        fontSize: '0.75rem',
        fontWeight: '500',
      },
      draft: {
        backgroundColor: '#FFD54F',
        color: '#FFFFFF',
        borderRadius: '0.25rem',
        padding: '0.25rem 0.5rem',
        fontSize: '0.75rem',
        fontWeight: '500',
      },
      review: {
        backgroundColor: '#90CAF9',
        color: '#FFFFFF',
        borderRadius: '0.25rem',
        padding: '0.25rem 0.5rem',
        fontSize: '0.75rem',
        fontWeight: '500',
      }
    }
  }
}

// Função para aplicar estilos inline seguindo o design system
export const applyDesignSystem = (component: string, variant?: string) => {
  const styles = (designSystem.components as any)[component]
  if (variant && styles[variant]) {
    return styles[variant]
  }
  return styles
}

// Função para gerar estilos de card
export const getCardStyles = () => ({
  backgroundColor: designSystem.colors.background.card,
  borderRadius: designSystem.borderRadius.lg,
  boxShadow: designSystem.shadow.card,
  padding: designSystem.spacing.xl,
  border: `1px solid ${designSystem.colors.border.light}`,
})

// Função para gerar estilos de botão
export const getButtonStyles = (variant: 'primary' | 'secondary' = 'primary') => ({
  ...designSystem.components.button[variant],
  display: 'flex',
  alignItems: 'center',
  gap: designSystem.spacing.sm,
  fontSize: designSystem.typography.sizes.sm,
  fontWeight: designSystem.typography.weights.medium,
})

// Função para gerar estilos de input
export const getInputStyles = () => ({
  ...designSystem.components.input,
  width: '100%',
})

// Função para gerar estilos de badge
export const getBadgeStyles = (status: 'published' | 'draft' | 'review') => ({
  ...designSystem.components.badge[status],
  display: 'inline-block',
})

// Função para gerar estilos de layout
export const getLayoutStyles = () => ({
  container: {
    padding: designSystem.spacing['2xl'],
    backgroundColor: designSystem.colors.background.main,
    minHeight: '100vh',
  },
  header: {
    marginBottom: designSystem.spacing['2xl'],
  },
  title: {
    fontSize: designSystem.typography.sizes['3xl'],
    fontWeight: designSystem.typography.weights.bold,
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing.sm,
  },
  subtitle: {
    color: designSystem.colors.text.secondary,
    fontSize: designSystem.typography.sizes.lg,
    marginBottom: designSystem.spacing.xl,
  },
  grid: {
    display: 'grid',
    gap: designSystem.spacing.xl,
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    marginBottom: designSystem.spacing['2xl'],
  }
})



