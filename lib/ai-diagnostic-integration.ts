// Integração de IA para Diagnósticos WordPress
export interface AIDiagnosticAnalysis {
  insights: string[]
  confidence: number
  estimatedImpact: string
  recommendations: string[]
  priorityActions: string[]
  autoFixable: string[]
}

export interface AIDiagnosticRequest {
  siteData: {
    name: string
    url: string
    id: string
  }
  diagnosticResults: any[]
  siteUrl: string
  siteName: string
}

export class AIDiagnosticIntegration {
  private aiServices: any

  constructor(aiServices: any) {
    this.aiServices = aiServices
  }

  async analyzeDiagnosticResults(request: AIDiagnosticRequest): Promise<AIDiagnosticAnalysis> {
    try {
      // Preparar dados para análise de IA
      const diagnosticSummary = this.prepareDiagnosticSummary(request.diagnosticResults)
      
      // Análise com OpenAI
      const openaiAnalysis = await this.analyzeWithOpenAI(diagnosticSummary, request.siteData)
      
      // Análise com Gemini
      const geminiAnalysis = await this.analyzeWithGemini(diagnosticSummary, request.siteData)
      
      // Análise com Koala
      const koalaAnalysis = await this.analyzeWithKoala(diagnosticSummary, request.siteData)
      
      // Combinar análises
      const combinedAnalysis = this.combineAnalyses([openaiAnalysis, geminiAnalysis, koalaAnalysis])
      
      return combinedAnalysis
    } catch (error) {
      console.error('Erro na análise de IA:', error)
      return {
        insights: ['Erro na análise de IA - usando análise básica'],
        confidence: 50,
        estimatedImpact: 'Médio',
        recommendations: ['Verificar configurações de IA'],
        priorityActions: ['Corrigir problemas críticos identificados'],
        autoFixable: []
      }
    }
  }

  private prepareDiagnosticSummary(results: any[]): string {
    const summary = {
      total: results.length,
      critical: results.filter(r => r.priority === 'critical').length,
      high: results.filter(r => r.priority === 'high').length,
      errors: results.filter(r => r.status === 'error').length,
      warnings: results.filter(r => r.status === 'warning').length,
      categories: {
        technical: results.filter(r => r.category === 'technical').length,
        performance: results.filter(r => r.category === 'performance').length,
        seo: results.filter(r => r.category === 'seo').length,
        security: results.filter(r => r.category === 'security').length,
        content: results.filter(r => r.category === 'content').length,
        ads: results.filter(r => r.category === 'ads').length
      }
    }

    return JSON.stringify(summary, null, 2)
  }

  private async analyzeWithOpenAI(summary: string, siteData: any): Promise<any> {
    try {
      if (!this.aiServices.openai) return null

      const prompt = `
        Analise os seguintes dados de diagnóstico de um site WordPress:
        
        Site: ${siteData.name} (${siteData.url})
        Resumo: ${summary}
        
        Forneça:
        1. Insights principais sobre problemas identificados
        2. Recomendações de prioridade
        3. Ações que podem ser automatizadas
        4. Estimativa de impacto nos negócios
        
        Responda em formato JSON com:
        - insights: array de strings
        - recommendations: array de strings
        - priorityActions: array de strings
        - autoFixable: array de strings
        - confidence: número de 0-100
        - estimatedImpact: string
      `

      const response = await this.aiServices.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      })

