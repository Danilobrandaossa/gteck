# 📋 AUDITORIA TÉCNICA REVISADA — "Meta Creative Intelligence"
## Relatório Executivo: Viabilidade Técnica da Funcionalidade

**Data:** Janeiro 2025  
**Versão:** 2.0 (Revisado)  
**Status:** ⚠️ **NEEDS_ADJUSTMENTS**

---

## 📊 SUMÁRIO EXECUTIVO

### ⚠️ **VIABILIDADE TÉCNICA: ALTA COM AJUSTES NECESSÁRIOS**

A stack atual possui **~80% dos componentes necessários**. A funcionalidade é **viável**, mas requer **ajustes críticos** em autenticação, storage e arquitetura de Insights.

**Status Final:** ⚠️ **NEEDS_ADJUSTMENTS**

---

## 🔴 CORREÇÕES CRÍTICAS IDENTIFICADAS

### **1. Dois Modos de Operação (NÃO ESPECIFICADOS)**

**Problema:** O dossiê original não diferenciava dois modos distintos:

#### **(A) Top Performers de Contas Conectadas** (Marketing API / Insights)
- **Fonte:** Meta Marketing API via OAuth
- **Dados:** Criativos das contas do usuário conectadas
- **Métricas:** CTR, CPC, ROAS, CPA, Conversions (completas)
- **Evidência:** `UNKNOWN` — Nenhuma integração Meta existe

#### **(B) Pesquisa de Concorrentes** (Ads Library)
- **Fonte:** Meta Ads Library API (pública)
- **Dados:** Anúncios públicos de qualquer conta
- **Limitação:** ❌ **NÃO fornece métricas de conversão/CTR/ROAS/CPA de terceiros**
- **Métricas disponíveis:** Apenas spend público (se divulgado), data de publicação, creative assets
- **Evidência:** `UNKNOWN` — Nenhuma integração Meta existe

**Impacto:** Arquitetura e escopo da funcionalidade mudam significativamente dependendo do modo escolhido.

---

### **2. OAuth/Refresh Tokens (EVIDÊNCIA INSUFICIENTE)**

**Evidência Encontrada:**
- ✅ NextAuth.js instalado: `package.json:75` — `next-auth: ^4.24.5`
- ✅ Prisma Adapter: `package.json:37` — `@next-auth/prisma-adapter: ^1.0.7`
- ❌ **Nenhum provider OAuth configurado:** Busca em `app/api/auth/**` retornou 0 arquivos
- ❌ **Nenhuma rota OAuth:** `app/api/**/oauth/**` não existe
- ⚠️ **Autenticação atual:** Apenas email/password via `lib/auth.ts:34-118`

**Estratégia de Token:**
- **User Token vs System User Token:** `UNKNOWN` — Nenhuma evidência no código
- **Armazenamento de tokens:** `UNKNOWN` — NextAuth suporta via Prisma Adapter, mas não há evidência de uso
- **Refresh tokens:** `UNKNOWN` — Meta Ads API usa long-lived tokens (60 dias) + refresh, mas não há implementação

**Onde tokens seriam armazenados:**
- **Hipótese 1 (NextAuth):** Tabela `Account` do Prisma (via `@next-auth/prisma-adapter`)
- **Hipótese 2 (Custom):** Nova tabela `MetaAccount` com campos `accessToken`, `refreshToken`, `expiresAt`
- **Evidência:** `UNKNOWN` — Schema Prisma não tem tabela `Account` visível (pode estar em migrations não rastreadas)

**Recomendação:** Implementar provider customizado NextAuth ou tabela dedicada para tokens Meta.

---

### **3. Insights em Escala (PADRÃO EXISTENTE)**

**Evidência Encontrada:**
- ✅ **Batch/Async Job Pattern:** Existe e é robusto
  - `lib/queue-claim.ts:67-168` — Sistema de claim atômico
  - `lib/embedding-worker.ts:99-133` — Processamento em batch
  - `lib/wordpress/wordpress-sync-worker-runner.ts:87-125` — Batch processing para integrações externas
  - `lib/wordpress/wordpress-sync-worker.ts:49-303` — Exemplo de sync assíncrono com batch

**Arquitetura Recomendada:**
1. **Cache de Insights:** Criar tabela `MetaInsightCache` com TTL
2. **Async Insights:** QueueJob tipo `meta_insights_fetch` processado por worker
3. **Batch Processing:** Processar múltiplas contas/campanhas em lote
4. **Incremental Updates:** Similar ao padrão `wordpress-incremental-sync.ts:51`

**Evidência:** ✅ **PADRÃO EXISTE** — Pode reutilizar arquitetura de WordPress sync

---

### **4. Storage (EVIDÊNCIA PARCIAL)**

**Evidência Encontrada:**

