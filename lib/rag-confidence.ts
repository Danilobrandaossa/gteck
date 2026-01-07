/**
 * 🛡️ RAG CONFIDENCE - Cálculo de confiança do RAG
 * 
 * Responsabilidades:
 * - Calcular confiança baseada em métricas do RAG
 * - Determinar se resposta deve ser gerada ou fallback
 * - Prevenir alucinações (respostas sem evidência)
 * 
 * REGRAS:
 * - Nunca inventar informação fora do contexto
 * - Se confiança baixa → fallback (sem chamar provider)
 * - Determinístico e auditável
 */

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface ConfidenceResult {
  level: ConfidenceLevel
  score: number // 0..1
  reasons: string[]
  thresholds: {
    soft: number
    hard: number
    hardTop: number
    minChunks: number
  }
}

export interface ConfidenceInputs {
  chunksSelected: number
  averageSimilarity: number
  topSimilarity?: number // Similaridade do chunk mais relevante
  diversityApplied?: boolean
  rerankApplied?: boolean
}

export class RagConfidence {
  private static readonly DEFAULT_SOFT_THRESHOLD = parseFloat(process.env.RAG_CONF_SOFT_THRESHOLD || '0.75')
  private static readonly DEFAULT_HARD_THRESHOLD = parseFloat(process.env.RAG_CONF_HARD_THRESHOLD || '0.68')
  private static readonly DEFAULT_HARD_TOP_THRESHOLD = parseFloat(process.env.RAG_CONF_HARD_TOP_THRESHOLD || '0.70')
  private static readonly DEFAULT_MIN_CHUNKS = parseInt(process.env.RAG_CONF_MIN_CHUNKS || '2', 10)

  /**
   * Calcula confiança do RAG baseado em métricas
   */
  static computeConfidence(inputs: ConfidenceInputs): ConfidenceResult {
    const {
      chunksSelected,
      averageSimilarity,
      topSimilarity,
      diversityApplied = false,
      rerankApplied = false
    } = inputs

    const thresholds = {
      soft: this.DEFAULT_SOFT_THRESHOLD,
      hard: this.DEFAULT_HARD_THRESHOLD,
      hardTop: this.DEFAULT_HARD_TOP_THRESHOLD,
      minChunks: this.DEFAULT_MIN_CHUNKS
    }

    const reasons: string[] = []
// @ts-ignore
    let _level: ConfidenceLevel = 'low'
    let score = 0

    // 1. Se não há chunks selecionados → LOW
    if (chunksSelected === 0) {
      reasons.push('No chunks selected')
      score = 0
      return {
        level: 'low',
        score,
        reasons,
        thresholds
      }
    }

    // 2. Se similaridade média abaixo do threshold hard → LOW
    if (averageSimilarity < thresholds.hard) {
      reasons.push(`Average similarity (${averageSimilarity.toFixed(3)}) below hard threshold (${thresholds.hard})`)
      score = averageSimilarity / thresholds.hard // Normalizar para 0..1
      return {
        level: 'low',
        score,
        reasons,
        thresholds
      }
    }

    // 3. Se topSimilarity fornecido e abaixo do threshold hard top → LOW
    if (topSimilarity !== undefined && topSimilarity < thresholds.hardTop) {
      reasons.push(`Top similarity (${topSimilarity.toFixed(3)}) below hard top threshold (${thresholds.hardTop})`)
      score = Math.min(averageSimilarity / thresholds.hard, topSimilarity / thresholds.hardTop)
      return {
        level: 'low',
        score,
        reasons,
        thresholds
      }
    }

    // 4. Se similaridade média >= soft threshold E chunks >= minChunks → HIGH
    if (averageSimilarity >= thresholds.soft && chunksSelected >= thresholds.minChunks) {
      reasons.push(`High confidence: avg similarity (${averageSimilarity.toFixed(3)}) >= soft threshold (${thresholds.soft}) and chunks (${chunksSelected}) >= min (${thresholds.minChunks})`)
      if (rerankApplied) {
        reasons.push('Rerank applied (improves quality)')
      }
      if (diversityApplied) {
        reasons.push('Diversity applied (reduces redundancy)')
      }
      
      // Score baseado em quão acima do threshold está
      const similarityScore = Math.min(1, (averageSimilarity - thresholds.soft) / (1 - thresholds.soft))
      const chunksScore = Math.min(1, chunksSelected / (thresholds.minChunks * 2)) // Bonus se tiver mais chunks
      score = (similarityScore * 0.7 + chunksScore * 0.3)
      
      return {
        level: 'high',
        score: Math.min(1, score),
        reasons,
        thresholds
      }
    }

    // 5. Caso contrário → MEDIUM
    reasons.push(`Medium confidence: avg similarity (${averageSimilarity.toFixed(3)}) between hard (${thresholds.hard}) and soft (${thresholds.soft}) thresholds`)
    if (chunksSelected < thresholds.minChunks) {
      reasons.push(`Chunks (${chunksSelected}) below minimum (${thresholds.minChunks})`)
    }
    if (rerankApplied) {
      reasons.push('Rerank applied')
    }
    if (diversityApplied) {
      reasons.push('Diversity applied')
    }

    // Score para medium: entre hard e soft
    const similarityScore = (averageSimilarity - thresholds.hard) / (thresholds.soft - thresholds.hard)
    const chunksScore = Math.min(1, chunksSelected / thresholds.minChunks)
    score = (similarityScore * 0.6 + chunksScore * 0.4) * 0.7 // Max 0.7 para medium

    return {
      level: 'medium',
      score: Math.max(0.3, Math.min(0.7, score)),
      reasons,
      thresholds
    }
  }

  /**
   * Verifica se deve chamar provider (não LOW)
   */
  static shouldCallProvider(confidence: ConfidenceResult): boolean {
    return confidence.level !== 'low'
  }

  /**
   * Verifica se deve usar fallback (LOW)
   */
  static shouldUseFallback(confidence: ConfidenceResult): boolean {
    return confidence.level === 'low'
  }

  /**
   * Verifica se deve pedir clarificação (MEDIUM, opcional)
   */
  static shouldRequestClarification(confidence: ConfidenceResult): boolean {
    return confidence.level === 'medium'
  }
}











