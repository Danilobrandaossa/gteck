# ✅ CHECKLIST DE GAPS — WORDPRESS SYNC INTEGRATION

**Data:** 24 de Dezembro de 2025  
**Baseado em:** FASE-A-DIAGNOSTICO.md  
**Status Geral:** 13/29 itens completos (45%)

---

## 🔴 GAPS CRÍTICOS (P0) — **6 ITENS**

### ❌ GAP 1: CREDENCIAIS NÃO SÃO MULTI-TENANT
- [ ] Adicionar campos ao modelo `Site` no Prisma:
  - [ ] `wpBaseUrl` (String?)
  - [ ] `wpAuthType` (String?) — "basic", "application_password", "jwt", "oauth"
  - [ ] `wpUsername` (String?)
  - [ ] `wpPasswordHash` (String?) — Criptografado
  - [ ] `wpToken` (String?) — Para JWT/OAuth
  - [ ] `wpConfigured` (Boolean @default(false))
  - [ ] `wpLastSyncAt` (DateTime?)
- [ ] Criar migration Prisma
- [ ] Criar helpers de criptografia:
  - [ ] `encryptPassword(password: string): string`
  - [ ] `decryptPassword(hash: string): string`
- [ ] Criar endpoint `POST /api/sites/{siteId}/wordpress/configure`
- [ ] Adicionar validação de ownership em todos os endpoints
- [ ] Remover uso de env vars globais (`WORDPRESS_DEFAULT_*`)
- [ ] Testes:
  - [ ] Credenciais por site funcionam
  - [ ] Criptografia/decriptografia funciona
  - [ ] Ownership validation bloqueia acesso cruzado

**Impacto**: 🔴 CRÍTICO — Violação de isolamento multi-tenant  
**Esforço**: Médio (2-3 dias)  
**Prioridade**: P0 (BLOQUEIA PRODUÇÃO)

---

### ❌ GAP 2: NENHUM DADO É PERSISTIDO NO BANCO LOCAL
- [ ] Criar função `upsertPageFromWordPress(wpPost, siteId, organizationId)`
  - [ ] Mapear campos WP → campos Page (title, slug, content, excerpt, status, publishedAt)
  - [ ] Mapear `wp.id` → `page.wpPostId`
  - [ ] Mapear `wp.featured_media` → `page.featuredImage`
  - [ ] Mapear `wp.categories` → `page.categoryId` (buscar/criar local)
  - [ ] Mapear `wp.acf` → `page.acfFields` (JSON)
  - [ ] Usar `db.page.upsert()` com `where: { siteId, wpPostId }`
- [ ] Criar função `upsertCategoryFromWordPress(wpCategory, siteId, organizationId)`
  - [ ] Mapear campos WP → campos Category
  - [ ] Usar `db.category.upsert()` com `where: { siteId, slug }`
- [ ] Criar função `upsertMediaFromWordPress(wpMedia, siteId, organizationId)`
  - [ ] Mapear campos WP → campos Media
  - [ ] Usar `db.media.upsert()` com `where: { siteId, url }`
- [ ] Adicionar campo `acfFields` ao modelo `Page`:
  ```prisma
  acfFields String? @default("{}")
  ```
- [ ] Adicionar campos `wpPostId`, `wpSiteUrl`, `wpSyncedAt` ao modelo `Page`:
  ```prisma
  wpPostId   Int?
  wpSiteUrl  String?
  wpSyncedAt DateTime?
  ```
- [ ] Criar migration Prisma
- [ ] Atualizar `wordpress-sync.ts` para chamar funções de upsert após fetch
- [ ] Testes:
  - [ ] Sync 1x: cria Page/Category/Media
  - [ ] Sync 2x (idempotente): atualiza, não duplica
  - [ ] ACF fields são salvos corretamente
  - [ ] Multi-tenant: dados de org A não vazam para org B

**Impacto**: 🔴 CRÍTICO — Sync é efêmero, não há fonte de verdade local  
**Esforço**: Alto (4-5 dias)  
**Prioridade**: P0 (BLOQUEIA PRODUÇÃO)

---

