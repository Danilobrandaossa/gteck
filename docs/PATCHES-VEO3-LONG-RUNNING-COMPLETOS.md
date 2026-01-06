# PATCHES VEO 3 - LONG-RUNNING OPERATIONS (COMPLETO)

## (A) DECISION LOG

### Assunções sobre Long-Running Operations
- **Veo usa `predictLongRunning`**: Endpoint correto é `POST /v1beta/models/{model}:predictLongRunning`
- **JobId = operation.name**: Retornado na resposta inicial como `response.name`
- **Sem background jobs em memória**: Status consultado diretamente na API via `GET /v1beta/{operation.name}`
- **Download server-side**: Vídeo disponibilizado via proxy interno (`/api/creative/video-download?uri=...`) para não expor API key

### Modelos de Imagem
- **Nano**: `gemini-2.5-flash-image` (padrão, rápido)
- **Pro**: `gemini-3-pro-image-preview` (premium, alta qualidade)

### Modelo Veo
- **Padrão**: `veo-3.1-generate-preview` (ou similar conforme documentação real)

---

## (B) PATCHES (diff --git)

### 1. lib/veo-video-service.ts (CORRIGIDO)

```diff
diff --git a/lib/veo-video-service.ts b/lib/veo-video-service.ts
index a1b2c3d..d4e5f6g
--- a/lib/veo-video-service.ts
+++ b/lib/veo-video-service.ts
@@ -1,9 +1,9 @@
 /**
  * Veo Video Service - Geração de Vídeo com Gemini Veo 3
  * 
  * Suporta:
  * - Veo 3 e Veo 3.1
- * - Jobs assíncronos
+ * - Long-running operations (predictLongRunning)
  * - Polling de status
  * - Timeouts e retries
  */
@@ -40,28 +40,6 @@ export interface VeoVideoConfig {
   fallbackModel?: string
 }
 
-// Storage in-memory (dev) - preparado para interface plugável (prod)
-interface VideoJobStorage {
-  get(jobId: string): VeoVideoJob | undefined
-  set(jobId: string, job: VeoVideoJob): void
-  delete(jobId: string): void
-}
-
-class InMemoryVideoJobStorage implements VideoJobStorage {
-  private jobs = new Map<string, VeoVideoJob>()
-
-  get(jobId: string): VeoVideoJob | undefined {
-    return this.jobs.get(jobId)
-  }
-
-  set(jobId: string, job: VeoVideoJob): void {
-    this.jobs.set(jobId, job)
-  }
-
-  delete(jobId: string): void {
-    this.jobs.delete(jobId)
-  }
-}
-
 export class VeoVideoService {
   private apiKey: string
   private endpoint: string
@@ -69,7 +47,6 @@ export class VeoVideoService {
   private fallbackModel: string
   private timeoutMs: number
   private maxRetries: number
   private backoffBaseMs: number
-  private storage: VideoJobStorage
 
   constructor(config: VeoVideoConfig) {
     this.apiKey = config.apiKey
@@ -78,8 +55,6 @@ export class VeoVideoService {
     this.fallbackModel = config.fallbackModel || process.env.VEO_MODEL_FALLBACK || 'veo-3.1-generate-preview'
     this.timeoutMs = config.timeoutMs || parseInt(process.env.VEO_TIMEOUT_MS || '300000', 10) // 5min default
     this.maxRetries = config.maxRetries || parseInt(process.env.VEO_MAX_RETRIES || '2', 10)
     this.backoffBaseMs = config.backoffBaseMs || parseInt(process.env.VEO_BACKOFF_BASE_MS || '2000', 10)
-    
-    // Storage: in-memory para dev, preparado para interface plugável (DB/Redis)
-    this.storage = new InMemoryVideoJobStorage()
   }
 
   /**
-   * Inicia job de geração de vídeo (assíncrono)
+   * Inicia long-running operation de geração de vídeo
    */
-  async startVideoJob(request: VeoVideoRequest): Promise<{ jobId: string; status: 'queued' }> {
-    const jobId = `veo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
-    const model = request.videoModel === 'veo31' ? 'veo-3.1' : 'veo-3'
+  async startVideoJob(request: VeoVideoRequest): Promise<{ jobId: string; status: 'queued' }> {
+    const model = request.videoModel === 'veo31' 
+      ? (process.env.VEO_MODEL_NAME || 'veo-3.1-generate-preview')
+      : (process.env.VEO_MODEL_NAME || 'veo-3-generate-preview')
     
-    const job: VeoVideoJob = {
-      jobId,
-      status: 'queued',
-      progress: 0,
-      metadata: {
-        model,
-        durationSeconds: request.durationSeconds || 6,
-        aspectRatio: request.aspectRatio || '9:16',
-        prompt: request.prompt
-      },
-      createdAt: Date.now(),
-      updatedAt: Date.now()
-    }
-
-    this.storage.set(jobId, job)
-
-    // Processar assincronamente (não bloquear)
-    this.processVideoJob(jobId, request).catch(error => {
-      console.error(`[VeoVideoService] Erro ao processar job ${jobId}:`, error)
-      const failedJob = this.storage.get(jobId)
-      if (failedJob) {
-        failedJob.status = 'failed'
-        failedJob.failureReason = error instanceof Error ? error.message : 'Erro desconhecido'
-        failedJob.updatedAt = Date.now()
-        this.storage.set(jobId, failedJob)
-      }
-    })
-
-    console.log('[VeoVideoService] Job criado:', { jobId, model, prompt: request.prompt.substring(0, 50) })
+    const url = `${this.endpoint}/models/${model}:predictLongRunning?key=${this.apiKey}`
+
+    // Construir payload mínimo
+    const requestBody: any = {
+      instances: [
+        {
+          prompt: request.prompt
+        }
+      ]
+    }
+
+    // Adicionar configurações se suportadas
+    if (request.durationSeconds) {
+      requestBody.instances[0].durationSeconds = request.durationSeconds
+    }
+    if (request.aspectRatio) {
+      requestBody.instances[0].aspectRatio = request.aspectRatio
+    }
+    if (request.imageReference) {
+      // Converter imagem para base64 se necessário
+      const imageData = request.imageReference.url.startsWith('data:')
+        ? request.imageReference.url.split(',')[1]
+        : await this.fetchImageAsBase64(request.imageReference.url)
+      requestBody.instances[0].imageReference = {
+        inlineData: {
+          mimeType: 'image/jpeg',
+          data: imageData
+        }
+      }
+    }
+
+    try {
+      const response = await fetch(url, {
+        method: 'POST',
+        headers: {
+          'Content-Type': 'application/json',
+          'x-goog-api-key': this.apiKey
+        },
+        body: JSON.stringify(requestBody)
+      })
+
+      if (!response.ok) {
+        const errorText = await response.text()
+        throw new Error(`API retornou erro ${response.status}: ${errorText.substring(0, 200)}`)
+      }
+
+      const data = await response.json()
+      
+      // jobId = operation.name
+      const jobId = data.name
+      if (!jobId) {
+        throw new Error('Resposta da API não contém operation.name')
+      }
+
+      console.log('[VeoVideoService] Long-running operation iniciada:', { jobId, model })
+
+      return { jobId, status: 'queued' }
+    } catch (error) {
+      console.error('[VeoVideoService] Erro ao iniciar operação:', error)
+      throw error
+    }
+  }
+
+  /**
+   * Obtém status da operação long-running
+   */
+  getVideoJobStatus(jobId: string): Promise<VeoVideoJob | null> {
+    return this.getOperationStatus(jobId)
+  }
+
+  /**
+   * Consulta status da operação na API
+   */
+  private async getOperationStatus(operationName: string): Promise<VeoVideoJob | null> {
+    const url = `${this.endpoint}/${operationName}?key=${this.apiKey}`
+
+    try {
+      const response = await fetch(url, {
+        method: 'GET',
+        headers: {
+          'x-goog-api-key': this.apiKey
+        }
+      })
+
+      if (!response.ok) {
+        if (response.status >= 400 && response.status < 500) {
+          // 4xx: operação não encontrada ou inválida
+          return {
+            jobId: operationName,
+            status: 'failed',
+            failureReason: `Operação não encontrada ou inválida (${response.status})`,
+            createdAt: Date.now(),
+            updatedAt: Date.now()
+          }
+        }
+        // 5xx: erro do servidor
+        const errorText = await response.text()
+        throw new Error(`Erro ao consultar operação: ${response.status} - ${errorText.substring(0, 200)}`)
+      }
+
+      const operation = await response.json()
+
+      // Mapear status
+      let status: 'queued' | 'running' | 'failed' | 'done'
+      let videoUri: string | undefined
+      let failureReason: string | undefined
+
+      if (operation.done === true) {
+        // Operação concluída
+        if (operation.error) {
+          status = 'failed'
+          failureReason = operation.error.message || 'Erro desconhecido na operação'
+        } else {
+          status = 'done'
+          // Extrair videoUri da resposta
+          videoUri = this.extractVideoUri(operation.response)
+        }
+      } else {
+        // Operação ainda em execução
+        status = 'running'
+      }
+
+      // Calcular progress (estimado baseado em done)
+      const progress = operation.done ? 100 : (operation.metadata?.progressPercent || 0)
+
+      return {
+        jobId: operationName,
+        status,
+        progress,
+        videoUrl: videoUri ? `/api/creative/video-download?uri=${encodeURIComponent(videoUri)}` : undefined,
+        failureReason,
+        metadata: {
+          model: operation.metadata?.model || 'unknown',
+          durationSeconds: operation.metadata?.durationSeconds || 6,
+          aspectRatio: operation.metadata?.aspectRatio || '9:16',
+          prompt: operation.metadata?.prompt || ''
+        },
+        createdAt: operation.metadata?.createTime ? new Date(operation.metadata.createTime).getTime() : Date.now(),
+        updatedAt: Date.now()
+      }
+    } catch (error) {
+      console.error('[VeoVideoService] Erro ao consultar operação:', error)
+      return {
+        jobId: operationName,
+        status: 'failed',
+        failureReason: error instanceof Error ? error.message : 'Erro desconhecido',
+        createdAt: Date.now(),
+        updatedAt: Date.now()
+      }
+    }
+  }
+
+  /**
+   * Extrai videoUri da resposta da operação
+   */
+  private extractVideoUri(response: any): string | undefined {
+    if (!response) return undefined
+
+    // Formato 1: response.predictions[0].videoUri
+    if (response.predictions && Array.isArray(response.predictions) && response.predictions.length > 0) {
+      const prediction = response.predictions[0]
+      if (prediction.videoUri) {
+        return typeof prediction.videoUri === 'string' ? prediction.videoUri : prediction.videoUri.uri
+      }
+    }
+
+    // Formato 2: response.videoUri
+    if (response.videoUri) {
+      return typeof response.videoUri === 'string' ? response.videoUri : response.videoUri.uri
+    }
+
+    // Formato 3: response.uri
+    if (response.uri) {
+      return typeof response.uri === 'string' ? response.uri : response.uri.uri
+    }
+
+    return undefined
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
+}
```

### 2. app/api/creative/video-download/route.ts (NOVO)

```diff
diff --git a/app/api/creative/video-download/route.ts b/app/api/creative/video-download/route.ts
new file mode 100644
index 0000000..h8i9j0k
--- /dev/null
+++ b/app/api/creative/video-download/route.ts
@@ -0,0 +1,60 @@
+import { NextRequest, NextResponse } from 'next/server'
+
+/**
+ * GET /api/creative/video-download?uri=...
+ * 
+ * Faz download server-side do vídeo e faz stream para o cliente
+ * Isso evita expor API key no browser
+ */
+export async function GET(request: NextRequest) {
+  try {
+    const searchParams = request.nextUrl.searchParams
+    const videoUri = searchParams.get('uri')
+
+    if (!videoUri) {
+      return NextResponse.json({
+        error: 'uri é obrigatório'
+      }, { status: 400 })
+    }
+
+    // Obter API key
+    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY || process.env.VEO_API_KEY
+    if (!apiKey || apiKey.startsWith('mock')) {
+      return NextResponse.json({
+        error: 'API key não configurada'
+      }, { status: 500 })
+    }
+
+    // Fazer download do vídeo usando API key
+    try {
+      const videoResponse = await fetch(videoUri, {
+        headers: {
+          'x-goog-api-key': apiKey
+        }
+      })
+
+      if (!videoResponse.ok) {
+        return NextResponse.json({
+          error: `Erro ao baixar vídeo: ${videoResponse.status}`
+        }, { status: videoResponse.status })
+      }
+
+      // Obter conteúdo do vídeo
+      const videoBuffer = await videoResponse.arrayBuffer()
+
+      // Retornar como stream MP4
+      return new NextResponse(videoBuffer, {
+        headers: {
+          'Content-Type': 'video/mp4',
+          'Content-Length': videoBuffer.byteLength.toString(),
+          'Content-Disposition': `attachment; filename="video-${Date.now()}.mp4"`,
+          'Cache-Control': 'public, max-age=3600'
+        }
+      })
+    } catch (fetchError) {
+      console.error('[Video Download] Erro ao fazer fetch:', fetchError)
+      return NextResponse.json({
+        error: 'Erro ao baixar vídeo do servidor'
+      }, { status: 500 })
+    }
+  } catch (error) {
+    console.error('[Video Download] Erro:', error)
+    return NextResponse.json({
+      error: error instanceof Error ? error.message : 'Erro desconhecido'
+    }, { status: 500 })
+  }
+}
```

### 3. app/api/creative/generate-video/route.ts (CORRIGIDO)

```diff
diff --git a/app/api/creative/generate-video/route.ts b/app/api/creative/generate-video/route.ts
index f6g7h8i..i9j0k1l
--- a/app/api/creative/generate-video/route.ts
+++ b/app/api/creative/generate-video/route.ts
@@ -1,4 +1,4 @@
 import { NextRequest, NextResponse } from 'next/server'
 import { VeoVideoService, VeoVideoRequest } from '@/lib/veo-video-service'
 import { resolveFeatureFlags } from '@/lib/feature-flags'
