/**
 * 🚀 PERFORMANCE CREATIVE ENGINE
 * 
 * Sistema de geração de criativos de alta performance para tráfego direto,
 * focados em conversão, respeitando idioma, nicho, estilo, plataforma e objetivo.
 * 
 * Baseado na especificação: Creative Performance AI
 */

export type Language = 'pt-BR' | 'en-US' | 'es-ES'
export type Niche = 
  | 'e-commerce'
  | 'infoprodutos'
  | 'saúde'
  | 'beleza'
  | 'fitness'
  | 'finanças'
  | 'educação'
  | 'tecnologia'
  | 'serviços'
  | 'imobiliário'
  | 'dorama'

export type Platform = 
  | 'meta-ads'
  | 'google-ads'
  | 'tiktok-ads'
  | 'youtube-ads'
  | 'display'

export type CreativeType = 'imagem' | 'vídeo' | 'copy' | 'headline' | 'variações A/B'

export type Objective = 'conversão' | 'CTR' | 'retenção visual' | 'clareza da oferta'

export type Style = 
  | 'direto e agressivo'
  | 'emocional'
  | 'educacional'
  | 'minimalista'
  | 'premium'
  | 'UGC'
  | 'storytelling curto'
  | 'comparativo'
  | 'prova social'

export type Tone = 'professional' | 'casual' | 'friendly' | 'urgent' | 'inspiring'

export interface PerformanceCreativeRequest {
  // Required
  language: Language
  niche: Niche
  platform: Platform
  creative_type: CreativeType
  objective: Objective
  
  // Optional
  product_name?: string
  offer?: string
  target_audience?: string
  tone?: Tone
  style?: Style
  pain_point?: string
  desired_action?: string
  quantity_of_variations?: number
  
  // Additional context
  mainPrompt?: string
  imageRatio?: '1:1' | '4:5' | '9:16' | '16:9'
  
  // Tenant context (optional for admins)
  organizationId?: string
  siteId?: string
  
  // Image generation options
  generateImages?: boolean
  imageModel?: 'nano' | 'pro'
  includeTextInImage?: boolean
}

export interface CreativeVersion {
  version_number: number
  headline?: string
  copy?: string
  image_prompt?: string
  image_url?: string // URL da imagem gerada (quando generateImages = true)
  cta: string
  style_applied: Style
  tone_applied: Tone
  notes?: string
}

export interface PerformanceCreativeOutput {
  language: Language
  niche: Niche
  platform: Platform
  creative_versions: CreativeVersion[]
  cta: string
  notes: string
  metadata: {
    generated_at: string
    variations_count: number
    style_engine_version: string
  }
}

export class PerformanceCreativeEngine {
  private readonly styleEngine: StyleEngine
  private readonly toneAdapter: ToneAdapter
  private readonly copyGenerator: CopyGenerator

  constructor() {
    this.styleEngine = new StyleEngine()
    this.toneAdapter = new ToneAdapter()
    this.copyGenerator = new CopyGenerator()
  }

  /**
   * Gera criativos de alta performance
   */
  async generateCreatives(
    request: PerformanceCreativeRequest,
    aiService: any
  ): Promise<PerformanceCreativeOutput> {
    try {
      // Validar input
      this.validateRequest(request)

      // Determinar estilo e tom
      const style = request.style || this.styleEngine.selectOptimalStyle(request)
      const tone = request.tone || this.toneAdapter.adaptTone(request.language, request.niche)

      // Gerar variações
      const variations = request.quantity_of_variations || 3
      const creativeVersions: CreativeVersion[] = []

      for (let i = 1; i <= variations; i++) {
        try {
          const version = await this.generateVersion(
            request,
            style,
            tone,
            i,
            variations,
            aiService
          )
          creativeVersions.push(version)
        } catch (versionError) {
          console.error(`[PerformanceCreativeEngine] Erro ao gerar versão ${i}:`, versionError)
          // Continuar com outras versões mesmo se uma falhar
          if (creativeVersions.length === 0) {
            throw versionError
          }
        }
      }

      // Gerar CTA principal
      const cta = this.generateCTA(request)

      // Gerar notas
      const notes = this.generateNotes(request, creativeVersions)

      return {
        language: request.language,
        niche: request.niche,
        platform: request.platform,
        creative_versions: creativeVersions,
        cta,
        notes,
        metadata: {
          generated_at: new Date().toISOString(),
          variations_count: variations,
          style_engine_version: '1.0.0'
        }
      }
    } catch (error) {
      console.error('[PerformanceCreativeEngine] Erro ao gerar criativos:', error)
      throw error
    }
  }

