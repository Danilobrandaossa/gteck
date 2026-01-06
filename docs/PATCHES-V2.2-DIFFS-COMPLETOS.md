# PATCHES V2.2 — DIFFS COMPLETOS (ARQUIVOS RESTANTES)

## ARQUIVOS NOVOS — DIFFS COMPLETOS

### 1. `lib/gemini-image-service-v2.ts`

```diff
diff --git a/lib/gemini-image-service-v2.ts b/lib/gemini-image-service-v2.ts
new file mode 100644
index 0000000..jkl3456
--- /dev/null
+++ b/lib/gemini-image-service-v2.ts
@@ -0,0 +1,459 @@
+/**
+ * Gemini Image Service V2 - Robusto com Timeouts, Retries, Quality Tier
+ */
+
+export interface GeminiImageRequestV2 {
+  prompt: string
+  aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9'
+  safetyFilter?: 'block_some' | 'block_most' | 'block_few' | 'block_none'
+  qualityTier?: 'draft' | 'production'
+  enableRefinePass?: boolean
+}
+
+export interface GeminiImageResponseV2 {
+  success: boolean
+  imageUrl?: string
+  prompt?: string
+  error?: string
+  base64Image?: string
+  model?: string
+  fallbackApplied?: boolean
+  refineApplied?: boolean
+  timing?: {
+    prompt: number
+    generate: number
+    refine?: number
+    total: number
+  }
+  estimatedCost?: number
+}
+
+export interface GeminiImageConfig {
+  apiKey: string
+  timeoutMs?: number
+  maxRetries?: number
+  backoffBaseMs?: number
+  primaryModel?: string
+  fallbackModel?: string
+}
+
+export class GeminiImageServiceV2 {
+  private apiKey: string
+  private endpoint: string = 'https://generativelanguage.googleapis.com/v1beta'
+  private primaryModel: string
+  private fallbackModel: string
+  private timeoutMs: number
+  private maxRetries: number
+  private backoffBaseMs: number
+
+  constructor(config: GeminiImageConfig) {
+    this.apiKey = config.apiKey
+    const enableExperimental = process.env.ENABLE_GEMINI_EXPERIMENTAL === 'true'
+    this.primaryModel = config.primaryModel || 
+      (enableExperimental ? 'gemini-2.5-flash-image-exp' : 'gemini-2.5-flash-image')
+    this.fallbackModel = config.fallbackModel || process.env.GEMINI_MODEL_FALLBACK || 'gemini-2.5-flash-image'
+    this.timeoutMs = config.timeoutMs || parseInt(process.env.GEMINI_TIMEOUT_MS || '60000', 10)
+    this.maxRetries = config.maxRetries || parseInt(process.env.GEMINI_MAX_RETRIES || '3', 10)
+    this.backoffBaseMs = config.backoffBaseMs || parseInt(process.env.GEMINI_BACKOFF_BASE_MS || '1000', 10)
+  }
+
+  async generateImage(request: GeminiImageRequestV2): Promise<GeminiImageResponseV2> {
+    const startTime = Date.now()
+    const qualityTier = request.qualityTier || 'draft'
+    
+    console.log('[GeminiImageV2] Iniciando geração:', {
+      qualityTier,
+      aspectRatio: request.aspectRatio || '1:1',
+      enableRefinePass: request.enableRefinePass || false
+    })
+
+    let lastError: Error | undefined
+    let fallbackApplied = false
+    let model = this.primaryModel
+
+    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
+      try {
+        const result = await this.generateImageWithModel(request, model, startTime)
+        
+        if (result.success && result.imageUrl && request.enableRefinePass && qualityTier === 'production') {
+          const refineResult = await this.applyRefinePass(result, request, startTime)
+          if (refineResult.success) {
+            return refineResult
+          }
+          console.warn('[GeminiImageV2] Refine pass falhou, retornando imagem base')
+        }
+        
+        return {
+          ...result,
+          model,
+          fallbackApplied,
+          timing: result.timing
+        }
+      } catch (error) {
+        lastError = error as Error
+        console.warn(`[GeminiImageV2] Tentativa ${attempt + 1}/${this.maxRetries + 1} falhou:`, error instanceof Error ? error.message : 'Erro desconhecido')
+        
+        if (attempt === 0 && model === this.primaryModel) {
+          console.log('[GeminiImageV2] Tentando modelo fallback...')
+          model = this.fallbackModel
+          fallbackApplied = true
+          continue
+        }
+        
+        if (attempt < this.maxRetries) {
+          const delay = this.backoffBaseMs * Math.pow(2, attempt)
+          console.log(`[GeminiImageV2] Aguardando ${delay}ms antes de retry...`)
+          await this.sleep(delay)
+        }
+      }
+    }
+
+    const totalTime = Date.now() - startTime
+    console.error('[GeminiImageV2] Todas as tentativas falharam:', lastError)
+    
+    return {
+      success: false,
+      prompt: request.prompt,
+      error: lastError?.message || 'Erro desconhecido após todas as tentativas',
+      model,
+      fallbackApplied,
+      timing: {
+        prompt: 0,
+        generate: 0,
+        total: totalTime
+      }
+    }
+  }
+
+  private async generateImageWithModel(
+    request: GeminiImageRequestV2,
+    model: string,
+    startTime: number
+  ): Promise<GeminiImageResponseV2> {
+    const promptStartTime = Date.now()
+    
+    const aspectRatioMap: Record<string, { width: number; height: number }> = {
+      '1:1': { width: 1024, height: 1024 },
+      '4:5': { width: 1024, height: 1280 },
+      '9:16': { width: 1024, height: 1792 },
+      '16:9': { width: 1792, height: 1024 }
+    }
+
+    const dimensions = aspectRatioMap[request.aspectRatio || '1:1'] || aspectRatioMap['1:1']
+    const finalPrompt = request.prompt
+
+    const url = `${this.endpoint}/models/${model}:generateContent?key=${this.apiKey}`
+
+    const requestBody = {
+      contents: [
+        {
+          parts: [
+            {
+              text: finalPrompt
+            }
+          ]
+        }
+      ],
+      generationConfig: {
+        temperature: 0.4,
+        topK: 40,
+        topP: 0.95,
+        maxOutputTokens: 8192
+      },
+      imageGenerationConfig: {
+        numberOfImages: 1,
+        aspectRatio: request.aspectRatio || '1:1',
+        safetyFilterLevel: request.safetyFilter || 'block_some',
+        personGeneration: 'allow_all'
+      },
+      safetySettings: [
+        {
+          category: 'HARM_CATEGORY_HARASSMENT',
+          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
+        },
+        {
+          category: 'HARM_CATEGORY_HATE_SPEECH',
+          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
+        },
+        {
+          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
+          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
+        },
+        {
+          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
+          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
+        }
+      ]
+    }
+
+    const promptTime = Date.now() - promptStartTime
+    const generateStartTime = Date.now()
+
+    const controller = new AbortController()
+    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)
+
+    try {
+      const response = await fetch(url, {
+        method: 'POST',
+        headers: {
+          'Content-Type': 'application/json'
+        },
+        body: JSON.stringify(requestBody),
+        signal: controller.signal
+      })
+
+      clearTimeout(timeoutId)
+
+      if (!response.ok) {
+        const errorText = await response.text()
+        throw new Error(`API retornou erro ${response.status}: ${response.statusText}. ${errorText.substring(0, 200)}`)
+      }
+
+      const data = await response.json()
+      const generateTime = Date.now() - generateStartTime
+
+      const imageData = this.extractImageFromResponse(data)
+
+      if (!imageData.imageUrl && !imageData.base64Image) {
+        console.warn('[GeminiImageV2] Nenhuma imagem encontrada na resposta')
+        return {
+          success: false,
+          prompt: finalPrompt,
+          error: 'Nenhuma imagem encontrada na resposta da API',
+          timing: {
+            prompt: promptTime,
+            generate: generateTime,
+            total: Date.now() - startTime
+          }
+        }
+      }
+
+      const totalTime = Date.now() - startTime
+
+      const qualityTier = request.qualityTier || 'draft'
+      
+      console.log('[GeminiImageV2] Geração concluída:', {
+        model,
+        success: true,
+        timing: {
+          prompt: promptTime,
+          generate: generateTime,
+          total: totalTime
+        },
+        estimatedCost: this.estimateCost(qualityTier)
+      })
+
+      return {
+        success: true,
+        imageUrl: imageData.imageUrl || (imageData.base64Image ? `data:image/png;base64,${imageData.base64Image}` : undefined),
+        base64Image: imageData.base64Image,
+        prompt: finalPrompt,
+        timing: {
+          prompt: promptTime,
+          generate: generateTime,
+          total: totalTime
+        },
+        estimatedCost: this.estimateCost(qualityTier)
+      }
+    } catch (error) {
+      clearTimeout(timeoutId)
+      
+      if (error instanceof Error && error.name === 'AbortError') {
+        throw new Error(`Timeout após ${this.timeoutMs}ms`)
+      }
+      
+      throw error
+    }
+  }
+
+  private async applyRefinePass(
+    baseResult: GeminiImageResponseV2,
+    request: GeminiImageRequestV2,
+    startTime: number
+  ): Promise<GeminiImageResponseV2> {
+    const refineStartTime = Date.now()
+    
+    const refinePrompt = `${request.prompt}
+
+Refinamento:
+- Corrigir artefatos (mãos, texturas, plástico)
+- Manter composição original
+- Sem texto, sem logos
+- Se refine falhar, retornar imagem base`
+
+    try {
+      const refineResult = await this.generateImageWithModel(
+        { ...request, prompt: refinePrompt },
+        this.primaryModel,
+        startTime
+      )
+
+      if (refineResult.success && refineResult.imageUrl) {
+        const refineTime = Date.now() - refineStartTime
+        const totalTime = Date.now() - startTime
+
+        console.log('[GeminiImageV2] Refine pass aplicado:', {
+          timing: {
+            prompt: baseResult.timing?.prompt || 0,
+            generate: baseResult.timing?.generate || 0,
+            refine: refineTime,
+            total: totalTime
+          }
+        })
+
+        return {
+          ...refineResult,
+          refineApplied: true,
+          timing: {
+            prompt: baseResult.timing?.prompt || 0,
+            generate: baseResult.timing?.generate || 0,
+            refine: refineTime,
+            total: totalTime
+          }
+        }
+      }
+    } catch (error) {
+      console.warn('[GeminiImageV2] Refine pass falhou:', error)
+    }
+
+    return {
+      ...baseResult,
+      refineApplied: false
+    }
+  }
+
+  private extractImageFromResponse(data: any): { imageUrl?: string; base64Image?: string } {
+    let imageUrl: string | undefined
+    let base64Image: string | undefined
+
+    if (data.candidates && data.candidates.length > 0) {
+      const candidate = data.candidates[0]
+      if (candidate.content?.parts) {
+        for (const part of candidate.content.parts) {
+          if (part.inlineData) {
+            base64Image = part.inlineData.data
+            const mimeType = part.inlineData.mimeType || 'image/png'
+            imageUrl = `data:${mimeType};base64,${base64Image}`
+            break
+          }
+          if (part.imageUrl) {
+            imageUrl = typeof part.imageUrl === 'string' ? part.imageUrl : part.imageUrl.url
+            break
+          }
+        }
+      }
+    }
+
+    if (!imageUrl && !base64Image) {
+      if (data.imageUrl) {
+        imageUrl = typeof data.imageUrl === 'string' ? data.imageUrl : data.imageUrl.url
+      }
+      if (data.inlineData) {
+        base64Image = typeof data.inlineData === 'string' ? data.inlineData : data.inlineData.data
+        const mimeType = data.inlineData.mimeType || 'image/png'
+        imageUrl = `data:${mimeType};base64,${base64Image}`
+      }
+    }
+
+    if (!imageUrl && !base64Image && data.generatedImages) {
+      const generatedImage = Array.isArray(data.generatedImages) ? data.generatedImages[0] : data.generatedImages
+      if (generatedImage) {
+        imageUrl = generatedImage.url || generatedImage.imageUrl
+        base64Image = generatedImage.base64 || generatedImage.data
+        if (base64Image && !imageUrl) {
+          imageUrl = `data:image/png;base64,${base64Image}`
+        }
+      }
+    }
+
+    if (!imageUrl && !base64Image) {
+      const searchForImage = (obj: any, depth = 0): string | undefined => {
+        if (depth > 5) return undefined
+        if (!obj || typeof obj !== 'object') return undefined
+        
+        for (const key in obj) {
+          if (key.toLowerCase().includes('image') || key.toLowerCase().includes('data')) {
+            const value = obj[key]
+            if (typeof value === 'string') {
+              if (value.startsWith('data:image') || value.startsWith('http')) {
+                return value
+              }
+              if (value.length > 1000) {
+                return `data:image/png;base64,${value}`
+              }
+            }
+          }
+          if (typeof obj[key] === 'object') {
+            const found = searchForImage(obj[key], depth + 1)
+            if (found) return found
+          }
+        }
+        return undefined
+      }
+      
+      const foundImage = searchForImage(data)
+      if (foundImage) {
+        imageUrl = foundImage
+      }
+    }
+
+    return { imageUrl, base64Image }
+  }
+
+  private estimateCost(qualityTier: 'draft' | 'production'): number {
+    return qualityTier === 'production' ? 0.02 : 0.01
+  }
+
+  private sleep(ms: number): Promise<void> {
+    return new Promise(resolve => setTimeout(resolve, ms))
+  }
+}
```

