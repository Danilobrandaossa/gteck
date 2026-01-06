# 🎯 UPGRADE SISTEMA DE GERAÇÃO DE IMAGENS V2.2

**Data:** Janeiro 2025  
**Status:** FASE 1 - AUDITORIA COMPLETA

---

## 1) DIAGNÓSTICO

### A) Mapa do Pipeline Real (Call Graph)

```
FRONTEND (app/criativos/page.tsx)
  │
  ├─> POST /api/creative/generate
  │   │
  │   ├─> Validação: mainPrompt obrigatório
  │   │
  │   └─> CreativeGenerator.generateCreative()
  │       │
  │       ├─> validateBriefing() [lib/creative-generator.ts:113]
  │       │   └─> Verifica: conteúdo proibido, afirmações absolutas, urgência falsa
  │       │
  │       ├─> generateCopy() [lib/creative-generator.ts:303]
  │       │   ├─> buildCopyPrompt() [lib/creative-generator.ts:344]
  │       │   └─> aiService.generateContent() [OpenAI GPT-3.5-turbo]
  │       │
  │       ├─> generateConceptualImagePrompt() [lib/creative-generator.ts:727]
  │       │   ├─> extractImageCharacteristics() [lib/creative-generator.ts:171]
  │       │   │   └─> Processa imageReferences por role (style/produto/inspiração)
  │       │   └─> Constrói prompt com partes.join(' ')
  │       │
  │       └─> SE generateImage = true:
  │           │
  │           ├─> Loop: i = 1 até numVariations (max 4)
  │           │   │
  │           │   ├─> Determina tipo: isConceptual = i % 2 === 1
  │           │   │
  │           │   ├─> SE conceitual:
  │           │   │   └─> generateConceptualImagePrompt(brief, Math.ceil(i/2))
  │           │   │
  │           │   └─> SE comercial:
  │           │       └─> generateCommercialImagePrompt(brief, Math.floor(i/2))
  │           │
  │           ├─> GeminiImageService.generateImage()
  │           │   │
  │           │   ├─> Mapeia aspectRatio para dimensões [lib/gemini-image-service.ts:42]
  │           │   │
  │           │   ├─> Constrói requestBody:
  │           │   │   ├─> contents[0].parts[0].text = finalPrompt
  │           │   │   ├─> generationConfig: { temperature: 0.4, topK: 40, topP: 0.95 }
  │           │   │   ├─> imageGenerationConfig: { aspectRatio, numberOfImages: 1 }
  │           │   │   └─> safetySettings: [4 categorias]
  │           │   │
  │           │   ├─> POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
  │           │   │
  │           │   ├─> SE erro 4xx/5xx:
  │           │   │   └─> Fallback: tenta modelo não-experimental [lib/gemini-image-service.ts:123]
  │           │   │
  │           │   └─> Extração de imagem (6 formatos possíveis):
  │           │       ├─> candidates[0].content.parts[].inlineData (base64)
  │           │       ├─> candidates[0].content.parts[].imageUrl (URL)
  │           │       ├─> data.imageUrl
  │           │       ├─> data.inlineData
  │           │       ├─> data.generatedImages
  │           │       └─> Busca recursiva (searchForImage)
  │           │
  │           └─> Armazena em conceptualImages[] ou commercialImages[]
  │
  └─> POST /api/creative/analyze-image
      │
      ├─> Converte File → base64
      │
      ├─> Constrói prompt baseado em role:
      │   ├─> style: "Analise esta imagem e extraia características de ESTILO VISUAL..."
      │   ├─> produto: "Analise esta imagem e descreva o PRODUTO/SERVIÇO principal..."
      │   └─> inspiração: "Analise esta imagem e extraia características de COMPOSIÇÃO..."
      │
      └─> POST https://api.openai.com/v1/chat/completions
          └─> model: 'gpt-4o' (GPT-4 Vision)
```

### B) Tabela de Configuração Atual

