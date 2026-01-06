-- Migration: Add AI-native tables and indexes
-- FASE 3 - ETAPAS 2-4: Novas tabelas, campos aditivos e índices
-- Data: Janeiro 2025

-- ============================================
-- ETAPA 2: CRIAR NOVAS TABELAS
-- ============================================

-- 1. Tabela Embedding (vetores de conteúdo)
CREATE TABLE IF NOT EXISTS "embeddings" (
    "id" TEXT NOT NULL,
    "pageId" TEXT,
    "aiContentId" TEXT,
    "templateId" TEXT,
    "siteId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'text-embedding-ada-002',
    "dimensions" INTEGER NOT NULL DEFAULT 1536,
    "sourceType" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- 2. Tabela AIInteraction (rastreamento de interações)
CREATE TABLE IF NOT EXISTS "ai_interactions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT,
    "userId" TEXT,
    "aiContentId" TEXT,
    "pageId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "prompt" TEXT NOT NULL,
    "promptVersion" TEXT,
    "context" TEXT DEFAULT '{}',
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION DEFAULT 0.7,
    "maxTokens" INTEGER,
    "response" TEXT,
    "finishReason" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "costUSD" DOUBLE PRECISION,
    "costBRL" DOUBLE PRECISION,
    "durationMs" INTEGER,
    "embeddingDurationMs" INTEGER,
    "aiCallDurationMs" INTEGER,
    "ragUsed" BOOLEAN NOT NULL DEFAULT false,
    "ragChunksCount" INTEGER,
    "ragSimilarityThreshold" DOUBLE PRECISION DEFAULT 0.7,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id")
);

-- 3. Tabela AIMetric (métricas agregadas)
CREATE TABLE IF NOT EXISTS "ai_metrics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "siteId" TEXT,
    "userId" TEXT,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "type" TEXT,
    "provider" TEXT,
    "model" TEXT,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "successfulRequests" INTEGER NOT NULL DEFAULT 0,
    "failedRequests" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" BIGINT NOT NULL DEFAULT 0,
    "promptTokens" BIGINT NOT NULL DEFAULT 0,
    "completionTokens" BIGINT NOT NULL DEFAULT 0,
    "totalCostUSD" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "totalCostBRL" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "avgDurationMs" INTEGER,
    "p50DurationMs" INTEGER,
    "p95DurationMs" INTEGER,
    "p99DurationMs" INTEGER,
    "ragRequestsCount" INTEGER NOT NULL DEFAULT 0,
    "avgRagChunksCount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_metrics_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ai_metric_unique_idx" UNIQUE ("organizationId", "siteId", "userId", "period", "periodStart", "type", "provider", "model")
);

-- 4. Tabela AIPrompt (versionamento de prompts)
CREATE TABLE IF NOT EXISTS "ai_prompts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "siteId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "prompt" TEXT NOT NULL,
    "variables" TEXT NOT NULL DEFAULT '[]',
    "provider" TEXT,
    "model" TEXT,
    "temperature" DOUBLE PRECISION DEFAULT 0.7,
    "maxTokens" INTEGER,
    "category" TEXT NOT NULL,
    "tags" TEXT,
    "examples" TEXT DEFAULT '[]',
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_prompts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ai_prompt_slug_version_idx" UNIQUE ("slug", "version")
);

-- ============================================
-- ETAPA 3: ADICIONAR CAMPOS ADITIVOS
-- ============================================