  /**
   * Gera uma versão específica do criativo
   */
  private async generateVersion(
    request: PerformanceCreativeRequest,
    style: Style,
    tone: Tone,
    versionNumber: number,
    totalVariations: number,
    aiService: any
  ): Promise<CreativeVersion> {
    try {
      // Variação de estilo para A/B testing
      const styleVariant = this.styleEngine.getStyleVariant(style, versionNumber, totalVariations)
      
      // ✅ CORREÇÃO: Se creative_type for 'imagem' OU 'variações A/B' COM mainPrompt, pular geração de copy/headline
      // Quando há mainPrompt, o usuário quer apenas imagens, não novas copies
      let headline: string | undefined
      let copy: string | undefined
      
      const shouldSkipCopy = request.creative_type === 'imagem' || 
                            (request.creative_type === 'variações A/B' && request.mainPrompt)
      
      if (!shouldSkipCopy) {
        // Construir prompt de copy
        const copyPrompt = this.copyGenerator.buildCopyPrompt(request, styleVariant, tone)
        console.log(`[PerformanceCreativeEngine] Versão ${versionNumber}: Gerando copy...`)
        
        // Gerar copy via IA
        copy = await this.copyGenerator.generateCopy(copyPrompt, aiService, request.language)
        console.log(`[PerformanceCreativeEngine] Versão ${versionNumber}: Copy gerada (${copy.length} chars)`)
        
        // Gerar headline
        headline = this.copyGenerator.generateHeadline(request, styleVariant, tone)
      } else {
        // Para tipo 'imagem' ou 'variações A/B' com mainPrompt, usar o mainPrompt como base para headline (opcional)
        if (request.mainPrompt) {
          // Extrair título do mainPrompt ou usar product_name
          headline = request.product_name || request.mainPrompt.split('.')[0].substring(0, 60) || 'Criativo de Performance'
        }
        console.log(`[PerformanceCreativeEngine] Versão ${versionNumber}: Modo imagem (${request.creative_type}) - pulando geração de copy`)
      }
      
      // Gerar prompt de imagem (sempre quando for tipo imagem ou variações A/B)
      const imagePrompt = request.creative_type === 'imagem' || request.creative_type === 'variações A/B'
        ? this.generateImagePrompt(request, styleVariant)
        : undefined

      return {
        version_number: versionNumber,
        headline,
        copy,
        image_prompt: imagePrompt,
        cta: this.generateCTA(request, styleVariant),
        style_applied: styleVariant,
        tone_applied: tone,
        notes: this.generateVersionNotes(styleVariant, tone, request)
      }
    } catch (error) {
      console.error(`[PerformanceCreativeEngine] Erro ao gerar versão ${versionNumber}:`, error)
      throw error
    }
  }

  /**
   * Gera prompt de imagem otimizado para performance
   * 
   * REGRA: mainPrompt é sempre a BASE (fonte da verdade)
   * Outros campos (product_name, offer, etc.) são apenas complementos
   */
  private generateImagePrompt(
    request: PerformanceCreativeRequest,
    style: Style
  ): string {
    const parts: string[] = []
    
    // BASE: mainPrompt (fonte da verdade - obrigatório se fornecido)
    if (request.mainPrompt && request.mainPrompt.trim()) {
      parts.push(request.mainPrompt.trim())
    } else {
      // Fallback: construir a partir de product_name/offer se mainPrompt não existir
      if (request.product_name) {
        parts.push(`Produto principal: ${request.product_name}`)
      }
      if (request.offer) {
        parts.push(`Oferta: ${request.offer}`)
      }
    }

    // COMPLEMENTOS: enriquecem o prompt principal, não substituem
    const visualStyle = this.styleEngine.getVisualStyle(style, request.niche)
    parts.push(`Estilo visual: ${visualStyle}`)

    // Direção técnica baseada em plataforma
    const technicalDirection = this.getPlatformTechnicalDirection(request.platform, request.imageRatio)
    parts.push(`Direção técnica: ${technicalDirection}`)

    // Foco em conversão
    parts.push('Foco: conversão e ação imediata')
    parts.push('Elementos visuais: alto contraste, cores vibrantes, composição impactante')

    // Safe area para texto (se não incluir texto na imagem)
    if (request.imageRatio) {
      const safeArea = this.getSafeAreaForRatio(request.imageRatio)
      parts.push(`Safe area: ${safeArea}`)
    }

    // Negativos obrigatórios
    parts.push('Negativos: sem aparência 3D, sem renderização CG, sem elementos genéricos')

    return parts.join('. ')
  }