### 2. `lib/image-overlay-service.ts`

```diff
diff --git a/lib/image-overlay-service.ts b/lib/image-overlay-service.ts
new file mode 100644
index 0000000..mno7890
--- /dev/null
+++ b/lib/image-overlay-service.ts
@@ -0,0 +1,234 @@
+/**
+ * Image Overlay Service - Overlay de Texto/CTA no Frontend
+ */
+
+export interface OverlayConfig {
+  ratio: '1:1' | '4:5' | '9:16' | '16:9'
+  title?: string
+  subtitle?: string
+  cta?: string
+  backgroundColor?: string
+  textColor?: string
+  ctaColor?: string
+  ctaBackgroundColor?: string
+}
+
+export interface SafeArea {
+  top: number
+  bottom: number
+  left: number
+  right: number
+}
+
+const SAFE_AREAS: Record<string, SafeArea> = {
+  '1:1': {
+    top: 10,
+    bottom: 20,
+    left: 10,
+    right: 10
+  },
+  '4:5': {
+    top: 10,
+    bottom: 25,
+    left: 10,
+    right: 10
+  },
+  '9:16': {
+    top: 20,
+    bottom: 30,
+    left: 10,
+    right: 10
+  },
+  '16:9': {
+    top: 10,
+    bottom: 20,
+    left: 10,
+    right: 10
+  }
+}
+
+export function generateOverlayHTML(config: OverlayConfig): string {
+  const safeArea = SAFE_AREAS[config.ratio] || SAFE_AREAS['1:1']
+  
+  const title = config.title || ''
+  const subtitle = config.subtitle || ''
+  const cta = config.cta || ''
+  
+  const bgColor = config.backgroundColor || 'rgba(0, 0, 0, 0.7)'
+  const textColor = config.textColor || '#ffffff'
+  const ctaBg = config.ctaBackgroundColor || '#007bff'
+  const ctaText = config.ctaColor || '#ffffff'
+
+  return `
+<div class="image-overlay-container" style="position: relative; width: 100%; height: 100%;">
+  <img src="[IMAGE_URL]" alt="Creative" style="width: 100%; height: 100%; object-fit: cover;" />
+  
+  <div class="image-overlay" style="
+    position: absolute;
+    top: ${safeArea.top}%;
+    left: ${safeArea.left}%;
+    right: ${safeArea.right}%;
+    bottom: ${safeArea.bottom}%;
+    display: flex;
+    flex-direction: column;
+    justify-content: flex-end;
+    padding: 1rem;
+    background: linear-gradient(to top, ${bgColor}, transparent);
+    pointer-events: none;
+  ">
+    ${title ? `
+    <h2 class="overlay-title" style="
+      color: ${textColor};
+      font-size: clamp(1.5rem, 4vw, 2.5rem);
+      font-weight: 700;
+      margin: 0 0 0.5rem 0;
+      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
+      line-height: 1.2;
+    ">${escapeHTML(title)}</h2>
+    ` : ''}
+    
+    ${subtitle ? `
+    <p class="overlay-subtitle" style="
+      color: ${textColor};
+      font-size: clamp(1rem, 2.5vw, 1.25rem);
+      margin: 0 0 1rem 0;
+      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
+      line-height: 1.4;
+    ">${escapeHTML(subtitle)}</p>
+    ` : ''}
+    
+    ${cta ? `
+    <button class="overlay-cta" style="
+      background: ${ctaBg};
+      color: ${ctaText};
+      border: none;
+      padding: 0.75rem 1.5rem;
+      font-size: clamp(1rem, 2.5vw, 1.125rem);
+      font-weight: 600;
+      border-radius: 0.5rem;
+      cursor: pointer;
+      pointer-events: auto;
+      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
+      transition: transform 0.2s;
+    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
+      ${escapeHTML(cta)}
+    </button>
+    ` : ''}
+  </div>
+</div>
+  `.trim()
+}
+
+export function generateOverlayCSS(): string {
+  return `
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
+.image-overlay {
+  position: absolute;
+  display: flex;
+  flex-direction: column;
+  justify-content: flex-end;
+  padding: 1rem;
+  pointer-events: none;
+}
+
+.overlay-title {
+  margin: 0 0 0.5rem 0;
+  line-height: 1.2;
+  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
+}
+
+.overlay-subtitle {
+  margin: 0 0 1rem 0;
+  line-height: 1.4;
+  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
+}
+
+.overlay-cta {
+  border: none;
+  padding: 0.75rem 1.5rem;
+  font-weight: 600;
+  border-radius: 0.5rem;
+  cursor: pointer;
+  pointer-events: auto;
+  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
+  transition: transform 0.2s;
+}
+
+.overlay-cta:hover {
+  transform: scale(1.05);
+}
+  `.trim()
+}
+
+export function getSafeArea(ratio: '1:1' | '4:5' | '9:16' | '16:9'): SafeArea {
+  return SAFE_AREAS[ratio] || SAFE_AREAS['1:1']
+}
+
+function escapeHTML(text: string): string {
+  if (typeof window === 'undefined') {
+    return text
+      .replace(/&/g, '&amp;')
+      .replace(/</g, '&lt;')
+      .replace(/>/g, '&gt;')
+      .replace(/"/g, '&quot;')
+      .replace(/'/g, '&#39;')
+  } else {
+    const div = document.createElement('div')
+    div.textContent = text
+    return div.innerHTML
+  }
+}
+
+export function applyAutoContrast(
+  imageUrl: string,
+  config: OverlayConfig
+): Promise<string> {
+  return Promise.resolve(imageUrl)
+}
```

