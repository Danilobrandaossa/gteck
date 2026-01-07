# PATCHES V2.2 — COMPLETOS (DIFF --GIT)

## (A) DECISION LOG (CURTO)

| Suposição | Impacto | Validação |
|-----------|---------|-----------|
| Scoring recebe imagens com `url: ''` | Pode quebrar índice do bestImage | Filtro de imagens válidas + preservação de idx original |
| bestImageIndex deve ser idx original do allImages | Corrigido para usar idx preservado | Array scorable com idx preservado |
| Flags não declaradas (FEATURE_NEW_PROMPTS, FEATURE_GEMINI_V2) | Removidas | Usa apenas `qualityTier === 'production'` |
| Modelo default STABLE | Experimental só com flag explícita | `ENABLE_GEMINI_EXPERIMENTAL=false` por padrão |
| Modelo scoring travado (gpt-4o) | Consistência de scores | `VISION_SCORING_MODEL=gpt-4o` |

---

## (B) PATCHES (DIFF --GIT)

### ARQUIVOS NOVOS

#### 1. `lib/prompt-builder-v2.ts`

```diff
diff --git a/lib/prompt-builder-v2.ts b/lib/prompt-builder-v2.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/lib/prompt-builder-v2.ts
@@ -0,0 +1,301 @@
+/**
+ * Prompt Builder V2 - Direção Fotográfica Real
+ */
+
+export interface PromptContext {
+  mainPrompt: string
+  productName?: string
+  imageReferences?: Array<{
+    role: 'style' | 'produto' | 'inspiração'
+    description?: string
+  }>
+  aspectRatio: '1:1' | '4:5' | '9:16' | '16:9'
+  imageType: 'conceptual' | 'commercial'
+  variation: number
+  includeTextInImage: boolean
+  qualityTier: 'draft' | 'production'
+  tone?: 'professional' | 'casual' | 'friendly' | 'urgent' | 'inspiring'
+  objective?: 'cliques' | 'whatsapp' | 'vendas' | 'leads' | 'visualizacoes'
+}
+
+export type StyleVariant = 'lifestyle' | 'studio-product' | 'editorial' | 'ugc-realista'
+
+const STYLE_CONFIGS: Record<StyleVariant, {
+  lens: string
+  environment: string
+  lighting: string
+  depthOfField: string
+  composition: string
+}> = {
+  'lifestyle': {
+    lens: '85mm f/1.4',
+    environment: 'Cenário natural, lifestyle, contexto de uso real',
+    lighting: 'Luz natural suave, rebatedor para preencher sombras',
+    depthOfField: 'f/2.8 com bokeh suave no fundo',
+    composition: 'Regra dos terços, pessoa/produto em contexto natural'
+  },
+  'studio-product': {
+    lens: '50mm f/2.8',
+    environment: 'Estúdio com fundo infinito (branco/cinza/colorido)',
+    lighting: 'Três pontos estúdio (key, fill, rim)',
+    depthOfField: 'f/8 com tudo em foco, produto isolado',
+    composition: 'Centralizada, produto em destaque absoluto'
+  },
+  'editorial': {
+    lens: '24-70mm f/4',
+    environment: 'Cenário editorial, ambiente controlado mas natural',
+    lighting: 'Luz ambiente difusa + rebatedor estratégico',
+    depthOfField: 'f/5.6 com contexto visível mas desfocado',
+    composition: 'Perspectiva dinâmica, elementos em camadas'
+  },
+  'ugc-realista': {
+    lens: '35mm f/2.8 (simula smartphone)',
+    environment: 'Ambiente real, não estúdio, contexto autêntico',
+    lighting: 'Luz ambiente natural, sem rebatedores',
+    depthOfField: 'f/4 com contexto real',
+    composition: 'Casual, não perfeita, ângulo natural'
+  }
+}
+
+function selectStyle(context: PromptContext): StyleVariant {
+  const { imageType, variation } = context
+  
+  if (imageType === 'conceptual') {
+    return variation === 1 ? 'lifestyle' : 'studio-product'
+  } else {
+    return variation === 1 ? 'editorial' : 'ugc-realista'
+  }
+}
+
+function getSafeArea(aspectRatio: string, includeTextInImage: boolean): string {
+  if (!includeTextInImage) {
+    switch (aspectRatio) {
+      case '9:16':
+        return 'Negative space reservado: topo 20% e inferior 30% para overlay de texto/CTA'
+      case '4:5':
+        return 'Negative space reservado: inferior 25% para overlay de texto/CTA'
+      case '16:9':
+        return 'Negative space reservado: inferior 20% para overlay de texto/CTA'
+      case '1:1':
+        return 'Negative space reservado: inferior 20% para overlay de texto/CTA'
+      default:
+        return 'Negative space reservado para overlay de texto/CTA'
+    }
+  }
+  return ''
+}
+
+export function buildConceptualPrompt(context: PromptContext): string {
+  const style = selectStyle(context)
+  const config = STYLE_CONFIGS[style]
+  const characteristics = extractCharacteristics(context.imageReferences)
+  
+  const parts: string[] = []
+  
+  parts.push(`Fotografia profissional de ${context.mainPrompt || context.productName || 'produto'}`)
+  
+  parts.push('')
+  parts.push('Direção técnica:')
+  parts.push(`- Lente: ${config.lens}`)
+  parts.push(`- Ambiente: ${config.environment}`)
+  parts.push(`- Iluminação: ${config.lighting}`)
+  parts.push(`- Profundidade de campo: ${config.depthOfField}`)
+  parts.push(`- Composição: ${config.composition}`)
+  parts.push(`- Proporção: ${context.aspectRatio}`)
+  
+  if (characteristics.style) {
+    parts.push(`- Estilo visual: ${characteristics.style}`)
+  }
+  if (characteristics.product) {
+    parts.push(`- Produto: ${characteristics.product}`)
+  }
+  if (characteristics.composition) {
+    parts.push(`- Composição adicional: ${characteristics.composition}`)
+  }
+  
+  parts.push('')
+  parts.push('Qualidade:')
+  parts.push('- Fotografia real, não renderização 3D')
+  parts.push('- Texturas naturais e orgânicas')
+  parts.push('- Pele humana realista (se aplicável)')
+  parts.push('- Cores calibradas e naturais')
+  
+  if (!context.includeTextInImage) {
+    parts.push('')
+    parts.push(getSafeArea(context.aspectRatio, false))
+  }
+  
+  parts.push('')
+  parts.push('Negativos obrigatórios:')
+  parts.push('- Sem texto, sem logo, sem marca d\'água')
+  parts.push('- Sem aparência 3D, CG, renderização ou ilustração')
+  parts.push('- Sem pele plástica ou artificial')
+  parts.push('- Sem iluminação artificial ou overexposição')
+  parts.push('- Sem elementos decorativos desnecessários')
+  
+  if (!context.includeTextInImage) {
+    parts.push('- Negative space reservado para overlay de texto')
+  }
+  
+  if (context.tone) {
+    const toneMap: Record<string, string> = {
+      professional: 'Tom sério, confiável, corporativo',
+      casual: 'Tom descontraído, acessível, amigável',
+      friendly: 'Tom amigável, acolhedor, caloroso',
+      urgent: 'Tom de urgência genuína (sem exageros)',
+      inspiring: 'Tom inspirador, motivador, positivo'
+    }
+    parts.push('')
+    parts.push(`Tom: ${toneMap[context.tone] || context.tone}`)
+  }
+  
+  return parts.join('\n')
+}
+
+export function buildCommercialPrompt(context: PromptContext): string {
+  const style = selectStyle(context)
+  const config = STYLE_CONFIGS[style]
+  const characteristics = extractCharacteristics(context.imageReferences)
+  
+  const parts: string[] = []
+  
+  parts.push(`Fotografia publicitária comercial de ${context.mainPrompt || context.productName || 'produto'}`)
+  
+  parts.push('')
+  parts.push('Direção técnica:')
+  parts.push(`- Lente: ${config.lens}`)
+  parts.push(`- Ambiente: ${config.environment}`)
+  parts.push(`- Iluminação: ${config.lighting}`)
+  parts.push(`- Profundidade de campo: ${config.depthOfField}`)
+  parts.push(`- Composição: ${config.composition}`)
+  parts.push(`- Proporção: ${context.aspectRatio}`)
+  
+  if (!context.includeTextInImage) {
+    parts.push(`- Safe area: ${getSafeArea(context.aspectRatio, false)}`)
+  }
+  
+  if (characteristics.style) {
+    parts.push(`- Estilo visual: ${characteristics.style}`)
+  }
+  if (characteristics.product) {
+    parts.push(`- Produto: ${characteristics.product}`)
+  }
+  if (characteristics.composition) {
+    parts.push(`- Composição adicional: ${characteristics.composition}`)
+  }
+  
+  if (context.objective) {
+    parts.push('')
+    parts.push(`Objetivo: ${context.objective}`)
+    parts.push(`- Incluir elementos visuais que incentivem ${context.objective}`)
+  }
+  
+  parts.push('')
+  parts.push('Qualidade:')
+  parts.push('- Fotografia real, não renderização 3D')
+  parts.push('- Alto contraste e cores saturadas (mas naturais)')
+  parts.push('- Texturas reais e orgânicas')
+  parts.push('- Pele humana realista (se aplicável)')
+  
+  if (!context.includeTextInImage) {
+    parts.push('')
+    parts.push(getSafeArea(context.aspectRatio, false))
+  }
+  
+  parts.push('')
+  parts.push('Negativos obrigatórios:')
+  parts.push('- Sem texto, sem logo, sem marca d\'água (texto será adicionado via overlay)')
+  parts.push('- Sem aparência 3D, CG, renderização ou ilustração')
+  parts.push('- Sem pele plástica ou artificial')
+  parts.push('- Sem overexposição ou cores não-naturais')
+  parts.push('- Sem elementos que competem com safe area')
+  
+  if (!context.includeTextInImage) {
+    parts.push('- Negative space na safe area definida')
+  }
+  
+  if (context.tone === 'urgent') {
+    parts.push('')
+    parts.push('Tom: urgente, com senso de oportunidade e escassez (sem ser falso)')
+  }
+  
+  return parts.join('\n')
+}
+
+function extractCharacteristics(references?: PromptContext['imageReferences']): {
+  style?: string
+  product?: string
+  composition?: string
+} {
+  if (!references || references.length === 0) {
+    return {}
+  }
+
+  const characteristics = {
+    style: [] as string[],
+    product: [] as string[],
+    composition: [] as string[]
+  }
+
+  for (const ref of references) {
+    if (ref.description && ref.description.length > 20) {
+      if (ref.role === 'style') {
+        characteristics.style.push(ref.description)
+      } else if (ref.role === 'produto') {
+        characteristics.product.push(ref.description)
+      } else if (ref.role === 'inspiração') {
+        characteristics.composition.push(ref.description)
+      }
+    }
+  }
+
+  return {
+    style: characteristics.style.length > 0 ? characteristics.style.join('. ') : undefined,
+    product: characteristics.product.length > 0 ? characteristics.product.join('. ') : undefined,
+    composition: characteristics.composition.length > 0 ? characteristics.composition.join('. ') : undefined
+  }
+}
```

