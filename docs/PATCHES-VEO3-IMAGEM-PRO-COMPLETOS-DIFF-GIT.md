# PATCHES VEO 3.1 + IMAGEM PRO - DIFFS COMPLETOS (diff --git)

## (A) DECISION LOG

### Assunções sobre Long-Running Operations
- **Veo 3.1 usa REST long-running**: Endpoint `POST /v1beta/models/veo-3.1-generate-preview:predictLongRunning`
- **JobId = operation.name**: Retornado na resposta inicial como `response.name`
- **Status via GET**: Consulta `GET /v1beta/{operation.name}` com header `x-goog-api-key`
- **Download com redirects**: A URI retornada pode ter redirects, usar `redirect: 'follow'` no fetch
- **Parser tolerante**: Implementar extração de videoUri tolerante a múltiplos formatos de resposta:
  - `response.generateVideoResponse.generatedSamples[0].video.uri`
  - `response.predictions[0].videoUri`
  - `response.generatedVideos` ou `response.generated_videos`
  - `response.videoUri`
  - `response.uri`

### Modelos de Imagem
- **Nano**: `gemini-2.5-flash-image` (padrão, rápido)
- **Pro**: `gemini-3-pro-image-preview` (premium, alta qualidade)

### Modelo Veo
- **Padrão**: `veo-3.1-generate-preview` (conforme documentação)

### JobId e Storage
- **jobId NÃO depende de Map in-memory**: Status consultado diretamente na API, sem necessidade de storage local
- **Map in-memory é opcional**: Pode existir para cache/dev, mas não é necessário para funcionamento

---

## (B) PATCHES (diff --git)

### 1. lib/veo-video-service.ts (CORRIGIDO)

```diff
diff --git a/lib/veo-video-service.ts b/lib/veo-video-service.ts
index a1b2c3d..d4e5f6g
--- a/lib/veo-video-service.ts
+++ b/lib/veo-video-service.ts
@@ -80,15 +80,24 @@ export class VeoVideoService {
-    // Construir payload mínimo
+    // Construir payload mínimo conforme documentação
     const requestBody: any = {
       instances: [
         {
           prompt: request.prompt
         }
       ]
     }
 
-    // Adicionar configurações se suportadas
-    if (request.durationSeconds) {
-      requestBody.instances[0].durationSeconds = request.durationSeconds
-    }
-    if (request.aspectRatio) {
-      requestBody.instances[0].aspectRatio = request.aspectRatio
+    // Adicionar parameters se suportados (conforme docs)
+    const parameters: any = {}
+    if (request.durationSeconds) {
+      parameters.durationSeconds = request.durationSeconds
+    }
+    if (request.aspectRatio) {
+      parameters.aspectRatio = request.aspectRatio
+    }
+    if (Object.keys(parameters).length > 0) {
+      requestBody.parameters = parameters
     }
 
     // Adicionar image reference se fornecido
@@ -230,15 +239,30 @@ export class VeoVideoService {
   /**
-   * Extrai videoUri da resposta da operação
+   * Extrai videoUri da resposta da operação (parser tolerante a variações)
    */
   private extractVideoUri(response: any): string | undefined {
     if (!response) return undefined
 
+    // Formato 1: response.generateVideoResponse.generatedSamples[0].video.uri
+    if (response.generateVideoResponse?.generatedSamples && Array.isArray(response.generateVideoResponse.generatedSamples)) {
+      const sample = response.generateVideoResponse.generatedSamples[0]
+      if (sample?.video?.uri) {
+        return typeof sample.video.uri === 'string' ? sample.video.uri : sample.video.uri.uri
+      }
+    }
+
     // Formato 1: response.predictions[0].videoUri
     if (response.predictions && Array.isArray(response.predictions) && response.predictions.length > 0) {
       const prediction = response.predictions[0]
       if (prediction.videoUri) {
         return typeof prediction.videoUri === 'string' ? prediction.videoUri : prediction.videoUri.uri
       }
     }
 
+    // Formato 3: response.generatedVideos ou response.generated_videos
+    const generatedVideos = response.generatedVideos || response.generated_videos
+    if (generatedVideos) {
+      const video = Array.isArray(generatedVideos) ? generatedVideos[0] : generatedVideos
+      if (video?.uri) {
+        return typeof video.uri === 'string' ? video.uri : video.uri.uri
+      }
+      if (video?.videoUri) {
+        return typeof video.videoUri === 'string' ? video.videoUri : video.videoUri.uri
+      }
+    }
+
     // Formato 2: response.videoUri
     if (response.videoUri) {
       return typeof response.videoUri === 'string' ? response.videoUri : response.videoUri.uri
```

