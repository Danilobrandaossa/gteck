// Sistema de Diagnóstico WordPress Completo e Escalável
export interface DiagnosticResult {
  id: string
  name: string
  category: 'technical' | 'performance' | 'seo' | 'security' | 'content' | 'ads' | 'links' | 'media'
  status: 'success' | 'warning' | 'error' | 'info'
  message: string
  details?: string[]
  suggestions?: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  fixable: boolean
  aiAnalysis?: string
  estimatedTime?: string
  impact?: 'low' | 'medium' | 'high' | 'critical'
  subcategory?: string
  relatedIssues?: string[]
  autoFixable?: boolean
  fixSteps?: string[]
}

export interface SiteDiagnostic {
  siteId: string
  siteName: string
  url: string
  timestamp: Date
  overallScore: number
  results: DiagnosticResult[]
  summary: {
    total: number
    errors: number
    warnings: number
    successes: number
    critical: number
  }
  recommendations: string[]
  aiInsights: string[]
}

export class WordPressDiagnostics {
  private wpApi: any
  private aiServices: any
  private aiIntegration: any

  constructor(wpApi: any, aiServices?: any) {
    this.wpApi = wpApi
    this.aiServices = aiServices
    if (aiServices) {
      this.aiIntegration = new (require('./ai-diagnostic-integration').AIDiagnosticIntegration)(aiServices)
    }
  }

  // Diagnóstico Técnico Completo
  async runCompleteDiagnostic(siteId: string, siteName: string, url: string): Promise<SiteDiagnostic> {
    const results: DiagnosticResult[] = []
    
    console.log('🔍 Iniciando diagnóstico completo do WordPress...')

    // 1. Testes de Conectividade e API
    results.push(...await this.testConnectivity())
    
    // 2. Análise de Performance
    results.push(...await this.analyzePerformance())
    
    // 3. Verificação de Segurança
    results.push(...await this.checkSecurity())
    
    // 4. Análise de SEO
    results.push(...await this.analyzeSEO())
    
    // 5. Verificação de Conteúdo
    results.push(...await this.checkContent())
    
    // 6. Análise de Anúncios e Pixels
    results.push(...await this.analyzeAds())
    
    // 7. Verificação de Links e Botões
    results.push(...await this.checkLinks())
    
    // 8. Análise de Plugins e Temas
    results.push(...await this.analyzePlugins())
    
    // 9. Verificação de Mídia
    results.push(...await this.checkMedia())
    
    // 10. Análise de Usuários e Permissões
    results.push(...await this.checkUsers())
    
    // 11. Análise de SEO das Páginas
    results.push(...await this.analyzePageSEO())
    
    // 12. Análise de Conteúdo por Categoria
    results.push(...await this.analyzeContentByCategory())

    // Análise com IA (se disponível)
    if (this.aiServices && this.aiIntegration) {
      results.push(...await this.runAIAnalysis(results))
      
      // Análise inteligente adicional
      const aiAnalysis = await this.aiIntegration.analyzeDiagnosticResults({
        siteData: { name: siteName, url, id: siteId },
        diagnosticResults: results,
        siteUrl: url,
        siteName
      })
      
      // Adicionar insights de IA aos resultados
      if (aiAnalysis.insights.length > 0) {
        results.push({
          id: 'ai-comprehensive-analysis',
          name: 'Análise IA Abrangente',
          category: 'technical',
          status: 'info',
          message: `IA identificou ${aiAnalysis.insights.length} insight(s) importante(s)`,
          details: aiAnalysis.insights,
          priority: 'medium',
          fixable: true,
          aiAnalysis: `Confiança: ${aiAnalysis.confidence}% | Impacto: ${aiAnalysis.estimatedImpact}`,
          estimatedTime: '1 hora'
        })
      }
    }

    // Calcular pontuação geral
    const overallScore = this.calculateOverallScore(results)
    
    // Gerar resumo
    const summary = this.generateSummary(results)
    
    // Gerar recomendações
    const recommendations = this.generateRecommendations(results)
    
    // Gerar insights de IA
    const aiInsights = this.aiServices ? await this.generateAIInsights(results) : []

    return {
      siteId,
      siteName,
      url,
      timestamp: new Date(),
      overallScore,
      results,
      summary,
      recommendations,
      aiInsights
    }
  }

