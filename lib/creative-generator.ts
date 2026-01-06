/**
 * 🎯 CREATIVE GENERATOR - Gerador de Criativos de Anúncios Orientado a Performance
 * 
 * Regras:
 * - NÃO inventar marcas, selos oficiais, parcerias ou garantias
 * - NÃO usar afirmações absolutas a menos que no briefing
 * - NÃO usar urgência falsa nem promessas enganosas
 * - NÃO produzir conteúdo proibido
 * - Retornar JSON válido apenas
 */

import { AIService } from './ai-services'

export interface CreativeBrief {
  // PROMPT PRINCIPAL (FONTE DA VERDADE)
  mainPrompt: string // Prompt principal que nunca é sobrescrito (obrigatório)
  
  // Informações do produto/serviço
  productName?: string // Opcional - pode ser extraído do mainPrompt
  productDescription?: string
  targetAudience?: string
  keyBenefits?: string[]
  callToAction?: string
  
  // Diretrizes de copy
  tone?: 'professional' | 'casual' | 'friendly' | 'urgent' | 'inspiring'
  maxLength?: number // caracteres
  platform?: 'facebook' | 'instagram' | 'google' | 'linkedin' | 'twitter'
  
  // Campos estruturados (enriquecem o prompt principal)
  objective?: 'cliques' | 'whatsapp' | 'vendas' | 'leads' | 'visualizacoes'
  imageRatio?: '1:1' | '4:5' | '9:16' | '16:9'
  language?: 'pt-BR' | 'en-US' | 'es-ES'
  variations?: number // Quantidade de variações desejadas
  
  // Referências visuais
  imageReferences?: {
    url: string
    role: 'style' | 'produto' | 'inspiração'
    description?: string
  }[]
  
  // Restrições
  avoidWords?: string[]
  mustInclude?: string[]
  
  // Informações adicionais
  brandGuidelines?: string
  competitorExamples?: string[]
  
  // Novos campos V2.2 (opcionais, compat mode)
  qualityTier?: 'draft' | 'production'
  includeTextInImage?: boolean
  enableRefinePass?: boolean
  enableScoring?: boolean
  enableOverlay?: boolean
  imageModel?: 'nano' | 'pro' // Modelo de imagem (nano/pro)
  aiProvider?: 'openai' | 'gemini' // IA para gerar criativos (padrão: gemini)
}

export interface CreativeOutput {
  status: 'success' | 'failed'
  copy?: string
  imagePrompt?: string
  imageUrl?: string // URL da imagem gerada (se generateImage = true) - mantido para compatibilidade
  revisedPrompt?: string // Prompt revisado pelo DALL-E - mantido para compatibilidade
  
  // Geração de 4 variações (2 conceituais + 2 comerciais)
  conceptualImages?: Array<{
    url: string
    prompt: string
    revisedPrompt?: string
    model: 'dall-e-3'
    variation: number
  }>
  commercialImages?: Array<{
    url: string
    prompt: string
    model: 'gemini-imagen'
    variation: number
  }>
  
  // Mantido para compatibilidade (primeira imagem de cada tipo)
  conceptualImage?: {
    url: string
    prompt: string
    revisedPrompt?: string
    model: 'dall-e-3'
  }
  commercialImage?: {
    url: string
    prompt: string
    model: 'gemini-imagen'
  }
  explanation?: string // Explicação das diferenças entre os criativos
  
  // Novos campos V2.2
  bestImage?: {
    url: string
    index: number
    score?: {
      realismo: number
      estetica: number
      alinhamento: number
      limpeza: number
      caraDeIA: number
      total: number
    }
  }
  scoringBreakdown?: {
    realismo: { avg: number; best: number }
    estetica: { avg: number; best: number }
    alinhamento: { avg: number; best: number }
    limpeza: { avg: number; best: number }
    caraDeIA: { avg: number; best: number }
  }
  
  failureReason?: string
  metadata?: {
    characterCount?: number
    tone?: string
    platform?: string
    qualityTier?: 'draft' | 'production'
    model?: string
    fallbackApplied?: boolean
    timing?: {
      prompt: number
      generate: number
      refine?: number
      total: number
    }
    estimatedCost?: number
  }
}

export class CreativeGenerator {
  private static readonly PROHIBITED_CONTENT = [
    'ódio', 'violência', 'sexual explícito', 'drogas', 'armas', 
    'autoagressão', 'fraude', 'suicídio', 'homicídio'
  ]
  
  private static readonly ABSOLUTE_CLAIMS = [
    'garantido', '100% certo', 'o melhor', 'oficial', 
    'único', 'exclusivo', 'número 1', 'líder'
  ]
  
  private static readonly FALSE_URGENCY = [
    'últimas vagas', 'só hoje', 'oferta relâmpago',
    'acabe de vez', 'não perca', 'última chance'
  ]

  /**
   * Valida o briefing contra regras proibidas
   */
  static validateBriefing(brief: CreativeBrief): { valid: boolean; reason?: string } {
    // Validar que há pelo menos mainPrompt ou productName
    if (!brief.mainPrompt && !brief.productName) {
      return {
        valid: false,
        reason: 'mainPrompt ou productName é obrigatório'
      }
    }
    
    const fullText = [
      brief.mainPrompt, // Incluir mainPrompt na validação
      brief.productName,
      brief.productDescription,
      brief.targetAudience,
      brief.keyBenefits?.join(' '),
      brief.callToAction,
      brief.brandGuidelines
    ].filter(Boolean).join(' ').toLowerCase()

    // Verificar conteúdo proibido
    for (const prohibited of this.PROHIBITED_CONTENT) {
      if (fullText.includes(prohibited)) {
        return {
          valid: false,
          reason: `Briefing contém conteúdo proibido: ${prohibited}`
        }
      }
    }

    // Verificar afirmações absolutas (a menos que explicitamente permitidas)
    const hasExplicitAbsolute = brief.brandGuidelines?.toLowerCase().includes('permitir afirmações absolutas')
    if (!hasExplicitAbsolute) {
      for (const claim of this.ABSOLUTE_CLAIMS) {
        if (fullText.includes(claim)) {
          return {
            valid: false,
            reason: `Briefing contém afirmação absoluta não autorizada: ${claim}`
          }
        }
      }
    }

    // Verificar urgência falsa
    for (const urgency of this.FALSE_URGENCY) {
      if (fullText.includes(urgency) && !brief.brandGuidelines?.toLowerCase().includes('permitir urgência')) {
        return {
          valid: false,
          reason: `Briefing contém urgência falsa não autorizada: ${urgency}`
        }
      }
    }

    return { valid: true }
  }

