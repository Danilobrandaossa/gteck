/**
 * Sistema de Identificação Inteligente de Modelos Pressel
 * Cada modelo (V1, V3, V4, V5, B1) tem estrutura única de JSON e campos ACF
 */

export interface ModelSignature {
  modelName: string
  uniqueFields: string[]           // Campos únicos que só existem neste modelo
  commonFields: string[]           // Campos comuns a todos os modelos
  fieldPatterns: RegExp[]          // Padrões regex para identificar o modelo
  requiredFields: string[]         // Campos obrigatórios para este modelo
  optionalFields: string[]         // Campos opcionais
  templateFile: string            // Arquivo PHP do template
  description: string             // Descrição do modelo
}

export class ModelIdentifier {
  private static instance: ModelIdentifier
  private modelSignatures: Map<string, ModelSignature> = new Map()

  static getInstance(): ModelIdentifier {
    if (!ModelIdentifier.instance) {
      ModelIdentifier.instance = new ModelIdentifier()
      ModelIdentifier.instance.initializeModelSignatures()
    }
    return ModelIdentifier.instance
  }

  // Inicializar assinaturas dos modelos
  private initializeModelSignatures(): void {
            // Modelo V1 - Pressel Oficial (campos reais do arquivo ACF)
            this.modelSignatures.set('V1', {
              modelName: 'V1',
              uniqueFields: [
          "hero_description",
          "link_h1",
          "botao_tipo_selecao",
          "titulo_da_secao",
          "cor_botao",
          "texto_botao_p1",
          "link_botao_p1",
          "texto_botao_p2",
          "link_botao_p2",
          "texto_botao_p3",
          "link_botao_p3",
          "texto_usuario",
          "titulo_h2_",
          "info_content",
          "titulo_h2_02",
          "info_content_2",
          "titulo_beneficios",
          "titulo_beneficios_1",
          "_beneficio_text_1",
          "titulo_beneficios_2",
          "_beneficio_text_2",
          "titulo_beneficios_3",
          "_beneficio_text_3",
          "titulo_beneficios_4",
          "_beneficio_text_4",
          "titulo_faq",
          "pergunta_1",
          "resposta_1",
          "pergunta_2",
          "resposta_2",
          "pergunta_3",
          "resposta_3",
          "aviso"
],
              commonFields: ['hero_title', 'hero_image'],
              fieldPatterns: [
                /titulo_da_secao/,
                /cor_botao/,
                /texto_botao_p[123]/,
                /link_botao_p[123]/,
                /titulo_h2_/,
                /titulo_beneficios/,
                /titulo_faq/,
                /pergunta_[123]/,
                /resposta_[123]/,
                /_beneficio_text_[1234]/
              ],
              requiredFields: [
          "titulo_da_secao",
          "texto_usuario",
          "titulo_beneficios",
          "titulo_faq"
],
              optionalFields: [
          "hero_description",
          "link_h1",
          "botao_tipo_selecao",
          "cor_botao",
          "texto_botao_p1",
          "link_botao_p1",
          "texto_botao_p2",
          "link_botao_p2",
          "texto_botao_p3",
          "link_botao_p3",
          "titulo_h2_",
          "info_content",
          "titulo_h2_02",
          "info_content_2",
          "titulo_beneficios_1",
          "_beneficio_text_1",
          "titulo_beneficios_2",
          "_beneficio_text_2",
          "titulo_beneficios_3",
          "_beneficio_text_3",
          "titulo_beneficios_4",
          "_beneficio_text_4",
          "pergunta_1",
          "resposta_1",
          "pergunta_2",
          "resposta_2",
          "pergunta_3",
          "resposta_3",
          "aviso"
],
              templateFile: 'pressel-oficial.php',
              description: 'Modelo V1 - Pressel Oficial com seções de benefícios e FAQ'
            })

    // Modelo V3 - Estrutura diferente
    this.modelSignatures.set('V3', {
      modelName: 'V3',
      uniqueFields: [
        'hero_subtitle',
        'hero_cta_text',
        'hero_cta_link',
        'content_sections',
        'features_list',
        'testimonials',
        'pricing_section',
        'contact_form'
      ],
      commonFields: ['hero_title', 'hero_image'],
      fieldPatterns: [
        /hero_subtitle/,
        /hero_cta_text/,
        /content_sections/,
        /features_list/,
        /testimonials/,
        /pricing_section/
      ],
      requiredFields: ['hero_title', 'hero_subtitle', 'content_sections'],
      optionalFields: ['hero_image', 'hero_cta_text', 'hero_cta_link', 'features_list'],
      templateFile: 'modelo-v3.php',
      description: 'Modelo V3 - Estrutura com seções de conteúdo e recursos'
    })

    // Modelo V4 - Pressel V4 (campos reais do arquivo ACF)
    this.modelSignatures.set('V4', {
      modelName: 'V4',
      uniqueFields: [
        'idioma_footer',
        'title_h1',
        'sub_title',
        'imagem_destaque',
        'tipo_botao',
        'download_button_url',
        'download_button_text',
        'disclaimer',
        'description',
        'benefits_title',
        'benefits',
        'title2',
        'description1',
        'faq_title',
        'faqs'
      ],
      commonFields: ['title_h1', 'sub_title'],
      fieldPatterns: [
        /title_h1/,
        /sub_title/,
        /download_button/,
        /benefits/,
        /faq/,
        /description/
      ],
      requiredFields: ['idioma_footer', 'title_h1', 'download_button_text'],
      optionalFields: ['sub_title', 'imagem_destaque', 'tipo_botao', 'download_button_url', 'disclaimer', 'description', 'benefits_title', 'benefits', 'title2', 'description1', 'faq_title', 'faqs'],
      templateFile: 'V4.php',
      description: 'Modelo V4 - Pressel V4 com seções de benefícios e FAQ'
    })

    // Modelo V5 - Estrutura diferente
    this.modelSignatures.set('V5', {
      modelName: 'V5',
      uniqueFields: [
        'landing_title',
        'landing_subtitle',
        'landing_cta',
        'video_section',
        'steps_section',
        'benefits_grid',
        'social_media',
        'newsletter_signup'
      ],
      commonFields: ['hero_title', 'hero_image'],
      fieldPatterns: [
        /landing_title/,
        /landing_subtitle/,
        /landing_cta/,
        /video_section/,
        /steps_section/,
        /benefits_grid/
      ],
      requiredFields: ['landing_title', 'landing_subtitle', 'landing_cta'],
      optionalFields: ['video_section', 'steps_section', 'benefits_grid'],
      templateFile: 'modelo-v5.php',
      description: 'Modelo V5 - Landing page com vídeo e seções de benefícios'
    })

    // Modelo B1 - Estrutura diferente
    this.modelSignatures.set('B1', {
      modelName: 'B1',
      uniqueFields: [
        'blog_title',
        'blog_subtitle',
        'author_info',
        'publish_date',
        'reading_time',
        'tags_list',
        'related_posts',
        'comments_section',
        'share_buttons'
      ],
      commonFields: ['hero_title', 'hero_image'],
      fieldPatterns: [
        /blog_title/,
        /blog_subtitle/,
        /author_info/,
        /publish_date/,
        /reading_time/,
        /tags_list/
      ],
      requiredFields: ['blog_title', 'blog_subtitle', 'author_info'],
      optionalFields: ['publish_date', 'reading_time', 'tags_list'],
      templateFile: 'modelo-b1.php',
      description: 'Modelo B1 - Blog com informações de autor e tags'
    })
  }