  /**
   * Gera CTA otimizado
   */
  private generateCTA(
    request: PerformanceCreativeRequest,
    style?: Style
  ): string {
    if (request.desired_action) {
      return request.desired_action
    }

    // CTA baseado em objetivo
    const ctaMap: Record<Objective, string> = {
      'conversão': 'Compre Agora',
      'CTR': 'Clique Aqui',
      'retenção visual': 'Veja Mais',
      'clareza da oferta': 'Saiba Mais'
    }

    let cta = ctaMap[request.objective] || 'Saiba Mais'

    // Adaptar por idioma
    if (request.language === 'en-US') {
      cta = cta.replace('Compre Agora', 'Buy Now')
        .replace('Clique Aqui', 'Click Here')
        .replace('Veja Mais', 'See More')
        .replace('Saiba Mais', 'Learn More')
    } else if (request.language === 'es-ES') {
      cta = cta.replace('Compre Agora', 'Comprar Ahora')
        .replace('Clique Aqui', 'Haz Clic Aquí')
        .replace('Veja Mais', 'Ver Más')
        .replace('Saiba Mais', 'Saber Más')
    }

    // Ajustar por estilo
    if (style === 'direto e agressivo') {
      cta = cta.toUpperCase()
    } else if (style === 'premium') {
      cta = `Descubra ${cta.toLowerCase()}`
    }

    return cta
  }

  /**
   * Gera notas explicativas
   */
  private generateNotes(
    request: PerformanceCreativeRequest,
    versions: CreativeVersion[]
  ): string {
    const notes: string[] = []
    
    notes.push(`Criativos gerados para ${request.niche} na plataforma ${request.platform}`)
    notes.push(`Objetivo: ${request.objective}`)
    notes.push(`Idioma: ${request.language}`)
    notes.push(`Total de variações: ${versions.length}`)
    
    if (request.style) {
      notes.push(`Estilo aplicado: ${request.style}`)
    }
    
    notes.push('')
    notes.push('Recomendações:')
    notes.push('- Teste todas as variações em campanhas A/B')
    notes.push('- Monitore CTR e conversão por versão')
    notes.push('- Otimize baseado em performance real')

    return notes.join('\n')
  }

  /**
   * Gera notas específicas da versão
   */
  private generateVersionNotes(
    style: Style,
    tone: Tone,
    request: PerformanceCreativeRequest
  ): string {
    return `Versão ${style} com tom ${tone}, otimizada para ${request.objective}`
  }

  /**
   * Valida request
   */
  private validateRequest(request: PerformanceCreativeRequest): void {
    if (!request.language || !request.niche || !request.platform || !request.creative_type || !request.objective) {
      throw new Error('Campos obrigatórios faltando: language, niche, platform, creative_type, objective')
    }
  }

  /**
   * Obtém direção técnica baseada em plataforma
   */
  private getPlatformTechnicalDirection(
    platform: Platform,
    imageRatio?: '1:1' | '4:5' | '9:16' | '16:9'
  ): string {
    const ratio = imageRatio || this.getDefaultRatioForPlatform(platform)
    
    const directions: Record<string, string> = {
      '9:16': 'Formato vertical (9:16), otimizado para feed mobile, composição centralizada, atenção nos primeiros 3 segundos',
      '16:9': 'Formato horizontal (16:9), otimizado para display ads, layout amplo, elementos em camadas',
      '4:5': 'Formato vertical (4:5), ideal para Instagram feed, foco no produto central',
      '1:1': 'Formato quadrado (1:1), composição equilibrada, produto em destaque'
    }

    return directions[ratio] || directions['1:1'] || 'Formato quadrado (1:1), composição equilibrada, produto em destaque'
  }

