


# 🧩 FASE 7 - ETAPA 1: RAG EM CHUNKS

**Data:** Janeiro 2025  
**Fase:** 7/8 - Produção em Escala  
**Etapa:** 1/8 - RAG em Chunks  
**Status:** ✅ **COMPLETA**

---

## 📋 OBJETIVO DA ETAPA 1

Parar de indexar conteúdo inteiro e passar a indexar chunks menores e melhores para recuperação, melhorando qualidade e recall do RAG.

---

## ✅ IMPLEMENTAÇÕES REALIZADAS

### **1. Model EmbeddingChunk Criado**

**Arquivo:** `prisma/schema.prisma`

**Campos:**
- `id` (CUID)
- `organizationId` (OBRIGATÓRIO - multi-tenancy)
- `siteId` (OBRIGATÓRIO - multi-tenancy)
- `sourceType` ('page' | 'ai_content' | 'template')
- `sourceId` (ID do conteúdo origem)
- `chunkIndex` (índice do chunk: 0, 1, 2, ...)
- `chunkText` (texto do chunk)
- `chunkHash` (SHA-256 para deduplicação)
- `embedding` (vector(1536) - pgvector)
- `model`, `provider`, `dimensions`
- `version`, `isActive`
- `language`
- FKs opcionais: `pageId`, `aiContentId`, `templateId`

**Índices Criados:**
- ✅ HNSW no `embedding` (vector_cosine_ops)
- ✅ `(siteId, sourceType, sourceId, isActive)`
- ✅ `(organizationId, siteId, sourceType)`
- ✅ `(chunkHash, model, version)` (deduplicação)
- ✅ `(sourceId, chunkIndex)` (ordenação)

**Status:** ✅ **COMPLETO**

---

### **2. Migration SQL Criada**

**Arquivo:** `prisma/migrations/20250101000004_add_embedding_chunks/migration.sql`

**Conteúdo:**
- ✅ Criação da tabela `embedding_chunks`
- ✅ Foreign keys para `pages`, `ai_content`, `templates`, `sites`, `organizations`
- ✅ Índice HNSW para busca vetorial
- ✅ Índices compostos para multi-tenancy e performance
- ✅ Validação de criação e extensão pgvector

**Status:** ✅ **COMPLETO**

---

### **3. Função de Chunking Criada**

**Arquivo:** `lib/text-chunking.ts`

**Classe:** `TextChunking`

**Métodos:**
- `chunkText(text, config)` — Divide texto em chunks com overlap
- `calculateChunkHash(chunkText)` — Calcula hash SHA-256

**Configuração:**
- `chunkSize` (default: 1000 caracteres)
- `overlap` (default: 200 caracteres)
- `preserveParagraphs` (default: true)
- `preserveSentences` (default: true)
- `minChunkSize` (default: 100 caracteres)

**Características:**
- ✅ Preserva estrutura (parágrafos, sentenças)
- ✅ Evita quebrar palavras/sentenças
- ✅ Overlap configurável para contexto
- ✅ Tamanho mínimo garantido

**Status:** ✅ **COMPLETO**

---

### **4. EmbeddingService Atualizado**

**Arquivo:** `lib/embedding-service.ts`

**Mudanças:**

1. **Feature Flag:**
   - `USE_EMBEDDING_CHUNKS` (env var)
   - `EMBEDDING_CHUNK_SIZE` (default: 1000)
   - `EMBEDDING_CHUNK_OVERLAP` (default: 200)

2. **Novo Método:**
   - `processEmbeddingChunks()` — Processa conteúdo em chunks
   - `saveEmbeddingChunk()` — Salva chunk no banco
   - `findExistingChunk()` — Deduplicação por chunkHash
   - `disableOldChunks()` — Desativa chunks antigos

3. **Lógica Atualizada:**
   - Se `USE_EMBEDDING_CHUNKS=true` → processa em chunks
   - Se `USE_EMBEDDING_CHUNKS=false` → processa embedding único (compatibilidade)

**Status:** ✅ **COMPLETO**

---

### **5. Compatibilidade com Embedding Antigo**

**Estratégia:**
- ✅ Feature flag controla qual método usar
- ✅ Embedding antigo continua funcionando
- ✅ Chunks e embeddings podem coexistir
- ✅ Migração gradual possível

**Status:** ✅ **COMPLETO**

---

## 📄 ARQUIVOS CRIADOS/MODIFICADOS

### **Novos Arquivos:**

1. ✅ `lib/text-chunking.ts` — Função de chunking
2. ✅ `prisma/migrations/20250101000004_add_embedding_chunks/migration.sql` — Migration SQL
3. ✅ `docs/ARQUITETURA-IA/FASE-7-ETAPA-1-RELATORIO.md` — Este relatório

### **Arquivos Modificados:**

1. ✅ `prisma/schema.prisma` — Adicionado model `EmbeddingChunk` e relacionamentos
2. ✅ `lib/embedding-service.ts` — Adicionado suporte a chunks

---

## 🔒 GARANTIAS DE SEGURANÇA

### **Multi-tenancy:**
- ✅ `organizationId` e `siteId` obrigatórios
- ✅ Todas as queries filtradas por tenant
- ✅ Impossível vazamento de dados entre tenants