### 3. `tests/image-generation/feature-flags.test.ts`

```diff
diff --git a/tests/image-generation/feature-flags.test.ts b/tests/image-generation/feature-flags.test.ts
new file mode 100644
index 0000000..pqr1234
--- /dev/null
+++ b/tests/image-generation/feature-flags.test.ts
@@ -0,0 +1,84 @@
+/**
+ * Testes mínimos para Feature Flags
+ */
+
+import { describe, it, expect, beforeEach, afterEach } from 'vitest'
+import { resolveFeatureFlags, getFeatureFlags } from '@/lib/feature-flags'
+
+describe('Feature Flags', () => {
+  const originalEnv = process.env
+
+  beforeEach(() => {
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

### 4. `tests/image-generation/prompt-builder.test.ts`

```diff
diff --git a/tests/image-generation/prompt-builder.test.ts b/tests/image-generation/prompt-builder.test.ts
new file mode 100644
index 0000000..stu5678
--- /dev/null
+++ b/tests/image-generation/prompt-builder.test.ts
@@ -0,0 +1,92 @@
+/**
+ * Testes mínimos para Prompt Builder V2
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

### ARQUIVOS MODIFICADOS — DIFFS COMPLETOS

#### 1. `app/criativos/page.tsx`

**Mudanças principais:**
- Linhas 18-84: Interface `CreativeResult` estendida com `bestImage`, `scoringBreakdown`, `metadata` completo
- Linhas 99-101: Estado adicionado para `qualityTier` e `includeTextInImage`
- Linhas 191-193: Envio de `qualityTier` e `includeTextInImage` no body
- Linhas 364-397: UI para seleção de qualityTier e checkbox includeTextInImage
- Linhas 688-725: Exibição de `bestImage` com score breakdown
- Linhas 727-749: Exibição de `metadata` (timing, custo, modelo, fallback)

**Diff completo (unified diff):**

```diff
diff --git a/app/criativos/page.tsx b/app/criativos/page.tsx
index abc1234..def5678 100644
--- a/app/criativos/page.tsx
+++ b/app/criativos/page.tsx
@@ -18,6 +18,30 @@ interface CreativeResult {
   explanation?: string
   failureReason?: string
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
+  metadata?: {
+    characterCount?: number
+    tone?: string
+    platform?: string
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
+  }
 }
 
@@ -95,6 +95,10 @@ export default function CriativosPage() {
   const [variations, setVariations] = useState(2)
   const [showAdvanced, setShowAdvanced] = useState(false)
   
+  // Novos campos V2.2
+  const [qualityTier, setQualityTier] = useState<'draft' | 'production'>('draft')
+  const [includeTextInImage, setIncludeTextInImage] = useState(false)
+
   const handleAddImageReference = () => {
     setImageReferences([...imageReferences, { role: 'inspiração', description: '', analyzed: false }])
   }
@@ -178,6 +182,9 @@ export default function CriativosPage() {
               description: ref.description?.trim() || undefined
             }))
           : undefined,
+        // Novos campos V2.2
+        qualityTier,
+        includeTextInImage
       }
 
       const response = await fetch('/api/creative/generate', {
@@ -360,6 +367,37 @@ export default function CriativosPage() {
                   Adicionar Referência de Imagem (Opcional)
                 </button>
 
+                {/* Novos Campos V2.2 - Quality Tier e Include Text */}
+                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
+                  <div style={{ flex: 1, minWidth: '200px' }}>
+                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
+                      Qualidade
+                    </label>
+                    <select
+                      value={qualityTier}
+                      onChange={(e) => setQualityTier(e.target.value as 'draft' | 'production')}
+                      style={{
+                        width: '100%',
+                        padding: '0.5rem',
+                        border: '1px solid var(--gray-300)',
+                        borderRadius: 'var(--radius)',
+                        fontSize: '0.875rem'
+                      }}
+                    >
+                      <option value="draft">Draft (Rápido)</option>
+                      <option value="production">Production (Alta Qualidade)</option>
+                    </select>
+                  </div>
+                  
+                  <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'flex-end' }}>
+                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
+                      <input
+                        type="checkbox"
+                        checked={includeTextInImage}
+                        onChange={(e) => setIncludeTextInImage(e.target.checked)}
+                        style={{ width: '1rem', height: '1rem' }}
+                      />
+                      <span>Incluir texto na imagem</span>
+                    </label>
+                  </div>
+                </div>
+
                 {/* Configurações Avançadas - Colapsadas */}
                 <div style={{ marginBottom: '1.5rem' }}>
                   <button
