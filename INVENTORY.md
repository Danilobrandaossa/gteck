# INVENTÓRIO DO PROJETO CMS MODERNO

**Data:** 2025-10-31  
**Versão:** 1.0.0  
**Tipo:** Sistema de Gerenciamento de Conteúdo Multi-Organização (Next.js + TypeScript + Prisma)

---

## 📁 ESTRUTURA DE DIRETÓRIOS

### `/app` - Aplicação Next.js (App Router)
**Propósito:** Páginas e rotas da aplicação Next.js usando App Router  
**Pontos de Entrada:**
- `layout.tsx` - Layout raiz da aplicação
- `page.tsx` - Página inicial
- `providers.tsx` - Providers React (contextos globais)

**Subdiretórios:**
- `/api` - API Routes (21 rotas)
  - `/ai/generate` - Geração de conteúdo com IA
  - `/pressel/convert`, `/pressel/create` - Pressel Automation
  - `/wordpress/sync` - Sincronização WordPress
- `/auth/login` - Página de autenticação
- `/dashboard` - Dashboard principal
- `/pressel` - Interface Pressel Automation (upload/publicação)
- `/wordpress`, `/wordpress-diagnostic` - Ferramentas WordPress
- `/pages`, `/templates`, `/media`, `/users`, `/categories` - CRUDs
- `/automation`, `/queue`, `/seo`, `/backup` - Funcionalidades avançadas

**Dependências Internas:**
- `@/components/*` - Componentes reutilizáveis
- `@/contexts/*` - Contextos React
- `@/lib/*` - Bibliotecas utilitárias

**Dependências Externas:**
- `next` - Framework
- `react`, `react-dom` - UI
- `next-auth` - Autenticação
- `axios` - HTTP client

---

### `/components` - Componentes React Reutilizáveis
**Propósito:** Componentes UI compartilhados

**Estrutura:**
- `/auth` - Autenticação (protected-route)
- `/editor` - Editor WYSIWYG (TipTap)
- `/forms` - Formulários reutilizáveis (6 arquivos)
- `/layout` - Layout components (header, sidebar, dashboard-layout, organization-selector)
- `/media` - Upload e gerenciamento de mídia
- `/ui` - Componentes base UI (9 arquivos - provavelmente shadcn/ui)
- `setup-wizard.tsx` - Assistente de configuração
- `suppress-hydration-warning.tsx` - Utilidade para SSR

**Padrão:** Componentes funcionais com TypeScript

---

### `/contexts` - Contextos React (State Management)
**Propósito:** Gerenciamento de estado global com React Context API

**Arquivos (14 contextos):**
- `ai-context.tsx` - IA/LLM integration
- `api-config-context.tsx` - Configurações de APIs
- `auth-context.tsx` - Autenticação
- `bulk-operations-context.tsx` - Operações em lote
- `categories-context.tsx` - Categorias
- `media-context.tsx` - Mídia
- `organization-context.tsx` - Organizações
- `pages-context.tsx` - Páginas
- `pressel-context.tsx` - Pressel Automation
- `prompt-templates-context.tsx` - Templates de prompts
- `queue-context.tsx` - Sistema de filas
- `seo-context.tsx` - SEO
- `templates-context.tsx` - Templates
- `users-context.tsx` - Usuários
- `wordpress-context.tsx` - Integração WordPress

**Padrão:** Custom hooks (useAuth, useWordPress, etc.)

---

### `/lib` - Bibliotecas e Utilitários
**Propósito:** Funções utilitárias, serviços e helpers

**Arquivos (39 arquivos):**
- `auth.ts` - Serviço de autenticação
- `ai-services.ts` - Integração com APIs de IA
- `wordpress-api.ts` - Cliente WordPress REST API
- `wordpress-sync.ts` - Sincronização WordPress
- `wordpress-diagnostics.ts` - Diagnósticos WordPress
- `pressel-automation-core.ts` - Core Pressel Automation
- `pressel-logger.ts` - Logger estruturado (PS-CÓDIGOS)
- `pressel-model-detector.ts` - Detecção de modelos
- `pressel-schema-mapper.ts` - Mapeamento ACF
- `db.ts` - Cliente Prisma
- `logger.ts` - Logger geral
- `automation.ts` - Automações
- `cron-jobs.ts` - Jobs agendados
- `persistence-manager.ts` - Gerenciamento de persistência
- `rate-limiter.ts` - Rate limiting
- `retry-logic.ts` - Lógica de retry

**Padrão:** TypeScript modules, sem side effects desnecessários

---

### `/hooks` - Custom Hooks React
**Propósito:** Hooks reutilizáveis

**Arquivos (6 hooks):**
- Arquivos `.ts` - Hooks customizados

---

### `/prisma` - Schema e Migrations Prisma
**Propósito:** ORM e gerenciamento de banco de dados

**Arquivos:**
- `schema.prisma` - Schema principal
- `schema-dev.prisma` - Schema desenvolvimento (opcional)
- `*.db` - Banco SQLite (desenvolvimento)

**Models Principais:** User, Organization, Site, Page, Template, Media, Category, etc.

---

### `/types` - TypeScript Type Definitions
**Propósito:** Definições de tipos compartilhadas

**Arquivo:**
- `index.ts` - Tipos globais

---

### `/scripts` - Scripts de Utilidade
**Propósito:** Scripts Node.js para automação, testes e setup

**Quantidade:** 163 arquivos
- `.js` - Scripts Node.js (142 arquivos)
- `.sh` - Scripts Shell (8 arquivos)
- `.bat` - Scripts Windows (7 arquivos)
- Outros

