# 🔄 ROLLBACK PLAN — WordPress Sync + IA

**Data:** Janeiro 2025  
**Objetivo:** Desabilitar WordPress Sync rapidamente sem deploy

---

## 🚨 SITUAÇÕES QUE REQUEREM ROLLBACK

- ❌ Alertas CRITICAL ativos
- ❌ Taxa de erro > 10%
- ❌ Custo diário > budget
- ❌ Lag de sync/index > 6 horas
- ❌ Vazamento de dados entre tenants
- ❌ Webhooks falhando consistentemente

---

## 🔧 DESABILITAÇÃO RÁPIDA (0-15 MINUTOS)

### **1. Desabilitar Webhooks (Rotacionar Secret)**

**Opção A: Rotacionar Secret (Recomendado)**
```sql
-- Gerar novo secret (invalidar webhooks antigos)
UPDATE ai_plugin_configs
SET "webhookSecret" = 'new-secret-' || gen_random_uuid()::text
WHERE site_id IN (
  SELECT id FROM sites WHERE "wpConfigured" = true
);
```

**Opção B: Desabilitar Endpoint (Flag)**
```sql
-- Se houver flag de feature (adicionar se não existir)
-- Por enquanto, rotacionar secret é suficiente
```

**Resultado:** Webhooks do WordPress serão rejeitados (signature inválida)

---

### **2. Desabilitar Pull Incremental Cron**

**Ação:** Remover/Comentar cron job no servidor

```bash
# Editar crontab
crontab -e

# Comentar linha:
# */15 * * * * curl -X GET "https://your-domain.com/api/cron/wordpress/pull-incremental" \
#   -H "Authorization: Bearer ${CRON_SECRET}"
```

**Resultado:** Pull incremental não será executado

---

### **3. Desabilitar Push CMS → WP (Se Ativo)**

**Ação:** Desabilitar endpoint ou adicionar flag

```sql
-- Se houver flag (adicionar se não existir)
-- Por enquanto, não fazer push manualmente
```

**Resultado:** Push CMS → WP não será executado

---

### **4. Pausar Embedding Trigger WP**

**Ação:** Adicionar flag de pausa (via env ou banco)

**Opção A: Via Env Var (Recomendado)**
```bash
# Adicionar ao .env
WP_EMBEDDING_PAUSED=true
```

**Opção B: Via Flag no Banco (Se Implementado)**
```sql
-- Adicionar coluna se não existir
ALTER TABLE sites ADD COLUMN IF NOT EXISTS "wpEmbeddingPaused" BOOLEAN DEFAULT false;

-- Pausar indexação
UPDATE sites 
SET "wpEmbeddingPaused" = true 
WHERE "wpConfigured" = true;
```

**Modificar `WordPressEmbeddingTrigger.triggerEmbedding()`:**
```typescript
// Verificar flag antes de indexar
if (process.env.WP_EMBEDDING_PAUSED === 'true') {
  return {
    enqueued: false,
    skipped: true,
    skipReason: 'WP embedding paused (rollback)'
  }
}
```

**Resultado:** Novos embeddings WP não serão gerados

---

## 🛡️ MANTER PRODUTO ESTÁVEL

### **1. Continuar Servindo RAG com Conteúdo Já Indexado**

**Comportamento:**
- ✅ RAG continua funcionando com chunks WP já indexados
- ✅ `retrieveContext` busca chunks WP existentes (`isActive = true`)
- ✅ Nenhuma funcionalidade RAG é afetada

**Validação:**
```bash
# Verificar que RAG ainda funciona
curl -X POST "https://your-domain.com/api/ai/rag" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "org-id",
    "siteId": "site-id",
    "question": "What is RAG?",
    "contentType": "all"
  }'
```

---

### **2. Registrar Eventos de "Index Paused" no Health**

**Modificar Health Snapshot:**
```typescript
// Em lib/observability/health-snapshot.ts
wpIndexing: {
  // ... métricas existentes
  embeddingPaused: process.env.WP_EMBEDDING_PAUSED === 'true',
  pausedReason: 'Rollback - WP embedding paused'
}
```

