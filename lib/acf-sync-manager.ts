// Gerenciador de Sincronização ACF para Pressel
export interface ACFField {
  name: string
  label: string
  type: string
  required: boolean
  choices?: { [key: string]: string }
  default_value?: any
  placeholder?: string
  instructions?: string
  conditional_logic?: any
  wrapper?: {
    width?: string
    class?: string
    id?: string
  }
}

export interface ACFFieldGroup {
  id: number
  title: string
  fields: ACFField[]
  location: any[]
  menu_order: number
  position: string
  style: string
  label_placement: string
  instruction_placement: string
  hide_on_screen: string[]
  active: boolean
}

export interface PresselModel {
  id: number
  name: string
  slug: string
  description: string
  acf_fields: ACFFieldGroup[]
  template: string
  performance: {
    usage_count: number
    conversion_rate: number
    revenue_generated: number
  }
  seo: {
    focus_keywords: string[]
    meta_title: string
    meta_description: string
  }
}

export interface ACFSyncResult {
  fieldGroups: ACFFieldGroup[]
  presselModels: PresselModel[]
  customFields: ACFField[]
  templates: Array<{
    name: string
    file: string
    fields: string[]
  }>
  performance: {
    totalFields: number
    activeGroups: number
    usedFields: number
  }
}

export class ACFSyncManager {
  private baseUrl: string
  private username: string
  private password: string

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl
    this.username = username
    this.password = password
  }

  // Sincronizar grupos de campos ACF
  async syncACFFieldGroups(): Promise<ACFFieldGroup[]> {
    try {
      console.log('🔄 Sincronizando grupos de campos ACF...')
      
      const response = await fetch(`${this.baseUrl}/wp-json/acf/v3/field-groups`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao buscar grupos ACF: ${response.status}`)
      }

      const fieldGroups = await response.json()
      console.log(`✅ ${fieldGroups.length} grupos ACF sincronizados`)
      
      return fieldGroups
    } catch (error) {
      console.error('❌ Erro ao sincronizar grupos ACF:', error)
      throw error
    }
  }

  // Sincronizar campos ACF específicos
  async syncACFFields(fieldGroupId: number): Promise<ACFField[]> {
    try {
      console.log(`🔄 Sincronizando campos do grupo ${fieldGroupId}...`)
      
      const response = await fetch(`${this.baseUrl}/wp-json/acf/v3/fields?field_group=${fieldGroupId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao buscar campos ACF: ${response.status}`)
      }

      const fields = await response.json()
      console.log(`✅ ${fields.length} campos ACF sincronizados`)
      
      return fields
    } catch (error) {
      console.error('❌ Erro ao sincronizar campos ACF:', error)
      throw error
    }
  }

  // Sincronizar modelos Pressel
  async syncPresselModels(): Promise<PresselModel[]> {
    try {
      console.log('🔄 Sincronizando modelos Pressel...')
      
      // Buscar posts do tipo 'pressel_model'
      const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/pressel_model`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao buscar modelos Pressel: ${response.status}`)
      }

      const models = await response.json()
      console.log(`✅ ${models.length} modelos Pressel sincronizados`)
      
      return models.map((model: any) => ({
        id: model.id,
        name: model.title.rendered,
        slug: model.slug,
        description: model.content.rendered,
        acf_fields: model.acf_fields || [],
        template: model.template || 'default',
        performance: {
          usage_count: model.usage_count || 0,
          conversion_rate: model.conversion_rate || 0,
          revenue_generated: model.revenue_generated || 0
        },
        seo: {
          focus_keywords: model.focus_keywords || [],
          meta_title: model.meta_title || '',
          meta_description: model.meta_description || ''
        }
      }))
    } catch (error) {
      console.error('❌ Erro ao sincronizar modelos Pressel:', error)
      throw error
    }
  }

  // Sincronizar templates customizados
  async syncCustomTemplates(): Promise<Array<{name: string, file: string, fields: string[]}>> {
    try {
      console.log('🔄 Sincronizando templates customizados...')
      
      // Buscar templates do tema
      const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/templates`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao buscar templates: ${response.status}`)
      }

      const templates = await response.json()
      console.log(`✅ ${templates.length} templates sincronizados`)
      
      return templates.map((template: any) => ({
        name: template.title.rendered,
        file: template.slug,
        fields: template.acf_fields || []
      }))
    } catch (error) {
      console.error('❌ Erro ao sincronizar templates:', error)
      throw error
    }
  }

  // Sincronizar todos os dados ACF
  async syncAllACFData(): Promise<ACFSyncResult> {
    console.log('🚀 Iniciando sincronização completa de dados ACF...')
    
    try {
      const [fieldGroups, presselModels, customTemplates] = await Promise.all([
        this.syncACFFieldGroups(),
        this.syncPresselModels(),
        this.syncCustomTemplates()
      ])

      // Buscar campos de cada grupo
      const allFields = await Promise.all(
        fieldGroups.map(group => this.syncACFFields(group.id))
      )

      const customFields = allFields.flat()

      const result: ACFSyncResult = {
        fieldGroups,
        presselModels,
        customFields,
        templates: customTemplates,
        performance: {
          totalFields: customFields.length,
          activeGroups: fieldGroups.filter(group => group.active).length,
          usedFields: customFields.filter(field => field.required).length
        }
      }

      console.log('✅ Sincronização completa de dados ACF concluída!')
      console.log(`📊 Estatísticas:`)
      console.log(`   - Grupos ACF: ${fieldGroups.length}`)
      console.log(`   - Campos: ${customFields.length}`)
      console.log(`   - Modelos Pressel: ${presselModels.length}`)
      console.log(`   - Templates: ${customTemplates.length}`)
      
      return result
    } catch (error) {
      console.error('❌ Erro na sincronização completa de dados ACF:', error)
      throw error
    }
  }

  // Analisar performance dos campos ACF
  async analyzeACFPerformance(): Promise<{
    mostUsedFields: Array<{name: string, usage: number}>
    conversionFields: Array<{name: string, conversion: number}>
    revenueFields: Array<{name: string, revenue: number}>
  }> {
    try {
      console.log('📊 Analisando performance dos campos ACF...')
      
      // Implementar análise de performance
      const mostUsedFields = []
      const conversionFields = []
      const revenueFields = []
      
      return {
        mostUsedFields,
        conversionFields,
        revenueFields
      }
    } catch (error) {
      console.error('❌ Erro ao analisar performance ACF:', error)
      throw error
    }
  }

  // Otimizar campos ACF para conversão
  async optimizeACFForConversion(): Promise<{
    recommendations: string[]
    optimizedFields: ACFField[]
    performanceGains: number
  }> {
    try {
      console.log('⚡ Otimizando campos ACF para conversão...')
      
      // Implementar otimizações
      const recommendations = []
      const optimizedFields = []
      const performanceGains = 0
      
      return {
        recommendations,
        optimizedFields,
        performanceGains
      }
    } catch (error) {
      console.error('❌ Erro ao otimizar campos ACF:', error)
      throw error
    }
  }
}