**Categorias:**
- Setup/Instalação (setup.sh, setup.bat, deploy.sh)
- Desenvolvimento (dev.sh, dev.bat)
- Testes (test-*.js)
- Manutenção/Backup

**⚠️ OBSERVAÇÃO:** Quantidade excessiva de scripts - revisar necessidade

---

### `/uploads` - Uploads e Assets
**Propósito:** Arquivos enviados pelos usuários e modelos de referência

**Estrutura:**
- `/pressel-models` - Modelos Pressel (V1, V4)
  - `/V1` - Modelo V1 (templates, schemas, guias)
  - `/V4` - Modelo V4 (templates, schemas, guias)

---

### `/pressel-automation` - Plugin WordPress Antigo
**Propósito:** Plugin WordPress para Pressel Automation (versão antiga)

**Status:** ⚠️ Possivelmente legado/obsoleto (existe `pressel-automation-v2`)

**Arquivos:**
- PHP files (12)
- Documentação (3 MD)
- Assets (CSS, JS)
- Schemas JSON (2)

---

### `/pressel-automation-v2` - Plugin WordPress V2
**Propósito:** Plugin WordPress atualizado para Pressel Automation

**Estrutura:**
- `pressel-automation-v2.php` - Arquivo principal
- `/includes` - Classes PHP (10 arquivos)
  - `class-pressel-*.php` - Módulos do plugin

**Status:** ✅ Versão ativa

---

### `/database` - Scripts SQL
**Propósito:** Scripts SQL de inicialização/migração

**Arquivos:**
- `schema-pressel.sql` - Schema Pressel
- `/init.sql` - Scripts de inicialização

---

### `/logs` - Logs do Sistema
**Propósito:** Logs de execução e processamento

**Estrutura:**
- `/pressel-automation` - Logs Pressel (54 arquivos JSON + logs)
- `upload-process.log` - Logs de upload
- `upload-stats.json` - Estatísticas

**⚠️ Considerar:** Rotação de logs, limpeza automática

---

### `/docs` - Documentação Técnica
**Propósito:** Documentação interna do projeto

**Arquivos:**
- `PRESSEL-AUTOMATION-IMPLEMENTATION.md`
- `PRESSEL-ERROR-CODES.md`
- `STYLE-GUIDE.md`
- `NAMING-CONVENTIONS.md`
- Outros

---

### `/tmp` - Arquivos Temporários
**Propósito:** Arquivos temporários de processamento

**Arquivos:** JSONs temporários do Pressel

**⚠️ Considerar:** Limpeza automática ou gitignore

---

### Arquivos Raiz Importantes

**Configuração:**
- `package.json` - Dependências npm
- `tsconfig.json` - Configuração TypeScript
- `next.config.js` - Configuração Next.js
- `env.example` - Variáveis de ambiente exemplo
- `.gitignore` - Arquivos ignorados pelo git

**Docker:**
- `Dockerfile` - Container da aplicação
- `docker-compose.yml` - Orquestração dev
- `docker-compose.dev.yml` - Ambiente desenvolvimento
- `docker-compose.prod.yml` - Ambiente produção
- `nginx.conf` - Configuração Nginx

**Documentação:**
- `README.md` - Documentação principal
- `README-PRODUCAO.md` - Guia produção
- Múltiplos `RELATORIO-*.md` - Relatórios diversos

---

## 📊 ESTATÍSTICAS GERAIS

- **Total de Pastas:** ~25 principais
- **Total de Arquivos TypeScript/TSX:** ~200+
- **Total de Scripts:** 163
- **Total de Documentos MD:** 30+ (sem contar node_modules)
- **Plugins WordPress:** 2 versões (v1 legado, v2 ativo)

---

## ⚠️ PROBLEMAS IDENTIFICADOS INICIALMENTES

### 1. Código Duplicado/Legado
- `/pressel-automation` pode ser removido (existe v2)
- Múltiplos arquivos ZIP de plugins (`pressel-automation-v2.zip`, etc.)
- Muitos relatórios MD na raiz (podem ir para `/docs/relatorios/`)

### 2. Arquivos Temporários/Teste
- `/tmp` com JSONs
- Vários `test-*.json` na raiz
- Arquivos `*.bat` de teste (`update-api-keys.bat`, etc.)

### 3. Documentação Espalhada
- 30+ arquivos MD na raiz
- Alguns podem ser consolidados ou organizados em `/docs`

### 4. Scripts Excessivos
- 163 scripts podem ter duplicações ou estar obsoletos

### 5. Logs Acumulados
- 54+ arquivos de log em `/logs/pressel-automation`
- Necessário estratégia de rotação

---

## 🔄 DEPENDÊNCIAS PRINCIPAIS

### Frontend
- Next.js 14.0.4
- React 18.2.0
- TypeScript 5.3.3
- Tailwind CSS
- Radix UI (componentes)
- TipTap (editor)
- Lucide React (ícones)

### Backend
- Next.js API Routes
- Prisma 5.7.1
- NextAuth 4.24.5

### Integrações
- OpenAI 4.20.1
- Axios 1.6.2
- WordPress REST API (custom)

### Build Tools
- ESLint 8.56.0
- Prettier (implícito via Next.js)

---

## 📝 PRÓXIMOS PASSOS DA AUDITORIA

1. ✅ Inventário completo (este documento)
2. ⏳ Análise de código morto
3. ⏳ Auditoria de dependências
4. ⏳ Verificação de segurança
5. ⏳ Análise de performance
6. ⏳ Cobertura de testes

---

**Última Atualização:** 2025-10-31  
**Mantenedor:** Equipe de Desenvolvimento

