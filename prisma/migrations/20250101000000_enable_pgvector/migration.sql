-- Migration: Enable pgvector extension
-- FASE 3 - ETAPA 1: Extensão pgvector
-- Data: Janeiro 2025

-- Habilitar extensão pgvector (idempotente)
CREATE EXTENSION IF NOT EXISTS vector;

-- Verificar instalação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    RAISE EXCEPTION 'pgvector extension failed to install';
  END IF;
END $$;









