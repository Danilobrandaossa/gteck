/**
 * Mapeador de Schema JSON -> ACF
 * Usa schema_map.json de cada modelo para converter JSON em campos ACF
 */

import fs from 'fs'
import path from 'path'

export interface SchemaMap {
  modelo: string
  template_file: string
  template_name: string
  version: string
  descricao: string
  campos: Record<string, {
    json_key: string
    acf_field: string
    tipo: string
    obrigatorio: boolean
    sub_fields?: Record<string, any>
  }>
}

export class PresselSchemaMapper {
  private static instance: PresselSchemaMapper
  private schemaMaps: Map<string, SchemaMap> = new Map()

  static getInstance(): PresselSchemaMapper {
    if (!PresselSchemaMapper.instance) {
      PresselSchemaMapper.instance = new PresselSchemaMapper()
    }
    return PresselSchemaMapper.instance
  }

  /**
   * Carrega schema map de um modelo
   */
  loadSchemaMap(modelo: string): SchemaMap | null {
    if (this.schemaMaps.has(modelo)) {
      return this.schemaMaps.get(modelo)!
    }

    try {
      const schemaPath = path.join(process.cwd(), 'uploads', 'pressel-models', modelo, 'schema_map.json')
      
      if (!fs.existsSync(schemaPath)) {
        return null
      }

      const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
      const schema: SchemaMap = JSON.parse(schemaContent)
      
      this.schemaMaps.set(modelo, schema)
      return schema
    } catch (error) {
      console.error(`Erro ao carregar schema map para ${modelo}:`, error)
      return null
    }
  }

  /**
   * Mapeia campos JSON para formato ACF usando schema map
   */
  mapToACF(jsonData: any, modelo: string): { acfFields: any; errors: string[]; warnings: string[] } {
    const schema = this.loadSchemaMap(modelo)
    const acfFields: any = {}
    const errors: string[] = []
    const warnings: string[] = []

    if (!schema) {
      // Fallback: usar campos diretamente
      warnings.push(`Schema map não encontrado para ${modelo}, usando mapeamento direto`)
      return {
        acfFields: jsonData.acf_fields || {},
        errors,
        warnings
      }
    }

    const jsonFields = jsonData.acf_fields || {}

    // Mapear cada campo do schema
    for (const [fieldKey, fieldConfig] of Object.entries(schema.campos)) {
      const jsonKey = fieldConfig.json_key
      const acfField = fieldConfig.acf_field
      const jsonValue = jsonFields[jsonKey]

      // Validar campo obrigatório
      if (fieldConfig.obrigatorio && (jsonValue === undefined || jsonValue === null || jsonValue === '')) {
        errors.push(`Campo obrigatório ausente: ${jsonKey} (${acfField})`)
        continue
      }

      // Pular campos vazios opcionais
      if (jsonValue === undefined || jsonValue === null || jsonValue === '') {
        continue
      }

      // Tratamento especial para repeaters
      if (fieldConfig.tipo === 'repeater' && Array.isArray(jsonValue)) {
        const repeaterResult = this.mapRepeaterField(
          acfField,
          jsonValue,
          fieldConfig.sub_fields || {}
        )
        Object.assign(acfFields, repeaterResult.fields)
        if (repeaterResult.errors.length > 0) {
          errors.push(...repeaterResult.errors)
        }
      } else {
        // Campo simples: converter tipo se necessário
        acfFields[acfField] = this.convertFieldType(jsonValue, fieldConfig.tipo)
      }
    }

    // Adicionar campos extras que não estão no schema (com warning)
    for (const jsonKey of Object.keys(jsonFields)) {
      const schemaField = Object.values(schema.campos).find(f => f.json_key === jsonKey)
      if (!schemaField) {
        warnings.push(`Campo não mapeado no schema: ${jsonKey}`)
        acfFields[jsonKey] = jsonFields[jsonKey]
      }
    }

    return { acfFields, errors, warnings }
  }

  private mapRepeaterField(
    fieldName: string,
    arrayValue: any[],
    subFields: Record<string, any>
  ): { fields: any; errors: string[] } {
    const fields: any = {}
    const errors: string[] = []

    // Salvar contador do repeater
    fields[fieldName] = arrayValue.length.toString()

    // Mapear cada item do array
    arrayValue.forEach((item, index) => {
      for (const [subFieldKey, subFieldConfig] of Object.entries(subFields)) {
        const acfSubField = `${fieldName}_${index}_${subFieldConfig.acf_field}`
        const itemValue = item[subFieldConfig.json_key]

        if (itemValue !== undefined && itemValue !== null && itemValue !== '') {
          fields[acfSubField] = this.convertFieldType(itemValue, subFieldConfig.tipo)
        } else if (subFieldConfig.obrigatorio) {
          errors.push(`Sub-campo obrigatório ausente: ${fieldName}[${index}].${subFieldConfig.json_key}`)
        }
      }
    })

    return { fields, errors }
  }

  private convertFieldType(value: any, tipo: string): any {
    switch (tipo) {
      case 'number':
      case 'range':
        return typeof value === 'number' ? value : parseFloat(value) || 0
      case 'true_false':
      case 'checkbox':
        return Boolean(value)
      case 'date':
      case 'date_time':
        return typeof value === 'string' ? value : new Date(value).toISOString()
      case 'url':
      case 'link':
        return typeof value === 'string' ? value : String(value)
      default:
        return value
    }
  }

  /**
   * Valida campos obrigatórios do schema
   */
  validateRequiredFields(jsonData: any, modelo: string): { valid: boolean; missing: string[] } {
    const schema = this.loadSchemaMap(modelo)
    
    if (!schema) {
      return { valid: true, missing: [] } // Sem schema = não validar
    }

    const jsonFields = jsonData.acf_fields || {}
    const missing: string[] = []

    for (const [fieldKey, fieldConfig] of Object.entries(schema.campos)) {
      if (fieldConfig.obrigatorio) {
        const jsonValue = jsonFields[fieldConfig.json_key]
        if (jsonValue === undefined || jsonValue === null || jsonValue === '') {
          missing.push(fieldConfig.json_key)
        }
      }
    }

    return {
      valid: missing.length === 0,
      missing
    }
  }
}



