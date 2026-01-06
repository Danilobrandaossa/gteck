// Serviço de Automação Pressel - CMS Moderno
import { CheckCircle, XCircle, AlertTriangle, Info, Plus, Edit, Trash2, Eye, Search, RefreshCw, Zap, Rocket, Settings, FileText, Palette, Users, Calendar, Tag, Link as LinkIcon, Download, Upload, Code, LayoutTemplate, FlaskConical } from 'lucide-react'

export interface PresselModel {
  id: string
  name: string
  slug: string
  description: string
  category: string
  status: 'active' | 'inactive' | 'draft'
  version: string
  author: string
  created_at: string
  updated_at: string
  acf_fields: any[]
  template_content: string
  theme_settings: any
  usage_count: number
  last_used?: string
  preview_image?: string
  is_auto_detected: boolean
  wordpress_template?: string
}

export interface PresselPageData {
  page_title: string
  page_model: string
  page_template: string
  page_slug?: string
  post_status: 'draft' | 'publish' | 'pending'
  acf_fields: Record<string, any>
  seo?: {
    meta_title: string
    meta_description: string
    focus_keyword: string
  }
  featured_image?: string
}

export interface PresselConversionResult {
  success: boolean
  data?: PresselPageData
  error?: string
  warnings?: string[]
  generated_json?: any
}

export class PresselAutomationService {
  private static instance: PresselAutomationService
  private models: PresselModel[] = []
  private acfFieldGroups: any[] = []

  private constructor() {
    this.initializeDefaultModels()
  }

  static getInstance(): PresselAutomationService {
    if (!PresselAutomationService.instance) {
      PresselAutomationService.instance = new PresselAutomationService()
    }
    return PresselAutomationService.instance
  }

  // Inicializa modelos padrão
  private initializeDefaultModels() {
    this.models = [
      {
        id: 'modelo_v1',
        name: 'Modelo V1 (Brasileiro)',
        slug: 'modelo-v1-brasileiro',
        description: 'Template pressel-oficial.php - Otimizado para mercado brasileiro',
        category: 'brasileiro',
        status: 'active',
        version: '1.0.0',
        author: 'CMS Moderno',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        acf_fields: this.getV1ACFFields(),
        template_content: 'pressel-oficial.php',
        theme_settings: { color_scheme: 'blue', layout: 'standard' },
        usage_count: 0,
        is_auto_detected: true,
        wordpress_template: 'pressel-oficial.php'
      },
      {
        id: 'modelo_v2',
        name: 'Modelo V2 (Internacional)',
        slug: 'modelo-v2-internacional',
        description: 'Template presell-enus.php - Otimizado para mercado internacional',
        category: 'internacional',
        status: 'active',
        version: '1.0.0',
        author: 'CMS Moderno',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        acf_fields: this.getV2ACFFields(),
        template_content: 'presell-enus.php',
        theme_settings: { color_scheme: 'green', layout: 'international' },
        usage_count: 0,
        is_auto_detected: true,
        wordpress_template: 'presell-enus.php'
      },
      {
        id: 'modelo_v3',
        name: 'Modelo V3 (Minimalista)',
        slug: 'modelo-v3-minimalista',
        description: 'Template presell-minimal.php - Design limpo e minimalista',
        category: 'minimalista',
        status: 'active',
        version: '1.0.0',
        author: 'CMS Moderno',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        acf_fields: this.getV3ACFFields(),
        template_content: 'presell-minimal.php',
        theme_settings: { color_scheme: 'gray', layout: 'minimal' },
        usage_count: 0,
        is_auto_detected: true,
        wordpress_template: 'presell-minimal.php'
      },
      {
        id: 'modelo_v4',
        name: 'Modelo V4 (E-commerce)',
        slug: 'modelo-v4-ecommerce',
        description: 'Template presell-ecommerce.php - Otimizado para vendas online',
        category: 'ecommerce',
        status: 'active',
        version: '1.0.0',
        author: 'CMS Moderno',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        acf_fields: this.getV4ACFFields(),
        template_content: 'presell-ecommerce.php',
        theme_settings: { color_scheme: 'orange', layout: 'ecommerce' },
        usage_count: 0,
        is_auto_detected: true,
        wordpress_template: 'presell-ecommerce.php'
      },
      {
        id: 'modelo_v5',
        name: 'Modelo V5 (Afiliado)',
        slug: 'modelo-v5-afiliado',
        description: 'Template presell-affiliate.php - Otimizado para marketing de afiliados',
        category: 'afiliado',
        status: 'active',
        version: '1.0.0',
        author: 'CMS Moderno',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        acf_fields: this.getV5ACFFields(),
        template_content: 'presell-affiliate.php',
        theme_settings: { color_scheme: 'purple', layout: 'affiliate' },
        usage_count: 0,
        is_auto_detected: true,
        wordpress_template: 'presell-affiliate.php'
      }
    ]
  }

