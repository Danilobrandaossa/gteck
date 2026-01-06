# 🧪 FASE H — Matriz E2E: WordPress Sync + IA

**Data:** Janeiro 2025  
**Objetivo:** Validar sistema completo em cenário realista e provar produção

---

## 📊 MATRIZ DE CENÁRIOS

### **GRUPO 1: WordPress Sync (Full + Incremental + Webhook + Push)**

| ID | Cenário | Descrição | Critérios de Sucesso | Prioridade |
|----|---------|-----------|---------------------|------------|
| **H1.1** | Full Sync Completo | Executar sync completo de WP → CMS (terms, media, pages, posts) | - Todos os itens sincronizados<br>- Relatório final com counts corretos<br>- `wpLastSyncAt` atualizado | P0 |
| **H1.2** | Incremental Pull (Cron) | Executar pull incremental via cron (`modified_after`) | - Apenas itens modificados sincronizados<br>- Jobs enfileirados corretamente | P0 |
| **H1.3** | Webhook WP → CMS | Receber webhook de update/delete do WordPress | - HMAC signature validada<br>- Job incremental enfileirado<br>- Anti-loop funciona | P0 |
| **H1.4** | Push CMS → WP | Enviar conteúdo do CMS para WordPress | - Conteúdo criado/atualizado no WP<br>- `wpPostId` atualizado localmente<br>- Anti-loop previne webhook de volta | P1 |
| **H1.5** | Conflito LWW | Simular conflito (WP mais recente vs local mais recente) | - `SyncConflict` registrado<br>- LWW aplicado corretamente<br>- Snapshot salvo | P0 |
| **H1.6** | Resolução de Conflito | Resolver conflito manualmente | - Status atualizado para `resolved`<br>- Nota de resolução salva | P1 |

---

### **GRUPO 2: Indexação e Embeddings**

| ID | Cenário | Descrição | Critérios de Sucesso | Prioridade |
|----|---------|-----------|---------------------|------------|
| **H2.1** | Indexação Após Sync | Após sync de post/page, chunks são criados | - Chunks criados com `isActive=true`<br>- Embeddings gerados<br>- `correlationId` propagado | P0 |
| **H2.2** | Reindex Após Update | Após update de post/page, chunks antigos inativos, novos ativos | - Chunks antigos `isActive=false`<br>- Novos chunks `isActive=true`<br>- Hash verificado (não reindexa se igual) | P0 |
| **H2.3** | Normalização WP → IA | Conteúdo HTML WordPress normalizado corretamente | - HTML removido<br>- Headings preservados<br>- ACF fields incluídos | P0 |
| **H2.4** | FinOps Bloqueia Indexação | Quando tenant THROTTLED/BLOCKED, não indexa | - Embedding job não enfileirado<br>- Skip registrado com motivo<br>- Auditoria completa | P0 |

---

### **GRUPO 3: RAG (Retrieval + Quality)**

| ID | Cenário | Descrição | Critérios de Sucesso | Prioridade |
|----|---------|-----------|---------------------|------------|
| **H3.1** | RAG Retrieve WP Content | Buscar conteúdo WordPress via RAG | - Chunks WP encontrados<br>- `sourceType` correto (`wp_post`/`wp_page`)<br>- Similarity > threshold | P0 |
| **H3.2** | RAG Rerank | Rerank aplicado corretamente | - Diversidade aplicada<br>- Top-K selecionado<br>- Métricas de rerank presentes | P0 |
| **H3.3** | Confidence Gate | Confidence gate funciona para WP | - `avgSimilarity` calculado<br>- Fallback usado se `confidence < threshold`<br>- Métricas registradas | P0 |
| **H3.4** | RAG Fallback | Quando RAG falha, fallback é usado | - Fallback response gerado<br>- `fallbackUsed=true`<br>- Auditoria registrada | P0 |
| **H3.5** | RAG Multi-tenant | RAG não vaza dados entre tenants | - Tenant A não vê conteúdo do Tenant B<br>- Filtros de `organizationId`/`siteId` aplicados | P0 |

---

### **GRUPO 4: FinOps e Degradação**

| ID | Cenário | Descrição | Critérios de Sucesso | Prioridade |
|----|---------|-----------|---------------------|------------|
| **H4.1** | FinOps NORMAL | Tenant em estado NORMAL, tudo funciona | - Embeddings gerados normalmente<br>- Model padrão usado<br>- Custo registrado | P0 |
| **H4.2** | FinOps CAUTION | Tenant em CAUTION, degradação leve | - Model mais barato usado (se configurado)<br>- `maxTokens` reduzido<br>- Auditoria registra degradação | P0 |
| **H4.3** | FinOps THROTTLED | Tenant em THROTTLED, indexação bloqueada | - Embeddings não gerados<br>- Skip registrado<br>- RAG ainda funciona (chunks existentes) | P0 |
| **H4.4** | FinOps BLOCKED | Tenant em BLOCKED, tudo bloqueado | - Embeddings não gerados<br>- RAG pode usar fallback<br>- Alertas gerados | P0 |