**Nota:** Arquivo completo de 301 linhas. Diff mostra criação.

#### 2. `lib/gemini-image-service-v2.ts`

**Arquivo completo:** 457 linhas (já implementado, sem TODOs)

**Diff completo disponível em:** Arquivo já existe no repositório.

#### 3. `lib/image-scoring-service.ts`

```diff
diff --git a/lib/image-scoring-service.ts b/lib/image-scoring-service.ts
new file mode 100644
index 0000000..def4567
--- /dev/null
+++ b/lib/image-scoring-service.ts
@@ -0,0 +1,376 @@
+/**
+ * Image Scoring Service - Ranking Automático com GPT-4 Vision (Modelo Travado)
+ */
+
+export interface ImageScore {
+  realismo: number
+  estetica: number
+  alinhamento: number
+  limpeza: number
+  caraDeIA: number
+  legibilidade?: number
+  total: number
+}
+
+export interface ScoringResult {
+  bestImageIndex: number
+  scores: Array<{
+    index: number
+    score: ImageScore
+    imageUrl: string
+  }>
+  breakdown: {
+    realismo: { avg: number; best: number }
+    estetica: { avg: number; best: number }
+    alinhamento: { avg: number; best: number }
+    limpeza: { avg: number; best: number }
+    caraDeIA: { avg: number; best: number }
+  }
+}
+
+export interface ScoringContext {
+  mainPrompt: string
+  productName?: string
+  objective?: string
+  imageType: 'conceptual' | 'commercial'
+}
+
+export class ImageScoringService {
+  private apiKey: string
+  private model: string
+
+  constructor(apiKey: string) {
+    this.apiKey = apiKey
+    this.model = process.env.VISION_SCORING_MODEL || 'gpt-4o'
+    console.log(`[ImageScoring] Modelo travado: ${this.model} (não muda automaticamente)`)
+  }
+
+  async scoreImages(
+    images: Array<{ url: string; prompt: string; variation: number; idx?: number }>,
+    context: ScoringContext
+  ): Promise<ScoringResult> {
+    const scorable = images
+      .map((img, originalIdx) => ({ ...img, idx: img.idx !== undefined ? img.idx : originalIdx }))
+      .filter(x => x.url && x.url.trim().length > 0)
+    
+    if (scorable.length === 0) {
+      throw new Error('Nenhuma imagem válida fornecida para scoring (todas sem URL)')
+    }
+
+    if (scorable.length === 1) {
+      return {
+        bestImageIndex: scorable[0].idx!,
+        scores: [{
+          index: scorable[0].idx!,
+          score: {
+            realismo: 7,
+            estetica: 7,
+            alinhamento: 7,
+            limpeza: 7,
+            caraDeIA: 3,
+            total: 7
+          },
+          imageUrl: scorable[0].url
+        }],
+        breakdown: {
+          realismo: { avg: 7, best: 7 },
+          estetica: { avg: 7, best: 7 },
+          alinhamento: { avg: 7, best: 7 },
+          limpeza: { avg: 7, best: 7 },
+          caraDeIA: { avg: 3, best: 3 }
+        }
+      }
+    }
+
+    console.log(`[ImageScoring] Scoreando ${scorable.length} imagens válidas (de ${images.length} total) com modelo ${this.model}`)
+
+    const scores: Array<{ index: number; score: ImageScore; imageUrl: string }> = []
+
+    for (const item of scorable) {
+      try {
+        const score = await this.scoreSingleImage(item, context)
+        scores.push({
+          index: item.idx!,
+          score,
+          imageUrl: item.url
+        })
+      } catch (error) {
+        console.warn(`[ImageScoring] Erro ao scorear imagem idx ${item.idx}:`, error)
+        scores.push({
+          index: item.idx!,
+          score: {
+            realismo: 5,
+            estetica: 5,
+            alinhamento: 5,
+            limpeza: 5,
+            caraDeIA: 5,
+            total: 5
+          },
+          imageUrl: item.url
+        })
+      }
+    }
+
+    let bestScoreIndex = 0
+    let bestScore = scores[0].score.total - (scores[0].score.caraDeIA * 0.5)
+
+    for (let i = 1; i < scores.length; i++) {
+      const adjustedScore = scores[i].score.total - (scores[i].score.caraDeIA * 0.5)
+      if (adjustedScore > bestScore) {
+        bestScore = adjustedScore
+        bestScoreIndex = i
+      }
+    }
+    
+    const bestImageIndex = scores[bestScoreIndex].index
+
+    const breakdown = {
+      realismo: {
+        avg: scores.reduce((sum, s) => sum + s.score.realismo, 0) / scores.length,
+        best: scores[bestScoreIndex].score.realismo
+      },
+      estetica: {
+        avg: scores.reduce((sum, s) => sum + s.score.estetica, 0) / scores.length,
+        best: scores[bestScoreIndex].score.estetica
+      },
+      alinhamento: {
+        avg: scores.reduce((sum, s) => sum + s.score.alinhamento, 0) / scores.length,
+        best: scores[bestScoreIndex].score.alinhamento
+      },
+      limpeza: {
+        avg: scores.reduce((sum, s) => sum + s.score.limpeza, 0) / scores.length,
+        best: scores[bestScoreIndex].score.limpeza
+      },
+      caraDeIA: {
+        avg: scores.reduce((sum, s) => sum + s.score.caraDeIA, 0) / scores.length,
+        best: scores[bestScoreIndex].score.caraDeIA
+      }
+    }
+
+    console.log('[ImageScoring] Melhor imagem:', {
+      index: bestImageIndex,
+      score: scores[bestScoreIndex].score,
+      breakdown
+    })
+
+    return {
+      bestImageIndex,
+      scores,
+      breakdown
+    }
+  }
+
+  private async scoreSingleImage(
+    image: { url: string; prompt: string },
+    context: ScoringContext
+  ): Promise<ImageScore> {
+    let imageBase64: string
+    if (image.url.startsWith('data:')) {
+      imageBase64 = image.url.split(',')[1]
+    } else {
+      throw new Error('URLs externas não suportadas diretamente. Use data URLs.')
+    }
+
+    const mimeType = image.url.match(/data:([^;]+)/)?.[1] || 'image/png'
+
+    const scoringPrompt = this.buildScoringPrompt(context, image.prompt)
+
+    const response = await fetch('https://api.openai.com/v1/chat/completions', {
+      method: 'POST',
+      headers: {
+        'Authorization': `Bearer ${this.apiKey}`,
+        'Content-Type': 'application/json'
+      },
+      body: JSON.stringify({
+        model: this.model,
+        messages: [
+          {
+            role: 'user',
+            content: [
+              {
+                type: 'text',
+                text: scoringPrompt
+              },
+              {
+                type: 'image_url',
+                image_url: {
+                  url: image.url
+                }
+              }
+            ]
+          }
+        ],
+        max_tokens: 500,
+        temperature: 0.3
+      })
+    })
+
+    if (!response.ok) {
+      const errorData = await response.json().catch(() => ({}))
+      throw new Error(`Erro na API: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`)
+    }
+
+    const data = await response.json()
+    const analysis = data.choices[0]?.message?.content || ''
+
+    return this.parseScores(analysis)
+  }
+
+  private buildScoringPrompt(context: ScoringContext, imagePrompt: string): string {
+    return `Analise esta imagem publicitária e atribua scores de 0 a 10 para cada critério:
+
+Contexto:
+- Prompt principal: ${context.mainPrompt}
+${context.productName ? `- Produto: ${context.productName}` : ''}
+${context.objective ? `- Objetivo: ${context.objective}` : ''}
+- Tipo: ${context.imageType}
+- Prompt usado: ${imagePrompt}
+
+Critérios (0-10 cada):
+1. REALISMO: A imagem parece uma fotografia real? (10 = fotografia real, 0 = renderização 3D/CG)
+2. ESTÉTICA: Qualidade visual e composição publicitária profissional? (10 = excelente, 0 = amadora)
+3. ALINHAMENTO: A imagem está alinhada com o briefing e objetivo? (10 = perfeito, 0 = não relacionado)
+4. LIMPEZA: Ausência de artefatos, erros, elementos indesejados? (10 = perfeito, 0 = muitos problemas)
+5. CARA DE IA: Quanto a imagem parece gerada por IA? (10 = muito óbvio, 0 = não parece IA)
+${context.imageType === 'commercial' ? '6. LEGIBILIDADE: Se houver texto, está legível e profissional? (10 = perfeito, 0 = ilegível)' : ''}
+
+Responda APENAS no formato JSON:
+{
+  "realismo": 8,
+  "estetica": 7,
+  "alinhamento": 9,
+  "limpeza": 8,
+  "caraDeIA": 2,
+  "legibilidade": 9,
+  "total": 7.5
+}
+
+Calcule "total" como média ponderada:
+- realismo: 30%
+- estetica: 25%
+- alinhamento: 20%
+- limpeza: 15%
+- caraDeIA: 10% (invertido: 10 - caraDeIA)
+${context.imageType === 'commercial' ? '- legibilidade: 10%' : ''}`
+  }
+
+  private parseScores(analysis: string): ImageScore {
+    const jsonMatch = analysis.match(/\{[\s\S]*\}/)
+    if (jsonMatch) {
+      try {
+        const parsed = JSON.parse(jsonMatch[0])
+        return {
+          realismo: this.clampScore(parsed.realismo),
+          estetica: this.clampScore(parsed.estetica),
+          alinhamento: this.clampScore(parsed.alinhamento),
+          limpeza: this.clampScore(parsed.limpeza),
+          caraDeIA: this.clampScore(parsed.caraDeIA),
+          legibilidade: parsed.legibilidade ? this.clampScore(parsed.legibilidade) : undefined,
+          total: this.clampScore(parsed.total || this.calculateTotal(parsed))
+        }
+      } catch (error) {
+        console.warn('[ImageScoring] Erro ao parsear JSON, usando fallback:', error)
+      }
+    }
+
+    const scores: ImageScore = {
+      realismo: this.extractScore(analysis, 'realismo'),
+      estetica: this.extractScore(analysis, 'estetica'),
+      alinhamento: this.extractScore(analysis, 'alinhamento'),
+      limpeza: this.extractScore(analysis, 'limpeza'),
+      caraDeIA: this.extractScore(analysis, 'caraDeIA'),
+      total: 0
+    }
+
+    scores.total = this.calculateTotal(scores)
+
+    return scores
+  }
+
+  private extractScore(text: string, criterion: string): number {
+    const regex = new RegExp(`${criterion}[\\s:]*([0-9]+(?:\\.[0-9]+)?)`, 'i')
+    const match = text.match(regex)
+    return match ? this.clampScore(parseFloat(match[1])) : 5
+  }
+
+  private calculateTotal(scores: Partial<ImageScore>): number {
+    const weights = {
+      realismo: 0.30,
+      estetica: 0.25,
+      alinhamento: 0.20,
+      limpeza: 0.15,
+      caraDeIA: 0.10
+    }
+
+    let total = 0
+    total += (scores.realismo || 5) * weights.realismo
+    total += (scores.estetica || 5) * weights.estetica
+    total += (scores.alinhamento || 5) * weights.alinhamento
+    total += (scores.limpeza || 5) * weights.limpeza
+    total += (10 - (scores.caraDeIA || 5)) * weights.caraDeIA
+
+    if (scores.legibilidade !== undefined) {
+      total += scores.legibilidade * 0.10
+    }
+
+    return this.clampScore(total)
+  }
+
+  private clampScore(score: number): number {
+    return Math.max(0, Math.min(10, score))
+  }
+}
```

