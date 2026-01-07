# 🚨 WP-PULL-ATRASADO — WordPress Pull Incremental Atrasado

**Severidade:** MEDIUM  
**Tempo Estimado de Resolução:** 15-30 minutos

---

## 🔍 SYMPTOMS

- Pull incremental não está sendo executado
- Conteúdo WordPress não está sendo sincronizado
- `wpLastSyncAt` não está sendo atualizado
- Lag entre WordPress e CMS aumentando

---

## ✅ HOW TO CONFIRM

### **1. Verificar Último Pull**
```sql
-- Verificar último pull incremental
SELECT 
  s.id as site_id,
  s.name as site_name,
  s."wpLastSyncAt",
  NOW() - s."wpLastSyncAt" as lag
FROM sites s
WHERE s."wpConfigured" = true
ORDER BY s."wpLastSyncAt" ASC NULLS FIRST;
```

**Confirmar se:** `lag > 30 minutos` (pull deveria rodar a cada 15 min)

---

### **2. Verificar Cron Job**
```bash
# Verificar se cron está agendado
crontab -l | grep "pull-incremental"
```

**Confirmar se:** Cron job não existe ou está comentado

---

### **3. Verificar Logs de Cron**
```bash
# Verificar logs de execução do cron
grep "pull-incremental" logs/app.log | tail -20
```

**Confirmar se:** Não há logs recentes ou há erros

---

### **4. Testar Endpoint Manualmente**
```bash
curl -X GET "https://your-domain.com/api/cron/wordpress/pull-incremental" \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Confirmar se:** Retorna erro ou não processa nada

---

## 🚨 IMMEDIATE MITIGATION (0-15 MIN)

### **1. Executar Pull Manualmente**
```bash
# Executar pull incremental manualmente
curl -X GET "https://your-domain.com/api/cron/wordpress/pull-incremental" \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Resultado:** Sincroniza conteúdo imediatamente

---

### **2. Verificar e Reativar Cron**
```bash
# Verificar crontab
crontab -l

# Adicionar/Reativar cron se necessário
(crontab -l 2>/dev/null; echo "*/15 * * * * curl -X GET \"https://your-domain.com/api/cron/wordpress/pull-incremental\" -H \"Authorization: Bearer \${CRON_SECRET}\"") | crontab -
```

---

### **3. Verificar CRON_SECRET**
```bash
# Verificar se CRON_SECRET está configurado
echo $CRON_SECRET
```

**Se não configurado:** Configurar env var

---

## 🔧 SAFE CONFIG CHANGES (COM ROLLBACK)

### **1. Aumentar Frequência Temporariamente**
```bash
# Alterar de 15 para 5 minutos temporariamente
*/5 * * * * curl -X GET "https://your-domain.com/api/cron/wordpress/pull-incremental" \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Rollback:** Reverter para `*/15` após correção

---

### **2. Adicionar Timeout Maior**
```bash
# Adicionar timeout de 5 minutos
*/15 * * * * timeout 300 curl -X GET "https://your-domain.com/api/cron/wordpress/pull-incremental" \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Rollback:** Remover timeout após correção

---

## 🔍 DEEP DIAGNOSIS

### **1. Verificar Limites de Processamento**
```sql
-- Verificar quantos itens estão sendo processados
SELECT 
  COUNT(*) as items_pendentes
FROM queue_jobs
WHERE type LIKE 'wp_sync_item_%'
  AND status IN ('pending', 'processing');
```

**Problema:** Muitos itens pendentes podem estar bloqueando pull

---

### **2. Verificar Erros no Pull**
```sql
-- Verificar erros recentes
SELECT 
  type,
  status,
  error,
  COUNT(*) as count
FROM queue_jobs
WHERE type LIKE 'wordpress_sync_%' OR type LIKE 'wp_%'
  AND created_at >= NOW() - INTERVAL '1 hour'
GROUP BY type, status, error;
```

**Problema:** Erros consistentes podem estar bloqueando pull

---

### **3. Verificar Rate Limits WordPress**
```bash
# Testar conexão WordPress diretamente
curl -X GET "https://wp-site.com/wp-json/wp/v2/posts?per_page=1" \
  -u "username:password"
```

**Problema:** WordPress pode estar retornando rate limit (429)

---

### **4. Verificar WP_PULL_MAX_PER_RUN**
```bash
# Verificar env var
echo $WP_PULL_MAX_PER_RUN
```

**Problema:** Limite muito baixo pode estar causando pull incompleto

---

## 🛠️ PERMANENT FIX

### **1. Configurar Cron Corretamente**
```bash
# Adicionar ao crontab
*/15 * * * * curl -X GET "https://your-domain.com/api/cron/wordpress/pull-incremental" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  >> /var/log/wp-pull-incremental.log 2>&1
```

### **2. Adicionar Monitoramento**
```bash
# Adicionar alerta se pull não executar em 20 minutos
# Via monitoring tool (ex: Prometheus, Datadog)
```

### **3. Implementar Retry Automático**
```typescript
// Em lib/wordpress/wordpress-incremental-pull.ts
// Adicionar retry automático se pull falhar
```

---

## ✅ VERIFICATION

### **1. Verificar Pull Executado**
```sql
-- Verificar que wpLastSyncAt foi atualizado
SELECT 
  s.id,
  s."wpLastSyncAt",
  NOW() - s."wpLastSyncAt" as lag
FROM sites s
WHERE s."wpConfigured" = true;
```

**Esperado:** `lag < 20 minutos`

---

### **2. Verificar Jobs Enfileirados**
```sql
-- Verificar jobs incrementais criados
SELECT COUNT(*) as jobs_criados
FROM queue_jobs
WHERE type LIKE 'wp_sync_item_%'
  AND created_at >= NOW() - INTERVAL '30 minutes';
```

**Esperado:** `jobs_criados > 0`

---

### **3. Monitorar Próximas Execuções**
```bash
# Verificar logs de próximas execuções
tail -f /var/log/wp-pull-incremental.log
```

**Esperado:** Execuções a cada 15 minutos sem erros

---

## 📋 CHECKLIST

- [ ] Lag confirmado > 30 minutos
- [ ] Pull executado manualmente
- [ ] Cron reativado/configurado
- [ ] CRON_SECRET verificado
- [ ] Lag reduzido < 20 minutos
- [ ] Jobs incrementais sendo enfileirados

---

**Status:** ✅ **RUNBOOK PRONTO**