  // Campos ACF para Modelo V1 (Brasileiro)
  private getV1ACFFields() {
    return [
      { name: 'hero_description', type: 'textarea', label: 'Descrição do Hero', required: true },
      { name: 'link_h1', type: 'url', label: 'Link H1', required: false },
      { name: 'botao_tipo_selecao', type: 'select', label: 'Tipo de Seleção do Botão', options: ['normal', 'rewarded'], required: true },
      { name: 'titulo_da_secao', type: 'text', label: 'Título da Seção', required: true },
      { name: 'cor_botao', type: 'color_picker', label: 'Cor do Botão', required: true },
      { name: 'texto_botao_p1', type: 'text', label: 'Texto do Botão 1', required: true },
      { name: 'link_botao_p1', type: 'url', label: 'Link do Botão 1', required: true },
      { name: 'texto_botao_p2', type: 'text', label: 'Texto do Botão 2', required: false },
      { name: 'link_botao_p2', type: 'url', label: 'Link do Botão 2', required: false },
      { name: 'texto_botao_p3', type: 'text', label: 'Texto do Botão 3', required: false },
      { name: 'link_botao_p3', type: 'url', label: 'Link do Botão 3', required: false },
      { name: 'texto_usuario', type: 'text', label: 'Texto do Usuário', required: true },
      { name: 'titulo_h2_', type: 'text', label: 'Título H2 Principal', required: true },
      { name: 'info_content', type: 'wysiwyg', label: 'Conteúdo Principal', required: true },
      { name: 'titulo_h2_02', type: 'text', label: 'Título H2 Secundário', required: false },
      { name: 'info_content_2', type: 'wysiwyg', label: 'Conteúdo Secundário', required: false },
      { name: 'titulo_beneficios', type: 'text', label: 'Título dos Benefícios', required: true },
      { name: 'titulo_beneficios_1', type: 'text', label: 'Título Benefício 1', required: true },
      { name: '_beneficio_text_1', type: 'textarea', label: 'Texto Benefício 1', required: true },
      { name: 'titulo_beneficios_2', type: 'text', label: 'Título Benefício 2', required: false },
      { name: '_beneficio_text_2', type: 'textarea', label: 'Texto Benefício 2', required: false },
      { name: 'titulo_beneficios_3', type: 'text', label: 'Título Benefício 3', required: false },
      { name: '_beneficio_text_3', type: 'textarea', label: 'Texto Benefício 3', required: false },
      { name: 'titulo_beneficios_4', type: 'text', label: 'Título Benefício 4', required: false },
      { name: '_beneficio_text_4', type: 'textarea', label: 'Texto Benefício 4', required: false },
      { name: 'titulo_faq', type: 'text', label: 'Título FAQ', required: true },
      { name: 'pergunta_1', type: 'text', label: 'Pergunta 1', required: true },
      { name: 'resposta_1', type: 'wysiwyg', label: 'Resposta 1', required: true },
      { name: 'pergunta_2', type: 'text', label: 'Pergunta 2', required: false },
      { name: 'resposta_2', type: 'wysiwyg', label: 'Resposta 2', required: false },
      { name: 'pergunta_3', type: 'text', label: 'Pergunta 3', required: false },
      { name: 'resposta_3', type: 'wysiwyg', label: 'Resposta 3', required: false },
      { name: 'aviso', type: 'select', label: 'Aviso', options: ['aviso_pt', 'aviso_en', 'aviso_es'], required: true }
    ]
  }

