# 📊 Guia Rápido: Feedback de Respostas da IA

## 🎯 O que é o Feedback?

Sistema para coletar avaliações dos usuários sobre respostas da IA, permitindo:
- Medir qualidade real percebida
- Identificar problemas específicos
- Correlacionar com métricas técnicas
- Melhorar continuamente o RAG

---

## 🚀 Como Usar

### **1. Coletar Feedback do Usuário**

**Endpoint:** `POST /api/ai/feedback`

**Exemplo (Frontend):**

```typescript
// Após exibir resposta da IA
async function handleFeedback(
  interactionId: string,
  isPositive: boolean,
  reason?: string
) {
  const response = await fetch('/api/ai/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organizationId: currentOrg.id,
      siteId: currentSite.id,
      aiInteractionId: interactionId,
      userId: currentUser?.id,
      rating: isPositive ? 1 : -1,
      reason: reason
    })
  })
  
  const data = await response.json()
  console.log('Feedback enviado:', data.feedbackId)
}

// UI Example
<div className="feedback-buttons">
  <button onClick={() => handleFeedback(interactionId, true, 'HELPFUL')}>
    👍 Útil
  </button>
  <button onClick={() => handleFeedback(interactionId, false, 'INCORRECT')}>
    👎 Incorreto
  </button>
</div>
```

---

### **2. Visualizar Dashboard (Admin)**

**Endpoint:** `GET /api/admin/ai/feedback`

**Exemplo:**

```bash
# Feedback do último dia
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/feedback?window=day"

# Filtrar por tenant específico
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/feedback?organizationId=org-1&siteId=site-1&window=week"

# Apenas feedbacks negativos
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/feedback?rating=-1&window=day"
```

**Resposta:**

```json
{
  "success": true,
  "summary": {
    "total": 150,
    "positive": 120,
    "negative": 30,
    "positiveRate": 0.8,
    "negativeRate": 0.2,
    "byReason": {
      "HELPFUL": 100,
      "CLEAR": 20,
      "INCORRECT": 20,
      "INCOMPLETE": 10
    }
  },
  "correlation": {
    "byConfidence": {
      "high": { total: 50, positive: 45, negative: 5 },
      "medium": { total: 60, positive: 50, negative: 10 },
      "low": { total: 40, positive: 25, negative: 15 }
    },
    "byModel": {
      "gpt-4": { total: 80, positive: 70, negative: 10 },
      "gpt-4o-mini": { total: 70, positive: 50, negative: 20 }
    }
  },
  "feedbacks": [...]
}
```

---

## 📊 Métricas Disponíveis

### **Agregações Globais:**
- `positiveRate` — % de feedback positivo
- `negativeRate` — % de feedback negativo
- `byReason` — Distribuição por motivo

### **Correlações:**
- **Por Confidence:**
  - HIGH → quantos positivos vs negativos?
  - MEDIUM → qualidade está boa?
  - LOW → confirma que é problemático?
  
- **Por Model:**
  - GPT-4 → melhor qualidade?
  - GPT-4o-mini → mais barato, mas pior?
  
- **Por Tenant State:**
  - NORMAL → baseline de qualidade
  - THROTTLED → degradação impacta?
  - BLOCKED → usuários frustrados?

- **Por Provider:**
  - OpenAI vs Gemini vs Claude

---

## 🔍 Reasons Disponíveis

### **Negativos:**
- `INCORRECT` — Resposta errada/imprecisa
- `INCOMPLETE` — Faltou informação
- `CONFUSING` — Resposta confusa
- `TOO_SLOW` — Demorou demais
- `TOO_GENERIC` — Muito genérica/vaga

### **Positivos:**
- `HELPFUL` — Resposta útil
- `CLEAR` — Resposta clara

### **Genérico:**
- `OTHER` — Outro motivo

---

## 🛠️ Casos de Uso

### **1. Validar Confidence Rails**

**Hipótese:** Respostas com HIGH confidence devem ter mais feedback positivo.

**Como validar:**

```typescript
const data = await fetch('/api/admin/ai/feedback?window=week')
  .then(r => r.json())

console.log('HIGH confidence:', data.correlation.byConfidence.high)
// Se positiveRate < 0.85 → confidence mal calibrado!
```

---

### **2. Comparar Modelos**

**Hipótese:** GPT-4 tem melhor qualidade que GPT-4o-mini.

**Como validar:**

```typescript
const data = await fetch('/api/admin/ai/feedback?window=month')
  .then(r => r.json())

const gpt4Rate = data.correlation.byModel['gpt-4'].positive / 
                 data.correlation.byModel['gpt-4'].total

const miniRate = data.correlation.byModel['gpt-4o-mini'].positive / 
                 data.correlation.byModel['gpt-4o-mini'].total

console.log('GPT-4 positiveRate:', gpt4Rate)
console.log('GPT-4o-mini positiveRate:', miniRate)

// Se diferença > 10% → considerar usar gpt-4 mais vezes
```

