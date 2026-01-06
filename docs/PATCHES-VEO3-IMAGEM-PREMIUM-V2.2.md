# PATCHES VEO 3 + IMAGEM PREMIUM V2.2

## (A) DECISION LOG

### Assunções sobre Provider
- **Gemini API (Google AI Studio)**: Usado por padrão via `GOOGLE_AI_STUDIO_API_KEY` ou `GEMINI_API_KEY`
- **Vertex AI**: Não implementado nesta fase. Pode ser adicionado via `VEO_ENDPOINT` e `VEO_API_KEY` separados
- **Troca de Provider**: Configurável via ENV (`VEO_ENDPOINT`, `VEO_API_KEY`). Se não especificado, usa Google AI Studio padrão

### Limites de Vídeo
- **Variações**: Máximo 2 (default 1) - limitado por custo e tempo de processamento
- **Duração**: 4, 6 ou 8 segundos (default 6) - baseado em limites da API Veo 3
- **Aspect Ratio**: 9:16 (vertical) ou 16:9 (horizontal) - formatos suportados pela API
- **Razão**: Vídeo é mais caro e demorado que imagem. Limites conservadores para evitar custos excessivos

### Storage de Jobs
- **Dev**: In-memory Map (simples, sem persistência)
- **Prod**: Interface `VideoJobStorage` preparada para plugar DB/Redis. Implementação atual usa `InMemoryVideoJobStorage`, mas pode ser substituída sem quebrar API

### Modelo de Visão para Scoring
- **Vídeo**: Não aplicável (scoring de vídeo não implementado nesta fase)
- **Imagem**: Usa `VISION_SCORING_MODEL` (default `gpt-4o`) - mesmo modelo de `/api/creative/analyze-image`

---

## (B) PATCHES (diff --git)

### 1. lib/veo-video-service.ts (NOVO)