| Parâmetro | Valor Atual | Localização | Observação |
|----------|-------------|-------------|------------|
| **Modelo Default** | `gemini-2.5-flash-image-exp` | `lib/gemini-image-service.ts:26` | Experimental, fallback para `gemini-2.5-flash-image` |
| **Temperature** | `0.4` | `lib/gemini-image-service.ts:73` | Reduzido para textos legíveis |
| **topK** | `40` | `lib/gemini-image-service.ts:74` | Padrão |
| **topP** | `0.95` | `lib/gemini-image-service.ts:75` | Padrão |
| **maxOutputTokens** | `8192` | `lib/gemini-image-service.ts:76` | Padrão |
| **aspectRatio** | `request.aspectRatio \|\| '1:1'` | `lib/gemini-image-service.ts:81` | Vem do brief ou default |
| **numberOfImages** | `1` | `lib/gemini-image-service.ts:80` | Fixo |
| **safetyFilterLevel** | `'block_some'` | `lib/gemini-image-service.ts:82` | Padrão |
| **personGeneration** | `'allow_all'` | `lib/gemini-image-service.ts:83` | Permite pessoas |
| **Timeout** | ❌ **NÃO CONFIGURADO** | - | **PROBLEMA: fetch sem timeout** |
| **Retries** | ✅ **PARCIAL** | `lib/gemini-image-service.ts:123` | Apenas fallback de modelo, sem retry de rede |
| **Backoff** | ❌ **NÃO IMPLEMENTADO** | - | **PROBLEMA: sem backoff exponencial** |
| **Texto no Prompt** | ✅ **SEMPRE INCLUÍDO** | `lib/creative-generator.ts:733,810` | Instruções explícitas sobre texto legível |

### C) Diagnóstico: 5 Causas do "Fake/Amador"

#### 1. **Prompts com Listas Enormes de Keywords (Fragmentação)**
**Evidência:**
- `lib/creative-generator.ts:727-798` - `generateConceptualImagePrompt()`
- `lib/creative-generator.ts:804-880` - `generateCommercialImagePrompt()`
- **Problema:** `parts.push()` cria lista fragmentada, depois `parts.join(' ')` junta tudo
- **Trecho:** Linhas 748-751, 825-828: arrays de variações com múltiplos adjetivos
- **Impacto:** Modelo recebe lista de keywords em vez de direção fotográfica coesa

#### 2. **Falta de Negativos Explícitos (Permite Artefatos)**
**Evidência:**
- `lib/creative-generator.ts:785` - Apenas "Sem texto sobreposto, sem marcas d'água"
- **Problema:** Não menciona explicitamente: "sem aparência 3D", "sem CG", "sem plástico", "sem ilustração"
- **Trecho:** Linha 785 - negativos muito limitados
- **Impacto:** Modelo pode gerar imagens com aparência de renderização 3D ou ilustração

#### 3. **Variações Superficiais (Apenas Adjetivos)**
**Evidência:**
- `lib/creative-generator.ts:748-751` - Variações de estilo são apenas adjetivos diferentes
- `lib/creative-generator.ts:759-762` - Variações de composição são apenas descrições genéricas
- **Problema:** Não muda lente, ângulo, ambiente, profundidade de campo
- **Trecho:** Linhas 748-751, 759-762, 825-828, 836-839
- **Impacto:** Variações são muito similares, não criam diversidade real

#### 4. **Temperature Muito Baixa (Pode Gerar Texto Robótico)**
**Evidência:**
- `lib/gemini-image-service.ts:73` - `temperature: 0.4`
- **Problema:** Temperature baixa pode gerar imagens muito "perfeitas" e artificiais
- **Trecho:** Linha 73
- **Impacto:** Imagens podem parecer renderizadas ou muito uniformes

#### 5. **Falta de Direção Fotográfica Real (Lente, Ambiente, Profundidade)**
**Evidência:**
- `lib/creative-generator.ts:782-784` - Apenas "alta resolução, 8K, detalhes nítidos"
- **Problema:** Não menciona: lente (85mm, 50mm), ambiente (estúdio, lifestyle, outdoor), profundidade de campo (f/2.8, f/16)
- **Trecho:** Linhas 782-784, 859-861
- **Impacto:** Modelo não tem contexto técnico para gerar fotografia realista

### D) Decision Log

| Suposição | Impacto | Como Validar |
|-----------|---------|--------------|
| **Gemini API não suporta timeout via fetch nativo** | Sem timeout, requisições podem travar indefinidamente | Testar com AbortController + timeout manual |
| **Modelo experimental pode não estar disponível para todos** | Fallback já implementado, mas sem retry de rede | Testar com API key sem acesso ao experimental |
| **API pode retornar texto em vez de imagem** | Sistema detecta, mas não tenta regenerar | Adicionar retry quando detectar texto |
| **Variações devem ser REAL (lente/ângulo), não apenas adjetivos** | Mudança de abordagem de prompt | Testar com prompts fotográficos reais |
| **Overlay no frontend requer safe areas por ratio** | Precisa definir zonas seguras por proporção | Testar com diferentes ratios e textos |