  // Identificar modelo baseado nos campos ACF
  identifyModel(jsonData: any): { model: ModelSignature | null; confidence: number; matchedFields: string[] } {
    const acfFields = Object.keys(jsonData.acf_fields || {})
    
    console.log(`🔍 Analisando ${acfFields.length} campos para identificação:`)
    console.log(`📊 Campos encontrados: ${acfFields.join(', ')}`)

    let bestMatch: ModelSignature | null = null
    let bestScore = 0
    let bestMatchedFields: string[] = []

    // @ts-expect-error FIX_BUILD: Suppressing error to allow build
    for (const [modelName, signature] of this.modelSignatures) {
      const score = this.calculateModelScore(acfFields, signature)
      const matchedFields = this.getMatchedFields(acfFields, signature)
      
      console.log(`📈 ${modelName}: Score ${score.toFixed(2)} (${matchedFields.length} campos)`)

      if (score > bestScore) {
        bestScore = score
        bestMatch = signature
        bestMatchedFields = matchedFields
      }
    }

    // Verificar se a confiança é suficiente (mínimo 30%)
    if (bestMatch && bestScore >= 0.3) {
      console.log(`✅ Modelo identificado: ${bestMatch.modelName}`)
      console.log(`📈 Confiança: ${Math.round(bestScore * 100)}%`)
      console.log(`🔗 Campos correspondentes: ${bestMatchedFields.join(', ')}`)
      
      return {
        model: bestMatch,
        confidence: bestScore,
        matchedFields: bestMatchedFields
      }
    }

    console.log('❌ Nenhum modelo identificado com confiança suficiente')
    return {
      model: null,
      confidence: 0,
      matchedFields: []
    }
  }