  /**
   * Extrai características de referências visuais
   */
  static extractImageCharacteristics(references: CreativeBrief['imageReferences']): {
    style?: string
    product?: string
    composition?: string
  } {
    if (!references || references.length === 0) {
      return {}
    }

    const characteristics = {
      style: [] as string[],
      product: [] as string[],
      composition: [] as string[]
    }

    for (const ref of references) {
      const desc = ref.description?.toLowerCase() || ''
      
      if (ref.role === 'style') {
        // Usar descrição completa se disponível (já analisada pela IA)
        if (ref.description && ref.description.length > 20) {
          characteristics.style.push(ref.description)
        } else {
          // Fallback para extração básica
          if (desc.includes('claro') || desc.includes('bright')) characteristics.style.push('iluminação clara e suave')
          if (desc.includes('escuro') || desc.includes('dark')) characteristics.style.push('iluminação escura e dramática')
          if (desc.includes('colorido') || desc.includes('colorful') || desc.includes('vibrante')) characteristics.style.push('paleta de cores vibrantes e saturadas')
          if (desc.includes('minimalista') || desc.includes('minimal')) characteristics.style.push('estilo minimalista e clean')
          if (desc.includes('moderno') || desc.includes('modern')) characteristics.style.push('estilo moderno e contemporâneo')
          if (desc.includes('vintage') || desc.includes('retro')) characteristics.style.push('estilo vintage e retrô')
          if (desc.includes('profissional') || desc.includes('professional')) characteristics.style.push('estética profissional e polida')
        }
      }
      
      if (ref.role === 'produto') {
        // Usar descrição completa se disponível
        if (ref.description && ref.description.length > 20) {
          characteristics.product.push(ref.description)
        } else {
          characteristics.product.push(ref.description || 'produto principal em destaque, alta qualidade')
        }
      }
      
      if (ref.role === 'inspiração') {
        // Usar descrição completa se disponível
        if (ref.description && ref.description.length > 20) {
          characteristics.composition.push(ref.description)
        } else {
          // Fallback para extração básica
          if (desc.includes('centro') || desc.includes('center')) characteristics.composition.push('composição centralizada e equilibrada')
          if (desc.includes('lado') || desc.includes('side')) characteristics.composition.push('composição lateral e dinâmica')
          if (desc.includes('grid') || desc.includes('grade')) characteristics.composition.push('layout em grid organizado')
          if (desc.includes('simétrico') || desc.includes('symmetr')) characteristics.composition.push('composição simétrica')
        }
      }
    }

    return {
      style: characteristics.style.length > 0 ? characteristics.style.join('. ') : undefined,
      product: characteristics.product.length > 0 ? characteristics.product.join('. ') : undefined,
      composition: characteristics.composition.length > 0 ? characteristics.composition.join('. ') : undefined
    }
  }

  /**
   * Gera o prompt de imagem baseado no briefing e referências
   * Prompt otimizado para DALL-E 3 com alta qualidade
   */
  static generateImagePrompt(brief: CreativeBrief): string {
    const characteristics = this.extractImageCharacteristics(brief.imageReferences)
    
    const parts: string[] = []
    
    // Produto principal - descrição detalhada
    if (characteristics.product) {
      parts.push(characteristics.product)
    } else if (brief.productName) {
      parts.push(`Produto: ${brief.productName}`)
    }
    // Se não houver productName nem characteristics.product, o mainPrompt já contém tudo
    
    // Estilo visual - detalhado
    if (characteristics.style) {
      parts.push(`Estilo visual: ${characteristics.style}`)
    } else {
      parts.push('Estilo visual: clean, moderno, profissional, alta qualidade fotográfica')
    }
    
    // Composição e layout
    if (characteristics.composition) {
      parts.push(`Composição: ${characteristics.composition}`)
    } else {
      parts.push('Composição: produto em destaque, fundo limpo, iluminação profissional')
    }
    
    // Contexto da plataforma - dimensões específicas
    if (brief.platform === 'instagram' || brief.platform === 'facebook') {
      parts.push('Formato: vertical (9:16), otimizado para feed de redes sociais, composição centralizada')
    } else if (brief.platform === 'google') {
      parts.push('Formato: horizontal (16:9), otimizado para display ads, layout amplo')
    } else if (brief.platform === 'linkedin') {
      parts.push('Formato: horizontal (1.91:1), estilo corporativo profissional')
    } else {
      parts.push('Formato: quadrado (1:1), composição equilibrada')
    }
    
    // Qualidade e técnica
    parts.push('Qualidade: fotografia profissional de alta resolução, 8K, detalhes nítidos, cores vibrantes e precisas')
    parts.push('Iluminação: suave e difusa, sombras suaves, realce do produto')
    parts.push('Fundo: limpo e minimalista, sem distrações, foco total no produto')
    
    // Diretrizes específicas
    parts.push('Sem texto sobreposto, sem marcas d\'água, sem elementos decorativos desnecessários')
    parts.push('Foco principal: produto/serviço em destaque, composição profissional')
    
    // Tom baseado no briefing
    if (brief.tone === 'professional') {
      parts.push('Tom: sério, confiável, corporativo')
    } else if (brief.tone === 'casual') {
      parts.push('Tom: descontraído, acessível, amigável')
    } else if (brief.tone === 'inspiring') {
      parts.push('Tom: inspirador, motivador, positivo')
    }
    
    // Juntar partes de forma mais natural, usando vírgulas e pontos apenas quando necessário
    // Isso evita fragmentação excessiva que pode confundir o modelo
    return parts.join(' ')
  }

