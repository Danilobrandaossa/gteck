-- Migration: Add Queue Job Locks and Heartbeat
-- FASE 7 - ETAPA 4: Escala do Worker (claim seguro + múltiplas instâncias)
-- Data: Janeiro 2025

-- ============================================
-- ETAPA 4: ADICIONAR CAMPOS DE LOCK/HEARTBEAT
-- ============================================

-- Adicionar campos aditivos (sem breaking changes)
ALTER TABLE "queue_jobs" 
  ADD COLUMN IF NOT EXISTS "lockedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "lockedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lockExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastHeartbeatAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "processingStartedAt" TIMESTAMP(3);

-- ============================================
-- ÍNDICES
-- ============================================

-- Índice para recuperação de stuck jobs (status + lockExpiresAt)
CREATE INDEX IF NOT EXISTS "queue_jobs_status_lock_idx" ON "queue_jobs"("status", "lockExpiresAt");

-- Índice para rastreamento por worker
CREATE INDEX IF NOT EXISTS "queue_jobs_locked_by_idx" ON "queue_jobs"("lockedBy");

-- ============================================
-- VALIDAÇÃO FINAL
-- ============================================

-- Verificar se campos foram adicionados
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'queue_jobs'
    AND column_name IN ('lockedBy', 'lockedAt', 'lockExpiresAt', 'lastHeartbeatAt', 'processingStartedAt');
    
    IF column_count < 5 THEN
        RAISE EXCEPTION 'Not all lock columns were added. Expected 5, found %', column_count;
    END IF;
END $$;









