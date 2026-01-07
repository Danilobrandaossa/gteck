# 🎯 CANARY PLAN — WordPress Sync + IA

**Data:** Janeiro 2025  
**Objetivo:** Rollout gradual e seguro do WordPress Sync + IA

---

## 📋 ESTRATÉGIA DE CANARY

**Abordagem:** 1 site → 10% → 50% → 100%  
**Duração Estimada:** 7-14 dias  
**Critérios de Avanço:** Métricas dentro dos thresholds  
**Critérios de Rollback:** Qualquer no-go criteria violado

---

## 🎯 ETAPA 0: PREPARAÇÃO (1 site)

### **Objetivo**
Habilitar WordPress Sync apenas para 1 site de teste (não crítico).

### **Ações**

1. **Selecionar Site de Teste**
   ```sql
   -- Identificar site não crítico para teste
   SELECT id, name, "wpConfigured", "wpBaseUrl"
   FROM sites
   WHERE "wpConfigured" = false
   LIMIT 1;
   ```

2. **Configurar Credenciais WordPress**
   ```bash
   # Via API
   curl -X POST "https://your-domain.com/api/sites/{siteId}/wordpress/configure" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer {token}" \
     -d '{
       "siteUrl": "https://test-wp-site.com",
       "authType": "basic",
       "username": "admin",
       "password": "password"
     }'
   ```

3. **Validar Conexão**
   ```bash
   curl -X POST "https://your-domain.com/api/wordpress/validate-site" \
     -H "Content-Type: application/json" \
     -d '{
       "siteUrl": "https://test-wp-site.com",
       "authType": "basic",
       "username": "admin",
       "password": "password"
     }'
   ```

4. **Configurar Webhook no WordPress**
   - URL: `https://your-domain.com/api/wordpress/webhook`
   - Secret: Gerar e salvar em `AIPluginConfig.webhookSecret`
   - Eventos: `post.created`, `post.updated`, `post.deleted`, `page.created`, `page.updated`, `page.deleted`

5. **Habilitar Site**
   ```sql
   UPDATE sites 
   SET "wpConfigured" = true 
   WHERE id = 'site-id-here';
   ```

### **Critérios de Sucesso**
- ✅ Validação de site retorna `valid: true`
- ✅ Webhook configurado e testado
- ✅ Site marcado como `wpConfigured: true`

---

## 🚀 ETAPA 1: FULL SYNC + INDEXAÇÃO (24h)

### **Objetivo**
Executar sync completo e aguardar indexação completa.

### **Ações**

1. **Iniciar Full Sync**
   ```bash
   curl -X POST "https://your-domain.com/api/wordpress/sync-all" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer {token}" \
     -d '{
       "siteId": "site-id-here",
       "organizationId": "org-id-here"
     }'
   ```

2. **Monitorar Progresso**
   ```bash
   # Polling no sync report a cada 5 minutos
   SYNC_ID="sync-id-from-step-1"
   while true; do
     curl -X GET "https://your-domain.com/api/wordpress/sync/${SYNC_ID}" \
       -H "Authorization: Bearer {token}" | jq '.status'
     sleep 300  # 5 minutos
   done
   ```

3. **Aguardar Indexação**
   ```bash
   # Verificar lag de indexação
   curl -X GET "https://your-domain.com/api/admin/wordpress/sync-health?siteId={siteId}" \
     -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}" | \
     jq '.wpIndexLagMinutes'
   ```

4. **Validar Chunks Criados**
   ```sql
   -- Verificar chunks WP criados
   SELECT COUNT(*) as wp_chunks
   FROM embedding_chunks
   WHERE site_id = 'site-id-here'
     AND source_type IN ('wp_post', 'wp_page')
     AND is_active = true;
   ```

### **Critérios de Avanço (24h)**
- ✅ `sync.status = "completed"`
- ✅ `wpIndexLagMinutes < 60` (1 hora)
- ✅ `wp_chunks > 0`
- ✅ `wpIndexErrorRate24h < 5%`
- ✅ Nenhum alerta CRITICAL

### **Critérios de Rollback**
- ❌ `wpIndexLagMinutes > 360` (6 horas)
- ❌ `wpIndexErrorRate24h > 10%`
- ❌ Alertas CRITICAL ativos
- ❌ Custo diário > budget

**Ação de Rollback:** Ver [ROLLBACK-PLAN.md](./ROLLBACK-PLAN.md)

---

## 📊 ETAPA 2: MONITORAMENTO (24h)

### **Objetivo**
Monitorar métricas críticas por 24 horas.

### **Métricas a Monitorar**

#### **1. Error Rate**
```sql
-- Taxa de erro de jobs WP nas últimas 24h
SELECT 
  type,
  COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / COUNT(*) as error_rate
FROM queue_jobs
WHERE type LIKE 'wordpress_%' OR type LIKE 'wp_%'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY type;
```

**Threshold:** `error_rate < 5%`

---

#### **2. Sync Lag**
```bash
# Verificar lag de sync
curl -X GET "https://your-domain.com/api/admin/wordpress/sync-health?siteId={siteId}" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}" | \
  jq '.syncLagMs'
```

**Threshold:** `syncLagMs < 300000` (5 minutos)

---

#### **3. Index Lag**
```bash
# Verificar lag de indexação
curl -X GET "https://your-domain.com/api/admin/wordpress/sync-health?siteId={siteId}" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}" | \
  jq '.wpIndexLagMinutes'
```

**Threshold:** `wpIndexLagMinutes < 60` (1 hora)

---

#### **4. Fallback Rate**
```sql
-- Taxa de fallback RAG nas últimas 24h
SELECT 
  COUNT(*) FILTER (WHERE "fallbackUsed" = true) * 100.0 / COUNT(*) as fallback_rate
FROM ai_interactions
WHERE type = 'rag_query'
  AND site_id = 'site-id-here'
  AND created_at >= NOW() - INTERVAL '24 hours';
```