  // Calcular score de compatibilidade
  private calculateModelScore(jsonFields: string[], signature: ModelSignature): number {
    let score = 0
    let totalWeight = 0

    // Peso maior para campos únicos (indicam fortemente o modelo)
    signature.uniqueFields.forEach(field => {
      totalWeight += 3
      if (jsonFields.includes(field)) {
        score += 3
      }
    })

    // Peso médio para campos obrigatórios
    signature.requiredFields.forEach(field => {
      totalWeight += 2
      if (jsonFields.includes(field)) {
        score += 2
      }
    })

    // Peso menor para campos opcionais
    signature.optionalFields.forEach(field => {
      totalWeight += 1
      if (jsonFields.includes(field)) {
        score += 1
      }
    })

    // Verificar padrões regex
    signature.fieldPatterns.forEach(pattern => {
      const matches = jsonFields.filter(field => pattern.test(field))
      if (matches.length > 0) {
        score += matches.length * 0.5
        totalWeight += 0.5
      }
    })

    return totalWeight > 0 ? score / totalWeight : 0
  }

  // Obter campos que fizeram match
  private getMatchedFields(jsonFields: string[], signature: ModelSignature): string[] {
    const matched: string[] = []
    
    // Campos únicos
    signature.uniqueFields.forEach(field => {
      if (jsonFields.includes(field)) {
        matched.push(field)
      }
    })

    // Campos obrigatórios
    signature.requiredFields.forEach(field => {
      if (jsonFields.includes(field) && !matched.includes(field)) {
        matched.push(field)
      }
    })

    // Campos opcionais
    signature.optionalFields.forEach(field => {
      if (jsonFields.includes(field) && !matched.includes(field)) {
        matched.push(field)
      }
    })

    return matched
  }

  // Validar se o JSON é compatível com o modelo identificado
  validateJsonForModel(jsonData: any, signature: ModelSignature): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []
    const acfFields = Object.keys(jsonData.acf_fields || {})

    // Verificar campos obrigatórios
    signature.requiredFields.forEach(field => {
      if (!acfFields.includes(field)) {
        errors.push(`Campo obrigatório ausente: ${field}`)
      }
    })

    // Verificar campos únicos (devem estar presentes)
    const uniqueFieldsPresent = signature.uniqueFields.filter(field => acfFields.includes(field))
    if (uniqueFieldsPresent.length === 0) {
      errors.push(`Nenhum campo único do modelo ${signature.modelName} encontrado`)
    }

