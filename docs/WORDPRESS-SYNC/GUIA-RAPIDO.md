# ⚡ GUIA RÁPIDO — WORDPRESS SYNC INTEGRATION

**Versão:** 1.0  
**Data:** 24 de Dezembro de 2025  
**Para:** Desenvolvedores implementando os gaps

---

## 📊 STATUS ATUAL

```
Completude: 45% ████████████████░░░░░░░░░░░░░░░░
```

**O que funciona**: Fetch WP, Push WP, Infraestrutura (Queue, Embeddings, FinOps)  
**O que falta**: Persist local, Webhooks, Incremental, Embeddings auto, FinOps integration

---

## 🔴 TOP 6 GAPS CRÍTICOS (P0)

| # | Gap | Esforço | Arquivo Principal |
|---|-----|---------|-------------------|
| 12 | Validação Ownership | 1-2 dias | `lib/tenant-security.ts` (criar) |
| 1 | Credenciais Multi-tenant | 2-3 dias | `prisma/schema.prisma` (atualizar) |
| 3 | Mapeamento ID | 2-3 dias | `lib/wordpress-sync-map.ts` (criar) |
| 2 | Persistir Dados | 4-5 dias | `lib/wordpress-upsert.ts` (criar) |
| 7 | Embeddings Auto | 1 dia | `lib/wordpress-sync.ts` (atualizar) |
| 8 | FinOps Integration | 1 dia | `lib/wordpress-sync.ts` (atualizar) |

---

## 📂 ARQUIVOS EXISTENTES (REFERÊNCIA)

### **Libs WordPress**
```
lib/wordpress-api.ts          — Client REST API (fetch/push)
lib/wordpress-sync.ts         — Sincronização completa (NÃO persiste)
lib/wordpress-full-sync.ts    — Variação (duplicado)
lib/acf-sync-manager.ts       — ACF (Pressel específico)
```

### **Endpoints API**
```
app/api/wordpress/proxy/route.ts      — Proxy CORS (CORE)
app/api/wordpress/sync-all/route.ts   — Sync completo (NÃO persiste)
app/api/wordpress/create-post/route.ts — Criar post WP
app/api/wordpress/create-page/route.ts — Criar page WP
```

### **Infraestrutura (Aproveitável)**
```
lib/queue-claim.ts                    — Atomic claim, lock, heartbeat
lib/embedding-service.ts              — Pipeline embeddings
lib/finops/tenant-cost-policy.ts      — FinOps por tenant
lib/tenant-security.ts                — Helpers seguros (safeQueryRaw, etc.)
```

---

## 🚀 QUICK START — SPRINT 1 (SEGURANÇA)

### **GAP 12: Validação Ownership** (1-2 dias)

#### **1. Criar helper**
```typescript
// lib/wordpress-security.ts
export async function validateSiteOwnership(
  siteId: string, 
  organizationId: string
): Promise<void> {
  const site = await db.site.findUnique({
    where: { id: siteId },
    select: { organizationId: true }
  })
  
  if (!site || site.organizationId !== organizationId) {
    throw new UnauthorizedError('Site does not belong to organization')
  }
}
```

#### **2. Adicionar middleware**
```typescript
// app/api/wordpress/[...]/route.ts
import { validateSiteOwnership } from '@/lib/wordpress-security'

export async function POST(request: NextRequest) {
  const { siteId } = await request.json()
  const { organizationId } = await getCurrentUser(request)
  
  // VALIDAR OWNERSHIP
  await validateSiteOwnership(siteId, organizationId)
  
  // ... resto do código
}
```

#### **3. Aplicar em TODOS os endpoints**
- `/api/wordpress/sync`
- `/api/wordpress/sync-all`
- `/api/wordpress/create-post`
- `/api/wordpress/create-page`
- `/api/wordpress/validate-site`

---

### **GAP 1: Credenciais Multi-tenant** (2-3 dias)

