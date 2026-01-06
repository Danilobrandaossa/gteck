import { db } from '@/lib/db'
import { AIService } from '@/lib/ai-services'
import { HttpError, jsonResponse, withApiHandler } from '@/lib/api-handler'
import { logger } from '@/lib/logger'

// POST /api/ai-content/[id]/regenerate - Regenerar conteúdo
export const POST = withApiHandler(async ({ request, params, requestId }) => {
  const id = params.id as string

  if (!id) {
    throw new HttpError(400, 'INVALID_PARAMS', 'ID do conteúdo é obrigatório')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new HttpError(400, 'INVALID_BODY', 'Body JSON inválido')
  }

  if (typeof body !== 'object' || body === null) {
    throw new HttpError(400, 'INVALID_BODY', 'Body JSON inválido')
  }

  const { organizationId, siteId } = body as { organizationId?: string; siteId?: string }

  // ✅ CORREÇÃO ALTA: Validar contexto de tenant
  if (!organizationId || !siteId) {
    throw new HttpError(400, 'INVALID_TENANT_CONTEXT', 'organizationId e siteId são obrigatórios')
  }

  const { requireTenantContext } = await import('@/lib/tenant-security')
  requireTenantContext(organizationId, siteId)

  const content = await db.aIContent.findUnique({
    where: { id },
    select: { 
      id: true,
      title: true,
      keywords: true,
      language: true,
      category: true,
      aiModel: true,
      prompt: true,
      additionalInstructions: true,
      siteId: true,
      organizationId: true
    }
  })

  if (!content) {
    throw new HttpError(404, 'CONTENT_NOT_FOUND', 'Conteúdo não encontrado')
  }

  // ✅ CORREÇÃO ALTA: Validar ownership do conteúdo
  if (content.siteId !== siteId || content.organizationId !== organizationId) {
    throw new HttpError(403, 'CONTENT_OWNERSHIP_MISMATCH', 'Conteúdo não pertence ao tenant especificado')
  }

  const { prompt: newPrompt, additionalInstructions } = body as {
    prompt?: string
    additionalInstructions?: string
  }

  await db.aIContent.update({
    where: { id },
    data: {
      status: 'generating',
      errorMessage: null
    }
  })

  regenerateContentAsync(id, {
    title: content.title,
    keywords: content.keywords || undefined,
    language: content.language || 'pt-BR',
    category: content.category || undefined,
    aiModel: content.aiModel || 'gpt-4',
    prompt: newPrompt || content.prompt || `Crie um artigo completo sobre: ${content.title}`,
    additionalInstructions: additionalInstructions || content.additionalInstructions || undefined
  }).catch((error: unknown) => {
    logger.error('Erro ao regenerar conteúdo em background', {
      requestId,
      error: error instanceof Error ? error : new Error(String(error))
    })
    db.aIContent.update({
      where: { id },
      data: {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido ao regenerar conteúdo'
      }
    }).catch((err: unknown) => {
      logger.error('Falha ao atualizar status de erro do conteúdo', {
        requestId,
        error: err instanceof Error ? err : new Error(String(err))
      })
    })
  })

  await db.aIContentHistory.create({
    data: {
      contentId: id,
      action: 'regenerate',
      prompt: newPrompt || content.prompt || null,
      metadata: JSON.stringify({ title: content.title, additionalInstructions })
    }
  })

  // ✅ CORREÇÃO: Retornar 202 Accepted para operação assíncrona
  return jsonResponse(
    {
      success: true,
      message: 'Regeneração iniciada. Status será atualizado automaticamente.',
      contentId: id
    },
    requestId,
    { status: 202 }
  )
}, { route: 'ai-content.regenerate', defaultErrorCode: 'AI_REGENERATE_ERROR' })

// Função assíncrona para regenerar conteúdo
async function regenerateContentAsync(
  contentId: string,
  params: {
    title: string
    keywords?: string
    language?: string
    category?: string
    aiModel?: string
    prompt: string
    additionalInstructions?: string
  }
) {
  try {
    const { title, keywords, language, category, aiModel, prompt, additionalInstructions } = params

    console.log('🔄 Regenerating content via AI...', { title, aiModel })

    // Usar API key do ambiente
    const apiKey = process.env.OPENAI_API_KEY || ''
    
    if (!apiKey || apiKey.startsWith('sk-mock')) {
      throw new Error('OpenAI API key não configurada')
    }

    // Configurar AIService
    const aiService = new AIService({
      id: 'content-regeneration',
      name: 'Content Regeneration Service',
      type: 'openai',
      status: 'active',
      credentials: {
        apiKey: apiKey,
        endpoint: 'https://api.openai.com/v1'
      },
      settings: {
        model: aiModel || 'gpt-4',
        maxTokens: 4000,
        temperature: 0.7
      },
      usage: { requests: 0, tokens: 0, cost: 0 },
      lastUsed: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Construir prompt completo
    let fullPrompt = prompt
    if (additionalInstructions) {
      fullPrompt += `\n\nInstruções adicionais: ${additionalInstructions}`
    }

    // Gerar conteúdo
    const aiResult = await aiService.generateContent({
      prompt: fullPrompt,
      model: aiModel || 'gpt-4',
      maxTokens: 4000,
      temperature: 0.7,
      type: 'text'
    })

    if (!aiResult.success || !aiResult.data?.content) {
      throw new Error(aiResult.error || 'Erro ao regenerar conteúdo via IA')
    }

    const generatedContent = aiResult.data.content
    const wordCount = generatedContent.split(/\s+/).length
    const excerpt = generatedContent.substring(0, 200) + '...'

    // Atualizar conteúdo no banco
    await db.aIContent.update({
      where: { id: contentId },
      data: {
        excerpt,
        content: generatedContent,
        status: 'draft',
        wordCount: wordCount,
        prompt: prompt,
        additionalInstructions: additionalInstructions || null,
        generationConfig: JSON.stringify({ aiModel, prompt, additionalInstructions }),
        errorMessage: null
      }
    })

    console.log('✅ Content regenerated successfully:', contentId)

    // Registrar histórico
    await db.aIContentHistory.create({
      data: {
        contentId: contentId,
        action: 'regenerate_completed',
        prompt: prompt,
        metadata: JSON.stringify({ title, keywords, language, category, aiModel, wordCount })
      }
    })

  } catch (error) {
    console.error('Erro na regeneração assíncrona:', error)
    
    // Atualizar status para erro
    await db.aIContent.update({
      where: { id: contentId },
      data: {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido na regeneração'
      }
    }).catch(console.error)
  }
}
