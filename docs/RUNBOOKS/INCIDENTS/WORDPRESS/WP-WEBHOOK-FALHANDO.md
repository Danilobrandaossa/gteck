# 🚨 WP-WEBHOOK-FALHANDO — WordPress Webhook Falhando

**Severidade:** HIGH  
**Tempo Estimado de Resolução:** 30-60 minutos

---

## 🔍 SYMPTOMS

- Webhooks do WordPress não estão sendo processados
- Jobs incrementais não são enfileirados após eventos WP
- Logs mostram "Webhook signature validation failed"
- Taxa de erro de webhook > 10%

---

## ✅ HOW TO CONFIRM

### **1. Verificar Taxa de Erro de Webhook**
```sql
-- Taxa de erro nas últimas 24h
SELECT 
  COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / COUNT(*) as error_rate,
  COUNT(*) as total_webhooks
FROM queue_jobs
WHERE type LIKE 'wp_sync_item_%'
  AND created_at >= NOW() - INTERVAL '24 hours';
```

**Confirmar se:** `error_rate > 10%`

---

### **2. Verificar Logs de Webhook**
```bash
# Buscar logs de webhook rejeitado
grep "wp_webhook" logs/app.log | grep "signature" | tail -20
```

**Confirmar se:** Logs mostram "signature validation failed"

---

### **3. Verificar Secret Configurado**
```sql
-- Verificar webhookSecret por site
SELECT 
  s.id as site_id,
  s.name as site_name,
  s."wpBaseUrl",
  apc."webhookSecret" IS NOT NULL as has_secret
FROM sites s
LEFT JOIN ai_plugin_configs apc ON apc.site_id = s.id
WHERE s."wpConfigured" = true;
```

**Confirmar se:** Algum site não tem `webhookSecret` configurado

---

### **4. Testar Webhook Manualmente**
```bash
# Gerar signature
WEBHOOK_SECRET="secret-from-db"
BODY='{"event":"post","action":"updated","wpId":123,"siteUrl":"https://wp-site.com","timestamp":'$(date +%s)'}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)

# Enviar webhook
curl -X POST "https://your-domain.com/api/wordpress/webhook" \
  -H "Content-Type: application/json" \
  -H "X-WP-Signature: $SIGNATURE" \
  -H "X-WP-Timestamp: $(date +%s)" \
  -d "$BODY"
```

**Confirmar se:** Retorna erro de signature

---

## 🚨 IMMEDIATE MITIGATION (0-15 MIN)

### **1. Verificar Secret no WordPress**
- ✅ Acessar WordPress admin
- ✅ Verificar que secret configurado no plugin corresponde ao `AIPluginConfig.webhookSecret`
- ✅ Se não corresponder, atualizar WordPress ou banco

### **2. Rotacionar Secret (Se Necessário)**
```sql
-- Gerar novo secret
UPDATE ai_plugin_configs
SET "webhookSecret" = 'new-secret-' || gen_random_uuid()::text
WHERE site_id = 'site-id-here';

-- Atualizar WordPress com novo secret
```

### **3. Verificar Timestamp (Replay Protection)**
```sql
-- Verificar se há problemas de timestamp
SELECT 
  COUNT(*) as webhooks_recentes
FROM queue_jobs
WHERE type LIKE 'wp_sync_item_%'
  AND created_at >= NOW() - INTERVAL '1 hour';
```

**Se timestamp inválido:** Ajustar validação de timestamp (aumentar janela de 5 para 10 minutos temporariamente)

---

## 🔧 SAFE CONFIG CHANGES (COM ROLLBACK)

### **1. Aumentar Janela de Timestamp (Temporário)**
```typescript
// Em app/api/wordpress/webhook/route.ts
// Alterar de 300 (5 min) para 600 (10 min)
const MAX_TIMESTAMP_DIFF = 600; // 10 minutos
```

**Rollback:** Reverter para 300 após correção

---

### **2. Desabilitar Validação de Timestamp (Temporário)**
```typescript
// Em app/api/wordpress/webhook/route.ts
// Comentar validação de timestamp temporariamente
// if (!validateTimestamp(payload.timestamp)) {
//   return { valid: false, error: 'Invalid timestamp' }
// }
```

**Rollback:** Reativar validação após correção

---

## 🔍 DEEP DIAGNOSIS

### **1. Verificar Assinatura HMAC**
```bash
# Testar cálculo de signature
WEBHOOK_SECRET="secret-from-db"
BODY='{"event":"post","action":"updated","wpId":123,"siteUrl":"https://wp-site.com"}'
EXPECTED=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)
echo "Expected: $EXPECTED"
```

**Comparar com:** Signature recebida no webhook

---

### **2. Verificar Encoding do Body**
```bash
# Verificar se body está sendo enviado corretamente
# WordPress pode estar enviando com encoding diferente
```

**Solução:** Normalizar encoding antes de calcular signature

---

### **3. Verificar Site URL Matching**
```sql
-- Verificar se siteUrl do webhook corresponde ao wpBaseUrl
SELECT 
  s.id,
  s."wpBaseUrl",
  COUNT(*) as webhook_count
FROM sites s
LEFT JOIN queue_jobs qj ON qj.site_id = s.id
WHERE s."wpConfigured" = true
GROUP BY s.id, s."wpBaseUrl";
```

**Problema Comum:** `siteUrl` do webhook não corresponde exatamente ao `wpBaseUrl` (trailing slash, http vs https)

---

## 🛠️ PERMANENT FIX

### **1. Sincronizar Secret WordPress ↔ CMS**
```sql
-- Obter secret do banco
SELECT "webhookSecret" FROM ai_plugin_configs WHERE site_id = 'site-id-here';

-- Atualizar WordPress com este secret
```

### **2. Normalizar Site URL Matching**
```typescript
// Em app/api/wordpress/webhook/route.ts
// Normalizar URLs antes de comparar
function normalizeUrl(url: string): string {
  return url.replace(/\/$/, '').toLowerCase();
}
```

### **3. Melhorar Logging de Webhook**
```typescript
// Adicionar logging detalhado (sem expor secret)
logger.info('Webhook received', {
  siteUrl: payload.siteUrl,
  event: payload.event,
  wpId: payload.wpId,
  signatureLength: payload.signature?.length,
  timestamp: payload.timestamp
});
```

---

## ✅ VERIFICATION

### **1. Testar Webhook Manualmente**
```bash
# Ver passo "HOW TO CONFIRM" #4
# Esperado: 200 OK com { "success": true, "jobsEnqueued": 1 }
```

### **2. Verificar Jobs Enfileirados**
```sql
-- Verificar jobs incrementais criados
SELECT COUNT(*) as jobs_criados
FROM queue_jobs
WHERE type LIKE 'wp_sync_item_%'
  AND created_at >= NOW() - INTERVAL '1 hour';
```

**Esperado:** `jobs_criados > 0`

### **3. Monitorar Taxa de Erro**
```sql
-- Verificar taxa de erro após correção
SELECT 
  COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / COUNT(*) as error_rate
FROM queue_jobs
WHERE type LIKE 'wp_sync_item_%'
  AND created_at >= NOW() - INTERVAL '1 hour';
```

**Esperado:** `error_rate < 5%`

---

## 📋 CHECKLIST

- [ ] Taxa de erro confirmada > 10%
- [ ] Secret verificado e sincronizado
- [ ] Webhook testado manualmente
- [ ] Correção aplicada
- [ ] Taxa de erro reduzida < 5%
- [ ] Jobs incrementais sendo enfileirados

---

**Status:** ✅ **RUNBOOK PRONTO**