#### **1. Atualizar Prisma schema**
```prisma
// prisma/schema.prisma
model Site {
  // ... campos existentes
  
  // WordPress Config (NOVO)
  wpBaseUrl      String?
  wpAuthType     String?  // "basic", "application_password", "jwt", "oauth"
  wpUsername     String?
  wpPasswordHash String?  // Criptografado
  wpToken        String?  // Para JWT/OAuth
  wpConfigured   Boolean  @default(false)
  wpLastSyncAt   DateTime?
}
```

#### **2. Criar migration**
```bash
npx prisma migrate dev --name add_wp_credentials_to_site
```

#### **3. Criar helpers de criptografia**
```typescript
// lib/wordpress-credentials.ts
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY // 32 chars

export function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  let encrypted = cipher.update(password, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

export function decryptPassword(hash: string): string {
  const [ivHex, encrypted] = hash.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
```

#### **4. Criar endpoint de configuração**
```typescript
// app/api/sites/[siteId]/wordpress/configure/route.ts
import { encryptPassword } from '@/lib/wordpress-credentials'

export async function POST(request: NextRequest, { params }: { params: { siteId: string } }) {
  const { siteId } = params
  const { wpBaseUrl, wpUsername, wpPassword, wpAuthType } = await request.json()
  const { organizationId } = await getCurrentUser(request)
  
  // Validar ownership
  await validateSiteOwnership(siteId, organizationId)
  
  // Criptografar senha
  const wpPasswordHash = encryptPassword(wpPassword)
  
  // Atualizar site
  await db.site.update({
    where: { id: siteId },
    data: {
      wpBaseUrl,
      wpUsername,
      wpPasswordHash,
      wpAuthType,
      wpConfigured: true
    }
  })
  
  return NextResponse.json({ success: true })
}
```

---

### **GAP 3: Mapeamento ID** (2-3 dias)

#### **1. Adicionar campos ao Prisma**
```prisma
// prisma/schema.prisma
model Page {
  // ... campos existentes
  
  // WordPress Mapping (NOVO)
  wpPostId   Int?
  wpSiteUrl  String?
  wpSyncedAt DateTime?
  acfFields  String?   @default("{}")
  
  @@unique([siteId, wpPostId])  // Garantir unicidade
}

model Category {
  // ... campos existentes
  
  // WordPress Mapping (NOVO)
  wpTermId   Int?
  wpSiteUrl  String?
  
  @@unique([siteId, wpTermId])
}

model Media {
  // ... campos existentes
  
  // WordPress Mapping (NOVO)
  wpMediaId  Int?
  wpSiteUrl  String?
  
  @@unique([siteId, wpMediaId])
}
```

#### **2. Criar migration**
```bash
npx prisma migrate dev --name add_wp_mapping_fields
```

---

## 🚀 QUICK START — SPRINT 2 (CORE SYNC)

### **GAP 2: Persistir Dados** (4-5 dias)

#### **1. Criar função de upsert**
```typescript
// lib/wordpress-upsert.ts
export async function upsertPageFromWordPress(
  wpPost: any,
  siteId: string,
  organizationId: string
): Promise<Page> {
  // Mapear campos WP → Page
  const pageData = {
    title: wpPost.title.rendered,
    slug: wpPost.slug,
    content: wpPost.content.rendered,
    excerpt: wpPost.excerpt.rendered,
    status: wpPost.status === 'publish' ? 'published' : 'draft',
    publishedAt: wpPost.status === 'publish' ? new Date(wpPost.date) : null,
    
    // WordPress mapping
    wpPostId: wpPost.id,
    wpSiteUrl: wpPost.link,
    wpSyncedAt: new Date(),
    
    // ACF fields
    acfFields: JSON.stringify(wpPost.acf || {})
  }
  
  // Buscar author local ou usar default
  const defaultAuthor = await db.user.findFirst({
    where: { organizationId, role: 'admin' }
  })
  
  // Buscar category local ou criar
  let categoryId = null
  if (wpPost.categories && wpPost.categories.length > 0) {
    // TODO: buscar ou criar categoria
  }
  
  // Upsert Page
  const page = await db.page.upsert({
    where: {
      siteId_wpPostId: {
        siteId,
        wpPostId: wpPost.id
      }
    },
    update: pageData,
    create: {
      ...pageData,
      siteId,
      authorId: defaultAuthor!.id,
      categoryId
    }
  })
  
  return page
}
```