  /**
   * Obtém ratio padrão para plataforma
   */
  private getDefaultRatioForPlatform(platform: Platform): '1:1' | '4:5' | '9:16' | '16:9' {
    const ratioMap: Record<Platform, '1:1' | '4:5' | '9:16' | '16:9'> = {
      'meta-ads': '9:16',
      'google-ads': '16:9',
      'tiktok-ads': '9:16',
      'youtube-ads': '16:9',
      'display': '16:9'
    }
    return ratioMap[platform] || '1:1'
  }

  /**
   * Obtém safe area para ratio
   */
  private getSafeAreaForRatio(ratio: '1:1' | '4:5' | '9:16' | '16:9'): string {
    const safeAreas: Record<string, string> = {
      '9:16': 'Topo 20% e inferior 30% reservados para overlay de texto/CTA',
      '4:5': 'Inferior 25% reservado para overlay de texto/CTA',
      '16:9': 'Inferior 20% reservado para overlay de texto/CTA',
      '1:1': 'Inferior 20% reservado para overlay de texto/CTA'
    }
    return safeAreas[ratio] || safeAreas['1:1'] || 'Negative space reservado para overlay de texto/CTA'
  }
}

/**
 * Style Engine - Seleciona e aplica estilos
 */
class StyleEngine {
  /**
   * Seleciona estilo ótimo baseado em contexto
   */
  selectOptimalStyle(request: PerformanceCreativeRequest): Style {
    // Mapeamento de nicho -> estilo recomendado
    const nicheStyleMap: Partial<Record<Niche, Style>> = {
      'e-commerce': 'direto e agressivo',
      'infoprodutos': 'educacional',
      'saúde': 'emocional',
      'beleza': 'premium',
      'fitness': 'UGC',
      'finanças': 'premium',
      'educação': 'educacional',
      'tecnologia': 'minimalista',
      'serviços': 'storytelling curto',
      'imobiliário': 'premium',
      'dorama': 'storytelling curto'
    }

    // Mapeamento de objetivo -> estilo
    const objectiveStyleMap: Record<Objective, Style> = {
      'conversão': 'direto e agressivo',
      'CTR': 'prova social',
      'retenção visual': 'storytelling curto',
      'clareza da oferta': 'minimalista'
    }

    // Priorizar objetivo sobre nicho
    return objectiveStyleMap[request.objective] || nicheStyleMap[request.niche] || 'direto e agressivo'
  }

  /**
   * Obtém variante de estilo para A/B testing
   */
  getStyleVariant(
    baseStyle: Style,
    versionNumber: number,
    _totalVariations: number
  ): Style {
    // Para A/B testing, variar estilo mantendo base
    const styleVariants: Record<Style, Style[]> = {
      'direto e agressivo': ['direto e agressivo', 'prova social', 'comparativo'],
      'emocional': ['emocional', 'storytelling curto', 'UGC'],
      'educacional': ['educacional', 'minimalista', 'storytelling curto'],
      'minimalista': ['minimalista', 'premium', 'educacional'],
      'premium': ['premium', 'minimalista', 'emocional'],
      'UGC': ['UGC', 'emocional', 'storytelling curto'],
      'storytelling curto': ['storytelling curto', 'emocional', 'UGC'],
      'comparativo': ['comparativo', 'prova social', 'direto e agressivo'],
      'prova social': ['prova social', 'comparativo', 'UGC']
    }

    const variants = styleVariants[baseStyle] || [baseStyle]
    const index = (versionNumber - 1) % variants.length
    const selected = variants[index]
    return selected || baseStyle
  }