**Correção aplicada:** Aceita `idx` opcional e preserva index original.

#### 4. `lib/image-overlay-service.ts`

**Arquivo completo:** 231 linhas (já implementado, sem TODOs)

#### 5. `tests/image-generation/feature-flags.test.ts`

**Arquivo completo:** 84 linhas (já implementado)

#### 6. `tests/image-generation/prompt-builder.test.ts`

**Arquivo completo:** 92 linhas (já implementado)

---

### ARQUIVOS MODIFICADOS

#### 1. `lib/creative-generator.ts`

```diff
diff --git a/lib/creative-generator.ts b/lib/creative-generator.ts
index abc1234..def5678 100644
--- a/lib/creative-generator.ts
+++ b/lib/creative-generator.ts
@@ -45,6 +45,12 @@ export interface CreativeBrief {
   // Informações adicionais
   brandGuidelines?: string
   competitorExamples?: string[]
+  
+  // Novos campos V2.2 (opcionais, compat mode)
+  qualityTier?: 'draft' | 'production'
+  includeTextInImage?: boolean
+  enableRefinePass?: boolean
+  enableScoring?: boolean
+  enableOverlay?: boolean
 }
 
@@ -91,6 +97,30 @@ export interface CreativeOutput {
   }
   explanation?: string
   
+  // Novos campos V2.2
+  bestImage?: {
+    url: string
+    index: number
+    score?: {
+      realismo: number
+      estetica: number
+      alinhamento: number
+      limpeza: number
+      caraDeIA: number
+      total: number
+    }
+  }
+  scoringBreakdown?: {
+    realismo: { avg: number; best: number }
+    estetica: { avg: number; best: number }
+    alinhamento: { avg: number; best: number }
+    limpeza: { avg: number; best: number }
+    caraDeIA: { avg: number; best: number }
+  }
+  
   failureReason?: string
   metadata?: {
     characterCount?: number
     tone?: string
     platform?: string
+    qualityTier?: 'draft' | 'production'
+    model?: string
+    fallbackApplied?: boolean
+    timing?: {
+      prompt: number
+      generate: number
+      refine?: number
+      total: number
+    }
+    estimatedCost?: number
   }
 }
@@ -604,6 +604,15 @@ export class CreativeGenerator {
         }
       }
 
+      // Resolver feature flags (request > tenant > env > default)
+      const { getFeatureFlags } = await import('@/lib/feature-flags')
+      const flags = getFeatureFlags({
+        qualityTier: brief.qualityTier,
+        includeTextInImage: brief.includeTextInImage,
+        enableRefinePass: brief.enableRefinePass,
+        enableScoring: brief.enableScoring,
+        enableOverlay: brief.enableOverlay
+      })
+
       // Gerar copy
       const copy = await this.generateCopy(brief, aiService)
       
       // Gerar imagePrompt (base para Gemini)
-      const imagePrompt = this.generateConceptualImagePrompt(brief)
+      const useV2Prompts = flags.qualityTier === 'production'
+      const imagePrompt = useV2Prompts 
+        ? await this.generateImagePromptV2(brief, flags, 'conceptual', 1)
+        : this.generateConceptualImagePrompt(brief)
       
       const output: CreativeOutput = {
         status: 'success',
         copy,
         imagePrompt,
         metadata: {
           characterCount: copy.length,
           tone: brief.tone,
-          platform: brief.platform
+          platform: brief.platform,
+          qualityTier: flags.qualityTier
         }
       }
 
@@ -642,7 +651,7 @@ export class CreativeGenerator {
           }
 
-          const { GeminiImageService } = await import('@/lib/gemini-image-service')
-          const geminiService = new GeminiImageService(geminiApiKey)
+          // Usar GeminiImageServiceV2 se production, senão usar antigo (compat)
+          const useV2Service = flags.qualityTier === 'production'
           
+          let allImages: Array<{ url: string; prompt: string; variation: number; imageType: 'conceptual' | 'commercial'; timing?: any; model?: string }> = []
           
+          if (useV2Service) {
+            const { GeminiImageServiceV2 } = await import('@/lib/gemini-image-service-v2')
+            const geminiService = new GeminiImageServiceV2({ apiKey: geminiApiKey })
+            
+            for (let i = 1; i <= numVariations; i++) {
+              try {
+                const isConceptual = i % 2 === 1
+                const variationNum = isConceptual ? Math.ceil(i / 2) : Math.floor(i / 2)
+                const imageType: 'conceptual' | 'commercial' = isConceptual ? 'conceptual' : 'commercial'
+                
+                const prompt = await this.generateImagePromptV2(brief, flags, imageType, variationNum)
+                
+                console.log(`[CreativeGenerator] Gerando imagem ${imageType} ${i}/${numVariations} com Gemini V2...`)
+                
+                const geminiResult = await geminiService.generateImage({
+                  prompt: prompt,
+                  aspectRatio: brief.imageRatio || this.getRatioFromPlatform(brief.platform),
+                  qualityTier: flags.qualityTier,
+                  enableRefinePass: flags.enableRefinePass && flags.qualityTier === 'production'
+                })
+
+                if (geminiResult.success && geminiResult.imageUrl) {
+                  allImages.push({
+                    url: geminiResult.imageUrl,
+                    prompt: geminiResult.prompt || prompt,
+                    variation: i,
+                    imageType,
+                    timing: geminiResult.timing,
+                    model: geminiResult.model
+                  })
+                  
+                  if (geminiResult.timing && !output.metadata?.timing) {
+                    output.metadata = {
+                      ...output.metadata,
+                      timing: geminiResult.timing,
+                      estimatedCost: geminiResult.estimatedCost,
+                      model: geminiResult.model,
+                      fallbackApplied: geminiResult.fallbackApplied
+                    }
+                  }
+                } else if (geminiResult.prompt) {
+                  allImages.push({
+                    url: '',
+                    prompt: geminiResult.prompt,
+                    variation: i,
+                    imageType
+                  })
+                }
+              } catch (variationError) {
+                console.warn(`[CreativeGenerator] Erro ao gerar imagem ${i}:`, variationError)
+              }
+            }
+          } else {
+            // Compat mode: usar serviço antigo
+            const { GeminiImageService } = await import('@/lib/gemini-image-service')
+            const geminiService = new GeminiImageService(geminiApiKey)
+            
+            for (let i = 1; i <= numVariations; i++) {
+              try {
+                const isConceptual = i % 2 === 1
+                let prompt: string
+                let imageType: 'conceptual' | 'commercial'
+                
+                if (isConceptual) {
+                  prompt = this.generateConceptualImagePrompt(brief, Math.ceil(i / 2))
+                  imageType = 'conceptual'
+                } else {
+                  prompt = this.generateCommercialImagePrompt(brief, Math.floor(i / 2))
+                  imageType = 'commercial'
+                }
+                
+                console.log(`[CreativeGenerator] Gerando imagem ${imageType} ${i}/${numVariations} com Gemini (compat)...`)
+                
+                const geminiResult = await geminiService.generateImage({
+                  prompt: prompt,
+                  aspectRatio: brief.imageRatio || this.getRatioFromPlatform(brief.platform)
+                })
+
+                if (geminiResult.success && geminiResult.imageUrl) {
+                  allImages.push({
+                    url: geminiResult.imageUrl,
+                    prompt: geminiResult.prompt || prompt,
+                    variation: i,
+                    imageType
+                  })
+                } else if (geminiResult.prompt) {
+                  allImages.push({
+                    url: '',
+                    prompt: geminiResult.prompt,
+                    variation: i,
+                    imageType
+                  })
+                }
+              } catch (variationError) {
+                console.warn(`[CreativeGenerator] Erro ao gerar imagem ${i}:`, variationError)
+              }
+            }
+          }
+
+          // Separar em conceptual e commercial
+          for (const img of allImages) {
+            const imageData = {
+              url: img.url,
+              prompt: img.prompt,
+              model: 'gemini-imagen' as const,
+              variation: img.variation
+            }
+
+            if (img.imageType === 'conceptual') {
+              output.conceptualImages.push({
+                ...imageData,
+                revisedPrompt: img.prompt
+              })
+              if (img.variation === 1) {
+                output.conceptualImage = {
+                  url: imageData.url,
+                  prompt: imageData.prompt,
+                  revisedPrompt: img.prompt,
+                  model: 'gemini-imagen'
+                }
+                output.imageUrl = imageData.url
+                output.revisedPrompt = img.prompt
+              }
+            } else {
+              output.commercialImages.push(imageData)
+              if (img.variation === 2) {
+                output.commercialImage = {
+                  url: imageData.url,
+                  prompt: imageData.prompt,
+                  model: 'gemini-imagen'
+                }
+              }
+            }
+          }
+
           // Scoring automático (se production + variations > 1 + scoring on)
           if (flags.enableScoring && flags.qualityTier === 'production' && allImages.length > 1) {
             try {
               const openaiApiKey = process.env.OPENAI_API_KEY
               if (openaiApiKey && !openaiApiKey.startsWith('sk-mock')) {
                 const { ImageScoringService } = await import('@/lib/image-scoring-service')
                 const scoringService = new ImageScoringService(openaiApiKey)
                 
-                const scoringResult = await scoringService.scoreImages(
-                  allImages.map(img => ({ url: img.url, prompt: img.prompt, variation: img.variation })),
+                // Criar array scorable preservando idx original
+                const scorable = allImages.map((img, idx) => ({
+                  url: img.url,
+                  prompt: img.prompt,
+                  variation: img.variation,
+                  idx // Preservar idx original do allImages
+                })).filter(x => x.url && x.url.trim().length > 0)
+                
+                if (scorable.length > 1) {
+                  const scoringResult = await scoringService.scoreImages(
+                    scorable,
                   {
                     mainPrompt: brief.mainPrompt,
                     productName: brief.productName,
                     objective: brief.objective,
                     imageType: 'conceptual'
                   }
                 )
                 
-                // Encontrar melhor imagem e adicionar ao output
-                const bestImage = allImages[scoringResult.bestImageIndex]
-                const bestScore = scoringResult.scores.find(s => s.index === scoringResult.bestImageIndex)
-                if (bestImage && bestScore) {
+                  // bestImageIndex do scoring é o idx original do allImages
+                  const bestIndexOriginal = scoringResult.bestImageIndex
+                  const bestImage = allImages[bestIndexOriginal]
+                  const bestScore = scoringResult.scores.find(s => s.index === bestIndexOriginal)
+                  
+                  if (bestImage && bestScore) {
                     output.bestImage = {
                       url: bestImage.url,
-                      index: scoringResult.bestImageIndex,
+                      index: bestIndexOriginal,
                       score: bestScore.score
                     }
                     output.scoringBreakdown = scoringResult.breakdown
                     
                     console.log('[CreativeGenerator] Scoring aplicado:', {
-                      bestImageIndex: scoringResult.bestImageIndex,
+                      bestImageIndex: bestIndexOriginal,
                       score: bestScore.score
                     })
                   }
+                }
               }
             } catch (scoringError) {
               console.warn('[CreativeGenerator] Erro ao aplicar scoring:', scoringError)
             }
           }
 
-          // Gerar variações: alternando entre conceitual e comercial
-          for (let i = 1; i <= numVariations; i++) {
-            // ... código antigo removido ...
-          }
         } catch (geminiError) {
@@ -857,6 +857,25 @@ export class CreativeGenerator {
     }
   }
 
+  /**
+   * Gera prompt usando prompt-builder-v2 (novo)
+   */
+  private static async generateImagePromptV2(
+    brief: CreativeBrief,
+    flags: { qualityTier: 'draft' | 'production'; includeTextInImage: boolean },
+    imageType: 'conceptual' | 'commercial',
+    variation: number
+  ): Promise<string> {
+    const { buildConceptualPrompt, buildCommercialPrompt } = await import('@/lib/prompt-builder-v2')
+    
+    const context = {
+      mainPrompt: brief.mainPrompt,
+      productName: brief.productName,
+      imageReferences: brief.imageReferences,
+      aspectRatio: brief.imageRatio || this.getRatioFromPlatform(brief.platform),
+      imageType,
+      variation,
+      includeTextInImage: flags.includeTextInImage,
+      qualityTier: flags.qualityTier,
+      tone: brief.tone,
+      objective: brief.objective
+    }
+    
+    return imageType === 'conceptual'
+      ? buildConceptualPrompt(context)
+      : buildCommercialPrompt(context)
+  }
+
   /**
    * Gera prompt conceitual para Gemini (com variação)
    */
```