      return JSON.parse(response.choices[0].message.content || '{}')
    } catch (error) {
      console.error('Erro na análise OpenAI:', error)
      return null
    }
  }

  private async analyzeWithGemini(summary: string, siteData: any): Promise<any> {
    try {
      if (!this.aiServices.gemini) return null

      const prompt = `
        Como especialista em WordPress, analise este diagnóstico:
        
        Site: ${siteData.name}
        Dados: ${summary}
        
        Foque em:
        - Problemas de performance
        - Questões de SEO
        - Segurança
        - Experiência do usuário
        
        Forneça insights técnicos específicos e soluções práticas.
      `

      // Implementar chamada para Gemini API
      // const response = await this.aiServices.gemini.generateContent(prompt)
      
      return {
        insights: ['Análise Gemini em desenvolvimento'],
        recommendations: ['Implementar cache', 'Otimizar imagens'],
        priorityActions: ['Corrigir problemas críticos'],
        autoFixable: ['Otimização de imagens'],
        confidence: 75,
        estimatedImpact: 'Alto'
      }
    } catch (error) {
      console.error('Erro na análise Gemini:', error)
      return null
    }
  }

  private async analyzeWithKoala(summary: string, siteData: any): Promise<any> {
    try {
      if (!this.aiServices.koala) return null

      const prompt = `
        Analise este diagnóstico WordPress focando em:
        - Problemas de conteúdo
        - Estrutura do site
        - Navegação
        - Experiência do usuário
        
        Site: ${siteData.name}
        Dados: ${summary}
      `

      // Implementar chamada para Koala API
      // const response = await this.aiServices.koala.analyze(prompt)
      
      return {
        insights: ['Análise Koala em desenvolvimento'],
        recommendations: ['Melhorar estrutura de conteúdo'],
        priorityActions: ['Revisar navegação'],
        autoFixable: ['Otimização de conteúdo'],
        confidence: 80,
        estimatedImpact: 'Médio'
      }
    } catch (error) {
      console.error('Erro na análise Koala:', error)
      return null
    }
  }

  private combineAnalyses(analyses: any[]): AIDiagnosticAnalysis {
    const validAnalyses = analyses.filter(a => a !== null)
    
    if (validAnalyses.length === 0) {
      return {
        insights: ['Nenhuma análise de IA disponível'],
        confidence: 0,
        estimatedImpact: 'Desconhecido',
        recommendations: ['Verificar configurações de IA'],
        priorityActions: ['Corrigir problemas manualmente'],
        autoFixable: []
      }
    }

    // Combinar insights
    const allInsights = validAnalyses.flatMap(a => a.insights || [])
    const allRecommendations = validAnalyses.flatMap(a => a.recommendations || [])
    const allPriorityActions = validAnalyses.flatMap(a => a.priorityActions || [])
    const allAutoFixable = validAnalyses.flatMap(a => a.autoFixable || [])
    
    // Calcular confiança média
    const avgConfidence = validAnalyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / validAnalyses.length
    
    // Determinar impacto estimado
    const impacts = validAnalyses.map(a => a.estimatedImpact).filter(Boolean)
    const estimatedImpact = impacts.length > 0 ? impacts[0] : 'Médio'

    return {
      insights: [...new Set(allInsights)],
      confidence: Math.round(avgConfidence),
      estimatedImpact,
      recommendations: [...new Set(allRecommendations)],
      priorityActions: [...new Set(allPriorityActions)],
      autoFixable: [...new Set(allAutoFixable)]
    }
  }

  // Análise específica para problemas de SEO
  async analyzeSEOIssues(seoResults: any[]): Promise<string[]> {
    const insights: string[] = []
    
    const titleIssues = seoResults.filter(r => r.id.includes('title'))
    const metaIssues = seoResults.filter(r => r.id.includes('meta'))
    const contentIssues = seoResults.filter(r => r.id.includes('content'))
    
    if (titleIssues.length > 0) {
      insights.push('Problemas de títulos SEO identificados - afetam ranqueamento')
    }
    
    if (metaIssues.length > 0) {
      insights.push('Meta descriptions ausentes ou inadequadas')
    }
    
    if (contentIssues.length > 0) {
      insights.push('Problemas de conteúdo duplicado ou vazio')
    }
    
    return insights
  }

  // Análise específica para problemas de performance
  async analyzePerformanceIssues(performanceResults: any[]): Promise<string[]> {
    const insights: string[] = []
    
    const slowResponse = performanceResults.filter(r => r.id.includes('response-time'))
    const largeFiles = performanceResults.filter(r => r.id.includes('response-size'))
    
    if (slowResponse.length > 0) {
      insights.push('Tempo de resposta lento - implementar cache e CDN')
    }
    
    if (largeFiles.length > 0) {
      insights.push('Arquivos grandes detectados - otimizar imagens e scripts')
    }
    
    return insights
  }

  // Análise específica para problemas de segurança
  async analyzeSecurityIssues(securityResults: any[]): Promise<string[]> {
    const insights: string[] = []
    
    const versionIssues = securityResults.filter(r => r.id.includes('version'))
    const userIssues = securityResults.filter(r => r.id.includes('user'))
    
    if (versionIssues.length > 0) {
      insights.push('Versão do WordPress pode estar desatualizada')
    }
    
    if (userIssues.length > 0) {
      insights.push('Problemas de usuários administrativos detectados')
    }
    
    return insights
  }

  // Geração de relatório inteligente
  async generateIntelligentReport(diagnosticResults: any[]): Promise<string> {
    try {
      const criticalIssues = diagnosticResults.filter(r => r.priority === 'critical')
      const highIssues = diagnosticResults.filter(r => r.priority === 'high')
      const performanceIssues = diagnosticResults.filter(r => r.category === 'performance')
      const seoIssues = diagnosticResults.filter(r => r.category === 'seo')
      
      let report = '# Relatório Inteligente de Diagnóstico WordPress\n\n'
      
      if (criticalIssues.length > 0) {
        report += `## 🚨 Problemas Críticos (${criticalIssues.length})\n`
        report += 'Estes problemas precisam de atenção imediata:\n\n'
        criticalIssues.forEach(issue => {
          report += `- **${issue.name}**: ${issue.message}\n`
        })
        report += '\n'
      }
      
      if (highIssues.length > 0) {
        report += `## ⚠️ Problemas Importantes (${highIssues.length})\n`
        report += 'Estes problemas devem ser corrigidos em breve:\n\n'
        highIssues.forEach(issue => {
          report += `- **${issue.name}**: ${issue.message}\n`
        })
        report += '\n'
      }
      
      if (performanceIssues.length > 0) {
        report += `## 🚀 Otimizações de Performance (${performanceIssues.length})\n`
        report += 'Melhorias sugeridas para performance:\n\n'
        performanceIssues.forEach(issue => {
          report += `- **${issue.name}**: ${issue.message}\n`
        })
        report += '\n'
      }
      
      if (seoIssues.length > 0) {
        report += `## 🔍 Otimizações de SEO (${seoIssues.length})\n`
        report += 'Melhorias sugeridas para SEO:\n\n'
        seoIssues.forEach(issue => {
          report += `- **${issue.name}**: ${issue.message}\n`
        })
        report += '\n'
      }
      
      report += '## 📊 Resumo Executivo\n'
      report += `- Total de verificações: ${diagnosticResults.length}\n`
      report += `- Problemas críticos: ${criticalIssues.length}\n`
      report += `- Problemas importantes: ${highIssues.length}\n`
      report += `- Pontuação geral: ${this.calculateOverallScore(diagnosticResults)}%\n`
      
      return report
    } catch (error) {
      console.error('Erro na geração do relatório:', error)
      return 'Erro ao gerar relatório inteligente'
    }
  }

  private calculateOverallScore(results: any[]): number {
    const total = results.length
    const errors = results.filter(r => r.status === 'error').length
    const warnings = results.filter(r => r.status === 'warning').length
    const successes = results.filter(r => r.status === 'success').length
    
    return Math.round(((successes * 1 + warnings * 0.5) / total) * 100)
  }
}