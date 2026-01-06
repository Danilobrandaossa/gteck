# 🎚️ MATRIZ DE SEVERIDADE

**FASE 8 - ETAPA 6**

Critérios para classificar incidentes e definir tempo de resposta.

---

## 📊 NÍVEIS DE SEVERIDADE

### **SEV1: CRÍTICO** 🔴

**Impacto:** Produção indisponível ou risco crítico à segurança/financeiro

**Tempo de Resposta:** Imediato (0-15min)

**Exemplos:**
- ✅ Sistema completamente indisponível (500 errors > 80%)
- ✅ Suspeita de vazamento de dados (cross-tenant data leak)
- ✅ Custo explodindo (> 300% do normal em < 1h)
- ✅ Ataques ou abuso massivo detectado
- ✅ Degradação crítica em > 50% dos tenants

**SLIs Violados:**
- `availability < 95%` (target: 99.9%)
- `errorRate > 30%` (target: < 1%)
- `p95 > 10000ms` (target: < 3500ms)
- `dailyCost > 3x budget`

**Ações Imediatas:**
1. Convocar on-call (todos)
2. Abrir war room (Slack/Meet)
3. Aplicar mitigação imediata (rollback, feature flags, provider switch)
4. Comunicar stakeholders (status page)
5. Registrar timeline

**Owner:** Quem estiver on-call + backup

---

### **SEV2: ALTO** 🟠

**Impacto:** Degradação grave afetando experiência do usuário

**Tempo de Resposta:** < 1 hora

**Exemplos:**
- ✅ p95 > 5000ms (muito lento, mas funcional)
- ✅ Fallback rate > 20% (retrieval quebrado)
- ✅ Error rate de provider > 30%
- ✅ Queue jobs stuck > 100
- ✅ Feedback negativo > 30% nas últimas 2h
- ✅ 1 tenant crítico completamente degradado

**SLIs Violados:**
- `p95 > 5000ms` (target: < 3500ms)
- `fallbackRate > 20%` (target: < 5%)
- `providerErrorRate > 30%` (target: < 5%)
- `negativeRate > 30%` (target: < 10%)

**Ações Imediatas:**
1. Convocar on-call (owner do sistema)
2. Abrir incident channel
3. Diagnosticar (health/alerts/logs)
4. Aplicar mitigação segura (config changes, não deploy)
5. Monitorar melhoria

**Owner:** On-call do sistema afetado

---

### **SEV3: MODERADO** 🟡

**Impacto:** Degradação moderada ou incidente isolado

**Tempo de Resposta:** < 4 horas

**Exemplos:**
- ✅ p95 entre 3500-5000ms (degradado mas aceitável)
- ✅ Fallback rate 10-20%
- ✅ 1 tenant pequeno afetado
- ✅ Feedback negativo 15-30%
- ✅ Queue jobs stuck < 50
- ✅ Cache hit rate baixo (< 20%)

**SLIs Violados:**
- `p95 > 3500ms` (target: < 2000ms)
- `fallbackRate > 10%` (target: < 5%)
- `negativeRate > 15%` (target: < 10%)
- `cacheHitRate < 20%` (target: > 40%)

**Ações Imediatas:**
1. Registrar incidente
2. Diagnosticar causa raiz
3. Planejar correção estrutural
4. Aplicar quando seguro (não urgente)
5. Monitorar

**Owner:** Equipe responsável (durante horário comercial)

---

## 🎯 MAPEAMENTO: SLIs → SEVERIDADE

### **Performance**

| Métrica | Target | SEV3 | SEV2 | SEV1 |
|---------|--------|------|------|------|
| `p50 totalMs` | < 1500ms | 1500-2500ms | 2500-5000ms | > 5000ms |
| `p95 totalMs` | < 2000ms | 2000-3500ms | 3500-5000ms | > 5000ms |
| `p99 totalMs` | < 3500ms | 3500-7000ms | 7000-10000ms | > 10000ms |

### **Qualidade**

| Métrica | Target | SEV3 | SEV2 | SEV1 |
|---------|--------|------|------|------|
| `fallbackRate` | < 5% | 5-10% | 10-20% | > 20% |
| `lowConfidenceRate` | < 15% | 15-25% | 25-40% | > 40% |
| `negativeRate` (feedback) | < 10% | 10-15% | 15-30% | > 30% |
| `avgSimilarity` | > 0.75 | 0.65-0.75 | 0.55-0.65 | < 0.55 |

### **Disponibilidade**