---

### **GRUPO 5: Observabilidade**

| ID | Cenário | Descrição | Critérios de Sucesso | Prioridade |
|----|---------|-----------|---------------------|------------|
| **H5.1** | CorrelationId End-to-End | `correlationId` propagado sync → job → embeddings → RAG | - Mesmo `correlationId` em todas as etapas<br>- Rastreável em logs/auditoria | P0 |
| **H5.2** | Spans e Timings | Timings registrados em cada etapa | - `syncDuration`, `indexingDuration`, `ragDuration`<br>- Spans criados corretamente | P1 |
| **H5.3** | Health Snapshot WP | Health snapshot inclui métricas WP | - `wpIndexing` presente<br>- Métricas corretas (lag, error rate) | P0 |
| **H5.4** | Alerts WP | Alertas de WP são gerados corretamente | - `WP_INDEX_LAG_HIGH` quando lag > 6h<br>- `WP_INDEX_ERROR_RATE_HIGH` quando erro > 10% | P0 |

---

### **GRUPO 6: Queue e Resiliência**

| ID | Cenário | Descrição | Critérios de Sucesso | Prioridade |
|----|---------|-----------|---------------------|------------|
| **H6.1** | Queue Claim/Locks | Jobs são claimados atomicamente | - Apenas 1 worker processa job<br>- Lock funciona<br>- Heartbeat mantém lock vivo | P0 |
| **H6.2** | Queue Heartbeat | Heartbeat mantém job vivo durante processamento longo | - Lock não expira durante processamento<br>- Job não é re-claimado | P0 |
| **H6.3** | Queue Recovery (Stuck) | Jobs stuck são recuperados | - Jobs com lock expirado são recuperados<br>- Re-claimados automaticamente | P0 |
| **H6.4** | Queue Retry/Backoff | Jobs falhados são retentados com backoff | - Retry com backoff exponencial<br>- DLQ após maxAttempts | P0 |

---

## 📋 CHECKLIST DE COBERTURA

### **Sync**
- [x] Full sync completo
- [x] Incremental pull (cron)
- [x] Webhook WP → CMS
- [x] Push CMS → WP
- [x] Conflitos LWW
- [x] Resolução de conflitos

### **Indexação**
- [x] Indexação após sync
- [x] Reindex após update
- [x] Normalização WP → IA
- [x] FinOps bloqueia indexação

### **RAG**
- [x] Retrieve WP content
- [x] Rerank
- [x] Confidence gate
- [x] Fallback
- [x] Multi-tenant isolation

### **FinOps**
- [x] NORMAL
- [x] CAUTION
- [x] THROTTLED
- [x] BLOCKED

### **Observabilidade**
- [x] CorrelationId end-to-end
- [x] Spans e timings
- [x] Health snapshot WP
- [x] Alerts WP

### **Queue**
- [x] Claim/locks
- [x] Heartbeat
- [x] Recovery (stuck)
- [x] Retry/backoff

---

## 🎯 MÉTRICAS A COLETAR

### **Latência**
- `syncDuration` (p50, p95)
- `indexingDuration` (p50, p95)
- `ragDuration` (p50, p95)
- `totalEndToEndDuration` (p50, p95)

### **Qualidade**
- `fallbackRate` (% de queries que usaram fallback)
- `lowConfidenceRate` (% de queries com confidence < threshold)
- `avgSimilarity` (similaridade média dos chunks recuperados)

### **Custo**
- `totalCostUSD` (custo total aproximado)
- `costPerQuery` (custo médio por query RAG)
- `costPerEmbedding` (custo médio por embedding gerado)

### **Reliability**
- `successRate` (% de operações bem-sucedidas)
- `errorRate` (% de operações com erro)
- `queueStuckCount` (quantidade de jobs stuck)

---

## ✅ CRITÉRIO DE CONCLUSÃO

**FASE H está completa** quando:
- [x] ✅ Matriz E2E definida (26 cenários)
- [x] ✅ Ambiente de teste criado (seeds, fixtures)
- [x] ✅ Todos os testes E2E implementados (7 arquivos)
- [x] ✅ Relatório final gerado (JSON + Markdown)

---

**Status:** ✅ **MATRIZ E2E DEFINIDA**