@@ -684,6 +722,57 @@ export default function CriativosPage() {
                       </div>
                     )}
 
+                    {/* Best Image (se scoring aplicado) */}
+                    {result.bestImage && result.bestImage.url && (
+                      <div>
+                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
+                          ⭐ Melhor Imagem (Scoring Automático)
+                        </h3>
+                        <div style={{ 
+                          border: '2px solid var(--primary)', 
+                          borderRadius: 'var(--radius-lg)', 
+                          overflow: 'hidden',
+                          backgroundColor: 'var(--gray-50)'
+                        }}>
+                          <img
+                            src={result.bestImage.url}
+                            alt="Melhor imagem"
+                            style={{
+                              width: '100%',
+                              height: 'auto',
+                              display: 'block'
+                            }}
+                          />
+                          {result.bestImage.score && (
+                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--white)' }}>
+                              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
+                                Score: {result.bestImage.score.total.toFixed(1)}/10
+                              </div>
+                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.7rem' }}>
+                                <div>Realismo: {result.bestImage.score.realismo}/10</div>
+                                <div>Estética: {result.bestImage.score.estetica}/10</div>
+                                <div>Alinhamento: {result.bestImage.score.alinhamento}/10</div>
+                                <div>Limpeza: {result.bestImage.score.limpeza}/10</div>
+                                <div>Cara de IA: {result.bestImage.score.caraDeIA}/10</div>
+                              </div>
+                            </div>
+                          )}
+                        </div>
+                      </div>
+                    )}
+
+                    {/* Metadata (timing, custo) */}
+                    {result.metadata?.timing && (
+                      <div style={{
+                        padding: '0.75rem',
+                        backgroundColor: 'var(--gray-50)',
+                        borderRadius: 'var(--radius-lg)',
+                        fontSize: '0.75rem',
+                        color: 'var(--gray-600)'
+                      }}>
+                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
+                          <div>Tempo total: {result.metadata.timing.total}ms</div>
+                          {result.metadata.estimatedCost && (
+                            <div>Custo estimado: ${result.metadata.estimatedCost.toFixed(4)}</div>
+                          )}
+                          {result.metadata.model && (
+                            <div>Modelo: {result.metadata.model}</div>
+                          )}
+                          {result.metadata.fallbackApplied && (
+                            <div style={{ color: 'var(--yellow-700)' }}>⚠️ Fallback aplicado</div>
+                          )}
+                        </div>
+                      </div>
+                    )}
+
                     {/* Explicação */}
                     {result.explanation && (
                       <div style={{
```

---

**NOTA:** Os diffs completos de `lib/creative-generator.ts` estão no documento principal `PATCHES-V2.2-FINAL-COMPLETOS.md` devido ao tamanho do arquivo.