  /**
   * Gera a copy do criativo
   */
  static async generateCopy(brief: CreativeBrief, aiService: any): Promise<string> {
    // Construir prompt para geração de copy
    const prompt = this.buildCopyPrompt(brief)
    
    // Gerar via IA - usar gpt-3.5-turbo como padrão (mais compatível)
    const result = await aiService.generateContent({
      prompt,
      type: 'text',
      model: 'gpt-3.5-turbo', // Modelo mais compatível e acessível
      maxTokens: 300,
      temperature: 0.8
    })

    // Melhor tratamento de erro
    if (!result.success) {
      const errorMsg = result.error || 'Erro desconhecido na API de IA'
      console.error('[CreativeGenerator] Erro na geração:', errorMsg)
      throw new Error(`Erro ao gerar copy via IA: ${errorMsg}`)
    }

    if (!result.data?.content) {
      console.error('[CreativeGenerator] Resposta sem conteúdo:', JSON.stringify(result, null, 2))
      throw new Error('Resposta da IA não contém conteúdo')
    }

    let copy = result.data.content.trim()
    
    // Limpar e otimizar
    copy = this.cleanCopy(copy, brief)
    
    // Validar comprimento
    if (brief.maxLength && copy.length > brief.maxLength) {
      copy = copy.substring(0, brief.maxLength - 3) + '...'
    }
    
    return copy
  }

  /**
   * Constrói o prompt para geração de copy
   */
  private static buildCopyPrompt(brief: CreativeBrief): string {
    const parts: string[] = []
    
    parts.push('Você é um copywriter especialista em anúncios de alta performance.')
    parts.push('Gere UMA versão de copy para anúncio, focando em clareza, CTR e coerência.')
    parts.push('')
    parts.push('REGRAS OBRIGATÓRIAS:')
    parts.push('- NÃO invente marcas, selos oficiais, parcerias ou garantias')
    parts.push('- NÃO use afirmações absolutas ("garantido", "100% certo", "o melhor", "oficial")')
    parts.push('- NÃO use urgência falsa ("últimas vagas", "só hoje") nem promessas enganosas')
    parts.push('- Seja claro, direto e focado em benefícios reais')
    parts.push('- Gere copy otimizada para CTR')
    parts.push('')
    
    // Adicionar prompt principal se disponível
    if (brief.mainPrompt) {
      parts.push(`Prompt principal: ${brief.mainPrompt}`)
    }
    
    if (brief.productName) {
      parts.push(`Produto: ${brief.productName}`)
    }
    
    if (brief.productDescription) {
      parts.push(`Descrição: ${brief.productDescription}`)
    }
    
    if (brief.keyBenefits && brief.keyBenefits.length > 0) {
      parts.push(`Benefícios principais: ${brief.keyBenefits.join(', ')}`)
    }
    
    if (brief.targetAudience) {
      parts.push(`Público-alvo: ${brief.targetAudience}`)
    }
    
    if (brief.tone) {
      const toneMap: Record<string, string> = {
        professional: 'tom profissional e confiável',
        casual: 'tom casual e acessível',
        friendly: 'tom amigável e acolhedor',
        urgent: 'tom de urgência genuína (sem exageros)',
        inspiring: 'tom inspirador e motivador'
      }
      parts.push(`Tom: ${toneMap[brief.tone] || brief.tone}`)
    }
    
    if (brief.platform) {
      parts.push(`Plataforma: ${brief.platform}`)
    }
    
    if (brief.callToAction) {
      parts.push(`CTA sugerido: ${brief.callToAction}`)
    }
    
    if (brief.avoidWords && brief.avoidWords.length > 0) {
      parts.push(`Evitar palavras: ${brief.avoidWords.join(', ')}`)
    }
    
    if (brief.mustInclude && brief.mustInclude.length > 0) {
      parts.push(`Incluir obrigatoriamente: ${brief.mustInclude.join(', ')}`)
    }
    
    parts.push('')
    parts.push('Gere apenas a copy, sem explicações adicionais.')
    
    return parts.join('\n')
  }