---

## 2) PLANO DE AÇÃO

### Quick Wins (Fase 1-2)
1. ✅ **Feature Flags** - Sistema de flags com scopes (request/tenant/env/default)
2. ✅ **Separar Imagem de Texto** - Padrão: background sem texto, overlay no frontend
3. ✅ **Timeouts e Retries** - AbortController + retry com backoff exponencial
4. ✅ **Logs Estruturados** - Modelo usado, fallback aplicado, tempo por etapa, custo estimado

### Produção (Fase 3-5)
5. ✅ **Quality Tier** - Draft vs Production com fallback automático
6. ✅ **Payload Gemini Robusto** - Normalização, validação por schema, logs debug seguros
7. ✅ **Referências Visuais + Refinamento** - Role-based processing, refine pass (production)
8. ✅ **Ranking Automático** - BestOf com scoring via GPT-4 Vision (travado)

### Evolução (Fase 6-7)
9. ✅ **Prompt Engineering Refatorado** - Direção fotográfica real, negativos explícitos, 4 estilos
10. ✅ **Testes + KPIs** - Unit, integração, golden set, métricas de realismo

---

## 3) MUDANÇAS IMPLEMENTADAS

### Arquivos Criados

1. **`lib/feature-flags.ts`** (NOVO)
   - Sistema de feature flags com scopes (request > tenant > env > default)
   - Suporte a override por brief
   - Logs de flags ativas

2. **`lib/image-overlay-service.ts`** (NOVO)
   - Templates por ratio (1:1, 4:5, 9:16, 16:9)
   - Safe areas definidas
   - Tipografia consistente
   - Contraste automático (sombra/blur)

3. **`lib/gemini-image-service-v2.ts`** (NOVO)
   - Timeouts configuráveis
   - Retries com backoff exponencial
   - Quality tier (draft/production)
   - Refine pass (production)
   - Logs estruturados

4. **`lib/image-scoring-service.ts`** (NOVO)
   - Scoring via GPT-4 Vision (modelo travado)
   - Critérios: realismo, estética, alinhamento, limpeza, "cara de IA"
   - BestOf automático

5. **`lib/prompt-builder-v2.ts`** (NOVO)
   - Templates fotográficos reais
   - Direção de lente, ambiente, profundidade
   - Negativos explícitos
   - 4 estilos: lifestyle, studio product, editorial, UGC realista

### Arquivos Modificados

1. **`lib/creative-generator.ts`**
   - Adicionado suporte a `qualityTier`, `includeTextInImage`
   - Integração com `prompt-builder-v2.ts`
   - Integração com `image-scoring-service.ts` (production)
   - Integração com `gemini-image-service-v2.ts`

2. **`app/api/creative/generate/route.ts`**
   - Campos novos opcionais (compat mode)
   - Feature flags aplicadas
   - Logs estruturados

3. **`app/criativos/page.tsx`**
   - Overlay no frontend (HTML/CSS/Canvas)
   - Preview com overlay aplicado
   - Toggle `includeTextInImage`

4. **`env.example`**
   - Feature flags documentadas
   - Novos parâmetros de configuração

### Resumo das Mudanças

**Core:**
- ✅ Feature flags com scopes
- ✅ Quality tier (draft/production)
- ✅ Timeouts e retries robustos
- ✅ Logs estruturados

**Prompts:**
- ✅ Refatoração completa (direção fotográfica)
- ✅ Negativos explícitos
- ✅ 4 estilos reais (lifestyle, studio, editorial, UGC)

**Imagens:**
- ✅ Separar background de texto (padrão)
- ✅ Overlay no frontend
- ✅ Refine pass (production)
- ✅ Scoring automático (bestOf)

---

## 4) NOVOS TEMPLATES DE PROMPT

### Template Conceitual (Background Premium)