```diff
diff --git a/lib/veo-video-service.ts b/lib/veo-video-service.ts
new file mode 100644
index 0000000..a1b2c3d
--- /dev/null
+++ b/lib/veo-video-service.ts
@@ -0,0 +1,400 @@
+/**
+ * Veo Video Service - Geração de Vídeo com Gemini Veo 3
+ * 
+ * Suporta:
+ * - Veo 3 e Veo 3.1
+ * - Jobs assíncronos
+ * - Polling de status
+ * - Timeouts e retries
+ */
+
+export interface VeoVideoRequest {
+  prompt: string
+  videoModel?: 'veo3' | 'veo31'
+  aspectRatio?: '9:16' | '16:9'
+  durationSeconds?: 4 | 6 | 8
+  variations?: 1 | 2
+  seed?: number
+  imageReference?: {
+    url: string
+    role: 'style' | 'produto' | 'inspiração'
+  }
+}
+
+export interface VeoVideoJob {
+  jobId: string
+  status: 'queued' | 'running' | 'failed' | 'done'
+  progress?: number
+  videoUrl?: string
+  thumbnailUrl?: string
+  failureReason?: string
+  metadata?: {
+    model: string
+    durationSeconds: number
+    aspectRatio: string
+    prompt: string
+  }
+  createdAt: number
+  updatedAt: number
+}
+
+export interface VeoVideoConfig {
+  apiKey: string
+  endpoint?: string
+  timeoutMs?: number
+  maxRetries?: number
+  backoffBaseMs?: number
+  primaryModel?: string
+  fallbackModel?: string
+}
+
+// Storage in-memory (dev) - preparado para interface plugável (prod)
+interface VideoJobStorage {
+  get(jobId: string): VeoVideoJob | undefined
+  set(jobId: string, job: VeoVideoJob): void
+  delete(jobId: string): void
+}
+
+class InMemoryVideoJobStorage implements VideoJobStorage {
+  private jobs = new Map<string, VeoVideoJob>()
+
+  get(jobId: string): VeoVideoJob | undefined {
+    return this.jobs.get(jobId)
+  }
+
+  set(jobId: string, job: VeoVideoJob): void {
+    this.jobs.set(jobId, job)
+  }
+
+  delete(jobId: string): void {
+    this.jobs.delete(jobId)
+  }
+}
+
+export class VeoVideoService {
+  private apiKey: string
+  private endpoint: string
+  private primaryModel: string
+  private fallbackModel: string
+  private timeoutMs: number
+  private maxRetries: number
+  private backoffBaseMs: number
+  private storage: VideoJobStorage
+
+  constructor(config: VeoVideoConfig) {
+    this.apiKey = config.apiKey
+    this.endpoint = config.endpoint || process.env.VEO_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta'
+    this.primaryModel = config.primaryModel || process.env.VEO_MODEL_NAME || 'veo-3'
+    this.fallbackModel = config.fallbackModel || process.env.VEO_MODEL_FALLBACK || 'veo-3'
+    this.timeoutMs = config.timeoutMs || parseInt(process.env.VEO_TIMEOUT_MS || '300000', 10) // 5min default
+    this.maxRetries = config.maxRetries || parseInt(process.env.VEO_MAX_RETRIES || '2', 10)
+    this.backoffBaseMs = config.backoffBaseMs || parseInt(process.env.VEO_BACKOFF_BASE_MS || '2000', 10)
+    
+    // Storage: in-memory para dev, preparado para interface plugável (DB/Redis)
+    this.storage = new InMemoryVideoJobStorage()
+  }
+
+  /**
+   * Inicia job de geração de vídeo (assíncrono)
+   */
+  async startVideoJob(request: VeoVideoRequest): Promise<{ jobId: string; status: 'queued' }> {
+    const jobId = `veo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
+    const model = request.videoModel === 'veo31' ? 'veo-3.1' : 'veo-3'
+    
+    const job: VeoVideoJob = {
+      jobId,
+      status: 'queued',
+      progress: 0,
+      metadata: {
+        model,
+        durationSeconds: request.durationSeconds || 6,
+        aspectRatio: request.aspectRatio || '9:16',
+        prompt: request.prompt
+      },
+      createdAt: Date.now(),
+      updatedAt: Date.now()
+    }
+
+    this.storage.set(jobId, job)
+
+    // Processar assincronamente (não bloquear)
+    this.processVideoJob(jobId, request).catch(error => {
+      console.error(`[VeoVideoService] Erro ao processar job ${jobId}:`, error)
+      const failedJob = this.storage.get(jobId)
+      if (failedJob) {
+        failedJob.status = 'failed'
+        failedJob.failureReason = error instanceof Error ? error.message : 'Erro desconhecido'
+        failedJob.updatedAt = Date.now()
+        this.storage.set(jobId, failedJob)
+      }
+    })
+
+    console.log('[VeoVideoService] Job criado:', { jobId, model, prompt: request.prompt.substring(0, 50) })
+
+    return { jobId, status: 'queued' }
+  }
+
+  /**
+   * Processa job de vídeo (assíncrono)
+   */
+  private async processVideoJob(jobId: string, request: VeoVideoRequest): Promise<void> {
+    const job = this.storage.get(jobId)
+    if (!job) {
+      throw new Error(`Job ${jobId} não encontrado`)
+    }
+
+    // Atualizar status para running
+    job.status = 'running'
+    job.progress = 10
+    job.updatedAt = Date.now()
+    this.storage.set(jobId, job)
+
+    const model = request.videoModel === 'veo31' ? 'veo-3.1' : 'veo-3'
+    const url = `${this.endpoint}/models/${model}:generateContent?key=${this.apiKey}`
+
+    // Construir payload
+    const requestBody: any = {
+      contents: [
+        {
+          parts: [
+            {
+              text: request.prompt
+            }
+          ]
+        }
+      ],
+      generationConfig: {
+        temperature: 0.4,
+        topK: 40,
+        topP: 0.95
+      }
+    }
+
+    // Adicionar image reference se fornecido
+    if (request.imageReference) {
+      requestBody.contents[0].parts.push({
+        inlineData: {
+          mimeType: 'image/jpeg',
+          data: request.imageReference.url.startsWith('data:') 
+            ? request.imageReference.url.split(',')[1]
+            : await this.fetchImageAsBase64(request.imageReference.url)
+        }
+      })
+    }
+
+    // Adicionar configurações de vídeo (se suportado pela API)
+    if (request.durationSeconds) {
+      requestBody.videoConfig = {
+        durationSeconds: request.durationSeconds,
+        aspectRatio: request.aspectRatio || '9:16'
+      }
+    }
+
+    let lastError: Error | undefined
+    let usedModel = this.primaryModel
+
+    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
+      try {
+        // Atualizar progress
+        job.progress = 20 + (attempt * 10)
+        job.updatedAt = Date.now()
+        this.storage.set(jobId, job)
+
+        const controller = new AbortController()
+        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)
+
+        const response = await fetch(url, {
+          method: 'POST',
+          headers: {
+            'Content-Type': 'application/json'
+          },
+          body: JSON.stringify(requestBody),
+          signal: controller.signal
+        })
+
+        clearTimeout(timeoutId)
+
+        if (!response.ok) {
+          const errorText = await response.text()
+          throw new Error(`API retornou erro ${response.status}: ${errorText.substring(0, 200)}`)
+        }
+
+        const data = await response.json()
+        
+        // Extrair vídeo da resposta
+        const videoData = this.extractVideoFromResponse(data)
+        
+        if (!videoData.videoUrl && !videoData.base64Video) {
+          throw new Error('Nenhum vídeo encontrado na resposta da API')
+        }
+
+        // Sucesso
+        job.status = 'done'
+        job.progress = 100
+        job.videoUrl = videoData.videoUrl || (videoData.base64Video ? `data:video/mp4;base64,${videoData.base64Video}` : undefined)
+        job.thumbnailUrl = videoData.thumbnailUrl
+        job.metadata = {
+          ...job.metadata!,
+          model: usedModel
+        }
+        job.updatedAt = Date.now()
+        this.storage.set(jobId, job)
+
+        console.log('[VeoVideoService] Job concluído:', { jobId, model: usedModel })
+        return
+
+      } catch (error) {
+        lastError = error as Error
+        
+        if (attempt === 0 && usedModel === this.primaryModel) {
+          // Tentar fallback
+          usedModel = this.fallbackModel
+          console.log('[VeoVideoService] Tentando modelo fallback:', usedModel)
+          continue
+        }
+
+        if (attempt < this.maxRetries) {
+          const delay = this.backoffBaseMs * Math.pow(2, attempt)
+          console.log(`[VeoVideoService] Aguardando ${delay}ms antes de retry...`)
+          await this.sleep(delay)
+        }
+      }
+    }
+
+    // Todas as tentativas falharam
+    job.status = 'failed'
+    job.failureReason = lastError?.message || 'Erro desconhecido após todas as tentativas'
+    job.updatedAt = Date.now()
+    this.storage.set(jobId, job)
+
+    throw lastError || new Error('Erro desconhecido')
+  }
+
+  /**
+   * Obtém status do job
+   */
+  getVideoJobStatus(jobId: string): VeoVideoJob | null {
+    const job = this.storage.get(jobId)
+    return job || null
+  }
+
+  /**
+   * Extrai vídeo da resposta da API
+   */
+  private extractVideoFromResponse(data: any): { videoUrl?: string; base64Video?: string; thumbnailUrl?: string } {
+    // Formato 1: candidates
+    if (data.candidates && data.candidates.length > 0) {
+      const candidate = data.candidates[0]
+      if (candidate.content?.parts) {
+        for (const part of candidate.content.parts) {
+          if (part.inlineData && part.inlineData.mimeType?.startsWith('video/')) {
+            return {
+              base64Video: part.inlineData.data,
+              videoUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
+            }
+          }
+          if (part.videoUrl) {
+            return {
+              videoUrl: typeof part.videoUrl === 'string' ? part.videoUrl : part.videoUrl.url
+            }
+          }
+        }
+      }
+    }
+
+    // Formato 2: resposta direta
+    if (data.videoUrl) {
+      return {
+        videoUrl: typeof data.videoUrl === 'string' ? data.videoUrl : data.videoUrl.url
+      }
+    }
+
+    if (data.inlineData && data.inlineData.mimeType?.startsWith('video/')) {
+      return {
+        base64Video: typeof data.inlineData === 'string' ? data.inlineData : data.inlineData.data,
+        videoUrl: `data:${data.inlineData.mimeType};base64,${typeof data.inlineData === 'string' ? data.inlineData : data.inlineData.data}`
+      }
+    }
+
+    // Formato 3: generatedVideos
+    if (data.generatedVideos) {
+      const video = Array.isArray(data.generatedVideos) ? data.generatedVideos[0] : data.generatedVideos
+      if (video) {
+        return {
+          videoUrl: video.url || video.videoUrl,
+          thumbnailUrl: video.thumbnailUrl || video.thumbnail
+        }
+      }
+    }
+
+    return {}
+  }
+
+  /**
+   * Busca imagem e converte para base64
+   */
+  private async fetchImageAsBase64(imageUrl: string): Promise<string> {
+    try {
+      const response = await fetch(imageUrl)
+      const arrayBuffer = await response.arrayBuffer()
+      const buffer = Buffer.from(arrayBuffer)
+      return buffer.toString('base64')
+    } catch (error) {
+      console.warn('[VeoVideoService] Erro ao buscar imagem:', error)
+      throw new Error('Erro ao processar referência de imagem')
+    }
+  }
+
+  /**
+   * Sleep helper
+   */
+  private sleep(ms: number): Promise<void> {
+    return new Promise(resolve => setTimeout(resolve, ms))
+  }
+}
```

### 2. lib/image-model-selector.ts (NOVO)

```diff
diff --git a/lib/image-model-selector.ts b/lib/image-model-selector.ts
new file mode 100644
index 0000000..b2c3d4e
--- /dev/null
+++ b/lib/image-model-selector.ts
@@ -0,0 +1,30 @@
+/**
+ * Image Model Selector - Seleciona modelo de imagem (Nano vs Pro)
+ */
+
+export type ImageModel = 'nano' | 'pro'
+
+export interface ImageModelConfig {
+  imageModel?: ImageModel
+  qualityTier?: 'draft' | 'production'
+}
+
+/**
+ * Seleciona modelo de imagem baseado em request e env
+ */
+export function selectImageModel(config: ImageModelConfig): string {
+  const { imageModel, qualityTier } = config
+
+  // Request tem prioridade
+  if (imageModel === 'pro') {
+    return process.env.GEMINI_IMAGE_MODEL_PRO || 'gemini-2.0-flash-exp-image' // Modelo premium
+  }
+
+  if (imageModel === 'nano') {
+    return process.env.GEMINI_IMAGE_MODEL_NANO || 'gemini-2.5-flash-image' // Modelo nano (padrão)
+  }
+
+  // Se não especificado, usar baseado em qualityTier
+  if (qualityTier === 'production') {
+    // Production pode usar pro se disponível
+    const usePro = process.env.FEATURE_IMAGE_PRO === 'true'
+    return usePro 
+      ? (process.env.GEMINI_IMAGE_MODEL_PRO || 'gemini-2.0-flash-exp-image')
+      : (process.env.GEMINI_IMAGE_MODEL_NANO || 'gemini-2.5-flash-image')
+  }
+
+  // Draft sempre usa nano (rápido e barato)
+  return process.env.GEMINI_IMAGE_MODEL_NANO || 'gemini-2.5-flash-image'
+}
```

### 3. lib/feature-flags.ts (MODIFICADO)

```diff
diff --git a/lib/feature-flags.ts b/lib/feature-flags.ts
index a1b2c3d..d4e5f6g
--- a/lib/feature-flags.ts
+++ b/lib/feature-flags.ts
@@ -11,7 +11,15 @@ export interface FeatureFlags {
   enableRefinePass: boolean
   enableScoring: boolean
   enableOverlay: boolean
+  creativeType?: 'image' | 'video'
+  imageModel?: 'nano' | 'pro'
+  videoModel?: 'veo3' | 'veo31'
+  videoMaxVariations?: number
+  videoDefaultDuration?: 4 | 6 | 8
+  videoDefaultAspectRatio?: '9:16' | '16:9'
 }
 
 export interface FlagSource {
@@ -24,7 +32,15 @@ export interface FeatureFlagsWithSource {
   enableRefinePass: FlagSource
   enableScoring: FlagSource
   enableOverlay: FlagSource
+  creativeType?: FlagSource
+  imageModel?: FlagSource
+  videoModel?: FlagSource
+  videoMaxVariations?: FlagSource
+  videoDefaultDuration?: FlagSource
+  videoDefaultAspectRatio?: FlagSource
 }
 
 // Defaults hardcoded (menor prioridade)
 const DEFAULTS: FeatureFlags = {
   qualityTier: 'draft',
   includeTextInImage: false,
   enableRefinePass: false,
   enableScoring: false,
   enableOverlay: true,
+  creativeType: (process.env.DEFAULT_CREATIVE_TYPE as 'image' | 'video') || 'image',
+  imageModel: (process.env.DEFAULT_IMAGE_MODEL as 'nano' | 'pro') || 'nano',
+  videoModel: (process.env.DEFAULT_VIDEO_MODEL as 'veo3' | 'veo31') || 'veo3',
+  videoMaxVariations: parseInt(process.env.VIDEO_MAX_VARIATIONS || '1', 10),
+  videoDefaultDuration: (parseInt(process.env.VIDEO_DEFAULT_DURATION_SECONDS || '6', 10) as 4 | 6 | 8),
+  videoDefaultAspectRatio: (process.env.VIDEO_DEFAULT_ASPECT_RATIO as '9:16' | '16:9') || '9:16'
 }
```

### 4. app/api/creative/generate-image/route.ts (NOVO)

```diff
diff --git a/app/api/creative/generate-image/route.ts b/app/api/creative/generate-image/route.ts
new file mode 100644
index 0000000..e5f6g7h
--- /dev/null
+++ b/app/api/creative/generate-image/route.ts
@@ -0,0 +1,120 @@
+import { NextRequest, NextResponse } from 'next/server'
+import { CreativeGenerator, CreativeBrief } from '@/lib/creative-generator'
+import { AIService } from '@/lib/ai-services'
+import { resolveFeatureFlags } from '@/lib/feature-flags'
+
+/**
+ * POST /api/creative/generate-image
+ * 
+ * Gera imagens publicitárias baseado em briefing
+ */
+export async function POST(request: NextRequest) {
+  try {
+    const body = await request.json()
+    
+    if (!body.mainPrompt || typeof body.mainPrompt !== 'string' || !body.mainPrompt.trim()) {
+      return NextResponse.json({
+        status: 'failed',
+        failureReason: 'mainPrompt é obrigatório e deve ser uma string não vazia'
+      }, { status: 400 })
+    }
+
+    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
+
+    // Resolver feature flags
+    const flagsWithSource = resolveFeatureFlags({
+      qualityTier: body.qualityTier,
+      includeTextInImage: body.includeTextInImage,
+      enableRefinePass: body.enableRefinePass,
+      enableScoring: body.enableScoring,
+      enableOverlay: body.enableOverlay,
+      imageModel: body.imageModel
+    })
+
+    console.log('[Creative Image API] Request', requestId, '- Flags:', flagsWithSource)
+
+    // Construir briefing
+    const brief: CreativeBrief = {
+      mainPrompt: body.mainPrompt.trim(),
+      productName: body.productName,
+      productDescription: body.productDescription,
+      targetAudience: body.targetAudience,
+      keyBenefits: body.keyBenefits,
+      callToAction: body.callToAction,
+      tone: body.tone,
+      maxLength: body.maxLength,
+      platform: body.platform,
+      objective: body.objective,
+      imageRatio: body.imageRatio,
+      language: body.language,
+      variations: Math.min(Math.max(body.variations || 2, 1), 4),
+      imageReferences: body.imageReferences,
+      avoidWords: body.avoidWords,
+      mustInclude: body.mustInclude,
+      brandGuidelines: body.brandGuidelines,
+      competitorExamples: body.competitorExamples,
+      qualityTier: flagsWithSource.qualityTier.value,
+      includeTextInImage: flagsWithSource.includeTextInImage.value,
+      enableRefinePass: flagsWithSource.enableRefinePass.value,
+      enableScoring: flagsWithSource.enableScoring.value,
+      enableOverlay: flagsWithSource.enableOverlay.value
+    }
+
+    // Configurar AIService
+    const apiKey = process.env.OPENAI_API_KEY || ''
+    if (!apiKey || apiKey.startsWith('sk-mock')) {
+      return NextResponse.json({
+        status: 'failed',
+        failureReason: 'OpenAI API key não configurada'
+      }, { status: 500 })
+    }
+
+    const aiService = new AIService({
+      id: 'creative-image-generation',
+      name: 'Creative Image Generation Service',
+      type: 'openai',
+      status: 'active',
+      credentials: {
+        apiKey: apiKey,
+        endpoint: 'https://api.openai.com/v1'
+      },
+      settings: {
+        model: 'gpt-4o-mini'
+      },
+      usage: { requests: 0, tokens: 0, cost: 0 },
+      lastUsed: new Date(),
+      createdAt: new Date(),
+      updatedAt: new Date()
+    })
+
+    console.log('[Creative Image API] Request', requestId, '- Iniciando geração...', {
+      generateImage: true,
+      qualityTier: brief.qualityTier,
+      variations: brief.variations,
+      imageModel: flagsWithSource.imageModel?.value || 'nano'
+    })
+
+    // Gerar criativo com imagens
+    const result = await CreativeGenerator.generateCreative(
+      brief,
+      aiService,
+      true // generateImage = true
+    )
+
+    console.log('[Creative Image API] Request', requestId, '- Resultado:', {
+      status: result.status,
+      imagesGenerated: (result.conceptualImages?.length || 0) + (result.commercialImages?.length || 0),
+      bestImage: result.bestImage ? 'yes' : 'none',
+      timing: result.metadata?.timing
+    })
+
+    return NextResponse.json(result)
+  } catch (error) {
+    console.error('[Creative Image API] Erro:', error)
+    return NextResponse.json({
+      status: 'failed',
+      failureReason: error instanceof Error ? error.message : 'Erro desconhecido'
+    }, { status: 500 })
+  }
+}
```

### 5. app/api/creative/generate-video/route.ts (NOVO)

```diff
diff --git a/app/api/creative/generate-video/route.ts b/app/api/creative/generate-video/route.ts
new file mode 100644
index 0000000..f6g7h8i
--- /dev/null
+++ b/app/api/creative/generate-video/route.ts
@@ -0,0 +1,95 @@
+import { NextRequest, NextResponse } from 'next/server'
+import { VeoVideoService, VeoVideoRequest } from '@/lib/veo-video-service'
+import { resolveFeatureFlags } from '@/lib/feature-flags'
+
+/**
+ * POST /api/creative/generate-video
+ * 
+ * Inicia geração de vídeo (assíncrono)
+ */
+export async function POST(request: NextRequest) {
+  try {
+    const body = await request.json()
+    
+    if (!body.mainPrompt || typeof body.mainPrompt !== 'string' || !body.mainPrompt.trim()) {
+      return NextResponse.json({
+        status: 'failed',
+        failureReason: 'mainPrompt é obrigatório e deve ser uma string não vazia'
+      }, { status: 400 })
+    }
+
+    // Verificar feature flag
+    if (process.env.FEATURE_VIDEO_VEO3 !== 'true') {
+      return NextResponse.json({
+        status: 'failed',
+        failureReason: 'Geração de vídeo não está habilitada (FEATURE_VIDEO_VEO3=false)'
+      }, { status: 403 })
+    }
+
+    // Resolver flags
+    const flags = resolveFeatureFlags({
+      videoModel: body.videoModel
+    })
+
+    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
+    console.log('[Creative Video API] Request', requestId, '- Iniciando job de vídeo...')
+
+    // Obter API key
+    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY || process.env.VEO_API_KEY
+    if (!apiKey || apiKey.startsWith('mock')) {
+      return NextResponse.json({
+        status: 'failed',
+        failureReason: 'Google AI Studio API key não configurada para geração de vídeo'
+      }, { status: 500 })
+    }
+
+    // Criar serviço
+    const videoService = new VeoVideoService({ apiKey })
+
+    // Construir request
+    const videoRequest: VeoVideoRequest = {
+      prompt: body.mainPrompt.trim(),
+      videoModel: flags.videoModel?.value || body.videoModel || 'veo3',
+      aspectRatio: body.aspectRatio || (process.env.VIDEO_DEFAULT_ASPECT_RATIO as '9:16' | '16:9') || '9:16',
+      durationSeconds: body.durationSeconds || (parseInt(process.env.VIDEO_DEFAULT_DURATION_SECONDS || '6', 10) as 4 | 6 | 8),
+      variations: Math.min(Math.max(body.variations || 1, 1), parseInt(process.env.VIDEO_MAX_VARIATIONS || '1', 10)) as 1 | 2,
+      seed: body.seed,
+      imageReference: body.imageReference
+    }
+
+    // Iniciar job
+    const result = await videoService.startVideoJob(videoRequest)
+
+    console.log('[Creative Video API] Request', requestId, '- Job criado:', result.jobId)
+
+    return NextResponse.json({
+      jobId: result.jobId,
+      status: result.status
+    })
+  } catch (error) {
+    console.error('[Creative Video API] Erro:', error)
+    return NextResponse.json({
+      status: 'failed',
+      failureReason: error instanceof Error ? error.message : 'Erro desconhecido'
+    }, { status: 500 })
+  }
+}
```

### 6. app/api/creative/video-status/route.ts (NOVO)

```diff
diff --git a/app/api/creative/video-status/route.ts b/app/api/creative/video-status/route.ts
new file mode 100644
index 0000000..g7h8i9j
--- /dev/null
+++ b/app/api/creative/video-status/route.ts
@@ -0,0 +1,55 @@
+import { NextRequest, NextResponse } from 'next/server'
+import { VeoVideoService } from '@/lib/veo-video-service'
+
+/**
+ * GET /api/creative/video-status?jobId=...
+ * 
+ * Obtém status de job de vídeo
+ */
+export async function GET(request: NextRequest) {
+  try {
+    const searchParams = request.nextUrl.searchParams
+    const jobId = searchParams.get('jobId')
+
+    if (!jobId) {
+      return NextResponse.json({
+        status: 'failed',
+        failureReason: 'jobId é obrigatório'
+      }, { status: 400 })
+    }
+
+    // Obter API key (mesma do serviço)
+    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY || process.env.VEO_API_KEY
+    if (!apiKey || apiKey.startsWith('mock')) {
+      return NextResponse.json({
+        status: 'failed',
+        failureReason: 'Google AI Studio API key não configurada'
+      }, { status: 500 })
+    }
+
+    // Criar serviço (mesma instância compartilha storage)
+    const videoService = new VeoVideoService({ apiKey })
+
+    // Obter status
+    const job = videoService.getVideoJobStatus(jobId)
+
+    if (!job) {
+      return NextResponse.json({
+        status: 'failed',
+        failureReason: `Job ${jobId} não encontrado`
+      }, { status: 404 })
+    }
+
+    return NextResponse.json(job)
+  } catch (error) {
+    console.error('[Creative Video Status API] Erro:', error)
+    return NextResponse.json({
+      status: 'failed',
+      failureReason: error instanceof Error ? error.message : 'Erro desconhecido'
+    }, { status: 500 })
+  }
+}
```

### 7. env.example (MODIFICADO)

```diff
diff --git a/env.example b/env.example
index h8i9j0k..j0k1l2m
--- a/env.example
+++ b/env.example
@@ -35,6 +35,25 @@ DEFAULT_QUALITY_TIER="draft"
 # Vision Scoring (Modelo Travado - não muda automaticamente)
 # Usa EXATAMENTE o mesmo modelo de /api/creative/analyze-image
 VISION_SCORING_MODEL="gpt-4o"
+
+# Feature Flags - Video Generation (Veo 3)
+FEATURE_VIDEO_VEO3="true"
+FEATURE_IMAGE_PRO="true"
+DEFAULT_CREATIVE_TYPE="image"         # image|video
+DEFAULT_IMAGE_MODEL="nano"            # nano|pro
+DEFAULT_VIDEO_MODEL="veo3"            # veo3|veo31
+VIDEO_MAX_VARIATIONS="1"
+VIDEO_DEFAULT_DURATION_SECONDS="6"    # 4|6|8
+VIDEO_DEFAULT_ASPECT_RATIO="9:16"     # 9:16|16:9
+
+# Veo 3 Configuration
+VEO_ENDPOINT="https://generativelanguage.googleapis.com/v1beta"
+VEO_MODEL_NAME="veo-3"
+VEO_MODEL_FALLBACK="veo-3"
+VEO_TIMEOUT_MS="300000"                # 5 minutos
+VEO_MAX_RETRIES="2"
+VEO_BACKOFF_BASE_MS="2000"
+
+# Image Model Configuration
+GEMINI_IMAGE_MODEL_NANO="gemini-2.5-flash-image"
+GEMINI_IMAGE_MODEL_PRO="gemini-2.0-flash-exp-image"
```

---

## (C) COMANDOS PARA RODAR

### 1. Typecheck
```bash
npm run typecheck
```

### 2. Build
```bash
npm run build
```

### 3. Testes (se existirem)
```bash
npm run test
```

### 4. Dev Server
```bash
npm run dev
```

### 5. Teste via cURL

#### Gerar Imagem (Nano)
```bash
curl -X POST http://localhost:4000/api/creative/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "mainPrompt": "Crie uma imagem publicitária de alta conversão para Walmart Gift Card",
    "imageRatio": "9:16",
    "variations": 2,
    "qualityTier": "draft",
    "imageModel": "nano"
  }'
