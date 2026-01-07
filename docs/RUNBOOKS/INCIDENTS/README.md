# 🚨 INCIDENT RESPONSE: ÍNDICE GERAL

**FASE 8 - ETAPA 6**

Manual operacional completo para responder a incidentes em produção.

---

## 🎯 PRIMEIROS 10 MINUTOS

**Se você está respondendo a um incidente AGORA:**

1. **Confirme a severidade:** [SEVERITY-MATRIX.md](SEVERITY-MATRIX.md)
2. **Siga o checklist:** [FIRST-15-MINUTES.md](FIRST-15-MINUTES.md)
3. **Escolha o runbook apropriado** (abaixo)

---

## 📋 RUNBOOKS POR CENÁRIO

### **🚀 Performance**
- [RAG-LENTO.md](RAG-LENTO.md) — p95 alto, latência crítica
- [PROVIDER-INSTAVEL.md](PROVIDER-INSTAVEL.md) — Timeout, erro de provider

### **🎯 Qualidade**
- [FALLBACK-ALTO.md](FALLBACK-ALTO.md) — Fallback rate > 10%, retrieval fraco
- [QUALIDADE-NEGATIVA.md](QUALIDADE-NEGATIVA.md) — Feedback negativo alto

### **💰 Custo**
- [CUSTO-ALTO.md](CUSTO-ALTO.md) — Custo explodindo, budget estourado

### **⚙️ Operação**
- [QUEUE-STUCK.md](QUEUE-STUCK.md) — Jobs travados, processamento lento
- [DEPLOY-REGRESSAO.md](DEPLOY-REGRESSAO.md) — Release gate falhou, regressão

### **🔒 Segurança**
- [MULTI-TENANT-SUSPEITA.md](MULTI-TENANT-SUSPEITA.md) — Suspeita de vazamento, isolamento

---

## 🎚️ MATRIZ DE SEVERIDADE

| SEV | Descrição | Exemplos | Resposta |
|-----|-----------|----------|----------|
| **SEV1** | Produção indisponível ou risco crítico | Sistema down, vazamento suspeito, custo explodindo | Imediato (0-15min) |
| **SEV2** | Degradação grave | p95 > 5s, fallback > 20%, erro provider > 30% | < 1h |
| **SEV3** | Degradação moderada ou incidente isolado | p95 2-5s, fallback 10-20%, 1 tenant afetado | < 4h |

**Detalhes:** [SEVERITY-MATRIX.md](SEVERITY-MATRIX.md)

---

## 🔍 FERRAMENTAS DE DIAGNÓSTICO

### **Health & Alerts**
```bash
# Health geral
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/health"

# Alerts ativos
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/alerts"

# Alerts críticos
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/alerts?severity=CRITICAL"
```

### **Tuning Insights (Qualidade)**
```bash
# Dashboard de qualidade (últimas 24h)
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tuning/insights?windowDays=1"

# Apenas recomendações críticas/high
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tuning/insights?minSeverity=high"
```

### **Tenant Cost (FinOps)**
```bash
# Dashboard de custo
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tenant-cost"
```

### **Feedback**
```bash
# Feedback recente
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/feedback?windowDays=1"

# Apenas negativos
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/feedback?rating=-1&windowDays=1"
```

---

## 📞 CONTATOS E OWNERS

| Sistema | Owner | Backup | Canal |
|---------|-------|--------|-------|
| **RAG/Retrieval** | @rag-team | @backend-team | #rag-incidents |
| **FinOps/Cost** | @finops-team | @cto | #finops-alerts |
| **Infra/Queue** | @sre-team | @backend-team | #sre-incidents |
| **Security** | @security-team | @cto | #security-incidents |

*(Ajustar conforme organização)*

---

## 🔄 FLUXO DE RESPOSTA

```
1. TRIAGE (0-5min)
   ↓
   Confirmar severidade (SEV1/SEV2/SEV3)
   Pegar correlationIds de amostra
   Checar health/alerts
   
2. MITIGATION (5-15min)
   ↓
   Aplicar mitigação segura (sem deploy)
   Via env vars, feature flags, policy
   
3. VERIFICATION (15-30min)
   ↓
   Monitorar métricas (p95, fallback, custo)
   Verificar melhoria
   
4. PERMANENT FIX (30min-4h)
   ↓
   Identificar causa raiz
   Aplicar correção estrutural
   Validar via regressão + canary
   
5. POST-MORTEM (após resolução)
   ↓
   Documentar timeline
   Causa raiz
   Ações preventivas
```

---

## 📚 DOCUMENTOS RELACIONADOS

### **Planejamento & Tuning**
- [TUNING-PLAYBOOK.md](../TUNING-PLAYBOOK.md) — Processo de tuning controlado
- [TUNING-DIAGNOSTICO-TAXONOMIA.md](../TUNING-DIAGNOSTICO-TAXONOMIA.md) — Diagnóstico de qualidade
- [MAINTENANCE-JOBS.md](../MAINTENANCE-JOBS.md) — Rotinas de manutenção
- [RELEASE-PROCESS.md](../RELEASE-PROCESS.md) — Processo de release

### **Arquitetura**
- [FASE-8-ETAPA-1-RELATORIO.md](../../ARQUITETURA-IA/FASE-8-ETAPA-1-RELATORIO.md) — Release Gate
- [FASE-8-ETAPA-2-RELATORIO.md](../../ARQUITETURA-IA/FASE-8-ETAPA-2-RELATORIO.md) — FinOps
- [FASE-8-ETAPA-3-RELATORIO.md](../../ARQUITETURA-IA/FASE-8-ETAPA-3-RELATORIO.md) — Maintenance
- [FASE-8-ETAPA-4-RELATORIO.md](../../ARQUITETURA-IA/FASE-8-ETAPA-4-RELATORIO.md) — Feedback
- [FASE-8-ETAPA-5-RELATORIO.md](../../ARQUITETURA-IA/FASE-8-ETAPA-5-RELATORIO.md) — Tuning

---

## 📝 POSTMORTEM

Após resolver um incidente, use o template:

[POSTMORTEM-TEMPLATE.md](POSTMORTEM-TEMPLATE.md)

---

## 🧪 VALIDAÇÃO

Para validar que todos os links e documentos estão corretos:

```bash
# Listar todos os runbooks
ls -la docs/RUNBOOKS/INCIDENTS/

# Verificar se todos existem
for file in RAG-LENTO FALLBACK-ALTO CUSTO-ALTO PROVIDER-INSTAVEL \
            QUEUE-STUCK QUALIDADE-NEGATIVA MULTI-TENANT-SUSPEITA \
            DEPLOY-REGRESSAO; do
  [[ -f "docs/RUNBOOKS/INCIDENTS/${file}.md" ]] && echo "✅ $file" || echo "❌ $file MISSING"
done
```

---

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Trimestral ou após cada SEV1/SEV2