**Threshold:** `fallback_rate < 10%`

---

#### **5. Low Confidence Rate**
```sql
-- Taxa de low confidence nas últimas 24h
SELECT 
  COUNT(*) FILTER (WHERE context->>'avgSimilarity' < '0.7') * 100.0 / COUNT(*) as low_confidence_rate
FROM ai_interactions
WHERE type = 'rag_query'
  AND site_id = 'site-id-here'
  AND created_at >= NOW() - INTERVAL '24 hours';
```

**Threshold:** `low_confidence_rate < 15%`

---

#### **6. Custo Diário**
```sql
-- Custo diário por site
SELECT 
  s.id as site_id,
  s."budgetDayUsd",
  COALESCE(SUM(ai.cost_usd), 0) as daily_cost,
  (COALESCE(SUM(ai.cost_usd), 0) / NULLIF(s."budgetDayUsd", 0)) * 100 as budget_percentage
FROM sites s
LEFT JOIN ai_interactions ai ON ai.site_id = s.id 
  AND ai.created_at >= CURRENT_DATE
WHERE s.id = 'site-id-here'
GROUP BY s.id, s."budgetDayUsd";
```

**Threshold:** `daily_cost < budgetDayUsd * 0.8` (80% do budget)

---

### **Critérios de Avanço (24h)**
- ✅ Todas as métricas dentro dos thresholds
- ✅ Nenhum alerta CRITICAL
- ✅ Webhooks funcionando (taxa de sucesso > 95%)
- ✅ RAG retornando conteúdo WP

### **Critérios de Rollback**
- ❌ Qualquer métrica fora do threshold
- ❌ Alertas CRITICAL ativos
- ❌ Custo diário > 80% do budget

---

## 📈 ETAPA 3: EXPANSÃO GRADUAL

### **3.1. Expandir para 10% dos Sites**

**Ações:**
1. Identificar 10% dos sites WordPress
2. Configurar credenciais e webhooks
3. Habilitar `wpConfigured = true`
4. Monitorar por 48h

**Critérios de Avanço:**
- ✅ Todas as métricas agregadas dentro dos thresholds
- ✅ Nenhum site individual com problemas críticos
- ✅ Taxa de erro agregada < 5%

---

### **3.2. Expandir para 50% dos Sites**

**Ações:**
1. Identificar mais 40% dos sites WordPress
2. Configurar credenciais e webhooks
3. Habilitar `wpConfigured = true`
4. Monitorar por 48h

**Critérios de Avanço:**
- ✅ Todas as métricas agregadas dentro dos thresholds
- ✅ Nenhum site individual com problemas críticos
- ✅ Taxa de erro agregada < 5%

---

### **3.3. Expandir para 100% dos Sites**

**Ações:**
1. Identificar sites restantes
2. Configurar credenciais e webhooks
3. Habilitar `wpConfigured = true`
4. Monitorar continuamente

**Critérios de Sucesso:**
- ✅ Todas as métricas agregadas dentro dos thresholds
- ✅ Nenhum site individual com problemas críticos
- ✅ Taxa de erro agregada < 5%
- ✅ Sistema estável por 7 dias

---

## 🔄 CRITÉRIOS DE ROLLBACK

**Rollback Imediato se:**
- ❌ Alertas CRITICAL ativos
- ❌ Taxa de erro > 10%
- ❌ Custo diário > budget
- ❌ Lag de sync/index > 6 horas
- ❌ Vazamento de dados entre tenants

**Ação:** Ver [ROLLBACK-PLAN.md](./ROLLBACK-PLAN.md)

---

## 📊 DASHBOARD DE MONITORAMENTO

**Endpoints Principais:**
- `/api/admin/wordpress/sync-health` — Health do sync WP
- `/api/admin/ai/health` — Health geral (inclui `wpIndexing`)
- `/api/admin/ai/alerts` — Alertas (inclui WP)

**Queries SQL:** Ver [OPS-DASHBOARD.md](./OPS-DASHBOARD.md)

---

## ✅ CHECKLIST POR ETAPA

### **Etapa 0**
- [ ] Site de teste selecionado
- [ ] Credenciais configuradas
- [ ] Webhook configurado no WordPress
- [ ] Site habilitado (`wpConfigured = true`)

### **Etapa 1**
- [ ] Full sync executado
- [ ] Sync completado (`status = "completed"`)
- [ ] Indexação completa (`wpIndexLagMinutes < 60`)
- [ ] Chunks WP criados

### **Etapa 2**
- [ ] Error rate < 5%
- [ ] Sync lag < 5 minutos
- [ ] Index lag < 1 hora
- [ ] Fallback rate < 10%
- [ ] Low confidence rate < 15%
- [ ] Custo < 80% do budget

### **Etapa 3.1 (10%)**
- [ ] 10% dos sites habilitados
- [ ] Métricas agregadas OK
- [ ] 48h de monitoramento sem problemas

### **Etapa 3.2 (50%)**
- [ ] 50% dos sites habilitados
- [ ] Métricas agregadas OK
- [ ] 48h de monitoramento sem problemas

### **Etapa 3.3 (100%)**
- [ ] 100% dos sites habilitados
- [ ] Métricas agregadas OK
- [ ] 7 dias de monitoramento sem problemas

---

**Status:** ⏳ **AGUARDANDO INÍCIO**

---

**Próximos Passos:**
1. Revisar [GO-LIVE-CHECKLIST.md](./GO-LIVE-CHECKLIST.md)
2. Executar Etapa 0
3. Monitorar e avançar gradualmente