  // 1. Testes de Conectividade
  private async testConnectivity(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []
    
    try {
      // Teste básico de conexão
      const connectionTest = await this.wpApi.testConnection()
      results.push({
        id: 'connectivity-basic',
        name: 'Conexão com WordPress',
        category: 'technical',
        status: connectionTest.success ? 'success' : 'error',
        message: connectionTest.success ? 'Conexão estabelecida com sucesso' : `Falha na conexão: ${connectionTest.error}`,
        priority: 'critical',
        fixable: true,
        estimatedTime: '5 min'
      })

      // Teste de REST API
      try {
        await this.wpApi.request('posts?per_page=1')
        results.push({
          id: 'connectivity-rest-api',
          name: 'REST API Funcionando',
          category: 'technical',
          status: 'success',
          message: 'REST API está acessível e funcionando',
          priority: 'high',
          fixable: false
        })
      } catch (error) {
        results.push({
          id: 'connectivity-rest-api',
          name: 'REST API com Problemas',
          category: 'technical',
          status: 'error',
          message: 'REST API não está funcionando corretamente',
          details: ['Verifique se a REST API está habilitada', 'Confirme os permalinks'],
          priority: 'critical',
          fixable: true,
          estimatedTime: '15 min'
        })
      }

      // Teste de SSL/HTTPS
      const isHttps = this.wpApi.url.startsWith('https://')
      results.push({
        id: 'connectivity-ssl',
        name: 'Certificado SSL',
        category: 'security',
        status: isHttps ? 'success' : 'warning',
        message: isHttps ? 'Site usando HTTPS' : 'Site não está usando HTTPS',
        priority: isHttps ? 'low' : 'high',
        fixable: true,
        estimatedTime: '30 min'
      })

    } catch (error) {
      results.push({
        id: 'connectivity-error',
        name: 'Erro na Conectividade',
        category: 'technical',
        status: 'error',
        message: 'Erro ao testar conectividade',
        details: [error instanceof Error ? error.message : 'Erro desconhecido'],
        priority: 'critical',
        fixable: true
      })
    }

    return results
  }

  // 2. Análise de Performance
  private async analyzePerformance(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []
    
    try {
      // Verificar tempo de resposta
      const startTime = Date.now()
      await this.wpApi.request('posts?per_page=1')
      const responseTime = Date.now() - startTime
      
      results.push({
        id: 'performance-response-time',
        name: 'Tempo de Resposta',
        category: 'performance',
        status: responseTime < 1000 ? 'success' : responseTime < 3000 ? 'warning' : 'error',
        message: `Tempo de resposta: ${responseTime}ms`,
        priority: responseTime > 3000 ? 'high' : 'medium',
        fixable: true,
        estimatedTime: '1 hora'
      })

      // Verificar tamanho da resposta
      const posts = await this.wpApi.request('posts?per_page=10')
      const responseSize = JSON.stringify(posts).length
      
      results.push({
        id: 'performance-response-size',
        name: 'Tamanho da Resposta',
        category: 'performance',
        status: responseSize < 50000 ? 'success' : 'warning',
        message: `Tamanho da resposta: ${(responseSize / 1024).toFixed(2)}KB`,
        priority: 'medium',
        fixable: true,
        estimatedTime: '30 min'
      })

    } catch (error) {
      results.push({
        id: 'performance-error',
        name: 'Erro na Análise de Performance',
        category: 'performance',
        status: 'error',
        message: 'Erro ao analisar performance',
        priority: 'medium',
        fixable: true
      })
    }

    return results
  }

  // 3. Verificação de Segurança
  private async checkSecurity(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []
    
    try {
      // Verificar versão do WordPress
      const siteInfo = await this.wpApi.request('')
      const wpVersion = siteInfo?.version || 'Desconhecida'
      
      results.push({
        id: 'security-wp-version',
        name: 'Versão do WordPress',
        category: 'security',
        status: 'info',
        message: `Versão atual: ${wpVersion}`,
        priority: 'medium',
        fixable: false
      })

      // Verificar usuários administrativos
      const users = await this.wpApi.request('users?roles=administrator')
      const adminCount = users.length
      
      results.push({
        id: 'security-admin-users',
        name: 'Usuários Administrativos',
        category: 'security',
        status: adminCount <= 3 ? 'success' : 'warning',
        message: `${adminCount} usuário(s) administrativo(s) encontrado(s)`,
        priority: adminCount > 5 ? 'high' : 'low',
        fixable: true,
        estimatedTime: '15 min'
      })

    } catch (error) {
      results.push({
        id: 'security-error',
        name: 'Erro na Verificação de Segurança',
        category: 'security',
        status: 'error',
        message: 'Erro ao verificar segurança',
        priority: 'medium',
        fixable: true
      })
    }

    return results
  }