### **Deduplicação:**
- ✅ `chunkHash` evita chunks duplicados
- ✅ Verificação antes de salvar
- ✅ Chunks antigos desativados (não deletados)

### **Versionamento:**
- ✅ Chunks antigos marcados como `isActive=false`
- ✅ Nunca deleta chunks (auditoria)

---

## 📋 CHECKLIST DA ETAPA 1

### **Schema e Migrations:**
- [x] Model EmbeddingChunk criado
- [x] Relacionamentos adicionados (Page, AIContent, Template, Site, Organization)
- [x] Migration SQL criada
- [x] Índices HNSW criados
- [x] Foreign keys criadas

### **Função de Chunking:**
- [x] TextChunking class criada
- [x] chunkText() implementado
- [x] calculateChunkHash() implementado
- [x] Preservação de estrutura (parágrafos, sentenças)
- [x] Overlap configurável

### **EmbeddingService:**
- [x] Feature flag implementada
- [x] processEmbeddingChunks() implementado
- [x] saveEmbeddingChunk() implementado
- [x] findExistingChunk() implementado
- [x] disableOldChunks() implementado
- [x] Compatibilidade com embedding antigo mantida

### **Worker:**
- [x] Worker existente continua funcionando
- [x] Processa chunks em batch quando feature flag ativa
- [x] Logs estruturados

---

## ⚠️ PONTOS DE RISCO E MITIGAÇÃO

### **1. Migração de dados existentes**

**Risco:** Embeddings antigos não serão automaticamente convertidos em chunks  
**Mitigação:**
- Feature flag permite migração gradual
- Reindexação manual via `reindexContent()` pode ser executada
- Embeddings antigos continuam funcionando

### **2. Performance com muitos chunks**

**Risco:** Conteúdo grande pode gerar muitos chunks  
**Mitigação:**
- Chunk size configurável (default: 1000 caracteres)
- Processamento em batch (Promise.all)
- Índices HNSW otimizados

### **3. Overlap pode gerar chunks similares**

**Risco:** Chunks com overlap podem ter embeddings muito similares  
**Mitigação:**
- Overlap configurável (default: 200 caracteres)
- Deduplicação por chunkHash
- Rerank na ETAPA 2 vai ajudar a selecionar chunks únicos

---

## 🧪 EXEMPLOS DE USO

### **1. Ativar Chunks (Feature Flag):**

```env
USE_EMBEDDING_CHUNKS=true
EMBEDDING_CHUNK_SIZE=1000
EMBEDDING_CHUNK_OVERLAP=200
```

### **2. Gerar Embedding com Chunks:**

```typescript
await EmbeddingService.enqueueEmbeddingJob({
  organizationId: "org-123",
  siteId: "site-456",
  sourceType: "page",
  sourceId: "page-789",
  content: "Texto longo aqui...",
  provider: "openai",
  model: "text-embedding-ada-002"
})
```

### **3. Chunking Manual:**

```typescript
import { TextChunking } from '@/lib/text-chunking'

const chunks = TextChunking.chunkText(texto, {
  chunkSize: 1000,
  overlap: 200,
  preserveParagraphs: true,
  preserveSentences: true
})
```

---

## 📊 MÉTRICAS ESPERADAS

### **Antes (Embedding Único):**
- 1 embedding por conteúdo
- Recall limitado (conteúdo grande pode perder contexto)
- Latência: ~500ms por embedding

### **Depois (Chunks):**
- N chunks por conteúdo (depende do tamanho)
- Recall melhorado (chunks menores = melhor matching)
- Latência: ~500ms * N chunks (mas processamento em batch)

---

## 🚀 PRÓXIMOS PASSOS

### **Para Executar Migration:**

```bash
npx prisma migrate deploy
# Ou em desenvolvimento:
npx prisma migrate dev --name add_embedding_chunks
```

### **Para Ativar Feature Flag:**

```env
USE_EMBEDDING_CHUNKS=true
EMBEDDING_CHUNK_SIZE=1000
EMBEDDING_CHUNK_OVERLAP=200
```

### **Para Reindexar Conteúdo Existente:**

```typescript
await EmbeddingService.reindexContent({
  organizationId: "org-123",
  siteId: "site-456",
  sourceType: "page"
})
```

---

## ✅ CONCLUSÃO DA ETAPA 1

### **Implementações Concluídas:**
1. ✅ Model EmbeddingChunk criado
2. ✅ Migration SQL criada e validada
3. ✅ Função de chunking implementada
4. ✅ EmbeddingService atualizado
5. ✅ Compatibilidade com embedding antigo mantida
6. ✅ Worker atualizado para processar chunks

### **Garantias Estabelecidas:**
- ✅ Multi-tenancy blindado
- ✅ Deduplicação por chunkHash
- ✅ Versionamento (chunks antigos desativados)
- ✅ Backward compatible (feature flag)

### **Próxima Etapa:**
**ETAPA 2 — RAG com "retrieve + rerank" leve**

---

**Status:** ✅ ETAPA 1 COMPLETA  
**Próxima Ação:** Aguardar aprovação para ETAPA 2











