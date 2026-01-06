# 🎨 Style Guide - CMS Moderno

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Paleta de Cores](#paleta-de-cores)
3. [Tipografia](#tipografia)
4. [Espaçamento e Grid](#espaçamento-e-grid)
5. [Componentes](#componentes)
6. [Ícones](#ícones)
7. [Animações](#animações)
8. [Responsividade](#responsividade)
9. [Acessibilidade](#acessibilidade)
10. [Implementação](#implementação)

---

## 🎯 Visão Geral

O CMS Moderno segue um design system baseado em **minimalismo**, **clareza** e **consistência**. O objetivo é criar uma experiência de usuário intuitiva e profissional.

### Princípios de Design
- **Simplicidade**: Interface limpa e focada
- **Consistência**: Padrões visuais uniformes
- **Acessibilidade**: Inclusivo para todos os usuários
- **Performance**: Carregamento rápido e responsivo

---

## 🎨 Paleta de Cores

### Cores Primárias
```css
/* Azul Principal */
--primary-50: #EFF6FF
--primary-100: #DBEAFE
--primary-200: #BFDBFE
--primary-300: #93C5FD
--primary-400: #60A5FA
--primary-500: #3B82F6  /* Cor principal */
--primary-600: #2563EB
--primary-700: #1D4ED8
--primary-800: #1E40AF
--primary-900: #1E3A8A
```

### Cores Secundárias
```css
/* Cinza Neutro */
--gray-50: #F9FAFB
--gray-100: #F3F4F6
--gray-200: #E5E7EB
--gray-300: #D1D5DB
--gray-400: #9CA3AF
--gray-500: #6B7280
--gray-600: #4B5563
--gray-700: #374151
--gray-800: #1F2937
--gray-900: #111827
```

### Cores de Status
```css
/* Sucesso */
--success-500: #10B981
--success-600: #059669

/* Aviso */
--warning-500: #F59E0B
--warning-600: #D97706

/* Erro */
--error-500: #EF4444
--error-600: #DC2626

/* Informação */
--info-500: #3B82F6
--info-600: #2563EB
```

### Cores Especiais
```css
/* Destaque */
--accent-orange: #FF6B35
--accent-purple: #8B5CF6
--accent-pink: #EC4899
--accent-cyan: #06B6D4
```

---

## 📝 Tipografia

### Família de Fontes
```css
/* Fonte Principal */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

/* Fonte Monospace */
font-family: 'JetBrains Mono', 'Fira Code', Monaco, Consolas, monospace;
```

### Tamanhos de Fonte
```css
/* Texto Pequeno */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */

/* Texto Base */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */

/* Títulos */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
```

### Pesos de Fonte
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Hierarquia Tipográfica
```css
/* H1 - Título Principal */
h1 {
  font-size: 2.25rem;    /* 36px */
  font-weight: 700;
  line-height: 1.2;
  color: var(--gray-900);
}

/* H2 - Título de Seção */
h2 {
  font-size: 1.875rem;   /* 30px */
  font-weight: 600;
  line-height: 1.3;
  color: var(--gray-800);
}

/* H3 - Subtítulo */
h3 {
  font-size: 1.5rem;     /* 24px */
  font-weight: 600;
  line-height: 1.4;
  color: var(--gray-700);
}

/* Texto Corpo */
p {
  font-size: 1rem;       /* 16px */
  font-weight: 400;
  line-height: 1.6;
  color: var(--gray-600);
}

/* Texto Pequeno */
small {
  font-size: 0.875rem;    /* 14px */
  font-weight: 400;
  line-height: 1.5;
  color: var(--gray-500);
}
```

---

## 📏 Espaçamento e Grid

### Sistema de Espaçamento
```css
/* Espaçamentos Padrão */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Grid System
```css
/* Container Principal */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

/* Grid Responsivo */
.grid {
  display: grid;
  gap: var(--space-4);
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

/* Breakpoints */
@media (min-width: 640px) {
  .sm\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 768px) {
  .md\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
}
```

---

## 🧩 Componentes

### Botões

#### Botão Primário
```css
.btn-primary {
  background-color: var(--primary-500);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.btn-primary:hover {
  background-color: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
```

#### Botão Secundário
```css
.btn-secondary {
  background-color: var(--gray-100);
  color: var(--gray-700);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  border: 1px solid var(--gray-300);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.btn-secondary:hover {
  background-color: var(--gray-200);
  border-color: var(--gray-400);
}
```

#### Botão Outline
```css
.btn-outline {
  background-color: transparent;
  color: var(--primary-500);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  border: 1px solid var(--primary-500);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.btn-outline:hover {
  background-color: var(--primary-500);
  color: white;
}
```

### Cards
```css
.card {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid var(--gray-200);
  padding: 1.5rem;
  transition: all 0.2s ease-in-out;
}

.card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.card-header {
  border-bottom: 1px solid var(--gray-200);
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
}

.card-subtitle {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin: 0.25rem 0 0 0;
}
```

### Formulários
```css
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-700);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: var(--gray-900);
  background-color: white;
  transition: border-color 0.2s ease-in-out;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}
```

### Badges
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-success {
  background-color: var(--success-100);
  color: var(--success-800);
}

.badge-warning {
  background-color: var(--warning-100);
  color: var(--warning-800);
}

.badge-error {
  background-color: var(--error-100);
  color: var(--error-800);
}

.badge-info {
  background-color: var(--primary-100);
  color: var(--primary-800);
}
```

---

## 🎯 Ícones

### Biblioteca de Ícones
Utilizamos **Lucide React** como biblioteca principal de ícones.

```tsx
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  Settings,
  User,
  Globe,
  Building2
} from 'lucide-react'
```

### Tamanhos Padrão
```css
.icon-sm { width: 1rem; height: 1rem; }    /* 16px */
.icon-md { width: 1.25rem; height: 1.25rem; } /* 20px */
.icon-lg { width: 1.5rem; height: 1.5rem; }   /* 24px */
.icon-xl { width: 2rem; height: 2rem; }       /* 32px */
```

### Cores de Ícones
```css
.icon-primary { color: var(--primary-500); }
.icon-secondary { color: var(--gray-500); }
.icon-success { color: var(--success-500); }
.icon-warning { color: var(--warning-500); }
.icon-error { color: var(--error-500); }
```

---

## ✨ Animações

### Transições Padrão
```css
.transition-all {
  transition: all 0.2s ease-in-out;
}

.transition-colors {
  transition: color 0.2s ease-in-out, 
              background-color 0.2s ease-in-out, 
              border-color 0.2s ease-in-out;
}

.transition-transform {
  transition: transform 0.2s ease-in-out;
}

.transition-opacity {
  transition: opacity 0.2s ease-in-out;
}
```

### Animações de Hover
```css
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.hover-scale:hover {
  transform: scale(1.05);
}

.hover-fade:hover {
  opacity: 0.8;
}
```

### Loading States
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.loading-spin {
  animation: spin 1s linear infinite;
}

.loading-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.loading-bounce {
  animation: bounce 1s infinite;
}
```

---

## 📱 Responsividade

### Breakpoints
```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### Grid Responsivo
```css
.responsive-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .responsive-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .responsive-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .responsive-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### Tipografia Responsiva
```css
.responsive-title {
  font-size: 1.5rem; /* 24px */
}

@media (min-width: 768px) {
  .responsive-title {
    font-size: 2rem; /* 32px */
  }
}

@media (min-width: 1024px) {
  .responsive-title {
    font-size: 2.5rem; /* 40px */
  }
}
```

---

## ♿ Acessibilidade

### Contraste
- **Texto normal**: Mínimo 4.5:1
- **Texto grande**: Mínimo 3:1
- **Elementos interativos**: Mínimo 3:1

### Foco
```css
.focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.focus-ring {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}
```

### Estados de Acessibilidade
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.not-sr-only {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

## 🚀 Implementação

### CSS Custom Properties
```css
:root {
  /* Cores */
  --primary-500: #3B82F6;
  --gray-900: #111827;
  
  /* Espaçamento */
  --space-4: 1rem;
  --space-6: 1.5rem;
  
  /* Tipografia */
  --font-sans: 'Inter', sans-serif;
  --text-base: 1rem;
  
  /* Bordas */
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  
  /* Sombras */
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

### Classes Utilitárias
```css
/* Espaçamento */
.p-4 { padding: var(--space-4); }
.m-6 { margin: var(--space-6); }

/* Cores */
.text-primary { color: var(--primary-500); }
.bg-gray-50 { background-color: var(--gray-50); }

/* Tipografia */
.font-semibold { font-weight: 600; }
.text-lg { font-size: 1.125rem; }

/* Bordas */
.rounded-md { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }

/* Sombras */
.shadow-md { box-shadow: var(--shadow-md); }
```

### Componentes React
```tsx
// Exemplo de implementação
import { StandardButton, StandardCard, StandardModal } from '@/components/ui'

function MyComponent() {
  return (
    <StandardCard title="Título" subtitle="Subtítulo">
      <StandardButton variant="primary" size="md">
        Botão
      </StandardButton>
    </StandardCard>
  )
}
```

---

## 📋 Checklist de Implementação

### ✅ Cores
- [ ] Paleta de cores definida
- [ ] Cores de status implementadas
- [ ] Variáveis CSS configuradas

### ✅ Tipografia
- [ ] Fonte Inter carregada
- [ ] Tamanhos de fonte padronizados
- [ ] Hierarquia tipográfica definida

### ✅ Componentes
- [ ] Botões padronizados
- [ ] Cards reutilizáveis
- [ ] Formulários consistentes
- [ ] Modais padronizados

### ✅ Responsividade
- [ ] Breakpoints definidos
- [ ] Grid responsivo
- [ ] Tipografia responsiva

### ✅ Acessibilidade
- [ ] Contraste adequado
- [ ] Estados de foco
- [ ] Navegação por teclado

### ✅ Performance
- [ ] Animações otimizadas
- [ ] CSS minificado
- [ ] Lazy loading implementado

---

## 🎯 Próximos Passos

1. **Implementar** o design system em todas as páginas
2. **Criar** componentes reutilizáveis
3. **Testar** acessibilidade
4. **Otimizar** performance
5. **Documentar** padrões específicos

---

*Este Style Guide é um documento vivo que deve ser atualizado conforme o sistema evolui.*