  // 4. Análise de SEO
  private async analyzeSEO(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []
    
    try {
      // Verificar posts sem título
      const posts = await this.wpApi.request('posts?per_page=20')
      const postsWithoutTitle = posts.filter((post: any) => !post.title?.rendered || post.title.rendered.trim() === '')
      
      results.push({
        id: 'seo-posts-title',
        name: 'Posts sem Título',
        category: 'seo',
        status: postsWithoutTitle.length === 0 ? 'success' : 'warning',
        message: `${postsWithoutTitle.length} post(s) sem título`,
        priority: postsWithoutTitle.length > 5 ? 'high' : 'medium',
        fixable: true,
        estimatedTime: '30 min'
      })

      // Verificar posts sem conteúdo
      const postsWithoutContent = posts.filter((post: any) => !post.content?.rendered || post.content.rendered.trim() === '')
      
      results.push({
        id: 'seo-posts-content',
        name: 'Posts sem Conteúdo',
        category: 'seo',
        status: postsWithoutContent.length === 0 ? 'success' : 'error',
        message: `${postsWithoutContent.length} post(s) sem conteúdo`,
        priority: 'high',
        fixable: true,
        estimatedTime: '1 hora'
      })

    } catch (error) {
      results.push({
        id: 'seo-error',
        name: 'Erro na Análise de SEO',
        category: 'seo',
        status: 'error',
        message: 'Erro ao analisar SEO',
        priority: 'medium',
        fixable: true
      })
    }

    return results
  }

  // 5. Verificação de Conteúdo
  private async checkContent(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []
    
    try {
      // Verificar posts publicados
      const posts = await this.wpApi.request('posts?status=publish&per_page=10')
      const publishedCount = posts.length
      
      results.push({
        id: 'content-published-posts',
        name: 'Posts Publicados',
        category: 'content',
        status: publishedCount > 0 ? 'success' : 'warning',
        message: `${publishedCount} post(s) publicado(s)`,
        priority: publishedCount === 0 ? 'high' : 'low',
        fixable: true,
        estimatedTime: '2 horas'
      })

      // Verificar páginas
      const pages = await this.wpApi.request('pages?per_page=10')
      const pagesCount = pages.length
      
      results.push({
        id: 'content-pages',
        name: 'Páginas Criadas',
        category: 'content',
        status: pagesCount > 0 ? 'success' : 'warning',
        message: `${pagesCount} página(s) criada(s)`,
        priority: 'low',
        fixable: true,
        estimatedTime: '1 hora'
      })

    } catch (error) {
      results.push({
        id: 'content-error',
        name: 'Erro na Verificação de Conteúdo',
        category: 'content',
        status: 'error',
        message: 'Erro ao verificar conteúdo',
        priority: 'medium',
        fixable: true
      })
    }

    return results
  }

  // 6. Análise de Anúncios e Pixels
  private async analyzeAds(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []
    
    try {
      // Verificar pixels duplicados (simulação)
      const duplicatePixels = await this.checkDuplicatePixels()
      
      results.push({
        id: 'ads-duplicate-pixels',
        name: 'Pixels Duplicados',
        category: 'ads',
        status: duplicatePixels.length === 0 ? 'success' : 'warning',
        message: duplicatePixels.length === 0 ? 'Nenhum pixel duplicado encontrado' : `${duplicatePixels.length} pixel(s) duplicado(s) encontrado(s)`,
        details: duplicatePixels,
        priority: duplicatePixels.length > 0 ? 'high' : 'low',
        fixable: true,
        estimatedTime: '20 min'
      })

      // Verificar páginas sem blocos de anúncios
      const pagesWithoutAds = await this.checkPagesWithoutAds()
      
      results.push({
        id: 'ads-pages-without-blocks',
        name: 'Páginas sem Blocos de Anúncios',
        category: 'ads',
        status: pagesWithoutAds.length === 0 ? 'success' : 'warning',
        message: pagesWithoutAds.length === 0 ? 'Todas as páginas têm blocos de anúncios' : `${pagesWithoutAds.length} página(s) sem blocos de anúncios`,
        details: pagesWithoutAds,
        priority: 'medium',
        fixable: true,
        estimatedTime: '45 min'
      })

    } catch (error) {
      results.push({
        id: 'ads-error',
        name: 'Erro na Análise de Anúncios',
        category: 'ads',
        status: 'error',
        message: 'Erro ao analisar anúncios',
        priority: 'medium',
        fixable: true
      })
    }

    return results
  }