#### **2. Atualizar wordpress-sync.ts**
```typescript
// lib/wordpress-sync.ts
import { upsertPageFromWordPress } from './wordpress-upsert'

async fetchAllPosts(): Promise<any[]> {
  const allPosts: any[] = []
  // ... código existente de fetch ...
  
  // NOVO: Persistir no banco
  for (const wpPost of allPosts) {
    await upsertPageFromWordPress(wpPost, this.siteId, this.organizationId)
  }
  
  return allPosts
}
```

---

### **GAP 7: Embeddings Auto** (1 dia)

```typescript
// lib/wordpress-upsert.ts
import { EmbeddingService } from './embedding-service'

export async function upsertPageFromWordPress(...): Promise<Page> {
  // ... upsert existente ...
  
  // NOVO: Acionar embeddings
  await EmbeddingService.enqueueEmbeddingJob({
    organizationId,
    siteId,
    sourceType: 'page',
    sourceId: page.id,
    content: page.content || '',
    provider: 'openai',
    model: 'text-embedding-3-small'
  })
  
  return page
}
```

---

### **GAP 8: FinOps Integration** (1 dia)

```typescript
// lib/wordpress-sync.ts
import { TenantCostPolicyService } from './finops/tenant-cost-policy'

async syncAllData(): Promise<SyncResult> {
  // NOVO: Verificar FinOps
  const policy = await TenantCostPolicyService.getTenantCostState(
    this.organizationId,
    this.siteId
  )
  
  if (policy.state === 'BLOCKED') {
    throw new Error('Tenant bloqueado por custo - sync cancelado')
  }
  
  if (policy.state === 'CAUTION') {
    logger.warn('Sync proceeding but tenant in CAUTION state', {
      organizationId: this.organizationId,
      siteId: this.siteId
    })
  }
  
  // ... resto do sync ...
}
```

```typescript
// lib/wordpress-upsert.ts
export async function upsertPageFromWordPress(...): Promise<Page> {
  // ... upsert existente ...
  
  // NOVO: Verificar FinOps antes de embeddings
  const policy = await TenantCostPolicyService.getTenantCostState(
    organizationId,
    siteId
  )
  
  if (policy.state === 'THROTTLED' || policy.state === 'BLOCKED') {
    logger.warn('Embedding skipped due to FinOps policy', {
      organizationId,
      siteId,
      state: policy.state
    })
  } else {
    await EmbeddingService.enqueueEmbeddingJob(...)
  }
  
  return page
}
```

---

## 🧪 TESTES OBRIGATÓRIOS