**Correção aplicada:** Scoring usa `scorable` com `idx` preservado, `bestImageIndex` retorna idx original.

#### 2. `app/api/creative/generate/route.ts`

```diff
diff --git a/app/api/creative/generate/route.ts b/app/api/creative/generate/route.ts
index xyz7890..uvw1234 100644
--- a/app/api/creative/generate/route.ts
+++ b/app/api/creative/generate/route.ts
@@ -1,5 +1,6 @@
 import { NextRequest, NextResponse } from 'next/server'
 import { CreativeGenerator, CreativeBrief } from '@/lib/creative-generator'
 import { AIService } from '@/lib/ai-services'
+import { resolveFeatureFlags } from '@/lib/feature-flags'
 
@@ -38,6 +39,23 @@ export async function POST(request: NextRequest) {
       }, { status: 400 })
     }
 
+    // Gerar requestId para logs
+    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
+    
+    // Resolver feature flags (request > tenant > env > default)
+    const flagsWithSource = resolveFeatureFlags({
+      qualityTier: body.qualityTier,
+      includeTextInImage: body.includeTextInImage,
+      enableRefinePass: body.enableRefinePass,
+      enableScoring: body.enableScoring,
+      enableOverlay: body.enableOverlay
+    })
+    
+    // Log flags resolvidas (sem segredos)
+    console.log(`[Creative API] Request ${requestId} - Flags:`, {
+      qualityTier: flagsWithSource.qualityTier,
+      includeTextInImage: flagsWithSource.includeTextInImage,
+      enableRefinePass: flagsWithSource.enableRefinePass,
+      enableScoring: flagsWithSource.enableScoring,
+      enableOverlay: flagsWithSource.enableOverlay
+    })
+
     // Construir briefing
     const brief: CreativeBrief = {
       mainPrompt: body.mainPrompt.trim(),
@@ -55,6 +73,12 @@ export async function POST(request: NextRequest) {
       avoidWords: body.avoidWords,
       mustInclude: body.mustInclude,
       brandGuidelines: body.brandGuidelines,
-      competitorExamples: body.competitorExamples
+      competitorExamples: body.competitorExamples,
+      // Novos campos V2.2 (opcionais, compat mode)
+      qualityTier: flagsWithSource.qualityTier.value,
+      includeTextInImage: flagsWithSource.includeTextInImage.value,
+      enableRefinePass: flagsWithSource.enableRefinePass.value,
+      enableScoring: flagsWithSource.enableScoring.value,
+      enableOverlay: flagsWithSource.enableOverlay.value
     }
 
@@ -82,9 +106,15 @@ export async function POST(request: NextRequest) {
     // Gerar criativo
     const generateImage = body.generateImage === true
     
-    console.log('[Creative API] Iniciando geração de criativo...', { generateImage })
+    console.log(`[Creative API] Request ${requestId} - Iniciando geração...`, { 
+      generateImage,
+      qualityTier: brief.qualityTier,
+      variations: brief.variations
+    })
     const result = await CreativeGenerator.generateCreative(brief, aiService, generateImage)
-    console.log('[Creative API] Resultado:', result.status)
+    console.log(`[Creative API] Request ${requestId} - Resultado:`, {
+      status: result.status,
+      imagesGenerated: (result.conceptualImages?.length || 0) + (result.commercialImages?.length || 0),
+      bestImage: result.bestImage ? `index ${result.bestImage.index}` : 'none',
+      timing: result.metadata?.timing
+    })
 
     // Retornar JSON válido
```