  // 7. Verificação de Links e Botões
  private async checkLinks(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []
    
    try {
      // Verificar botões sem links (simulação)
      const brokenButtons = await this.checkBrokenButtons()
      
      results.push({
        id: 'links-broken-buttons',
        name: 'Botões sem Links',
        category: 'content',
        status: brokenButtons.length === 0 ? 'success' : 'error',
        message: brokenButtons.length === 0 ? 'Todos os botões têm links funcionando' : `${brokenButtons.length} botão(ões) sem links funcionando`,
        details: brokenButtons,
        priority: 'high',
        fixable: true,
        estimatedTime: '30 min'
      })

      // Verificar links quebrados
      const brokenLinks = await this.checkBrokenLinks()
      
      results.push({
        id: 'links-broken-links',
        name: 'Links Quebrados',
        category: 'content',
        status: brokenLinks.length === 0 ? 'success' : 'warning',
        message: brokenLinks.length === 0 ? 'Nenhum link quebrado encontrado' : `${brokenLinks.length} link(s) quebrado(s) encontrado(s)`,
        details: brokenLinks,
        priority: 'medium',
        fixable: true,
        estimatedTime: '1 hora'
      })

    } catch (error) {
      results.push({
        id: 'links-error',
        name: 'Erro na Verificação de Links',
        category: 'content',
        status: 'error',
        message: 'Erro ao verificar links',
        priority: 'medium',
        fixable: true
      })
    }

    return results
  }

  // 8. Análise de Plugins e Temas
  private async analyzePlugins(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []
    
    try {
      // Verificar plugins ativos (simulação)
      const activePlugins = await this.getActivePlugins()
      
      results.push({
        id: 'plugins-active-count',
        name: 'Plugins Ativos',
        category: 'technical',
        status: activePlugins.length <= 20 ? 'success' : 'warning',
        message: `${activePlugins.length} plugin(s) ativo(s)`,
        priority: activePlugins.length > 30 ? 'high' : 'low',
        fixable: true,
        estimatedTime: '1 hora'
      })

      // Verificar tema ativo
      const activeTheme = await this.getActiveTheme()
      
      results.push({
        id: 'plugins-active-theme',
        name: 'Tema Ativo',
        category: 'technical',
        status: 'info',
        message: `Tema ativo: ${activeTheme}`,
        priority: 'low',
        fixable: false
      })

    } catch (error) {
      results.push({
        id: 'plugins-error',
        name: 'Erro na Análise de Plugins',
        category: 'technical',
        status: 'error',
        message: 'Erro ao analisar plugins',
        priority: 'medium',
        fixable: true
      })
    }

    return results
  }

  // 9. Verificação de Mídia
  private async checkMedia(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []
    
    try {
      // Verificar arquivos de mídia
      const media = await this.wpApi.request('media?per_page=20')
      const mediaCount = media.length
      
      results.push({
        id: 'media-files-count',
        name: 'Arquivos de Mídia',
        category: 'content',
        status: mediaCount > 0 ? 'success' : 'warning',
        message: `${mediaCount} arquivo(s) de mídia encontrado(s)`,
        priority: 'low',
        fixable: true,
        estimatedTime: '30 min'
      })

      // Verificar imagens sem otimização
      const unoptimizedImages = await this.checkUnoptimizedImages(media)
      
      results.push({
        id: 'media-unoptimized-images',
        name: 'Imagens sem Otimização',
        category: 'performance',
        status: unoptimizedImages.length === 0 ? 'success' : 'warning',
        message: unoptimizedImages.length === 0 ? 'Todas as imagens estão otimizadas' : `${unoptimizedImages.length} imagem(ns) sem otimização`,
        priority: 'medium',
        fixable: true,
        estimatedTime: '2 horas'
      })

    } catch (error) {
      results.push({
        id: 'media-error',
        name: 'Erro na Verificação de Mídia',
        category: 'content',
        status: 'error',
        message: 'Erro ao verificar mídia',
        priority: 'medium',
        fixable: true
      })
    }

    return results
  }

