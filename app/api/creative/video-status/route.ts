import { NextRequest, NextResponse } from 'next/server'
import { VeoVideoService } from '@/lib/veo-video-service'

/**
 * GET /api/creative/video-status?jobId=...
 * 
 * Obtém status de job de vídeo
 * 
 * Query params:
 * - jobId: string (obrigatório)
 * 
 * Response:
 * {
 *   jobId: string,
 *   status: 'queued'|'running'|'failed'|'done',
 *   progress?: number,
 *   videoUrl?: string,
 *   thumbnailUrl?: string,
 *   failureReason?: string,
 *   metadata?: { model, durationSeconds, aspectRatio }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({
        status: 'failed',
        failureReason: 'jobId é obrigatório'
      }, { status: 400 })
    }

    // Obter API key (mesma do serviço)
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY || process.env.VEO_API_KEY
    if (!apiKey || apiKey.startsWith('mock')) {
      return NextResponse.json({
        status: 'failed',
        failureReason: 'Google AI Studio API key não configurada'
      }, { status: 500 })
    }

    // Criar serviço
    const videoService = new VeoVideoService({ apiKey })

    // Obter status (consulta operação na API)
    const job = await videoService.getVideoJobStatus(jobId)

    if (!job) {
      return NextResponse.json({
        status: 'failed',
        failureReason: `Job ${jobId} não encontrado`
      }, { status: 404 })
    }

    // Retornar downloadUrl interno (não expor videoUri bruto)
    const response: any = {
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      failureReason: job.failureReason,
      metadata: job.metadata
    }

    // Quando status=done e existir videoUrl, retornar downloadUrl interno
    // NÃO retornar videoUrl bruto (gs:// ou https:// externo)
    if (job.status === 'done' && job.videoUrl) {
      // job.videoUrl já vem como `/api/creative/video-download?uri=...` do VeoVideoService
      // Mas se vier bruto, construir downloadUrl interno
      if (job.videoUrl.startsWith('/api/creative/video-download')) {
        response.downloadUrl = job.videoUrl
        response.previewUrl = job.videoUrl // Para <video src> funcionar
      } else {
        // Se vier URI bruto (gs:// ou https://), construir downloadUrl interno
        response.downloadUrl = `/api/creative/video-download?uri=${encodeURIComponent(job.videoUrl)}`
        response.previewUrl = response.downloadUrl
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Creative Video Status API] Erro:', error)
    return NextResponse.json({
      status: 'failed',
      failureReason: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

