-- Migration: Add Embedding Chunks
-- FASE 7 - ETAPA 1: RAG em chunks (melhora qualidade e recall)
-- Data: Janeiro 2025

-- ============================================
-- ETAPA 1: CRIAR TABELA EMBEDDING_CHUNKS
-- ============================================

CREATE TABLE IF NOT EXISTS "embedding_chunks" (
    "id" TEXT NOT NULL,
    "pageId" TEXT,
    "aiContentId" TEXT,
    "templateId" TEXT,
    "siteId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "chunkText" TEXT NOT NULL,
    "chunkHash" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'text-embedding-ada-002',
    "dimensions" INTEGER NOT NULL DEFAULT 1536,
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "embedding_chunks_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- FOREIGN KEYS
-- ============================================

-- Foreign keys para EmbeddingChunk
ALTER TABLE "embedding_chunks" ADD CONSTRAINT "embedding_chunks_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "embedding_chunks" ADD CONSTRAINT "embedding_chunks_aiContentId_fkey" FOREIGN KEY ("aiContentId") REFERENCES "ai_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "embedding_chunks" ADD CONSTRAINT "embedding_chunks_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "embedding_chunks" ADD CONSTRAINT "embedding_chunks_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "embedding_chunks" ADD CONSTRAINT "embedding_chunks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- ÍNDICES
-- ============================================

-- Índice HNSW para busca vetorial (CRÍTICO para performance)
CREATE INDEX IF NOT EXISTS "embedding_chunks_embedding_hnsw_idx" 
ON "embedding_chunks" 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Índices compostos para multi-tenancy e performance
CREATE INDEX IF NOT EXISTS "embedding_chunk_site_source_active_idx" ON "embedding_chunks"("siteId", "sourceType", "sourceId", "isActive");
CREATE INDEX IF NOT EXISTS "embedding_chunk_org_site_source_idx" ON "embedding_chunks"("organizationId", "siteId", "sourceType");
CREATE INDEX IF NOT EXISTS "embedding_chunk_hash_model_version_idx" ON "embedding_chunks"("chunkHash", "model", "version");
CREATE INDEX IF NOT EXISTS "embedding_chunk_source_index_idx" ON "embedding_chunks"("sourceId", "chunkIndex");

-- ============================================
-- VALIDAÇÃO FINAL
-- ============================================

-- Verificar se tabela foi criada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'embedding_chunks'
    ) THEN
        RAISE EXCEPTION 'Embedding chunks table was not created';
    END IF;
END $$;

-- Verificar se extensão pgvector está instalada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE EXCEPTION 'pgvector extension is not installed. Run migration 20250101000000_enable_pgvector first.';
    END IF;
END $$;









