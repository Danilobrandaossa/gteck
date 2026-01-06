/**
 * 🧪 TUNING EXPERIMENTS - FASE 8 ETAPA 5 (OPCIONAL)
 * 
 * Suporte para experimentos controlados de tuning via feature flags
 */

export interface ExperimentConfig {
  experimentId: string
  description: string
  startDate: string
  endDate?: string
  targetOrganizations?: string[]
  targetSites?: string[]
  trafficPercentage?: number // 0-100
  config: Record<string, any>
}

export class TuningExperiments {
  /**
   * Verifica se um tenant está em um experimento ativo
   */
  static isInExperiment(
    organizationId: string,
    siteId: string,
    userId?: string
  ): boolean {
    const experimentId = process.env.RAG_EXPERIMENT_ID
    if (!experimentId) return false

    const configStr = process.env.RAG_EXPERIMENT_CONFIG
    if (!configStr) return false

    try {
      const experiment: ExperimentConfig = JSON.parse(configStr)

      // Verificar se experimento está ativo
      const now = new Date()
      const startDate = new Date(experiment.startDate)
      if (now < startDate) return false

      if (experiment.endDate) {
        const endDate = new Date(experiment.endDate)
        if (now > endDate) return false
      }

      // Verificar target organizations
      if (
        experiment.targetOrganizations &&
        !experiment.targetOrganizations.includes(organizationId)
      ) {
        return false
      }

      // Verificar target sites
      if (experiment.targetSites && !experiment.targetSites.includes(siteId)) {
        return false
      }

      // Verificar traffic percentage
      if (experiment.trafficPercentage !== undefined) {
        // Hash consistente para mesmo tenant sempre ser A ou B
        const hash = this.hashString(`${organizationId}-${siteId}-${userId || ''}`)
        const percentage = hash % 100
        if (percentage >= experiment.trafficPercentage) {
          return false
        }
      }

      return true
    } catch (error) {
      console.error('[TuningExperiments] Error parsing config:', error)
      return false
    }
  }

  /**
   * Obtém configuração de experimento
   */
  static getExperimentConfig(
    organizationId: string,
    siteId: string,
    userId?: string
  ): ExperimentConfig | null {
    if (!this.isInExperiment(organizationId, siteId, userId)) {
      return null
    }

    const configStr = process.env.RAG_EXPERIMENT_CONFIG
    if (!configStr) return null

    try {
      return JSON.parse(configStr)
    } catch (error) {
      console.error('[TuningExperiments] Error parsing config:', error)
      return null
    }
  }

  /**
   * Aplica config de experimento sobre config base
   */
  static applyExperimentConfig<T extends Record<string, any>>(
    baseConfig: T,
    experimentConfig: ExperimentConfig | null
  ): T {
    if (!experimentConfig) return baseConfig

    return {
      ...baseConfig,
      ...experimentConfig.config
    }
  }

  /**
   * Hash simples para consistência de A/B
   */
  private static hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Valida configuração de experimento
   */
  static validateExperimentConfig(config: ExperimentConfig): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!config.experimentId) {
      errors.push('experimentId is required')
    }

    if (!config.description) {
      errors.push('description is required')
    }

    if (!config.startDate) {
      errors.push('startDate is required')
    } else {
      try {
        new Date(config.startDate)
      } catch {
        errors.push('startDate must be valid ISO date')
      }
    }

    if (config.endDate) {
      try {
        const end = new Date(config.endDate)
        const start = new Date(config.startDate)
        if (end <= start) {
          errors.push('endDate must be after startDate')
        }
      } catch {
        errors.push('endDate must be valid ISO date')
      }
    }

    if (
      config.trafficPercentage !== undefined &&
      (config.trafficPercentage < 0 || config.trafficPercentage > 100)
    ) {
      errors.push('trafficPercentage must be between 0 and 100')
    }

    if (!config.config || Object.keys(config.config).length === 0) {
      errors.push('config must contain at least one parameter')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

/**
 * Exemplo de uso no RAG Service:
 * 
 * const experimentConfig = TuningExperiments.getExperimentConfig(
 *   organizationId,
 *   siteId,
 *   userId
 * )
 * 
 * const ragConfig = TuningExperiments.applyExperimentConfig(
 *   baseRagConfig,
 *   experimentConfig
 * )
 * 
 * // Registrar no context
 * const context = {
 *   ...otherContext,
 *   experimentId: experimentConfig?.experimentId || null
 * }
 */








