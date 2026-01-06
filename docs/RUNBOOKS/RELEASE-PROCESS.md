# 🚀 Runbook: Processo de Release

**Última atualização:** Janeiro 2025  
**Owner:** Equipe de Desenvolvimento  
**Fase:** FASE 8 - ETAPA 1

---

## 📋 Visão Geral

Este runbook descreve o processo de release para o sistema RAG, incluindo verificações automáticas, testes obrigatórios e procedimentos de rollback.

---

## 🚦 Release Gate

### **O que é?**

O Release Gate é uma verificação automática que **bloqueia deploys** que possam degradar a qualidade do sistema.

### **Quando roda?**

- ✅ Antes de todo deploy em staging/produção
- ✅ Em PRs importantes (opcional)
- ✅ Manualmente quando necessário

### **O que verifica?**

1. **Testes de Regressão RAG** (obrigatório)
   - Sistema mantém qualidade?
   - Baseline não degradou?
   - Todos os casos de teste passam?

2. **Alertas Críticos** (opcional)
   - Sistema está saudável?
   - Sem alertas críticos ativos?

---

## ✅ Pré-Deploy Checklist

### **Antes de iniciar o deploy:**

- [ ] Código revisado e aprovado
- [ ] Testes unitários passando
- [ ] Testes de integração passando
- [ ] Migrations aplicadas e testadas
- [ ] Variáveis de ambiente atualizadas
- [ ] Release Gate executado com sucesso

### **Executar Release Gate:**

```bash
# Localmente (antes de push)
npm run release-gate

# Ou via script direto
tsx scripts/release-gate.ts
```

---

## 🎯 Processo de Release

### **1. Preparação**

```bash
# 1.1. Checkout da branch de release
git checkout main
git pull origin main

# 1.2. Criar tag de versão
git tag -a v1.2.3 -m "Release v1.2.3"

# 1.3. Executar Release Gate
npm run release-gate
```

### **2. Deploy em Staging**

```bash
# 2.1. Deploy
npm run deploy:staging

# 2.2. Smoke tests
npm run test:smoke:staging

# 2.3. Verificar health
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  https://staging.example.com/api/admin/ai/health

# 2.4. Verificar alertas
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  https://staging.example.com/api/admin/ai/alerts
```

### **3. Validação em Staging**

- [ ] Health endpoint retorna status OK
- [ ] Sem alertas críticos
- [ ] Smoke tests passaram
- [ ] Testes manuais (se aplicável)
- [ ] Métricas estáveis por 1h

### **4. Deploy em Produção**

```bash
# 4.1. Executar Release Gate novamente
npm run release-gate

# 4.2. Deploy gradual (canary/blue-green)
npm run deploy:production

# 4.3. Monitorar métricas
# - Latência p95
# - Error rate
# - Fallback rate
# - Custo

# 4.4. Validar saúde
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  https://api.example.com/api/admin/ai/health
```

### **5. Monitoramento Pós-Deploy**

**Primeiros 15 minutos:**
- [ ] Sem spike de erros
- [ ] Latência estável
- [ ] Sem alertas críticos

**Primeira hora:**
- [ ] Fallback rate < 10%
- [ ] Custo dentro do esperado
- [ ] Feedback de usuários OK

**Primeiras 24h:**
- [ ] SLOs mantidos
- [ ] Qualidade do RAG estável
- [ ] Sem regressões reportadas

---

## ❌ O que fazer quando o Release Gate bloqueia?

### **Cenário 1: Testes de Regressão Falharam**

```bash
# Exit code: 1
# Mensagem: "Testes de regressão RAG falharam"
```

**Causa:** Sistema degradou e não atende mais aos critérios de qualidade.

**Ações:**

1. **Investigar falhas:**
   ```bash
   # Ver relatório detalhado
   cat tests/ai/reports/rag-regression.latest.md
   
   # Ver comparação com baseline
   cat tests/ai/reports/rag-regression.comparison.md
   ```

2. **Identificar causa raiz:**
   - Mudança no código do RAG?
   - Mudança nos thresholds?
   - Conteúdo removido?
   - Provider degradado?

3. **Corrigir ou justificar:**
   - Se degradação real: **corrigir**
   - Se baseline desatualizado: **atualizar baseline** (com aprovação)
   - Se expectativas erradas: **ajustar casos de teste**

4. **Re-executar:**
   ```bash
   npm run test:rag-regression:run
   npm run release-gate
   ```

---

### **Cenário 2: Alertas Críticos Detectados**

```bash
# Exit code: 2
# Mensagem: "N alerta(s) crítico(s) detectado(s)"
```

**Causa:** Sistema está em estado crítico.

**Ações:**

1. **Verificar alertas:**
   ```bash
   curl -H "Authorization: Bearer $ADMIN_SECRET" \
     http://localhost:4000/api/admin/ai/alerts
   ```