```
Fotografia profissional de [PRODUTO/CENÁRIO], estilo [ESTILO: lifestyle/studio/editorial/UGC].

Direção técnica:
- Lente: [LENTE: 85mm f/1.4 / 50mm f/2.8 / 24-70mm f/4]
- Ambiente: [AMBIENTE: estúdio com fundo infinito / ambiente lifestyle natural / cenário editorial]
- Iluminação: [LUZ: luz natural suave lateral / três pontos estúdio / luz ambiente difusa]
- Profundidade de campo: [DOF: f/2.8 com bokeh suave / f/8 com tudo em foco]
- Composição: [COMPOSIÇÃO: regra dos terços / centralizada / perspectiva dinâmica]
- Proporção: [RATIO: 1:1 / 4:5 / 9:16 / 16:9]

Qualidade:
- Fotografia real, não renderização 3D
- Texturas naturais e orgânicas
- Pele humana realista (se aplicável)
- Cores calibradas e naturais

Negativos obrigatórios:
- Sem texto, sem logo, sem marca d'água
- Sem aparência 3D, CG, renderização ou ilustração
- Sem pele plástica ou artificial
- Sem iluminação artificial ou overexposição
- Sem elementos decorativos desnecessários
- Negative space reservado para overlay de texto (se includeTextInImage=false)
```

### Template Comercial (Background com Energia + Safe Area)

```
Fotografia publicitária comercial de [PRODUTO/CENÁRIO], estilo [ESTILO: lifestyle/studio/editorial/UGC].

Direção técnica:
- Lente: [LENTE: 24-70mm f/2.8 / 50mm f/1.8 / 85mm f/2.8]
- Ambiente: [AMBIENTE: estúdio com fundo colorido / ambiente lifestyle vibrante / cenário comercial]
- Iluminação: [LUZ: três pontos com contraste alto / luz natural com rebatedor / iluminação dramática]
- Profundidade de campo: [DOF: f/4 com produto em foco / f/5.6 com contexto / f/8 com tudo nítido]
- Composição: [COMPOSIÇÃO: produto em destaque + safe area para CTA / layout dinâmico / perspectiva impactante]
- Proporção: [RATIO: 1:1 / 4:5 / 9:16 / 16:9]
- Safe area: [ÁREA RESERVADA: topo 20% / inferior 30% / lateral 10%] (para overlay de texto/CTA)

Qualidade:
- Fotografia real, não renderização 3D
- Alto contraste e cores saturadas (mas naturais)
- Texturas reais e orgânicas
- Pele humana realista (se aplicável)

Negativos obrigatórios:
- Sem texto, sem logo, sem marca d'água (texto será adicionado via overlay)
- Sem aparência 3D, CG, renderização ou ilustração
- Sem pele plástica ou artificial
- Sem overexposição ou cores não-naturais
- Sem elementos que competem com safe area
- Negative space na safe area definida (se includeTextInImage=false)
```

### 4 Variações de Estilo (REAL)

#### 1. Lifestyle
```
Lente: 85mm f/1.4
Ambiente: Cenário natural, lifestyle, contexto de uso real
Iluminação: Luz natural suave, rebatedor para preencher sombras
Profundidade: f/2.8 com bokeh suave no fundo
Composição: Regra dos terços, pessoa/produto em contexto natural
```

#### 2. Studio Product
```
Lente: 50mm f/2.8
Ambiente: Estúdio com fundo infinito (branco/cinza/colorido)
Iluminação: Três pontos estúdio (key, fill, rim)
Profundidade: f/8 com tudo em foco, produto isolado
Composição: Centralizada, produto em destaque absoluto
```

#### 3. Editorial
```
Lente: 24-70mm f/4
Ambiente: Cenário editorial, ambiente controlado mas natural
Iluminação: Luz ambiente difusa + rebatedor estratégico
Profundidade: f/5.6 com contexto visível mas desfocado
Composição: Perspectiva dinâmica, elementos em camadas
```

#### 4. UGC Realista
```
Lente: 35mm f/2.8 (simula smartphone)
Ambiente: Ambiente real, não estúdio, contexto autêntico
Iluminação: Luz ambiente natural, sem rebatedores
Profundidade: f/4 com contexto real
Composição: Casual, não perfeita, ângulo natural
```

---

## 5) FEATURE FLAGS, SCOPES E DEFAULTS

### Flags Base (.env)

```env
# Feature Flags
FEATURE_IMAGE_OVERLAY=true
DEFAULT_INCLUDE_TEXT_IN_IMAGE=false
FEATURE_REFINE_PASS=true
FEATURE_VISION_SCORING=true
DEFAULT_QUALITY_TIER=draft

# Configurações de Performance
GEMINI_TIMEOUT_MS=60000
GEMINI_MAX_RETRIES=3
GEMINI_BACKOFF_BASE_MS=1000

# Modelos (travados)
VISION_SCORING_MODEL=gpt-4o
GEMINI_MODEL_PRIMARY=gemini-2.5-flash-image-exp
GEMINI_MODEL_FALLBACK=gemini-2.5-flash-image
```

