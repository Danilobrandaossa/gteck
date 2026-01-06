-- Migration: Add AI Response Cache
-- FASE 6 - ETAPA 6: Cache opcional (PostgreSQL)
-- Data: Janeiro 2025

-- ============================================
-- ETAPA 6: CRIAR TABELA DE CACHE
-- ============================================

CREATE TABLE IF NOT EXISTS "ai_response_cache" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_response_cache_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- FOREIGN KEYS
-- ============================================

ALTER TABLE "ai_response_cache" ADD CONSTRAINT "ai_response_cache_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_response_cache" ADD CONSTRAINT "ai_response_cache_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- ÍNDICES
-- ============================================

-- Índice único para cacheKey por tenant
CREATE UNIQUE INDEX IF NOT EXISTS "ai_response_cache_key_tenant_idx" ON "ai_response_cache"("organizationId", "siteId", "cacheKey");

-- Índice para expiração
CREATE INDEX IF NOT EXISTS "ai_response_cache_expires_idx" ON "ai_response_cache"("expiresAt");

-- Índice para limpeza de cache antigo
CREATE INDEX IF NOT EXISTS "ai_response_cache_org_site_created_idx" ON "ai_response_cache"("organizationId", "siteId", "createdAt");

-- ============================================
-- VALIDAÇÃO FINAL
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_response_cache'
    ) THEN
        RAISE EXCEPTION 'Cache table was not created';
    END IF;
END $$;