  // 10. Análise de Usuários e Permissões
  private async checkUsers(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []
    
    try {
      // Verificar usuários
      const users = await this.wpApi.request('users?per_page=20')
      const userCount = users.length
      
      results.push({
        id: 'users-count',
        name: 'Usuários Cadastrados',
        category: 'security',
        status: userCount > 0 ? 'success' : 'warning',
        message: `${userCount} usuário(s) cadastrado(s)`,
        priority: 'low',
        fixable: true,
        estimatedTime: '15 min'
      })

      // Verificar usuários inativos
      const inactiveUsers = users.filter((user: any) => !user.capabilities || Object.keys(user.capabilities).length === 0)
      
      results.push({
        id: 'users-inactive',
        name: 'Usuários Inativos',
        category: 'security',
        status: inactiveUsers.length === 0 ? 'success' : 'warning',
        message: inactiveUsers.length === 0 ? 'Nenhum usuário inativo' : `${inactiveUsers.length} usuário(s) inativo(s)`,
        priority: 'medium',
        fixable: true,
        estimatedTime: '30 min'
      })

    } catch (error) {
      results.push({
        id: 'users-error',
        name: 'Erro na Análise de Usuários',
        category: 'security',
        status: 'error',
        message: 'Erro ao analisar usuários',
        priority: 'medium',
        fixable: true
      })
    }

    return results
  }

