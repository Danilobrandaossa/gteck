# ✅ GO-LIVE CHECKLIST — WordPress Sync + IA

**Data:** Janeiro 2025  
**Status:** 📋 Checklist Pré-Go-Live

---

## 🔐 A) SECRETS E ENV VARS

### **Criptografia WordPress**
| Variável | Descrição | Obrigatório | Exemplo |
|----------|-----------|-------------|---------|
| `WORDPRESS_ENCRYPTION_KEY` | Chave AES-256-CBC para criptografar senhas WP (32 bytes) | ✅ Sim | `your-32-char-encryption-key-here` |
| `ENCRYPTION_KEY` | Fallback se `WORDPRESS_ENCRYPTION_KEY` não existir | ⚠️ Opcional | `your-32-char-encryption-key-here` |

**Nota:** Deve ter exatamente 32 bytes (256 bits) para AES-256-CBC.

---

### **Webhooks WordPress**
| Variável | Descrição | Obrigatório | Localização |
|----------|-----------|-------------|-------------|
| `webhookSecret` (por site) | Secret HMAC SHA-256 armazenado em `AIPluginConfig.webhookSecret` | ✅ Sim | Banco de dados (por site) |

**Rotação:**
- Rotacionar via update em `AIPluginConfig.webhookSecret`
- WordPress deve ser atualizado com novo secret antes de remover o antigo
- Período de transição: 24h (ambos secrets válidos)

---

### **Cron Jobs**
| Variável | Descrição | Obrigatório | Exemplo |
|----------|-----------|-------------|---------|
| `CRON_SECRET` | Secret para autenticar chamadas cron | ✅ Sim | `your-cron-secret-here` |
| `WEBHOOK_SECRET` | Fallback se `CRON_SECRET` não existir (pull incremental) | ⚠️ Opcional | `your-webhook-secret-here` |

---

### **Admin Endpoints**
| Variável | Descrição | Obrigatório | Exemplo |
|----------|-----------|-------------|---------|
| `ADMIN_HEALTH_SECRET` | Secret para autenticar `/api/admin/*` | ✅ Sim | `your-admin-health-secret-here` |

**Endpoints Protegidos:**
- `/api/admin/ai/health`
- `/api/admin/ai/alerts`
- `/api/admin/ai/tenant-cost`
- `/api/admin/ai/feedback`
- `/api/admin/ai/tuning/insights`
- `/api/admin/wordpress/sync-health`
- `/api/admin/wordpress/conflicts`

---

### **Rate Limits (Opcional)**
| Variável | Descrição | Default | Exemplo |
|----------|-----------|---------|---------|
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | Limite de requisições por minuto | `60` | `100` |
| `RATE_LIMIT_BURST` | Burst permitido | `10` | `20` |
| `RATE_LIMIT_WINDOW_MS` | Janela de tempo (ms) | `60000` | `60000` |

---

### **FinOps Budgets (por Site)**
| Campo | Descrição | Default | Localização |
|-------|-----------|---------|-------------|
| `budgetDayUsd` | Orçamento diário por site (USD) | `50.00` | `Site.budgetDayUsd` (banco) |
| `budgetMonthUsd` | Orçamento mensal por site (USD) | `1000.00` | `Site.budgetMonthUsd` (banco) |

**Configuração:**
```sql
UPDATE sites 
SET "budgetDayUsd" = 50.00, "budgetMonthUsd" = 1000.00 
WHERE id = 'site-id-here';
```

---

### **Limites de Processamento**
| Variável | Descrição | Default | Exemplo |
|----------|-----------|---------|---------|
| `WP_PULL_MAX_PER_RUN` | Máximo de itens por pull incremental | `100` | `200` |
| `REINDEX_MAX_PER_TENANT` | Máximo de itens para reindex por tenant | `50` | `100` |
| `REINDEX_BATCH_LIMIT` | Tamanho do batch de reindex | `100` | `200` |

---

## 🔒 B) PERMISSÕES/ACCESS CONTROL

### **Endpoints Protegidos**

#### **Admin Endpoints (`/api/admin/*`)**
- ✅ Proteção: Header `Authorization: Bearer {ADMIN_HEALTH_SECRET}`
- ✅ Validação: `validateAuth()` em cada endpoint
- ✅ Fallback: Em desenvolvimento, permite se `ADMIN_HEALTH_SECRET` não configurado

#### **Cron Endpoints (`/api/cron/*`)**
- ✅ Proteção: Header `Authorization: Bearer {CRON_SECRET}`
- ✅ Validação: `validateCronAuth()` em cada endpoint
- ✅ Endpoints:
  - `/api/cron/wordpress/pull-incremental`
  - `/api/cron/ai/cleanup-cache`
  - `/api/cron/ai/queue-housekeeping`
  - `/api/cron/ai/reindex-incremental`
  - `/api/cron/ai/embedding-housekeeping`
  - `/api/cron/ai/alerts`

