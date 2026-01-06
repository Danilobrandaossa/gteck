# 🚨 WP-PUSH-LOOP — WordPress Push Causando Loop Infinito

**Severidade:** HIGH  
**Tempo Estimado de Resolução:** 15-30 minutos

---

## 🔍 SYMPTOMS

- Webhooks sendo recebidos continuamente
- Push CMS → WP está causando webhooks de volta
- Loop infinito de sync
- Alta carga no sistema

---

## ✅ HOW TO CONFIRM

### **1. Verificar Webhooks em Loop**
```sql
-- Verificar webhooks recebidos recentemente
SELECT 
  COUNT(*) as webhooks_count,
  COUNT(DISTINCT data->>'wpId') as unique_items
FROM queue_jobs
WHERE type LIKE 'wp_sync_item_%'
  AND created_at >= NOW() - INTERVAL '10 minutes';
```

**Confirmar se:** `webhooks_count > 100` e `unique_items < 10` (mesmos itens sendo processados repetidamente)

---

### **2. Verificar Push Recente**
```sql
-- Verificar pushes CMS → WP recentes
SELECT 
  COUNT(*) as pushes_count
FROM queue_jobs
WHERE type = 'wordpress_push'
  AND created_at >= NOW() - INTERVAL '10 minutes';
```

**Confirmar se:** `pushes_count > 50` (muitos pushes)

---

### **3. Verificar Anti-Loop**
```sql
-- Verificar se anti-loop está funcionando
SELECT 
  COUNT(*) as webhooks_ignorados
FROM queue_jobs
WHERE type LIKE 'wp_sync_item_%'
  AND result->>'skipReason' LIKE '%cms_originated%'
  AND created_at >= NOW() - INTERVAL '10 minutes';
```

**Confirmar se:** `webhooks_ignorados = 0` (anti-loop não está funcionando)

---

### **4. Verificar Logs de Webhook**
```bash
# Verificar logs de webhook
grep "wp_webhook" logs/app.log | grep "cms_originated" | tail -20
```

**Confirmar se:** Logs não mostram "cms_originated" sendo detectado

---

## 🚨 IMMEDIATE MITIGATION (0-15 MIN)

### **1. Desabilitar Push CMS → WP (Imediato)**
```sql
-- Pausar push (se houver flag)
UPDATE sites 
SET "wpPushEnabled" = false 
WHERE id = 'site-id-here';
```

**Ou via env:**
```bash
export WP_PUSH_ENABLED=false
```

---

### **2. Rotacionar Webhook Secret (Imediato)**
```sql
-- Invalidar webhooks atuais
UPDATE ai_plugin_configs
SET "webhookSecret" = 'emergency-secret-' || gen_random_uuid()::text
WHERE site_id = 'site-id-here';
```

**Resultado:** Webhooks serão rejeitados até WordPress ser atualizado

---

### **3. Limpar Jobs em Loop**
```sql
-- Cancelar jobs em processamento do item problemático
UPDATE queue_jobs
SET status = 'cancelled'
WHERE type LIKE 'wp_sync_item_%'
  AND data->>'wpId' = 'wp-id-problematico'
  AND status IN ('pending', 'processing');
```

---

## 🔧 SAFE CONFIG CHANGES (COM ROLLBACK)

### **1. Melhorar Anti-Loop (Temporário)**
```typescript
// Em lib/wordpress/wordpress-push.ts
// Aumentar janela de detecção de origem CMS
const CMS_ORIGIN_WINDOW_MS = 5 * 60 * 1000; // Aumentar para 10 minutos
```

**Rollback:** Reverter após correção

---

### **2. Desabilitar Webhook Temporariamente**
```sql
-- Rotacionar secret (já feito em mitigation)
-- Manter até correção
```

**Rollback:** Restaurar secret original após correção

---

## 🔍 DEEP DIAGNOSIS

### **1. Verificar Idempotency Key**
```sql
-- Verificar se idempotency key está sendo usado
SELECT 
  COUNT(*) as pushes_sem_idempotency
FROM queue_jobs
WHERE type = 'wordpress_push'
  AND (data->>'idempotencyKey' IS NULL OR data->>'idempotencyKey' = '')
  AND created_at >= NOW() - INTERVAL '1 hour';
```

**Problema:** Idempotency key não está sendo usado

---

### **2. Verificar isCmsOriginated**
```typescript
// Em lib/wordpress/wordpress-push.ts
// Verificar se isCmsOriginated está funcionando
// Testar manualmente
```

**Problema:** `isCmsOriginated` pode não estar detectando corretamente

---

### **3. Verificar Timestamp de Push**
```sql
-- Verificar quando push foi feito
SELECT 
  created_at as push_time,
  data->>'wpId' as wp_id,
  data->>'idempotencyKey' as idempotency_key
FROM queue_jobs
WHERE type = 'wordpress_push'
  AND created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;
```

**Problema:** Push pode estar sendo feito sem idempotency key

---

### **4. Verificar Webhook Payload**
```bash
# Verificar payload do webhook
# WordPress pode estar enviando payload diferente
```

**Problema:** Payload pode não conter informações necessárias para anti-loop

---

## 🛠️ PERMANENT FIX

### **1. Melhorar Anti-Loop**
```typescript
// Em lib/wordpress/wordpress-push.ts
// Usar idempotency key mais robusto
// Armazenar idempotency key no banco
// Verificar idempotency key no webhook
```

### **2. Adicionar Rate Limiting**
```typescript
// Limitar número de webhooks por item por minuto
// Bloquear webhooks duplicados dentro de janela de tempo
```

### **3. Melhorar Logging**
```typescript
// Logar quando anti-loop detecta origem CMS
// Logar idempotency key em push e webhook
```

### **4. Adicionar Circuit Breaker**
```typescript
// Se muitos webhooks do mesmo item, ativar circuit breaker
// Bloquear processamento do item por X minutos
```

---

## ✅ VERIFICATION

### **1. Verificar Webhooks Reduzidos**
```sql
-- Verificar webhooks após correção
SELECT COUNT(*) as webhooks_count
FROM queue_jobs
WHERE type LIKE 'wp_sync_item_%'
  AND created_at >= NOW() - INTERVAL '10 minutes';
```

**Esperado:** `webhooks_count < 20`

---

### **2. Verificar Anti-Loop Funcionando**
```sql
-- Verificar webhooks ignorados
SELECT COUNT(*) as webhooks_ignorados
FROM queue_jobs
WHERE type LIKE 'wp_sync_item_%'
  AND result->>'skipReason' LIKE '%cms_originated%'
  AND created_at >= NOW() - INTERVAL '10 minutes';
```

**Esperado:** `webhooks_ignorados > 0` (anti-loop funcionando)

---

### **3. Testar Push Manualmente**
```bash
# Testar push e verificar que webhook é ignorado
curl -X POST "https://your-domain.com/api/wordpress/push-item" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "siteId": "site-id",
    "organizationId": "org-id",
    "entityType": "page",
    "entityId": "page-id"
  }'

# Aguardar webhook e verificar que é ignorado
```

**Esperado:** Webhook é recebido mas ignorado (cms_originated)

---

## 📋 CHECKLIST

- [ ] Loop confirmado (webhooks > 100, unique < 10)
- [ ] Push desabilitado temporariamente
- [ ] Webhook secret rotacionado
- [ ] Anti-loop melhorado
- [ ] Webhooks reduzidos < 20
- [ ] Anti-loop funcionando (webhooks ignorados)

---

**Status:** ✅ **RUNBOOK PRONTO**






