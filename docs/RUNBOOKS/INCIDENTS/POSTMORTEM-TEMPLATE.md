# 📝 POSTMORTEM TEMPLATE

**Objetivo:** Documentar o incidente, identificar causa raiz e prevenir recorrência.

---

## INFORMAÇÕES BÁSICAS

**Título do Incidente:**  
`[SEV1/SEV2/SEV3] [Título descritivo]`

**Data/Hora:**  
- **Início:** YYYY-MM-DD HH:MM (UTC)
- **Detectado:** YYYY-MM-DD HH:MM (UTC)
- **Mitigado:** YYYY-MM-DD HH:MM (UTC)
- **Resolvido:** YYYY-MM-DD HH:MM (UTC)
- **Duração total:** X horas Y minutos

**Severidade:** SEV1 / SEV2 / SEV3

**On-call:** @pessoa-primária, @pessoa-backup

**Participantes:** @pessoa1, @pessoa2, @pessoa3

---

## 📊 IMPACTO

### **Usuários Afetados:**
- **Total de tenants afetados:** X
- **% de tenants afetados:** X%
- **Requests afetados:** X (Y% do total)
- **Usuários finais impactados:** ~X (estimativa)

### **Métricas (Before → During → After):**

| Métrica | Baseline | Durante Incidente | Após Mitigação | Target |
|---------|----------|-------------------|----------------|--------|
| p95 totalMs | 1800ms | 4200ms | 1900ms | < 2000ms |
| Error rate | 1% | 8% | 1.5% | < 1% |
| Fallback rate | 4% | 18% | 5% | < 5% |
| Custo/hora | $50 | $180 | $55 | $60 |

### **SLIs Violados:**
- ✅ p95 totalMs (target: < 2000ms, atingiu: 4200ms)
- ✅ Error rate (target: < 1%, atingiu: 8%)

### **Impacto de Negócio:**
- Reclamações de usuários: X
- Tickets de suporte abertos: X
- SLA violado: Sim/Não
- Churn risk: Baixo/Médio/Alto

---

## 🔍 CAUSA RAIZ

### **Resumo:**
_(Descrever em 2-3 frases o que causou o incidente)_

Exemplo:
> OpenAI API ficou instável durante horário de pico US (15:00-17:00 UTC), causando timeouts em 35% dos requests. Sistema não tinha circuit breaker implementado, então continuou tentando OpenAI ao invés de fazer fallback automático para Gemini.

### **Causa Raiz Técnica:**
- **O que aconteceu:** [Descrever tecnicamente]
- **Por que aconteceu:** [Descrever cadeia de causas]
- **Por que não foi detectado antes:** [Descrever gap de monitoring/testes]

### **Timeline Detalhado:**

```
10:15 - Alert "RAG_P95_HIGH" disparado
10:17 - On-call confirma SEV2
10:20 - Identificado: OpenAI timeout rate = 35%
10:22 - Decisão: forçar Gemini
10:25 - Aplicado: PREFERRED_PROVIDER=gemini
10:28 - Restart app
10:32 - Verificado: p95 caiu para 1800ms
10:35 - Monitorando estabilização
11:00 - OpenAI voltou ao normal
11:30 - Removido override de provider
11:35 - Incidente resolvido
```

---

## ⚡ AÇÕES TOMADAS

### **Mitigação Imediata (0-15min):**
1. Forçado provider alternativo (Gemini) via env var
2. Restart da aplicação
3. Monitoramento de métricas

### **Correção Temporária (15min-2h):**
1. Mantido Gemini como provider primário
2. Monitoramento contínuo de OpenAI status
3. Preparado rollback plan

### **Correção Permanente (após incidente):**
1. Implementado circuit breaker para providers
2. Adicionado fallback automático
3. Melhorado alerting de provider instável

---

## 🛠️ AÇÕES CORRETIVAS

### **Imediatas (< 1 semana):**
- [ ] Implementar circuit breaker (Owner: @dev-team, ETA: 2025-01-25)
- [ ] Adicionar alert "PROVIDER_DEGRADED" (Owner: @sre-team, ETA: 2025-01-23)
- [ ] Documentar fallback manual no runbook (Owner: @on-call, ETA: 2025-01-22)