    // Avisar sobre campos não reconhecidos
    const unrecognizedFields = acfFields.filter(field => 
      !signature.uniqueFields.includes(field) &&
      !signature.commonFields.includes(field) &&
      !signature.requiredFields.includes(field) &&
      !signature.optionalFields.includes(field)
    )

    if (unrecognizedFields.length > 0) {
      warnings.push(`Campos não reconhecidos para modelo ${signature.modelName}: ${unrecognizedFields.join(', ')}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Obter informações de todos os modelos
  getAllModels(): ModelSignature[] {
    return Array.from(this.modelSignatures.values())
  }

  // Obter informações de um modelo específico
  getModel(modelName: string): ModelSignature | null {
    return this.modelSignatures.get(modelName) || null
  }

  // Gerar JSON de exemplo para um modelo específico
  generateExampleJson(modelName: string): any {
    const signature = this.getModel(modelName)
    if (!signature) {
      throw new Error(`Modelo ${modelName} não encontrado`)
    }

    const exampleData: any = {
      page_title: `Exemplo de Página - ${signature.modelName}`,
      page_content: `Conteúdo da página de exemplo para modelo ${signature.modelName}`,
      page_status: 'publish',
      page_template: signature.templateFile,
      page_slug: `exemplo-${signature.modelName.toLowerCase()}`,
      acf_fields: {},
      seo: {
        meta_title: `Exemplo ${signature.modelName} - SEO`,
        meta_description: `Descrição SEO para modelo ${signature.modelName}`,
        focus_keyword: signature.modelName.toLowerCase()
      },
      featured_image: 'https://via.placeholder.com/1200x600'
    }

    // Adicionar campos únicos do modelo
    signature.uniqueFields.forEach(field => {
      exampleData.acf_fields[field] = this.generateExampleValue(field, signature.modelName)
    })

    // Adicionar campos obrigatórios
    signature.requiredFields.forEach(field => {
      if (!exampleData.acf_fields[field]) {
        exampleData.acf_fields[field] = this.generateExampleValue(field, signature.modelName)
      }
    })

    // Adicionar campos opcionais
    signature.optionalFields.forEach(field => {
      if (!exampleData.acf_fields[field]) {
        exampleData.acf_fields[field] = this.generateExampleValue(field, signature.modelName)
      }
    })

    return exampleData
  }

  // Gerar valor de exemplo para um campo
  private generateExampleValue(fieldName: string, modelName: string): any {
    const fieldLower = fieldName.toLowerCase()
    
    if (fieldLower.includes('title') || fieldLower.includes('titulo')) {
      return `Título ${modelName}`
    }
    if (fieldLower.includes('description') || fieldLower.includes('descricao')) {
      return `Descrição para modelo ${modelName}`
    }
    if (fieldLower.includes('image') || fieldLower.includes('imagem')) {
      return 'https://via.placeholder.com/600x400'
    }
    if (fieldLower.includes('color') || fieldLower.includes('cor')) {
      return '#FF6B35'
    }
    if (fieldLower.includes('link') || fieldLower.includes('url')) {
      return 'https://exemplo.com'
    }
    if (fieldLower.includes('button') || fieldLower.includes('botao')) {
      return 'Botão Principal'
    }
    if (fieldLower.includes('text') || fieldLower.includes('texto')) {
      return 'Texto de exemplo'
    }
    if (fieldLower.includes('section') || fieldLower.includes('secao')) {
      return 'Seção Principal'
    }
    if (fieldLower.includes('benefit') || fieldLower.includes('beneficio')) {
      return 'Benefício Principal'
    }
    if (fieldLower.includes('faq') || fieldLower.includes('pergunta')) {
      return 'Pergunta Frequente'
    }
    
    return `Valor ${modelName}`
  }
}
