# 🚀 Guia Rápido - Framework de Regressão RAG

Este guia mostra como usar o framework de testes de regressão de qualidade do RAG.

---

## 📋 Pré-requisitos

- Sistema RAG funcionando (FASE 7 completa)
- Pelo menos 1 tenant/site configurado com conteúdo
- Variáveis de ambiente configuradas

---

## 🏃 Quick Start

### **1. Criar seu dataset**

```bash
# Copiar o exemplo
cp tests/ai/datasets/rag-regression.example.json \
   tests/ai/datasets/rag-regression.mysite.json

# Editar com suas perguntas
code tests/ai/datasets/rag-regression.mysite.json
```

### **2. Estrutura do dataset**

```json
[
  {
    "id": "test-001",
    "organizationId": "org_abc123",
    "siteId": "site_xyz789",
    "question": "Qual é o horário de funcionamento?",
    "expected": {
      "mustIncludeAny": ["horário", "funcionamento", "aberto"],
      "mustNotInclude": ["não sei", "não tenho"],
      "minConfidenceLevel": "medium",
      "maxFallbackAllowed": false,
      "minAvgSimilarity": 0.70,
      "maxTotalMs": 5000,
      "maxCostUsd": 0.02,
      "minChunks": 1
    }
  }
]
```

### **3. Executar testes**

```bash
# Opção 1: Runner completo (recomendado)
npm run test:rag-regression:run

# Opção 2: Apenas testes unitários
npm run test:rag-regression

# Com dataset customizado
REGRESSION_DATASET_PATH=./tests/ai/datasets/rag-regression.mysite.json \
  npm run test:rag-regression:run
```

### **4. Visualizar relatórios**

```bash
# Relatório Markdown
cat tests/ai/reports/rag-regression.latest.md

# Relatório JSON
cat tests/ai/reports/rag-regression.latest.json

# Comparação com baseline
cat tests/ai/reports/rag-regression.comparison.md
```

---

## 📊 Interpretando Resultados

### **✅ Caso Passou**

```markdown
### ✅ test-001

- **Confidence:** high (0.850)
- **Avg Similarity:** 0.820
- **Chunks Used:** 3
- **Fallback:** No
- **Latency:** 1200ms
- **Cost:** $0.0095
```

**Significa:**
- Sistema respondeu com confiança alta
- Similaridade acima do threshold
- Latência e custo dentro dos limites

---

### **❌ Caso Falhou**

```markdown
### ❌ test-005

- **Confidence:** low (0.320)
- **Avg Similarity:** 0.500
- **Fallback:** Yes
- **Latency:** 2500ms
- **Cost:** $0.0160

**Reasons:**
- Fallback usado quando não deveria
- Similaridade média (0.500) abaixo do mínimo (0.700)
- Latência total (2500ms) acima do máximo (2000ms)
```

**Ações:**
1. Verificar se o conteúdo existe no sistema
2. Considerar adicionar/melhorar conteúdo relacionado
3. Revisar se os thresholds estão apropriados

---

## 🎯 Casos de Uso Comuns

### **Caso 1: Validar que uma pergunta TEM resposta**

```json
{
  "id": "test-horario",
  "question": "Qual é o horário de funcionamento?",
  "expected": {
    "mustIncludeAny": ["horário", "funcionamento"],
    "maxFallbackAllowed": false,
    "minConfidenceLevel": "medium",
    "minAvgSimilarity": 0.70
  }
}
```

---

### **Caso 2: Validar que uma pergunta NÃO TEM resposta**

```json
{
  "id": "test-produto-inexistente",
  "question": "Qual é o preço do produto XPTO-999?",
  "expected": {
    "maxFallbackAllowed": true,
    "minConfidenceLevel": "low",
    "minChunks": 0
  }
}
```

---

### **Caso 3: Validar performance**