### **Curto Prazo (< 1 mês):**
- [ ] Implementar fallback automático por timeout (Owner: @dev-team, ETA: 2025-02-15)
- [ ] Adicionar testes de resiliência de provider (Owner: @qa-team, ETA: 2025-02-10)
- [ ] Revisar timeouts de todos providers (Owner: @dev-team, ETA: 2025-02-05)

### **Longo Prazo (< 3 meses):**
- [ ] Multi-region deployment (Owner: @sre-team, ETA: 2025-04-01)
- [ ] Load balancing entre providers (Owner: @dev-team, ETA: 2025-03-15)
- [ ] Chaos engineering para providers (Owner: @sre-team, ETA: 2025-03-30)

---

## 🎓 LIÇÕES APRENDIDAS

### **O que Funcionou Bem:**
- ✅ Alert disparou em < 2min após degradação
- ✅ On-call respondeu rapidamente (< 5min)
- ✅ Mitigação foi efetiva (p95 caiu 57% em 10min)
- ✅ Rollback plan estava documentado
- ✅ Comunicação foi clara (war room efetivo)

### **O que Não Funcionou:**
- ❌ Sistema não detectou OpenAI instável automaticamente
- ❌ Não tinha fallback automático implementado
- ❌ Timeout muito alto (30s → deveria ser 5s)
- ❌ Circuit breaker não existia
- ❌ Documentação de troubleshooting estava desatualizada

### **Onde Tivemos Sorte:**
- 🍀 Incidente aconteceu durante horário comercial (on-call disponível)
- 🍀 Gemini estava estável (fallback funcionou)
- 🍀 Não era SEV1 (não perdemos clientes)

---

## 📈 MÉTRICAS ANTES/DEPOIS

### **Antes do Incidente:**
- MTTR (Mean Time To Recovery): 45min (média histórica)
- MTBF (Mean Time Between Failures): 30 dias
- Provider error rate: 1-2%

### **Durante Incidente:**
- MTTR (este incidente): 50min
- Provider error rate: 35% (OpenAI)

### **Após Correções:**
- MTTR esperado: 20min (com circuit breaker)
- MTBF esperado: 60 dias (com fallback automático)
- Provider error rate esperado: < 1% (com circuit breaker)

---

## 🔄 COMO PREVENIR

### **Detecção:**
- ✅ Adicionar alert "PROVIDER_DEGRADED" (threshold: error rate > 10% por 2min)
- ✅ Monitorar p95 por provider separadamente
- ✅ Dashboard de provider health (tempo real)

### **Prevenção:**
- ✅ Circuit breaker automático (5 falhas em 1min → abrir circuit por 30s)
- ✅ Fallback automático para provider alternativo
- ✅ Timeout agressivo (5s ao invés de 30s)
- ✅ Retry com backoff exponencial

### **Mitigação:**
- ✅ Runbook atualizado (PROVIDER-INSTAVEL.md)
- ✅ Playbooks de comunicação
- ✅ Rollback automático se degradação > 5min

---

## 📚 REFERÊNCIAS

**Runbooks relacionados:**
- [PROVIDER-INSTAVEL.md](PROVIDER-INSTAVEL.md)
- [RAG-LENTO.md](RAG-LENTO.md)

**Alertas disparados:**
- RAG_P95_HIGH
- PROVIDER_ERROR_RATE_HIGH

**CorrelationIds de amostra:**
- `corr-abc123`
- `corr-def456`
- `corr-ghi789`

**Pull Requests relacionados:**
- #123 - Implementa circuit breaker
- #124 - Adiciona alert PROVIDER_DEGRADED

**Postmortems relacionados:**
- 2024-12-10: RAG lento por cache miss
- 2024-11-05: OpenAI rate limit

---

## ✅ SIGN-OFF

**Reviewed by:**
- Engineering Manager: @manager (YYYY-MM-DD)
- SRE Lead: @sre-lead (YYYY-MM-DD)
- Security (se SEV1): @security-lead (YYYY-MM-DD)

**Ações rastreadas em:** [Link para Jira/Linear/etc]

**Postmortem compartilhado com:** Toda a eng team

---

## 📝 NOTAS ADICIONAIS

_(Qualquer informação adicional relevante)_

---

**Modelo criado em:** Janeiro 2025  
**Última atualização:** YYYY-MM-DD










