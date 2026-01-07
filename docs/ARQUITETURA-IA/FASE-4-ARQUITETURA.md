# 🏗️ FASE 4 - ARQUITETURA DO PIPELINE DE EMBEDDINGS

**Data:** Janeiro 2025  
**Fase:** 4/8 - Pipeline de Embeddings

---

## 📊 DIAGRAMA DE ARQUITETURA (TEXTO)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE APLICAÇÃO                          │
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │  API Endpoint    │         │  API Endpoint    │              │
│  │  /generate       │         │  /reindex        │              │
│  └────────┬─────────┘         └────────┬─────────┘              │
│           │                            │                         │
│           └────────────┬────────────────┘                         │
│                        │                                          │
│                        ▼                                          │
│              ┌──────────────────┐                                 │
│              │ EmbeddingService │                                 │
│              │                  │                                 │
│              │ • enqueueJob()   │                                 │
│              │ • reindex()      │                                 │
│              │ • processJob()   │                                 │
│              └────────┬─────────┘                                 │
│                       │                                            │
└───────────────────────┼───────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE FILA                                │
│                                                                   │
│  ┌──────────────────────────────────────────────┐               │
│  │           QueueJob (PostgreSQL)              │               │
│  │                                              │               │
│  │  • type: 'generate_embedding'               │               │
│  │  • status: 'pending' | 'processing'         │               │
│  │  • data: JSON (jobData)                      │               │
│  │  • attempts, maxAttempts                     │               │
│  └──────────────────┬───────────────────────────┘               │
│                     │                                             │
│                     ▼                                             │
│  ┌──────────────────────────────────────────────┐               │
│  │         EmbeddingWorker                       │               │
│  │                                                │               │
│  │  • Polling (5s interval)                      │               │
│  │  • Batch processing (10 jobs)                 │               │
│  │  • Concurrent (max 3)                          │               │
│  │  • Retry with backoff                         │               │
│  │  • Dead-letter queue                          │               │
│  └──────────────────┬───────────────────────────┘               │
│                     │                                             │
└─────────────────────┼─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE PROCESSAMENTO                       │
│                                                                   │
│  ┌──────────────────────────────────────────────┐               │
│  │      EmbeddingService.processEmbeddingJob()   │               │
│  │                                                │               │
│  │  1. Validar tenant context                    │               │
│  │  2. Verificar duplicata (contentHash)         │               │
│  │  3. Criar provider (OpenAI/Gemini)           │               │
│  │  4. Gerar embedding                           │               │
│  │  5. Desativar embeddings antigos              │               │
│  │  6. Salvar embedding (pgvector)               │               │
│  │  7. Atualizar source metadata                 │               │
│  │  8. Registrar auditoria                       │               │
│  └──────────────────┬───────────────────────────┘               │
│                     │                                             │
│                     ▼                                             │
│  ┌──────────────────────────────────────────────┐               │
│  │      EmbeddingProvider                        │               │
│  │                                                │               │
│  │  ┌──────────────┐    ┌──────────────┐        │               │
│  │  │ OpenAI       │    │ Gemini       │        │               │
│  │  │ Provider     │    │ Provider     │        │               │
│  │  └──────────────┘    └──────────────┘        │               │
│  │                                                │               │
│  │  • generateEmbedding()                        │               │
│  │  • calculateCost()                            │               │
│  └──────────────────────────────────────────────┘               │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE DADOS                               │
│                                                                   │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │   Embeddings     │    │  AI Interactions │                  │
│  │   (pgvector)     │    │  (Auditoria)      │                  │
│  │                  │    │                   │                  │
│  │  • embedding     │    │  • tokens         │                  │
│  │  • contentHash   │    │  • costUSD         │                  │
│  │  • version       │    │  • durationMs      │                  │
│  │  • isActive      │    │  • errorMessage    │                  │
│  └──────────────────┘    └──────────────────┘                  │
│                                                                   │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │   Pages          │    │  AIContent       │                  │
│  │   Templates      │    │                  │                  │
│  │                  │    │  • embeddingGenAt│                  │
│  │  • embeddingGenAt│    │  • embeddingModel│                  │
│  │  • embeddingModel│    │  • embeddingVer  │                  │
│  │  • embeddingVer  │    │                  │                  │
│  └──────────────────┘    └──────────────────┘                  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUXO DE DADOS

