-- Migration: Add Sync Conflicts
-- FASE F.4 - Conflitos (Regras + Registro)
-- Data: 24 de Dezembro de 2025

-- ============================================
-- ETAPA 1: CRIAR TABELA SYNC_CONFLICTS
-- ============================================

CREATE TABLE IF NOT EXISTS "sync_conflicts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "wpId" INTEGER NOT NULL,
    "localId" TEXT NOT NULL,
    "conflictType" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "localSnapshotJson" TEXT NOT NULL DEFAULT '{}',
    "wpSnapshotJson" TEXT NOT NULL DEFAULT '{}',
    "resolutionStatus" TEXT NOT NULL DEFAULT 'open',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNote" TEXT,

    CONSTRAINT "sync_conflicts_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- FOREIGN KEYS
-- ============================================

ALTER TABLE "sync_conflicts" ADD CONSTRAINT "sync_conflicts_organizationId_fkey" 
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sync_conflicts" ADD CONSTRAINT "sync_conflicts_siteId_fkey" 
FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS "sync_conflicts_org_site_idx" ON "sync_conflicts"("organizationId", "siteId");
CREATE INDEX IF NOT EXISTS "sync_conflicts_entity_wp_idx" ON "sync_conflicts"("entityType", "wpId");
CREATE INDEX IF NOT EXISTS "sync_conflicts_resolution_status_idx" ON "sync_conflicts"("resolutionStatus");

-- ============================================
-- VALIDAÇÃO FINAL
-- ============================================

-- Verificar se tabela foi criada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sync_conflicts'
    ) THEN
        RAISE EXCEPTION 'sync_conflicts table was not created';
    END IF;
END $$;