#### **Webhook WordPress (`/api/wordpress/webhook`)**
- ✅ Proteção: HMAC SHA-256 signature (por site)
- ✅ Validação: `validateWebhookSignature()` + `validateTimestamp()`
- ✅ Replay Protection: Timestamp validation (5 minutos)

---

### **Logs e Segredos**

**Verificações:**
- ✅ Senhas WordPress nunca são logadas (criptografadas antes de salvar)
- ✅ Secrets não aparecem em logs estruturados
- ✅ CorrelationIds são usados para rastreabilidade (sem PII)

**Exemplo de Log Seguro:**
```json
{
  "action": "wp_webhook_received",
  "siteId": "site-123",
  "wpId": 456,
  "event": "post.updated",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## ⏰ C) CRON SCHEDULE RECOMENDADO (PROD)

### **Pull Incremental WordPress**
```bash
# A cada 15 minutos
*/15 * * * * curl -X GET "https://your-domain.com/api/cron/wordpress/pull-incremental" \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Frequência:** `*/15 * * * *` (15 minutos)

---

### **Maintenance Jobs**

#### **Cache Cleanup**
```bash
# Diariamente às 2h
0 2 * * * curl -X GET "https://your-domain.com/api/cron/ai/cleanup-cache" \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Frequência:** `0 2 * * *` (diário, 2h)

---

#### **Queue Housekeeping**
```bash
# Diariamente às 3h
0 3 * * * curl -X GET "https://your-domain.com/api/cron/ai/queue-housekeeping" \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Frequência:** `0 3 * * *` (diário, 3h)

---

#### **Reindex Incremental**
```bash
# A cada 6 horas
0 */6 * * * curl -X GET "https://your-domain.com/api/cron/ai/reindex-incremental" \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Frequência:** `0 */6 * * *` (6 horas)

---

#### **Embedding Housekeeping**
```bash
# Semanalmente (domingo, 4h)
0 4 * * 0 curl -X GET "https://your-domain.com/api/cron/ai/embedding-housekeeping" \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Frequência:** `0 4 * * 0` (semanal, domingo 4h)

---

#### **Alerts Cron**
```bash
# A cada hora
0 * * * * curl -X GET "https://your-domain.com/api/cron/ai/alerts" \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Frequência:** `0 * * * *` (hora em hora)

---

## 🧪 D) SMOKE TESTS (CURL)

### **1. Validate Site**
```bash
curl -X POST "https://your-domain.com/api/wordpress/validate-site" \
  -H "Content-Type: application/json" \
  -d '{
    "siteUrl": "https://wordpress-site.com",
    "authType": "basic",
    "username": "admin",
    "password": "password"
  }'
```

**Esperado:** `200 OK` com `{ "valid": true, "capabilities": {...} }`

---

### **2. Configure WP Creds (POST)**
```bash
curl -X POST "https://your-domain.com/api/sites/{siteId}/wordpress/configure" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {user-token}" \
  -d '{
    "siteUrl": "https://wordpress-site.com",
    "authType": "basic",
    "username": "admin",
    "password": "password"
  }'
```

**Esperado:** `200 OK` com `{ "success": true }`

---

### **3. Configure WP Creds (GET)**
```bash
curl -X GET "https://your-domain.com/api/sites/{siteId}/wordpress/configure" \
  -H "Authorization: Bearer {user-token}"
```

**Esperado:** `200 OK` com `{ "siteUrl": "...", "authType": "basic", "username": "admin" }` (sem password)

---

### **4. Configure WP Creds (DELETE)**
```bash
curl -X DELETE "https://your-domain.com/api/sites/{siteId}/wordpress/configure" \
  -H "Authorization: Bearer {user-token}"
```

**Esperado:** `200 OK` com `{ "success": true }`

---

### **5. Start Full Sync**
```bash
curl -X POST "https://your-domain.com/api/wordpress/sync-all" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {user-token}" \
  -d '{
    "siteId": "site-id-here",
    "organizationId": "org-id-here"
  }'
```

**Esperado:** `200 OK` com `{ "syncId": "...", "queuedJobsCount": 4 }`

---

### **6. Get Sync Report**
```bash
curl -X GET "https://your-domain.com/api/wordpress/sync/{syncId}" \
  -H "Authorization: Bearer {user-token}"
```

**Esperado:** `200 OK` com `{ "status": "completed", "created": 10, "updated": 5, ... }`

---

### **7. Webhook Signed (Exemplo)**
```bash
# Gerar signature
WEBHOOK_SECRET="your-webhook-secret"
BODY='{"event":"post","action":"updated","wpId":123,"siteUrl":"https://wp-site.com","timestamp":1234567890}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)

# Enviar webhook
curl -X POST "https://your-domain.com/api/wordpress/webhook" \
  -H "Content-Type: application/json" \
  -H "X-WP-Signature: $SIGNATURE" \
  -H "X-WP-Timestamp: 1234567890" \
  -d "$BODY"