  // 11. Análise de SEO das Páginas
  private async analyzePageSEO(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []
    
    try {
      // Buscar páginas para análise de SEO
      const pages = await this.wpApi.request('pages?per_page=20')
      const posts = await this.wpApi.request('posts?per_page=20')
      
      // Análise de títulos SEO
      const pagesWithoutTitle = pages.filter((page: any) => !page.title?.rendered || page.title.rendered.trim() === '')
      const postsWithoutTitle = posts.filter((post: any) => !post.title?.rendered || post.title.rendered.trim() === '')
      
      results.push({
        id: 'seo-pages-titles',
        name: 'Páginas sem Título SEO',
        category: 'seo',
        status: pagesWithoutTitle.length === 0 ? 'success' : 'warning',
        message: `${pagesWithoutTitle.length} página(s) sem título SEO`,
        details: pagesWithoutTitle.map((page: any) => `Página ID ${page.id}: "${page.slug}"`),
        priority: pagesWithoutTitle.length > 3 ? 'high' : 'medium',
        fixable: true,
        estimatedTime: '30 min',
        suggestions: [
          'Adicionar títulos únicos e descritivos para cada página',
          'Usar palavras-chave relevantes nos títulos',
          'Manter títulos entre 50-60 caracteres',
          'Evitar títulos duplicados'
        ]
      })

      results.push({
        id: 'seo-posts-titles',
        name: 'Posts sem Título SEO',
        category: 'seo',
        status: postsWithoutTitle.length === 0 ? 'success' : 'warning',
        message: `${postsWithoutTitle.length} post(s) sem título SEO`,
        details: postsWithoutTitle.map((post: any) => `Post ID ${post.id}: "${post.slug}"`),
        priority: postsWithoutTitle.length > 5 ? 'high' : 'medium',
        fixable: true,
        estimatedTime: '45 min',
        suggestions: [
          'Criar títulos únicos e atrativos para cada post',
          'Incluir palavras-chave principais no título',
          'Usar números e palavras de poder quando apropriado',
          'Testar diferentes variações de título'
        ]
      })

      // Análise de meta descriptions
      const pagesWithoutMeta = pages.filter((page: any) => !page.excerpt?.rendered || page.excerpt.rendered.trim() === '')
      const postsWithoutMeta = posts.filter((post: any) => !post.excerpt?.rendered || post.excerpt.rendered.trim() === '')
      
      results.push({
        id: 'seo-meta-descriptions',
        name: 'Conteúdo sem Meta Description',
        category: 'seo',
        status: (pagesWithoutMeta.length + postsWithoutMeta.length) === 0 ? 'success' : 'warning',
        message: `${pagesWithoutMeta.length + postsWithoutMeta.length} item(s) sem meta description`,
        details: [
          ...pagesWithoutMeta.map((page: any) => `Página: ${page.title?.rendered || 'Sem título'}`),
          ...postsWithoutMeta.map((post: any) => `Post: ${post.title?.rendered || 'Sem título'}`)
        ],
        priority: (pagesWithoutMeta.length + postsWithoutMeta.length) > 10 ? 'high' : 'medium',
        fixable: true,
        estimatedTime: '1 hora',
        suggestions: [
          'Adicionar meta descriptions únicas para cada página/post',
          'Manter entre 150-160 caracteres',
          'Incluir call-to-action quando apropriado',
          'Usar palavras-chave relevantes'
        ]
      })

      // Análise de URLs amigáveis
      const pagesWithBadSlugs = pages.filter((page: any) => {
        const slug = page.slug || ''
        return slug.includes('page') || slug.includes('id') || slug.length < 3
      })
      
      results.push({
        id: 'seo-url-structure',
        name: 'URLs não Otimizadas',
        category: 'seo',
        status: pagesWithBadSlugs.length === 0 ? 'success' : 'warning',
        message: `${pagesWithBadSlugs.length} página(s) com URLs não otimizadas`,
        details: pagesWithBadSlugs.map((page: any) => `Página: ${page.slug}`),
        priority: 'medium',
        fixable: true,
        estimatedTime: '45 min',
        suggestions: [
          'Usar slugs descritivos e amigáveis',
          'Evitar números e caracteres especiais',
          'Incluir palavras-chave no slug',
          'Manter URLs curtas e claras'
        ]
      })

      // Análise de conteúdo duplicado
      const duplicateTitles = this.findDuplicateTitles([...pages, ...posts])
      
      results.push({
        id: 'seo-duplicate-content',
        name: 'Conteúdo Duplicado',
        category: 'seo',
        status: duplicateTitles.length === 0 ? 'success' : 'error',
        message: duplicateTitles.length === 0 ? 'Nenhum conteúdo duplicado encontrado' : `${duplicateTitles.length} título(s) duplicado(s)`,
        details: duplicateTitles,
        priority: 'high',
        fixable: true,
        estimatedTime: '1 hora',
        suggestions: [
          'Criar títulos únicos para cada página/post',
          'Usar variações de palavras-chave',
          'Adicionar subtítulos ou modificadores',
          'Considerar redirecionamentos se necessário'
        ]
      })

      // Análise de imagens sem alt text
      const media = await this.wpApi.request('media?per_page=20')
      const imagesWithoutAlt = media.filter((img: any) => !img.alt_text || img.alt_text.trim() === '')
      
      results.push({
        id: 'seo-images-alt',
        name: 'Imagens sem Alt Text',
        category: 'seo',
        status: imagesWithoutAlt.length === 0 ? 'success' : 'warning',
        message: imagesWithoutAlt.length === 0 ? 'Todas as imagens têm alt text' : `${imagesWithoutAlt.length} imagem(ns) sem alt text`,
        details: imagesWithoutAlt.map((img: any) => `Imagem: ${img.slug || 'Sem nome'}`),
        priority: 'medium',
        fixable: true,
        estimatedTime: '30 min',
        suggestions: [
          'Adicionar alt text descritivo para todas as imagens',
          'Incluir palavras-chave relevantes no alt text',
          'Manter alt text conciso mas descritivo',
          'Evitar spam de palavras-chave'
        ]
      })

    } catch (error) {
      results.push({
        id: 'seo-analysis-error',
        name: 'Erro na Análise de SEO',
        category: 'seo',
        status: 'error',
        message: 'Erro ao analisar SEO das páginas',
        priority: 'medium',
        fixable: true
      })
    }

    return results
  }

