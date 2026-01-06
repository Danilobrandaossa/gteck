/**
 * 🧠 AI ORCHESTRATOR - Motor de Inteligência do CMS
 * 
 * Sistema inteligente que escolhe o modelo mais adequado:
 * - GPT-4o Mini → tarefas rápidas, baixo custo
 * - Gemini 2.0 Flash → tarefas complexas, multimodalidade
 */

export interface AIRequest {
  type: 'content_generation' | 'editing_review' | 'multimodal' | 'cms_integration' | 'tool_use' | 'wordpress_diagnostic'
  prompt: string
  context?: any
  priority?: 'low' | 'medium' | 'high'
  multimodal?: boolean
  maxTokens?: number
  temperature?: number
}

export interface AIResponse {
  model: string
  content: string
  usage: {
    tokens: number
    cost: number
    duration: number
  }
  metadata?: any
}

export interface WordPressDiagnostic {
  data_execucao: string
  resultado: {
    seo: SEOAnalysis
    compliance: ComplianceAnalysis
    seguranca: SecurityAnalysis
    links_quebrados: BrokenLink[]
    anuncios_sensiveis: SensitiveAdsAnalysis
    usabilidade: UsabilityAnalysis
  }
  acoes_corrigidas: boolean
  feedback_usuario?: string
}

export interface SEOAnalysis {
  meta_tags: boolean
  titles: boolean
  headings: boolean
  performance: number
  indexacao: boolean
  score: number
}

export interface ComplianceAnalysis {
  termos: boolean
  politica_privacidade: boolean
  contato: boolean
  sobre: boolean
  score: number
}

export interface SecurityAnalysis {
  ssl: boolean
  headers: boolean
  plugins_vulneraveis: string[]
  score: number
}

export interface BrokenLink {
  url: string
  status: number
  page: string
}

export interface SensitiveAdsAnalysis {
  termos_com_anuncios: boolean
  politica_com_anuncios: boolean
  contato_com_anuncios: boolean
  score: number
}

export interface UsabilityAnalysis {
  acessibilidade: boolean
  design_responsivo: boolean
  ux_score: number
}

class AIOrchestrator {
  private memory: Map<string, any> = new Map()
  private diagnosticHistory: WordPressDiagnostic[] = []

  /**
   * 🎯 Escolhe o modelo mais adequado para a tarefa
   */
  private selectModel(request: AIRequest): 'openai' | 'gemini' {
    // Gemini para tarefas complexas e multimodais
    if (request.type === 'multimodal' || 
        request.type === 'tool_use' || 
        request.type === 'wordpress_diagnostic' ||
        request.priority === 'high' ||
        request.multimodal) {
      return 'gemini'
    }

    // GPT-4o Mini para tarefas rápidas e de baixo custo
    if (request.type === 'content_generation' || 
        request.type === 'editing_review' ||
        request.priority === 'low' ||
        request.priority === 'medium') {
      return 'openai'
    }

    // Default para OpenAI
    return 'openai'
  }

  /**
   * 🚀 Processa solicitação com modelo adequado
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const model = this.selectModel(request)
    const startTime = Date.now()

    try {
      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: this.buildPrompt(request),
          max_tokens: request.maxTokens || (model === 'openai' ? 1000 : 2000),
          temperature: request.temperature || 0.7
        })
      })

      const data = await response.json()
      const duration = Date.now() - startTime

      if (!data.success) {
        throw new Error(data.error || 'Erro na API')
      }

      // Salvar na memória para aprendizado progressivo
      this.memory.set(`request_${Date.now()}`, {
        request,
        response: data,
        model,
        duration
      })

      return {
        model: data.model || model,
        content: data.content,
        usage: {
          tokens: data.usage?.total_tokens || 0,
          cost: this.calculateCost(model, data.usage?.total_tokens || 0),
          duration
        },
        metadata: data
      }

    } catch (error) {
      console.error('Erro no AI Orchestrator:', error)
      throw error
    }
  }

  /**
   * 📝 Constrói prompt otimizado baseado no tipo de solicitação
   */
  private buildPrompt(request: AIRequest): string {
    const basePrompt = request.prompt

    switch (request.type) {
      case 'content_generation':
        return `Como especialista em criação de conteúdo, ${basePrompt}. 
                Foque em SEO, engajamento e conversão. Use tom profissional mas acessível.`

      case 'editing_review':
        return `Como editor experiente, revise e melhore este conteúdo: ${basePrompt}. 
                Corrija gramática, melhore clareza e otimize para SEO.`

      case 'multimodal':
        return `Analise este conteúdo multimodal: ${basePrompt}. 
                Forneça insights detalhados sobre texto, imagem, áudio ou vídeo.`

      case 'cms_integration':
        return `Com base nos dados do CMS: ${JSON.stringify(request.context)}, 
                ${basePrompt}. Use informações contextuais para personalizar a resposta.`

      case 'tool_use':
        return `Execute esta tarefa complexa: ${basePrompt}. 
                Use ferramentas externas se necessário e forneça análise detalhada.`

      case 'wordpress_diagnostic':
        return this.buildWordPressDiagnosticPrompt(request)

      default:
        return basePrompt
    }
  }