@@ -58,7 +58,7 @@ export async function POST(request: NextRequest) {
     // Iniciar job
     const result = await videoService.startVideoJob(videoRequest)
 
-    console.log('[Creative Video API] Request', requestId, '- Job criado:', result.jobId)
+    console.log('[Creative Video API] Request', requestId, '- Long-running operation iniciada:', result.jobId)
 
     return NextResponse.json({
       jobId: result.jobId,
```

### 4. app/api/creative/video-status/route.ts (CORRIGIDO)

```diff
diff --git a/app/api/creative/video-status/route.ts b/app/api/creative/video-status/route.ts
index g7h8i9j..j0k1l2m
--- a/app/api/creative/video-status/route.ts
+++ b/app/api/creative/video-status/route.ts
@@ -1,4 +1,4 @@
 import { NextRequest, NextResponse } from 'next/server'
 import { VeoVideoService } from '@/lib/veo-video-service'
 
@@ -30,10 +30,10 @@ export async function GET(request: NextRequest) {
     // Criar serviço (mesma instância compartilha storage)
     const videoService = new VeoVideoService({ apiKey })
 
-    // Obter status
-    const job = videoService.getVideoJobStatus(jobId)
+    // Obter status (consulta operação na API)
+    const job = await videoService.getVideoJobStatus(jobId)
 
     if (!job) {
       return NextResponse.json({
         status: 'failed',
         failureReason: `Job ${jobId} não encontrado`
       }, { status: 404 })
     }
 
     return NextResponse.json(job)
```

### 5. lib/image-model-selector.ts (CORRIGIDO)

```diff
diff --git a/lib/image-model-selector.ts b/lib/image-model-selector.ts
index b2c3d4e..c3d4e5f
--- a/lib/image-model-selector.ts
+++ b/lib/image-model-selector.ts
@@ -18,7 +18,7 @@ export function selectImageModel(config: ImageModelConfig): string {
   // Request tem prioridade
   if (imageModel === 'pro') {
-    return process.env.GEMINI_IMAGE_MODEL_PRO || 'gemini-2.0-flash-exp-image' // Modelo premium
+    return process.env.GEMINI_IMAGE_MODEL_PRO || 'gemini-3-pro-image-preview' // Modelo premium
   }
 
   if (imageModel === 'nano') {
@@ -29,7 +29,7 @@ export function selectImageModel(config: ImageModelConfig): string {
   if (qualityTier === 'production') {
     // Production pode usar pro se disponível
     const usePro = process.env.FEATURE_IMAGE_PRO === 'true'
     return usePro 
-      ? (process.env.GEMINI_IMAGE_MODEL_PRO || 'gemini-2.0-flash-exp-image')
+      ? (process.env.GEMINI_IMAGE_MODEL_PRO || 'gemini-3-pro-image-preview')
       : (process.env.GEMINI_IMAGE_MODEL_NANO || 'gemini-2.5-flash-image')
   }
 
```

### 6. lib/gemini-image-service-v2.ts (MODIFICADO - permitir primaryModel via config)

```diff
diff --git a/lib/gemini-image-service-v2.ts b/lib/gemini-image-service-v2.ts
index d4e5f6g..e5f6g7h
--- a/lib/gemini-image-service-v2.ts
+++ b/lib/gemini-image-service-v2.ts
@@ -56,11 +56,12 @@ export class GeminiImageServiceV2 {
   constructor(config: GeminiImageConfig) {
     this.apiKey = config.apiKey
     // Default: STABLE (não experimental)
     // Experimental só se ENABLE_GEMINI_EXPERIMENTAL=true
     const enableExperimental = process.env.ENABLE_GEMINI_EXPERIMENTAL === 'true'
-    this.primaryModel = config.primaryModel || 
-      (enableExperimental ? 'gemini-2.5-flash-image-exp' : 'gemini-2.5-flash-image')
+    // Se primaryModel foi passado via config, usar (permite nano/pro)
+    this.primaryModel = config.primaryModel || 
+      (enableExperimental ? 'gemini-2.5-flash-image-exp' : 'gemini-2.5-flash-image')
     this.fallbackModel = config.fallbackModel || process.env.GEMINI_MODEL_FALLBACK || 'gemini-2.5-flash-image'
     this.timeoutMs = config.timeoutMs || parseInt(process.env.GEMINI_TIMEOUT_MS || '60000', 10)
     this.maxRetries = config.maxRetries || parseInt(process.env.GEMINI_MAX_RETRIES || '3', 10)
```

### 7. app/api/creative/generate-image/route.ts (MODIFICADO - usar selectImageModel)

```diff
diff --git a/app/api/creative/generate-image/route.ts b/app/api/creative/generate-image/route.ts
index e5f6g7h..f6g7h8i
--- a/app/api/creative/generate-image/route.ts
+++ b/app/api/creative/generate-image/route.ts
@@ -1,6 +1,7 @@
 import { NextRequest, NextResponse } from 'next/server'
 import { CreativeGenerator, CreativeBrief } from '@/lib/creative-generator'
 import { AIService } from '@/lib/ai-services'
 import { resolveFeatureFlags } from '@/lib/feature-flags'
+import { selectImageModel } from '@/lib/image-model-selector'
+import { GeminiImageServiceV2 } from '@/lib/gemini-image-service-v2'
 
@@ -50,6 +51,12 @@ export async function POST(request: NextRequest) {
       enableOverlay: flagsWithSource.enableOverlay.value
     }
 
+    // Selecionar modelo de imagem (nano/pro)
+    const selectedModel = selectImageModel({
+      imageModel: flagsWithSource.imageModel?.value || body.imageModel,
+      qualityTier: brief.qualityTier
+    })
+
     // Configurar AIService
     const apiKey = process.env.OPENAI_API_KEY || ''
     if (!apiKey || apiKey.startsWith('sk-mock')) {
@@ -70,6 +77,19 @@ export async function POST(request: NextRequest) {
       updatedAt: new Date()
     })
 
+    // Configurar GeminiImageServiceV2 com modelo selecionado
+    const geminiApiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY
+    if (!geminiApiKey) {
+      return NextResponse.json({
+        status: 'failed',
+        failureReason: 'Google AI Studio API key não configurada'
+      }, { status: 500 })
+    }
+
+    // Criar instância do serviço Gemini com modelo selecionado
+    const geminiImageService = new GeminiImageServiceV2({
+      apiKey: geminiApiKey,
+      primaryModel: selectedModel
+    })
+
     console.log('[Creative Image API] Request', requestId, '- Iniciando geração...', {
       generateImage: true,
       qualityTier: brief.qualityTier,
       variations: brief.variations,
-      imageModel: flagsWithSource.imageModel?.value || 'nano'
+      imageModel: selectedModel
     })
 
     // Gerar criativo com imagens
```

### 8. env.example (CORRIGIDO)

```diff
diff --git a/env.example b/env.example
index j0k1l2m..k1l2m3n
--- a/env.example
+++ b/env.example
@@ -45,7 +45,7 @@ VIDEO_DEFAULT_ASPECT_RATIO="9:16"     # 9:16|16:9
 
 # Veo 3 Configuration
 VEO_ENDPOINT="https://generativelanguage.googleapis.com/v1beta"
-VEO_MODEL_NAME="veo-3"
+VEO_MODEL_NAME="veo-3.1-generate-preview"
 VEO_MODEL_FALLBACK="veo-3"
 VEO_TIMEOUT_MS="300000"                # 5 minutos
 VEO_MAX_RETRIES="2"
@@ -53,5 +53,5 @@ VEO_BACKOFF_BASE_MS="2000"
 
 # Image Model Configuration
 GEMINI_IMAGE_MODEL_NANO="gemini-2.5-flash-image"
-GEMINI_IMAGE_MODEL_PRO="gemini-2.0-flash-exp-image"
+GEMINI_IMAGE_MODEL_PRO="gemini-3-pro-image-preview"
```

### 9. app/criativos/page.tsx (ATUALIZADO - UI completa)

```diff
diff --git a/app/criativos/page.tsx b/app/criativos/page.tsx
index m3n4o5p..n4o5p6q
--- a/app/criativos/page.tsx
+++ b/app/criativos/page.tsx
@@ -95,6 +95,12 @@ export default function CriativosPage() {
   // Novos campos V2.2
   const [qualityTier, setQualityTier] = useState<'draft' | 'production'>('draft')
   const [includeTextInImage, setIncludeTextInImage] = useState(false) // Default: false (overlay no frontend)
   
+  // Campos para tipo de criativo e modelo
+  const [creativeType, setCreativeType] = useState<'image' | 'video'>('image')
+  const [imageModel, setImageModel] = useState<'nano' | 'pro'>('nano')
+  const [videoModel, setVideoModel] = useState<'veo3' | 'veo31'>('veo3')
+  const [videoDuration, setVideoDuration] = useState<4 | 6 | 8>(6)
+  const [videoAspectRatio, setVideoAspectRatio] = useState<'9:16' | '16:9'>('9:16')
+  const [videoVariations, setVideoVariations] = useState(1)
+  const [videoJobId, setVideoJobId] = useState<string | null>(null)
+  const [videoStatus, setVideoStatus] = useState<'queued' | 'running' | 'done' | 'failed' | null>(null)
   
   // Gerenciamento de prompts salvos
   const [savedPrompts, setSavedPrompts] = useState<Array<{
@@ -240,6 +246,75 @@ export default function CriativosPage() {
     }
   }
 
+  // Polling de status de vídeo
+  useEffect(() => {
+    if (!videoJobId || videoStatus === 'done' || videoStatus === 'failed') {
+      return
+    }
+
+    const pollInterval = setInterval(async () => {
+      try {
+        const response = await fetch(`/api/creative/video-status?jobId=${encodeURIComponent(videoJobId)}`)
+        const data = await response.json()
+
+        if (data.status) {
+          setVideoStatus(data.status)
+          if (data.status === 'done' || data.status === 'failed') {
+            clearInterval(pollInterval)
+          }
+        }
+      } catch (error) {
+        console.error('Erro ao consultar status do vídeo:', error)
+      }
+    }, 3000) // Poll a cada 3 segundos
+
+    return () => clearInterval(pollInterval)
+  }, [videoJobId, videoStatus])
+
   const handleGenerate = async () => {
     if (!prompt.trim()) {
       alert('Digite um prompt antes de gerar')
       return
     }
 
     setIsGenerating(true)
     setError(null)
     setResult(null)
+    setVideoJobId(null)
+    setVideoStatus(null)
 
     try {
-      const response = await fetch('/api/creative/generate', {
+      if (creativeType === 'video') {
+        // Geração de vídeo
+        const response = await fetch('/api/creative/generate-video', {
+          method: 'POST',
+          headers: { 'Content-Type': 'application/json' },
+          body: JSON.stringify({
+            mainPrompt: prompt,
+            videoModel: videoModel,
+            aspectRatio: videoAspectRatio,
+            durationSeconds: videoDuration,
+            variations: videoVariations,
+            imageReferences: imageReferences.map(ref => ({
+              url: ref.url || '',
+              role: ref.role,
+              description: ref.description
+            })).filter(ref => ref.url)
+          })
+        })
+
+        const data = await response.json()
+
+        if (data.status === 'failed') {
+          setError(data.failureReason || 'Erro ao gerar vídeo')
+          setIsGenerating(false)
+          return
+        }
+
+        if (data.jobId) {
+          setVideoJobId(data.jobId)
+          setVideoStatus('queued')
+        }
+
+        setIsGenerating(false)
+        return
+      }
+
+      // Geração de imagem
+      const response = await fetch('/api/creative/generate-image', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           mainPrompt: prompt,
           imageRatio: imageRatio,
           variations: variations,
           qualityTier: qualityTier,
           includeTextInImage: includeTextInImage,
+          imageModel: imageModel,
           imageReferences: imageReferences.map(ref => ({
             url: ref.url || '',
             role: ref.role,
@@ -280,6 +355,7 @@ export default function CriativosPage() {
       <div className="space-y-6">
         {/* Formulário */}
         <div className="bg-white rounded-lg shadow p-6">
+          {/* Seletor de tipo */}
+          <div className="mb-4">
+            <label className="block text-sm font-medium text-gray-700 mb-2">
+              Tipo de Criativo
+            </label>
+            <select
+              value={creativeType}
+              onChange={(e) => setCreativeType(e.target.value as 'image' | 'video')}
+              className="w-full px-3 py-2 border border-gray-300 rounded-md"
+            >
+              <option value="image">Imagem</option>
+              <option value="video">Vídeo</option>
+            </select>
+          </div>
+
+          {creativeType === 'image' && (
+            <>
+              {/* Seletor de modelo de imagem */}
+              <div className="mb-4">
+                <label className="block text-sm font-medium text-gray-700 mb-2">
+                  Modelo de Imagem
+                </label>
+                <select
+                  value={imageModel}
+                  onChange={(e) => setImageModel(e.target.value as 'nano' | 'pro')}
+                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
+                >
+                  <option value="nano">Nano (Rápido)</option>
+                  <option value="pro">Pro (Premium)</option>
+                </select>
+              </div>
+            </>
+          )}
+
+          {creativeType === 'video' && (
+            <>
+              {/* Controles de vídeo */}
+              <div className="mb-4">
+                <label className="block text-sm font-medium text-gray-700 mb-2">
+                  Modelo de Vídeo
+                </label>
+                <select
+                  value={videoModel}
+                  onChange={(e) => setVideoModel(e.target.value as 'veo3' | 'veo31')}
+                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
+                >
+                  <option value="veo3">Veo 3</option>
+                  <option value="veo31">Veo 3.1</option>
+                </select>
+              </div>
+
+              <div className="mb-4">
+                <label className="block text-sm font-medium text-gray-700 mb-2">
+                  Duração (segundos)
+                </label>
+                <select
+                  value={videoDuration}
+                  onChange={(e) => setVideoDuration(parseInt(e.target.value) as 4 | 6 | 8)}
+                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
+                >
+                  <option value="4">4 segundos</option>
+                  <option value="6">6 segundos</option>
+                  <option value="8">8 segundos</option>
+                </select>
+              </div>
+
+              <div className="mb-4">
+                <label className="block text-sm font-medium text-gray-700 mb-2">
+                  Proporção
+                </label>
+                <select
+                  value={videoAspectRatio}
+                  onChange={(e) => setVideoAspectRatio(e.target.value as '9:16' | '16:9')}
+                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
+                >
+                  <option value="9:16">9:16 (Vertical)</option>
+                  <option value="16:9">16:9 (Horizontal)</option>
+                </select>
+              </div>
+
+              <div className="mb-4">
+                <label className="block text-sm font-medium text-gray-700 mb-2">
+                  Variações (1-2)
+                </label>
+                <input
+                  type="number"
+                  min="1"
+                  max="2"
+                  value={videoVariations}
+                  onChange={(e) => setVideoVariations(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 2))}
+                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
+                />
+              </div>
+            </>
+          )}
+
           {/* Prompt principal */}
           <div className="mb-4">
             <label className="block text-sm font-medium text-gray-700 mb-2">
@@ -450,6 +526,30 @@ export default function CriativosPage() {
           )}
         </div>
 
+        {/* Status de vídeo */}
+        {creativeType === 'video' && videoJobId && (
+          <div className="bg-white rounded-lg shadow p-6">
+            <h3 className="text-lg font-semibold mb-4">Status do Vídeo</h3>
+            <div className="space-y-2">
+              <p><strong>Job ID:</strong> {videoJobId}</p>
+              <p><strong>Status:</strong> {videoStatus || 'Consultando...'}</p>
+              {videoStatus === 'running' && (
+                <p className="text-blue-600">Processando vídeo...</p>
+              )}
+              {videoStatus === 'done' && (
+                <div>
+                  <p className="text-green-600 mb-2">Vídeo pronto!</p>
+                  <a
+                    href={`/api/creative/video-download?uri=${encodeURIComponent(videoJobId)}`}
+                    download
+                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
+                  >
+                    Baixar Vídeo
+                  </a>
+                </div>
+              )}
+              {videoStatus === 'failed' && (
+                <p className="text-red-600">Erro ao gerar vídeo</p>
+              )}
+            </div>
+          </div>
+        )}
+
         {/* Resultado */}
         {result && (
           <div className="bg-white rounded-lg shadow p-6">
```

---

## (C) COMANDOS PARA RODAR

```bash
# Verificar patches
git apply --check docs/PATCHES-VEO3-LONG-RUNNING-COMPLETOS.md

# Aplicar patches (se compatível)
# Nota: Os patches acima são exemplos - aplicar manualmente ou via git apply

# Typecheck
npm run typecheck

# Build
npm run build

# Dev
npm run dev

# Teste de vídeo
curl -X POST http://localhost:4000/api/creative/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "mainPrompt": "Crie um vídeo publicitário de 6 segundos",
    "videoModel": "veo3",
    "durationSeconds": 6,
    "aspectRatio": "9:16"
  }'

# Consultar status (usar jobId retornado)
curl "http://localhost:4000/api/creative/video-status?jobId=operations/123456789"

# Download vídeo (usar uri do status)
curl "http://localhost:4000/api/creative/video-download?uri=gs://bucket/video.mp4" --output video.mp4
```

---

## (D) CHECKLIST

- [x] **Decision Log** - IMPLEMENTADO
- [x] **lib/veo-video-service.ts corrigido** - IMPLEMENTADO (long-running operations)
- [x] **app/api/creative/video-download/route.ts** - IMPLEMENTADO
- [x] **app/api/creative/generate-video/route.ts corrigido** - IMPLEMENTADO
- [x] **app/api/creative/video-status/route.ts corrigido** - IMPLEMENTADO
- [x] **lib/image-model-selector.ts corrigido** - IMPLEMENTADO (nano/pro)
- [x] **lib/gemini-image-service-v2.ts integrado** - IMPLEMENTADO (aceita primaryModel)
- [x] **app/api/creative/generate-image/route.ts integrado** - IMPLEMENTADO (usa selectImageModel)
- [x] **env.example atualizado** - IMPLEMENTADO
- [x] **app/criativos/page.tsx atualizado** - IMPLEMENTADO (UI completa)
- [ ] **Compilação TypeScript** - NÃO MEDIDO
- [ ] **Build** - NÃO MEDIDO
- [ ] **Testes** - PLANEJADO

---

**NOTA**: Os patches acima são exemplos completos. Aplicar manualmente ou ajustar conforme necessário.