2. **Identificar tipo de alerta:**
   - `RAG_AVAILABILITY_LOW` → Sistema instável
   - `RAG_P95_HIGH` → Latência alta
   - `PROVIDER_ERROR_RATE_HIGH` → Provider com problemas
   - `FALLBACK_RATE_HIGH` → Qualidade degradada
   - `QUEUE_STUCK_JOBS` → Jobs travados
   - `COST_DAILY_HIGH` → Custo explodindo

3. **Resolver alerta crítico:**
   - Ver runbook específico do alerta
   - Resolver problema
   - Aguardar alerta limpar

4. **Re-executar:**
   ```bash
   npm run release-gate
   ```

**⚠️ Importante:** Não faça deploy com alertas críticos ativos!

---

### **Cenário 3: Múltiplas Falhas**

```bash
# Exit code: 3
# Mensagem: Múltiplos bloqueadores
```

**Ações:**

1. Resolver testes de regressão primeiro
2. Depois resolver alertas
3. Re-executar gate

---

## 🔧 Configuração do Release Gate

### **Variáveis de Ambiente:**

```bash
# Habilitar/desabilitar verificações
GATE_CHECK_REGRESSION=true          # default: true
GATE_CHECK_ALERTS=true              # default: false

# Endpoint de health (se em outro ambiente)
GATE_HEALTH_ENDPOINT=http://localhost:4000/api/admin/ai/alerts

# Secret de admin
ADMIN_HEALTH_SECRET=your-secret-here
```

### **Desabilitar temporariamente (CUIDADO!):**

```bash
# Pular testes de regressão (NÃO RECOMENDADO)
GATE_CHECK_REGRESSION=false npm run release-gate

# Pular verificação de alertas
GATE_CHECK_ALERTS=false npm run release-gate
```

**⚠️ Aviso:** Desabilitar verificações é **perigoso** e deve ser feito apenas em emergências com aprovação explícita.

---

## 🔄 Rollback

### **Quando fazer rollback?**

- ❌ Erros críticos em produção
- ❌ Degradação severa de qualidade
- ❌ Fallback rate > 30%
- ❌ Latência p95 > 5000ms
- ❌ Custo > 200% do baseline

### **Como fazer rollback:**

```bash
# 1. Identificar versão anterior estável
git tag

# 2. Checkout da versão anterior
git checkout v1.2.2

# 3. Deploy da versão anterior
npm run deploy:production

# 4. Verificar saúde
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  https://api.example.com/api/admin/ai/health

# 5. Monitorar métricas por 30min
```

### **Pós-Rollback:**

1. Investigar causa raiz da falha
2. Corrigir em branch separada
3. Testar extensivamente
4. Re-deploy quando pronto

---

## 📊 Métricas de Release

### **Acompanhar durante/após release:**

- **Latência:**
  - P50, P95, P99
  - Target: P95 < 2500ms

- **Qualidade:**
  - Fallback rate
  - Low confidence rate
  - Avg similarity
  - Target: Fallback < 8%

- **Disponibilidade:**
  - Error rate
  - Success rate
  - Target: Availability > 99%

- **Custo:**
  - Custo por query
  - Custo diário
  - Target: Dentro do budget

---

## 🚨 Contatos de Emergência

### **Em caso de problemas:**

1. **Tech Lead:** [Nome] - [Contato]
2. **SRE On-Call:** [Nome] - [Contato]
3. **Product Owner:** [Nome] - [Contato]

### **Escalação:**

- **Severidade 1 (crítico):** Notificar imediatamente
- **Severidade 2 (alto):** Notificar em 1h
- **Severidade 3 (médio):** Notificar no dia útil

---

## 📚 Recursos Relacionados

- **Testes de Regressão:** `tests/ai/GUIA-RAPIDO-REGRESSAO.md`
- **Health & Alerts:** `docs/ARQUITETURA-IA/FASE-7-ETAPA-6-SLOS.md`
- **Runbooks de Incidentes:** `docs/RUNBOOKS/` (ver outros runbooks)

---

## ✅ Checklist de Release Completo

### **Pré-Deploy:**
- [ ] Código revisado
- [ ] Testes passando
- [ ] Release Gate OK
- [ ] Migrations prontas
- [ ] Env vars atualizadas

### **Deploy Staging:**
- [ ] Deploy executado
- [ ] Smoke tests OK
- [ ] Health OK
- [ ] Sem alertas críticos

### **Deploy Produção:**
- [ ] Release Gate OK (novamente)
- [ ] Deploy gradual
- [ ] Monitoramento ativo
- [ ] Métricas estáveis

### **Pós-Deploy:**
- [ ] 15min: Sem erros
- [ ] 1h: SLOs mantidos
- [ ] 24h: Qualidade OK
- [ ] Documentação atualizada

---

**Última revisão:** Janeiro 2025  
**Próxima revisão:** Março 2025