  /**
   * 🔍 Constrói prompt especializado para diagnóstico WordPress
   */
  private buildWordPressDiagnosticPrompt(request: AIRequest): string {
    return `Como especialista em WordPress e SEO, execute um diagnóstico completo do site.

    ANALISE ESTAS ÁREAS:

    1. **SEO (Search Engine Optimization)**:
       - Meta tags (title, description, keywords)
       - Estrutura de headings (H1, H2, H3)
       - Performance de carregamento
       - Indexação e sitemap
       - Conteúdo duplicado

    2. **COMPLIANCE (Conformidade Legal)**:
       - Página de Termos de Uso
       - Política de Privacidade
       - Página de Contato
       - Página Sobre/Quem Somos
       - Cookies e LGPD

    3. **SEGURANÇA**:
       - Certificado SSL
       - Headers de segurança
       - Plugins vulneráveis
       - Senhas e autenticação
       - Backup e atualizações

    4. **LINKS QUEBRADOS**:
       - Mapear todos os 404
       - Links externos inativos
       - Redirecionamentos
       - Estrutura de URLs

    5. **ANÚNCIOS SENSÍVEIS**:
       - Detectar anúncios em páginas institucionais
       - Termos de Uso com anúncios
       - Política de Privacidade com anúncios
       - Página de Contato com anúncios

    6. **USABILIDADE**:
       - Acessibilidade (WCAG)
       - Design responsivo
       - UX e navegação
       - Velocidade de carregamento

    Forneça um relatório detalhado com:
    - Score de 0-100 para cada área
    - Lista de problemas encontrados
    - Sugestões de correção
    - Prioridade das ações

    Site para análise: ${request.prompt}
    Contexto adicional: ${JSON.stringify(request.context || {})}`
  }

  /**
   * 💰 Calcula custo baseado no modelo e tokens
   */
  private calculateCost(model: string, tokens: number): number {
    const costs = {
      openai: 0.00015, // $0.15 por 1K tokens (GPT-4o-mini)
      gemini: 0.000075 // $0.075 por 1K tokens (Gemini 2.0 Flash)
    }
    
    return (tokens / 1000) * (costs[model as keyof typeof costs] || 0.0001)
  }

  /**
   * 🧠 Salva resultado de diagnóstico para aprendizado progressivo
   */
  async saveDiagnosticResult(diagnostic: WordPressDiagnostic): Promise<void> {
    this.diagnosticHistory.push(diagnostic)
    
    // Salvar no banco de dados do CMS
    try {
      await fetch('/api/wordpress/diagnostic/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(diagnostic)
      })
    } catch (error) {
      console.error('Erro ao salvar diagnóstico:', error)
    }
  }

  /**
   * 📊 Obtém histórico de diagnósticos
   */
  getDiagnosticHistory(): WordPressDiagnostic[] {
    return this.diagnosticHistory
  }

  /**
   * 🎯 Gera insights baseados no histórico
   */
  async generateInsights(): Promise<string> {
    if (this.diagnosticHistory.length === 0) {
      return "Nenhum histórico de diagnóstico disponível."
    }

    const request: AIRequest = {
      type: 'cms_integration',
      prompt: 'Analise o histórico de diagnósticos e forneça insights sobre melhorias contínuas do site.',
      context: {
        diagnosticHistory: this.diagnosticHistory,
        totalDiagnostics: this.diagnosticHistory.length,
        lastDiagnostic: this.diagnosticHistory[this.diagnosticHistory.length - 1]
      },
      priority: 'high'
    }

    const response = await this.processRequest(request)
    return response.content
  }

  /**
   * 🔄 Aprende com feedback do usuário
   */
  learnFromFeedback(diagnosticId: string, feedback: string, actionsCorrected: boolean): void {
    const diagnostic = this.diagnosticHistory.find(d => d.data_execucao === diagnosticId)
    if (diagnostic) {
      diagnostic.feedback_usuario = feedback
      diagnostic.acoes_corrigidas = actionsCorrected
    }
  }
}

export const aiOrchestrator = new AIOrchestrator()








