-- Migration: Add WordPress Sync Fields
-- FASE C - Modelagem de Dados (WordPress Sync Integration)
-- Data: 24 de Dezembro de 2025

-- ============================================
-- ETAPA 1: ADICIONAR CAMPOS WORDPRESS EM SITE
-- ============================================

-- Adicionar campos WordPress ao modelo Site
ALTER TABLE "sites" 
ADD COLUMN IF NOT EXISTS "wpBaseUrl" TEXT,
ADD COLUMN IF NOT EXISTS "wpAuthType" TEXT,
ADD COLUMN IF NOT EXISTS "wpUsername" TEXT,
ADD COLUMN IF NOT EXISTS "wpPasswordHash" TEXT,
ADD COLUMN IF NOT EXISTS "wpToken" TEXT,
ADD COLUMN IF NOT EXISTS "wpConfigured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "wpLastSyncAt" TIMESTAMP(3);

-- ============================================
-- ETAPA 2: ADICIONAR CAMPOS WORDPRESS EM PAGE
-- ============================================

-- Adicionar campos WordPress ao modelo Page
ALTER TABLE "pages" 
ADD COLUMN IF NOT EXISTS "wpPostId" INTEGER,
ADD COLUMN IF NOT EXISTS "wpSiteUrl" TEXT,
ADD COLUMN IF NOT EXISTS "wpSyncedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "acfFields" TEXT NOT NULL DEFAULT '{}';

-- Criar índice único para (siteId, wpPostId) se não existir
CREATE UNIQUE INDEX IF NOT EXISTS "pages_site_wp_post_unique" 
ON "pages"("siteId", "wpPostId") 
WHERE "wpPostId" IS NOT NULL;

-- ============================================
-- ETAPA 3: ADICIONAR CAMPOS WORDPRESS EM CATEGORY
-- ============================================

-- Adicionar campos WordPress ao modelo Category
ALTER TABLE "categories" 
ADD COLUMN IF NOT EXISTS "wpTermId" INTEGER,
ADD COLUMN IF NOT EXISTS "wpSiteUrl" TEXT;

-- Criar índice único para (siteId, wpTermId) se não existir
CREATE UNIQUE INDEX IF NOT EXISTS "categories_site_wp_term_unique" 
ON "categories"("siteId", "wpTermId") 
WHERE "wpTermId" IS NOT NULL;

-- ============================================
-- ETAPA 4: ADICIONAR CAMPOS WORDPRESS EM MEDIA
-- ============================================

-- Adicionar campos WordPress ao modelo Media
ALTER TABLE "media" 
ADD COLUMN IF NOT EXISTS "wpMediaId" INTEGER,
ADD COLUMN IF NOT EXISTS "wpSiteUrl" TEXT;

-- Criar índice único para (siteId, wpMediaId) se não existir
CREATE UNIQUE INDEX IF NOT EXISTS "media_site_wp_media_unique" 
ON "media"("siteId", "wpMediaId") 
WHERE "wpMediaId" IS NOT NULL;

-- ============================================
-- ETAPA 5: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para queries de sincronização
CREATE INDEX IF NOT EXISTS "sites_wp_configured_idx" ON "sites"("wpConfigured") WHERE "wpConfigured" = true;
CREATE INDEX IF NOT EXISTS "sites_wp_last_sync_at_idx" ON "sites"("wpLastSyncAt");

CREATE INDEX IF NOT EXISTS "pages_wp_post_id_idx" ON "pages"("wpPostId") WHERE "wpPostId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "pages_wp_synced_at_idx" ON "pages"("wpSyncedAt");

CREATE INDEX IF NOT EXISTS "categories_wp_term_id_idx" ON "categories"("wpTermId") WHERE "wpTermId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "media_wp_media_id_idx" ON "media"("wpMediaId") WHERE "wpMediaId" IS NOT NULL;

-- ============================================
-- ETAPA 6: VALIDAÇÃO FINAL
-- ============================================

-- Verificar se campos foram adicionados em sites
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sites' 
        AND column_name = 'wpBaseUrl'
    ) THEN
        RAISE EXCEPTION 'wpBaseUrl column was not added to sites table';
    END IF;
END $$;

-- Verificar se campos foram adicionados em pages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pages' 
        AND column_name = 'wpPostId'
    ) THEN
        RAISE EXCEPTION 'wpPostId column was not added to pages table';
    END IF;
END $$;

-- Verificar se campos foram adicionados em categories
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'categories' 
        AND column_name = 'wpTermId'
    ) THEN
        RAISE EXCEPTION 'wpTermId column was not added to categories table';
    END IF;
END $$;

-- Verificar se campos foram adicionados em media
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'media' 
        AND column_name = 'wpMediaId'
    ) THEN
        RAISE EXCEPTION 'wpMediaId column was not added to media table';
    END IF;
END $$;

-- Verificar se índices únicos foram criados
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'pages_site_wp_post_unique'
    ) THEN
        RAISE EXCEPTION 'pages_site_wp_post_unique index was not created';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'categories_site_wp_term_unique'
    ) THEN
        RAISE EXCEPTION 'categories_site_wp_term_unique index was not created';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'media_site_wp_media_unique'
    ) THEN
        RAISE EXCEPTION 'media_site_wp_media_unique index was not created';
    END IF;
END $$;









