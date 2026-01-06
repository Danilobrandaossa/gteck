# PATCHES V2.2 — FINAL APLICÁVEIS (DIFF --GIT)

## (B) PATCHES (DIFF --GIT)

### 1. `lib/creative-generator.ts` (BLOCO 1: Interfaces e início da classe)

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
 
 export interface CreativeOutput {
@@ -90,6 +96,30 @@ export interface CreativeOutput {
     model: 'gemini-imagen'
   }
   explanation?: string // Explicação das diferenças entre os criativos
+  
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
   
   failureReason?: string
   metadata?: {
@@ -99,6 +129,13 @@ export interface CreativeOutput {
     qualityTier?: 'draft' | 'production'
     model?: string
     fallbackApplied?: boolean
+    timing?: {
+      prompt: number
+      generate: number
+      refine?: number
+      total: number
+    }
+    estimatedCost?: number
   }
 }
```

### 2. `lib/creative-generator.ts` (BLOCO 2: generateCreative - início até flags)

```diff
diff --git a/lib/creative-generator.ts b/lib/creative-generator.ts
index abc1234..def5678 100644
--- a/lib/creative-generator.ts
+++ b/lib/creative-generator.ts
@@ -585,6 +585,12 @@ export class CreativeGenerator {
       }
     }
 
+    // Resolver feature flags (request > tenant > env > default)
+    const { getFeatureFlags } = await import('@/lib/feature-flags')
+    const flags = getFeatureFlags({
+      qualityTier: brief.qualityTier,
+      includeTextInImage: brief.includeTextInImage,
+      enableRefinePass: brief.enableRefinePass,
+      enableScoring: brief.enableScoring,
+      enableOverlay: brief.enableOverlay
+    })
+
     // Gerar copy
     const copy = await this.generateCopy(brief, aiService)
     
+    // Gerar imagePrompt (base para Gemini)
+    // Se flags indicam usar novo prompt builder, usar V2, senão usar método antigo (compat)
+    const useV2Prompts = flags.qualityTier === 'production'
+    const imagePrompt = useV2Prompts 
+      ? await this.generateImagePromptV2(brief, flags, 'conceptual', 1)
+      : this.generateConceptualImagePrompt(brief)
+    
     const output: CreativeOutput = {
       status: 'success',
       copy,
       imagePrompt, // Prompt base para geração de imagens
       metadata: {
         characterCount: copy.length,
         tone: brief.tone,
         platform: brief.platform,
+        qualityTier: flags.qualityTier
       }
     }