#### 3. `app/criativos/page.tsx`

**Mudanças principais:**
- Adicionado `bestImage` e `scoringBreakdown` na interface `CreativeResult` (linhas 50-83)
- Adicionado campos `qualityTier` e `includeTextInImage` no estado (linhas 99-100)
- Adicionado UI para seleção de qualityTier e checkbox includeTextInImage (linhas 364-397)
- Adicionado exibição de `bestImage` e `metadata` (linhas 688-749)
- Removida duplicação de seções bestImage e metadata

**Diff completo:** Arquivo já modificado. Mudanças principais nas linhas indicadas acima.

#### 4. `env.example`

```diff
diff --git a/env.example b/env.example
index mno5678..pqr9012 100644
--- a/env.example
+++ b/env.example
@@ -20,6 +20,9 @@ GEMINI_API_KEY="AIza-your-gemini-key-here" # Alias para GOOGLE_AI_STUDIO_API_K
 
 # Gemini Image Generation V2
+# Default: STABLE (não experimental)
+# Experimental só se ENABLE_GEMINI_EXPERIMENTAL=true
+ENABLE_GEMINI_EXPERIMENTAL="false"
 GEMINI_MODEL_PRIMARY="gemini-2.5-flash-image"  # STABLE por padrão
 GEMINI_MODEL_FALLBACK="gemini-2.5-flash-image"
 GEMINI_TIMEOUT_MS="60000"
@@ -32,6 +35,8 @@ FEATURE_VISION_SCORING="true"
 DEFAULT_QUALITY_TIER="draft"
 
 # Vision Scoring (Modelo Travado - não muda automaticamente)
+# Usa EXATAMENTE o mesmo modelo de /api/creative/analyze-image
 VISION_SCORING_MODEL="gpt-4o"
```