  /**
   * Obtém descrição visual do estilo
   */
  getVisualStyle(style: Style, _niche: Niche): string {
    const visualStyles: Record<Style, string> = {
      'direto e agressivo': 'Alto contraste, cores vibrantes, elementos chamativos, design impactante, foco em ação imediata',
      'emocional': 'Cores suaves mas impactantes, composição que evoca sentimento, iluminação dramática, foco em conexão emocional',
      'educacional': 'Layout limpo, tipografia clara, elementos informativos, cores profissionais, foco em clareza',
      'minimalista': 'Espaço em branco generoso, elementos essenciais, cores neutras, composição equilibrada, foco em elegância',
      'premium': 'Qualidade fotográfica alta, iluminação sofisticada, composição refinada, paleta de cores premium, foco em exclusividade',
      'UGC': 'Estilo autêntico, não perfeito, ângulos naturais, iluminação ambiente, foco em realismo',
      'storytelling curto': 'Sequência visual, elementos narrativos, composição dinâmica, cores expressivas, foco em história, estilo dramático de novela mexicana, personagens em cena emocional, iluminação cinematográfica',
      'comparativo': 'Elementos lado a lado, contraste visual claro, tipografia comparativa, cores distintas, foco em diferença',
      'prova social': 'Pessoas reais, expressões autênticas, contexto de uso, elementos sociais, foco em confiança'
    }

    return visualStyles[style] || visualStyles['direto e agressivo']
  }
}

/**
 * Tone Adapter - Adapta tom por idioma e cultura
 */
class ToneAdapter {
  /**
   * Adapta tom baseado em idioma e nicho
   */
  adaptTone(language: Language, niche: Niche): Tone {
    // Tom base por idioma (conforme especificação)
    const languageToneMap: Record<Language, Tone> = {
      'pt-BR': 'friendly', // Mais emocional e conversacional
      'en-US': 'professional', // Mais direto e objetivo
      'es-ES': 'friendly' // Emocional com clareza comercial
    }

    const baseTone = languageToneMap[language] || 'professional'
    
    // Ajustar tom baseado no nicho
    return this.adjustToneForNiche(baseTone, niche)
  }

  /**
   * Ajusta tom por nicho
   */
  adjustToneForNiche(baseTone: Tone, niche: Niche): Tone {
    const nicheToneMap: Partial<Record<Niche, Tone>> = {
      'finanças': 'professional',
      'saúde': 'professional',
      'beleza': 'friendly',
      'fitness': 'inspiring',
      'educação': 'professional',
      'e-commerce': 'casual'
    }

    return nicheToneMap[niche] || baseTone
  }
}

/**
 * Copy Generator - Gera copy otimizada para performance
 */
class CopyGenerator {
  /**
   * Constrói prompt para geração de copy
   */
  buildCopyPrompt(
    request: PerformanceCreativeRequest,
    style: Style,
    tone: Tone
  ): string {
    const parts: string[] = []
    
    parts.push('Você é um copywriter especialista em performance marketing e tráfego direto.')
    parts.push('Gere copy de alta conversão focada em resultados.')
    parts.push('')
    parts.push('REGRAS OBRIGATÓRIAS:')
    parts.push('- Foco em conversão, CTR e clareza')
    parts.push('- Atenção nos primeiros 3 segundos')
    parts.push('- Proposta de valor clara')
    parts.push('- Benefícios antes de características')
    parts.push('- Linguagem simples e direta')
    parts.push('- CTA explícito')
    parts.push('- Evitar abstrações e termos vagos')
    parts.push('- Focar em dor, desejo ou ganho concreto')
    parts.push('')
    parts.push('NÃO FAZER:')
    parts.push('- Não gerar conteúdo genérico')
    parts.push('- Não usar linguagem institucional')
    parts.push('- Não usar jargões técnicos desnecessários')
    parts.push('- Não misturar idiomas')
    parts.push('')
    
    // BASE: mainPrompt (fonte da verdade - obrigatório se fornecido)
    if (request.mainPrompt && request.mainPrompt.trim()) {
      parts.push('PROMPT PRINCIPAL (BASE):')
      parts.push(request.mainPrompt.trim())
      parts.push('')
      parts.push('CONTEXTO ADICIONAL (complementa o prompt principal):')
    } else {
      parts.push('CONTEXTO:')
    }
    
    parts.push(`- Idioma: ${request.language}`)
    parts.push(`- Nicho: ${request.niche}`)
    parts.push(`- Plataforma: ${request.platform}`)
    parts.push(`- Objetivo: ${request.objective}`)
    parts.push(`- Estilo: ${style}`)
    parts.push(`- Tom: ${tone}`)
    parts.push('')
    
    // Complementos (enriquecem, não substituem)
    if (request.product_name) {
      parts.push(`- Produto: ${request.product_name}`)
    }
    if (request.offer) {
      parts.push(`- Oferta: ${request.offer}`)
    }
    if (request.target_audience) {
      parts.push(`- Público-alvo: ${request.target_audience}`)
    }
    if (request.pain_point) {
      parts.push(`- Dor do cliente: ${request.pain_point}`)
    }
    
    parts.push('')
    parts.push('Gere copy otimizada para performance, focada em conversão.')

    return parts.join('\n')
  }