### **Multi-tenant Isolation**
```typescript
// tests/wordpress/multi-tenant.test.ts
test('user from org A cannot sync site from org B', async () => {
  const orgA = await createTestOrg()
  const orgB = await createTestOrg()
  const siteB = await createTestSite(orgB.id)
  
  const response = await fetch('/api/wordpress/sync-all', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${orgA.token}`
    },
    body: JSON.stringify({ siteId: siteB.id })
  })
  
  expect(response.status).toBe(403)
})
```

### **Idempotência**
```typescript
test('sync 2x does not duplicate pages', async () => {
  const site = await createTestSite()
  
  // Sync 1
  await syncAllData(site.id, site.organizationId)
  const count1 = await db.page.count({ where: { siteId: site.id } })
  
  // Sync 2
  await syncAllData(site.id, site.organizationId)
  const count2 = await db.page.count({ where: { siteId: site.id } })
  
  expect(count1).toBe(count2)
})
```

### **FinOps**
```typescript
test('blocked tenant cannot sync', async () => {
  const site = await createTestSite()
  
  // Bloquear tenant
  await TenantCostPolicyService.blockTenant(site.organizationId, site.id)
  
  // Tentar sync
  await expect(
    syncAllData(site.id, site.organizationId)
  ).rejects.toThrow('Tenant bloqueado')
})
```

### **RAG Integration**
```typescript
test('synced WP content is retrievable by RAG', async () => {
  const site = await createTestSite()
  
  // Sync
  await syncAllData(site.id, site.organizationId)
  
  // Aguardar embeddings (worker)
  await waitForEmbeddings()
  
  // Query RAG
  const result = await RagService.ragQuery({
    organizationId: site.organizationId,
    siteId: site.id,
    question: 'conteúdo do post WP'
  })
  
  expect(result.answer).toContain('conteúdo esperado')
  expect(result.confidence.level).toBe('HIGH')
})
```

---

## 📚 REFERÊNCIAS RÁPIDAS

### **Helpers Seguros (Já Existem)**
```typescript
import { safeQueryRaw, safeExecuteRaw } from '@/lib/tenant-security'
```

### **Observabilidade (Já Existe)**
```typescript
import { logger } from '@/lib/logger'

logger.info('WordPress sync started', {
  correlationId,
  organizationId,
  siteId,
  wpSiteUrl
})
```

### **Queue (Já Existe)**
```typescript
import { QueueClaim } from '@/lib/queue-claim'

const jobs = await QueueClaim.claimPendingJobs({
  batchSize: 10,
  workerId: 'worker-1',
  jobType: 'wordpress_sync'
})
```

### **Embeddings (Já Existe)**
```typescript
import { EmbeddingService } from '@/lib/embedding-service'

await EmbeddingService.enqueueEmbeddingJob({
  organizationId,
  siteId,
  sourceType: 'page',
  sourceId: page.id,
  content: page.content
})
```

### **FinOps (Já Existe)**
```typescript
import { TenantCostPolicyService } from '@/lib/finops/tenant-cost-policy'

const policy = await TenantCostPolicyService.getTenantCostState(
  organizationId,
  siteId
)

if (policy.state === 'BLOCKED') {
  throw new Error('Tenant bloqueado')
}
```

---

## 🐛 TROUBLESHOOTING

### **Erro: "Site does not belong to organization"**
- ✅ Verificar `siteId` e `organizationId` estão corretos
- ✅ Verificar `validateSiteOwnership()` está sendo chamado
- ✅ Verificar JWT/session contém `organizationId` correto

### **Erro: "Duplicate key violation" (wpPostId)**
- ✅ Usar `upsert` ao invés de `create`
- ✅ Verificar `@@unique([siteId, wpPostId])` no schema

### **Erro: "Embeddings não foram gerados"**
- ✅ Verificar worker está rodando
- ✅ Verificar `EmbeddingService.enqueueEmbeddingJob()` está sendo chamado
- ✅ Verificar tenant não está `THROTTLED`/`BLOCKED`
- ✅ Verificar logs: `SELECT * FROM queue_jobs WHERE type = 'embedding'`

### **Erro: "CORS block"**
- ✅ Usar `/api/wordpress/proxy` ao invés de fetch direto
- ✅ Verificar `allowedOrigins` no proxy

---

## 📞 ONDE PEDIR AJUDA

- 📖 **Documentação Completa**: `docs/WORDPRESS-SYNC/FASE-A-DIAGNOSTICO.md`
- ✅ **Checklist de Gaps**: `docs/WORDPRESS-SYNC/FASE-A-CHECKLIST-GAPS.md`
- 📊 **Resumo Executivo**: `docs/WORDPRESS-SYNC/FASE-A-RESUMO-EXECUTIVO.md`
- 📋 **Relatório Final**: `docs/WORDPRESS-SYNC/FASE-A-RELATORIO-FINAL.md`

---

**Última Atualização:** 24/12/2025  
**Versão:** 1.0  
🤖 Gerado por IA Arquiteta/Dev Sênior