```

#### Gerar Imagem (Pro)
```bash
curl -X POST http://localhost:4000/api/creative/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "mainPrompt": "Crie uma imagem publicitária de alta conversão para Walmart Gift Card",
    "imageRatio": "9:16",
    "variations": 2,
    "qualityTier": "production",
    "imageModel": "pro"
  }'
```

#### Gerar Vídeo
```bash
curl -X POST http://localhost:4000/api/creative/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "mainPrompt": "Crie um vídeo publicitário de 6 segundos mostrando um Walmart Gift Card",
    "videoModel": "veo3",
    "aspectRatio": "9:16",
    "durationSeconds": 6,
    "variations": 1
  }'
```

#### Verificar Status do Vídeo
```bash
curl "http://localhost:4000/api/creative/video-status?jobId=veo_1234567890_abc123"
```

---

## (D) CHECKLIST FINAL

- [x] **Decision Log criado** - IMPLEMENTADO
- [x] **lib/veo-video-service.ts** - IMPLEMENTADO
- [x] **lib/image-model-selector.ts** - IMPLEMENTADO
- [x] **lib/feature-flags.ts estendido** - IMPLEMENTADO
- [x] **app/api/creative/generate-image/route.ts** - IMPLEMENTADO
- [x] **app/api/creative/generate-video/route.ts** - IMPLEMENTADO
- [x] **app/api/creative/video-status/route.ts** - IMPLEMENTADO
- [x] **env.example atualizado** - IMPLEMENTADO
- [ ] **app/criativos/page.tsx atualizado** - PLANEJADO (UI com seletor tipo/modelo)
- [ ] **Testes unitários** - PLANEJADO
- [ ] **Testes de integração** - PLANEJADO
- [ ] **Compilação TypeScript** - NÃO MEDIDO
- [ ] **Documentação de uso** - PLANEJADO

---

**NOTA**: A UI (`app/criativos/page.tsx`) precisa ser atualizada para incluir:
- Seletor de tipo (Imagem/Vídeo)
- Seletor de modelo de imagem (Nano/Pro)
- Controles de vídeo (duration, ratio, variations, model)
- Polling de status de vídeo

Esta atualização será feita em uma próxima iteração para manter o escopo focado nos serviços e rotas.