  /**
   * Gera copy via IA
   */
  async generateCopy(
    prompt: string,
    aiService: any,
    _language: Language
  ): Promise<string> {
    try {
      if (!aiService || typeof aiService.generateContent !== 'function') {
        throw new Error('AIService inválido ou método generateContent não disponível')
      }

      const result = await aiService.generateContent({
        prompt,
        type: 'text',
        model: 'gemini-2.5-flash',
        maxTokens: 300,
        temperature: 0.8
      })

      if (!result) {
        throw new Error('Resposta do AIService é nula ou indefinida')
      }

      if (!result.success) {
        const errorMsg = result.error || 'Erro desconhecido na geração de copy'
        throw new Error(`Erro ao gerar copy: ${errorMsg}`)
      }

      // AIService retorna data diretamente ou data.content
      let content: string | undefined
      if (result.data) {
        if (typeof result.data === 'string') {
          content = result.data
        } else if (result.data.content) {
          content = result.data.content
        } else if (result.data.text) {
          content = result.data.text
        } else if (result.data.message) {
          content = result.data.message
        }
      }

      if (!content) {
        console.error('[CopyGenerator] Resposta sem conteúdo:', JSON.stringify(result, null, 2))
        throw new Error('Resposta da IA não contém conteúdo válido')
      }

      return content.trim()
    } catch (error) {
      console.error('[CopyGenerator] Erro ao gerar copy:', error)
      throw error
    }
  }

  /**
   * Gera headline otimizada
   */
  generateHeadline(
    request: PerformanceCreativeRequest,
    style: Style,
    _tone: Tone
  ): string {
    // Headlines base por objetivo
    const headlineTemplates: Record<Objective, string[]> = {
      'conversão': [
        `${request.product_name || 'Produto'} - ${request.offer || 'Oferta Especial'}`,
        `Transforme sua vida com ${request.product_name || 'nossa solução'}`,
        `${request.offer || 'Oferta'} exclusiva para você`
      ],
      'CTR': [
        `Você precisa ver isso: ${request.product_name || 'Oferta'}`,
        `Isso vai mudar sua vida: ${request.product_name || 'Produto'}`,
        `Não perca: ${request.offer || 'Oferta especial'}`
      ],
      'retenção visual': [
        `Descubra ${request.product_name || 'o segredo'}`,
        `Veja como ${request.product_name || 'funciona'}`,
        `${request.product_name || 'Produto'} em ação`
      ],
      'clareza da oferta': [
        `${request.product_name || 'Produto'}: ${request.offer || 'Solução clara'}`,
        `Entenda ${request.product_name || 'nossa proposta'}`,
        `${request.offer || 'Oferta'} explicada`
      ]
    }

    const templates = headlineTemplates[request.objective] || headlineTemplates['conversão']
    const index = Math.floor(Math.random() * templates.length)
    let headline = templates[index] || request.product_name || 'Oferta Especial'

    // Adaptar por idioma
    if (request.language === 'en-US') {
      headline = headline
        .replace('Produto', 'Product')
        .replace('Oferta', 'Offer')
        .replace('Você precisa ver isso', 'You need to see this')
        .replace('Isso vai mudar sua vida', 'This will change your life')
        .replace('Não perca', "Don't miss")
    } else if (request.language === 'es-ES') {
      headline = headline
        .replace('Produto', 'Producto')
        .replace('Oferta', 'Oferta')
        .replace('Você precisa ver isso', 'Necesitas ver esto')
        .replace('Isso vai mudar sua vida', 'Esto cambiará tu vida')
        .replace('Não perca', 'No te pierdas')
    }

    // Ajustar por estilo
    if (style === 'direto e agressivo') {
      headline = headline.toUpperCase()
    } else if (style === 'premium') {
      headline = `Premium: ${headline}`
    }

    return headline || 'Oferta Especial'
  }
}