  // Campos ACF para Modelo V2 (Internacional)
  private getV2ACFFields() {
    return [
      { name: 'hero_title', type: 'text', label: 'Hero Title', required: true },
      { name: 'hero_description', type: 'textarea', label: 'Hero Description', required: true },
      { name: 'cta_title', type: 'text', label: 'CTA Title', required: true },
      { name: 'cta_button_text', type: 'text', label: 'CTA Button Text', required: true },
      { name: 'cta_button_url', type: 'url', label: 'CTA Button URL', required: true },
      { name: 'benefits_title', type: 'text', label: 'Benefits Title', required: true },
      { name: 'benefit_1_title', type: 'text', label: 'Benefit 1 Title', required: true },
      { name: 'benefit_1_description', type: 'textarea', label: 'Benefit 1 Description', required: true },
      { name: 'benefit_2_title', type: 'text', label: 'Benefit 2 Title', required: false },
      { name: 'benefit_2_description', type: 'textarea', label: 'Benefit 2 Description', required: false },
      { name: 'benefit_3_title', type: 'text', label: 'Benefit 3 Title', required: false },
      { name: 'benefit_3_description', type: 'textarea', label: 'Benefit 3 Description', required: false },
      { name: 'faq_title', type: 'text', label: 'FAQ Title', required: true },
      { name: 'faq_1_question', type: 'text', label: 'FAQ 1 Question', required: true },
      { name: 'faq_1_answer', type: 'wysiwyg', label: 'FAQ 1 Answer', required: true },
      { name: 'faq_2_question', type: 'text', label: 'FAQ 2 Question', required: false },
      { name: 'faq_2_answer', type: 'wysiwyg', label: 'FAQ 2 Answer', required: false },
      { name: 'faq_3_question', type: 'text', label: 'FAQ 3 Question', required: false },
      { name: 'faq_3_answer', type: 'wysiwyg', label: 'FAQ 3 Answer', required: false },
      { name: 'disclaimer', type: 'select', label: 'Disclaimer', options: ['disclaimer_en', 'disclaimer_es'], required: true }
    ]
  }

  // Campos ACF para Modelo V3 (Minimalista)
  private getV3ACFFields() {
    return [
      { name: 'main_title', type: 'text', label: 'Título Principal', required: true },
      { name: 'subtitle', type: 'text', label: 'Subtítulo', required: true },
      { name: 'description', type: 'wysiwyg', label: 'Descrição', required: true },
      { name: 'single_button_text', type: 'text', label: 'Texto do Botão', required: true },
      { name: 'single_button_url', type: 'url', label: 'URL do Botão', required: true },
      { name: 'features_title', type: 'text', label: 'Título das Características', required: false },
      { name: 'feature_1', type: 'text', label: 'Característica 1', required: false },
      { name: 'feature_2', type: 'text', label: 'Característica 2', required: false },
      { name: 'feature_3', type: 'text', label: 'Característica 3', required: false }
    ]
  }

  // Campos ACF para Modelo V4 (E-commerce)
  private getV4ACFFields() {
    return [
      { name: 'product_title', type: 'text', label: 'Título do Produto', required: true },
      { name: 'product_description', type: 'wysiwyg', label: 'Descrição do Produto', required: true },
      { name: 'price', type: 'text', label: 'Preço', required: true },
      { name: 'buy_button_text', type: 'text', label: 'Texto do Botão de Compra', required: true },
      { name: 'buy_button_url', type: 'url', label: 'URL do Botão de Compra', required: true },
      { name: 'product_features', type: 'wysiwyg', label: 'Características do Produto', required: true },
      { name: 'testimonials_title', type: 'text', label: 'Título dos Depoimentos', required: false },
      { name: 'testimonial_1', type: 'textarea', label: 'Depoimento 1', required: false },
      { name: 'testimonial_2', type: 'textarea', label: 'Depoimento 2', required: false },
      { name: 'guarantee_text', type: 'text', label: 'Texto da Garantia', required: false }
    ]
  }

  // Campos ACF para Modelo V5 (Afiliado)
  private getV5ACFFields() {
    return [
      { name: 'offer_title', type: 'text', label: 'Título da Oferta', required: true },
      { name: 'offer_description', type: 'wysiwyg', label: 'Descrição da Oferta', required: true },
      { name: 'affiliate_button_text', type: 'text', label: 'Texto do Botão de Afiliado', required: true },
      { name: 'affiliate_button_url', type: 'url', label: 'URL do Botão de Afiliado', required: true },
      { name: 'bonus_title', type: 'text', label: 'Título dos Bônus', required: false },
      { name: 'bonus_1', type: 'text', label: 'Bônus 1', required: false },
      { name: 'bonus_2', type: 'text', label: 'Bônus 2', required: false },
      { name: 'bonus_3', type: 'text', label: 'Bônus 3', required: false },
      { name: 'urgency_text', type: 'text', label: 'Texto de Urgência', required: false },
      { name: 'social_proof', type: 'wysiwyg', label: 'Prova Social', required: false }
    ]
  }