### ❌ GAP 3: NÃO HÁ MAPEAMENTO WordPress ID ↔ Local ID
- [ ] **Decisão arquitetural**: Usar Opção A (campos no modelo) ou Opção B (tabela dedicada)?
  - [ ] **Opção A (Simples)**: Adicionar `wpPostId` ao modelo `Page` (já coberto no GAP 2)
  - [ ] **Opção B (Robusto)**: Criar modelo `WordPressSyncMap`
    ```prisma
    model WordPressSyncMap {
      id             String @id @default(cuid())
      organizationId String
      siteId         String
      wpEntityType   String // "post", "page", "media", "category"
      wpEntityId     Int
      wpSiteUrl      String
      localEntityType String
      localEntityId   String
      lastSyncAt     DateTime
      syncDirection  String // "wp_to_cms", "cms_to_wp", "bidirectional"
      createdAt      DateTime @default(now())
      updatedAt      DateTime @updatedAt
      @@unique([siteId, wpEntityType, wpEntityId])
    }
    ```
- [ ] Criar helpers:
  - [ ] `findLocalEntityByWpId(siteId, wpEntityType, wpEntityId)`
  - [ ] `findWpEntityByLocalId(siteId, localEntityType, localEntityId)`
  - [ ] `createOrUpdateSyncMap(...)`
- [ ] Testes:
  - [ ] Mapeamento funciona em ambas as direções
  - [ ] Multi-tenant: mapeamento não vaza entre sites

**Impacto**: 🔴 CRÍTICO — Sem mapeamento, sync não é idempotente  
**Esforço**: Médio (2-3 dias)  
**Prioridade**: P0 (BLOQUEIA PRODUÇÃO)  
**Recomendação**: Começar com **Opção A** (mais simples)

---

