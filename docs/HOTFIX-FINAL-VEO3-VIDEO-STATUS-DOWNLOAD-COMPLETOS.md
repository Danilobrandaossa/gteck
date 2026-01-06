# HOTFIX FINAL — VIDEO-STATUS (downloadUrl interno) + gs:// correto + SSRF extra

## (B) PATCHES (diff --git)

### 1. app/api/creative/video-status/route.ts

```diff
diff --git a/app/api/creative/video-status/route.ts b/app/api/creative/video-status/route.ts
index g7h8i9j..j0k1l2m
--- a/app/api/creative/video-status/route.ts
+++ b/app/api/creative/video-status/route.ts
@@ -57,13 +57,20 @@ export async function GET(request: NextRequest) {
     }
 
-    // Retornar downloadUrl interno (não expor videoUri bruto)
+    // Retornar downloadUrl interno (não expor videoUri bruto)
     const response: any = {
       jobId: job.jobId,
       status: job.status,
       progress: job.progress,
       failureReason: job.failureReason,
       metadata: job.metadata
     }
 
-    // Quando status=done e existir videoUrl, retornar como downloadUrl
+    // Quando status=done e existir videoUrl, retornar downloadUrl interno
+    // NÃO retornar videoUrl bruto (gs:// ou https:// externo)
     if (job.status === 'done' && job.videoUrl) {
-      response.downloadUrl = job.videoUrl
+      // job.videoUrl já vem como `/api/creative/video-download?uri=...` do VeoVideoService
+      // Mas se vier bruto, construir downloadUrl interno
+      if (job.videoUrl.startsWith('/api/creative/video-download')) {
+        response.downloadUrl = job.videoUrl
+        response.previewUrl = job.videoUrl // Para <video src> funcionar
+      } else {
+        // Se vier URI bruto (gs:// ou https://), construir downloadUrl interno
+        response.downloadUrl = `/api/creative/video-download?uri=${encodeURIComponent(job.videoUrl)}`
+        response.previewUrl = response.downloadUrl
+      }
     }
 
     return NextResponse.json(response)
```

### 2. app/criativos/page.tsx

```diff
diff --git a/app/criativos/page.tsx b/app/criativos/page.tsx
index m3n4o5p..n4o5p6q
--- a/app/criativos/page.tsx
+++ b/app/criativos/page.tsx
@@ -278,8 +278,8 @@ export default function CriativosPage() {
         if (data.status) {
           setVideoStatus(data.status)
-          // Usar downloadUrl se disponível (preferido), senão videoUrl
+          // Usar sempre downloadUrl interno (não usar videoUrl bruto)
           if (data.downloadUrl) {
             setVideoUrl(data.downloadUrl)
-          } else if (data.videoUrl) {
-            setVideoUrl(data.videoUrl)
+          } else if (data.previewUrl) {
+            setVideoUrl(data.previewUrl)
           }
           if (data.status === 'done' || data.status === 'failed') {
```

### 3. app/api/creative/video-download/route.ts

```diff
diff --git a/app/api/creative/video-download/route.ts b/app/api/creative/video-download/route.ts
index h8i9j0k..i9j0k1l
--- a/app/api/creative/video-download/route.ts
+++ b/app/api/creative/video-download/route.ts
@@ -38,7 +38,8 @@ export async function GET(request: NextRequest) {
       const [, bucket, object] = gsMatch
-      downloadUrl = `https://storage.googleapis.com/${bucket}/${encodeURIComponent(object)}`
+      // Encode cada segmento do path separadamente (suporta paths com /)
+      const safeObject = object.split('/').map(encodeURIComponent).join('/')
+      downloadUrl = `https://storage.googleapis.com/${bucket}/${safeObject}`
     }
 
     // Proteção SSRF: validar host
@@ -56,7 +57,7 @@ export async function GET(request: NextRequest) {
       const hostname = urlObj.hostname
 
-      // Bloquear IPs literais (127.0.0.1, 10.x, 192.168.x, ::1, etc)
-      if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|::1|localhost)/.test(hostname)) {
+      // Bloquear IPs literais (127.0.0.1, 10.x, 192.168.x, 169.254.x, 0.x, ::1, etc)
+      if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.|0\.|::1|localhost)/.test(hostname)) {
         return NextResponse.json({
           error: 'Host não permitido (IP literal bloqueado)'
         }, { status: 403 })
```

---

**NOTA**: Todos os patches foram aplicados. O sistema agora:
- Não expõe videoUrl bruto (gs:// ou https:// externo) no video-status
- Retorna sempre downloadUrl interno com previewUrl para <video src>
- Frontend usa sempre downloadUrl/previewUrl (não videoUrl bruto)
- Conversão gs:// corrigida para suportar paths com múltiplos segmentos
- SSRF reforçado com bloqueio de 169.254.* e 0.*





