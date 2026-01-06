-- Migration: Add Chat Sessions and Messages
-- FASE 6 - ETAPA 1: Sessões e Mensagens de Chat
-- Data: Janeiro 2025

-- ============================================
-- ETAPA 1: CRIAR TABELAS DE CHAT
-- ============================================

-- 1. Tabela ChatSession
CREATE TABLE IF NOT EXISTS "chat_sessions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- 2. Tabela ChatMessage
CREATE TABLE IF NOT EXISTS "chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokens" INTEGER,
    "provider" TEXT,
    "model" TEXT,
    "aiInteractionId" TEXT,
    "ragSources" TEXT DEFAULT '[]',
    "ragMetadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- FOREIGN KEYS
-- ============================================

-- Foreign keys para ChatSession
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign keys para ChatMessage
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_aiInteractionId_fkey" FOREIGN KEY ("aiInteractionId") REFERENCES "ai_interactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- ÍNDICES
-- ============================================

-- Índices para ChatSession
CREATE INDEX IF NOT EXISTS "chat_session_org_site_created_idx" ON "chat_sessions"("organizationId", "siteId", "createdAt");
CREATE INDEX IF NOT EXISTS "chat_session_user_created_idx" ON "chat_sessions"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "chat_session_last_message_idx" ON "chat_sessions"("lastMessageAt");

-- Índices para ChatMessage
CREATE INDEX IF NOT EXISTS "chat_message_session_created_idx" ON "chat_messages"("sessionId", "createdAt");
CREATE INDEX IF NOT EXISTS "chat_message_ai_interaction_idx" ON "chat_messages"("aiInteractionId");

-- ============================================
-- VALIDAÇÃO FINAL
-- ============================================

-- Verificar se tabelas foram criadas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('chat_sessions', 'chat_messages');
    
    IF table_count < 2 THEN
        RAISE EXCEPTION 'Not all chat tables were created. Expected 2, found %', table_count;
    END IF;
END $$;









