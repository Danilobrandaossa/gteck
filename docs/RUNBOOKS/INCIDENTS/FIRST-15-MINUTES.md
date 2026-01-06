# ⏱️ FIRST 15 MINUTES: CHECKLIST

**Ações imediatas ao detectar um incidente**

---

## ✅ CHECKLIST (Ordem obrigatória)

### **1. CONFIRMAR SEVERIDADE** (0-2min)

- [ ] Verificar health dashboard
  ```bash
  curl -H "Authorization: Bearer $ADMIN_SECRET" \
    "http://localhost:4000/api/admin/ai/health"
  ```

- [ ] Verificar alerts ativos
  ```bash
  curl -H "Authorization: Bearer $ADMIN_SECRET" \
    "http://localhost:4000/api/admin/ai/alerts"
  ```

- [ ] **Classificar:** SEV1, SEV2 ou SEV3
  - Ver [SEVERITY-MATRIX.md](SEVERITY-MATRIX.md)

---

### **2. ABRIR CANAL DE COMUNICAÇÃO** (2-3min)

**SEV1:**
- [ ] Abrir war room (Slack + Meet)
- [ ] Convocar on-call + backup
- [ ] Notificar stakeholders

**SEV2:**
- [ ] Abrir incident channel (Slack)
- [ ] Convocar on-call

**SEV3:**
- [ ] Criar ticket (Jira)
- [ ] Notificar equipe responsável

---

### **3. COLETAR CORRELATIONIDS** (3-5min)

- [ ] Pegar 3-5 correlationIds de amostra

```sql
-- Queries problemáticas (últimos 15min)
SELECT 
  id,
  context->>'correlationId' as correlation_id,
  "createdAt",
  status,
  (context->'timings'->>'totalMs')::int as total_ms
FROM ai_interactions
WHERE "createdAt" > NOW() - INTERVAL '15 minutes'
  AND (
    status = 'failed'
    OR (context->'timings'->>'totalMs')::int > 5000
    OR context->>'fallbackUsed' = 'true'
  )
ORDER BY "createdAt" DESC
LIMIT 5;
```

- [ ] Registrar IDs: `_______________`

---

### **4. IDENTIFICAR ESCOPO** (5-7min)

- [ ] **É global ou específico de tenant?**

```sql
-- Distribuição por tenant
SELECT 
  "organizationId",
  "siteId",
  COUNT(*) as requests,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as errors
FROM ai_interactions
WHERE "createdAt" > NOW() - INTERVAL '15 minutes'
GROUP BY "organizationId", "siteId"
ORDER BY errors DESC
LIMIT 10;
```

**Se 1 tenant domina:**
→ Problema isolado (menos crítico)

**Se distribuído:**
→ Problema global (mais crítico)

---

### **5. ESCOLHER RUNBOOK** (7-8min)

Baseado nos sintomas, escolher runbook:

| Sintoma Principal | Runbook |
|-------------------|---------|
| p95 > 3500ms | [RAG-LENTO.md](RAG-LENTO.md) |
| fallbackRate > 10% | [FALLBACK-ALTO.md](FALLBACK-ALTO.md) |
| Custo > 150% budget | [CUSTO-ALTO.md](CUSTO-ALTO.md) |
| Provider error > 15% | [PROVIDER-INSTAVEL.md](PROVIDER-INSTAVEL.md) |
| Stuck jobs > 10 | [QUEUE-STUCK.md](QUEUE-STUCK.md) |
| Feedback negativo > 15% | [QUALIDADE-NEGATIVA.md](QUALIDADE-NEGATIVA.md) |
| Suspeita de vazamento | [MULTI-TENANT-SUSPEITA.md](MULTI-TENANT-SUSPEITA.md) |
| Deploy recente | [DEPLOY-REGRESSAO.md](DEPLOY-REGRESSAO.md) |

- [ ] Runbook escolhido: `_______________`

---

### **6. APLICAR MITIGAÇÃO SEGURA** (8-15min)

**Regra de ouro: SEM DEPLOY em SEV1/SEV2**

Apenas mudanças via:
- ✅ Env vars (restart app)
- ✅ Feature flags
- ✅ Provider policy
- ✅ Cron jobs (reindex, housekeeping)