### 2. app/api/creative/video-download/route.ts (CORRIGIDO)

```diff
diff --git a/app/api/creative/video-download/route.ts b/app/api/creative/video-download/route.ts
index h8i9j0k..i9j0k1l
--- a/app/api/creative/video-download/route.ts
+++ b/app/api/creative/video-download/route.ts
@@ -43,6 +43,7 @@ export async function GET(request: NextRequest) {
       const videoResponse = await fetch(downloadUrl, {
         headers: {
           'x-goog-api-key': apiKey
-        }
+        },
+        redirect: 'follow' // Seguir redirects automaticamente
       })
```

### 3. env.example (CORRIGIDO)

```diff
diff --git a/env.example b/env.example
index j0k1l2m..k1l2m3n
--- a/env.example
+++ b/env.example
@@ -49,6 +49,7 @@ VIDEO_MAX_VARIATIONS="1"
 VIDEO_DEFAULT_DURATION_SECONDS="6"    # 4|6|8
 VIDEO_DEFAULT_ASPECT_RATIO="9:16"     # 9:16|16:9
+DEBUG_FLAGS="false"
 
 # Veo 3 Configuration
 VEO_ENDPOINT="https://generativelanguage.googleapis.com/v1beta"
```

---

## (C) COMANDOS PARA RODAR

```bash
# Typecheck
npm run typecheck

# Build
npm run build

# Dev
npm run dev

# Teste REST - Iniciar job de vídeo
curl -X POST http://localhost:4000/api/creative/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "mainPrompt": "Crie um vídeo publicitário de 6 segundos mostrando um produto",
    "videoModel": "veo31",
    "durationSeconds": 6,
    "aspectRatio": "9:16"
  }'

# Teste REST - Consultar status (usar jobId retornado)
curl "http://localhost:4000/api/creative/video-status?jobId=operations/1234567890123456789"

# Teste REST - Download vídeo (usar uri do status)
curl "http://localhost:4000/api/creative/video-download?uri=gs://bucket/video.mp4" --output video.mp4
```

---

## (D) CHECKLIST

- [x] **Decision Log** - IMPLEMENTADO
- [x] **lib/veo-video-service.ts corrigido** - IMPLEMENTADO (parser tolerante, parameters corretos)
- [x] **app/api/creative/video-download/route.ts corrigido** - IMPLEMENTADO (redirect: 'follow')
- [x] **app/api/creative/generate-video/route.ts** - IMPLEMENTADO (retorna operation.name)
- [x] **app/api/creative/video-status/route.ts** - IMPLEMENTADO (consulta operação real)
- [x] **lib/image-model-selector.ts** - IMPLEMENTADO (nano/pro corretos)
- [x] **lib/gemini-image-service-v2.ts** - IMPLEMENTADO (aceita primaryModel)
- [x] **app/api/creative/generate-image/route.ts** - IMPLEMENTADO (integra selectImageModel)
- [x] **lib/feature-flags.ts** - IMPLEMENTADO (resolve todos os campos)
- [x] **env.example atualizado** - IMPLEMENTADO (DEBUG_FLAGS adicionado)
- [x] **app/criativos/page.tsx** - IMPLEMENTADO (UI completa)
- [ ] **Compilação TypeScript** - NÃO MEDIDO
- [ ] **Build** - NÃO MEDIDO
- [ ] **Testes** - PLANEJADO

---

**NOTA**: A maioria dos arquivos já estava correta. Apenas `lib/veo-video-service.ts` e `app/api/creative/video-download/route.ts` precisaram de pequenos ajustes (parser tolerante e redirects).





