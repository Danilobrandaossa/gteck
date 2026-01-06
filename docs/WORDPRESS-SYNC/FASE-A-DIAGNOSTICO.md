# 🔍 FASE A — DIAGNÓSTICO DO ESTADO ATUAL

**Data:** 24 de Dezembro de 2025  
**Objetivo:** Mapear completamente o estado atual da integração WordPress e identificar gaps técnicos  
**Status:** ✅ **COMPLETO**

---

## 📋 ÍNDICE

1. [Arquivos Existentes](#1-arquivos-existentes-relacionados-a-wordpress)
2. [Credenciais e Configuração](#2-credenciais-e-configuração)
3. [O Que Já Sincroniza](#3-o-que-já-sincroniza)
4. [Tratamento de ACF](#4-tratamento-de-acf-advanced-custom-fields)
5. [Infraestrutura de Suporte](#5-infraestrutura-de-suporte-queue-embeddings-observabilidade)
6. [Gaps Identificados](#6-gaps-identificados)
7. [Resumo Executivo](#7-resumo-executivo)

---

## 1️⃣ ARQUIVOS EXISTENTES RELACIONADOS A WORDPRESS

### **1.1. Libraries (lib/)**

#### ✅ **wordpress-api.ts**
- **Propósito**: Client para WordPress REST API
- **Funcionalidades**:
  - `testConnection()`: Testa conectividade
  - `getSiteStats()`: Retorna contadores (posts, pages, media, categories, tags, users)
  - `getPosts()`, `getPages()`, `getMedia()`: Busca com paginação
  - `createPost()`, `updatePost()`, `deletePost()`: CRUD de posts
  - `uploadMedia()`: Upload de mídia
- **Autenticação**: Basic Auth (username + password encoded em base64)
- **Proxy**: Usa `/api/wordpress/proxy` para contornar CORS
- **Status**: ✅ Funcional, mas **não persiste dados no banco**

#### ✅ **wordpress-sync.ts**
- **Propósito**: Sincronização completa de dados WordPress
- **Funcionalidades**:
  - `syncAllContent()`: Busca todos os dados (posts, pages, media, categories, tags, users) com paginação
  - Métodos privados: `fetchAllPosts()`, `fetchAllPages()`, etc.
  - **Usa proxy** para todas as requests
- **Status**: ✅ Funcional, mas **não persiste no banco local** (apenas retorna JSON)

#### ✅ **wordpress-full-sync.ts**
- **Propósito**: Variação de sincronização completa
- **Funcionalidades**: Semelhante a `wordpress-sync.ts`, mas com estrutura de classe diferente
- **Status**: ✅ Funcional, **duplicado** (mesma lógica que `wordpress-sync.ts`)

#### ✅ **wordpress-integration-service.ts**
- **Propósito**: Serviço unificado para integração WordPress
- **Funcionalidades**:
  - `configure(credentials)`: Configurar credenciais
  - `syncData(options)`: Sincronização de dados
- **Status**: ✅ Funcional, mas **incompleto** (mock de configuração)

#### ✅ **wordpress-credentials-validator.ts**
- **Propósito**: Validação de credenciais WordPress
- **Status**: ✅ Funcional

#### ⚠️ **wordpress-diagnostics.ts**
- **Propósito**: Diagnóstico de conexão e configuração WordPress
- **Status**: ⚠️ Funcional, mas **isolado** (não integrado ao fluxo principal)

#### ⚠️ **acf-sync-manager.ts**
- **Propósito**: Gerenciador de sincronização de ACF (Advanced Custom Fields)
- **Funcionalidades**:
  - `syncAllACFData()`: Sincronizar campos ACF
  - `processACFFields()`: Processar campos ACF individuais
- **Status**: ⚠️ Funcional, mas **não integrado ao fluxo de sync principal**

#### ⚠️ **enhanced-wordpress-sync.ts**
- **Propósito**: Sincronização expandida (com ACF e monetização)
- **Funcionalidades**:
  - `syncACFData()`: Sincronizar dados ACF
  - `syncMonetizationData()`: Sincronizar dados de monetização
- **Status**: ⚠️ Funcional, mas **não é usado pelos endpoints principais**

---

### **1.2. API Endpoints (app/api/wordpress/)**

#### ✅ **proxy/route.ts**
- **Método**: `POST`, `GET`
- **Propósito**: Proxy para contornar CORS ao acessar WordPress REST API
- **Funcionalidades**:
  - Retry com backoff exponencial (3 tentativas)
  - Timeout de 20s
  - Limpeza de URL (limita `per_page`, valida `page`)
  - Headers de compatibilidade
- **Status**: ✅ **CORE FUNCIONAL** (usado por todas as requests ao WP)

#### ✅ **sync/route.ts**
- **Método**: `POST`
- **Propósito**: Executar ações de sincronização
- **Ações suportadas**:
  - `create_post`: Criar post no WordPress
  - `upload_media`: Upload de mídia
  - `create_acf_field`: Criar campo ACF
  - `test_connection`: Testar conexão
- **Status**: ✅ Funcional, mas **não persiste no banco local**

#### ✅ **sync-all/route.ts**
- **Método**: `POST`
- **Propósito**: Sincronização completa ou gradual
- **Payload**: `{ baseUrl, username, password, gradual, itemsPerPage }`
- **Funcionalidades**:
  - Usa `WordPressDataManager.syncAllData()`
  - Suporta modo gradual (itemsPerPage configurável)
- **Status**: ✅ Funcional, mas **não persiste no banco local**

#### ✅ **validate-site/route.ts**
- **Método**: `POST`
- **Propósito**: Validar conectividade e credenciais de um site WordPress
- **Status**: ✅ Funcional

#### ✅ **credentials/route.ts**
- **Método**: `GET`
- **Propósito**: Retornar credenciais WordPress configuradas (mascaradas)
- **Status**: ✅ Funcional, mas **retorna credenciais globais de env** (não por site)

#### ✅ **create-post/route.ts**
- **Método**: `POST`
- **Propósito**: Criar post no WordPress
- **Status**: ✅ Funcional (direção CMS → WP)

#### ✅ **create-page/route.ts**
- **Método**: `POST`
- **Propósito**: Criar página no WordPress
- **Status**: ✅ Funcional (direção CMS → WP)

---

### **1.3. Contexts (contexts/)**

#### ✅ **wordpress-context.tsx**
- **Propósito**: Context React para gerenciar estado WordPress no frontend
- **Status**: ✅ Funcional (frontend)

#### ✅ **api-config-context.tsx**
- **Propósito**: Context para configurações de APIs (incluindo WordPress)
- **Dados Mock**: Inclui exemplo de site WordPress com credenciais
- **Status**: ✅ Funcional, mas **usa mock** (não conectado ao banco)

---

### **1.4. UI Pages (app/)**

#### ✅ **wordpress/page.tsx**
- **Propósito**: Página de gerenciamento WordPress no CMS
- **Status**: ✅ Funcional (UI existente)

#### ✅ **wordpress-diagnostic/page.tsx**
- **Propósito**: Página de diagnóstico WordPress
- **Status**: ✅ Funcional

#### ✅ **wordpress-diagnostic-ai/page.tsx**
- **Propósito**: Diagnóstico WordPress com IA
- **Status**: ✅ Funcional

---

### **1.5. Plugins WordPress**

#### ✅ **pressel-automation-v2/** (Plugin WordPress)
- **Propósito**: Plugin WordPress para automação Pressel (templates específicos)
- **Funcionalidades**:
  - REST API Controller
  - Template Applier
  - ACF Service
  - Logger
- **Status**: ✅ Funcional, mas **específico para Pressel** (não genérico)

#### ⚠️ **Plugin Automarticles 1.3/**
- **Propósito**: Plugin WordPress para automação de artigos
- **Status**: ⚠️ Legado, **não integrado**

---

## 2️⃣ CREDENCIAIS E CONFIGURAÇÃO

### **2.1. Armazenamento Atual**

#### ❌ **Via Environment Variables (env.example / .env.local)**
```env
# WordPress (GLOBAL - não por site/tenant)
WORDPRESS_DEFAULT_USERNAME="admin"
WORDPRESS_DEFAULT_PASSWORD="your-wordpress-password"
WORDPRESS_DEFAULT_URL="https://your-wordpress-site.com"
WP_DEFAULT_AUTH_TYPE="basic"
```

**Problema**: Credenciais são **globais**, não por `siteId`. Não suporta múltiplos sites WordPress por organização.

---

#### ⚠️ **Via Prisma Model: AIPluginConfig**

```prisma
model AIPluginConfig {
  id            String   @id @default(cuid())
  siteId        String   @unique
  site          Site     @relation(...)
  apiKey        String?  // API Key do plugin
  webhookUrl    String?  // URL do webhook no WordPress
  webhookSecret String?  // Secret para validação HMAC
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**Observações**:
- ✅ **Relação 1:1 com Site** (multi-tenant)
- ✅ Campos para `webhookUrl` e `webhookSecret`
- ❌ **NÃO armazena credenciais WordPress** (username, password, siteUrl)
- ❌ **NÃO armazena authType** (basic, application password, JWT, OAuth)
- ✅ Existe endpoint `GET /api/ai-plugin-config` para buscar/criar config por `siteId`

**Propósito Atual**: Configuração de plugin WordPress para webhooks (direção WP → CMS), **não para sincronização CMS → WP**.

---

#### ⚠️ **Via database/schema-pressel.sql (SQL adicional, não no Prisma)**

```sql
-- Adicionar colunas WordPress à tabela sites
ALTER TABLE sites ADD COLUMN wp_base_url VARCHAR(255);
ALTER TABLE sites ADD COLUMN wp_auth_type ENUM('basic', 'bearer', 'nonce') DEFAULT 'basic';
ALTER TABLE sites ADD COLUMN wp_username VARCHAR(100);
ALTER TABLE sites ADD COLUMN wp_password TEXT; -- App password ou token
ALTER TABLE sites ADD COLUMN wp_nonce VARCHAR(255); -- Para autenticação nonce
ALTER TABLE sites ADD COLUMN wp_configured BOOLEAN DEFAULT FALSE;
ALTER TABLE sites ADD COLUMN wp_last_sync TIMESTAMP NULL;
```

**Status**: ❌ **NÃO APLICADO** (schema SQL separado, não está no `prisma/schema.prisma`)

**Conclusão**: Este schema foi criado mas **nunca migrado para Prisma**, portanto **não existe no banco**.

---

### **2.2. Como Credenciais São Usadas Hoje**

1. **Endpoints recebem credenciais como payload**:
   ```json
   {
     "baseUrl": "https://site.com",
     "username": "admin",
     "password": "xxx"
   }
   ```

2. **Ou usam env vars globais**:
   ```typescript
   const username = process.env.WORDPRESS_DEFAULT_USERNAME
   const password = process.env.WORDPRESS_DEFAULT_PASSWORD
   ```

3. **Não há criptografia** de senhas armazenadas.

4. **Não há validação de ownership** (qualquer request pode passar qualquer `siteUrl`).

---

## 3️⃣ O QUE JÁ SINCRONIZA

### **3.1. Direção: WordPress → CMS (Fetch)**

#### ✅ **Posts**
- **Endpoint WP**: `/wp-json/wp/v2/posts`
- **Lib**: `wordpress-api.ts`, `wordpress-sync.ts`
- **Paginação**: ✅ Suportada (`per_page=100`, iteração por páginas)
- **Filtros**: `status=publish`
- **Dados retornados**: `id`, `title`, `content`, `excerpt`, `status`, `date`, `slug`, `author`, `featured_media`, `categories`, `tags`
- **Persiste no banco**: ❌ **NÃO** (apenas retorna JSON)

#### ✅ **Pages**
- **Endpoint WP**: `/wp-json/wp/v2/pages`
- **Lib**: `wordpress-api.ts`, `wordpress-sync.ts`
- **Paginação**: ✅ Suportada
- **Dados retornados**: `id`, `title`, `content`, `status`, `date`, `slug`, `parent`, `menu_order`
- **Persiste no banco**: ❌ **NÃO**

#### ✅ **Media**
- **Endpoint WP**: `/wp-json/wp/v2/media`
- **Lib**: `wordpress-api.ts`, `wordpress-sync.ts`
- **Paginação**: ✅ Suportada
- **Dados retornados**: `id`, `title`, `media_type`, `mime_type`, `source_url`, `date`, `alt_text`
- **Persiste no banco**: ❌ **NÃO**

#### ✅ **Categories**
- **Endpoint WP**: `/wp-json/wp/v2/categories`
- **Lib**: `wordpress-api.ts`, `wordpress-sync.ts`
- **Paginação**: ✅ Suportada
- **Dados retornados**: `id`, `name`, `slug`, `description`, `parent`
- **Persiste no banco**: ❌ **NÃO**

#### ✅ **Tags**
- **Endpoint WP**: `/wp-json/wp/v2/tags`
- **Lib**: `wordpress-api.ts`, `wordpress-sync.ts`
- **Paginação**: ✅ Suportada
- **Dados retornados**: `id`, `name`, `slug`, `description`
- **Persiste no banco**: ❌ **NÃO**

#### ✅ **Users**
- **Endpoint WP**: `/wp-json/wp/v2/users`
- **Lib**: `wordpress-api.ts`, `wordpress-sync.ts`
- **Paginação**: ✅ Suportada
- **Dados retornados**: `id`, `name`, `slug`, `description`, `avatar_urls`
- **Persiste no banco**: ❌ **NÃO**

#### ⚠️ **ACF (Advanced Custom Fields)**
- **Endpoint WP**: `/wp-json/acf/v3/posts/{id}` ou campos embutidos no post/page
- **Lib**: `acf-sync-manager.ts`, `enhanced-wordpress-sync.ts`, `pressel-automation-core.ts`
- **Status**: ⚠️ **PARCIAL** (funciona para Pressel, mas não integrado ao sync principal)
- **Persiste no banco**: ❌ **NÃO**

---

### **3.2. Direção: CMS → WordPress (Push)**

#### ✅ **Criar Posts**
- **Endpoint CMS**: `POST /api/wordpress/create-post`
- **Endpoint WP**: `POST /wp-json/wp/v2/posts`
- **Lib**: `wordpress-api.ts` (`createPost()`)
- **Status**: ✅ Funcional

#### ✅ **Criar Pages**
- **Endpoint CMS**: `POST /api/wordpress/create-page`
- **Endpoint WP**: `POST /wp-json/wp/v2/pages`
- **Lib**: `wordpress-api.ts`
- **Status**: ✅ Funcional

#### ✅ **Atualizar Posts**
- **Lib**: `wordpress-api.ts` (`updatePost()`)
- **Endpoint WP**: `POST /wp-json/wp/v2/posts/{id}`
- **Status**: ✅ Funcional

#### ✅ **Deletar Posts**
- **Lib**: `wordpress-api.ts` (`deletePost()`)
- **Endpoint WP**: `DELETE /wp-json/wp/v2/posts/{id}?force=true`
- **Status**: ✅ Funcional

#### ✅ **Upload Media**
- **Lib**: `wordpress-api.ts` (`uploadMedia()`)
- **Endpoint WP**: `POST /wp-json/wp/v2/media`
- **Status**: ✅ Funcional

#### ⚠️ **ACF Fields**
- **Endpoint CMS**: `POST /api/wordpress/sync` (action: `create_acf_field`)
- **Lib**: `pressel-automation-core.ts` (`processACFFields()`)
- **Métodos**:
  - `updateACFViaWordPressAPI()`
  - `updateACFViaMetaAPI()`
  - `registerACFFields()` (registro automático)
- **Status**: ⚠️ **FUNCIONAL**, mas **específico para Pressel** (não genérico)

---

## 4️⃣ TRATAMENTO DE ACF (ADVANCED CUSTOM FIELDS)

### **4.1. Como ACF É Tratado Hoje**

#### ✅ **Pressel Automation**
- **Contexto**: Sistema específico para templates "Pressel" (figurinhas, memes, etc.)
- **Lib**: `pressel-automation-core.ts`, `pressel-automation-service.ts`
- **Funcionalidades**:
  - **Mapeamento JSON → ACF**: `PresselSchemaMapper` mapeia campos JSON para campos ACF
  - **Registro Automático**: `registerACFFields()` registra campos ACF automaticamente via API
  - **Múltiplas Abordagens**: Tenta 3 métodos para salvar ACF (API, Meta API, direto)
  - **Validação de Schema**: Valida campos obrigatórios e tipos
- **Status**: ✅ **FUNCIONAL**, mas **não genérico** (específico para Pressel)

#### ⚠️ **ACF Sync Manager**
- **Lib**: `acf-sync-manager.ts`
- **Funcionalidades**:
  - `syncAllACFData()`: Sincronizar todos os campos ACF
  - `processACFFields()`: Processar campos ACF individuais
- **Status**: ⚠️ Funcional, mas **não integrado ao fluxo de sync principal**

#### ⚠️ **Enhanced WordPress Sync**
- **Lib**: `enhanced-wordpress-sync.ts`
- **Método**: `syncACFData()`
- **Status**: ⚠️ Funcional, mas **não é usado pelos endpoints principais**

---

### **4.2. Como ACF Deveria Ser Armazenado**

#### ❌ **No Banco Local**

**Opção 1**: Adicionar campo JSON ao modelo `Page`:
```prisma
model Page {
  // ... campos existentes
  acfFields String? @default("{}") // JSON
}
```

**Opção 2**: Criar modelo dedicado `ACFField`:
```prisma
model ACFField {
  id        String @id @default(cuid())
  pageId    String?
  page      Page?   @relation(...)
  
  aiContentId String?
  aiContent   AIContent? @relation(...)
  
  fieldKey    String // ACF field key (ex: "figurinha_imagem")
  fieldValue  String // JSON ou valor serializado
  fieldType   String // text, image, select, etc.
  
  organizationId String
  siteId         String
  
  @@index([organizationId, siteId])
  @@index([pageId])
  @@index([aiContentId])
}
```

**Status Atual**: ❌ **NENHUMA DAS OPÇÕES IMPLEMENTADA**

---

## 5️⃣ INFRAESTRUTURA DE SUPORTE (QUEUE, EMBEDDINGS, OBSERVABILIDADE)

### **5.1. QueueJob (Async Processing)**

#### ✅ **Prisma Model: QueueJob**

```prisma
model QueueJob {
  id          String    @id @default(cuid())
  type        String    // "embedding", "sync", "reindex", etc.
  status      String    @default("pending") // pending, processing, completed, failed
  data        String    // JSON payload
  result      String?
  error       String?
  attempts    Int       @default(0)
  maxAttempts Int       @default(3)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  processedAt DateTime?
  
  // FASE 7 ETAPA 4: Lock/Heartbeat para múltiplas instâncias
  lockedBy            String?
  lockedAt            DateTime?
  lockExpiresAt       DateTime?
  lastHeartbeatAt     DateTime?
  processingStartedAt DateTime?
  
  @@index([status])
  @@index([createdAt])
  @@index([status, lockExpiresAt]) // Para recuperação de stuck jobs
  @@index([lockedBy])
}
```

**Funcionalidades**:
- ✅ **Atomic Claim**: `QueueClaim.claimPendingJobs()` (UPDATE ... RETURNING)
- ✅ **Lock/Heartbeat**: TTL de 60s, heartbeat a cada 10s
- ✅ **Stuck Job Recovery**: `QueueClaim.recoverStuckJobs()`
- ✅ **Retry/Backoff**: `maxAttempts=3`
- ✅ **Múltiplas Instâncias**: Suporta N workers em paralelo

**Status**: ✅ **COMPLETO** (FASE 7 ETAPA 4)

**Aplicação para WordPress Sync**: ✅ **PRONTO** para usar (apenas precisa implementar `type: "wordpress_sync_page"`, etc.)

---

### **5.2. Embeddings e RAG**

#### ✅ **EmbeddingService**

**Lib**: `lib/embedding-service.ts`

**Funcionalidades**:
- ✅ `enqueueEmbeddingJob()`: Enfileira job de embedding
- ✅ `processEmbeddingJob()`: Processa job (worker)
- ✅ Suporta **chunks** (FASE 7 ETAPA 1):
  - Divide texto em chunks (overlap configurável)
  - Gera embedding por chunk
  - Salva em `EmbeddingChunk`
- ✅ Dedupe por `contentHash`
- ✅ Multi-tenant (organizationId + siteId)
- ✅ Providers: OpenAI, Google (Gemini)

**Status**: ✅ **COMPLETO** (FASE 7)

**Aplicação para WordPress Sync**: ✅ **PRONTO** (apenas precisa chamar após upsert de Page/AIContent)

---

#### ✅ **EmbeddingChunk (Chunks para RAG)**

**Prisma Model**:
```prisma
model EmbeddingChunk {
  id             String @id @default(cuid())
  organizationId String
  siteId         String
  
  sourceType String // "page", "ai_content", "template"
  sourceId   String
  
  chunkIndex Int
  chunkText  String
  chunkHash  String // SHA256 para dedupe
  
  embedding  Unsupported("vector(1536)")? // pgvector
  
  model      String  // "text-embedding-3-small", etc.
  provider   String  // "openai", "gemini"
  dimensions Int
  
  isActive   Boolean  @default(true)
  version    Int      @default(1)
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@index([organizationId, siteId, sourceType, sourceId, isActive])
  @@index([embedding(ops: raw("vector_cosine_ops"))], type: Hnsw)
}
```

**Status**: ✅ **COMPLETO** (FASE 7 ETAPA 1)

**Aplicação para WordPress Sync**: ✅ **PRONTO** (pode usar `sourceType: "page"` para páginas do WP)

---

### **5.3. Observabilidade (CorrelationId, Spans, Logs)**

#### ✅ **CorrelationId**

**Implementação**:
- ✅ Gerado em cada request (`middleware` ou `correlationId` na chamada)
- ✅ Propagado por logs estruturados
- ✅ Salvo em `ai_interactions.context.correlationId`
- ✅ Usado em `logger.ts` (JSON structured logging)

**Status**: ✅ **COMPLETO** (FASE 7 ETAPA 5)

**Aplicação para WordPress Sync**: ⚠️ **PARCIAL** (não propagado em todas as requests WP)

---

#### ✅ **Spans (Timings)**

**Implementação**:
- ✅ `ai_interactions.context.timings`: `{ totalMs, providerMs, vectorSearchMs, rerankMs }`
- ✅ Usado para medir p50/p95

**Status**: ✅ **COMPLETO** (FASE 7)

**Aplicação para WordPress Sync**: ❌ **NÃO IMPLEMENTADO** (não mede timings de sync WP)

---

#### ✅ **Health/Alerts**

**Endpoints**:
- ✅ `GET /api/admin/ai/health`: Saúde do sistema (protegido por `ADMIN_HEALTH_SECRET`)
- ✅ `GET /api/admin/ai/alerts`: Alertas ativos (thresholds configuráveis)

**Status**: ✅ **COMPLETO** (FASE 7 ETAPA 6)

**Aplicação para WordPress Sync**: ❌ **NÃO INTEGRADO** (sync WP não reporta métricas para health)

---

### **5.4. FinOps (Cost Management)**

#### ✅ **TenantCostPolicyService**

**Lib**: `lib/finops/tenant-cost-policy.ts`

**Funcionalidades**:
- ✅ Calcula gasto diário/mensal por tenant
- ✅ Estados: `NORMAL`, `CAUTION`, `THROTTLED`, `BLOCKED`
- ✅ Degradação graciosa: reduz `maxTokens`, usa modelos baratos, aumenta thresholds
- ✅ Alertas específicos por tenant

**Status**: ✅ **COMPLETO** (FASE 8 ETAPA 2)

**Aplicação para WordPress Sync**: ❌ **NÃO INTEGRADO** (sync WP não respeita FinOps)

---

### **5.5. Manutenção Cron**

#### ✅ **Endpoints Cron Existentes**

**Endpoints**:
- ✅ `GET /api/cron/ai/cleanup-cache`: Limpa cache expirado
- ✅ `GET /api/cron/ai/queue-housekeeping`: Limpa jobs antigos, recupera stuck jobs
- ✅ `GET /api/cron/ai/reindex-incremental`: Re-indexa conteúdo modificado (respeitando FinOps)
- ✅ `GET /api/cron/ai/embedding-housekeeping`: Desativa embeddings antigos

**Proteção**: `ADMIN_HEALTH_SECRET`

**Status**: ✅ **COMPLETO** (FASE 8 ETAPA 3)

**Aplicação para WordPress Sync**: ⚠️ **PARCIAL** (`reindex-incremental` pode re-indexar páginas WP se modificadas)

---

## 6️⃣ GAPS IDENTIFICADOS

### **GAP 1: CREDENCIAIS NÃO SÃO MULTI-TENANT** ❌

**Problema**:
- Credenciais WordPress são **globais** (env vars: `WORDPRESS_DEFAULT_USERNAME`, `WORDPRESS_DEFAULT_PASSWORD`)
- **Não há armazenamento por `siteId`**
- **Não há criptografia** de senhas
- **Não há validação de ownership** (qualquer request pode passar qualquer `siteUrl` sem verificar se pertence ao tenant)

**Impacto**:
- ❌ Não suporta múltiplos sites WordPress por organização
- ❌ Violação de isolamento multi-tenant
- ❌ Risco de vazamento de credenciais (logs)

**Solução Necessária**:
1. Adicionar campos ao modelo `Site` (Prisma):
   ```prisma
   model Site {
     // ... campos existentes
     wpBaseUrl      String?
     wpAuthType     String?  // "basic", "application_password", "jwt", "oauth"
     wpUsername     String?
     wpPasswordHash String?  // Criptografado (bcrypt ou AES)
     wpToken        String?  // Para JWT/OAuth
     wpConfigured   Boolean  @default(false)
     wpLastSyncAt   DateTime?
   }
   ```
2. Criar helpers para criptografar/descriptografar credenciais
3. Validar ownership antes de qualquer operação (site pertence a organizationId)
4. Adicionar endpoint `POST /api/sites/{siteId}/wordpress/configure` para salvar credenciais

---

### **GAP 2: NENHUM DADO É PERSISTIDO NO BANCO LOCAL** ❌

**Problema**:
- `wordpress-sync.ts` **busca** dados do WordPress, mas **apenas retorna JSON**
- **Não há upsert** em `Page`, `Category`, `Media`, `User` (banco local)
- **Não há "fonte de verdade"** definida (WP ou CMS?)

**Impacto**:
- ❌ Sync é "efêmero" (dados não ficam no CMS)
- ❌ Não há histórico de sync
- ❌ Não há como "trabalhar offline" (dados sempre vêm do WP)
- ❌ RAG não consegue buscar conteúdo do WP (não tem embeddings)

**Solução Necessária**:
1. Criar lógica de **upsert** após fetch:
   - Posts/Pages do WP → `Page` (banco local)
   - Categories do WP → `Category` (banco local)
   - Media do WP → `Media` (banco local)
   - Users do WP (opcional) → `User` ou tabela separada `WPUser`
2. Adicionar campos ao modelo `Page`:
   ```prisma
   model Page {
     // ... campos existentes
     wpPostId     Int?      // ID do post/page no WordPress
     wpSiteUrl    String?   // URL do site WordPress de origem
     wpSyncedAt   DateTime? // Última sincronização
     acfFields    String?   @default("{}") // JSON com campos ACF
   }
   ```
3. Implementar **idempotência** (sync múltiplas vezes não duplica)
4. Implementar **conflict resolution** (se modificado em ambos os lados, quem vence?)

---

### **GAP 3: NÃO HÁ MAPEAMENTO WordPress ID ↔ Local ID** ❌

**Problema**:
- **Não existe tabela de mapeamento** (ex: `wpPostId=123` → `localPageId=cuid123`)
- Sem mapeamento, **não há como garantir idempotência** (re-sync criaria duplicatas)
- Sem mapeamento, **não há como fazer sync bidirecional** (CMS ↔ WP)

**Impacto**:
- ❌ Sync não é idempotente
- ❌ Não há como atualizar (apenas criar)
- ❌ Não há como deletar (sem saber qual Page local corresponde ao post WP)

**Solução Necessária**:
1. **Opção A** (Simples): Adicionar campos ao modelo existente:
   ```prisma
   model Page {
     // ... campos existentes
     wpPostId  Int?
     wpSiteUrl String?
     @@unique([siteId, wpPostId]) // Garantir unicidade
   }
   ```

2. **Opção B** (Robusto): Criar tabela dedicada de mapeamento:
   ```prisma
   model WordPressSyncMap {
     id             String   @id @default(cuid())
     organizationId String
     siteId         String
     
     wpEntityType   String   // "post", "page", "media", "category", "tag"
     wpEntityId     Int      // ID no WordPress
     wpSiteUrl      String   // URL do site WordPress
     
     localEntityType String  // "page", "media", "category"
     localEntityId   String  // ID no banco local
     
     lastSyncAt     DateTime
     syncDirection  String   // "wp_to_cms", "cms_to_wp", "bidirectional"
     
     createdAt      DateTime @default(now())
     updatedAt      DateTime @updatedAt
     
     @@unique([siteId, wpEntityType, wpEntityId])
     @@index([organizationId, siteId])
     @@index([localEntityType, localEntityId])
   }
   ```

**Recomendação**: **Opção A** para começar (simples), evoluir para **Opção B** se precisar bidirecional robusto.

---

### **GAP 4: NÃO HÁ SYNC INCREMENTAL** ❌

**Problema**:
- Sync atual é **sempre full** (busca todos os posts/pages)
- **Não há `modified_since`** (buscar apenas modificados desde última sync)
- **Não há `lastSyncAt`** por site
- **Não há polling/cron** para sync automático

**Impacto**:
- ❌ Sync é lento (sempre busca tudo)
- ❌ Sync é caro (muitas requests desnecessárias)
- ❌ Não há sync automático (apenas manual)

**Solução Necessária**:
1. Adicionar `wpLastSyncAt` ao modelo `Site`
2. Usar parâmetro `modified_after` na API WordPress:
   ```
   /wp-json/wp/v2/posts?modified_after=2025-12-01T00:00:00Z
   ```
3. Criar endpoint cron:
   ```
   GET /api/cron/wordpress/incremental-sync
   ```
4. Implementar polling a cada X minutos (configurável)

---

### **GAP 5: NÃO HÁ WEBHOOKS FUNCIONANDO** ❌

**Problema**:
- `AIPluginConfig` tem campos `webhookUrl` e `webhookSecret`
- Existe endpoint `/api/ai-content/webhook`
- **MAS**: Não há implementação completa de webhook para sync WordPress

**Impacto**:
- ❌ Sync é apenas pull (CMS busca WP)
- ❌ Não há push (WP notifica CMS)
- ❌ Latência alta (precisa esperar cron)

**Solução Necessária**:
1. Implementar endpoint:
   ```
   POST /api/wordpress/webhook
   ```
2. Validar assinatura HMAC (`webhookSecret`)
3. Payload esperado:
   ```json
   {
     "event": "post_updated" | "post_created" | "post_deleted",
     "post_id": 123,
     "site_url": "https://site.com"
   }
   ```
4. Criar plugin WordPress (ou usar existente) para enviar webhooks
5. Enfileirar job: `QueueJob.create({ type: "wordpress_webhook", data: payload })`

---

### **GAP 6: ACF NÃO TEM ARMAZENAMENTO GENÉRICO** ⚠️

**Problema**:
- ACF funciona para **Pressel** (específico)
- **Não há armazenamento genérico** de campos ACF no banco
- **Não há campo `acfFields` no modelo `Page`**

**Impacto**:
- ⚠️ ACF funciona, mas apenas para casos específicos
- ❌ Não há como "buscar páginas WP com ACF X=Y" (sem armazenar no banco)

**Solução Necessária**:
1. Adicionar campo ao modelo `Page`:
   ```prisma
   model Page {
     // ... campos existentes
     acfFields String? @default("{}") // JSON
   }
   ```
2. Ao buscar post/page do WP, incluir ACF no JSON salvo
3. Criar helper: `getACFField(page, "field_name")`

---

### **GAP 7: EMBEDDINGS NÃO SÃO GERADOS APÓS SYNC WP** ❌

**Problema**:
- Quando **Page é criada/atualizada via sync WP**, **não aciona embeddings**
- RAG não consegue buscar conteúdo do WordPress

**Impacto**:
- ❌ RAG/Chat não funciona para conteúdo do WordPress
- ❌ Conteúdo WP fica "invisível" para IA

**Solução Necessária**:
1. Após upsert de `Page` (via sync WP):
   ```typescript
   await EmbeddingService.enqueueEmbeddingJob({
     organizationId,
     siteId,
     sourceType: 'page',
     sourceId: page.id,
     content: page.content,
     provider: 'openai',
     model: 'text-embedding-3-small'
   })
   ```
2. Respeitar FinOps: **não enfileirar se tenant `THROTTLED`/`BLOCKED`**
3. Logs + correlationId

---

### **GAP 8: FINOPS NÃO É RESPEITADO NO SYNC** ❌

**Problema**:
- Sync WordPress **não verifica `TenantCostPolicyService`**
- Se tenant está `BLOCKED`, sync ainda funciona (e pode gerar embeddings caros)

**Impacto**:
- ❌ Violação de orçamento por tenant
- ❌ Custo pode explodir

**Solução Necessária**:
1. Antes de sync full:
   ```typescript
   const policy = await TenantCostPolicyService.getTenantCostState(organizationId, siteId)
   if (policy.state === 'BLOCKED') {
     throw new Error('Tenant bloqueado por custo')
   }
   ```
2. Antes de enfileirar embeddings:
   ```typescript
   if (policy.state === 'THROTTLED' || policy.state === 'BLOCKED') {
     logger.warn('Embedding skipped due to FinOps policy', { organizationId, siteId, state: policy.state })
     return
   }
   ```

---

### **GAP 9: OBSERVABILIDADE INCOMPLETA** ⚠️

**Problema**:
- **CorrelationId não é propagado** em requests ao WordPress
- **Timings não são medidos** (ex: `wpFetchMs`, `wpUpsertMs`, `wpEmbeddingMs`)
- **Não há métricas de sync** (posts sincronizados, falhas, latência)
- **Não há alertas de sync** (ex: "sync falhou 3x seguidas")

**Impacto**:
- ⚠️ Difícil debugar problemas de sync
- ⚠️ Não há visibilidade de performance

**Solução Necessária**:
1. Gerar `correlationId` no início do sync
2. Propagá-lo em todos os logs:
   ```typescript
   logger.info('WordPress sync started', { correlationId, organizationId, siteId, wpSiteUrl })
   ```
3. Medir timings:
   ```typescript
   const timings = {
     wpFetchMs: 1234,
     upsertMs: 567,
     embeddingEnqueueMs: 89
   }
   ```
4. Salvar em nova tabela `WordPressSyncLog`:
   ```prisma
   model WordPressSyncLog {
     id             String   @id @default(cuid())
     correlationId  String
     organizationId String
     siteId         String
     wpSiteUrl      String
     syncType       String   // "full", "incremental", "webhook"
     status         String   // "success", "partial", "failed"
     itemsSynced    Int
     itemsFailed    Int
     timings        String   // JSON
     error          String?
     createdAt      DateTime @default(now())
     @@index([organizationId, siteId])
     @@index([correlationId])
   }
   ```
5. Adicionar métricas ao `/api/admin/ai/health`

---

### **GAP 10: NÃO HÁ ESTRATÉGIA DE CONFLITO** ❌

**Problema**:
- Se **Page é modificada no CMS** e **post é modificado no WP** (após última sync), **quem vence?**
- **Não há `lastModifiedAt` comparativo**
- **Não há marcação de "conflito"**

**Impacto**:
- ❌ Pode perder dados (overwrites sem aviso)
- ❌ Não há auditoria de conflitos

**Solução Necessária**:
1. Definir estratégia (FASE B):
   - **Opção 1**: Last Write Wins (quem modificou mais recente vence)
   - **Opção 2**: WP sempre vence (source-of-truth)
   - **Opção 3**: CMS sempre vence (edição local)
   - **Opção 4**: Manual resolve (flag `conflicted=true`, requer intervenção)
2. Implementar lógica de comparação:
   ```typescript
   if (wpModifiedAt > page.updatedAt) {
     // WP é mais recente, atualizar CMS
   } else if (page.updatedAt > wpModifiedAt) {
     // CMS é mais recente, atualizar WP (ou marcar conflito)
   }
   ```
3. Criar tabela de conflitos:
   ```prisma
   model WordPressSyncConflict {
     id             String   @id @default(cuid())
     organizationId String
     siteId         String
     pageId         String
     wpPostId       Int
     conflictType   String   // "both_modified", "deleted_in_wp", "deleted_in_cms"
     wpData         String   // JSON snapshot do WP
     cmsData        String   // JSON snapshot do CMS
     resolved       Boolean  @default(false)
     resolvedBy     String?
     resolvedAt     DateTime?
     createdAt      DateTime @default(now())
   }
   ```

---

### **GAP 11: NÃO HÁ ROLLBACK/RETRY SEGURO** ❌

**Problema**:
- Se sync falhar no meio (ex: 50 de 100 posts sincronizados), **não há rollback**
- Se retry, pode **duplicar** os 50 que já foram sincronizados
- **Não há "transação" de sync**

**Impacto**:
- ❌ Sync pode deixar dados inconsistentes
- ❌ Retry pode duplicar

**Solução Necessária**:
1. Usar **QueueJob** para cada lote:
   ```typescript
   // Criar 1 job por lote de 10 posts
   for (let i = 0; i < posts.length; i += 10) {
     const batch = posts.slice(i, i + 10)
     await QueueJob.create({
       type: 'wordpress_sync_posts_batch',
       data: JSON.stringify({ batch, organizationId, siteId })
     })
   }
   ```
2. Worker processa job com **idempotência** (verifica se já foi sincronizado via `wpPostId`)
3. Se falhar, retry automático (até `maxAttempts=3`)
4. DLQ para falhas permanentes

---

### **GAP 12: NÃO HÁ VALIDAÇÃO DE OWNERSHIP** ❌ (SEGURANÇA)

**Problema**:
- Endpoint `/api/wordpress/sync-all` aceita qualquer `baseUrl` sem verificar se pertence à organização
- **Possível ataque**: Usuário da org A pode sincronizar site da org B

**Impacto**:
- ❌ **VIOLAÇÃO DE ISOLAMENTO MULTI-TENANT**
- ❌ **RISCO DE SEGURANÇA CRÍTICO**

**Solução Necessária**:
1. Antes de qualquer operação:
   ```typescript
   const site = await db.site.findUnique({
     where: { id: siteId },
     include: { organization: true }
   })
   
   if (!site || site.organizationId !== currentUser.organizationId) {
     throw new Error('Unauthorized: Site does not belong to your organization')
   }
   ```
2. Usar helpers seguros (`safeQueryRaw`, `safeExecuteRaw`, `safeVectorSearch`) **sempre**
3. Adicionar `organizationId` + `siteId` em **todos** os filtros

---

## 7️⃣ RESUMO EXECUTIVO

### **✅ O QUE JÁ FUNCIONA**

| Item | Status | Observação |
|------|--------|------------|
| **Fetch de dados WP** | ✅ Completo | Posts, Pages, Media, Categories, Tags, Users |
| **Paginação** | ✅ Completo | Todas as entidades suportam paginação |
| **Proxy CORS** | ✅ Completo | `/api/wordpress/proxy` com retry/backoff |
| **Criar Posts/Pages no WP** | ✅ Completo | Direção CMS → WP |
| **Atualizar/Deletar Posts** | ✅ Completo | Direção CMS → WP |
| **Upload Media no WP** | ✅ Completo | Direção CMS → WP |
| **ACF (Pressel)** | ⚠️ Funcional | Específico para Pressel, não genérico |
| **Queue/Worker** | ✅ Completo | Atomic claim, lock, heartbeat, retry, DLQ |
| **Embeddings/RAG** | ✅ Completo | Chunks, rerank, HNSW, anti-alucinação |
| **CorrelationId** | ✅ Completo | Logs estruturados, rastreamento end-to-end |
| **FinOps** | ✅ Completo | Gestão de custo por tenant, degradação graciosa |
| **Manutenção Cron** | ✅ Completo | Cleanup, housekeeping, reindex incremental |

---

### **❌ O QUE FALTA (GAPS CRÍTICOS)**

| Gap | Impacto | Prioridade | Esforço |
|-----|---------|------------|---------|
| **GAP 1: Credenciais não multi-tenant** | 🔴 CRÍTICO | P0 | Médio |
| **GAP 2: Dados não persistidos no banco** | 🔴 CRÍTICO | P0 | Alto |
| **GAP 3: Sem mapeamento WP ID ↔ Local** | 🔴 CRÍTICO | P0 | Médio |
| **GAP 4: Sem sync incremental** | 🟡 Alto | P1 | Médio |
| **GAP 5: Webhooks não funcionam** | 🟡 Alto | P1 | Alto |
| **GAP 6: ACF não genérico** | 🟡 Alto | P1 | Médio |
| **GAP 7: Embeddings não gerados** | 🔴 CRÍTICO | P0 | Baixo |
| **GAP 8: FinOps não respeitado** | 🔴 CRÍTICO | P0 | Baixo |
| **GAP 9: Observabilidade incompleta** | 🟢 Médio | P2 | Médio |
| **GAP 10: Sem estratégia de conflito** | 🟡 Alto | P1 | Alto |
| **GAP 11: Sem rollback/retry seguro** | 🟡 Alto | P1 | Médio |
| **GAP 12: Sem validação ownership** | 🔴 CRÍTICO | P0 | Baixo |

---

### **📊 MÉTRICAS DE COMPLETUDE**

| Categoria | Completo | Incompleto | Total | % Completo |
|-----------|----------|------------|-------|------------|
| **Fetch (WP → CMS)** | 6/6 | 0/6 | 6 | 100% |
| **Persist (Banco Local)** | 0/6 | 6/6 | 6 | 0% |
| **Push (CMS → WP)** | 5/5 | 0/5 | 5 | 100% |
| **Webhooks (WP → CMS)** | 0/1 | 1/1 | 1 | 0% |
| **Mapeamento ID** | 0/1 | 1/1 | 1 | 0% |
| **Sync Incremental** | 0/1 | 1/1 | 1 | 0% |
| **Conflict Resolution** | 0/1 | 1/1 | 1 | 0% |
| **Embeddings Auto** | 0/1 | 1/1 | 1 | 0% |
| **FinOps Integration** | 0/1 | 1/1 | 1 | 0% |
| **Observabilidade** | 2/4 | 2/4 | 4 | 50% |
| **Segurança Multi-tenant** | 0/2 | 2/2 | 2 | 0% |
| **TOTAL** | **13/29** | **16/29** | **29** | **45%** |

---

### **🎯 RECOMENDAÇÕES PARA PRÓXIMAS FASES**

#### **FASE B: Arquitetura de Sincronização**
1. Definir source-of-truth (WP ou CMS?)
2. Definir estratégia de conflito
3. Definir bidirecionalidade (por tipo de conteúdo?)

#### **FASE C: Modelagem de Dados**
1. Adicionar campos WP ao modelo `Site` (credenciais, lastSyncAt)
2. Adicionar campos WP ao modelo `Page` (wpPostId, wpSiteUrl, acfFields)
3. Criar tabela `WordPressSyncMap` (opcional, se bidirecional robusto)
4. Criar tabela `WordPressSyncLog` (auditoria)
5. Criar tabela `WordPressSyncConflict` (conflitos)

#### **FASE D: Credenciais + Conexão**
1. Endpoint `POST /api/sites/{siteId}/wordpress/configure`
2. Criptografar senhas (bcrypt ou AES)
3. Validação de ownership
4. Endpoint `GET /api/wordpress/validate-site` (já existe, adaptar)

#### **FASE E: Full Sync + Jobs**
1. Endpoint `POST /api/wordpress/sync-all` (já existe, adaptar para persistir)
2. Criar jobs por lote (`wordpress_sync_posts_batch`, etc.)
3. Worker com retry/backoff
4. Idempotência (via `wpPostId`)

#### **FASE F: Incremental Sync + Webhooks**
1. Endpoint cron `GET /api/cron/wordpress/incremental-sync`
2. Webhook endpoint `POST /api/wordpress/webhook`
3. Plugin WP para enviar webhooks
4. Validação HMAC

#### **FASE G: IA (Embeddings + RAG)**
1. Acionar embeddings após upsert de Page
2. Respeitar FinOps
3. Logs + correlationId

#### **FASE H: Testes End-to-End**
1. Multi-tenant isolation
2. Idempotência (sync 2x = mesmo resultado)
3. Webhook security (HMAC)
4. RAG (conteúdo WP é recuperado)

#### **FASE I: Runbooks + Go-Live**
1. Runbook "WordPress sync falhou"
2. Checklist go-live
3. Métricas (lag, falhas, custo)

---

## ✅ FASE A CONCLUÍDA

**Próximo Passo**: Seguir para **FASE B — Arquitetura de Sincronização** para definir estratégia de source-of-truth e conflict resolution.

---

**Arquivos de Referência**:
- `lib/wordpress-api.ts`
- `lib/wordpress-sync.ts`
- `lib/wordpress-full-sync.ts`
- `app/api/wordpress/proxy/route.ts`
- `app/api/wordpress/sync-all/route.ts`
- `prisma/schema.prisma` (models: Site, Page, QueueJob, AIPluginConfig)
- `lib/embedding-service.ts`
- `lib/queue-claim.ts`
- `lib/finops/tenant-cost-policy.ts`