  // Converte texto do ChatGPT para JSON estruturado
  async convertTextToJSON(
    textContent: string,
    pageModel: string = 'modelo_v1',
    pageSlug?: string,
    customSettings?: any
  ): Promise<PresselConversionResult> {
    try {
      console.log('🔄 Convertendo texto para JSON Pressel...')
      console.log(`📋 Modelo: ${pageModel}`)
      console.log(`📝 Tamanho do texto: ${textContent.length} caracteres`)

      // Extrai informações básicas do texto
      const lines = textContent.split('\n')
      const title = this.extractTitle(lines)
      const description = this.extractDescription(lines)

      // Constrói o JSON base
      const jsonData: PresselPageData = {
        page_title: title,
        page_model: pageModel,
        page_template: this.getTemplateByModel(pageModel),
        post_status: 'publish',
        acf_fields: {}
      }

      // Adiciona slug se fornecido
      if (pageSlug) {
        jsonData.page_slug = pageSlug
      }

      // Extrai campos ACF baseado no modelo
      const acfFields = await this.extractACFFields(textContent, pageModel, customSettings)
      jsonData.acf_fields = acfFields

      // Gera SEO automaticamente
      jsonData.seo = this.generateSEOData(title, description)

      // Define imagem destacada padrão
      jsonData.featured_image = ''

      console.log('✅ Conversão concluída com sucesso')
      console.log(`📊 Campos ACF extraídos: ${Object.keys(acfFields).length}`)

      return {
        success: true,
        data: jsonData,
        generated_json: jsonData
      }

    } catch (error) {
      console.error('❌ Erro na conversão:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na conversão'
      }
    }
  }

  // Extrai título do texto
  private extractTitle(lines: string[]): string {
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine.length > 10 && trimmedLine.length < 100) {
        // Remove caracteres especiais do início
        const cleanLine = trimmedLine.replace(/^[#*\-+>\s]*/, '')
        if (cleanLine) {
          return cleanLine
        }
      }
    }
    return `Página Criada Automaticamente - ${new Date().toLocaleDateString('pt-BR')}`
  }