```json
{
  "id": "test-performance",
  "question": "Informações de contato",
  "expected": {
    "maxTotalMs": 2000,
    "maxCostUsd": 0.01,
    "minConfidenceLevel": "medium"
  }
}
```

---

## 📈 Gerenciando Baseline

### **Criar baseline inicial**

```bash
# Primeira execução cria baseline automaticamente
npm run test:rag-regression:run
```

### **Atualizar baseline após melhorias**

```bash
# 1. Executar testes
npm run test:rag-regression:run

# 2. Se os resultados são melhores, atualizar baseline
cp tests/ai/reports/rag-regression.latest.json \
   tests/ai/reports/rag-regression.baseline.json
```

### **Comparar com baseline**

```bash
# Automaticamente compara em cada execução
npm run test:rag-regression:run

# Verifica se houve regressão
# Exit code 0 = OK
# Exit code 1 = Regressão detectada
```

---

## 🔧 Configuração Avançada

### **Thresholds de Regressão**

```bash
# .env ou variáveis de ambiente
REGRESS_MAX_FALLBACK_DELTA=0.03      # Fallback rate não pode aumentar > 3%
REGRESS_MAX_LOWCONF_DELTA=0.03       # Low confidence não pode aumentar > 3%
REGRESS_MAX_P95_DELTA_MS=300         # P95 não pode aumentar > 300ms
REGRESS_MAX_AVGSIM_DROP=0.03         # Similarity não pode cair > 0.03
```

### **Customizar Provider/Model**

Edite `tests/ai/rag-regression.runner.ts`:

```typescript
private static readonly DEFAULT_PROVIDER = 'openai'
private static readonly DEFAULT_MODEL = 'gpt-4o-mini' // Econômico
private static readonly DEFAULT_PRIORITY = 'medium'
```

---

## 🚀 Integração CI/CD

### **GitHub Actions**

```yaml
name: RAG Quality Tests

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  rag-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run RAG Regression Tests
        run: npm run test:rag-regression:run
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      
      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: rag-regression-reports
          path: tests/ai/reports/
```

---

## ✅ Checklist de Boas Práticas

- [ ] Criar dataset com 10-50 casos por tenant/site
- [ ] Incluir casos positivos (deve responder) e negativos (deve fallback)
- [ ] Estabelecer baseline após validar resultados
- [ ] Executar testes antes de cada deploy
- [ ] Revisar casos falhados antes de atualizar baseline
- [ ] Adicionar novos casos quando adicionar conteúdo
- [ ] Monitorar custos dos testes
- [ ] Manter dataset sem PII

---

## ❓ FAQ

### **P: Quanto custa executar os testes?**
R: Depende do número de casos e modelo usado. Com `gpt-4o-mini` e 50 casos, custa ~$0.50-1.00.

### **P: Com que frequência executar?**
R: 
- **Sempre:** Antes de deploy
- **Diariamente:** Testes automatizados
- **Após mudanças:** No RAG ou conteúdo

### **P: O que fazer quando um teste falha?**
R: 
1. Verificar se a falha é legítima
2. Se sim, corrigir o problema
3. Se não, ajustar expectativas do teste

### **P: Como adicionar novos casos?**
R: Editar o arquivo JSON do dataset e adicionar um novo objeto com `id` único.

### **P: Posso ter múltiplos datasets?**
R: Sim! Crie um dataset por tenant/site e execute com `REGRESSION_DATASET_PATH`.

---

## 📚 Recursos Adicionais

- **Relatório ETAPA 8:** `docs/ARQUITETURA-IA/FASE-7-ETAPA-8-RELATORIO.md`
- **Resumo FASE 7:** `docs/ARQUITETURA-IA/FASE-7-RESUMO-EXECUTIVO-COMPLETO.md`
- **Exemplo de Relatório:** `tests/ai/reports/rag-regression.example-report.md`

---

**Última Atualização:** Janeiro 2025  
**Versão:** 1.0