#### **Armazenamento Atual:**
- ✅ **Tabela Media:** `prisma/schema.prisma:229-251` — Model Media com campo `url: String`
- ⚠️ **Storage Local:** 
  - `lib/pressel-automation-core.ts:91` — Usa `path.join(process.cwd(), 'uploads', ...)`
  - `lib/pressel-schema-mapper.ts:44` — Usa `path.join(process.cwd(), 'uploads', ...)`
  - `INVENTORY.md:156-164` — Diretório `/uploads` documentado
- ❌ **S3 não implementado:** 
  - Variáveis existem: `env.example:104-108` — `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`
  - **Nenhum código usa essas variáveis:** Busca por `@aws-sdk`, `s3`, `AWS_S3` retornou 0 resultados

#### **Upload de Arquivos:**
- `lib/wordpress-api.ts:396-424` — Upload via `/api/wordpress/proxy` (proxy para WordPress)
- `contexts/media-context.tsx:199-258` — Upload simulado (não persiste no servidor)
- `components/media/media-upload.tsx:7-317` — Componente de upload (frontend)

**Conclusão:**
- **Storage atual:** Local em `uploads/` (evidência: `lib/pressel-automation-core.ts:91`)
- **S3:** Variáveis existem, mas **não implementado** (evidência: `env.example:104-108` + busca código = 0 resultados)

**Decisão MVP:**
- **Opção 1 (Recomendada):** Armazenar apenas metadata + features extraídas (sem download de assets)
  - Pros: Mais rápido, menos storage, compliance mais simples
  - Contras: Não pode reutilizar imagens diretamente
- **Opção 2:** Armazenar asset completo (requer S3 ou storage local escalável)
  - Pros: Pode reutilizar imagens, análise offline
  - Contras: Mais complexo, custos de storage, compliance

---

### **5. App Review/Permissões Meta (RISCO DE CRONOGRAMA)**

**Permissões Necessárias:**

#### **Modo (A) - Marketing API:**
- `ads_read` — Ler anúncios e criativos
- `ads_management` — Gerenciar anúncios (se necessário)
- `business_management` — Acessar contas de negócios

#### **Modo (B) - Ads Library:**
- `ads_library` — Acesso à biblioteca pública de anúncios
- **Nota:** Ads Library pode não requerer App Review para uso básico

**Evidência no Repo:**
- ❌ **Nenhum provider NextAuth configurado:** Busca retornou 0 arquivos
- ❌ **Nenhuma rota OAuth:** `app/api/**/oauth/**` não existe
- ❌ **Nenhuma preparação:** Nenhum código relacionado a OAuth/Meta

**Risco de Cronograma:**
- 🔴 **ALTO** — App Review Meta pode levar **2-4 semanas**
- 🔴 **ALTO** — Requer demonstração de uso, privacy policy, termos de serviço
- 🟡 **MÉDIO** — Ads Library pode não requerer review (depende do uso)

**Recomendação:** Iniciar App Review **imediatamente** em paralelo ao desenvolvimento.

---

### **6. Ranking por KPI (GUARDRAILS NÃO DEFINIDOS)**

**Guardrails Mínimos Necessários:**

```typescript
interface WinnerCriteria {
  minSpend: number          // Ex: $100 USD
  minConversions: number    // Ex: 10 conversões
  minImpressions: number    // Ex: 1000 impressões
  timeWindow: {
    start: Date            // Ex: últimos 30 dias
    end: Date
  }
  kpiWeights: {
    ctr: number            // Ex: 0.3
    roas: number           // Ex: 0.4
    cpa: number            // Ex: 0.3
  }
}
```

**Onde Implementar:**
- **Service:** `lib/meta-ads-service.ts` — Método `searchTopPerformers(criteria: WinnerCriteria)`
- **Worker:** `lib/meta-insights-worker.ts` — Processar insights em batch e aplicar filtros
- **Configuração:** Tabela `MetaCreativeConfig` ou variáveis de ambiente

**Evidência:** `UNKNOWN` — Nenhuma implementação existe

**Recomendação:** Definir guardrails no MVP e tornar configurável por organização.

---

## 📋 TOP 10 RISCOS

