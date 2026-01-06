/**
 * Image Scoring Service - Ranking Automático com GPT-4 Vision (Modelo Travado)
 * 
 * Ativa quando:
 * - production tier
 * - variations > 1
 * - FEATURE_VISION_SCORING=true
 * 
 * Modelo: gpt-4o (travado, não muda automaticamente)
 */

export interface ImageScore {
  realismo: number          // 0-10
  estetica: number          // 0-10
  alinhamento: number       // 0-10
  limpeza: number           // 0-10
  caraDeIA: number          // 0-10 (quanto maior, pior)
  legibilidade?: number     // 0-10 (se houver texto)
  total: number             // Média ponderada
}

export interface ScoringResult {
  bestImageIndex: number
  scores: Array<{
    index: number
    score: ImageScore
    imageUrl: string
  }>
  breakdown: {
    realismo: { avg: number; best: number }
    estetica: { avg: number; best: number }
    alinhamento: { avg: number; best: number }
    limpeza: { avg: number; best: number }
    caraDeIA: { avg: number; best: number }
  }
}

export interface ScoringContext {
  mainPrompt: string
  productName?: string
  objective?: string
  imageType: 'conceptual' | 'commercial'
}

export class ImageScoringService {
  private apiKey: string
  private model: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    // Modelo travado: usar EXATAMENTE o mesmo modelo de /api/creative/analyze-image
    // Por padrão: gpt-4o (mesmo usado em analyze-image)
    // Fallback SOMENTE via env explícita VISION_SCORING_MODEL
    this.model = process.env.VISION_SCORING_MODEL || 'gpt-4o'
    console.log(`[ImageScoring] Modelo travado: ${this.model} (não muda automaticamente)`)
  }

  /**
   * Score múltiplas imagens e retorna bestOf
   */
  async scoreImages(
    images: Array<{ url: string; prompt: string; variation: number; idx?: number }>,
    context: ScoringContext
  ): Promise<ScoringResult> {
    // Filtrar imagens sem URL (ignorar), mas preservar idx original
    const scorable = images
      .map((img, originalIdx) => ({ ...img, idx: img.idx !== undefined ? img.idx : originalIdx }))
      .filter(x => x.url && x.url.trim().length > 0)
    
    if (scorable.length === 0) {
      throw new Error('Nenhuma imagem válida fornecida para scoring (todas sem URL)')
    }

    if (scorable.length === 1) {
      // Se apenas uma imagem válida, retornar sem scoring
      return {
        bestImageIndex: scorable[0].idx!,
        scores: [{
          index: scorable[0].idx!,
          score: {
            realismo: 7,
            estetica: 7,
            alinhamento: 7,
            limpeza: 7,
            caraDeIA: 3,
            total: 7
          },
          imageUrl: scorable[0].url
        }],
        breakdown: {
          realismo: { avg: 7, best: 7 },
          estetica: { avg: 7, best: 7 },
          alinhamento: { avg: 7, best: 7 },
          limpeza: { avg: 7, best: 7 },
          caraDeIA: { avg: 3, best: 3 }
        }
      }
    }

    console.log(`[ImageScoring] Scoreando ${scorable.length} imagens válidas (de ${images.length} total) com modelo ${this.model}`)

    // Scorear cada imagem válida (mantendo idx original)
    const scores: Array<{ index: number; score: ImageScore; imageUrl: string }> = []

    for (const item of scorable) {
      try {
        const score = await this.scoreSingleImage(item, context)
        scores.push({
          index: item.idx!, // Usar idx original preservado
          score,
          imageUrl: item.url
        })
      } catch (error) {
        console.warn(`[ImageScoring] Erro ao scorear imagem idx ${item.idx}:`, error)
        // Score padrão em caso de erro
        scores.push({
          index: item.idx!,
          score: {
            realismo: 5,
            estetica: 5,
            alinhamento: 5,
            limpeza: 5,
            caraDeIA: 5,
            total: 5
          },
          imageUrl: item.url
        })
      }
    }

    // Encontrar melhor imagem (maior total, menor caraDeIA)
    let bestScoreIndex = 0
    let bestScore = scores[0].score.total - (scores[0].score.caraDeIA * 0.5) // Penaliza caraDeIA

    for (let i = 1; i < scores.length; i++) {
      const adjustedScore = scores[i].score.total - (scores[i].score.caraDeIA * 0.5)
      if (adjustedScore > bestScore) {
        bestScore = adjustedScore
        bestScoreIndex = i
      }
    }
    
    // bestImageIndex deve ser o idx original da imagem (não o index no array de scores)
    const bestImageIndex = scores[bestScoreIndex].index

    // Calcular breakdown
    const breakdown = {
      realismo: {
        avg: scores.reduce((sum, s) => sum + s.score.realismo, 0) / scores.length,
        best: scores[bestScoreIndex].score.realismo
      },
      estetica: {
        avg: scores.reduce((sum, s) => sum + s.score.estetica, 0) / scores.length,
        best: scores[bestScoreIndex].score.estetica
      },
      alinhamento: {
        avg: scores.reduce((sum, s) => sum + s.score.alinhamento, 0) / scores.length,
        best: scores[bestScoreIndex].score.alinhamento
      },
      limpeza: {
        avg: scores.reduce((sum, s) => sum + s.score.limpeza, 0) / scores.length,
        best: scores[bestScoreIndex].score.limpeza
      },
      caraDeIA: {
        avg: scores.reduce((sum, s) => sum + s.score.caraDeIA, 0) / scores.length,
        best: scores[bestScoreIndex].score.caraDeIA
      }
    }

    console.log('[ImageScoring] Melhor imagem:', {
      index: bestImageIndex,
      score: scores[bestScoreIndex].score,
      breakdown
    })

    return {
      bestImageIndex,
      scores,
      breakdown
    }
  }

  /**
   * Score uma única imagem
   */
  private async scoreSingleImage(
    image: { url: string; prompt: string },
    context: ScoringContext
  ): Promise<ImageScore> {
    // OpenAI aceita data: URLs e URLs públicas (http/https)
    // Passar diretamente para a API
    const imageUrl = image.url

    // Construir prompt de scoring
    const scoringPrompt = this.buildScoringPrompt(context, image.prompt)

    // Chamar GPT-4 Vision
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: scoringPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl // Aceita data: ou http(s)://
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3 // Baixa temperatura para scoring consistente
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Erro na API: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    const analysis = data.choices[0]?.message?.content || ''

    // Extrair scores do texto
    return this.parseScores(analysis)
  }

  /**
   * Constrói prompt de scoring
   */
  private buildScoringPrompt(context: ScoringContext, imagePrompt: string): string {
    return `Analise esta imagem publicitária e atribua scores de 0 a 10 para cada critério:

Contexto:
- Prompt principal: ${context.mainPrompt}
${context.productName ? `- Produto: ${context.productName}` : ''}
${context.objective ? `- Objetivo: ${context.objective}` : ''}
- Tipo: ${context.imageType}
- Prompt usado: ${imagePrompt}

Critérios (0-10 cada):
1. REALISMO: A imagem parece uma fotografia real? (10 = fotografia real, 0 = renderização 3D/CG)
2. ESTÉTICA: Qualidade visual e composição publicitária profissional? (10 = excelente, 0 = amadora)
3. ALINHAMENTO: A imagem está alinhada com o briefing e objetivo? (10 = perfeito, 0 = não relacionado)
4. LIMPEZA: Ausência de artefatos, erros, elementos indesejados? (10 = perfeito, 0 = muitos problemas)
5. CARA DE IA: Quanto a imagem parece gerada por IA? (10 = muito óbvio, 0 = não parece IA)
${context.imageType === 'commercial' ? '6. LEGIBILIDADE: Se houver texto, está legível e profissional? (10 = perfeito, 0 = ilegível)' : ''}

Responda APENAS no formato JSON:
{
  "realismo": 8,
  "estetica": 7,
  "alinhamento": 9,
  "limpeza": 8,
  "caraDeIA": 2,
  "legibilidade": 9,
  "total": 7.5
}

Calcule "total" como média ponderada:
- realismo: 30%
- estetica: 25%
- alinhamento: 20%
- limpeza: 15%
- caraDeIA: 10% (invertido: 10 - caraDeIA)
${context.imageType === 'commercial' ? '- legibilidade: 10%' : ''}`
  }

  /**
   * Parse scores do texto de análise
   */
  private parseScores(analysis: string): ImageScore {
    // Tentar extrair JSON
    const jsonMatch = analysis.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          realismo: this.clampScore(parsed.realismo),
          estetica: this.clampScore(parsed.estetica),
          alinhamento: this.clampScore(parsed.alinhamento),
          limpeza: this.clampScore(parsed.limpeza),
          caraDeIA: this.clampScore(parsed.caraDeIA),
          legibilidade: parsed.legibilidade ? this.clampScore(parsed.legibilidade) : undefined,
          total: this.clampScore(parsed.total || this.calculateTotal(parsed))
        }
      } catch (error) {
        console.warn('[ImageScoring] Erro ao parsear JSON, usando fallback:', error)
      }
    }

    // Fallback: extrair números do texto
    const scores: ImageScore = {
      realismo: this.extractScore(analysis, 'realismo'),
      estetica: this.extractScore(analysis, 'estetica'),
      alinhamento: this.extractScore(analysis, 'alinhamento'),
      limpeza: this.extractScore(analysis, 'limpeza'),
      caraDeIA: this.extractScore(analysis, 'caraDeIA'),
      total: 0
    }

    scores.total = this.calculateTotal(scores)

    return scores
  }

  /**
   * Extrai score de um critério do texto
   */
  private extractScore(text: string, criterion: string): number {
    const regex = new RegExp(`${criterion}[\\s:]*([0-9]+(?:\\.[0-9]+)?)`, 'i')
    const match = text.match(regex)
    return match ? this.clampScore(parseFloat(match[1])) : 5
  }

  /**
   * Calcula total (média ponderada)
   */
  private calculateTotal(scores: Partial<ImageScore>): number {
    const weights = {
      realismo: 0.30,
      estetica: 0.25,
      alinhamento: 0.20,
      limpeza: 0.15,
      caraDeIA: 0.10 // Invertido: (10 - caraDeIA) * 0.10
    }

    let total = 0
    total += (scores.realismo || 5) * weights.realismo
    total += (scores.estetica || 5) * weights.estetica
    total += (scores.alinhamento || 5) * weights.alinhamento
    total += (scores.limpeza || 5) * weights.limpeza
    total += (10 - (scores.caraDeIA || 5)) * weights.caraDeIA

    if (scores.legibilidade !== undefined) {
      total += scores.legibilidade * 0.10
    }

    return this.clampScore(total)
  }

  /**
   * Clamp score entre 0 e 10
   */
  private clampScore(score: number): number {
    return Math.max(0, Math.min(10, score))
  }
}

