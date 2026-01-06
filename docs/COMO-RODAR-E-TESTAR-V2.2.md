# 🚀 COMO RODAR E TESTAR V2.2

## 1. PREPARAÇÃO

### 1.1. Verificar Variáveis de Ambiente

```bash
# Verificar se .env.local existe
cat .env.local | grep -E "(GOOGLE_AI_STUDIO_API_KEY|OPENAI_API_KEY|DEFAULT_QUALITY_TIER)"
```

**Variáveis obrigatórias:**
```env
# Gemini (obrigatório para geração de imagens)
GOOGLE_AI_STUDIO_API_KEY="your-google-ai-studio-api-key-here"

# OpenAI (obrigatório para copy e scoring)
OPENAI_API_KEY="sk-..."

# Feature Flags V2.2 (opcionais - defaults seguros)
DEFAULT_QUALITY_TIER="draft"
DEFAULT_INCLUDE_TEXT_IN_IMAGE="false"
FEATURE_IMAGE_OVERLAY="true"
FEATURE_REFINE_PASS="true"
FEATURE_VISION_SCORING="true"
VISION_SCORING_MODEL="gpt-4o"
ENABLE_GEMINI_EXPERIMENTAL="false"
```

### 1.2. Instalar Dependências (se necessário)

```bash
npm install
```

---

## 2. VERIFICAÇÃO DE COMPILAÇÃO

### 2.1. TypeScript Check

```bash
npm run typecheck
```

**Esperado:** Sem erros de tipo.

### 2.2. Build (opcional - para verificar erros de build)

```bash
npm run build
```

**Esperado:** Build completo sem erros.

---

## 3. TESTES UNITÁRIOS

### 3.1. Testes de Feature Flags

```bash
npm run test tests/image-generation/feature-flags.test.ts
```

**Esperado:**
```
✓ deve usar defaults quando nenhum override fornecido
✓ deve priorizar request sobre env
✓ deve priorizar env sobre default
✓ deve priorizar tenant sobre env
✓ deve priorizar request sobre tenant
```

### 3.2. Testes de Prompt Builder

```bash
npm run test tests/image-generation/prompt-builder.test.ts
```

**Esperado:**
```
✓ deve incluir negativos obrigatórios no prompt conceitual
✓ deve incluir negativos obrigatórios no prompt comercial
✓ deve incluir safe area quando includeTextInImage=false
✓ deve incluir direção técnica (lente, ambiente, iluminação)
✓ deve variar estilo baseado em variation
✓ deve incluir características de referências quando fornecidas
```

### 3.3. Todos os Testes

```bash
npm run test
```

---

## 4. INICIAR SERVIDOR DE DESENVOLVIMENTO

### 4.1. Iniciar Dev Server

```bash
npm run dev
```

**Esperado:** Servidor rodando em `http://localhost:4000`

### 4.2. Verificar Logs

No terminal, você deve ver:
```
✓ Ready on http://localhost:4000
```

---

## 5. TESTAR VIA INTERFACE WEB

### 5.1. Acessar Página de Criativos

1. Abra o navegador: `http://localhost:4000`
2. Faça login (se necessário)
3. Navegue para: `http://localhost:4000/criativos`

### 5.2. Teste Básico (Draft)

1. **Prompt Principal:**
   ```
   Crie uma imagem publicitária de alta conversão para anúncio digital promovendo um Walmart Gift Card. Uma mulher sorrindo segurando um cartão presente Walmart, fundo azul e amarelo vibrante, estilo publicitário comercial, alto contraste, cores vibrantes, design impactante, foco em conversão.
   ```

2. **Configurações:**
   - Qualidade: **Draft (Rápido)**
   - Incluir texto na imagem: **Desmarcado** (padrão)
   - Configurações Avançadas:
     - Proporção: **9:16** (Story/Reel)
     - Variações: **2**

3. Clique em **"Gerar Imagens"**

**Esperado:**
- ✅ Geração concluída em ~10-30 segundos
- ✅ 2 imagens geradas (1 conceitual + 1 comercial)
- ✅ Metadata com timing e custo estimado

### 5.3. Teste Avançado (Production)

1. **Prompt Principal:** (mesmo do teste básico)

2. **Configurações:**
   - Qualidade: **Production (Alta Qualidade)**
   - Incluir texto na imagem: **Desmarcado**
   - Configurações Avançadas:
     - Proporção: **9:16**
     - Variações: **4**

3. Clique em **"Gerar Imagens"**

**Esperado:**
- ✅ Geração concluída em ~30-60 segundos
- ✅ 4 imagens geradas (2 conceituais + 2 comerciais)
- ✅ **Melhor Imagem** destacada com score (se scoring ativo)
- ✅ Metadata completo (timing, custo, modelo, fallback)

---

## 6. TESTAR VIA API (cURL/Postman)

### 6.1. Teste Básico (Draft)

```bash
curl -X POST http://localhost:4000/api/creative/generate \
  -H "Content-Type: application/json" \
  -d '{
    "mainPrompt": "Crie uma imagem publicitária de alta conversão para anúncio digital promovendo um Walmart Gift Card. Uma mulher sorrindo segurando um cartão presente Walmart, fundo azul e amarelo vibrante, estilo publicitário comercial, alto contraste, cores vibrantes, design impactante, foco em conversão.",
    "generateImage": true,
    "qualityTier": "draft",
    "includeTextInImage": false,
    "variations": 2,
    "imageRatio": "9:16"
  }'
```