  // Extrai descrição do texto
  private extractDescription(lines: string[]): string {
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine.length > 50 && trimmedLine.length < 200) {
        return trimmedLine
      }
    }
    return 'Conteúdo gerado automaticamente pelo Pressel Automation.'
  }

  // Extrai campos ACF baseado no modelo
  private async extractACFFields(
    textContent: string,
    pageModel: string,
    customSettings?: any
  ): Promise<Record<string, any>> {
    const fields: Record<string, any> = {}

    // Campos padrão para todos os modelos
    fields.hero_description = this.extractDescription(textContent.split('\n'))
    fields.texto_usuario = 'Você permanecerá no mesmo site'

    // Campos específicos por modelo
    switch (pageModel) {
      case 'modelo_v1':
        return { ...fields, ...this.extractModeloV1Fields(textContent, customSettings) }
      case 'modelo_v2':
        return { ...fields, ...this.extractModeloV2Fields(textContent, customSettings) }
      case 'modelo_v3':
        return { ...fields, ...this.extractModeloV3Fields(textContent, customSettings) }
      case 'modelo_v4':
        return { ...fields, ...this.extractModeloV4Fields(textContent, customSettings) }
      case 'modelo_v5':
        return { ...fields, ...this.extractModeloV5Fields(textContent, customSettings) }
      default:
        return { ...fields, ...this.extractModeloV1Fields(textContent, customSettings) }
    }
  }

  // Extrai campos específicos do Modelo V1
  private extractModeloV1Fields(textContent: string, customSettings?: any): Record<string, any> {
    const fields: Record<string, any> = {}

    // Campos de botão - DETECÇÃO INTELIGENTE + CONFIGURAÇÕES PERSONALIZADAS
    fields.botao_tipo_selecao = customSettings?.button_type || this.detectButtonType(textContent)
    fields.titulo_da_secao = this.extractButtonSectionTitle(textContent)
    fields.cor_botao = customSettings?.button_color || this.detectButtonColor(textContent)

    // Extrair botões com links reais + CONFIGURAÇÕES PERSONALIZADAS
    const buttons = this.extractButtonsWithLinks(textContent)
    fields.texto_botao_p1 = buttons[0]?.text || 'VER MAIS'
    fields.link_botao_p1 = customSettings?.button_1_url || buttons[0]?.url || ''
    fields.texto_botao_p2 = buttons[1]?.text || 'SAIBA MAIS'
    fields.link_botao_p2 = customSettings?.button_2_url || buttons[1]?.url || ''
    fields.texto_botao_p3 = buttons[2]?.text || 'ACESSAR'
    fields.link_botao_p3 = customSettings?.button_3_url || buttons[2]?.url || ''

    // Campos de conteúdo - EXTRAÇÃO INTELIGENTE
    fields.titulo_h2_ = this.extractH2Title(textContent)
    fields.info_content = this.extractMainContent(textContent)
    fields.titulo_h2_02 = this.extractSecondaryH2Title(textContent)
    fields.info_content_2 = this.extractSecondaryContent(textContent)

    // Campos de benefícios - EXTRAÇÃO INTELIGENTE
    const benefits = this.extractBenefitsFromText(textContent)
    fields.titulo_beneficios = benefits.title || 'Principais Benefícios'
    fields.titulo_beneficios_1 = benefits.items[0]?.title || 'Benefício 1'
    fields._beneficio_text_1 = benefits.items[0]?.description || 'Benefício personalizado para sua necessidade'
    fields.titulo_beneficios_2 = benefits.items[1]?.title || 'Benefício 2'
    fields._beneficio_text_2 = benefits.items[1]?.description || 'Solução completa e integrada'
    fields.titulo_beneficios_3 = benefits.items[2]?.title || 'Benefício 3'
    fields._beneficio_text_3 = benefits.items[2]?.description || 'Suporte especializado disponível'
    fields.titulo_beneficios_4 = benefits.items[3]?.title || 'Benefício 4'
    fields._beneficio_text_4 = benefits.items[3]?.description || 'Resultados comprovados e garantidos'

    // Campos de FAQ - EXTRAÇÃO INTELIGENTE
    const faq = this.extractFAQFromText(textContent)
    fields.titulo_faq = faq.title || 'Perguntas Frequentes'
    fields.pergunta_1 = faq.items[0]?.question || 'Como funciona este processo?'
    fields.resposta_1 = faq.items[0]?.answer || 'O processo é simples e automatizado.'
    fields.pergunta_2 = faq.items[1]?.question || 'Qual é o prazo para entrega?'
    fields.resposta_2 = faq.items[1]?.answer || 'O prazo varia conforme a demanda.'
    fields.pergunta_3 = faq.items[2]?.question || 'Existe garantia de satisfação?'
    fields.resposta_3 = faq.items[2]?.answer || 'Sim, oferecemos garantia total.'

    // Campo de aviso
    fields.aviso = 'aviso_pt'

    return fields
  }

  // Extrai campos específicos do Modelo V2
  private extractModeloV2Fields(textContent: string, customSettings?: any): Record<string, any> {
    return {
      hero_title: this.extractTitle(textContent.split('\n')),
      hero_description: this.extractDescription(textContent.split('\n')),
      cta_title: 'Get Started Today',
      cta_button_text: 'Start Now',
      cta_button_url: customSettings?.button_1_url || '',
      benefits_title: 'Why Choose Our Solution?',
      benefit_1_title: 'Professional Quality',
      benefit_1_description: 'High-quality results guaranteed',
      faq_title: 'Frequently Asked Questions',
      faq_1_question: 'How does it work?',
      faq_1_answer: 'Our process is simple and automated.',
      disclaimer: 'disclaimer_en'
    }
  }

  // Extrai campos específicos do Modelo V3
  private extractModeloV3Fields(textContent: string, customSettings?: any): Record<string, any> {
    return {
      main_title: this.extractTitle(textContent.split('\n')),
      subtitle: this.extractDescription(textContent.split('\n')),
      description: this.extractMainContent(textContent),
      single_button_text: 'Get Started',
      single_button_url: customSettings?.button_1_url || '',
      features_title: 'Key Features',
      feature_1: 'Simple and Easy',
      feature_2: 'Professional Results',
      feature_3: '24/7 Support'
    }
  }

  // Extrai campos específicos do Modelo V4
  private extractModeloV4Fields(textContent: string, customSettings?: any): Record<string, any> {
    return {
      product_title: this.extractTitle(textContent.split('\n')),
      product_description: this.extractMainContent(textContent),
      price: '$99.99',
      buy_button_text: 'Buy Now',
      buy_button_url: customSettings?.button_1_url || '',
      product_features: this.extractMainContent(textContent),
      testimonials_title: 'Customer Reviews',
      testimonial_1: 'Great product, highly recommended!',
      testimonial_2: 'Excellent quality and fast delivery.',
      guarantee_text: '30-day money-back guarantee'
    }
  }

  // Extrai campos específicos do Modelo V5
  private extractModeloV5Fields(textContent: string, customSettings?: any): Record<string, any> {
    return {
      offer_title: this.extractTitle(textContent.split('\n')),
      offer_description: this.extractMainContent(textContent),
      affiliate_button_text: 'Learn More',
      affiliate_button_url: customSettings?.button_1_url || '',
      bonus_title: 'Exclusive Bonuses',
      bonus_1: 'Bonus 1: Extra Value',
      bonus_2: 'Bonus 2: Special Offer',
      bonus_3: 'Bonus 3: Limited Time',
      urgency_text: 'Limited Time Offer',
      social_proof: 'Join thousands of satisfied customers'
    }
  }

  // DETECÇÃO INTELIGENTE: Tipo de botão
  private detectButtonType(textContent: string): string {
    const textLower = textContent.toLowerCase()

    // Detectar se é rewarded (av-rewarded)
    if (textLower.includes('rewarded') || textLower.includes('av-rewarded') || textLower.includes('recompensa')) {
      return 'rewarded'
    }

    // Detectar se é popup
    if (textLower.includes('popup') || textLower.includes('modal')) {
      return 'popup'
    }

    // Padrão é normal
    return 'normal'
  }

  // DETECÇÃO INTELIGENTE: Cor do botão
  private detectButtonColor(textContent: string): string {
    const textLower = textContent.toLowerCase()

    // Detectar cores por palavras-chave
    if (textLower.includes('vermelho') || textLower.includes('red')) return '#FF0000'
    if (textLower.includes('azul') || textLower.includes('blue')) return '#2352AE'
    if (textLower.includes('verde') || textLower.includes('green')) return '#00AA00'
    if (textLower.includes('laranja') || textLower.includes('orange')) return '#FF6600'
    if (textLower.includes('roxo') || textLower.includes('purple')) return '#6600CC'

    // Detectar códigos hexadecimais no texto
    const hexMatch = textContent.match(/#[0-9A-Fa-f]{6}/)
    if (hexMatch) return hexMatch[0]

    // Cor padrão
    return '#2352AE'
  }

  // DETECÇÃO INTELIGENTE: Botões com links
  private extractButtonsWithLinks(textContent: string): Array<{ text: string; url: string }> {
    const buttons: Array<{ text: string; url: string }> = []

    // Padrões para detectar botões
    const patterns = [
      /\[([^\]]+)\]\(([^)]+)\)/g,  // [Texto](URL)
      /👉\s*\[([^\]]+)\]/g,        // 👉 [Texto]
      /\[VER\s+([^\]]+)\]/gi,      // [VER VAGAS]
      /\[CONHECER\s+([^\]]+)\]/gi, // [CONHECER MAIS]
      /\[ACESSAR\s+([^\]]+)\]/gi,  // [ACESSAR]
    ]

    for (const pattern of patterns) {
      const matches = textContent.matchAll(pattern)
      for (const match of matches) {
        if (match.length >= 3) {
          buttons.push({
            text: match[1].trim(),
            url: match[2]?.trim() || ''
          })
        } else if (match.length >= 2) {
          buttons.push({
            text: match[1].trim(),
            url: ''
          })
        }
      }
    }

    // Se não encontrou botões específicos, usar padrões genéricos
    if (buttons.length === 0) {
      return [
        { text: 'VER MAIS', url: '' },
        { text: 'SAIBA MAIS', url: '' },
        { text: 'ACESSAR', url: '' }
      ]
    }

    return buttons
  }

  // DETECÇÃO INTELIGENTE: Benefícios do texto
  private extractBenefitsFromText(textContent: string): { title: string; items: Array<{ title: string; description: string }> } {
    const benefits = {
      title: 'Principais Benefícios',
      items: [] as Array<{ title: string; description: string }>
    }

    const lines = textContent.split('\n')

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Detectar título dos benefícios
      if (trimmedLine.toLowerCase().includes('benefício') || 
          trimmedLine.toLowerCase().includes('vantagem') ||
          trimmedLine.toLowerCase().includes('por que')) {
        benefits.title = trimmedLine
        continue
      }

      // Detectar benefícios com ✨ ou •
      if (trimmedLine.includes('✨') || trimmedLine.includes('•') || trimmedLine.includes('-')) {
        const cleanLine = trimmedLine.replace(/^[✨•\-\s]+/, '')
        if (cleanLine.length > 10) {
          benefits.items.push({
            title: this.extractTitleFromLine(cleanLine),
            description: cleanLine
          })
        }
      }
    }

    // Garantir pelo menos 4 benefícios
    while (benefits.items.length < 4) {
      const index = benefits.items.length
      benefits.items.push({
        title: `Benefício ${index + 1}`,
        description: 'Benefício personalizado para sua necessidade'
      })
    }

    return benefits
  }

  // DETECÇÃO INTELIGENTE: FAQ do texto
  private extractFAQFromText(textContent: string): { title: string; items: Array<{ question: string; answer: string }> } {
    const faq = {
      title: 'Perguntas Frequentes',
      items: [] as Array<{ question: string; answer: string }>
    }

    const lines = textContent.split('\n')
    let currentQuestion = ''
    let currentAnswer = ''

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Detectar título do FAQ
      if (trimmedLine.toLowerCase().includes('pergunta') || 
          trimmedLine.toLowerCase().includes('faq') ||
          trimmedLine.toLowerCase().includes('dúvida')) {
        faq.title = trimmedLine
        continue
      }

      // Detectar perguntas numeradas
      const questionMatch = trimmedLine.match(/^(\d+)\.\s*(.+)/)
      if (questionMatch) {
        if (currentQuestion && currentAnswer) {
          faq.items.push({
            question: currentQuestion,
            answer: currentAnswer
          })
        }
        currentQuestion = questionMatch[2]
        currentAnswer = ''
      } else if (currentQuestion && trimmedLine.length > 10) {
        currentAnswer += (currentAnswer ? ' ' : '') + trimmedLine
      }
    }

    // Adicionar última pergunta se existir
    if (currentQuestion && currentAnswer) {
      faq.items.push({
        question: currentQuestion,
        answer: currentAnswer
      })
    }

    // Garantir pelo menos 3 perguntas
    while (faq.items.length < 3) {
      const index = faq.items.length
      faq.items.push({
        question: `Pergunta ${index + 1}?`,
        answer: `Resposta ${index + 1}.`
      })
    }

    return faq
  }

  // Extrai título de uma linha
  private extractTitleFromLine(line: string): string {
    const words = line.split(' ')
    if (words.length >= 3) {
      return words.slice(0, 3).join(' ')
    }
    return line
  }

  // Métodos auxiliares para extração de conteúdo
  private extractButtonSectionTitle(textContent: string): string {
    const lines = textContent.split('\n')
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine.includes('👉') || trimmedLine.includes('[VER')) {
        return 'Acesse Agora'
      }
    }
    return 'Acesse Agora'
  }

  private extractH2Title(textContent: string): string {
    const lines = textContent.split('\n')
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine.length > 20 && trimmedLine.length < 80) {
        return trimmedLine
      }
    }
    return 'Por que Escolher Nossa Solução'
  }

  private extractMainContent(textContent: string): string {
    const paragraphs: string[] = []
    const lines = textContent.split('\n')

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine.length > 50) {
        paragraphs.push(`<p>${trimmedLine}</p>`)
        if (paragraphs.length >= 3) break
      }
    }

    return paragraphs.join('')
  }

  private extractSecondaryH2Title(textContent: string): string {
    return 'Como Funciona'
  }

  private extractSecondaryContent(textContent: string): string {
    return '<p>Descrição adicional sobre o produto ou serviço.</p>'
  }

  // Obtém template baseado no modelo
  private getTemplateByModel(model: string): string {
    const templates: Record<string, string> = {
      'modelo_v1': 'pressel-oficial.php',
      'modelo_v2': 'presell-enus.php',
      'modelo_v3': 'presell-minimal.php',
      'modelo_v4': 'presell-ecommerce.php',
      'modelo_v5': 'presell-affiliate.php'
    }
    return templates[model] || 'pressel-oficial.php'
  }

  // Gera dados de SEO
  private generateSEOData(title: string, description: string) {
    return {
      meta_title: title,
      meta_description: description,
      focus_keyword: this.extractFocusKeyword(title)
    }
  }

  // Extrai palavra-chave do título
  private extractFocusKeyword(title: string): string {
    const words = title.toLowerCase().split(' ')
    const keywords = words.filter(word => 
      word.length > 3 && 
      !['para', 'com', 'como', 'que', 'uma', 'dos', 'das'].includes(word)
    )
    return keywords.slice(0, 3).join(' ')
  }

  // Cria página no WordPress via API
  async createPageInWordPress(
    baseUrl: string,
    username: string,
    password: string,
    pageData: PresselPageData
  ): Promise<PresselConversionResult> {
    try {
      console.log('🚀 Criando página no WordPress...')
      console.log(`📋 Título: ${pageData.page_title}`)
      console.log(`🎨 Modelo: ${pageData.page_model}`)

      // Primeiro, cria o post
      const postResponse = await fetch('/api/wordpress/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${baseUrl}/wp-json/wp/v2/pages`,
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: pageData.page_title,
            status: pageData.post_status,
            slug: pageData.page_slug,
            template: pageData.page_template
          })
        })
      })

      if (!postResponse.ok) {
        throw new Error(`Erro ao criar post: ${postResponse.status}`)
      }

      const postData = await postResponse.json()
      const postId = postData.id

      console.log(`✅ Post criado com ID: ${postId}`)

      // Agora preenche os campos ACF
      await this.populateACFFields(baseUrl, username, password, postId, pageData.acf_fields)

      // Configura SEO se disponível
      if (pageData.seo) {
        await this.setupSEO(baseUrl, username, password, postId, pageData.seo)
      }

      // Define imagem destacada se disponível
      if (pageData.featured_image) {
        await this.setFeaturedImage(baseUrl, username, password, postId, pageData.featured_image)
      }

      console.log('✅ Página criada com sucesso!')

      return {
        success: true,
        data: {
          ...pageData,
          post_id: postId,
          edit_link: `${baseUrl}/wp-admin/post.php?post=${postId}&action=edit`,
          view_link: `${baseUrl}/?p=${postId}`
        }
      }

    } catch (error) {
      console.error('❌ Erro ao criar página:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  // Preenche campos ACF
  private async populateACFFields(
    baseUrl: string,
    username: string,
    password: string,
    postId: number,
    acfFields: Record<string, any>
  ): Promise<void> {
    console.log('🔄 Preenchendo campos ACF...')

    for (const [fieldName, fieldValue] of Object.entries(acfFields)) {
      if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
        try {
          const response = await fetch('/api/wordpress/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: `${baseUrl}/wp-json/acf/v3/pages/${postId}/fields/${fieldName}`,
              method: 'POST',
              headers: {
                'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ value: fieldValue })
            })
          })

          if (response.ok) {
            console.log(`✅ Campo ACF '${fieldName}' preenchido`)
          } else {
            console.warn(`⚠️ Falha ao preencher campo '${fieldName}': ${response.status}`)
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao preencher campo '${fieldName}':`, error)
        }
      }
    }
  }

  // Configura SEO
  private async setupSEO(
    baseUrl: string,
    username: string,
    password: string,
    postId: number,
    seoData: any
  ): Promise<void> {
    console.log('🔄 Configurando SEO...')

    // Yoast SEO
    try {
      await fetch('/api/wordpress/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${baseUrl}/wp-json/wp/v2/pages/${postId}`,
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            meta: {
              _yoast_wpseo_title: seoData.meta_title,
              _yoast_wpseo_metadesc: seoData.meta_description,
              _yoast_wpseo_focuskw: seoData.focus_keyword
            }
          })
        })
      })
      console.log('✅ SEO configurado (Yoast)')
    } catch (error) {
      console.warn('⚠️ Erro ao configurar SEO:', error)
    }
  }

  // Define imagem destacada
  private async setFeaturedImage(
    baseUrl: string,
    username: string,
    password: string,
    postId: number,
    imageUrl: string
  ): Promise<void> {
    console.log('🔄 Definindo imagem destacada...')

    try {
      // Primeiro, faz upload da imagem
      const uploadResponse = await fetch('/api/wordpress/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${baseUrl}/wp-json/wp/v2/media`,
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            source_url: imageUrl
          })
        })
      })

      if (uploadResponse.ok) {
        const mediaData = await uploadResponse.json()
        const mediaId = mediaData.id

        // Define como imagem destacada
        await fetch('/api/wordpress/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${baseUrl}/wp-json/wp/v2/pages/${postId}`,
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              featured_media: mediaId
            })
          })
        })

        console.log('✅ Imagem destacada definida')
      }
    } catch (error) {
      console.warn('⚠️ Erro ao definir imagem destacada:', error)
    }
  }

  // Obtém todos os modelos
  getModels(): PresselModel[] {
    return this.models
  }

  // Obtém modelo por ID
  getModelById(id: string): PresselModel | undefined {
    return this.models.find(model => model.id === id)
  }

  // Valida campos obrigatórios
  validateRequiredFields(fields: Record<string, any>, modelId: string): { valid: boolean; missing: string[] } {
    const model = this.getModelById(modelId)
    if (!model) {
      return { valid: false, missing: ['Modelo não encontrado'] }
    }

    const requiredFields = model.acf_fields
      .filter(field => field.required)
      .map(field => field.name)

    const missing = requiredFields.filter(fieldName => 
      !fields[fieldName] || fields[fieldName] === ''
    )

    return {
      valid: missing.length === 0,
      missing
    }
  }

  // Detecta modelo automaticamente
  detectModelFromFields(fields: Record<string, any>): string {
    // Se tem campos específicos do modelo brasileiro
    if (fields.hero_description && fields.titulo_beneficios && fields.titulo_faq) {
      return 'modelo_v1'
    }

    // Se tem campos específicos do modelo internacional
    if (fields.hero_title && fields.benefits_title && fields.faq_title) {
      return 'modelo_v2'
    }

    // Se tem campos específicos do modelo minimalista
    if (fields.main_title && fields.single_button_text) {
      return 'modelo_v3'
    }

    // Se tem campos específicos do modelo e-commerce
    if (fields.product_title && fields.price && fields.buy_button_text) {
      return 'modelo_v4'
    }

    // Se tem campos específicos do modelo afiliado
    if (fields.offer_title && fields.affiliate_button_text) {
      return 'modelo_v5'
    }

    // Fallback para modelo padrão
    return 'modelo_v1'
  }
}