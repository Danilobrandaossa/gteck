# 🎨 Guia de Mapeamento de Cores Hardcoded → Variáveis CSS

## Mapeamento de Cores Comuns

### Cores Primárias
- `#3b82f6` (azul) → `var(--primary)` ou criar `--primary-blue: #3b82f6`
- `#f4401b` (vermelho/laranja) → `var(--primary)`
- `#e52811` → `var(--primary-hover)`

### Cores de Cinza
- `#ffffff` ou `white` → `var(--white)`
- `#f9fafb` → `var(--gray-50)`
- `#f3f4f6` → `var(--gray-100)`
- `#e5e7eb` → `var(--gray-200)`
- `#d1d5db` → `var(--gray-300)`
- `#9ca3af` → `var(--gray-400)`
- `#6b7280` → `var(--gray-500)`
- `#4b5563` → `var(--gray-600)`
- `#374151` → `var(--gray-700)`
- `#1f2937` → `var(--gray-800)`
- `#111827` → `var(--gray-900)`

### Cores de Status
- `#10b981` (verde sucesso) → `var(--success)`
- `#f59e0b` (amarelo aviso) → `var(--warning)`
- `#ef4444` (vermelho erro) → `var(--danger)`

### Transparência
- `transparent` → `transparent` (manter)
- `rgba(0, 0, 0, 0.1)` → usar variável `--shadow` ou criar classe

## Classes CSS Utilitárias Disponíveis

### Flexbox
- `cms-flex`, `cms-flex-col`, `cms-flex-row`
- `cms-items-center`, `cms-items-start`, `cms-items-end`
- `cms-justify-center`, `cms-justify-between`, `cms-justify-start`, `cms-justify-end`
- `cms-gap-1`, `cms-gap-2`, `cms-gap-3`, `cms-gap-4`, `cms-gap-6`, `cms-gap-8`

### Espaçamento
- `cms-p-1`, `cms-p-2`, `cms-p-3`, `cms-p-4`, `cms-p-6`
- `cms-px-2`, `cms-px-3`, `cms-px-4`
- `cms-py-2`, `cms-py-3`, `cms-py-4`
- `cms-m-1`, `cms-m-2`, `cms-m-3`, `cms-m-4`
- `cms-mb-2`, `cms-mb-3`, `cms-mb-4`
- `cms-mt-2`, `cms-mt-3`, `cms-mt-4`

### Texto
- `cms-text-sm`, `cms-text-base`, `cms-text-lg`, `cms-text-xl`, `cms-text-2xl`
- `cms-font-normal`, `cms-font-medium`, `cms-font-semibold`, `cms-font-bold`
- `cms-text-center`, `cms-text-left`, `cms-text-right`
- `cms-text-primary`, `cms-text-gray-500`, `cms-text-gray-600`, `cms-text-gray-700`, `cms-text-gray-900`, `cms-text-white`

### Background
- `cms-bg-white`, `cms-bg-gray-50`, `cms-bg-gray-100`, `cms-bg-primary`, `cms-bg-primary-light`

### Bordas e Sombras
- `cms-rounded`, `cms-rounded-lg`, `cms-rounded-full`
- `cms-border`, `cms-border-gray-200`, `cms-border-gray-300`
- `cms-shadow`, `cms-shadow-lg`

### Largura/Altura
- `cms-w-full`, `cms-w-auto`
- `cms-h-full`, `cms-h-screen`, `cms-min-h-screen`

## Exemplos de Conversão

### Antes (inline)
```tsx
<div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1.5rem',
  backgroundColor: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '0.75rem',
  color: '#1f2937'
}}>
```

### Depois (classes CSS)
```tsx
<div className="cms-flex cms-items-center cms-justify-between cms-p-6 cms-bg-white cms-border cms-border-gray-200 cms-rounded-lg cms-text-gray-800">
```

### Antes (cores hardcoded)
```tsx
<button style={{
  backgroundColor: '#3b82f6',
  color: 'white',
  padding: '0.75rem 1.5rem',
  borderRadius: '0.5rem'
}}>
```

### Depois (classes CSS)
```tsx
<button className="cms-btn cms-btn-primary cms-px-4 cms-py-3 cms-rounded">
```

## Padrões de Estilos Inline → Classes CSS

| Estilo Inline | Classe CSS |
|--------------|------------|
| `display: 'flex'` | `cms-flex` |
| `display: 'flex', flexDirection: 'column'` | `cms-flex-col` |
| `alignItems: 'center'` | `cms-items-center` |
| `justifyContent: 'space-between'` | `cms-justify-between` |
| `gap: '1rem'` | `cms-gap-4` |
| `padding: '1.5rem'` | `cms-p-6` |
| `padding: '0.75rem 1.5rem'` | `cms-px-6 cms-py-3` |
| `marginBottom: '1rem'` | `cms-mb-4` |
| `backgroundColor: 'white'` | `cms-bg-white` |
| `color: '#1f2937'` | `cms-text-gray-800` |
| `border: '1px solid #e5e7eb'` | `cms-border cms-border-gray-200` |
| `borderRadius: '0.5rem'` | `cms-rounded` |
| `borderRadius: '0.75rem'` | `cms-rounded-lg` |
| `fontSize: '0.875rem'` | `cms-text-sm` |
| `fontSize: '1.25rem'` | `cms-text-xl` |
| `fontWeight: 'semibold'` | `cms-font-semibold` |
| `textAlign: 'center'` | `cms-text-center` |