**Resultado:** Health snapshot mostra que indexação está pausada

---

## 🔄 REATIVAÇÃO COM SEGURANÇA

### **Passo 1: Investigar Problema**
- ✅ Identificar root cause
- ✅ Corrigir problema
- ✅ Validar correção em ambiente de teste

### **Passo 2: Reativar Gradualmente**

#### **2.1. Reativar Embedding Trigger**
```bash
# Remover flag
unset WP_EMBEDDING_PAUSED
# Ou
UPDATE sites SET "wpEmbeddingPaused" = false WHERE id = 'site-id-here';
```

#### **2.2. Reativar Pull Incremental (1 site)**
```bash
# Reativar cron para 1 site apenas
# Testar por 24h
```

#### **2.3. Reativar Webhooks (1 site)**
```sql
-- Restaurar secret original (ou novo secret configurado no WP)
UPDATE ai_plugin_configs
SET "webhookSecret" = 'original-secret-here'
WHERE site_id = 'site-id-here';
```

#### **2.4. Monitorar por 24h**
- ✅ Verificar métricas
- ✅ Validar que problema não retorna

#### **2.5. Expandir Gradualmente**
- ✅ Reativar para mais sites (10% → 50% → 100%)
- ✅ Seguir [CANARY-PLAN.md](./CANARY-PLAN.md)

---

## 📋 CHECKLIST DE ROLLBACK

### **Desabilitação (0-15 min)**
- [ ] Webhooks desabilitados (secret rotacionado)
- [ ] Pull incremental cron removido/comentado
- [ ] Push CMS → WP desabilitado (se ativo)
- [ ] Embedding trigger pausado (`WP_EMBEDDING_PAUSED=true`)

### **Validação Pós-Rollback**
- [ ] RAG continua funcionando (chunks existentes)
- [ ] Health snapshot mostra `embeddingPaused: true`
- [ ] Nenhum novo embedding WP sendo gerado
- [ ] Webhooks sendo rejeitados (logs confirmam)

### **Reativação (Quando Pronto)**
- [ ] Problema identificado e corrigido
- [ ] Testado em ambiente de teste
- [ ] Reativar gradualmente (1 site → 10% → 50% → 100%)
- [ ] Monitorar por 24h após cada etapa

---

## 🔍 VERIFICAÇÃO DE ROLLBACK

### **1. Verificar Webhooks Desabilitados**
```sql
-- Verificar que secrets foram rotacionados
SELECT id, site_id, "webhookSecret"
FROM ai_plugin_configs
WHERE site_id IN (SELECT id FROM sites WHERE "wpConfigured" = true);
```

**Esperado:** Secrets diferentes dos originais

---

### **2. Verificar Embedding Pausado**
```bash
# Verificar env var
echo $WP_EMBEDDING_PAUSED
# Esperado: "true"

# Ou verificar no banco
SELECT id, "wpEmbeddingPaused"
FROM sites
WHERE "wpConfigured" = true;
```

**Esperado:** `wpEmbeddingPaused = true`

---

### **3. Verificar Health Snapshot**
```bash
curl -X GET "https://your-domain.com/api/admin/ai/health" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}" | \
  jq '.wpIndexing.embeddingPaused'
```

**Esperado:** `true`

---

### **4. Verificar Logs (Webhooks Rejeitados)**
```bash
# Verificar logs de webhook rejeitado
grep "wp_webhook_signature" logs/app.log | tail -10
```

**Esperado:** Logs mostrando "Webhook signature validation failed"

---

## ⚠️ NOTAS IMPORTANTES

1. **Sem Deploy Necessário:** Todas as ações podem ser feitas via SQL/env vars
2. **Produto Continua Funcionando:** RAG funciona com chunks já indexados
3. **Rollback Reversível:** Todas as ações podem ser revertidas
4. **Monitoramento:** Health snapshot mostra status de pausa

---

**Status:** ✅ **PLANO DE ROLLBACK PRONTO**

---

**Próximos Passos:**
1. Revisar este plano
2. Testar rollback em ambiente de staging
3. Documentar procedimentos específicos do ambiente