| Métrica | Target | SEV3 | SEV2 | SEV1 |
|---------|--------|------|------|------|
| `availability` | 99.9% | 99-99.9% | 95-99% | < 95% |
| `errorRate` | < 1% | 1-5% | 5-15% | > 15% |
| `providerErrorRate` | < 5% | 5-15% | 15-30% | > 30% |

### **Custo**

| Métrica | Target | SEV3 | SEV2 | SEV1 |
|---------|--------|------|------|------|
| `dailyCost` | Budget | 100-150% | 150-200% | > 200% |
| `costPerQuery` | < $0.05 | $0.05-0.10 | $0.10-0.20 | > $0.20 |
| `tenantsThrottled` | < 5% | 5-15% | 15-30% | > 30% |

### **Queue**

| Métrica | Target | SEV3 | SEV2 | SEV1 |
|---------|--------|------|------|------|
| `stuckJobs` | 0 | 1-10 | 10-50 | > 50 |
| `avgProcessTime` | < 30s | 30-60s | 60-300s | > 300s |
| `pendingCount` | < 100 | 100-500 | 500-1000 | > 1000 |

---

## 🚨 ESCALATION PATH

### **SEV1**
```
1. On-call primário (Slack/PagerDuty)
   ↓ (se não responder em 5min)
2. On-call backup
   ↓ (se não responder em 5min)
3. Engineering Manager
   ↓ (se não resolver em 30min)
4. CTO
```

### **SEV2**
```
1. On-call primário (Slack)
   ↓ (se não responder em 15min)
2. On-call backup
   ↓ (se não resolver em 2h)
3. Engineering Manager
```

### **SEV3**
```
1. Equipe responsável (Jira ticket)
   ↓ (se não resolver em 8h)
2. Engineering Manager
```

---

## 📞 ON-CALL CONTACTS

| Turno | Primário | Backup | Escalation |
|-------|----------|--------|------------|
| **Business Hours** (9-18h) | @on-call-team | @backend-team | @eng-manager |
| **After Hours** (18-9h) | @on-call-after | @sre-team | @eng-manager |
| **Weekends** | @weekend-on-call | @sre-team | @cto |

*(Ajustar conforme rotação real)*

---

## 📋 CHECKLIST DE RESPOSTA (por SEV)

### **SEV1 Checklist**
- [ ] Confirmar severidade (múltiplas fontes)
- [ ] Abrir war room (Slack + Meet)
- [ ] Pegar 3-5 correlationIds de amostra
- [ ] Checar health/alerts
- [ ] Aplicar mitigação imediata (< 15min)
- [ ] Comunicar status page
- [ ] Registrar timeline (cada 5min)
- [ ] Monitorar métricas em tempo real
- [ ] Validar resolução
- [ ] Postmortem obrigatório (< 48h)

### **SEV2 Checklist**
- [ ] Confirmar severidade
- [ ] Abrir incident channel (Slack)
- [ ] Pegar correlationIds de amostra
- [ ] Checar health/alerts/tuning insights
- [ ] Diagnosticar causa raiz
- [ ] Aplicar mitigação segura (< 1h)
- [ ] Monitorar melhoria
- [ ] Planejar correção permanente
- [ ] Postmortem recomendado

### **SEV3 Checklist**
- [ ] Confirmar severidade
- [ ] Criar ticket (Jira)
- [ ] Diagnosticar causa raiz
- [ ] Planejar correção
- [ ] Aplicar quando seguro
- [ ] Validar resolução
- [ ] Atualizar docs se necessário

---

## 🔄 DOWNGRADE/UPGRADE

### **Quando Fazer Downgrade (SEV1 → SEV2)**
- Mitigação aplicada e funcionando
- Impacto reduzido para < 50% tenants
- Sistema funcional (mesmo que degradado)
- Sem risco de segurança

### **Quando Fazer Upgrade (SEV3 → SEV2)**
- Degradação se espalhou para mais tenants
- Métricas pioraram significativamente
- Mitigação não funcionou
- Impacto maior que esperado

---

## 📚 REFERÊNCIAS

- **SLIs/SLOs originais:** FASE 7 ETAPA 6 (health/alerts)
- **Runbooks:** [README.md](README.md)
- **First 15 minutes:** [FIRST-15-MINUTES.md](FIRST-15-MINUTES.md)
- **Postmortem:** [POSTMORTEM-TEMPLATE.md](POSTMORTEM-TEMPLATE.md)

---

**Última atualização:** Janeiro 2025