### **1. Geração de Embedding (Assíncrono)**

```
Usuário → API /generate
    ↓
EmbeddingService.enqueueEmbeddingJob()
    ↓
Validar tenant context
    ↓
Calcular contentHash
    ↓
Verificar duplicata
    ↓
Criar QueueJob (status: 'pending')
    ↓
Retornar jobId imediatamente
    ↓
[Background] EmbeddingWorker.poll()
    ↓
Buscar jobs pendentes
    ↓
EmbeddingService.processEmbeddingJob()
    ↓
Criar provider (OpenAI/Gemini)
    ↓
Gerar embedding via API
    ↓
Desativar embeddings antigos
    ↓
Salvar embedding (pgvector)
    ↓
Atualizar source metadata
    ↓
Registrar auditoria
    ↓
Marcar job como 'completed'
```

### **2. Reindexação**

```
Admin → API /reindex
    ↓
EmbeddingService.reindexContent()
    ↓
Buscar conteúdos (Pages/AIContent/Templates)
    ↓
Para cada conteúdo:
    ↓
Enfileirar job (enqueueEmbeddingJob)
    ↓
Retornar lista de jobIds
    ↓
[Background] Worker processa jobs
```

---

## 🔒 GARANTIAS DE SEGURANÇA

### **Multi-tenancy:**

```
Todas as operações:
    ↓
validateTenantContext(orgId, siteId)
    ↓
validateSiteBelongsToOrganization(siteId, orgId)
    ↓
safeQueryRaw() / safeExecuteRaw()
    ↓
Filtros obrigatórios aplicados
```

### **Isolamento de Dados:**

- ✅ Nenhuma query sem `organizationId` + `siteId`
- ✅ Impossível acessar dados de outro tenant
- ✅ Validação em múltiplas camadas

---

## ⚡ PERFORMANCE

### **Otimizações:**

1. **Processamento Assíncrono**
   - API retorna imediatamente
   - Processamento em background
   - Não bloqueia usuário

2. **Deduplicação**
   - Verifica `contentHash` antes de gerar
   - Evita custos desnecessários
   - Skip rápido se já existe

3. **Processamento em Lote**
   - Worker processa múltiplos jobs
   - Paralelismo limitado (evita sobrecarga)
   - Polling eficiente

4. **Retry Inteligente**
   - Backoff exponencial
   - Não sobrecarrega API
   - Dead-letter queue para falhas persistentes

---

## 📊 MÉTRICAS E OBSERVABILIDADE

### **Logs Estruturados:**

```json
{
  "timestamp": "2025-01-XX...",
  "level": "info",
  "service": "EmbeddingService",
  "action": "job_enqueued",
  "jobId": "...",
  "organizationId": "...",
  "siteId": "...",
  "sourceType": "page",
  "sourceId": "...",
  "contentHash": "...",
  "provider": "openai",
  "model": "text-embedding-ada-002"
}
```

### **Métricas Rastreadas:**

- ✅ Jobs enfileirados
- ✅ Jobs processados
- ✅ Jobs falhados
- ✅ Tempo de processamento
- ✅ Custos (USD)
- ✅ Tokens usados

---

## 🚀 ESCALABILIDADE

### **Preparado para:**

- ✅ Milhares de embeddings
- ✅ Múltiplos tenants simultâneos
- ✅ Alta concorrência
- ✅ Crescimento horizontal (múltiplos workers)

### **Limitações Configuráveis:**

- `batchSize`: Quantos jobs processar por vez
- `maxConcurrent`: Máximo de jobs simultâneos
- `pollInterval`: Frequência de polling
- `maxAttempts`: Tentativas antes de DLQ

---

## ✅ CONCLUSÃO

A arquitetura implementada garante:

1. **Segurança**: Multi-tenancy rigoroso
2. **Performance**: Processamento assíncrono e otimizado
3. **Escalabilidade**: Preparado para crescimento
4. **Auditoria**: Rastreamento completo
5. **Confiabilidade**: Retry e DLQ
6. **Observabilidade**: Logs estruturados

**Status:** ✅ Arquitetura completa e pronta para produção