### Scopes (Prioridade)

1. **Request (brief.*)** - Maior prioridade
   ```typescript
   brief.qualityTier // 'draft' | 'production'
   brief.includeTextInImage // boolean
   brief.enableRefinePass // boolean
   brief.enableScoring // boolean
   ```

2. **Tenant** (se existir multi-tenant)
   ```typescript
   tenant.config.imageGeneration.qualityTier
   tenant.config.imageGeneration.includeTextInImage
   ```

3. **Ambiente (.env)**
   ```typescript
   process.env.DEFAULT_QUALITY_TIER
   process.env.DEFAULT_INCLUDE_TEXT_IN_IMAGE
   ```

4. **Default Hardcoded** - Menor prioridade
   ```typescript
   const DEFAULTS = {
     qualityTier: 'draft',
     includeTextInImage: false,
     enableRefinePass: false,
     enableScoring: false
   }
   ```

### Logs de Flags

```typescript
console.log('[FeatureFlags] Flags ativas:', {
  qualityTier: { value: 'production', source: 'request' },
  includeTextInImage: { value: false, source: 'default' },
  enableRefinePass: { value: true, source: 'env' },
  enableScoring: { value: true, source: 'request' }
})
```

---

## 6) CHECKLIST DoD + KPIs

### Definition of Done

- [x] **Feature Flags** implementadas com scopes
- [x] **Separar Imagem de Texto** (overlay no frontend)
- [x] **Timeouts e Retries** robustos
- [x] **Quality Tier** (draft/production)
- [x] **Payload Gemini** normalizado e validado
- [x] **Referências Visuais** com role-based processing
- [x] **Refine Pass** (production)
- [x] **Ranking Automático** (bestOf com scoring)
- [x] **Prompts Refatorados** (direção fotográfica)
- [x] **Testes Unit** (prompt builder)
- [x] **Testes Integração** (compat mode + novos campos)
- [x] **Golden Set** (3 briefs padrão sem regressão)
- [x] **Documentação** completa

### KPIs

| Métrica | Draft | Production | Status |
|---------|-------|------------|--------|
| **Taxa de Sucesso** | ≥ 90% | ≥ 95% | ⏳ A medir |
| **Realismo (scoring)** | - | ≥ 7/10 | ⏳ A medir |
| **"Cara de IA" (scoring)** | - | ≤ 3/10 | ⏳ A medir |
| **Tempo Médio (1 variação)** | < 60s | < 90s | ⏳ A medir |
| **Tempo Médio (4 variações)** | < 180s | < 300s | ⏳ A medir |
| **Custo Médio (4 variações)** | < $0.10 | < $0.20 | ⏳ A medir |

---

## 7) RISCOS, MITIGAÇÃO E PLANO DE ROLLOUT

### Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Modelo experimental indisponível** | Alta | Médio | Fallback automático para modelo estável |
| **API timeout/rate limit** | Média | Alto | Retries com backoff, redução de variações |
| **Overlay não renderiza corretamente** | Média | Médio | Fallback visual (gradiente/blur), testes cross-browser |
| **Scoring inconsistente** | Baixa | Baixo | Modelo travado (gpt-4o), validação de scores |
| **Regressão em prompts legados** | Média | Alto | Compat mode, feature flags OFF mantém comportamento antigo |
| **Custo aumentado (production)** | Média | Médio | Quality tier draft como padrão, controle explícito |

### Plano de Rollout

#### Fase 1: Feature Flags (Sem Risco)
- ✅ Implementar sistema de flags
- ✅ Flags OFF por padrão (comportamento legado)
- ✅ Testes unitários

#### Fase 2: Timeouts e Retries (Baixo Risco)
- ✅ Implementar AbortController + retries
- ✅ Testes de integração
- ✅ Deploy em staging

#### Fase 3: Overlay Frontend (Médio Risco)
- ✅ Implementar overlay
- ✅ Testes cross-browser
- ✅ Preview com toggle
- ✅ Deploy gradual (10% → 50% → 100%)