**Esperado (JSON):**
```json
{
  "status": "success",
  "copy": "...",
  "imagePrompt": "...",
  "conceptualImages": [
    {
      "url": "data:image/...",
      "prompt": "...",
      "model": "gemini-imagen",
      "variation": 1
    }
  ],
  "commercialImages": [
    {
      "url": "data:image/...",
      "prompt": "...",
      "model": "gemini-imagen",
      "variation": 2
    }
  ],
  "metadata": {
    "characterCount": 123,
    "qualityTier": "draft",
    "model": "gemini-2.5-flash-image",
    "timing": {
      "prompt": 50,
      "generate": 5000,
      "total": 5050
    },
    "estimatedCost": 0.01
  }
}
```

### 6.2. Teste Production com Scoring

```bash
curl -X POST http://localhost:4000/api/creative/generate \
  -H "Content-Type: application/json" \
  -d '{
    "mainPrompt": "Crie uma imagem publicitária de alta conversão para anúncio digital promovendo um Walmart Gift Card. Uma mulher sorrindo segurando um cartão presente Walmart, fundo azul e amarelo vibrante, estilo publicitário comercial, alto contraste, cores vibrantes, design impactante, foco em conversão.",
    "generateImage": true,
    "qualityTier": "production",
    "includeTextInImage": false,
    "variations": 4,
    "imageRatio": "9:16"
  }'
```

**Esperado (JSON):**
```json
{
  "status": "success",
  "copy": "...",
  "conceptualImages": [...],
  "commercialImages": [...],
  "bestImage": {
    "url": "data:image/...",
    "index": 2,
    "score": {
      "realismo": 8.5,
      "estetica": 7.8,
      "alinhamento": 9.0,
      "limpeza": 8.2,
      "caraDeIA": 2.1,
      "total": 8.1
    }
  },
  "scoringBreakdown": {
    "realismo": { "avg": 7.8, "best": 8.5 },
    "estetica": { "avg": 7.2, "best": 7.8 },
    ...
  },
  "metadata": {
    "qualityTier": "production",
    "model": "gemini-2.5-flash-image",
    "timing": {
      "prompt": 100,
      "generate": 8000,
      "refine": 2000,
      "total": 10100
    },
    "estimatedCost": 0.02
  }
}
```

---

## 7. VERIFICAÇÃO DE LOGS

### 7.1. Logs do Servidor

No terminal do `npm run dev`, você deve ver:

**Draft:**
```
[FeatureFlags] Flags ativas: { qualityTier: { value: 'draft', source: 'request' }, ... }
[GeminiImageV2] Iniciando geração: { qualityTier: 'draft', aspectRatio: '9:16', ... }
[GeminiImageV2] Geração concluída: { model: 'gemini-2.5-flash-image', success: true, ... }
```

**Production:**
```
[FeatureFlags] Flags ativas: { qualityTier: { value: 'production', source: 'request' }, ... }
[CreativeGenerator] Gerando imagem conceptual 1/4 com Gemini V2...
[GeminiImageV2] Iniciando geração: { qualityTier: 'production', ... }
[GeminiImageV2] Geração concluída: { model: 'gemini-2.5-flash-image', ... }
[ImageScoring] Scoreando 4 imagens válidas (de 4 total) com modelo gpt-4o
[ImageScoring] Melhor imagem: { index: 2, score: { ... }, breakdown: { ... } }
[CreativeGenerator] Scoring aplicado: { bestImageIndex: 2, score: { ... } }
```

---

## 8. CHECKLIST DE VALIDAÇÃO

### ✅ Compilação
- [ ] `npm run typecheck` sem erros
- [ ] `npm run build` completo

### ✅ Testes
- [ ] Feature flags: 5/5 testes passando
- [ ] Prompt builder: 6/6 testes passando

### ✅ Funcionalidade
- [ ] Draft: 2 imagens geradas
- [ ] Production: 4 imagens geradas
- [ ] Production: Best image com score (se scoring ativo)
- [ ] Metadata completo (timing, custo, modelo)

### ✅ Logs
- [ ] Flags resolvidas corretamente
- [ ] Modelo usado: `gemini-2.5-flash-image` (STABLE)
- [ ] Scoring aplicado (production + variations > 1)

---

## 9. TROUBLESHOOTING

### Erro: "Google AI Studio API key não configurada"
**Solução:** Verificar `.env.local` com `GOOGLE_AI_STUDIO_API_KEY`

### Erro: "OpenAI API key não configurada"
**Solução:** Verificar `.env.local` com `OPENAI_API_KEY` (necessário para copy e scoring)

### Erro: "Nenhuma imagem encontrada na resposta"
**Solução:** 
- Verificar se API key do Gemini está válida
- Verificar logs para erro específico da API
- Tentar com `ENABLE_GEMINI_EXPERIMENTAL="true"` (se modelo experimental disponível)

### Erro: "Scoring falhou"
**Solução:**
- Verificar `OPENAI_API_KEY` válida
- Verificar `VISION_SCORING_MODEL="gpt-4o"` configurado
- Scoring não bloqueia geração (apenas loga warning)

### Imagens não aparecem no frontend
**Solução:**
- Verificar console do navegador (F12)
- Verificar se URLs são `data:image/...` ou `https://...`
- Verificar CORS se URLs externas

---

## 10. COMANDOS RÁPIDOS

```bash
# Verificar variáveis de ambiente
cat .env.local | grep -E "(GOOGLE_AI_STUDIO_API_KEY|OPENAI_API_KEY|DEFAULT_QUALITY_TIER)"

# Typecheck
npm run typecheck

# Testes
npm run test tests/image-generation/

# Dev server
npm run dev

# Build
npm run build
```

---

**Pronto para testar!** 🚀





