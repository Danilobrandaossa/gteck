# 📝 Convenções de Nomenclatura - CMS Moderno

## 📋 Índice
1. [Arquivos e Pastas](#arquivos-e-pastas)
2. [Componentes React](#componentes-react)
3. [Hooks Customizados](#hooks-customizados)
4. [Contextos](#contextos)
5. [Tipos TypeScript](#tipos-typescript)
6. [Funções e Variáveis](#funções-e-variáveis)
7. [Constantes](#constantes)
8. [CSS e Estilos](#css-e-estilos)
9. [APIs e Rotas](#apis-e-rotas)
10. [Banco de Dados](#banco-de-dados)

---

## 📁 Arquivos e Pastas

### Estrutura de Pastas
```
app/
├── (auth)/                 # Grupo de rotas autenticadas
│   ├── dashboard/
│   ├── settings/
│   └── pages/
├── api/                    # API routes
│   ├── auth/
│   ├── wordpress/
│   └── pressel/
├── globals.css            # Estilos globais
└── layout.tsx             # Layout raiz

components/
├── ui/                    # Componentes base
│   ├── button.tsx
│   ├── modal.tsx
│   └── card.tsx
├── layout/                # Componentes de layout
│   ├── dashboard-layout.tsx
│   ├── header.tsx
│   └── sidebar.tsx
├── forms/                 # Formulários
│   ├── login-form.tsx
│   └── settings-form.tsx
└── auth/                  # Componentes de autenticação
    └── protected-route.tsx

lib/
├── auth.ts               # Configurações de auth
├── db.ts                 # Configuração do banco
├── wordpress-api.ts      # Integração WordPress
└── utils.ts              # Utilitários gerais

contexts/
├── auth-context.tsx      # Contexto de autenticação
├── organization-context.tsx
└── site-context.tsx

types/
└── index.ts             # Tipos globais
```

### Convenções de Arquivos

#### Páginas (app/)
```typescript
// ✅ CORRETO
app/dashboard/page.tsx
app/settings/page.tsx
app/pages/[id]/edit/page.tsx

// ❌ INCORRETO
app/Dashboard/page.tsx
app/settings/SettingsPage.tsx
```

#### Componentes
```typescript
// ✅ CORRETO
components/ui/standard-button.tsx
components/layout/dashboard-layout.tsx
components/forms/login-form.tsx

// ❌ INCORRETO
components/UI/StandardButton.tsx
components/Layout/DashboardLayout.tsx
```

#### Utilitários
```typescript
// ✅ CORRETO
lib/wordpress-api.ts
lib/performance-optimizer.ts
lib/design-system-v2.ts

// ❌ INCORRETO
lib/WordPressAPI.ts
lib/performanceOptimizer.ts
```

---

## ⚛️ Componentes React

### Nomenclatura de Componentes
```typescript
// ✅ CORRETO - PascalCase para componentes
export function StandardButton() { }
export function DashboardLayout() { }
export function LoginForm() { }

// ❌ INCORRETO
export function standardButton() { }
export function dashboard_layout() { }
```

### Props Interface
```typescript
// ✅ CORRETO - Interface com sufixo Props
interface StandardButtonProps {
  variant: 'primary' | 'secondary'
  size: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

// ❌ INCORRETO
interface StandardButton { }
interface ButtonProps { }
```

### Componentes de Página
```typescript
// ✅ CORRETO - Nome descritivo + Page
export default function DashboardPage() { }
export default function SettingsPage() { }
export default function PagesPage() { }

// ❌ INCORRETO
export default function Dashboard() { }
export default function Settings() { }
```

---

## 🎣 Hooks Customizados

### Nomenclatura de Hooks
```typescript
// ✅ CORRETO - Sempre começam com 'use'
export function useAuth() { }
export function useOrganization() { }
export function useWordPressData() { }
export function usePerformanceOptimizer() { }

// ❌ INCORRETO
export function Auth() { }
export function organizationHook() { }
export function getWordPressData() { }
```

### Hooks de Contexto
```typescript
// ✅ CORRETO
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// ❌ INCORRETO
export function useAuthContext() { }
export function useAuthHook() { }
```

---

## 🔄 Contextos

### Nomenclatura de Contextos
```typescript
// ✅ CORRETO - Nome + Context
export const AuthContext = createContext<AuthContextType | null>(null)
export const OrganizationContext = createContext<OrganizationContextType | null>(null)

// ❌ INCORRETO
export const Auth = createContext()
export const OrganizationCtx = createContext()
```

### Providers
```typescript
// ✅ CORRETO - Nome + Provider
export function AuthProvider({ children }: { children: React.ReactNode }) { }
export function OrganizationProvider({ children }: { children: React.ReactNode }) { }

// ❌ INCORRETO
export function AuthContextProvider() { }
export function OrgProvider() { }
```

---

## 📝 Tipos TypeScript

### Interfaces
```typescript
// ✅ CORRETO - PascalCase
interface User {
  id: string
  name: string
  email: string
}

interface OrganizationSettings {
  name: string
  description: string
}

// ❌ INCORRETO
interface user { }
interface organization_settings { }
```

### Types
```typescript
// ✅ CORRETO - PascalCase
type ButtonVariant = 'primary' | 'secondary' | 'outline'
type Status = 'active' | 'inactive' | 'pending'
type UserRole = 'admin' | 'editor' | 'viewer'

// ❌ INCORRETO
type buttonVariant = 'primary' | 'secondary'
type user_status = 'active' | 'inactive'
```

### Enums
```typescript
// ✅ CORRETO - PascalCase
enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

enum HttpStatus {
  OK = 200,
  NOT_FOUND = 404,
  SERVER_ERROR = 500
}

// ❌ INCORRETO
enum userRole { }
enum http_status { }
```

---

## 🔧 Funções e Variáveis

### Funções
```typescript
// ✅ CORRETO - camelCase
function getUserById(id: string) { }
function validateEmail(email: string) { }
function formatDate(date: Date) { }
function handleSubmit() { }

// ❌ INCORRETO
function GetUserById() { }
function validate_email() { }
function FormatDate() { }
```

### Variáveis
```typescript
// ✅ CORRETO - camelCase
const currentUser = getUser()
const isLoading = false
const organizationData = getOrganization()
const wordPressSettings = getSettings()

// ❌ INCORRETO
const CurrentUser = getUser()
const is_loading = false
const organization_data = getOrganization()
```

### Constantes
```typescript
// ✅ CORRETO - SCREAMING_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const DEFAULT_PAGE_SIZE = 20
const SUPPORTED_FILE_TYPES = ['jpg', 'png', 'pdf']

// ❌ INCORRETO
const apiBaseUrl = 'https://api.example.com'
const maxFileSize = 5 * 1024 * 1024
const defaultPageSize = 20
```

---

## 🎨 CSS e Estilos

### Classes CSS
```css
/* ✅ CORRETO - kebab-case */
.cms-button { }
.cms-card { }
.cms-modal { }
.cms-form-group { }
.cms-input-primary { }

/* ❌ INCORRETO */
.cmsButton { }
.cms_card { }
.CMS-MODAL { }
```

### Variáveis CSS
```css
/* ✅ CORRETO - kebab-case */
:root {
  --primary-color: #3B82F6;
  --secondary-color: #6B7280;
  --border-radius-md: 0.5rem;
  --spacing-lg: 1.5rem;
  --font-size-base: 1rem;
}

/* ❌ INCORRETO */
:root {
  --primaryColor: #3B82F6;
  --secondary_color: #6B7280;
  --borderRadiusMd: 0.5rem;
}
```

### Estilos Inline
```typescript
// ✅ CORRETO - camelCase para propriedades
const buttonStyles = {
  backgroundColor: '#3B82F6',
  color: 'white',
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  fontWeight: '500'
}

// ❌ INCORRETO
const buttonStyles = {
  'background-color': '#3B82F6',
  'font-size': '0.875rem'
}
```

---

## 🌐 APIs e Rotas

### Rotas de API
```typescript
// ✅ CORRETO - kebab-case
app/api/auth/login/route.ts
app/api/wordpress/sync/route.ts
app/api/pressel/models/route.ts
app/api/organizations/[id]/route.ts

// ❌ INCORRETO
app/api/Auth/Login/route.ts
app/api/wordpress_sync/route.ts
app/api/PresselModels/route.ts
```

### Endpoints
```typescript
// ✅ CORRETO
export async function POST(request: Request) { }
export async function GET(request: Request) { }
export async function PUT(request: Request) { }
export async function DELETE(request: Request) { }

// ❌ INCORRETO
export async function post() { }
export async function getData() { }
export async function updateData() { }
```

### Parâmetros de Query
```typescript
// ✅ CORRETO
const { page, limit, search, filter } = searchParams

// ❌ INCORRETO
const { Page, Limit, SearchTerm, FilterType } = searchParams
```

---

## 🗄️ Banco de Dados

### Tabelas
```sql
-- ✅ CORRETO - snake_case
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ❌ INCORRETO
CREATE TABLE Users (
  Id UUID PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);
```

### Campos
```sql
-- ✅ CORRETO
user_id, organization_id, created_at, updated_at, is_active

-- ❌ INCORRETO
userId, organizationId, createdAt, UpdatedAt, IsActive
```

### Relacionamentos
```sql
-- ✅ CORRETO
FOREIGN KEY (user_id) REFERENCES users(id)
FOREIGN KEY (organization_id) REFERENCES organizations(id)

-- ❌ INCORRETO
FOREIGN KEY (userId) REFERENCES Users(Id)
```

---

## 📋 Checklist de Nomenclatura

### ✅ Arquivos
- [ ] Páginas em kebab-case
- [ ] Componentes em PascalCase
- [ ] Utilitários em camelCase
- [ ] Constantes em SCREAMING_SNAKE_CASE

### ✅ Componentes
- [ ] Nomes descritivos
- [ ] Props interfaces com sufixo Props
- [ ] Hooks começam com 'use'
- [ ] Contextos com sufixo Context

### ✅ TypeScript
- [ ] Interfaces em PascalCase
- [ ] Types em PascalCase
- [ ] Enums em PascalCase
- [ ] Funções em camelCase

### ✅ CSS
- [ ] Classes em kebab-case
- [ ] Variáveis CSS em kebab-case
- [ ] Propriedades inline em camelCase

### ✅ APIs
- [ ] Rotas em kebab-case
- [ ] Endpoints em maiúsculas
- [ ] Parâmetros em camelCase

### ✅ Banco de Dados
- [ ] Tabelas em snake_case
- [ ] Campos em snake_case
- [ ] Relacionamentos consistentes

---

## 🎯 Benefícios das Convenções

### ✅ Consistência
- Código mais legível
- Padrões uniformes
- Facilita manutenção

### ✅ Escalabilidade
- Novos desenvolvedores entendem rapidamente
- Estrutura previsível
- Refatoração mais fácil

### ✅ Qualidade
- Menos erros de nomenclatura
- Melhor organização
- Código mais profissional

---

*Estas convenções devem ser seguidas rigorosamente em todo o projeto para manter a consistência e qualidade do código.*