  /**
   * Limpa e otimiza a copy gerada
   */
  private static cleanCopy(copy: string, brief: CreativeBrief): string {
    // Remover markdown se houver
    copy = copy.replace(/```[\s\S]*?```/g, '')
    copy = copy.replace(/`([^`]+)`/g, '$1')
    
    // Remover citações excessivas
    copy = copy.replace(/^["']|["']$/g, '')
    
    // Remover quebras de linha múltiplas
    copy = copy.replace(/\n{3,}/g, '\n\n')
    
    // Remover espaços extras
    copy = copy.trim()
    
    // Validar contra palavras a evitar
    if (brief.avoidWords) {
      for (const word of brief.avoidWords) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi')
        if (regex.test(copy)) {
          // Substituir por alternativa ou remover contexto
          copy = copy.replace(regex, '[palavra removida]')
        }
      }
    }
    
    return copy
  }

  /**
   * Gera explicação das diferenças entre os dois criativos
   */
  private static generateExplanation(
    conceptual: CreativeOutput['conceptualImage'],
    commercial: CreativeOutput['commercialImage'],
    brief: CreativeBrief
  ): string {
    const parts: string[] = []
    
    parts.push('📊 DIFERENÇAS ENTRE OS CRIATIVOS:')
    parts.push('')
    parts.push('🎨 CRIATIVO CONCEITUAL (DALL-E 3):')
    parts.push('- Foco em estética profissional e storytelling visual')
    parts.push('- Composição limpa e minimalista')
    parts.push('- Ideal para construir marca e confiança')
    parts.push('- Melhor para: awareness, consideração, topo de funil')
    parts.push('')
    parts.push('💼 CRIATIVO COMERCIAL (Gemini):')
    parts.push('- Foco em conversão e ação imediata')
    parts.push('- Design agressivo com CTA forte')
    parts.push('- Alto contraste e elementos chamativos')
    parts.push('- Melhor para: conversão, bottom de funil, vendas diretas')
    parts.push('')
    parts.push('🧪 RECOMENDAÇÃO PARA TESTE A/B:')
    parts.push('Teste ambos os criativos para identificar qual performa melhor com seu público-alvo.')
    
    return parts.join('\n')
  }

  /**
   * Gera explicação das diferenças entre as variações (DALL-E 3)
   */
  private static generateExplanationForDalle(
    conceptualImages?: CreativeOutput['conceptualImages'],
    commercialImages?: CreativeOutput['commercialImages'],
    brief?: CreativeBrief
  ): string {
    const parts: string[] = []
    
    const conceptualGenerated = conceptualImages?.filter(img => img.url && img.url.trim() !== '').length || 0
    const commercialGenerated = commercialImages?.filter(img => img.url && img.url.trim() !== '').length || 0
    const totalGenerated = conceptualGenerated + commercialGenerated
    
    parts.push('📊 VARIAÇÕES GERADAS COM DALL-E 3:')
    parts.push('')
    
    if (totalGenerated > 0) {
      parts.push(`✅ Total de ${totalGenerated} imagem(ns) gerada(s) com sucesso`)
    }
    
    parts.push('')
    
    if (conceptualImages && conceptualImages.length > 0) {
      parts.push(`🎨 Imagens Conceituais: ${conceptualImages.length} variação(ões)`)
      parts.push('- Estilo: foco em estética profissional e storytelling visual')
      parts.push('- Composição: limpa e minimalista')
      parts.push('- Ideal para: awareness, consideração, topo de funil')
      parts.push('')
    }
    
    if (commercialImages && commercialImages.length > 0) {
      parts.push(`💼 Imagens Comerciais: ${commercialImages.length} variação(ões)`)
      parts.push('- Estilo: foco em conversão e ação imediata')
      parts.push('- Design: agressivo com CTA forte')
      parts.push('- Ideal para: conversão, bottom de funil, vendas diretas')
      parts.push('')
    }
    
    parts.push('🧪 RECOMENDAÇÃO PARA TESTE A/B:')
    if (totalGenerated > 0) {
      parts.push('Teste todas as variações geradas para identificar qual performa melhor com seu público-alvo.')
    }
    parts.push('Cada variação tem um estilo e composição ligeiramente diferentes.')
    
    return parts.join('\n')
  }

  /**
   * Gera explicação das diferenças entre as variações (apenas Gemini)
   */
  private static generateExplanationForGemini(
    conceptualImages?: CreativeOutput['conceptualImages'],
    commercialImages?: CreativeOutput['commercialImages'],
    brief?: CreativeBrief
  ): string {
    const parts: string[] = []
    
    // Contar apenas imagens com URL válida (geradas com sucesso)
    const conceptualGenerated = conceptualImages?.filter(img => img.url && img.url.trim() !== '').length || 0
    const commercialGenerated = commercialImages?.filter(img => img.url && img.url.trim() !== '').length || 0
    const totalGenerated = conceptualGenerated + commercialGenerated
    
    const conceptualPrompts = (conceptualImages?.length || 0) - conceptualGenerated
    const commercialPrompts = (commercialImages?.length || 0) - commercialGenerated
    
    parts.push('📊 VARIAÇÕES GERADAS COM GEMINI (NANO BANANA):')
    parts.push('')
    
    if (totalGenerated > 0) {
      parts.push(`✅ Total de ${totalGenerated} imagem(ns) gerada(s) com sucesso`)
    }
    
    if (conceptualPrompts > 0 || commercialPrompts > 0) {
      parts.push(`⚠️ ${conceptualPrompts + commercialPrompts} variação(ões) retornou apenas prompt (imagem não gerada)`)
    }
    
    parts.push('')
    
    if (conceptualImages && conceptualImages.length > 0) {
      const generated = conceptualGenerated
      const promptsOnly = conceptualPrompts
      parts.push(`🎨 Imagens Conceituais: ${conceptualImages.length} variação(ões)`)
      if (generated > 0) {
        parts.push(`  ✓ ${generated} imagem(ns) gerada(s) com sucesso`)
      }
      if (promptsOnly > 0) {
        parts.push(`  ⚠️ ${promptsOnly} variação(ões) com apenas prompt (não gerada)`)
      }
      parts.push('- Estilo: foco em estética profissional e storytelling visual')
      parts.push('- Composição: limpa e minimalista')
      parts.push('- Ideal para: awareness, consideração, topo de funil')
      parts.push('')
    }
    
    if (commercialImages && commercialImages.length > 0) {
      const generated = commercialGenerated
      const promptsOnly = commercialPrompts
      parts.push(`💼 Imagens Comerciais: ${commercialImages.length} variação(ões)`)
      if (generated > 0) {
        parts.push(`  ✓ ${generated} imagem(ns) gerada(s) com sucesso`)
      }
      if (promptsOnly > 0) {
        parts.push(`  ⚠️ ${promptsOnly} variação(ões) com apenas prompt (não gerada)`)
      }
      parts.push('- Estilo: foco em conversão e ação imediata')
      parts.push('- Design: agressivo com CTA forte')
      parts.push('- Ideal para: conversão, bottom de funil, vendas diretas')
      parts.push('')
    }
    
    parts.push('🧪 RECOMENDAÇÃO PARA TESTE A/B:')
    if (totalGenerated > 0) {
      parts.push('Teste todas as variações geradas para identificar qual performa melhor com seu público-alvo.')
    } else {
      parts.push('⚠️ Nenhuma imagem foi gerada com sucesso. Verifique a configuração da API do Gemini.')
    }
    parts.push('Cada variação tem um estilo e composição ligeiramente diferentes.')
    
    return parts.join('\n')
  }

  /**
   * Gera criativo completo (copy + imagePrompt)
   * @param generateImage - Se true, gera imagens usando APENAS Gemini (Nano Banana)
   */
  static async generateCreative(
    brief: CreativeBrief,
    aiService: any,
    generateImage: boolean = false
  ): Promise<CreativeOutput> {
    try {
      // Validar briefing
      const validation = this.validateBriefing(brief)
      if (!validation.valid) {
        return {
          status: 'failed',
          failureReason: validation.reason || 'Briefing inválido'
        }
      }

      // Resolver feature flags (request > tenant > env > default)
      const { getFeatureFlags } = await import('@/lib/feature-flags')
      const flags = getFeatureFlags({
        qualityTier: brief.qualityTier,
        includeTextInImage: brief.includeTextInImage,
        enableRefinePass: brief.enableRefinePass,
        enableScoring: brief.enableScoring,
        enableOverlay: brief.enableOverlay
      })

      // Gerar copy
      const copy = await this.generateCopy(brief, aiService)
      
      // Gerar imagePrompt (base para Gemini)
      // Se flags indicam usar novo prompt builder, usar V2, senão usar método antigo (compat)
      const useV2Prompts = flags.qualityTier === 'production'
      const imagePrompt = useV2Prompts 
        ? await this.generateImagePromptV2(brief, flags, 'conceptual', 1)
        : this.generateConceptualImagePrompt(brief)
      
      const output: CreativeOutput = {
        status: 'success',
        copy,
        imagePrompt, // Prompt base para geração de imagens
        metadata: {
          characterCount: copy.length,
          tone: brief.tone,
          platform: brief.platform,
          qualityTier: flags.qualityTier
        }
      }

      // Gerar imagens usando a IA selecionada (Gemini ou OpenAI/DALL-E)
      if (generateImage) {
        const numVariations = Math.min(brief.variations || 2, 4) // Máximo 4 variações
        output.conceptualImages = []
        output.commercialImages = []

        const imageProvider = brief.aiProvider || 'gemini' // Padrão: Gemini
        
        try {
          // Se OpenAI foi selecionado, usar DALL-E 3
          if (imageProvider === 'openai') {
            const openaiApiKey = process.env.OPENAI_API_KEY
            if (!openaiApiKey || openaiApiKey.trim() === '' || openaiApiKey.startsWith('sk-mock')) {
              throw new Error('OpenAI API key não configurada para geração de imagens.')
            }

            // Criar AIService para DALL-E
            const dalleService = new AIService({
              id: 'creative-image-generation-dalle',
              name: 'Creative Image Generation Service (DALL-E)',
              type: 'openai',
              status: 'active',
              credentials: {
                apiKey: openaiApiKey.trim().replace(/^["']|["']$/g, ''),
                endpoint: 'https://api.openai.com/v1'
              },
              settings: {
                model: 'gpt-4o'
              },
              usage: { requests: 0, tokens: 0, cost: 0 },
              lastUsed: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            })

            // Gerar imagens com DALL-E 3
            let allImages: Array<{ url: string; prompt: string; variation: number; imageType: 'conceptual' | 'commercial'; timing?: any; model?: string }> = []
            
            for (let i = 1; i <= numVariations; i++) {
              try {
                const isConceptual = i % 2 === 1
                const variationNum = isConceptual ? Math.ceil(i / 2) : Math.floor(i / 2)
                const imageType: 'conceptual' | 'commercial' = isConceptual ? 'conceptual' : 'commercial'
                
                // Gerar prompt base
                const useV2Prompts = flags.qualityTier === 'production'
                let basePrompt = useV2Prompts 
                  ? await this.generateImagePromptV2(brief, flags, imageType, variationNum)
                  : (isConceptual 
                      ? this.generateConceptualImagePrompt(brief, variationNum)
                      : this.generateCommercialImagePrompt(brief, variationNum))
                
                // Otimizar prompt para DALL-E 3 seguindo melhores práticas da OpenAI
                const { optimizePromptForDalle3, cleanPromptForDalle3 } = await import('@/lib/dalle3-prompt-optimizer')
                const optimizedPrompt = optimizePromptForDalle3(basePrompt, {
                  imageType,
                  qualityTier: flags.qualityTier,
                  aspectRatio: brief.imageRatio || this.getRatioFromPlatform(brief.platform),
                  includeTextInImage: flags.includeTextInImage,
                  tone: brief.tone,
                  objective: brief.objective
                })
                const prompt = cleanPromptForDalle3(optimizedPrompt)
                
                console.log(`[CreativeGenerator] Gerando imagem ${imageType} ${i}/${numVariations} com DALL-E 3...`)
                console.log(`[CreativeGenerator] Prompt otimizado (${prompt.length} chars):`, prompt.substring(0, 200) + '...')
                
                // Determinar tamanho baseado em aspectRatio
                let size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024'
                const aspectRatio = brief.imageRatio || this.getRatioFromPlatform(brief.platform)
                if (aspectRatio === '9:16' || aspectRatio === '4:5') {
                  size = '1024x1792' // Vertical
                } else if (aspectRatio === '16:9') {
                  size = '1792x1024' // Horizontal
                }
                
                // Gerar imagem com DALL-E 3
                const dalleResult = await dalleService.generateContent({
                  prompt: prompt,
                  type: 'image',
                  model: 'dall-e-3'
                })
                
                if (dalleResult.success && dalleResult.data) {
                  // DALL-E retorna data.images[0].url (estrutura do AIService)
                  const data = dalleResult.data as any
                  
                  // Verificar se tem images array
                  if (data?.images && Array.isArray(data.images) && data.images.length > 0) {
                    const imageData = data.images[0]
                    const imageUrl = imageData?.url
                    const revisedPrompt = imageData?.revisedPrompt || prompt
                    
                    if (imageUrl) {
                      allImages.push({
                        url: imageUrl,
                        prompt: revisedPrompt,
                        variation: i,
                        imageType,
                        model: 'dall-e-3'
                      })
                      
                      console.log(`[CreativeGenerator] ✅ Imagem ${i} gerada com DALL-E 3`)
                    } else {
                      console.warn(`[CreativeGenerator] DALL-E 3 não retornou URL para variação ${i}. ImageData:`, JSON.stringify(imageData).substring(0, 200))
                    }
                  } else {
                    // Fallback: tentar acessar diretamente
                    const imageUrl = data?.url || data?.imageUrl
                    const revisedPrompt = data?.revisedPrompt || prompt
                    
                    if (imageUrl) {
                      allImages.push({
                        url: imageUrl,
                        prompt: revisedPrompt,
                        variation: i,
                        imageType,
                        model: 'dall-e-3'
                      })
                      
                      console.log(`[CreativeGenerator] ✅ Imagem ${i} gerada com DALL-E 3 (fallback)`)
                    } else {
                      console.warn(`[CreativeGenerator] DALL-E 3 não retornou URL para variação ${i}. Data structure:`, JSON.stringify(data).substring(0, 300))
                    }
                  }
                } else {
                  console.warn(`[CreativeGenerator] DALL-E 3 não retornou imagem para variação ${i}:`, dalleResult.error || dalleResult)
                }
              } catch (variationError) {
                console.warn(`[CreativeGenerator] Erro ao gerar imagem ${i} com DALL-E:`, variationError)
              }
            }
            
            // Separar em conceptual e commercial
            for (const img of allImages) {
              const imageData = {
                url: img.url,
                prompt: img.prompt,
                model: 'dall-e-3' as const,
                variation: img.variation
              }

              if (img.imageType === 'conceptual') {
                output.conceptualImages.push({
                  ...imageData,
                  revisedPrompt: img.prompt
                })
                if (img.variation === 1) {
                  output.conceptualImage = {
                    url: imageData.url,
                    prompt: imageData.prompt,
                    revisedPrompt: img.prompt,
                    model: 'dall-e-3'
                  }
                  output.imageUrl = imageData.url
                  output.revisedPrompt = img.prompt
                }
              } else {
                output.commercialImages.push(imageData)
                if (img.variation === 2) {
                  output.commercialImage = {
                    url: imageData.url,
                    prompt: imageData.prompt,
                    model: 'dall-e-3'
                  }
                }
              }
            }
            
            // Gerar explicação
            if (output.conceptualImages.length > 0 || output.commercialImages.length > 0) {
              output.explanation = this.generateExplanationForDalle(
                output.conceptualImages,
                output.commercialImages,
                brief
              )
            }
            
            return output
          }
          
          // Se Gemini foi selecionado (padrão), usar Gemini
          const geminiApiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY
          if (!geminiApiKey || geminiApiKey.startsWith('mock')) {
            throw new Error('Google AI Studio API key não configurada para geração de imagens.')
          }

          // Usar GeminiImageServiceV2 se production, senão usar antigo (compat)
          const useV2Service = flags.qualityTier === 'production'
          
          let allImages: Array<{ url: string; prompt: string; variation: number; imageType: 'conceptual' | 'commercial'; timing?: any; model?: string }> = []
          
          if (useV2Service) {
            const { GeminiImageServiceV2 } = await import('@/lib/gemini-image-service-v2')
            const { selectImageModel } = await import('@/lib/image-model-selector')
            
            // Selecionar modelo de imagem (nano/pro)
            const selectedModel = selectImageModel({
              imageModel: brief.imageModel,
              qualityTier: flags.qualityTier
            })
            
            const geminiService = new GeminiImageServiceV2({ 
              apiKey: geminiApiKey,
              primaryModel: selectedModel
            })
            
            // Gerar variações: alternando entre conceitual e comercial
            for (let i = 1; i <= numVariations; i++) {
              try {
                const isConceptual = i % 2 === 1
                const variationNum = isConceptual ? Math.ceil(i / 2) : Math.floor(i / 2)
                const imageType: 'conceptual' | 'commercial' = isConceptual ? 'conceptual' : 'commercial'
                
                // Usar prompt builder V2
                const prompt = await this.generateImagePromptV2(brief, flags, imageType, variationNum)
                
                console.log(`[CreativeGenerator] Gerando imagem ${imageType} ${i}/${numVariations} com Gemini V2...`)
                
                const geminiResult = await geminiService.generateImage({
                  prompt: prompt,
                  aspectRatio: brief.imageRatio || this.getRatioFromPlatform(brief.platform),
                  qualityTier: flags.qualityTier,
                  enableRefinePass: flags.enableRefinePass && flags.qualityTier === 'production'
                })

                if (geminiResult.success && geminiResult.imageUrl) {
                  allImages.push({
                    url: geminiResult.imageUrl,
                    prompt: geminiResult.prompt || prompt,
                    variation: i,
                    imageType,
                    timing: geminiResult.timing,
                    model: geminiResult.model || selectedModel || 'gemini-imagen'
                  })
                  
                  // Atualizar metadata com timing e custo
                  if (geminiResult.timing && !output.metadata?.timing) {
                    output.metadata = {
                      ...(output.metadata || {}),
                      timing: geminiResult.timing,
                      estimatedCost: geminiResult.estimatedCost,
                      model: geminiResult.model || selectedModel || 'gemini-imagen',
                      fallbackApplied: geminiResult.fallbackApplied
                    }
                  }
                } else if (geminiResult.prompt) {
                  // Se não gerou imagem mas retornou prompt
                  allImages.push({
                    url: '',
                    prompt: geminiResult.prompt,
                    variation: i,
                    imageType
                  })
                }
              } catch (variationError) {
                console.warn(`[CreativeGenerator] Erro ao gerar imagem ${i}:`, variationError)
              }
            }
          } else {
            // Compat mode: usar serviço antigo
            const { GeminiImageService } = await import('@/lib/gemini-image-service')
            const geminiService = new GeminiImageService(geminiApiKey)
            
            for (let i = 1; i <= numVariations; i++) {
              try {
                const isConceptual = i % 2 === 1
                let prompt: string
                let imageType: 'conceptual' | 'commercial'
                
                if (isConceptual) {
                  prompt = this.generateConceptualImagePrompt(brief, Math.ceil(i / 2))
                  imageType = 'conceptual'
                } else {
                  prompt = this.generateCommercialImagePrompt(brief, Math.floor(i / 2))
                  imageType = 'commercial'
                }
                
                console.log(`[CreativeGenerator] Gerando imagem ${imageType} ${i}/${numVariations} com Gemini (compat)...`)
                
                const geminiResult = await geminiService.generateImage({
                  prompt: prompt,
                  aspectRatio: brief.imageRatio || this.getRatioFromPlatform(brief.platform)
                })

                if (geminiResult.success && geminiResult.imageUrl) {
                  allImages.push({
                    url: geminiResult.imageUrl,
                    prompt: geminiResult.prompt || prompt,
                    variation: i,
                    imageType
                  })
                } else if (geminiResult.prompt) {
                  allImages.push({
                    url: '',
                    prompt: geminiResult.prompt,
                    variation: i,
                    imageType
                  })
                }
              } catch (variationError) {
                console.warn(`[CreativeGenerator] Erro ao gerar imagem ${i}:`, variationError)
              }
            }
          }

          // Separar em conceptual e commercial
          for (const img of allImages) {
            const imageData = {
              url: img.url,
              prompt: img.prompt,
              model: 'gemini-imagen' as const,
              variation: img.variation
            }

            if (img.imageType === 'conceptual') {
              output.conceptualImages.push({
                ...imageData,
                revisedPrompt: img.prompt
              })
              if (img.variation === 1) {
                output.conceptualImage = {
                  url: imageData.url,
                  prompt: imageData.prompt,
                  revisedPrompt: img.prompt,
                  model: 'gemini-imagen'
                }
                output.imageUrl = imageData.url
                output.revisedPrompt = img.prompt
              }
            } else {
              output.commercialImages.push(imageData)
              if (img.variation === 2) {
                output.commercialImage = {
                  url: imageData.url,
                  prompt: imageData.prompt,
                  model: 'gemini-imagen'
                }
              }
            }
          }

          // Scoring automático (se production + variations > 1 + scoring on)
          if (flags.enableScoring && flags.qualityTier === 'production' && allImages.length > 1) {
            try {
              const openaiApiKey = process.env.OPENAI_API_KEY
              if (openaiApiKey && !openaiApiKey.startsWith('sk-mock')) {
                const { ImageScoringService } = await import('@/lib/image-scoring-service')
                const scoringService = new ImageScoringService(openaiApiKey)
                
                // Criar array scorable preservando idx original
                const scorable = allImages.map((img, idx) => ({
                  url: img.url,
                  prompt: img.prompt,
                  variation: img.variation,
                  idx // Preservar idx original do allImages
                })).filter(x => x.url && x.url.trim().length > 0)
                
                if (scorable.length > 1) {
                  const scoringResult = await scoringService.scoreImages(
                    scorable,
                    {
                      mainPrompt: brief.mainPrompt,
                      productName: brief.productName,
                      objective: brief.objective,
                      imageType: 'conceptual' // Usar tipo da primeira imagem
                    }
                  )
                  
                  // bestImageIndex do scoring é o idx original do allImages
                  const bestIndexOriginal = scoringResult.bestImageIndex
                  const bestImage = allImages[bestIndexOriginal]
                  const bestScore = scoringResult.scores.find(s => s.index === bestIndexOriginal)
                  
                  if (bestImage && bestScore) {
                    output.bestImage = {
                      url: bestImage.url,
                      index: bestIndexOriginal,
                      score: bestScore.score
                    }
                    output.scoringBreakdown = scoringResult.breakdown
                    
                    console.log('[CreativeGenerator] Scoring aplicado:', {
                      bestImageIndex: bestIndexOriginal,
                      score: bestScore.score
                    })
                  }
                }
              }
            } catch (scoringError) {
              console.warn('[CreativeGenerator] Erro ao aplicar scoring:', scoringError)
              // Não falhar a geração se scoring falhar
            }
          }

          // Gerar explicação das diferenças
          if (output.conceptualImages.length > 0 || output.commercialImages.length > 0) {
            output.explanation = this.generateExplanationForGemini(
              output.conceptualImages,
              output.commercialImages,
              brief
            )
          }
        } catch (geminiError) {
          console.warn('[CreativeGenerator] Erro ao gerar imagens com Gemini:', geminiError)
          return {
            status: 'failed',
            failureReason: `Erro ao gerar imagens com Gemini: ${geminiError instanceof Error ? geminiError.message : 'Erro desconhecido'}`
          }
        }
      }
      
      return output
    } catch (error) {
      return {
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Erro desconhecido na geração'
      }
    }
  }

  /**
   * Gera prompt usando prompt-builder-v2 (novo)
   */
  private static async generateImagePromptV2(
    brief: CreativeBrief,
    flags: { qualityTier: 'draft' | 'production'; includeTextInImage: boolean },
    imageType: 'conceptual' | 'commercial',
    variation: number
  ): Promise<string> {
    const { buildConceptualPrompt, buildCommercialPrompt } = await import('@/lib/prompt-builder-v2')
    
    const context = {
      mainPrompt: brief.mainPrompt,
      productName: brief.productName,
      imageReferences: brief.imageReferences,
      aspectRatio: brief.imageRatio || this.getRatioFromPlatform(brief.platform),
      imageType,
      variation,
      includeTextInImage: flags.includeTextInImage,
      qualityTier: flags.qualityTier,
      tone: brief.tone,
      objective: brief.objective
    }
    
    return imageType === 'conceptual'
      ? buildConceptualPrompt(context)
      : buildCommercialPrompt(context)
  }

  /**
   * Gera prompt conceitual para Gemini (com variação)
   */
  static generateConceptualImagePrompt(brief: CreativeBrief, variation: number = 1): string {
    const characteristics = this.extractImageCharacteristics(brief.imageReferences)
    const parts: string[] = []

    // IMPORTANTE: Começar com instrução clara de gerar IMAGEM
    parts.push('Crie uma imagem publicitária de alta qualidade')
    parts.push('IMPORTANTE: Todos os textos na imagem devem ser legíveis, profissionais e sem erros ortográficos')

    // Adicionar o prompt principal do usuário como base
    if (brief.mainPrompt) {
      parts.push(brief.mainPrompt)
    }

    // Produto principal
    if (characteristics.product) {
      parts.push(characteristics.product)
    } else if (brief.productName) {
      parts.push(`Produto: ${brief.productName}`)
    }

    // Estilo visual - conceitual com variações
    const styleVariations = [
      'Estilo visual: conceitual, limpo, moderno, profissional, alta qualidade fotográfica, composição artística, iluminação suave e difusa, cores harmoniosas.',
      'Estilo visual: minimalista, elegante, sofisticado, foco em estética premium, composição equilibrada, iluminação natural, paleta de cores refinada.'
    ]
    if (characteristics.style) {
      parts.push(`Estilo visual: ${characteristics.style}. Foco em arte, composição, storytelling visual, estética profissional. ${styleVariations[variation - 1] || styleVariations[0]}`)
    } else {
      parts.push(styleVariations[variation - 1] || styleVariations[0])
    }

    // Composição com variações
    const compositionVariations = [
      'Composição: produto em destaque, fundo limpo, iluminação profissional, perspectiva central.',
      'Composição: produto em destaque, fundo minimalista, iluminação lateral suave, perspectiva dinâmica.'
    ]
    if (characteristics.composition) {
      parts.push(`Composição: ${characteristics.composition}. ${compositionVariations[variation - 1] || compositionVariations[0]}`)
    } else {
      parts.push(compositionVariations[variation - 1] || compositionVariations[0])
    }

    // Aspect ratio
    const aspectRatio = brief.imageRatio || this.getRatioFromPlatform(brief.platform)
    if (aspectRatio === '9:16') {
      parts.push('Formato: vertical (9:16), otimizado para feed de redes sociais, composição centralizada.')
    } else if (aspectRatio === '16:9') {
      parts.push('Formato: horizontal (16:9), otimizado para display ads, layout amplo.')
    } else if (aspectRatio === '4:5') {
      parts.push('Formato: vertical (4:5), ideal para Instagram, com foco no produto.')
    } else {
      parts.push('Formato: quadrado (1:1), composição equilibrada.')
    }

    // Qualidade
    parts.push('Qualidade: fotografia profissional de alta resolução, 8K, detalhes nítidos, cores vibrantes e precisas')
    parts.push('Iluminação: suave e difusa, sombras suaves, realce do produto')
    parts.push('Fundo: limpo e minimalista, sem distrações, foco total no produto')
    parts.push('Sem texto sobreposto, sem marcas d\'água, sem elementos decorativos desnecessários')

    // Tom
    if (brief.tone === 'professional') {
      parts.push('Tom: sério, confiável, corporativo')
    } else if (brief.tone === 'casual') {
      parts.push('Tom: descontraído, acessível, amigável')
    } else if (brief.tone === 'inspiring') {
      parts.push('Tom: inspirador, motivador, positivo')
    }

    // Juntar partes de forma mais natural, usando vírgulas e pontos apenas quando necessário
    // Isso evita fragmentação excessiva que pode confundir o modelo
    return parts.join(' ')
  }

  /**
   * Gera prompt comercial para Gemini (com variação)
   */
  static generateCommercialImagePrompt(brief: CreativeBrief, variation: number = 1): string {
    const characteristics = this.extractImageCharacteristics(brief.imageReferences)
    const parts: string[] = []

    // IMPORTANTE: Começar com instrução clara de gerar IMAGEM comercial
    parts.push('Crie uma imagem publicitária comercial de alta conversão')
    parts.push('IMPORTANTE: Todos os textos na imagem devem ser legíveis, profissionais, sem erros ortográficos e claramente visíveis')

    // Adicionar o prompt principal do usuário como base
    if (brief.mainPrompt) {
      parts.push(brief.mainPrompt)
    }

    // Produto principal
    if (characteristics.product) {
      parts.push(characteristics.product)
    } else if (brief.productName) {
      parts.push(`Produto: ${brief.productName}`)
    }

    // Estilo visual - comercial com variações
    const styleVariations = [
      'Estilo visual: agressivo, comercial, alto contraste, cores vibrantes, elementos chamativos, estilo publicitário, foco em conversão.',
      'Estilo visual: impactante, direto, alto contraste, cores saturadas, elementos visuais fortes, design publicitário moderno, foco em ação imediata.'
    ]
    if (characteristics.style) {
      parts.push(`Estilo visual: ${characteristics.style}. Foco em impacto, contraste, cores vibrantes, elementos chamativos, estilo publicitário, alta conversão. ${styleVariations[variation - 1] || styleVariations[0]}`)
    } else {
      parts.push(styleVariations[variation - 1] || styleVariations[0])
    }

    // Composição comercial com variações
    const compositionVariations = [
      'Composição: produto em destaque, elementos de CTA visual, fundo com contraste alto, layout dinâmico e impactante.',
      'Composição: produto centralizado, elementos de urgência visual, fundo vibrante, layout direto e chamativo.'
    ]
    if (characteristics.composition) {
      parts.push(`Composição: ${characteristics.composition}. ${compositionVariations[variation - 1] || compositionVariations[0]}`)
    } else {
      parts.push(compositionVariations[variation - 1] || compositionVariations[0])
    }

    // Aspect ratio
    const aspectRatio = brief.imageRatio || this.getRatioFromPlatform(brief.platform)
    if (aspectRatio === '9:16') {
      parts.push('Formato: vertical (9:16), otimizado para feed de redes sociais, composição centralizada.')
    } else if (aspectRatio === '16:9') {
      parts.push('Formato: horizontal (16:9), otimizado para display ads, layout amplo.')
    } else if (aspectRatio === '4:5') {
      parts.push('Formato: vertical (4:5), ideal para Instagram, com foco no produto.')
    } else {
      parts.push('Formato: quadrado (1:1), composição equilibrada.')
    }

    // Qualidade comercial
    parts.push('Qualidade: alta resolução, cores vibrantes e saturadas, design profissional publicitário')
    parts.push('Iluminação: dramática, alto contraste, realce do produto e CTA')
    parts.push('Fundo: vibrante ou contrastante, elementos que chamam atenção, foco em conversão')

    // Objetivo do anúncio
    if (brief.objective) {
      parts.push(`Objetivo do anúncio: ${brief.objective}. Incluir elementos visuais que incentivem ${brief.objective}.`)
    }

    // CTA
    if (brief.callToAction) {
      parts.push(`Call to Action visual: Incluir um elemento visual que sugira o CTA: "${brief.callToAction}".`)
    }

    // Tom urgente (se aplicável)
    if (brief.tone === 'urgent') {
      parts.push('Tom: urgente, com senso de oportunidade e escassez (sem ser falso).')
    }

    // Juntar partes de forma mais natural, usando vírgulas e pontos apenas quando necessário
    // Isso evita fragmentação excessiva que pode confundir o modelo
    return parts.join(' ')
  }

  /**
   * Obtém proporção de imagem baseada na plataforma
   */
  static getRatioFromPlatform(platform?: string): '1:1' | '4:5' | '9:16' | '16:9' {
    switch (platform) {
      case 'instagram':
        return '4:5'
      case 'facebook':
        return '9:16'
      case 'google':
        return '16:9'
      case 'linkedin':
        return '16:9'
      case 'twitter':
        return '16:9'
      default:
        return '1:1'
    }
  }
}

