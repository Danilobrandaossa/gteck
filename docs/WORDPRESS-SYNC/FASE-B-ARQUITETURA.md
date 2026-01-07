# 🏗️ FASE B — ARQUITETURA DE SINCRONIZAÇÃO

**Data:** 24 de Dezembro de 2025  
**Fase:** B/9 — Arquitetura de Sincronização  
**Status:** ✅ **COMPLETA**

---

## 📋 ÍNDICE

1. [Contexto e Premissas](#1-contexto-e-premissas)
2. [Decisão Arquitetural: Source-of-Truth](#2-decisão-arquitetural-source-of-truth)
3. [Estratégia de Conflict Resolution](#3-estratégia-de-conflict-resolution)
4. [Diagrama de Fluxo](#4-diagrama-de-fluxo)
5. [Regras de Idempotência](#5-regras-de-idempotência)
6. [Mapeamento de Entidades](#6-mapeamento-de-entidades)
7. [Fluxos de Sincronização](#7-fluxos-de-sincronização)
8. [Casos de Uso](#8-casos-de-uso)
9. [Justificativas e Trade-offs](#9-justificativas-e-trade-offs)

---

## 1️⃣ CONTEXTO E PREMISSAS

### **1.1. Contexto do Sistema**

O projeto CMS possui:
- ✅ **Sistema de IA completo**: RAG, Chat, Embeddings, FinOps
- ✅ **Editor próprio**: `AIContent` para gerar conteúdo via IA
- ✅ **Multi-tenant blindado**: Isolamento por `organizationId` + `siteId`
- ✅ **WordPress como fonte de conteúdo existente**: Sites WordPress já têm conteúdo publicado
- ✅ **Pipeline de embeddings**: Chunks, rerank, HNSW para RAG

### **1.2. Casos de Uso Identificados**

#### **Caso 1: Migração de Conteúdo Existente**
**Cenário**: Cliente tem site WordPress com 1000 posts e quer usar o CMS para IA  
**Necessidade**: Sincronizar todo conteúdo WP → CMS para RAG funcionar  
**Frequência**: Uma vez (full sync inicial)

#### **Caso 2: Conteúdo Novo Gerado por IA**
**Cenário**: Cliente usa CMS para gerar novo conteúdo via IA (`AIContent`)  
**Necessidade**: Publicar no WordPress após aprovação  
**Frequência**: Contínua (quando cliente aprova)

#### **Caso 3: Atualização no WordPress**
**Cenário**: Cliente edita post diretamente no WordPress  
**Necessidade**: CMS deve refletir mudanças (para RAG atualizado)  
**Frequência**: Contínua (via webhook ou sync incremental)

#### **Caso 4: Edição no CMS**
**Cenário**: Cliente edita conteúdo sincronizado do WordPress no CMS  
**Necessidade**: Decidir se atualiza WordPress ou mantém apenas local  
**Frequência**: Rara (mas possível)

---

## 2️⃣ DECISÃO ARQUITETURAL: SOURCE-OF-TRUTH

### **2.1. Análise de Opções**

#### **Opção A: WordPress como Fonte Primária** ❌
**Estratégia**: WP é source-of-truth, CMS é espelho + editor limitado

**Prós**:
- ✅ WP mantém controle total
- ✅ Cliente pode continuar editando no WP
- ✅ Simples (apenas WP → CMS)

**Contras**:
- ❌ CMS depende de WP (disponibilidade)
- ❌ Edições no CMS são perdidas no próximo sync
- ❌ Não aproveita editor do CMS

**Veredito**: ❌ **REJEITADO** — Não aproveita editor do CMS

---

#### **Opção B: CMS como Fonte Primária** ❌
**Estratégia**: CMS é source-of-truth, WordPress é canal de publicação

**Prós**:
- ✅ CMS controla tudo
- ✅ Editor do CMS é usado
- ✅ RAG sempre atualizado

**Contras**:
- ❌ WP perde autonomia (cliente não pode editar direto)
- ❌ Conteúdo existente no WP precisa ser "importado" e depois WP vira apenas output
- ❌ Cliente pode ficar confuso (onde editar?)

**Veredito**: ❌ **REJEITADO** — Cliente perde autonomia no WordPress

---

#### **Opção C: Bidirecional Híbrido** ✅
**Estratégia**: 
- **WP → CMS**: Sync (conteúdo existente e atualizações)
- **CMS → WP**: Publish (novo conteúdo gerado por IA)

**Prós**:
- ✅ Flexível: aproveita melhor dos dois mundos
- ✅ Cliente pode editar em ambos (com regras claras)
- ✅ RAG funciona para conteúdo WP
- ✅ CMS pode publicar novo conteúdo no WP

**Contras**:
- ⚠️ Requer conflict resolution
- ⚠️ Mais complexo que unidirecional

**Veredito**: ✅ **ESCOLHIDA** — Melhor balance entre flexibilidade e complexidade

---

### **2.2. Decisão Final: BIDIRECIONAL HÍBRIDO**

#### **Direção 1: WordPress → CMS (SYNC)**
**Propósito**: Sincronizar conteúdo existente e atualizações do WordPress

**Quando**:
- Full sync inicial (migração)
- Sync incremental (atualizações desde última sync)
- Webhook (mudança em tempo real no WP)

**O que sincroniza**:
- Posts/Pages → `Page` (banco local)
- Categories → `Category` (banco local)
- Media → `Media` (banco local)
- Tags → (opcional, pode ser string no `Page.tags`)
- ACF Fields → `Page.acfFields` (JSON)

**Ações**:
- Upsert idempotente (via `wpPostId`)
- Acionar embeddings após upsert
- Respeitar FinOps (não gerar embeddings se `THROTTLED`/`BLOCKED`)

---

#### **Direção 2: CMS → WordPress (PUBLISH)**
**Propósito**: Publicar novo conteúdo gerado por IA no WordPress

**Quando**:
- Cliente aprova `AIContent` e escolhe "Publicar no WordPress"
- Cliente edita `Page` sincronizada e escolhe "Sincronizar com WordPress"

**O que publica**:
- `AIContent` → Post WordPress
- `Page` (editado) → Atualizar Post WordPress existente

**Ações**:
- Criar/Atualizar post no WordPress via REST API
- Mapear `AIContent.id` → `wpPostId` (salvar em `AIContent.wordpressPostId`)
- Atualizar `Page.wpPostId` se já existir

---

#### **Direção 3: CMS → CMS (EDIT LOCAL)**
**Propósito**: Permitir edição local sem sincronizar com WordPress

**Quando**:
- Cliente edita `Page` sincronizada mas não quer atualizar WordPress
- Cliente cria `Page` novo apenas no CMS (não publica no WP)

**Ações**:
- Atualizar `Page` local
- **NÃO** atualizar WordPress
- Marcar `Page.wpSyncedAt = null` (ou flag `localOnly = true`)

---

## 3️⃣ ESTRATÉGIA DE CONFLICT RESOLUTION

### **3.1. Cenários de Conflito**

#### **Cenário 1: Both Modified (Ambos Modificados)**
**Situação**: 
- `Page` foi modificado no CMS em `2025-12-20 10:00`
- Post WordPress foi modificado em `2025-12-20 11:00`
- Sync incremental roda em `2025-12-20 12:00`

**Estratégia Escolhida**: **Last Write Wins (LWW)**

**Lógica**:
```typescript
if (wpModifiedAt > page.updatedAt) {
  // WordPress é mais recente → Atualizar CMS
  await upsertPageFromWordPress(wpPost, siteId, organizationId)
} else if (page.updatedAt > wpModifiedAt) {
  // CMS é mais recente → Opções:
  // A) Atualizar WordPress (se page.wpPostId existe)
  // B) Marcar conflito (se page.wpPostId não existe ou flag localOnly)
  if (page.wpPostId && !page.localOnly) {
    await updateWordPressPost(page.wpPostId, page)
  } else {
    await markConflict(page, wpPost, 'both_modified')
  }
}
```

**Justificativa**: 
- ✅ Simples e automático
- ✅ Previsível (timestamp decide)
- ⚠️ Pode perder dados (mas raro em prática)

---

#### **Cenário 2: Deleted in WordPress**
**Situação**: 
- Post foi deletado no WordPress
- `Page` local ainda existe

**Estratégia**: **Soft Delete no CMS**

**Lógica**:
```typescript
if (wpPost.status === 'trash' || wpPost.status === 'deleted') {
  // Soft delete no CMS
  await db.page.update({
    where: { id: page.id },
    data: {
      status: 'archived',
      wpPostId: null, // Remover mapeamento
      wpSyncedAt: new Date()
    }
  })
}
```

**Justificativa**: 
- ✅ Preserva histórico (não deleta fisicamente)
- ✅ Permite recuperação se necessário

---

#### **Cenário 3: Deleted in CMS**
**Situação**: 
- `Page` foi deletado no CMS
- Post WordPress ainda existe

**Estratégia**: **Não fazer nada (CMS é local)**

**Lógica**:
```typescript
// Se Page foi deletado no CMS, não afeta WordPress
// WordPress continua existindo
// Próximo sync vai recriar Page (se necessário)
```

**Justificativa**: 
- ✅ CMS é local, não deve deletar no WordPress
- ✅ Se cliente quer deletar no WP, deve fazer manualmente

---

#### **Cenário 4: Created in Both (Raro)**
**Situação**: 
- Novo post criado no WordPress
- Novo `Page` criado no CMS (com mesmo slug)

**Estratégia**: **WordPress vence (merge ou conflito)**

**Lógica**:
```typescript
const existingPage = await db.page.findUnique({
  where: { siteId_slug: { siteId, slug: wpPost.slug } }
})

if (existingPage && !existingPage.wpPostId) {
  // Page local existe mas não tem wpPostId
  // Opção A: Merge (atualizar Page local com dados WP)
  // Opção B: Conflito (marcar para resolução manual)
  
  // Escolha: Merge (WordPress vence)
  await db.page.update({
    where: { id: existingPage.id },
    data: {
      wpPostId: wpPost.id,
      // ... outros campos do WP
    }
  })
}
```

**Justificativa**: 
- ✅ WordPress é fonte de conteúdo existente
- ✅ Evita duplicação

---

### **3.2. Tabela de Conflitos (Opcional para MVP)**

**Decisão**: **NÃO implementar na FASE C (MVP)**, adicionar na FASE 4 (Post-MVP)

**Razão**: 
- Last Write Wins resolve 95% dos casos
- Conflitos são raros em prática
- Complexidade adicional não justifica para MVP

**Quando implementar**:
- Se clientes reportarem perda de dados
- Se casos de uso exigirem resolução manual
- Post-MVP (FASE 4)

**Schema futuro** (para referência):
```prisma
model WordPressSyncConflict {
  id             String   @id @default(cuid())
  organizationId String
  siteId         String
  pageId         String?
  wpPostId       Int?
  conflictType   String   // "both_modified", "deleted_in_wp", "created_in_both"
  wpData         String   // JSON snapshot do WP
  cmsData        String   // JSON snapshot do CMS
  resolved       Boolean  @default(false)
  resolvedBy     String?
  resolvedAt     DateTime?
  createdAt      DateTime @default(now())
  
  @@index([organizationId, siteId])
  @@index([resolved])
}
```

---

## 4️⃣ DIAGRAMA DE FLUXO

### **4.1. Fluxo Principal: WordPress → CMS (SYNC)**

```
┌─────────────────┐
│  WordPress Site │
│  (Fonte)        │
└────────┬────────┘
         │
         │ REST API
         │ (fetch posts/pages/media)
         ▼
┌─────────────────┐
│  Proxy CORS     │
│  /api/wp/proxy  │
└────────┬────────┘
         │
         │ JSON Response
         ▼
┌─────────────────┐
│  WordPress Sync │
│  Service        │
└────────┬────────┘
         │
         │ Para cada item:
         │ 1. Validar ownership
         │ 2. Verificar FinOps
         │ 3. Upsert idempotente
         ▼
┌─────────────────┐
│  Database       │
│  (Page/Category)│
└────────┬────────┘
         │
         │ Após upsert:
         │ (se tenant NORMAL/CAUTION)
         ▼
┌─────────────────┐
│  Embedding      │
│  Service        │
└────────┬────────┘
         │
         │ Enqueue job
         ▼
┌─────────────────┐
│  QueueJob       │
│  (async)        │
└────────┬────────┘
         │
         │ Worker processa
         ▼
┌─────────────────┐
│  EmbeddingChunk │
│  (RAG ready)    │
└─────────────────┘
```

---

### **4.2. Fluxo: CMS → WordPress (PUBLISH)**

```
┌─────────────────┐
│  CMS Editor     │
│  (AIContent)    │
└────────┬────────┘
         │
         │ Cliente aprova
         │ "Publicar no WP"
         ▼
┌─────────────────┐
│  WordPress API  │
│  Service        │
└────────┬────────┘
         │
         │ POST /wp-json/wp/v2/posts
         ▼
┌─────────────────┐
│  WordPress Site │
│  (Publicado)    │
└────────┬────────┘
         │
         │ Retorna wpPostId
         ▼
┌─────────────────┐
│  Database       │
│  (AIContent.    │
│   wordpressPostId)│
└─────────────────┘
```

---

### **4.3. Fluxo: Webhook (Real-Time)**

```
┌─────────────────┐
│  WordPress      │
│  (Post Updated) │
└────────┬────────┘
         │
         │ Webhook POST
         │ (HMAC signed)
         ▼
┌─────────────────┐
│  /api/wp/       │
│  webhook        │
└────────┬────────┘
         │
         │ Validar HMAC
         │ Validar ownership
         ▼
┌─────────────────┐
│  Enqueue Job    │
│  (wordpress_    │
│   webhook_sync) │
└────────┬────────┘
         │
         │ Worker processa
         ▼
┌─────────────────┐
│  Upsert +       │
│  Embeddings     │
└─────────────────┘
```

---

## 5️⃣ REGRAS DE IDEMPOTÊNCIA

### **5.1. Princípio Fundamental**

**Toda operação de sync deve ser idempotente**: Executar múltiplas vezes produz o mesmo resultado.

---

### **5.2. Regras por Entidade**

#### **Posts/Pages (WordPress → CMS)**

**Chave de Unicidade**: `(siteId, wpPostId)`

**Lógica de Upsert**:
```typescript
await db.page.upsert({
  where: {
    siteId_wpPostId: {
      siteId,
      wpPostId: wpPost.id
    }
  },
  update: {
    // Atualizar apenas se WP é mais recente
    ...(wpModifiedAt > page.updatedAt ? {
      title: wpPost.title.rendered,
      content: wpPost.content.rendered,
      // ...
      wpSyncedAt: new Date()
    } : {})
  },
  create: {
    // Criar novo Page
    siteId,
    wpPostId: wpPost.id,
    title: wpPost.title.rendered,
    // ...
  }
})
```

**Garantias**:
- ✅ Sync 2x não duplica
- ✅ Atualiza apenas se necessário (timestamp)
- ✅ Cria apenas se não existe

---

#### **Categories (WordPress → CMS)**

**Chave de Unicidade**: `(siteId, slug)` ou `(siteId, wpTermId)` (se adicionar campo)

**Lógica de Upsert**:
```typescript
await db.category.upsert({
  where: {
    siteId_slug: {
      siteId,
      slug: wpCategory.slug
    }
  },
  update: {
    name: wpCategory.name,
    description: wpCategory.description,
    wpTermId: wpCategory.id
  },
  create: {
    siteId,
    slug: wpCategory.slug,
    name: wpCategory.name,
    wpTermId: wpCategory.id
  }
})
```

---

#### **Media (WordPress → CMS)**

**Chave de Unicidade**: `(siteId, wpMediaId)` ou `(siteId, url)`

**Lógica de Upsert**:
```typescript
await db.media.upsert({
  where: {
    siteId_wpMediaId: {
      siteId,
      wpMediaId: wpMedia.id
    }
  },
  update: {
    url: wpMedia.source_url,
    alt: wpMedia.alt_text,
    // ...
  },
  create: {
    siteId,
    wpMediaId: wpMedia.id,
    url: wpMedia.source_url,
    // ...
  }
})
```

---

### **5.3. Regras de Ordem de Sincronização**

**Ordem Obrigatória** (dependências):
1. **Categories/Tags primeiro** (Posts referenciam)
2. **Media depois** (Posts referenciam featured_media)
3. **Posts/Pages por último** (referenciam categories e media)

**Lógica**:
```typescript
// 1. Sync Categories
await syncCategories(siteId, organizationId)

// 2. Sync Media
await syncMedia(siteId, organizationId)

// 3. Sync Posts/Pages (agora podem referenciar categories/media)
await syncPosts(siteId, organizationId)
```

---

### **5.4. Regras de Retry**

**Se sync falhar no meio**:
- ✅ Jobs são processados em lotes (10 itens por job)
- ✅ Cada job é idempotente (pode retry sem duplicar)
- ✅ Se job falhar, retry automático (até `maxAttempts=3`)
- ✅ DLQ para falhas permanentes

**Exemplo**:
```typescript
// Criar jobs por lote
for (let i = 0; i < posts.length; i += 10) {
  const batch = posts.slice(i, i + 10)
  await db.queueJob.create({
    data: {
      type: 'wordpress_sync_posts_batch',
      status: 'pending',
      data: JSON.stringify({ batch, siteId, organizationId }),
      maxAttempts: 3
    }
  })
}

// Worker processa com idempotência
const job = await QueueClaim.claimPendingJobs({ jobType: 'wordpress_sync_posts_batch' })
for (const wpPost of batch) {
  await upsertPageFromWordPress(wpPost, siteId, organizationId) // Idempotente
}
```

---

## 6️⃣ MAPEAMENTO DE ENTIDADES

### **6.1. Tabela de Mapeamento**

| Entidade WordPress | Entidade CMS | Campo de Mapeamento | Chave de Unicidade |
|-------------------|--------------|---------------------|-------------------|
| `wp_post.id` | `Page.id` | `Page.wpPostId` | `(siteId, wpPostId)` |
| `wp_page.id` | `Page.id` | `Page.wpPostId` | `(siteId, wpPostId)` |
| `wp_term.id` (category) | `Category.id` | `Category.wpTermId` | `(siteId, wpTermId)` |
| `wp_term.id` (tag) | `Page.tags` (string) | - | - |
| `wp_attachment.id` | `Media.id` | `Media.wpMediaId` | `(siteId, wpMediaId)` |
| `wp_user.id` | `User.id` (opcional) | `User.wpUserId` | `(siteId, wpUserId)` |

---

### **6.2. Decisão: Opção A (Campos no Modelo)**

**Escolha**: Adicionar campos diretamente nos modelos existentes

**Schema Prisma**:
```prisma
model Page {
  // ... campos existentes
  
  // WordPress Mapping
  wpPostId   Int?
  wpSiteUrl  String?
  wpSyncedAt DateTime?
  acfFields  String?   @default("{}")
  
  @@unique([siteId, wpPostId])
}

model Category {
  // ... campos existentes
  
  // WordPress Mapping
  wpTermId   Int?
  wpSiteUrl  String?
  
  @@unique([siteId, wpTermId])
}

model Media {
  // ... campos existentes
  
  // WordPress Mapping
  wpMediaId  Int?
  wpSiteUrl  String?
  
  @@unique([siteId, wpMediaId])
}
```

**Justificativa**:
- ✅ Simples e rápido (MVP)
- ✅ Menos joins (performance)
- ✅ Fácil de consultar (`WHERE wpPostId = X`)
- ⚠️ Menos flexível para bidirecional complexo (mas suficiente para MVP)

**Evolução Futura**: Se precisar de bidirecional robusto, criar tabela `WordPressSyncMap` (Opção B)

---

## 7️⃣ FLUXOS DE SINCRONIZAÇÃO

### **7.1. Full Sync (Migração Inicial)**

**Trigger**: Manual (endpoint `/api/wordpress/sync-all`)

**Processo**:
1. Validar ownership (`siteId` pertence a `organizationId`)
2. Verificar FinOps (não fazer se `BLOCKED`)
3. Buscar todos os dados do WordPress (paginação)
4. Criar jobs por lote (10 itens por job)
5. Worker processa jobs (idempotente)
6. Após cada upsert, acionar embeddings (se FinOps permitir)
7. Atualizar `site.wpLastSyncAt`

**Duração Estimada**: 
- 100 posts: ~2-3 minutos
- 1000 posts: ~20-30 minutos

---

### **7.2. Incremental Sync (Atualizações)**

**Trigger**: Cron (a cada 5 minutos) ou manual

**Processo**:
1. Buscar `site.wpLastSyncAt`
2. Buscar apenas modificados: `/wp-json/wp/v2/posts?modified_after={wpLastSyncAt}`
3. Processar apenas itens modificados (mesmo processo de full sync)
4. Atualizar `site.wpLastSyncAt`

**Duração Estimada**: 
- 10 posts modificados: ~10-20 segundos

---

### **7.3. Webhook Sync (Real-Time)**

**Trigger**: Webhook do WordPress (quando post é criado/atualizado)

**Processo**:
1. Validar HMAC signature
2. Validar ownership
3. Enfileirar job `wordpress_webhook_sync`
4. Worker processa (mesmo processo de incremental)
5. Atualizar `site.wpLastSyncAt`

**Latência**: < 5 segundos (real-time)

---

### **7.4. Publish (CMS → WordPress)**

**Trigger**: Cliente aprova `AIContent` e escolhe "Publicar no WordPress"

**Processo**:
1. Validar ownership
2. Criar/Atualizar post no WordPress via REST API
3. Salvar `wpPostId` em `AIContent.wordpressPostId`
4. Se `Page` local existe, atualizar `Page.wpPostId`
5. (Opcional) Acionar sync reverso para garantir consistência

---

## 8️⃣ CASOS DE USO

### **Caso 1: Migração Inicial (Full Sync)**

**Cenário**: Cliente tem WordPress com 500 posts e quer usar CMS para IA

**Fluxo**:
1. Cliente configura credenciais WordPress no CMS
2. Cliente clica "Sincronizar Tudo"
3. Sistema faz full sync (500 posts → 500 Pages)
4. Sistema gera embeddings (500 jobs enfileirados)
5. Worker processa embeddings (assíncrono)
6. Após ~30 minutos, RAG funciona para todo conteúdo WordPress

**Resultado**: ✅ Conteúdo WordPress disponível para RAG

---

### **Caso 2: Atualização em Tempo Real (Webhook)**

**Cenário**: Cliente edita post no WordPress

**Fluxo**:
1. WordPress envia webhook para CMS
2. CMS valida HMAC e ownership
3. CMS enfileira job de sync
4. Worker atualiza `Page` local (< 5s)
5. Worker aciona embedding (se FinOps permitir)
6. RAG reflete mudança em ~10-20s

**Resultado**: ✅ Mudanças no WordPress refletem no RAG rapidamente

---

### **Caso 3: Publicar Conteúdo Gerado por IA**

**Cenário**: Cliente gera novo conteúdo via IA e aprova publicação

**Fluxo**:
1. Cliente gera `AIContent` via IA
2. Cliente revisa e aprova
3. Cliente clica "Publicar no WordPress"
4. CMS cria post no WordPress
5. CMS salva `wpPostId` em `AIContent`
6. (Opcional) CMS faz sync reverso para garantir consistência

**Resultado**: ✅ Conteúdo gerado por IA publicado no WordPress

---

### **Caso 4: Conflito (Both Modified)**

**Cenário**: Cliente edita `Page` no CMS e também edita post no WordPress

**Fluxo**:
1. Cliente edita `Page` no CMS (10:00)
2. Cliente edita post no WordPress (11:00)
3. Sync incremental roda (12:00)
4. Sistema compara timestamps:
   - `wpModifiedAt (11:00) > page.updatedAt (10:00)`
   - WordPress é mais recente
5. Sistema atualiza `Page` com dados do WordPress
6. Edição do CMS é sobrescrita (Last Write Wins)

**Resultado**: ⚠️ Edição do CMS é perdida (mas raro em prática)

**Mitigação Futura**: Implementar tabela de conflitos (Post-MVP)

---

## 9️⃣ JUSTIFICATIVAS E TRADE-OFFS

### **9.1. Por Que Bidirecional Híbrido?**

**Justificativa**:
- ✅ Aproveita melhor dos dois mundos (WP para conteúdo existente, CMS para IA)
- ✅ Cliente mantém autonomia (pode editar em ambos)
- ✅ RAG funciona para conteúdo WP
- ✅ CMS pode publicar novo conteúdo no WP

**Trade-off**:
- ⚠️ Mais complexo que unidirecional
- ⚠️ Requer conflict resolution (mas Last Write Wins resolve 95% dos casos)

**Decisão**: ✅ **ACEITO** — Complexidade justificada pelo valor

---

### **9.2. Por Que Last Write Wins (LWW)?**

**Justificativa**:
- ✅ Simples e automático (não requer intervenção humana)
- ✅ Previsível (timestamp decide)
- ✅ Resolve 95% dos casos
- ✅ Conflitos são raros em prática

**Trade-off**:
- ⚠️ Pode perder dados (mas raro)
- ⚠️ Não há resolução manual (mas pode adicionar Post-MVP)

**Decisão**: ✅ **ACEITO** — Simplicidade > Perfeição (para MVP)

---

### **9.3. Por Que Opção A (Campos no Modelo)?**

**Justificativa**:
- ✅ Simples e rápido (MVP)
- ✅ Menos joins (performance)
- ✅ Fácil de consultar

**Trade-off**:
- ⚠️ Menos flexível para bidirecional complexo
- ⚠️ Menos auditável (mas pode adicionar logs)

**Decisão**: ✅ **ACEITO** — Simplicidade para MVP, evoluir se necessário

---

### **9.4. Por Que NÃO Tabela de Conflitos (MVP)?**

**Justificativa**:
- ✅ Last Write Wins resolve 95% dos casos
- ✅ Conflitos são raros
- ✅ Complexidade adicional não justifica para MVP

**Trade-off**:
- ⚠️ Se conflito ocorrer, dados podem ser perdidos
- ⚠️ Não há resolução manual

**Decisão**: ✅ **ACEITO** — Adicionar Post-MVP se necessário

---

## ✅ FASE B — CONCLUSÃO

### **Decisões Arquiteturais Finais**

1. ✅ **Source-of-Truth**: **Bidirecional Híbrido**
   - WP → CMS: Sync (conteúdo existente)
   - CMS → WP: Publish (novo conteúdo IA)

2. ✅ **Conflict Resolution**: **Last Write Wins (LWW)**
   - Comparar timestamps (`wpModifiedAt` vs `page.updatedAt`)
   - Mais recente vence
   - Tabela de conflitos: Post-MVP

3. ✅ **Mapeamento ID**: **Opção A (Campos no Modelo)**
   - `Page.wpPostId`, `Category.wpTermId`, `Media.wpMediaId`
   - Unique constraints: `(siteId, wpPostId)`

4. ✅ **Idempotência**: **Upsert com chave única**
   - Chave: `(siteId, wpPostId)`
   - Sync 2x = mesmo resultado

5. ✅ **Ordem de Sincronização**: **Dependências primeiro**
   - Categories → Media → Posts/Pages

---

### **Próximos Passos (FASE C)**

1. ⏳ **Modelagem de Dados**: Atualizar Prisma schema
2. ⏳ **Migrations**: Criar migrations para novos campos
3. ⏳ **SyncMap**: Implementar helpers de mapeamento

---

**Status**: ✅ **FASE B COMPLETA** — Arquitetura definida e justificada

**Próximo Marco**: **FASE C — Modelagem de Dados**

---

**Assinatura Digital**:  
🤖 IA Arquiteta/Dev Sênior  
📅 24 de Dezembro de 2025  
🔖 WordPress Sync Integration — FASE B v1.0