**❌ NUNCA:**
- Code changes
- Schema changes
- Full deploy

---

#### **Mitigações Seguras Comuns:**

**Performance (RAG lento):**
```bash
export PREFERRED_PROVIDER=gemini      # trocar provider
export RAG_EF_SEARCH_MEDIUM=30       # reduzir ef_search
export RAG_TOP_N=15                  # reduzir chunks
# Restart app
```

**Qualidade (fallback alto):**
```bash
export RAG_CONF_HARD_THRESHOLD=0.65  # threshold permissivo
# Restart app

# OU rodar reindex
curl -X GET -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:4000/api/cron/ai/reindex-incremental"
```

**Custo (explodindo):**
```bash
export THROTTLED_MAX_TOKENS_FACTOR=0.3  # degradação agressiva
export MODEL_POLICY_HIGH=gemini-1.5-flash  # modelo barato
# Restart app
```

**Provider (instável):**
```bash
export PREFERRED_PROVIDER=gemini     # forçar alternativo
export DISABLE_OPENAI=true
# Restart app
```

**Queue (stuck):**
```bash
curl -X GET -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:4000/api/cron/ai/queue-housekeeping"
```

**Multi-tenant (suspeita):**
```bash
export AI_FEATURES_DISABLED=true     # DESLIGAR TUDO
export RAG_FORCE_FALLBACK=true
# Restart app
# Notificar CTO/Security IMEDIATAMENTE
```

**Deploy (regressão):**
```bash
# Rollback imediato
git revert HEAD
# Deploy rollback
```

---

### **7. REGISTRAR TIMELINE** (Durante toda resposta)

**Criar doc compartilhado** (Google Docs, Notion, etc.)

```
INCIDENT: [TÍTULO]
SEV: [1/2/3]
STARTED: [YYYY-MM-DD HH:MM]
ON-CALL: [@pessoa]

TIMELINE:
10:15 - Alert recebido (RAG_P95_HIGH)
10:17 - Confirmado SEV2 (p95 = 4200ms)
10:20 - CorrelationIds coletados
10:22 - Identificado: OpenAI lento (p95Provider = 3800ms)
10:25 - Mitigação: forçado Gemini via env
10:28 - Restart app
10:32 - Verificação: p95 caiu para 1800ms ✅
10:35 - Monitorando...

MITIGATION APPLIED:
- PREFERRED_PROVIDER=gemini
- DISABLE_OPENAI=true

ROLLBACK PLAN:
- unset PREFERRED_PROVIDER
- unset DISABLE_OPENAI
- Restart app
```

---

## ⚠️ O QUE **NÃO** FAZER

❌ **Não fazer deploy de código novo**
❌ **Não fazer schema changes**
❌ **Não mudar múltiplas configs ao mesmo tempo** (impossível saber o que funcionou)
❌ **Não aplicar mudanças sem rollback plan**
❌ **Não assumir que funcionou** (monitorar por pelo menos 15min)

---

## ✅ CRITÉRIO DE SUCESSO (15min)

Ao final dos primeiros 15min, você deve ter:

- [x] Severidade confirmada
- [x] Canal de comunicação aberto
- [x] CorrelationIds coletados
- [x] Escopo identificado (global vs tenant)
- [x] Runbook escolhido
- [x] Mitigação segura aplicada
- [x] Timeline registrado

**Próximos passos:**
- Monitorar métricas por 15-30min
- Verificar se mitigação funcionou
- Seguir runbook para correção permanente

---

## 📞 QUANDO ESCALAR

**Escalar imediatamente se:**
- Mitigação não funcionou em 15min
- Situação piorou
- SEV3 → SEV2 ou SEV2 → SEV1
- Suspeita de vazamento de dados
- Não sabe o que fazer

**Como escalar:**
1. Notificar backup on-call
2. Se não responder em 10min → Engineering Manager
3. Se SEV1 e não resolver em 30min → CTO

---

**Ver também:**
- [SEVERITY-MATRIX.md](SEVERITY-MATRIX.md) — Critérios de severidade
- [README.md](README.md) — Índice de runbooks