---

### **3. Impacto da Degradação de Custo**

**Hipótese:** Tenants em THROTTLED têm pior qualidade percebida.

**Como validar:**

```typescript
const data = await fetch('/api/admin/ai/feedback?window=week')
  .then(r => r.json())

console.log('NORMAL:', data.correlation.byTenantState.NORMAL)
console.log('THROTTLED:', data.correlation.byTenantState.THROTTLED)

// Se THROTTLED tem muito mais negativos → revisar thresholds
```

---

### **4. Identificar Problemas Específicos**

**Análise de Reasons:**

```typescript
const data = await fetch('/api/admin/ai/feedback?rating=-1&window=week')
  .then(r => r.json())

console.log('Razões de feedback negativo:', data.summary.byReason)

// Se INCORRECT é maioria → melhorar retrieval/chunks
// Se INCOMPLETE é maioria → aumentar maxTokens
// Se TOO_SLOW é maioria → otimizar latência
```

---

## 🧪 Exemplo Completo (Frontend)

```typescript
import { useState } from 'react'

interface FeedbackProps {
  interactionId: string
  organizationId: string
  siteId: string
}

export function AIFeedback({ interactionId, organizationId, siteId }: FeedbackProps) {
  const [submitted, setSubmitted] = useState(false)
  const [showReasons, setShowReasons] = useState(false)

  async function submitFeedback(rating: 1 | -1, reason?: string) {
    await fetch('/api/ai/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId,
        siteId,
        aiInteractionId: interactionId,
        rating,
        reason
      })
    })
    
    setSubmitted(true)
    setShowReasons(false)
  }

  if (submitted) {
    return <p className="text-sm text-gray-500">Obrigado pelo feedback!</p>
  }

  return (
    <div className="feedback-container">
      {!showReasons ? (
        <div className="flex gap-2">
          <button
            onClick={() => submitFeedback(1, 'HELPFUL')}
            className="px-4 py-2 text-green-600 hover:bg-green-50 rounded"
          >
            👍 Útil
          </button>
          <button
            onClick={() => setShowReasons(true)}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded"
          >
            👎 Não útil
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">O que aconteceu?</p>
          <button onClick={() => submitFeedback(-1, 'INCORRECT')}>
            Resposta incorreta
          </button>
          <button onClick={() => submitFeedback(-1, 'INCOMPLETE')}>
            Resposta incompleta
          </button>
          <button onClick={() => submitFeedback(-1, 'CONFUSING')}>
            Resposta confusa
          </button>
          <button onClick={() => submitFeedback(-1, 'TOO_GENERIC')}>
            Muito genérica
          </button>
          <button onClick={() => setShowReasons(false)}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
```

---

## 🔒 Segurança e Privacidade

### **O que NÃO é coletado:**
- ❌ Texto completo da pergunta
- ❌ Texto completo da resposta
- ❌ Texto livre do usuário
- ❌ Dados pessoais identificáveis

### **O que é coletado:**
- ✅ Rating (+1/-1)
- ✅ Reason (enum)
- ✅ Timestamp
- ✅ Referência à interação (ID)
- ✅ Tenant (org/site)
- ✅ userId opcional (não exposto em APIs públicas)

---

## 📈 Melhoria Contínua

Com feedback implementado, você pode:
1. Validar hipóteses (confidence, models, degradação)
2. Identificar problemas específicos (incorrect, incomplete)
3. Comparar providers/models
4. Ajustar thresholds baseado em dados reais
5. Priorizar melhorias que mais impactam usuários

**Próximo passo:** Use esses dados na ETAPA 5 para ajustar automaticamente o RAG!

---

## 🆘 Troubleshooting

### **Feedback não está sendo salvo:**

```bash
# Verificar logs
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/feedback?limit=10"

# Se vazio, verificar:
# 1. aiInteractionId existe?
# 2. Pertence ao tenant correto?
# 3. Rating é +1 ou -1?
# 4. Reason é válido?
```

### **Correlações estão vazias:**

```bash
# Correlações requerem que:
# 1. Feedback tenha sido criado
# 2. AIInteraction correspondente exista
# 3. AIInteraction.context tenha confidence, model, etc.

# Se context estiver vazio, é porque interações antigas não tinham esses dados.
# Feedbacks futuros terão correlações completas!
```

---

**Documentação completa:** `docs/ARQUITETURA-IA/FASE-8-ETAPA-4-RELATORIO.md`










