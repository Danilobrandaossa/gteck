import { NextRequest, NextResponse } from 'next/server'

// Forçar runtime Node.js para stream/Buffer com segurança
export const runtime = 'nodejs'

/**
 * GET /api/creative/video-download?uri=...
 * 
 * Faz download server-side do vídeo e faz stream para o cliente
 * Proteção SSRF + limites de download + timeout
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const videoUri = searchParams.get('uri')

    if (!videoUri) {
      return NextResponse.json({
        error: 'uri é obrigatório'
      }, { status: 400 })
    }

    // Validar esquema: permitir apenas https:// ou gs://
    if (!videoUri.startsWith('https://') && !videoUri.startsWith('gs://')) {
      return NextResponse.json({
        error: 'URI deve começar com https:// ou gs://'
      }, { status: 400 })
    }

    // Obter API key
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY || process.env.VEO_API_KEY
    if (!apiKey || apiKey.startsWith('mock')) {
      return NextResponse.json({
        error: 'API key não configurada'
      }, { status: 500 })
    }

    // Converter gs:// para https://storage.googleapis.com
    let downloadUrl = videoUri
    if (videoUri.startsWith('gs://')) {
      const gsMatch = videoUri.match(/^gs:\/\/([^\/]+)\/(.+)$/)
      if (!gsMatch) {
        return NextResponse.json({
          error: 'Formato gs:// inválido'
        }, { status: 400 })
      }
      const [, bucket, object] = gsMatch
      // Encode cada segmento do path separadamente (suporta paths com /)
      const safeObject = object.split('/').map(encodeURIComponent).join('/')
      downloadUrl = `https://storage.googleapis.com/${bucket}/${safeObject}`
    }

    // Proteção SSRF: validar host
    try {
      const urlObj = new URL(downloadUrl)
      const hostname = urlObj.hostname

      // Bloquear IPs literais (127.0.0.1, 10.x, 192.168.x, 169.254.x, 0.x, ::1, etc)
      if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.|0\.|::1|localhost)/.test(hostname)) {
        return NextResponse.json({
          error: 'Host não permitido (IP literal bloqueado)'
        }, { status: 403 })
      }

      // Allowlist de hosts via ENV
      const allowedHosts = process.env.VIDEO_DOWNLOAD_ALLOWED_HOSTS || 'storage.googleapis.com,*.googleapis.com,*.googleusercontent.com'
      const allowedPatterns = allowedHosts.split(',').map(h => h.trim())

      let isAllowed = false
      for (const pattern of allowedPatterns) {
        if (pattern.startsWith('*.')) {
          // Wildcard: *.googleapis.com
          const domain = pattern.substring(2)
          if (hostname === domain || hostname.endsWith('.' + domain)) {
            isAllowed = true
            break
          }
        } else {
          // Exact match
          if (hostname === pattern) {
            isAllowed = true
            break
          }
        }
      }

      if (!isAllowed) {
        console.warn('[Video Download] Host bloqueado:', hostname)
        return NextResponse.json({
          error: 'Host não permitido'
        }, { status: 403 })
      }
    } catch (urlError) {
      return NextResponse.json({
        error: 'URL inválida'
      }, { status: 400 })
    }

    // Timeout e limite de bytes
    const timeoutMs = parseInt(process.env.VIDEO_DOWNLOAD_TIMEOUT_MS || '120000', 10)
    const maxBytes = parseInt(process.env.VIDEO_DOWNLOAD_MAX_BYTES || '104857600', 10) // 100MB default

    // AbortController para timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      // Fazer fetch com redirects seguidos e header x-goog-api-key
      const videoResponse = await fetch(downloadUrl, {
        headers: {
          'x-goog-api-key': apiKey
        },
        redirect: 'follow',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!videoResponse.ok) {
        return NextResponse.json({
          error: `Erro ao baixar vídeo: ${videoResponse.status}`
        }, { status: videoResponse.status })
      }

      // Verificar content-length se disponível
      const contentLength = videoResponse.headers.get('content-length')
      if (contentLength) {
        const length = parseInt(contentLength, 10)
        if (length > maxBytes) {
          return NextResponse.json({
            error: `Vídeo muito grande (${Math.round(length / 1024 / 1024)}MB). Limite: ${Math.round(maxBytes / 1024 / 1024)}MB`
          }, { status: 413 })
        }
      }

      // Stream com limite de bytes
      const reader = videoResponse.body?.getReader()
      if (!reader) {
        return NextResponse.json({
          error: 'Resposta sem body'
        }, { status: 500 })
      }

      const chunks: Uint8Array[] = []
      let totalBytes = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        if (value) {
          totalBytes += value.length
          if (totalBytes > maxBytes) {
            reader.cancel()
            return NextResponse.json({
              error: `Vídeo excedeu limite de ${Math.round(maxBytes / 1024 / 1024)}MB`
            }, { status: 413 })
          }
          chunks.push(value)
        }
      }

      // Concatenar chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      const videoBuffer = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        videoBuffer.set(chunk, offset)
        offset += chunk.length
      }

      // Obter Content-Type do upstream ou usar default
      const contentType = videoResponse.headers.get('content-type') || 'video/mp4'

      // Retornar como stream MP4
      return new NextResponse(videoBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': videoBuffer.length.toString(),
          'Content-Disposition': 'attachment; filename="creative.mp4"',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json({
          error: 'Timeout ao baixar vídeo'
        }, { status: 408 })
      }

      console.error('[Video Download] Erro ao fazer fetch:', fetchError)
      return NextResponse.json({
        error: 'Erro ao baixar vídeo do servidor'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('[Video Download] Erro:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