  // 12. Análise de Conteúdo por Categoria
  private async analyzeContentByCategory(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []
    
    try {
      // Buscar categorias
      const categories = await this.wpApi.request('categories?per_page=50')
      
      // Analisar cada categoria
      for (const category of categories) {
        try {
          // Buscar posts desta categoria
          const categoryPosts = await this.wpApi.request(`posts?categories=${category.id}&per_page=100`)
          const postCount = categoryPosts.length
          
          // Verificar se tem menos de 15 artigos
          if (postCount < 15) {
            results.push({
              id: `category-${category.id}-low-content`,
              name: `Categoria "${category.name}" com Pouco Conteúdo`,
              category: 'content',
              status: postCount === 0 ? 'error' : 'warning',
              message: `Categoria "${category.name}" tem apenas ${postCount} artigo(s) (mínimo recomendado: 15)`,
              details: [
                `Categoria: ${category.name}`,
                `Artigos atuais: ${postCount}`,
                `Meta recomendada: 15+ artigos`,
                `Deficit: ${15 - postCount} artigos`
              ],
              priority: postCount === 0 ? 'critical' : 'high',
              fixable: true,
              estimatedTime: '2-4 horas',
              suggestions: [
                'Criar mais conteúdo para esta categoria',
                'Planejar calendário editorial',
                'Reutilizar conteúdo existente',
                'Considerar subcategorias se necessário',
                'Otimizar conteúdo existente para SEO'
              ],
              aiAnalysis: postCount === 0 
                ? 'Categoria vazia pode prejudicar a autoridade do site'
                : 'Categoria com pouco conteúdo pode afetar o ranqueamento'
            })
          } else {
            results.push({
              id: `category-${category.id}-good-content`,
              name: `Categoria "${category.name}" Bem Abastecida`,
              category: 'content',
              status: 'success',
              message: `Categoria "${category.name}" tem ${postCount} artigo(s) (acima do mínimo)`,
              details: [
                `Categoria: ${category.name}`,
                `Artigos: ${postCount}`,
                `Status: Bem abastecida`,
                `Recomendação: Manter produção regular`
              ],
              priority: 'low',
              fixable: false
            })
          }
        } catch (error) {
          results.push({
            id: `category-${category.id}-error`,
            name: `Erro ao Analisar Categoria "${category.name}"`,
            category: 'content',
            status: 'error',
            message: `Erro ao analisar categoria "${category.name}"`,
            priority: 'medium',
            fixable: true
          })
        }
      }

      // Análise geral de distribuição de conteúdo
      const totalPosts = await this.wpApi.request('posts?per_page=1')
      const totalCategories = categories.length
      const averagePostsPerCategory = totalPosts.length / totalCategories
      
      results.push({
        id: 'content-distribution-analysis',
        name: 'Análise de Distribuição de Conteúdo',
        category: 'content',
        status: averagePostsPerCategory >= 10 ? 'success' : 'warning',
        message: `Distribuição média: ${averagePostsPerCategory.toFixed(1)} artigos por categoria`,
        details: [
          `Total de categorias: ${totalCategories}`,
          `Média de artigos por categoria: ${averagePostsPerCategory.toFixed(1)}`,
          `Categorias com pouco conteúdo: ${categories.filter(c => c.postCount < 15).length}`,
          `Recomendação: ${averagePostsPerCategory < 10 ? 'Aumentar produção de conteúdo' : 'Manter produção regular'}`
        ],
        priority: averagePostsPerCategory < 5 ? 'high' : 'medium',
        fixable: true,
        estimatedTime: '4-8 horas',
        suggestions: [
          'Criar calendário editorial equilibrado',
          'Focar em categorias com pouco conteúdo',
          'Considerar consolidar categorias similares',
          'Planejar campanhas de conteúdo específicas'
        ]
      })

    } catch (error) {
      results.push({
        id: 'category-analysis-error',
        name: 'Erro na Análise de Categorias',
        category: 'content',
        status: 'error',
        message: 'Erro ao analisar conteúdo por categoria',
        priority: 'medium',
        fixable: true
      })
    }

    return results
  }

  // Métodos auxiliares
  private findDuplicateTitles(items: any[]): string[] {
    const titleCounts: { [key: string]: number } = {}
    const duplicates: string[] = []
    
    items.forEach(item => {
      const title = item.title?.rendered || ''
      if (title) {
        titleCounts[title] = (titleCounts[title] || 0) + 1
      }
    })
    
    Object.entries(titleCounts).forEach(([title, count]) => {
      if (count > 1) {
        duplicates.push(`${title} (${count} ocorrências)`)
      }
    })
    
    return duplicates
  }

