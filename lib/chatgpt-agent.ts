/**
 * 🤖 ChatGPT Agent & Investigation System
 * 
 * Implementa as funcionalidades "Investigar" e "Modo Agente" do ChatGPT
 * para diagnóstico WordPress avançado
 */

export interface InvestigationRequest {
  siteUrl: string
  investigationType: 'deep_analysis' | 'security_audit' | 'performance_audit' | 'seo_audit' | 'compliance_audit'
  focusAreas?: string[]
  priority?: 'high' | 'medium' | 'low'
}

export interface AgentResponse {
  investigation: {
    findings: InvestigationFinding[]
    recommendations: Recommendation[]
    riskAssessment: RiskAssessment
    nextSteps: string[]
  }
  agent: {
    reasoning: string
    confidence: number
    sources: string[]
  }
}

export interface InvestigationFinding {
  category: 'security' | 'performance' | 'seo' | 'compliance' | 'usability'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  evidence: string[]
  affectedPages?: string[]
}

export interface Recommendation {
  priority: 'immediate' | 'short_term' | 'long_term'
  category: string
  title: string
  description: string
  implementation: string
  estimatedTime: string
  difficulty: 'easy' | 'medium' | 'hard'
  resources: string[]
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  securityRisk: number
  performanceRisk: number
  seoRisk: number
  complianceRisk: number
  businessRisk: number
}

