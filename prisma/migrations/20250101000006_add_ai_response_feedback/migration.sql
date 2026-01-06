-- FASE 8 ETAPA 4: AI Response Feedback
-- Adiciona tabela para feedback de usuários sobre respostas da IA

-- CreateTable
CREATE TABLE "ai_response_feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "aiInteractionId" TEXT NOT NULL,
    "userId" TEXT,
    "rating" INTEGER NOT NULL,
    "reason" TEXT,
    "commentTag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ai_feedback_org_site_idx" ON "ai_response_feedback"("organizationId", "siteId");

-- CreateIndex
CREATE INDEX "ai_feedback_interaction_idx" ON "ai_response_feedback"("aiInteractionId");

-- CreateIndex
CREATE INDEX "ai_feedback_rating_idx" ON "ai_response_feedback"("rating");

-- CreateIndex
CREATE INDEX "ai_feedback_created_at_idx" ON "ai_response_feedback"("createdAt");