### ❌ GAP 7: EMBEDDINGS NÃO SÃO GERADOS APÓS SYNC WP
- [ ] Atualizar função `upsertPageFromWordPress()`:
  ```typescript
  // Após upsert de Page
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
- [ ] Verificar FinOps antes de enfileirar:
  ```typescript
  const policy = await TenantCostPolicyService.getTenantCostState(organizationId, siteId)
  if (policy.state === 'THROTTLED' || policy.state === 'BLOCKED') {
    logger.warn('Embedding skipped due to FinOps policy', { organizationId, siteId, state: policy.state })
    return
  }
  ```
- [ ] Adicionar logs estruturados com correlationId
- [ ] Testes:
  - [ ] Sync de Page gera job de embedding
  - [ ] Tenant `THROTTLED` não gera embedding
  - [ ] Tenant `BLOCKED` não gera embedding
  - [ ] RAG/Chat consegue buscar conteúdo do WordPress

**Impacto**: 🔴 CRÍTICO — RAG não funciona para conteúdo WordPress  
**Esforço**: Baixo (1 dia)  
**Prioridade**: P0 (BLOQUEIA FUNCIONALIDADE IA)

---

### ❌ GAP 8: FINOPS NÃO É RESPEITADO NO SYNC
- [ ] Adicionar verificação no início de `syncAllData()`:
  ```typescript
  const policy = await TenantCostPolicyService.getTenantCostState(organizationId, siteId)
  if (policy.state === 'BLOCKED') {
    throw new Error('Tenant bloqueado por custo - sync cancelado')
  }
  ```
- [ ] Adicionar logs de degradação:
  ```typescript
  if (policy.state === 'CAUTION') {
    logger.warn('Sync proceeding but tenant in CAUTION state', { organizationId, siteId })
  }
  ```
- [ ] Testes:
  - [ ] Tenant `BLOCKED` não consegue fazer sync
  - [ ] Tenant `THROTTLED` faz sync mas não gera embeddings
  - [ ] Logs registram estado FinOps

**Impacto**: 🔴 CRÍTICO — Pode gerar custo inesperado  
**Esforço**: Baixo (1 dia)  
**Prioridade**: P0 (BLOQUEIA PRODUÇÃO)

---

### ❌ GAP 12: NÃO HÁ VALIDAÇÃO DE OWNERSHIP (SEGURANÇA)
- [ ] Criar helper `validateSiteOwnership(siteId, organizationId)`:
  ```typescript
  const site = await db.site.findUnique({ where: { id: siteId } })
  if (!site || site.organizationId !== organizationId) {
    throw new UnauthorizedError('Site does not belong to organization')
  }
  ```
- [ ] Adicionar validação em TODOS os endpoints WordPress:
  - [ ] `/api/wordpress/sync`
  - [ ] `/api/wordpress/sync-all`
  - [ ] `/api/wordpress/create-post`
  - [ ] `/api/wordpress/create-page`
  - [ ] `/api/wordpress/validate-site`
- [ ] Criar middleware de autenticação:
  - [ ] Extrair `organizationId` de JWT/session
  - [ ] Validar contra `siteId` do payload
- [ ] Testes:
  - [ ] User da org A não consegue acessar site da org B
  - [ ] Endpoint retorna 403 Forbidden
  - [ ] Logs registram tentativa de acesso não autorizado

**Impacto**: 🔴 CRÍTICO — Violação de segurança multi-tenant  
**Esforço**: Baixo (1-2 dias)  
**Prioridade**: P0 (BLOQUEIA PRODUÇÃO)

---

## 🟡 GAPS ALTOS (P1) — **5 ITENS**

### ❌ GAP 4: NÃO HÁ SYNC INCREMENTAL
- [ ] Adicionar campo `wpLastSyncAt` ao modelo `Site` (já coberto no GAP 1)
- [ ] Criar função `syncIncrementalFromWordPress(siteId)`:
  - [ ] Buscar `site.wpLastSyncAt`
  - [ ] Usar parâmetro `modified_after` na API WP:
    ```
    /wp-json/wp/v2/posts?modified_after={wpLastSyncAt}
    ```
  - [ ] Processar apenas posts/pages modificados
  - [ ] Atualizar `site.wpLastSyncAt` ao final
- [ ] Criar endpoint cron:
  ```
  GET /api/cron/wordpress/incremental-sync
  ```
- [ ] Proteger endpoint com `ADMIN_HEALTH_SECRET`
- [ ] Configurar polling (ex: a cada 5 minutos)
- [ ] Testes:
  - [ ] Sync incremental busca apenas modificados
  - [ ] `wpLastSyncAt` é atualizado
  - [ ] Cron roda automaticamente

**Impacto**: 🟡 Alto — Sync full é lento/caro  
**Esforço**: Médio (2-3 dias)  
**Prioridade**: P1

---

### ❌ GAP 5: NÃO HÁ WEBHOOKS FUNCIONANDO
- [ ] Criar endpoint `POST /api/wordpress/webhook`
- [ ] Validar assinatura HMAC:
  ```typescript
  const signature = request.headers.get('X-WP-Signature')
  const secret = site.aiPluginConfig.webhookSecret
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex')
  if (signature !== expectedSignature) {
    throw new UnauthorizedError('Invalid webhook signature')
  }
  ```
- [ ] Processar eventos:
  - [ ] `post_created` → enfileirar job de sync
  - [ ] `post_updated` → enfileirar job de sync
  - [ ] `post_deleted` → soft delete local (ou marcar como deletado)
- [ ] Criar job `wordpress_webhook_sync`:
  ```typescript
  await QueueJob.create({
    type: 'wordpress_webhook_sync',
    data: JSON.stringify({ siteId, wpPostId, event })
  })
  ```
- [ ] Criar ou atualizar plugin WordPress para enviar webhooks
- [ ] Testes:
  - [ ] Webhook com assinatura válida é aceito
  - [ ] Webhook com assinatura inválida é rejeitado (401)
  - [ ] Job é enfileirado corretamente
  - [ ] Worker processa job e atualiza Page local

**Impacto**: 🟡 Alto — Latência de sync é alta (apenas pull)  
**Esforço**: Alto (4-5 dias)  
**Prioridade**: P1

---

### ❌ GAP 6: ACF NÃO TEM ARMAZENAMENTO GENÉRICO
- [ ] Adicionar campo `acfFields` ao modelo `Page` (já coberto no GAP 2)
- [ ] Atualizar `upsertPageFromWordPress()` para salvar ACF:
  ```typescript
  const acfFields = wpPost.acf || {}
  await db.page.upsert({
    where: { siteId, wpPostId: wpPost.id },
    update: { acfFields: JSON.stringify(acfFields) },
    create: { acfFields: JSON.stringify(acfFields), ... }
  })
  ```
- [ ] Criar helper `getACFField(page, fieldName)`:
  ```typescript
  const acf = JSON.parse(page.acfFields || '{}')
  return acf[fieldName]
  ```
- [ ] Documentar estrutura ACF esperada
- [ ] Testes:
  - [ ] ACF fields são salvos como JSON
  - [ ] `getACFField()` retorna valor correto
  - [ ] RAG consegue buscar por conteúdo de ACF (se indexado)

**Impacto**: 🟡 Alto — ACF só funciona para Pressel hoje  
**Esforço**: Médio (2-3 dias)  
**Prioridade**: P1

---

### ❌ GAP 10: NÃO HÁ ESTRATÉGIA DE CONFLITO
- [ ] **Decisão arquitetural**: Definir estratégia de conflict resolution (FASE B)
  - [ ] Opção 1: Last Write Wins (comparar timestamps)
  - [ ] Opção 2: WP sempre vence (source-of-truth)
  - [ ] Opção 3: CMS sempre vence (edição local)
  - [ ] Opção 4: Manual resolve (marcar conflito)
- [ ] Implementar lógica de comparação:
  ```typescript
  if (wpModifiedAt > page.updatedAt) {
    // WP é mais recente, atualizar CMS
  } else if (page.updatedAt > wpModifiedAt) {
    // CMS é mais recente, aplicar estratégia
  }
  ```
- [ ] Criar modelo `WordPressSyncConflict` (se Opção 4):
  ```prisma
  model WordPressSyncConflict {
    id             String @id @default(cuid())
    organizationId String
    siteId         String
    pageId         String
    wpPostId       Int
    conflictType   String // "both_modified", "deleted_in_wp", "deleted_in_cms"
    wpData         String // JSON snapshot
    cmsData        String // JSON snapshot
    resolved       Boolean @default(false)
    resolvedBy     String?
    resolvedAt     DateTime?
    createdAt      DateTime @default(now())
  }
  ```
- [ ] Criar endpoint `POST /api/wordpress/resolve-conflict/{conflictId}`
- [ ] Testes:
  - [ ] Conflito é detectado corretamente
  - [ ] Estratégia escolhida é aplicada
  - [ ] Auditoria registra resolução

**Impacto**: 🟡 Alto — Pode perder dados sem conflict resolution  
**Esforço**: Alto (4-5 dias)  
**Prioridade**: P1

---

### ❌ GAP 11: NÃO HÁ ROLLBACK/RETRY SEGURO
- [ ] Usar `QueueJob` para sync em lotes:
  ```typescript
  // Dividir posts em lotes de 10
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
  ```
- [ ] Criar worker para processar jobs de sync:
  - [ ] Usar `QueueClaim.claimPendingJobs({ jobType: 'wordpress_sync_posts_batch' })`
  - [ ] Processar lote com idempotência (via `wpPostId`)
  - [ ] Se falhar, retry automático (até `maxAttempts`)
  - [ ] DLQ para falhas permanentes
- [ ] Atualizar `EmbeddingWorker` para processar também jobs de sync WordPress
- [ ] Testes:
  - [ ] Sync em lotes funciona
  - [ ] Falha no meio não quebra sync (próximo lote continua)
  - [ ] Retry funciona corretamente
  - [ ] DLQ captura falhas permanentes

**Impacto**: 🟡 Alto — Sync pode deixar dados inconsistentes  
**Esforço**: Médio (2-3 dias)  
**Prioridade**: P1

---

## 🟢 GAPS MÉDIOS (P2) — **1 ITEM**

### ❌ GAP 9: OBSERVABILIDADE INCOMPLETA
- [ ] Propagar `correlationId` em todos os requests WordPress:
  ```typescript
  const correlationId = generateCorrelationId()
  logger.info('WordPress sync started', { correlationId, organizationId, siteId, wpSiteUrl })
  ```
- [ ] Medir timings:
  ```typescript
  const timings = {
    wpFetchMs: measureTime(() => fetchFromWordPress()),
    upsertMs: measureTime(() => upsertToDatabase()),
    embeddingEnqueueMs: measureTime(() => enqueueEmbeddings())
  }
  ```
- [ ] Criar modelo `WordPressSyncLog`:
  ```prisma
  model WordPressSyncLog {
    id             String @id @default(cuid())
    correlationId  String
    organizationId String
    siteId         String
    wpSiteUrl      String
    syncType       String // "full", "incremental", "webhook"
    status         String // "success", "partial", "failed"
    itemsSynced    Int
    itemsFailed    Int
    timings        String // JSON
    error          String?
    createdAt      DateTime @default(now())
    @@index([organizationId, siteId])
    @@index([correlationId])
  }
  ```
- [ ] Adicionar métricas ao `/api/admin/ai/health`:
  - [ ] `wordpressSyncLag` (tempo desde último sync)
  - [ ] `wordpressSyncFailRate` (% de syncs falhados)
  - [ ] `wordpressLastSyncStatus` (success/failed)
- [ ] Adicionar alertas:
  - [ ] `WORDPRESS_SYNC_FAILING` (3+ syncs falhados consecutivos)
  - [ ] `WORDPRESS_SYNC_LAG_HIGH` (último sync > 1h atrás)
- [ ] Testes:
  - [ ] `correlationId` é propagado
  - [ ] Timings são medidos corretamente
  - [ ] Logs são salvos em `WordPressSyncLog`
  - [ ] Métricas aparecem no health endpoint
  - [ ] Alertas disparam quando thresholds são atingidos

**Impacto**: 🟢 Médio — Dificulta debugging, mas não bloqueia funcionalidade  
**Esforço**: Médio (2-3 dias)  
**Prioridade**: P2

---

## 📊 RESUMO DE PROGRESSO

### Por Prioridade
- **P0 (Crítico)**: 0/6 completos (0%)
- **P1 (Alto)**: 0/5 completos (0%)
- **P2 (Médio)**: 0/1 completos (0%)
- **TOTAL**: 0/12 gaps resolvidos

### Por Esforço
- **Baixo (1-2 dias)**: 3 gaps
- **Médio (2-3 dias)**: 6 gaps
- **Alto (4-5 dias)**: 3 gaps
- **Total estimado**: 24-33 dias (~5-7 semanas com 1 dev)

### Ordem Recomendada de Execução
1. **GAP 12** (Ownership validation) — 1-2 dias — SEGURANÇA CRÍTICA
2. **GAP 1** (Credenciais multi-tenant) — 2-3 dias — FUNDAÇÃO
3. **GAP 3** (Mapeamento ID - Opção A) — 2-3 dias — FUNDAÇÃO
4. **GAP 2** (Persistir dados) — 4-5 dias — CORE SYNC
5. **GAP 7** (Embeddings) — 1 dia — IA INTEGRATION
6. **GAP 8** (FinOps) — 1 dia — COST CONTROL
7. **GAP 4** (Incremental sync) — 2-3 dias — OTIMIZAÇÃO
8. **GAP 11** (Rollback/Retry) — 2-3 dias — ROBUSTEZ
9. **GAP 6** (ACF genérico) — 2-3 dias — FEATURE
10. **GAP 10** (Conflict resolution) — 4-5 dias — BIDIRECIONAL
11. **GAP 5** (Webhooks) — 4-5 dias — REAL-TIME
12. **GAP 9** (Observabilidade) — 2-3 dias — OPS

---

## ✅ CRITÉRIO DE "FASE A COMPLETA"

**FASE A está 100% completa** quando:
- [ ] Diagnóstico documentado (✅ FEITO)
- [ ] Gaps identificados (✅ FEITO)
- [ ] Checklist criado (✅ FEITO)
- [ ] Validação humana recebida

**Próximo Passo**: Aguardar validação humana e seguir para **FASE B — Arquitetura de Sincronização**.










