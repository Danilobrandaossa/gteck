import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AIService } from '@/lib/ai-services'
import { requireTenantContext, validateSiteBelongsToOrganization } from '@/lib/tenant-security'
import { StructuredLogger } from '@/lib/observability/logger'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'

export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('ai-content.generate', correlationId)

  try {
    const body = await request.json()
    const { siteId, title, keywords, language, category, aiModel, prompt, organizationId } = body

    // ✅ CORREÇÃO CRÍTICA: Validar contexto de tenant
    let tenantContext
    try {
      tenantContext = requireTenantContext(organizationId, siteId)
    } catch (error) {
      logger.warn('Tenant validation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'organizationId e siteId são obrigatórios e devem ser CUIDs válidos', errorCode: 'INVALID_TENANT_CONTEXT' },
          { status: 400 }
        ),
        correlationId
      )
    }

    // ✅ CORREÇÃO: Validar que site pertence à organização
    const siteBelongsToOrg = await validateSiteBelongsToOrganization(siteId, organizationId)
    if (!siteBelongsToOrg) {
      logger.warn('Site ownership validation failed', { siteId, organizationId })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'Site não pertence à organização especificada', errorCode: 'SITE_OWNERSHIP_MISMATCH' },
          { status: 403 }
        ),
        correlationId
      )
    }

    logger.info('AI content generation request', {
      organizationId: tenantContext.organizationId,
      siteId: tenantContext.siteId,
      title,
      language: language || 'pt-BR'
    })

    if (!siteId || !title) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'siteId e title são obrigatórios' },
          { status: 400 }
        ),
        correlationId
      )
    }

    // Verificar se o site existe e pertence à organização
    logger.info('Verifying site', { siteId })
    let site
    try {
      site = await db.site.findUnique({
        where: { id: siteId },
        select: { id: true, name: true, organizationId: true }
      })
      
      if (site && site.organizationId !== organizationId) {
        logger.warn('Site organization mismatch', { 
          siteOrganizationId: site.organizationId, 
          requestedOrganizationId: organizationId 
        })
        return addCorrelationIdToResponse(
          NextResponse.json(
            { error: 'Site não pertence à organização especificada', errorCode: 'SITE_OWNERSHIP_MISMATCH' },
            { status: 403 }
          ),
          correlationId
        )
      }
      
      logger.info('Site verified', { siteId, siteName: site?.name })
    } catch (dbError) {
      logger.error('Error verifying site', { error: dbError instanceof Error ? dbError.message : 'Unknown error' })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'Erro ao verificar site', details: dbError instanceof Error ? dbError.message : 'Erro desconhecido' },
          { status: 500 }
        ),
        correlationId
      )
    }

    if (!site) {
      logger.warn('Site not found', { siteId })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { error: 'Site não encontrado. Selecione ou crie um site válido antes de gerar conteúdo.' },
          { status: 404 }
        ),
        correlationId
      )
    }

    // Criar registro inicial com status "generating"
    logger.info('Creating AI content record', { title })
    let content
    try {
      content = await db.aIContent.create({
        data: {
          title,
          excerpt: null,
          content: null,
          status: 'generating',
          language: language || 'pt-BR',
          category: category || null,
          keywords: keywords || null,
          aiModel: aiModel || 'gpt-4',
          prompt: prompt || null,
          generationConfig: JSON.stringify({ aiModel, prompt }),
          siteId,
          organizationId, // ✅ CORREÇÃO: Incluir organizationId no registro
          authorId: null // TODO: Get from authentication context
        }
      })
      logger.info('AI content record created', { contentId: content.id })
    } catch (dbError) {
      logger.error('Error creating AI content record', { 
        error: dbError instanceof Error ? dbError.message : 'Unknown error'
      })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { 
            error: 'Erro ao criar conteúdo no banco de dados', 
            details: dbError instanceof Error ? dbError.message : 'Erro desconhecido',
            stack: process.env.NODE_ENV === 'development' && dbError instanceof Error ? dbError.stack : undefined
          },
          { status: 500 }
        ),
        correlationId
      )
    }

    // Gerar conteúdo via IA em background (não bloquear resposta)
    generateContentAsync(content.id, {
      title,
      keywords,
      language: language || 'pt-BR',
      category,
      aiModel: aiModel || 'gpt-4',
      prompt: prompt || null,
      additionalInstructions: prompt || undefined
    }).catch(error => {
      console.error('Error generating content:', error)
      // Atualizar status para erro
      db.aIContent.update({
        where: { id: content.id },
        data: {
          status: 'error',
          errorMessage: error.message || 'Error generating content'
        }
      }).catch(console.error)
    })

    // Registrar histórico
    console.log('📝 Registrando histórico...')
    try {
      await db.aIContentHistory.create({
        data: {
          contentId: content.id,
          action: 'generate',
          prompt: prompt || null,
          metadata: JSON.stringify({ title, keywords, language, category, aiModel })
        }
      })
      console.log('✅ Histórico registrado')
    } catch (historyError) {
      console.error('⚠️  Erro ao registrar histórico (não crítico):', historyError)
      // Não bloquear se falhar o histórico
    }

    console.log('✅ Retornando sucesso para geração iniciada:', content.id)
    return NextResponse.json({
      success: true,
      content,
      message: 'Content generation started. Status will be updated automatically.'
    })
  } catch (error) {
    console.error('❌ Erro ao iniciar geração:', error)
    return NextResponse.json(
      { error: 'Erro ao iniciar geração', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

// Adicionar export GET para debug (pode ser removido depois)
export async function GET(_request: NextRequest) {
  console.log('📥 GET /api/ai-content/generate recebido (debug)')
  return NextResponse.json({
    success: true,
    message: 'Rota /api/ai-content/generate está funcionando',
    method: 'GET',
    note: 'Use POST para gerar conteúdo'
  })
}

// Função para construir prompt otimizado com configurações padrão
function buildOptimizedPrompt(
  title: string,
  keywords?: string,
  language: string = 'pt-BR',
  category?: string,
  additionalInstructions?: string
): string {
  // Se houver instruções adicionais explícitas, usar como base
  if (additionalInstructions && additionalInstructions.trim()) {
    return `Você é um redator web especialista em Copywriting e SEO avançado. Seu objetivo é criar artigos que gerem interesse, atenção, retenção, identificação, conexão, segurança, confiança e desejo.

${additionalInstructions}

Título: ${title}
${keywords ? `Palavras-chave: ${keywords}` : ''}
Idioma: ${language}
${category ? `Categoria: ${category}` : ''}

Gere o artigo completo em HTML formatado para WordPress, seguindo as regras acima.`
  }

  // Prompt padrão com todas as configurações
  return `Você é um redator web especialista em Copywriting e SEO avançado. Seu objetivo é criar artigos que gerem interesse, atenção, retenção, identificação, conexão, segurança, confiança e desejo.

Título: ${title}
${keywords ? `Palavras-chave: ${keywords}` : ''}
Idioma: ${language}
${category ? `Categoria: ${category}` : ''}

REGRAS OBRIGATÓRIAS:

1. TAMANHO: Artigos de 2.000 a 2.500 palavras. Conteúdo completo e informativo.

2. SEO: Insira a frase-chave em algumas H2. Use palavras-chave naturalmente (densidade 1-2%). Estrutura com H1, H2, H3.

3. FORMATAÇÃO: Cada parágrafo em uma linha, com linha vazia entre eles. Formate H2, H3, listas numeradas e com marcadores para WordPress. HTML semântico. Parágrafos de 3-5 linhas.

4. LINGUAGEM: Humanizada, empolgante, gerando conexão (rapport), confiança e desejo. Use gatilhos mentais. Objetivos: conexão, interesse, desejo, retenção, curiosidade.

5. QUALIDADE: Textos originais, sem plágio. Apenas informações verídicas e validadas. NÃO invente dados. Conteúdo informativo seguindo boas práticas do Google. Deixe claro que não temos relação/controle sobre terceiros citados.

6. IMAGENS: Inclua 2-4 marcadores de imagem usando img-placeholder com data-description após H2/H3 principais. Exemplo: <img-placeholder data-description="Fotografia profissional de pessoas [tema], estilo clean, realista, sem texto" />

7. ESTRUTURA: Introdução (3-4 parágrafos), desenvolvimento com H2/H3, listas quando apropriado, conclusão com CTA (2-3 parágrafos).

Gere o artigo completo em HTML formatado para WordPress, seguindo TODAS as regras acima.`
}

// Função assíncrona para gerar conteúdo
async function generateContentAsync(
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

    console.log('🤖 Generating content via AI...', { title, aiModel })

    // Usar API key do ambiente (permitindo mock em desenvolvimento)
    const rawApiKey = process.env.OPENAI_API_KEY || ''
    const apiKey = rawApiKey.trim()
    const usingMockKey = !apiKey || apiKey.startsWith('sk-mock')
    const effectiveApiKey = usingMockKey ? (apiKey || 'sk-mock-dev') : apiKey

    // Construir prompt otimizado com configurações padrão
    const optimizedPrompt = buildOptimizedPrompt(
      title,
      keywords,
      language || 'pt-BR',
      category,
      additionalInstructions || prompt
    )

    // Configurar AIService
    const aiService = new AIService({
      id: 'content-generation',
      name: 'Content Generation Service',
      type: 'openai',
      status: 'active',
      credentials: {
        apiKey: effectiveApiKey,
        endpoint: 'https://api.openai.com/v1'
      },
      settings: {
        model: aiModel || 'gpt-4',
        maxTokens: 4000, // Aumentado para suportar 2000-2500 palavras
        temperature: 0.7
      },
      usage: { requests: 0, tokens: 0, cost: 0 },
      lastUsed: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Gerar conteúdo
    const aiResult = await aiService.generateContent({
      prompt: optimizedPrompt,
      model: aiModel || 'gpt-4',
      maxTokens: 4000, // Aumentado para suportar 2000-2500 palavras
      temperature: 0.7,
      type: 'text'
    })

    if (!aiResult.success || !aiResult.data?.content) {
      if (usingMockKey) {
        console.warn('⚠️  IA retornou resposta inválida em modo mock, usando fallback de conteúdo.')
        aiResult.data = {
          content: 'Conteúdo mock de fallback gerado automaticamente. Em ambiente de produção, este texto seria substituído pelo conteúdo real da IA.',
          model: aiModel || 'gpt-4',
          finishReason: 'stop'
        }
      } else {
        throw new Error(aiResult.error || 'Erro ao gerar conteúdo via IA')
      }
    }

    let generatedContent = aiResult.data.content
    const wordCount = generatedContent.split(/\s+/).length
    const excerpt = generatedContent.substring(0, 200) + '...'

    // Processar placeholders de imagem (img-placeholder)
    const imgPlaceholderRegex = /<img-placeholder\s+data-description="([^"]+)"\s*\/?>/gi
    const placeholders = Array.from(generatedContent.matchAll(imgPlaceholderRegex))
    
    if (!usingMockKey && placeholders.length > 0) {
      console.log(`🖼️  Encontrados ${placeholders.length} placeholders de imagem para processar...`)
      
      // Processar cada placeholder
      for (const placeholder of placeholders) {
        if (!Array.isArray(placeholder) || placeholder.length < 2) continue
        const description = placeholder[1] as string
        const fullMatch = placeholder[0] as string
        
        try {
          // Criar AIService específico para DALL-E (geração de imagens)
          // Usar 'openai' como type, pois DALL-E usa a API da OpenAI
          const dalleService = new AIService({
            id: 'dalle-image-generation',
            name: 'DALL-E Image Generation',
            type: 'openai',
            status: 'active',
            credentials: {
              apiKey: effectiveApiKey,
              endpoint: 'https://api.openai.com/v1'
            },
            settings: {
              model: 'dall-e-3'
            },
            usage: { requests: 0, tokens: 0, cost: 0 },
            lastUsed: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          })

          // Gerar imagem via DALL-E (type: 'image' faz o generateContent usar DALL-E automaticamente)
          const imageResult = await dalleService.generateContent({
            prompt: description,
            model: 'dall-e-3',
            type: 'image'
          })

          if (imageResult.success && imageResult.data) {
            // DALL-E retorna a estrutura: { images: [{ url, revisedPrompt }] }
            const imageUrl = imageResult.data.images?.[0]?.url || imageResult.data.url
            // Substituir placeholder por tag img
            const imgTag = `<img src="${imageUrl}" alt="${description}" style="max-width: 100%; height: auto; margin: 1rem 0;" />`
            generatedContent = generatedContent.replace(fullMatch, imgTag)
            console.log(`✅ Imagem gerada e inserida: ${description.substring(0, 50)}...`)
          } else {
            console.warn(`⚠️  Falha ao gerar imagem: ${description.substring(0, 50)}...`)
            // Remover placeholder se falhar
            generatedContent = generatedContent.replace(fullMatch, '')
          }
        } catch (error) {
          console.error(`❌ Erro ao gerar imagem para "${description}":`, error)
          // Remover placeholder em caso de erro
          generatedContent = generatedContent.replace(fullMatch, '')
        }
      }
    }

    // Criar slug
    const slug = title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Atualizar conteúdo no banco
    await db.aIContent.update({
      where: { id: contentId },
      data: {
        title,
        slug,
        excerpt,
        content: generatedContent,
        status: 'draft',
        language: language || 'pt-BR',
        category: category || null,
        keywords: keywords || null,
        wordCount: wordCount,
        aiModel: aiModel || 'gpt-4',
        prompt: prompt || null,
        generationConfig: JSON.stringify({ aiModel, prompt, hasDefaultConfig: true })
      }
    })

    console.log('✅ Content generated successfully:', contentId)

    // Registrar histórico
    await db.aIContentHistory.create({
      data: {
        contentId: contentId,
        action: 'generate_completed',
        prompt: prompt,
        metadata: JSON.stringify({ title, keywords, language, category, aiModel, wordCount })
      }
    })

  } catch (error) {
    console.error('Erro na geração assíncrona:', error)
    
    // Atualizar status para erro
    await db.aIContent.update({
      where: { id: contentId },
      data: {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido na geração'
      }
    }).catch(console.error)
  }
}