-- Adicionar campos em Page (se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'embeddingGeneratedAt') THEN
        ALTER TABLE "pages" ADD COLUMN "embeddingGeneratedAt" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'embeddingModel') THEN
        ALTER TABLE "pages" ADD COLUMN "embeddingModel" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'embeddingVersion') THEN
        ALTER TABLE "pages" ADD COLUMN "embeddingVersion" INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Adicionar campos em AIContent (se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_content' AND column_name = 'embeddingGeneratedAt') THEN
        ALTER TABLE "ai_content" ADD COLUMN "embeddingGeneratedAt" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_content' AND column_name = 'embeddingModel') THEN
        ALTER TABLE "ai_content" ADD COLUMN "embeddingModel" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_content' AND column_name = 'embeddingVersion') THEN
        ALTER TABLE "ai_content" ADD COLUMN "embeddingVersion" INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Adicionar campos em Template (se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'embeddingGeneratedAt') THEN
        ALTER TABLE "templates" ADD COLUMN "embeddingGeneratedAt" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'embeddingModel') THEN
        ALTER TABLE "templates" ADD COLUMN "embeddingModel" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'embeddingVersion') THEN
        ALTER TABLE "templates" ADD COLUMN "embeddingVersion" INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Adicionar campos em AIContentHistory (se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_content_history' AND column_name = 'tokensUsed') THEN
        ALTER TABLE "ai_content_history" ADD COLUMN "tokensUsed" INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_content_history' AND column_name = 'costUSD') THEN
        ALTER TABLE "ai_content_history" ADD COLUMN "costUSD" DOUBLE PRECISION;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_content_history' AND column_name = 'durationMs') THEN
        ALTER TABLE "ai_content_history" ADD COLUMN "durationMs" INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_content_history' AND column_name = 'modelUsed') THEN
        ALTER TABLE "ai_content_history" ADD COLUMN "modelUsed" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_content_history' AND column_name = 'providerUsed') THEN
        ALTER TABLE "ai_content_history" ADD COLUMN "providerUsed" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_content_history' AND column_name = 'aiInteractionId') THEN
        ALTER TABLE "ai_content_history" ADD COLUMN "aiInteractionId" TEXT;
    END IF;
END $$;

-- ============================================
-- ETAPA 4: CRIAR FOREIGN KEYS
-- ============================================

-- Foreign keys para Embedding
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_aiContentId_fkey" FOREIGN KEY ("aiContentId") REFERENCES "ai_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign keys para AIInteraction
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_aiContentId_fkey" FOREIGN KEY ("aiContentId") REFERENCES "ai_content"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign keys para AIMetric
ALTER TABLE "ai_metrics" ADD CONSTRAINT "ai_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_metrics" ADD CONSTRAINT "ai_metrics_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_metrics" ADD CONSTRAINT "ai_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign keys para AIPrompt
ALTER TABLE "ai_prompts" ADD CONSTRAINT "ai_prompts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_prompts" ADD CONSTRAINT "ai_prompts_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_prompts" ADD CONSTRAINT "ai_prompts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_prompts" ADD CONSTRAINT "ai_prompts_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign key para AIContentHistory -> AIInteraction
ALTER TABLE "ai_content_history" ADD CONSTRAINT "ai_content_history_aiInteractionId_fkey" FOREIGN KEY ("aiInteractionId") REFERENCES "ai_interactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- ETAPA 5: CRIAR ÍNDICES VETORIAIS E COMPOSTOS
-- ============================================

-- Índice HNSW para busca vetorial (CRÍTICO para performance)
-- Usar HNSW para produção (melhor performance <10ms)
CREATE INDEX IF NOT EXISTS "embeddings_embedding_hnsw_idx" 
ON "embeddings" 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Índices compostos para multi-tenancy e performance
CREATE INDEX IF NOT EXISTS "embedding_site_source_active_idx" ON "embeddings"("siteId", "sourceType", "isActive");
CREATE INDEX IF NOT EXISTS "embedding_org_source_idx" ON "embeddings"("organizationId", "sourceType");
CREATE INDEX IF NOT EXISTS "embedding_hash_model_version_idx" ON "embeddings"("contentHash", "model", "version");
CREATE INDEX IF NOT EXISTS "embedding_model_dimensions_idx" ON "embeddings"("model", "dimensions");

-- Índices para AIInteraction
CREATE INDEX IF NOT EXISTS "ai_interaction_org_type_status_idx" ON "ai_interactions"("organizationId", "type", "status");
CREATE INDEX IF NOT EXISTS "ai_interaction_site_created_idx" ON "ai_interactions"("siteId", "createdAt");
CREATE INDEX IF NOT EXISTS "ai_interaction_user_created_idx" ON "ai_interactions"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ai_interaction_provider_model_idx" ON "ai_interactions"("provider", "model");
CREATE INDEX IF NOT EXISTS "ai_interaction_created_at_idx" ON "ai_interactions"("createdAt");

-- Índices para AIMetric
CREATE INDEX IF NOT EXISTS "ai_metric_org_period_idx" ON "ai_metrics"("organizationId", "period", "periodStart");
CREATE INDEX IF NOT EXISTS "ai_metric_site_period_idx" ON "ai_metrics"("siteId", "period", "periodStart");
CREATE INDEX IF NOT EXISTS "ai_metric_period_range_idx" ON "ai_metrics"("periodStart", "periodEnd");

-- Índices para AIPrompt
CREATE INDEX IF NOT EXISTS "ai_prompt_org_site_category_idx" ON "ai_prompts"("organizationId", "siteId", "category", "isActive");
CREATE INDEX IF NOT EXISTS "ai_prompt_category_default_idx" ON "ai_prompts"("category", "isDefault");

-- ============================================
-- VALIDAÇÃO FINAL
-- ============================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('embeddings', 'ai_interactions', 'ai_metrics', 'ai_prompts');
    
    IF table_count < 4 THEN
        RAISE EXCEPTION 'Not all AI-native tables were created. Expected 4, found %', table_count;
    END IF;
END $$;

-- Verificar se extensão pgvector está instalada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE EXCEPTION 'pgvector extension is not installed. Run migration 20250101000000_enable_pgvector first.';
    END IF;
END $$;