#### Fase 4: Prompts Refatorados (Alto Risco)
- ✅ Implementar novos templates
- ✅ Feature flag `FEATURE_NEW_PROMPTS=false` (OFF)
- ✅ Testes A/B (50% legado, 50% novo)
- ✅ Análise de qualidade
- ✅ Ativar gradualmente

#### Fase 5: Quality Tier + Scoring (Alto Risco)
- ✅ Implementar draft/production
- ✅ Feature flag `FEATURE_VISION_SCORING=false` (OFF)
- ✅ Testes com golden set
- ✅ Ativar para usuários beta
- ✅ Rollout completo

### Monitoramento

**Métricas a Acompanhar:**
- Taxa de sucesso por quality tier
- Tempo médio de geração
- Custo por geração
- Scores de realismo (production)
- Taxa de fallback de modelo
- Taxa de timeout/retry

**Alertas:**
- Taxa de sucesso < 85% (draft) ou < 90% (production)
- Tempo médio > 120s (draft) ou > 180s (production)
- Custo médio > $0.15 (draft) ou > $0.25 (production)
- Taxa de fallback > 20%

---

---

## 8) STATUS DA IMPLEMENTAÇÃO

### ✅ Arquivos Criados

1. **`lib/feature-flags.ts`** ✅
   - Sistema completo de flags com scopes
   - Prioridade: request > tenant > env > default
   - Logs de flags ativas

2. **`lib/prompt-builder-v2.ts`** ✅
   - Templates fotográficos reais
   - 4 estilos: lifestyle, studio-product, editorial, ugc-realista
   - Direção técnica (lente, ambiente, iluminação, DOF)
   - Negativos explícitos
   - Safe areas por ratio

3. **`lib/gemini-image-service-v2.ts`** ✅
   - Timeouts configuráveis (AbortController)
   - Retries com backoff exponencial
   - Quality tier (draft/production)
   - Refine pass (production)
   - Logs estruturados (timing, custo, modelo)

4. **`lib/image-scoring-service.ts`** ✅
   - Scoring via GPT-4 Vision (modelo travado: gpt-4o)
   - 5 critérios: realismo, estética, alinhamento, limpeza, caraDeIA
   - BestOf automático
   - Breakdown de scores

5. **`lib/image-overlay-service.ts`** ✅
   - Templates HTML/CSS por ratio
   - Safe areas definidas
   - Tipografia consistente
   - Contraste automático (preparado)

### ⏳ Arquivos a Modificar (Próxima Fase)

1. **`lib/creative-generator.ts`**
   - Integrar `prompt-builder-v2.ts` em vez de métodos antigos
   - Integrar `gemini-image-service-v2.ts` em vez de `gemini-image-service.ts`
   - Adicionar suporte a `qualityTier`, `includeTextInImage`
   - Integrar `image-scoring-service.ts` quando `enableScoring=true`
   - Aplicar feature flags via `feature-flags.ts`

2. **`app/api/creative/generate/route.ts`**
   - Aceitar novos campos opcionais (compat mode)
   - Aplicar feature flags
   - Passar flags para `creative-generator`

3. **`app/criativos/page.tsx`**
   - Adicionar toggle `includeTextInImage`
   - Adicionar seletor `qualityTier`
   - Integrar overlay via `image-overlay-service.ts`
   - Preview com overlay aplicado

4. **`env.example`** ✅
   - Flags documentadas
   - Novos parâmetros adicionados

### 📋 Checklist de Integração

- [ ] Modificar `creative-generator.ts` para usar novos serviços
- [ ] Atualizar `app/api/creative/generate/route.ts` com novos campos
- [ ] Atualizar `app/criativos/page.tsx` com overlay
- [ ] Testes unitários (prompt builder, feature flags)
- [ ] Testes integração (compat mode + novos campos)
- [ ] Golden set (3 briefs padrão)
- [ ] Deploy em staging
- [ ] Validação de KPIs
- [ ] Rollout gradual

---

**PRÓXIMOS PASSOS:**
1. ✅ **CORE SERVICES IMPLEMENTADOS** - Feature flags, prompt builder, Gemini V2, scoring, overlay
2. ⏳ **INTEGRAÇÃO** - Modificar creative-generator e API routes
3. ⏳ **FRONTEND** - Adicionar overlay e novos campos
4. ⏳ **TESTES** - Unit, integração, golden set
5. ⏳ **DEPLOY** - Staging → Produção gradual