| # | Risco | Probabilidade | Impacto | Evidência | Mitigação |
|---|-------|---------------|---------|-----------|-----------|
| 1 | **App Review Meta demora 2-4 semanas** | 🔴 Alta | 🔴 Alto | `UNKNOWN` — Nenhuma preparação | Iniciar App Review imediatamente |
| 2 | **Ads Library não fornece métricas de conversão** | 🟢 Baixa | 🔴 Alto | Documentação Meta | Usar apenas Marketing API para métricas |
| 3 | **OAuth não implementado** | 🟢 Baixa | 🔴 Alto | `app/api/auth/**` = 0 arquivos | Implementar provider NextAuth ou custom |
| 4 | **Storage S3 não configurado** | 🟡 Média | 🟡 Médio | `env.example:104-108` + busca código = 0 | MVP: metadata only, depois S3 |
| 5 | **Rate limits Meta API** | 🟡 Média | 🟡 Médio | `UNKNOWN` | Implementar cache + rate limiting |
| 6 | **Tokens expiram (60 dias)** | 🟡 Média | 🟡 Médio | `UNKNOWN` | Implementar refresh automático |
| 7 | **Custos GPT-4 Vision (análise)** | 🟢 Baixa | 🟡 Médio | `lib/ai-services.ts:23-505` existe | Cache de análises, batch processing |
| 8 | **Compliance GDPR/LGPD** | 🟡 Média | 🔴 Alto | `UNKNOWN` | Implementar retenção + exclusão automática |
| 9 | **Performance (muitos criativos)** | 🟡 Média | 🟡 Médio | `lib/queue-claim.ts:67-168` existe | Processamento assíncrono já existe |
| 10 | **Meta API muda/descontinua** | 🟢 Baixa | 🔴 Alto | `UNKNOWN` | Usar SDK oficial, versionamento |

---

## 🎯 DECISÕES ARQUITETURAIS

### **Decisão 1: Modo de Operação**
- **MVP:** Focar em **Modo (A) - Marketing API** (métricas completas)
- **Fase 2:** Adicionar **Modo (B) - Ads Library** (sem métricas)

### **Decisão 2: Storage MVP**
- **Armazenar:** Apenas metadata + features extraídas (sem download de assets)
- **Fase 2:** Adicionar S3 para assets completos

### **Decisão 3: OAuth**
- **Estratégia:** User Token (cada usuário conecta sua conta Meta)
- **Armazenamento:** Tabela `MetaAccount` customizada (mais controle)
- **Alternativa:** NextAuth provider (se quiser reutilizar infra)

### **Decisão 4: Guardrails KPI**
- **Padrão:** Min $100 spend, 10 conversões, últimos 30 dias
- **Configurável:** Por organização via `MetaCreativeConfig`

---

## 📊 COMPONENTES NECESSÁRIOS

### **Novos Arquivos:**

1. **`lib/meta-ads-service.ts`**
   - Cliente Meta Marketing API
   - Métodos: `searchTopPerformers()`, `getCreativeInsights()`, `refreshToken()`

2. **`lib/meta-ads-library-service.ts`** (Fase 2)
   - Cliente Meta Ads Library API
   - Métodos: `searchPublicAds()`, `getAdCreative()`

3. **`lib/meta-insights-worker.ts`**
   - Worker para buscar insights em batch
   - Reutiliza padrão de `wordpress-sync-worker-runner.ts:87-125`

4. **`app/api/meta/oauth/callback/route.ts`**
   - Callback OAuth Meta
   - Salvar tokens em `MetaAccount`

5. **`app/api/meta/ads/search-creatives/route.ts`**
   - Buscar criativos top performers
   - Aplicar guardrails KPI

### **Novas Tabelas:**

```prisma
model MetaAccount {
  id              String   @id @default(cuid())
  organizationId  String
  userId          String
  metaAccountId   String   // ID da conta Meta
  accessToken     String   // Criptografado
  refreshToken    String?  // Criptografado
  expiresAt       DateTime
  scopes          String   // JSON array
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization    Organization @relation(...)
  user            User @relation(...)
  creatives       MetaCreative[]
}

model MetaCreative {
  id              String   @id @default(cuid())
  organizationId  String
  metaAccountId   String
  metaAdId        String
  imageUrl        String   // URL original Meta
  imageFeatures   String   @default("{}") // JSON com features extraídas
  metadata        String   @default("{}") // JSON com performance, tema, etc.
  performance     String   @default("{}") // JSON com KPIs
  theme           String?
  createdAt       DateTime @default(now())
  expiresAt       DateTime?
  
  organization    Organization @relation(...)
  account         MetaAccount @relation(...)
  patterns        CreativePattern[]
}

model MetaInsightCache {
  id              String   @id @default(cuid())
  organizationId  String
  metaAccountId   String
  cacheKey        String   // Hash de (accountId + timeWindow + metrics)
  data            String   // JSON com insights
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  
  @@unique([organizationId, cacheKey])
  @@index([expiresAt])
}
```

---

## ✅ CONCLUSÃO

**Status Final:** ⚠️ **NEEDS_ADJUSTMENTS**

**Viabilidade:** ✅ **ALTA** (com ajustes)

**Principais Ajustes Necessários:**
1. Definir modo de operação (A ou B)
2. Implementar OAuth Meta (risco de cronograma)
3. Decidir storage MVP (metadata only vs assets)
4. Definir guardrails KPI
5. Iniciar App Review Meta (paralelo)

**Esforço Estimado:** 15-25 dias (incluindo App Review)

---

**FIM DO RELATÓRIO EXECUTIVO**