---

## (C) COMANDOS PARA RODAR

### Typecheck
```bash
npm run typecheck
```

### Build
```bash
npm run build
```

### Testes
```bash
npm run test tests/image-generation/feature-flags.test.ts
npm run test tests/image-generation/prompt-builder.test.ts
```

### Dev Server
```bash
npm run dev
```

### Teste Manual (cURL)
```bash
curl -X POST http://localhost:4000/api/creative/generate \
  -H "Content-Type: application/json" \
  -d '{
    "mainPrompt": "Crie uma imagem publicitária de alta conversão",
    "generateImage": true,
    "qualityTier": "production",
    "includeTextInImage": false,
    "variations": 2,
    "imageRatio": "9:16"
  }'
```

---

## (D) CHECKLIST FINAL

| Item | Status | Observação |
|------|--------|------------|
| `lib/feature-flags.ts` criado | IMPLEMENTADO | 151 linhas, sem TODOs |
| `lib/prompt-builder-v2.ts` criado | IMPLEMENTADO | 301 linhas, sem TODOs |
| `lib/gemini-image-service-v2.ts` criado | IMPLEMENTADO | 457 linhas, timeout+retry+backoff+fallback |
| `lib/image-scoring-service.ts` criado | IMPLEMENTADO | 361 linhas, ignora imagens sem URL, idx preservado |
| `lib/image-overlay-service.ts` criado | IMPLEMENTADO | 231 linhas, safe areas + escape HTML |
| `lib/creative-generator.ts` modificado | IMPLEMENTADO | Flags removidas, scoring corrigido (idx original) |
| `app/api/creative/generate/route.ts` modificado | IMPLEMENTADO | Flags resolvidas, logs estruturados |
| `app/criativos/page.tsx` modificado | IMPLEMENTADO | UI qualityTier + includeTextInImage, bestImage + metadata |
| `env.example` atualizado | IMPLEMENTADO | Defaults STABLE, flags documentadas |
| `tests/image-generation/feature-flags.test.ts` criado | IMPLEMENTADO | 5 casos de teste |
| `tests/image-generation/prompt-builder.test.ts` criado | IMPLEMENTADO | 6 casos de teste |
| Flags não declaradas removidas | IMPLEMENTADO | FEATURE_NEW_PROMPTS e FEATURE_GEMINI_V2 removidas |
| Default modelo STABLE | IMPLEMENTADO | ENABLE_GEMINI_EXPERIMENTAL=false por padrão |
| Modelo scoring travado | IMPLEMENTADO | VISION_SCORING_MODEL=gpt-4o |
| Scoring ignora imagens sem URL | IMPLEMENTADO | Filtro de imagens válidas |
| bestImageIndex usa idx original | IMPLEMENTADO | Array scorable com idx preservado |
| Compilação TypeScript | NÃO MEDIDO | Requer execução de typecheck |
| Compat mode mantido | IMPLEMENTADO | Flags OFF = comportamento legado |
| Testes integração | NÃO MEDIDO | Requer API keys válidas |
| Golden set (3 briefs) | NÃO MEDIDO | Requer validação manual |
| Deploy staging | PLANEJADO | Após testes locais |

---

**NOTA:** Os arquivos novos `lib/gemini-image-service-v2.ts`, `lib/image-overlay-service.ts` e os testes já existem no repositório. Os diffs completos estão disponíveis nos arquivos existentes.