```

### 3. `lib/creative-generator.ts` (BLOCO 3: generateCreative - geração de imagens V2)

```diff
diff --git a/lib/creative-generator.ts b/lib/creative-generator.ts
index abc1234..def5678 100644
--- a/lib/creative-generator.ts
+++ b/lib/creative-generator.ts
@@ -636,6 +636,10 @@ export class CreativeGenerator {
       // Gerar 4 variações de imagens usando APENAS Gemini (Nano Banana)
       if (generateImage) {
         const numVariations = Math.min(brief.variations || 2, 4) // Máximo 4 variações com Gemini
         output.conceptualImages = []
         output.commercialImages = []
 
         // Gerar todas as imagens com Gemini V2 (se production) ou serviço antigo (compat)
         try {
           const geminiApiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY
           if (!geminiApiKey || geminiApiKey.startsWith('mock')) {
             throw new Error('Google AI Studio API key não configurada para geração de imagens.')
           }
 
+          // Usar GeminiImageServiceV2 se production, senão usar antigo (compat)
+          const useV2Service = flags.qualityTier === 'production'
+          
           let allImages: Array<{ url: string; prompt: string; variation: number; imageType: 'conceptual' | 'commercial'; timing?: any; model?: string }> = []
           
+          if (useV2Service) {
+            const { GeminiImageServiceV2 } = await import('@/lib/gemini-image-service-v2')
+            const geminiService = new GeminiImageServiceV2({ apiKey: geminiApiKey })
+            
+            // Gerar variações: alternando entre conceitual e comercial
+            for (let i = 1; i <= numVariations; i++) {
+              try {
+                const isConceptual = i % 2 === 1
+                const variationNum = isConceptual ? Math.ceil(i / 2) : Math.floor(i / 2)
+                const imageType: 'conceptual' | 'commercial' = isConceptual ? 'conceptual' : 'commercial'
+                
+                // Usar prompt builder V2
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
+                  // Atualizar metadata com timing e custo
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
+                  // Se não gerou imagem mas retornou prompt
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
             // Compat mode: usar serviço antigo
             const { GeminiImageService } = await import('@/lib/gemini-image-service')
             const geminiService = new GeminiImageService(geminiApiKey)
```

### 4. `lib/creative-generator.ts` (BLOCO 4: generateCreative - scoring)

```diff
diff --git a/lib/creative-generator.ts b/lib/creative-generator.ts
index abc1234..def5678 100644
--- a/lib/creative-generator.ts
+++ b/lib/creative-generator.ts
@@ -790,6 +790,44 @@ export class CreativeGenerator {
             }
           }
 
+          // Scoring automático (se production + variations > 1 + scoring on)
+          if (flags.enableScoring && flags.qualityTier === 'production' && allImages.length > 1) {
+            try {
+              const openaiApiKey = process.env.OPENAI_API_KEY
+              if (openaiApiKey && !openaiApiKey.startsWith('sk-mock')) {
+                const { ImageScoringService } = await import('@/lib/image-scoring-service')
+                const scoringService = new ImageScoringService(openaiApiKey)
+                
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
+                    {
+                      mainPrompt: brief.mainPrompt,
+                      productName: brief.productName,
+                      objective: brief.objective,
+                      imageType: 'conceptual' // Usar tipo da primeira imagem
+                    }
+                  )
+                  
+                  // bestImageIndex do scoring é o idx original do allImages
+                  const bestIndexOriginal = scoringResult.bestImageIndex
+                  const bestImage = allImages[bestIndexOriginal]
+                  const bestScore = scoringResult.scores.find(s => s.index === bestIndexOriginal)
+                  
+                  if (bestImage && bestScore) {
+                    output.bestImage = {
+                      url: bestImage.url,
+                      index: bestIndexOriginal,
+                      score: bestScore.score
+                    }
+                    output.scoringBreakdown = scoringResult.breakdown
+                    
+                    console.log('[CreativeGenerator] Scoring aplicado:', {
+                      bestImageIndex: bestIndexOriginal,
+                      score: bestScore.score
+                    })
+                  }
+                }
+              }
+            } catch (scoringError) {
+              console.warn('[CreativeGenerator] Erro ao aplicar scoring:', scoringError)
+              // Não falhar a geração se scoring falhar
+            }
+          }
+
           // Gerar explicação das diferenças
           if (output.conceptualImages.length > 0 || output.commercialImages.length > 0) {
             output.explanation = this.generateExplanationForGemini(
```

### 5. `lib/creative-generator.ts` (BLOCO 5: generateImagePromptV2)

```diff
diff --git a/lib/creative-generator.ts b/lib/creative-generator.ts
index abc1234..def5678 100644
--- a/lib/creative-generator.ts
+++ b/lib/creative-generator.ts
@@ -870,6 +870,30 @@ export class CreativeGenerator {
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

### 6. `lib/image-overlay-service.ts` (CORRIGIDO)

```diff
diff --git a/lib/image-overlay-service.ts b/lib/image-overlay-service.ts
index mno7890..pqr9012 100644
--- a/lib/image-overlay-service.ts
+++ b/lib/image-overlay-service.ts
@@ -59,9 +59,10 @@ const SAFE_AREAS: Record<string, SafeArea> = {
 /**
  * Gera HTML/CSS para overlay
+ * Retorna objeto com html e css separados
  */
-export function generateOverlayHTML(config: OverlayConfig): string {
+export function generateOverlayHTML(config: OverlayConfig): { html: string; css: string } {
   const safeArea = SAFE_AREAS[config.ratio] || SAFE_AREAS['1:1']
   
   const title = config.title || ''
   const subtitle = config.subtitle || ''
   const cta = config.cta || ''
   
   const bgColor = config.backgroundColor || 'rgba(0, 0, 0, 0.7)'
   const textColor = config.textColor || '#ffffff'
   const ctaBg = config.ctaBackgroundColor || '#007bff'
   const ctaText = config.ctaColor || '#ffffff'
 
-  return `
-<div class="image-overlay-container" style="position: relative; width: 100%; height: 100%;">
-  <!-- Background Image -->
-  <img src="[IMAGE_URL]" alt="Creative" style="width: 100%; height: 100%; object-fit: cover;" />
-  
-  <!-- Overlay -->
+  const html = `
 <div class="image-overlay" style="
   position: absolute;
   top: ${safeArea.top}%;
   left: ${safeArea.left}%;
   right: ${safeArea.right}%;
   bottom: ${safeArea.bottom}%;
   display: flex;
   flex-direction: column;
   justify-content: flex-end;
   padding: 1rem;
   background: linear-gradient(to top, ${bgColor}, transparent);
   pointer-events: none;
 ">
   ${title ? `
   <h2 class="overlay-title" style="
     color: ${textColor};
     font-size: clamp(1.5rem, 4vw, 2.5rem);
     font-weight: 700;
     margin: 0 0 0.5rem 0;
     text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
     line-height: 1.2;
   ">${escapeHTML(title)}</h2>
   ` : ''}
   
   ${subtitle ? `
   <p class="overlay-subtitle" style="
     color: ${textColor};
     font-size: clamp(1rem, 2.5vw, 1.25rem);
     margin: 0 0 1rem 0;
     text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
     line-height: 1.4;
   ">${escapeHTML(subtitle)}</p>
   ` : ''}
   
   ${cta ? `
   <button class="overlay-cta" style="
     background: ${ctaBg};
     color: ${ctaText};
     border: none;
     padding: 0.75rem 1.5rem;
     font-size: clamp(1rem, 2.5vw, 1.125rem);
     font-weight: 600;
     border-radius: 0.5rem;
     cursor: pointer;
     pointer-events: auto;
     box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
     transition: transform 0.2s;
-  " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
+  ">
     ${escapeHTML(cta)}
   </button>
   ` : ''}
 </div>
-  `.trim()
+  `.trim()
+
+  const css = generateOverlayCSS()
+
+  return { html, css }
 }
 
 /**
  * Gera CSS standalone para overlay
  */
 export function generateOverlayCSS(): string {
   return `
+.image-overlay-container {
+  position: relative;
+  width: 100%;
+  height: 100%;
+}
+
+.image-overlay-container img {
+  width: 100%;
+  height: 100%;
+  object-fit: cover;
+}
+
 .image-overlay {
   position: absolute;
   display: flex;
   flex-direction: column;
   justify-content: flex-end;
   padding: 1rem;
   pointer-events: none;
 }
 
 .overlay-title {
   margin: 0 0 0.5rem 0;
   line-height: 1.2;
   text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
 }
 
 .overlay-subtitle {
   margin: 0 0 1rem 0;
   line-height: 1.4;
   text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
 }
 
 .overlay-cta {
   border: none;
   padding: 0.75rem 1.5rem;
   font-weight: 600;
   border-radius: 0.5rem;
   cursor: pointer;
   pointer-events: auto;
   box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
   transition: transform 0.2s;
 }
 
 .overlay-cta:hover {
   transform: scale(1.05);
 }
   `.trim()
 }
 
@@ -198,11 +201,8 @@ export function getSafeArea(ratio: '1:1' | '4:5' | '9:16' | '16:9'): SafeArea
 /**
  * Escape HTML (server-side safe - sempre)
  */
 function escapeHTML(text: string): string {
-  if (typeof window === 'undefined') {
-    // Server-side: usar replace manual
-    return text
-      .replace(/&/g, '&amp;')
-      .replace(/</g, '&lt;')
-      .replace(/>/g, '&gt;')
-      .replace(/"/g, '&quot;')
-      .replace(/'/g, '&#39;')
-  } else {
-    // Client-side: usar DOM
-    const div = document.createElement('div')
-    div.textContent = text
-    return div.innerHTML
-  }
+  // Sempre usar replace manual (server-safe)
+  return text
+    .replace(/&/g, '&amp;')
+    .replace(/</g, '&lt;')
+    .replace(/>/g, '&gt;')
+    .replace(/"/g, '&quot;')
+    .replace(/'/g, '&#39;')
 }
```

### 7. `tests/image-generation/feature-flags.test.ts` (Mantido com vitest - já configurado)

```diff
diff --git a/tests/image-generation/feature-flags.test.ts b/tests/image-generation/feature-flags.test.ts
new file mode 100644
index 0000000..pqr1234
--- /dev/null
+++ b/tests/image-generation/feature-flags.test.ts
@@ -0,0 +1,84 @@
+/**
+ * Testes mínimos para Feature Flags
+ * 
+ * Testa prioridade: request > tenant > env > default
+ */
+
+import { describe, it, expect, beforeEach, afterEach } from 'vitest'
+import { resolveFeatureFlags, getFeatureFlags } from '@/lib/feature-flags'
+
+describe('Feature Flags', () => {
+  const originalEnv = process.env
+
+  beforeEach(() => {
+    // Limpar env antes de cada teste
+    process.env = { ...originalEnv }
+  })
+
+  afterEach(() => {
+    process.env = originalEnv
+  })
+
+  it('deve usar defaults quando nenhum override fornecido', () => {
+    const flags = getFeatureFlags()
+    
+    expect(flags.qualityTier).toBe('draft')
+    expect(flags.includeTextInImage).toBe(false)
+    expect(flags.enableRefinePass).toBe(false)
+    expect(flags.enableScoring).toBe(false)
+    expect(flags.enableOverlay).toBe(true)
+  })
+
+  it('deve priorizar request sobre env', () => {
+    process.env.DEFAULT_QUALITY_TIER = 'production'
+    process.env.DEFAULT_INCLUDE_TEXT_IN_IMAGE = 'true'
+    
+    const flags = resolveFeatureFlags({
+      qualityTier: 'draft',
+      includeTextInImage: false
+    })
+    
+    expect(flags.qualityTier.value).toBe('draft')
+    expect(flags.qualityTier.source).toBe('request')
+    expect(flags.includeTextInImage.value).toBe(false)
+    expect(flags.includeTextInImage.source).toBe('request')
+  })
+
+  it('deve priorizar env sobre default', () => {
+    process.env.DEFAULT_QUALITY_TIER = 'production'
+    process.env.FEATURE_REFINE_PASS = 'true'
+    
+    const flags = resolveFeatureFlags()
+    
+    expect(flags.qualityTier.value).toBe('production')
+    expect(flags.qualityTier.source).toBe('env')
+    expect(flags.enableRefinePass.value).toBe(true)
+    expect(flags.enableRefinePass.source).toBe('env')
+  })
+
+  it('deve priorizar tenant sobre env', () => {
+    process.env.DEFAULT_QUALITY_TIER = 'production'
+    
+    const flags = resolveFeatureFlags(undefined, {
+      qualityTier: 'draft'
+    })
+    
+    expect(flags.qualityTier.value).toBe('draft')
+    expect(flags.qualityTier.source).toBe('tenant')
+  })
+
+  it('deve priorizar request sobre tenant', () => {
+    process.env.DEFAULT_QUALITY_TIER = 'production'
+    
+    const flags = resolveFeatureFlags({
+      qualityTier: 'production'
+    }, {
+      qualityTier: 'draft'
+    })
+    
+    expect(flags.qualityTier.value).toBe('production')
+    expect(flags.qualityTier.source).toBe('request')
+  })
+})
```

### 8. `tests/image-generation/prompt-builder.test.ts` (Mantido com vitest - já configurado)

```diff
diff --git a/tests/image-generation/prompt-builder.test.ts b/tests/image-generation/prompt-builder.test.ts
new file mode 100644
index 0000000..stu5678
--- /dev/null
+++ b/tests/image-generation/prompt-builder.test.ts
@@ -0,0 +1,92 @@
+/**
+ * Testes mínimos para Prompt Builder V2
+ * 
+ * Testa negativos obrigatórios e safe areas por ratio
+ */
+
+import { describe, it, expect } from 'vitest'
+import { buildConceptualPrompt, buildCommercialPrompt } from '@/lib/prompt-builder-v2'
+import type { PromptContext } from '@/lib/prompt-builder-v2'
+
+describe('Prompt Builder V2', () => {
+  const baseContext: PromptContext = {
+    mainPrompt: 'Produto teste',
+    aspectRatio: '1:1',
+    imageType: 'conceptual',
+    variation: 1,
+    includeTextInImage: false,
+    qualityTier: 'draft'
+  }
+
+  it('deve incluir negativos obrigatórios no prompt conceitual', () => {
+    const prompt = buildConceptualPrompt(baseContext)
+    
+    expect(prompt).toContain('Sem texto')
+    expect(prompt).toContain('Sem logo')
+    expect(prompt).toContain('Sem marca d\'água')
+    expect(prompt).toContain('Sem aparência 3D')
+    expect(prompt).toContain('Sem pele plástica')
+  })
+
+  it('deve incluir negativos obrigatórios no prompt comercial', () => {
+    const prompt = buildCommercialPrompt(baseContext)
+    
+    expect(prompt).toContain('Sem texto')
+    expect(prompt).toContain('Sem logo')
+    expect(prompt).toContain('Sem marca d\'água')
+    expect(prompt).toContain('Sem aparência 3D')
+    expect(prompt).toContain('Sem pele plástica')
+  })
+
+  it('deve incluir safe area quando includeTextInImage=false', () => {
+    const prompt = buildConceptualPrompt({
+      ...baseContext,
+      includeTextInImage: false,
+      aspectRatio: '9:16'
+    })
+    
+    expect(prompt).toContain('Negative space')
+    expect(prompt).toContain('overlay')
+  })
+
+  it('deve incluir direção técnica (lente, ambiente, iluminação)', () => {
+    const prompt = buildConceptualPrompt(baseContext)
+    
+    expect(prompt).toContain('Lente:')
+    expect(prompt).toContain('Ambiente:')
+    expect(prompt).toContain('Iluminação:')
+    expect(prompt).toContain('Profundidade de campo:')
+    expect(prompt).toContain('Composição:')
+  })
+
+  it('deve variar estilo baseado em variation', () => {
+    const prompt1 = buildConceptualPrompt({
+      ...baseContext,
+      variation: 1
+    })
+    
+    const prompt2 = buildConceptualPrompt({
+      ...baseContext,
+      variation: 2
+    })
+    
+    // Prompts devem ser diferentes (diferentes estilos)
+    expect(prompt1).not.toBe(prompt2)
+  })
+
+  it('deve incluir características de referências quando fornecidas', () => {
+    const prompt = buildConceptualPrompt({
+      ...baseContext,
+      imageReferences: [
+        {
+          role: 'style',
+          description: 'Cores vibrantes, iluminação natural'
+        }
+      ]
+    })
+    
+    expect(prompt).toContain('Estilo visual:')
+  })
+})
```

---

**NOTA:** Os diffs de `lib/creative-generator.ts` foram divididos em 5 blocos devido ao tamanho do arquivo. Aplique todos os blocos sequencialmente.

