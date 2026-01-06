/**
 * Sistema Unificado de Detecção de Modelos Pressel
 * Suporta V1, V4 e futuros modelos
 */

import { ModelIdentifier } from './model-identifier'
import { PresselLogger } from './pressel-logger'

export interface DetectedModelResult {
  modelo: string                    // V1, V4, etc.
  template_file: string             // pressel-oficial.php, V4.php, etc.
  template_name?: string            // "Pressel Oficial", "Pressel V4", etc.
  acf_group?: string               // Grupo ACF principal
  confidence: number                // 0.0 a 1.0
  method: 'explicit' | 'heuristic'  // Como foi detectado
  logs: any[]                      // Logs relacionados
}

export class PresselModelDetector {
  private logger: PresselLogger

  constructor() {
    this.logger = PresselLogger.getInstance()
  }

  /**
   * Detecta o modelo a partir do JSON usando lógica unificada
   * Prioridade:
   * 1. pressel.model ou page_model explícito
   * 2. template_name no JSON
   * 3. Heurísticas baseadas em campos ACF
   */
  detectModel(jsonData: any): DetectedModelResult {
    this.logger.clearLogs()

    // Método 1: Verificar pressel.model ou page_model explícito
    const explicitModel = this.detectExplicitModel(jsonData)
    if (explicitModel) {
      return explicitModel
    }

    // Método 2: Verificar template_name
    const templateNameModel = this.detectByTemplateName(jsonData)
    if (templateNameModel) {
      return templateNameModel
    }

    // Método 3: Heurísticas baseadas em campos ACF
    const heuristicModel = this.detectByHeuristics(jsonData)
    if (heuristicModel) {
      return heuristicModel
    }

    // Se nenhum método funcionou
    this.logger.erro('PS-JSON-003', 'Não foi possível identificar o modelo a partir do JSON', {
      campos_presentes: Object.keys(jsonData.acf_fields || {}),
      estrutura_json: Object.keys(jsonData)
    })

    throw new Error('PS-JSON-003: Não foi possível identificar o modelo')
  }

  private detectExplicitModel(jsonData: any): DetectedModelResult | null {
    // Verificar pressel.model (nova estrutura)
    let modelValue = jsonData.pressel?.model || jsonData.page_model

    if (!modelValue) {
      return null
    }

    // Normalizar: "modelo_v1" -> "V1", "V1" -> "V1"
    const normalized = this.normalizeModelName(modelValue)
    const modelIdentifier = ModelIdentifier.getInstance()
    const signature = modelIdentifier.getModel(normalized)

    if (!signature) {
      this.logger.aviso('PS-JSON-003', `Modelo explícito '${modelValue}' não reconhecido`, {
        valor_original: modelValue,
        valor_normalizado: normalized
      })
      return null
    }

    this.logger.sucesso('PS-MAP-001', `Modelo detectado explicitamente: ${normalized}`, {
      modelo: normalized,
      template_file: signature.templateFile,
      method: 'explicit'
    })

    return {
      modelo: normalized,
      template_file: signature.templateFile,
      template_name: this.getTemplateName(normalized),
      confidence: 1.0,
      method: 'explicit',
      logs: this.logger.getAllLogs()
    }
  }

  private detectByTemplateName(jsonData: any): DetectedModelResult | null {
    const templateName = jsonData.pressel?.template_name || jsonData.page_template

    if (!templateName) {
      return null
    }

    // Mapear template_name para modelo
    const templateToModel: Record<string, string> = {
      'pressel-oficial.php': 'V1',
      'Pressel Oficial': 'V1',
      'V4.php': 'V4',
      'Pressel V4': 'V4',
      'pressel-v4.php': 'V4'
    }

    const modelo = templateToModel[templateName]

    if (!modelo) {
      return null
    }

    const modelIdentifier = ModelIdentifier.getInstance()
    const signature = modelIdentifier.getModel(modelo)

    if (!signature) {
      return null
    }

    this.logger.sucesso('PS-MAP-001', `Modelo detectado via template_name: ${modelo}`, {
      template_name: templateName,
      modelo: modelo,
      template_file: signature.templateFile
    })

    return {
      modelo,
      template_file: signature.templateFile,
      template_name: this.getTemplateName(modelo),
      confidence: 0.9,
      method: 'heuristic',
      logs: this.logger.getAllLogs()
    }
  }

  private detectByHeuristics(jsonData: any): DetectedModelResult | null {
    const acfFields = jsonData.acf_fields || {}
    const modelIdentifier = ModelIdentifier.getInstance()

    // Testar cada modelo conhecido
    const modelos = ['V1', 'V4', 'V3', 'V5', 'B1']
    let bestMatch: { modelo: string; score: number; signature: any } | null = null

    for (const modelo of modelos) {
      const signature = modelIdentifier.getModel(modelo)
      if (!signature) continue

      const score = this.calculateMatchScore(acfFields, signature)
      
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { modelo, score, signature }
      }
    }

    if (bestMatch && bestMatch.score > 0.3) {
      this.logger.sucesso('PS-MAP-001', `Modelo detectado via heurísticas: ${bestMatch.modelo}`, {
        modelo: bestMatch.modelo,
        confidence: bestMatch.score,
        template_file: bestMatch.signature.templateFile
      })

      return {
        modelo: bestMatch.modelo,
        template_file: bestMatch.signature.templateFile,
        template_name: this.getTemplateName(bestMatch.modelo),
        confidence: bestMatch.score,
        method: 'heuristic',
        logs: this.logger.getAllLogs()
      }
    }

    return null
  }

  private calculateMatchScore(acfFields: any, signature: any): number {
    const fields = Object.keys(acfFields)
    let score = 0
    let totalWeight = 0

    // Campos únicos têm peso maior
    signature.uniqueFields?.forEach((field: string) => {
      totalWeight += 2
      if (fields.includes(field)) {
        score += 2
      }
    })

    // Campos comuns têm peso menor
    signature.commonFields?.forEach((field: string) => {
      totalWeight += 1
      if (fields.includes(field)) {
        score += 1
      }
    })

    // Padrões regex também contam
    signature.fieldPatterns?.forEach((pattern: RegExp) => {
      fields.forEach(field => {
        if (pattern.test(field)) {
          totalWeight += 1
          score += 1
        }
      })
    })

    return totalWeight > 0 ? score / totalWeight : 0
  }

  private normalizeModelName(value: string): string {
    // "modelo_v1" -> "V1"
    // "modelo_v4" -> "V4"
    // "V1" -> "V1"
    const cleaned = value.toLowerCase().replace(/modelo[_ ]?/g, '').trim()
    return cleaned.toUpperCase()
  }

  private getTemplateName(modelo: string): string {
    const templateNames: Record<string, string> = {
      'V1': 'Pressel Oficial',
      'V4': 'Pressel V4',
      'V3': 'Pressel V3',
      'V5': 'Pressel V5'
    }
    return templateNames[modelo] || modelo
  }
}