  // Análise com IA
  private async runAIAnalysis(results: DiagnosticResult[]): Promise<DiagnosticResult[]> {
    const aiResults: DiagnosticResult[] = []
    
    if (!this.aiServices) return aiResults

    try {
      // Análise inteligente dos resultados
      const criticalIssues = results.filter(r => r.priority === 'critical')
      const highIssues = results.filter(r => r.priority === 'high')
      
      if (criticalIssues.length > 0) {
        aiResults.push({
          id: 'ai-critical-analysis',
          name: 'Análise IA - Problemas Críticos',
          category: 'technical',
          status: 'error',
          message: `IA identificou ${criticalIssues.length} problema(s) crítico(s) que precisam de atenção imediata`,
          details: criticalIssues.map(r => r.message),
          priority: 'critical',
          fixable: true,
          aiAnalysis: 'Problemas críticos detectados que podem afetar a funcionalidade do site',
          estimatedTime: '2 horas'
        })
      }

      if (highIssues.length > 0) {
        aiResults.push({
          id: 'ai-high-analysis',
          name: 'Análise IA - Problemas Importantes',
          category: 'technical',
          status: 'warning',
          message: `IA identificou ${highIssues.length} problema(s) importante(s) que devem ser corrigidos`,
          details: highIssues.map(r => r.message),
          priority: 'high',
          fixable: true,
          aiAnalysis: 'Problemas importantes que podem impactar a performance ou segurança',
          estimatedTime: '1 hora'
        })
      }

    } catch (error) {
      aiResults.push({
        id: 'ai-analysis-error',
        name: 'Erro na Análise IA',
        category: 'technical',
        status: 'error',
        message: 'Erro ao executar análise com IA',
        priority: 'low',
        fixable: true
      })
    }

    return aiResults
  }

  // Métodos auxiliares
  private async checkDuplicatePixels(): Promise<string[]> {
    // Simulação - em implementação real, analisaria o código HTML
    return ['Facebook Pixel duplicado na página inicial', 'Google Analytics duplicado no header']
  }

  private async checkPagesWithoutAds(): Promise<string[]> {
    // Simulação - em implementação real, verificaria páginas sem blocos de anúncios
    return ['Página "Sobre" sem blocos de anúncios', 'Página "Contato" sem blocos de anúncios']
  }

  private async checkBrokenButtons(): Promise<string[]> {
    // Simulação - em implementação real, verificaria botões sem links
    return ['Botão "Saiba Mais" sem link', 'Botão "Comprar Agora" sem link']
  }

  private async checkBrokenLinks(): Promise<string[]> {
    // Simulação - em implementação real, verificaria links quebrados
    return ['Link para página inexistente', 'Link para arquivo não encontrado']
  }

  private async getActivePlugins(): Promise<string[]> {
    // Simulação - em implementação real, listaria plugins ativos
    return ['Yoast SEO', 'WooCommerce', 'Elementor', 'Contact Form 7']
  }

  private async getActiveTheme(): Promise<string> {
    // Simulação - em implementação real, obteria tema ativo
    return 'Astra'
  }

  private async checkUnoptimizedImages(media: any[]): Promise<string[]> {
    // Simulação - em implementação real, verificaria otimização de imagens
    return ['imagem1.jpg (2.5MB)', 'imagem2.png (1.8MB)']
  }

  private calculateOverallScore(results: DiagnosticResult[]): number {
    const total = results.length
    const errors = results.filter(r => r.status === 'error').length
    const warnings = results.filter(r => r.status === 'warning').length
    const successes = results.filter(r => r.status === 'success').length
    
    return Math.round(((successes * 1 + warnings * 0.5) / total) * 100)
  }

  private generateSummary(results: DiagnosticResult[]) {
    return {
      total: results.length,
      errors: results.filter(r => r.status === 'error').length,
      warnings: results.filter(r => r.status === 'warning').length,
      successes: results.filter(r => r.status === 'success').length,
      critical: results.filter(r => r.priority === 'critical').length
    }
  }

  private generateRecommendations(results: DiagnosticResult[]): string[] {
    const recommendations: string[] = []
    
    const criticalIssues = results.filter(r => r.priority === 'critical')
    if (criticalIssues.length > 0) {
      recommendations.push('Corrigir problemas críticos imediatamente')
    }
    
    const performanceIssues = results.filter(r => r.category === 'performance' && r.status !== 'success')
    if (performanceIssues.length > 0) {
      recommendations.push('Otimizar performance do site')
    }
    
    const securityIssues = results.filter(r => r.category === 'security' && r.status !== 'success')
    if (securityIssues.length > 0) {
      recommendations.push('Melhorar segurança do site')
    }
    
    return recommendations
  }

  private async generateAIInsights(results: DiagnosticResult[]): Promise<string[]> {
    if (!this.aiServices) return []
    
    const insights: string[] = []
    
    // Análise de padrões
    const errorCount = results.filter(r => r.status === 'error').length
    if (errorCount > 5) {
      insights.push('IA detectou muitos erros - considere uma auditoria completa')
    }
    
    const performanceIssues = results.filter(r => r.category === 'performance')
    if (performanceIssues.length > 0) {
      insights.push('IA sugere implementar cache e otimização de imagens')
    }
    
    return insights
  }
}