```

**Esperado:** `200 OK` com `{ "success": true, "jobsEnqueued": 1 }`

---

### **8. Admin Health (Sync Health)**
```bash
curl -X GET "https://your-domain.com/api/admin/wordpress/sync-health?organizationId={orgId}&siteId={siteId}" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}"
```

**Esperado:** `200 OK` com `{ "status": "healthy", "lastFullSyncAt": "...", "wpIndexLagMinutes": 5, ... }`

---

### **9. Admin Health (AI Health)**
```bash
curl -X GET "https://your-domain.com/api/admin/ai/health?windowHours=24" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}"
```

**Esperado:** `200 OK` com snapshot completo incluindo `wpIndexing`

---

### **10. Admin Alerts (AI)**
```bash
curl -X GET "https://your-domain.com/api/admin/ai/alerts?windowHours=24" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}"
```

**Esperado:** `200 OK` com `{ "alerts": [...], "snapshot": {...} }`

---

### **11. Admin Alerts (WP)**
```bash
curl -X GET "https://your-domain.com/api/admin/ai/alerts?windowHours=24" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}"
```

**Esperado:** `200 OK` com alertas incluindo `WP_INDEX_LAG_HIGH` ou `WP_INDEX_ERROR_RATE_HIGH` se aplicável

---

### **12. RAG Query (Retornando Fonte WP)**
```bash
curl -X POST "https://your-domain.com/api/ai/rag" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {user-token}" \
  -d '{
    "organizationId": "org-id",
    "siteId": "site-id",
    "question": "What is RAG?",
    "contentType": "all"
  }'
```

**Esperado:** `200 OK` com `response.sources` contendo `sourceType: "wp_post"` ou `"wp_page"`

**Validação:**
```bash
# Verificar que sources incluem WP
curl ... | jq '.sources[] | select(.sourceType == "wp_post" or .sourceType == "wp_page")'
```

---

## 🚫 E) NO-GO CRITERIA

**NÃO FAZER GO-LIVE se:**

### **1. Alertas CRITICAL Ativos**
```bash
# Verificar alertas
curl -X GET "https://your-domain.com/api/admin/ai/alerts" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}" | \
  jq '.alerts[] | select(.severity == "CRITICAL")'
```

**Critério:** Qualquer alerta com `severity: "CRITICAL"` = **NO-GO**

---

### **2. Erro de Webhook > Threshold**
```sql
-- Taxa de erro de webhook nas últimas 24h
SELECT 
  COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / COUNT(*) as error_rate
FROM queue_jobs
WHERE type LIKE 'wp_sync_item_%'
  AND created_at >= NOW() - INTERVAL '24 hours';
```

**Critério:** `error_rate > 10%` = **NO-GO**

---

### **3. Lag de Sync/Index Acima do Limite**
```bash
# Verificar lag
curl -X GET "https://your-domain.com/api/admin/wordpress/sync-health?organizationId={orgId}" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}" | \
  jq '.wpIndexLagMinutes'
```

**Critério:** `wpIndexLagMinutes > 360` (6 horas) = **NO-GO**

---

### **4. Custo/Dia Fora do Budget**
```sql
-- Custo diário por site
SELECT 
  s.id as site_id,
  s."budgetDayUsd",
  COALESCE(SUM(ai.cost_usd), 0) as daily_cost
FROM sites s
LEFT JOIN ai_interactions ai ON ai.site_id = s.id 
  AND ai.created_at >= CURRENT_DATE
WHERE s.id = 'site-id-here'
GROUP BY s.id, s."budgetDayUsd";
```

**Critério:** `daily_cost > budgetDayUsd * 1.1` (10% de margem) = **NO-GO**

---

### **5. E2E Report com Falhas Críticas**
```bash
# Verificar relatório E2E
cat reports/e2e-report.json | jq '.goLiveChecklist'
```

**Critério:** Qualquer item do checklist = `false` = **NO-GO**

**Itens Críticos:**
- `syncWorking: false`
- `indexingWorking: false`
- `ragWorking: false`
- `multiTenantIsolated: false`

---

## ✅ CHECKLIST FINAL

- [ ] Todos os secrets configurados (`WORDPRESS_ENCRYPTION_KEY`, `CRON_SECRET`, `ADMIN_HEALTH_SECRET`)
- [ ] `webhookSecret` configurado para cada site WordPress
- [ ] Budgets FinOps configurados por site
- [ ] Cron jobs agendados (pull incremental, maintenance)
- [ ] Todos os smoke tests passando
- [ ] Nenhum alerta CRITICAL ativo
- [ ] Taxa de erro de webhook < 10%
- [ ] Lag de sync/index < 6 horas
- [ ] Custo diário dentro do budget
- [ ] E2E report com checklist completo = `true`
- [ ] Logs não expõem secrets
- [ ] Permissões de acesso validadas

---

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

**Próximos Passos:**
1. Revisar este checklist
2. Executar smoke tests
3. Validar no-go criteria
4. Prosseguir com [Canary Plan](./CANARY-PLAN.md)








