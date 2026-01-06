# ❓ PERGUNTAS PARA HUMANOS — Meta Creative Intelligence

**Data:** Janeiro 2025  
**Contexto:** Especificação V3 - Decisões que requerem input humano

---

## 🔴 PERGUNTAS CRÍTICAS (BLOCKERS)

### **Q1: Mapeamento de Eventos Meta para Objetivos**

**Pergunta:** Qual evento da Meta API define conversão para cada objetivo?

**Contexto:**
- Objetivo `LEAD`: Qual evento? (`lead`, `onsite_conversion`, `offsite_conversion`?)
- Objetivo `PURCHASE`: Qual evento? (`purchase`, `offsite_conversion.purchase`?)
- Objetivo `INSTALL`: Qual evento? (`mobile_app_install`?)

**Impacto:** 🔴 **ALTO** — Necessário para implementar ranking por KPI corretamente

**Onde usar:** 
- `lib/meta-ads-service.ts` — Método `getInsights()` precisa filtrar por evento correto
- `lib/meta/meta-insights-worker.ts` — Aplicar guardrails baseado em evento

**Alternativa temporária:** Usar campo genérico `conversions` se não souber, mas ranking pode ficar impreciso.

---

## 🟡 PERGUNTAS IMPORTANTES (NÃO-BLOCKERS)

### **Q2: Arquitetura de Workers em Produção**

**Pergunta:** Workers rodam em processo separado em produção? Onde?

**Contexto:**
- Atualmente existe `lib/embedding-worker.ts` e `lib/wordpress/wordpress-sync-worker-runner.ts`
- Onde esses workers rodam? (mesmo processo Next.js? Processo separado? Container Docker?)

**Impacto:** 🟡 **MÉDIO** — Afeta como implementar `lib/meta/meta-insights-worker.ts`

**Onde usar:**
- Decisão de arquitetura: worker inline vs worker separado
- Configuração de deployment

**Alternativa:** Assumir mesmo padrão do WordPress sync worker (mesmo processo).

---

### **Q3: Sistema de Notificações**

**Pergunta:** Sistema de notificações existe? (email/in-app para tokens expirando)

**Contexto:**
- Tokens Meta expiram em 60 dias
- Precisa notificar usuário antes de expirar (ex: 7 dias antes)

**Impacto:** 🟡 **MÉDIO** — Se não existir, precisa implementar básico no MVP

**Onde usar:**
- Worker `meta_token_refresh` precisa notificar
- Endpoint `DELETE /api/meta/connections/:id` pode notificar

**Alternativa:** Se não existir, implementar notificação básica (console.log + email simples).

---

### **Q4: Autenticação de Usuários**

**Pergunta:** Auth final usa NextAuth ou lib/auth custom?

**Contexto:**
- OAuth Meta é separado (cada usuário conecta sua conta)
- Mas precisa validar que usuário está autenticado no sistema

**Impacto:** 🟢 **BAIXO** — OAuth Meta é independente, mas precisa validar sessão

**Onde usar:**
- Middleware de autenticação nos endpoints `/api/meta/*`
- Validação de `organizationId` e `userId`

**Alternativa:** Assumir NextAuth (já instalado) ou lib/auth custom (já existe).

---

### **Q5: Redis para Cache de State Tokens**

**Pergunta:** Redis está disponível para cache de state tokens OAuth?

**Contexto:**
- OAuth flow precisa armazenar `state` token (CSRF protection)
- Pode usar sessão NextAuth, Redis, ou in-memory (dev only)

**Impacto:** 🟢 **BAIXO** — Pode usar sessão NextAuth como fallback

**Onde usar:**
- `POST /api/meta/connect` — Armazenar state
- `GET /api/meta/oauth/callback` — Validar state

**Alternativa:** Usar sessão NextAuth (se disponível) ou in-memory para dev.

---

## 📝 PERGUNTAS OPCIONAIS (NICE TO HAVE)

### **Q6: Brand Guidelines**

**Pergunta:** Existe sistema de brand guidelines? (cores, fontes, logos proibidos)

**Contexto:**
- Anti-clone rules precisam proibir marcas concorrentes
- Mas também pode ter guidelines da própria marca do usuário

**Impacto:** 🟢 **BAIXO** — MVP pode usar lista hardcoded, Fase 2 adiciona configuração

**Onde usar:**
- `lib/pattern-to-prompt-generator.ts` — Aplicar guidelines
- Anti-clone validation

**Alternativa:** MVP sem brand guidelines, adicionar em Fase 2.

---

### **Q7: Métricas de Custo GPT-4 Vision**

**Pergunta:** Precisa rastrear custos de GPT-4 Vision separadamente?

**Contexto:**
- Extração de padrões usa GPT-4 Vision
- Já existe `AIMetric` para rastrear custos

**Impacto:** 🟢 **BAIXO** — Pode usar `AIMetric` existente

**Onde usar:**
- `lib/creative-pattern-extractor.ts` — Registrar custos
- Dashboard de métricas

**Alternativa:** Usar `AIMetric` existente com tipo `meta_pattern_extract`.

---

## ✅ PERGUNTAS JÁ RESPONDIDAS (DECISÕES FECHADAS)

### **✅ Q-A1: Modo de Operação MVP**
**Resposta:** Modo A apenas (Marketing API, contas conectadas)  
**Decisão:** Fechada no V3

### **✅ Q-A2: Storage MVP**
**Resposta:** Metadata-only (não baixar assets completos)  
**Decisão:** Fechada no V3

### **✅ Q-A3: Token Strategy**
**Resposta:** User Token, tabela customizada `MetaConnection`, criptografia AES-256-CBC  
**Decisão:** Fechada no V3

### **✅ Q-A4: Guardrails Padrão**
**Resposta:** Min $100 spend, 10 conversões, 1000 impressões, 30 dias  
**Decisão:** Fechada no V3

---

## 🎯 PRIORIDADE DE RESPOSTAS

1. **🔴 Q1 (BLOCKER):** Responder antes de implementar ranking (Épico 3)
2. **🟡 Q2 (IMPORTANTE):** Responder antes de implementar workers (Épico 2)
3. **🟡 Q3 (IMPORTANTE):** Responder antes de implementar compliance (Épico 7)
4. **🟢 Q4, Q5 (BAIXO):** Pode assumir defaults, ajustar depois
5. **🟢 Q6, Q7 (OPCIONAL):** Fase 2 ou depois

---

**FIM DAS PERGUNTAS**