class ChatGPTAgent {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || ''
  }

  /**
   * 🔍 Modo Investigar - Análise profunda e detalhada
   */
  async investigate(request: InvestigationRequest): Promise<AgentResponse> {
    const prompt = this.buildInvestigationPrompt(request)
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Você é um especialista em WordPress com capacidades de investigação avançada. 
              Use suas habilidades de análise profunda para investigar sites WordPress de forma meticulosa.
              Sempre forneça evidências concretas e recomendações acionáveis.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 3000,
          temperature: 0.3
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content
      
      return this.parseInvestigationResponse(content)
    } catch (error) {
      console.error('Erro na investigação:', error)
      throw error
    }
  }

  /**
   * 🤖 Modo Agente - Análise inteligente com raciocínio
   */
  async agentMode(request: InvestigationRequest): Promise<AgentResponse> {
    const prompt = this.buildAgentPrompt(request)
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Você é um agente de IA especializado em WordPress com capacidades de raciocínio avançado.
              Analise o site como um consultor experiente, fornecendo insights estratégicos e recomendações baseadas em dados.
              Use seu conhecimento para identificar padrões, tendências e oportunidades de melhoria.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 3000,
          temperature: 0.5
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content
      
      return this.parseInvestigationResponse(content)
    } catch (error) {
      console.error('Erro no modo agente:', error)
      throw error
    }
  }

  /**
   * 📝 Constrói prompt para investigação
   */
  private buildInvestigationPrompt(request: InvestigationRequest): string {
    const { siteUrl, investigationType, focusAreas, priority } = request
    
    let prompt = `INVESTIGAÇÃO PROFUNDA - WordPress Site Analysis

🌐 SITE: ${siteUrl}
🔍 TIPO: ${this.getInvestigationTypeName(investigationType)}
⚡ PRIORIDADE: ${priority?.toUpperCase() || 'MEDIUM'}

${focusAreas ? `🎯 ÁREAS DE FOCO: ${focusAreas.join(', ')}` : ''}

INSTRUÇÕES DE INVESTIGAÇÃO:
1. Analise o site de forma meticulosa e sistemática
2. Identifique problemas específicos com evidências concretas
3. Avalie riscos e impactos no negócio
4. Forneça recomendações acionáveis e priorizadas
5. Inclua métricas e benchmarks quando possível

FORMATO DE RESPOSTA (JSON):
{
  "investigation": {
    "findings": [
      {
        "category": "security|performance|seo|compliance|usability",
        "severity": "critical|high|medium|low",
        "title": "Título do problema",
        "description": "Descrição detalhada",
        "impact": "Impacto no negócio",
        "evidence": ["evidência 1", "evidência 2"],
        "affectedPages": ["página1", "página2"]
      }
    ],
    "recommendations": [
      {
        "priority": "immediate|short_term|long_term",
        "category": "Categoria",
        "title": "Título da recomendação",
        "description": "Descrição detalhada",
        "implementation": "Como implementar",
        "estimatedTime": "Tempo estimado",
        "difficulty": "easy|medium|hard",
        "resources": ["recurso1", "recurso2"]
      }
    ],
    "riskAssessment": {
      "overallRisk": "low|medium|high|critical",
      "securityRisk": 0-100,
      "performanceRisk": 0-100,
      "seoRisk": 0-100,
      "complianceRisk": 0-100,
      "businessRisk": 0-100
    },
    "nextSteps": ["passo1", "passo2", "passo3"]
  },
  "agent": {
    "reasoning": "Raciocínio por trás da análise",
    "confidence": 0-100,
    "sources": ["fonte1", "fonte2"]
  }
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.`

    return prompt
  }

  /**
   * 🤖 Constrói prompt para modo agente
   */
  private buildAgentPrompt(request: InvestigationRequest): string {
    const { siteUrl, investigationType, focusAreas, priority } = request
    
    let prompt = `MODO AGENTE - Análise Inteligente WordPress

🌐 SITE: ${siteUrl}
🤖 MODO: Agente de IA Especializado
🔍 TIPO: ${this.getInvestigationTypeName(investigationType)}
⚡ PRIORIDADE: ${priority?.toUpperCase() || 'MEDIUM'}

${focusAreas ? `🎯 ÁREAS DE FOCO: ${focusAreas.join(', ')}` : ''}

INSTRUÇÕES DO AGENTE:
1. Use raciocínio avançado para análise estratégica
2. Identifique padrões e tendências
3. Forneça insights de negócio e recomendações estratégicas
4. Avalie oportunidades de crescimento e otimização
5. Considere o contexto do mercado e melhores práticas

FORMATO DE RESPOSTA (JSON):
{
  "investigation": {
    "findings": [
      {
        "category": "security|performance|seo|compliance|usability",
        "severity": "critical|high|medium|low",
        "title": "Título do problema",
        "description": "Descrição detalhada",
        "impact": "Impacto no negócio",
        "evidence": ["evidência 1", "evidência 2"],
        "affectedPages": ["página1", "página2"]
      }
    ],
    "recommendations": [
      {
        "priority": "immediate|short_term|long_term",
        "category": "Categoria",
        "title": "Título da recomendação",
        "description": "Descrição detalhada",
        "implementation": "Como implementar",
        "estimatedTime": "Tempo estimado",
        "difficulty": "easy|medium|hard",
        "resources": ["recurso1", "recurso2"]
      }
    ],
    "riskAssessment": {
      "overallRisk": "low|medium|high|critical",
      "securityRisk": 0-100,
      "performanceRisk": 0-100,
      "seoRisk": 0-100,
      "complianceRisk": 0-100,
      "businessRisk": 0-100
    },
    "nextSteps": ["passo1", "passo2", "passo3"]
  },
  "agent": {
    "reasoning": "Raciocínio estratégico e insights",
    "confidence": 0-100,
    "sources": ["fonte1", "fonte2"]
  }
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.`

    return prompt
  }

  /**
   * 📊 Converte tipo de investigação para nome legível
   */
  private getInvestigationTypeName(type: string): string {
    const types = {
      'deep_analysis': 'Análise Profunda',
      'security_audit': 'Auditoria de Segurança',
      'performance_audit': 'Auditoria de Performance',
      'seo_audit': 'Auditoria de SEO',
      'compliance_audit': 'Auditoria de Compliance'
    }
    return types[type as keyof typeof types] || 'Análise Geral'
  }

  /**
   * 🔍 Parse da resposta de investigação
   */
  private parseInvestigationResponse(content: string): AgentResponse {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      // Se não conseguir extrair JSON, retornar resposta padrão
      return {
        investigation: {
          findings: [],
          recommendations: [],
          riskAssessment: {
            overallRisk: 'medium',
            securityRisk: 50,
            performanceRisk: 50,
            seoRisk: 50,
            complianceRisk: 50,
            businessRisk: 50
          },
          nextSteps: ['Análise manual necessária']
        },
        agent: {
          reasoning: 'Resposta não pôde ser processada automaticamente',
          confidence: 0,
          sources: []
        }
      }
    } catch (error) {
      console.error('Erro ao fazer parse da resposta:', error)
      throw new Error('Resposta da IA não pôde ser processada')
    }
  }
}

export const chatGPTAgent = new ChatGPTAgent()








