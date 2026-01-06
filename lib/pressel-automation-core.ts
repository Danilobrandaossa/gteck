/**
 * Sistema de Automação Pressel - Identificação Automática de Modelos
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ModelIdentifier } from './model-identifier'
import { PresselModelDetector } from './pressel-model-detector'
import { PresselLogger } from './pressel-logger'
import { PresselErrorHandler } from './pressel-error-handler'
import { PresselSchemaMapper } from './pressel-schema-mapper'

// Interface para modelo detectado
interface DetectedModel {
  modelName: string
  template: string
  acfFields: any[]
  confidence: number
  matchedFields: string[]
}

// Interface para resultado da criação
interface PageCreationResult {
  success: boolean
  pageId?: number
  pageUrl?: string
  editUrl?: string
  modelUsed?: string
  fieldsProcessed?: number
  error?: string
  isUpdate?: boolean  // Indica se a página já existia
}

export class PresselAutomationService {
  private static instance: PresselAutomationService
  private models: Map<string, any> = new Map()
  private logger: PresselLogger
  private errorHandler: PresselErrorHandler

  static getInstance(): PresselAutomationService {
    if (!PresselAutomationService.instance) {
      PresselAutomationService.instance = new PresselAutomationService()
    }
    return PresselAutomationService.instance
  }

  constructor() {
    this.logger = PresselLogger.getInstance()
    this.errorHandler = PresselErrorHandler.getInstance()
  }

  // Carregar modelos disponíveis
  async loadModels(): Promise<void> {
    try {
      const models = ['V1', 'V3', 'V4', 'V5', 'B1']
      
      for (const modelName of models) {
        const modelConfig = await this.loadModelConfig(modelName)
        if (modelConfig) {
          this.models.set(modelName, modelConfig)
        }
      }
      
      console.log(`✅ Modelos carregados: ${Array.from(this.models.keys()).join(', ')}`)
    } catch (error) {
      console.error('❌ Erro ao carregar modelos:', error)
    }
  }

  // Carregar configuração de um modelo específico
  private async loadModelConfig(modelName: string): Promise<any> {
    try {
      // Tentar carregar do banco de dados primeiro
      const dbModel = await db.template.findFirst({
        where: { slug: `modelo-${modelName.toLowerCase()}` }
      })
      
      if (dbModel) {
        return {
          name: dbModel.name,
          slug: dbModel.slug,
          content: dbModel.content,
          fields: JSON.parse(dbModel.fields),
          modelName: modelName
        }
      }
      
      // Fallback: carregar do arquivo de configuração
      const fs = require('fs')
      const path = require('path')
      const configPath = path.join(process.cwd(), 'uploads', 'pressel-models', modelName, 'model-config.json')
      
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf8')
        return JSON.parse(configContent)
      }
      
      return null
    } catch (error) {
      console.error(`❌ Erro ao carregar modelo ${modelName}:`, error)
      return null
    }
  }

  // Obter um modelo específico
  getModel(modelName: string): any | undefined {
    return this.models.get(modelName)
  }

  // Obter todos os modelos carregados
  getAllModels(): Map<string, any> {
    return this.models
  }

  // Verificar se um modelo está carregado
  hasModel(modelName: string): boolean {
    return this.models.has(modelName)
  }

  // Identificar modelo automaticamente baseado no JSON
  async identifyModel(jsonData: any): Promise<DetectedModel | null> {
    this.logger.sucesso('PS-MAP-001', 'Iniciando detecção de modelo', {
      campos_json: Object.keys(jsonData),
      tem_page_model: !!jsonData.page_model,
      tem_pressel_model: !!jsonData.pressel?.model
    })

    try {
      // Usar novo detector unificado
      const detector = new PresselModelDetector()
      const result = detector.detectModel(jsonData)

      if (!result) {
        this.logger.erro('PS-JSON-003', 'Não foi possível identificar o modelo', {
          campos_presentes: Object.keys(jsonData.acf_fields || {})
        })
        return null
      }

      const detectedModel: DetectedModel = {
        modelName: result.modelo,
        template: result.template_file,
        acfFields: this.getModelFields(result.modelo) || [],
        confidence: result.confidence,
        matchedFields: Object.keys(jsonData.acf_fields || {})
      }

      this.logger.sucesso('PS-MAP-001', `Modelo identificado: ${result.modelo}`, {
        modelo: result.modelo,
        template_file: result.template_file,
        template_name: result.template_name,
        confidence: result.confidence,
        method: result.method
      })

      console.log(`✅ Modelo identificado: ${detectedModel.modelName} (confiança: ${Math.round(detectedModel.confidence * 100)}%)`)
      console.log(`🔗 Template: ${detectedModel.template}`)
      console.log(`📊 Campos correspondentes: ${detectedModel.matchedFields.length}`)
      
      return detectedModel
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      this.logger.erro('PS-JSON-003', `Erro ao detectar modelo: ${errorMessage}`, {
        erro: errorMessage
      })
      return null
    }
  }

  private getModelFields(modelo: string): string[] {
    const modelIdentifier = ModelIdentifier.getInstance()
    const signature = modelIdentifier.getModel(modelo)
    return signature?.uniqueFields || []
  }

  // Obter template padrão baseado no nome do modelo
  private getDefaultTemplate(modelName: string): string {
    const templateMap: Record<string, string> = {
      'V1': 'pressel-oficial.php',
      'V2': 'presell-enus.php',
      'V3': 'presell-minimal.php',
      'V4': 'V4.php',
      'V5': 'presell-affiliate.php',
      'B1': 'modelo-b1.php'
    }
    
    return templateMap[modelName] || 'page.php'
  }

  // Calcular score de compatibilidade do modelo
  private calculateModelScore(jsonFields: string[], modelConfig: any): number {
    if (!modelConfig.acfFields) return 0
    
    let totalFields = 0
    let matchedFields = 0
    
    modelConfig.acfFields.forEach((group: any) => {
      group.fields.forEach((field: any) => {
        totalFields++
        if (jsonFields.includes(field.name)) {
          matchedFields++
        }
      })
    })
    
    if (totalFields === 0) return 0
    
    return matchedFields / totalFields
  }

  // Obter campos que fizeram match
  private getMatchedFields(jsonFields: string[], modelConfig: any): string[] {
    const matched: string[] = []
    
    if (!modelConfig.acfFields) return matched
    
    modelConfig.acfFields.forEach((group: any) => {
      group.fields.forEach((field: any) => {
        if (jsonFields.includes(field.name)) {
          matched.push(field.name)
        }
      })
    })
    
    return matched
  }

  // Gerar slug a partir do título
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Aplicar template à página
  private async applyPageTemplate(siteUrl: string, pageId: number, template: string): Promise<void> {
    const username = process.env.WORDPRESS_DEFAULT_USERNAME
    const password = process.env.WORDPRESS_DEFAULT_PASSWORD
    
    if (!username || !password) {
      throw new Error('Credenciais WordPress não configuradas')
    }
    
    const auth = Buffer.from(`${username}:${password}`).toString('base64')
    
    console.log(`🔧 Aplicando template "${template}" na página ${pageId}`)
    
    // Gerar variações do nome do template para tentar
    let templateVariations: string[] = []
    
    // Converter Template Names para nomes de arquivo
    // IMPORTANTE: WordPress pode usar tanto o nome do arquivo quanto o Template Name
    if (template === 'Pressel V4' || template === 'V4' || template === 'V4.php') {
      // Para V4, tentar todas as possibilidades:
      // 1. Nome do arquivo: V4.php
      // 2. Template Name exato: Pressel V4 (pode ser necessário para alguns temas)
      templateVariations = [
        'V4.php',           // Nome do arquivo (mais comum)
        'Pressel V4',       // Template Name exato
        'v4.php',           // Minúsculas
        'pressel-v4.php',   // Com hífen
        'modelo-v4.php'      // Variação alternativa
      ]
    } else if (template === 'Pressel V1' || template === 'Pressel Oficial' || template === 'V1') {
      templateVariations = [
        'pressel-oficial.php',
        'Pressel Oficial',  // Template Name exato
        'pressel-v1.php',
        'pressel_oficial.php',
        'modelo-v1.php'
      ]
    } else {
      // Usar o template diretamente e variações
      templateVariations = [
        template,
        template.toLowerCase(),
        template.replace('.php', '').toLowerCase() + '.php'
      ]
    }
    
    // Tentar cada variação
    for (const templateValue of templateVariations) {
      console.log(`📝 Tentando aplicar: ${templateValue}`)
      
      // Método 1: Usar meta field _wp_page_template (padrão do WordPress REST API)
      let response = await fetch(`${siteUrl}/wp-json/wp/v2/pages/${pageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
          meta: {
            _wp_page_template: templateValue
          }
        })
      })
      
      if (response.ok) {
        // Aguardar um pouco e verificar se realmente foi aplicado
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Verificar se foi realmente aplicado
        const verifyResponse = await fetch(`${siteUrl}/wp-json/wp/v2/pages/${pageId}?context=edit`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`
          }
        })
        
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json()
          const appliedTemplate = verifyData.meta?._wp_page_template || verifyData.page_template
          
          if (appliedTemplate === templateValue || appliedTemplate?.includes('V4')) {
            console.log(`✅ Template aplicado e confirmado via meta field!`)
            console.log(`📄 Template confirmado: ${appliedTemplate}`)
            return
          } else {
            console.log(`⚠️ Template aplicado mas não confirmado (esperado: ${templateValue}, encontrado: ${appliedTemplate || 'nenhum'})`)
            // Continuar tentando outras variações
          }
        } else {
          console.log(`⚠️ Não foi possível verificar template aplicado`)
        }
      }
      
      // Método 2: Tentar com campo direto page_template
      response = await fetch(`${siteUrl}/wp-json/wp/v2/pages/${pageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
          page_template: templateValue
        })
      })
      
      if (response.ok) {
        console.log(`✅ Template aplicado via page_template!`)
        console.log(`📄 Template: ${templateValue}`)
        return
      }
      
      // Método 3: Tentar com PUT
      response = await fetch(`${siteUrl}/wp-json/wp/v2/pages/${pageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
          meta: {
            _wp_page_template: templateValue
          }
        })
      })
      
      if (response.ok) {
        await new Promise(resolve => setTimeout(resolve, 300))
        // Verificar se foi aplicado
        const verifyResponse = await fetch(`${siteUrl}/wp-json/wp/v2/pages/${pageId}?context=edit`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`
          }
        })
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json()
          const appliedTemplate = verifyData.meta?._wp_page_template || verifyData.page_template
          if (appliedTemplate === templateValue || appliedTemplate?.includes('V4')) {
            console.log(`✅ Template aplicado e confirmado via PUT!`)
            console.log(`📄 Template confirmado: ${appliedTemplate}`)
            return
          }
        }
      }
      
      // Método 4: Tentar atualizar diretamente via meta update (última tentativa)
      response = await fetch(`${siteUrl}/wp-json/wp/v2/pages/${pageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
          _wp_page_template: templateValue,  // Campo direto (alguns temas)
          meta: {
            _wp_page_template: templateValue
          }
        })
      })
      
      if (response.ok) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const verifyResponse = await fetch(`${siteUrl}/wp-json/wp/v2/pages/${pageId}?context=edit`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`
          }
        })
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json()
          const appliedTemplate = verifyData.meta?._wp_page_template || verifyData.page_template
          console.log(`📄 Template após tentativa final: ${appliedTemplate || 'nenhum'}`)
          if (appliedTemplate === templateValue || appliedTemplate?.includes('V4')) {
            console.log(`✅ Template aplicado na tentativa final!`)
            return
          }
        }
      }
    }
    
    // Se todos falharam, mostrar erro detalhado
    console.log(`❌ Nenhuma variação de template funcionou`)
    console.log(`📄 Tentativas: ${templateVariations.join(', ')}`)
    throw new Error(`Erro ao aplicar template: nenhuma variação funcionou`)
  }

  // Verificar se o template foi aplicado corretamente
  private async verifyTemplate(siteUrl: string, pageId: number, expectedTemplate: string, auth: string): Promise<boolean> {
    try {
      const response = await fetch(`${siteUrl}/wp-json/wp/v2/pages/${pageId}?context=edit`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`
        }
      })
      
      if (!response.ok) {
        return false
      }
      
      const result = await response.json()
      
      // Verificar múltiplos campos possíveis
      const actualTemplate = result.meta?._wp_page_template || 
                            result._wp_page_template || 
                            result.page_template ||
                            result.template
      
      if (actualTemplate === expectedTemplate || actualTemplate === expectedTemplate.replace('.php', '')) {
        return true
      }
      
      console.log(`🔍 Template esperado: ${expectedTemplate}, Template encontrado: ${actualTemplate || 'nenhum'}`)
      return false
    } catch (error) {
      console.log(`⚠️ Erro ao verificar template: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      return false
    }
  }

  // Verificar se página já existe (idempotência)
  private async findExistingPage(siteUrl: string, slug: string, title?: string): Promise<number | null> {
    const username = process.env.WORDPRESS_DEFAULT_USERNAME
    const password = process.env.WORDPRESS_DEFAULT_PASSWORD
    
    if (!username || !password) {
      return null
    }
    
    const auth = Buffer.from(`${username}:${password}`).toString('base64')
    
    try {
      // Buscar por slug
      const slugResponse = await fetch(`${siteUrl}/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      })
      
      if (slugResponse.ok) {
        const pages = await slugResponse.json()
        if (pages.length > 0) {
          this.logger.aviso('PS-WP-005', `Página existente encontrada por slug: ${slug}`, {
            page_id: pages[0].id,
            page_title: pages[0].title?.rendered || pages[0].title
          })
          return pages[0].id
        }
      }

      // Se título fornecido, buscar por título também
      if (title) {
        const titleResponse = await fetch(`${siteUrl}/wp-json/wp/v2/pages?search=${encodeURIComponent(title)}`, {
          headers: {
            'Authorization': `Basic ${auth}`
          }
        })
        
        if (titleResponse.ok) {
          const pages = await titleResponse.json()
          const exactMatch = pages.find((p: any) => 
            (p.title?.rendered || p.title)?.toLowerCase().trim() === title.toLowerCase().trim()
          )
          if (exactMatch) {
            this.logger.aviso('PS-WP-005', `Página existente encontrada por título: ${title}`, {
              page_id: exactMatch.id,
              page_slug: exactMatch.slug
            })
            return exactMatch.id
          }
        }
      }

      return null
    } catch (error) {
      this.logger.aviso('PS-WP-005', 'Erro ao verificar página existente', {
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      })
      return null
    }
  }

  // Criar página no WordPress
  async createWordPressPage(jsonData: any, siteUrl: string, detectedModel: DetectedModel): Promise<PageCreationResult> {
    console.log(`🚀 Criando página no WordPress usando modelo ${detectedModel.modelName}...`)
    
    try {
      const pageTitle = jsonData.page_title || 'Página Automatizada'
      const pageSlug = jsonData.page_slug || this.generateSlug(pageTitle)
      
      // Verificar se página já existe (idempotência)
      const existingPageId = await this.findExistingPage(siteUrl, pageSlug, pageTitle)
      
      if (existingPageId) {
        this.logger.sucesso('PS-WP-006', `Reutilizando página existente: ${existingPageId}`, {
          page_id: existingPageId,
          page_slug: pageSlug,
          page_title: pageTitle
        })
        // Retornar página existente - será atualizada depois
        return {
          success: true,
          pageId: existingPageId,
          pageUrl: `${siteUrl}/${pageSlug}/`,
          editUrl: `${siteUrl}/wp-admin/post.php?post=${existingPageId}&action=edit`,
          isUpdate: true
        }
      }

      // Preparar dados da página
      const pageData = {
        title: pageTitle,
        content: jsonData.page_content || '',
        status: jsonData.post_status || 'publish',
        slug: pageSlug
      }
      
      // Obter template ANTES de criar a página
      const templateToApply = detectedModel.template || this.getDefaultTemplate(detectedModel.modelName)
      console.log(`🔍 Template a aplicar: ${templateToApply}`)
      console.log(`📊 Detalhes do modelo: ${detectedModel.modelName}`)
      
      // Criar página via WordPress REST API (incluindo template se possível)
      console.log('🚀 Chamando createPageViaAPI...')
      const pageResult = await this.createPageViaAPI(siteUrl, pageData, templateToApply)
      console.log('📊 Resultado do createPageViaAPI:', pageResult)
      
      if (!pageResult.success) {
        return {
          success: false,
          error: pageResult.error
        }
      }
      
      console.log('✅ Página criada com sucesso!')
      console.log(`📄 ID da página: ${pageResult.pageId}`)
      console.log(`📄 URL da página: ${pageResult.pageUrl}`)
      
      // Obter auth para verificação
      const username = process.env.WORDPRESS_DEFAULT_USERNAME
      const password = process.env.WORDPRESS_DEFAULT_PASSWORD
      if (!username || !password) {
        throw new Error('Credenciais WordPress não configuradas')
      }
      const auth = Buffer.from(`${username}:${password}`).toString('base64')
      
      // Aplicar template da página (CRÍTICO - ANTES dos campos ACF)
      if (templateToApply && templateToApply !== 'page.php' && templateToApply !== 'default') {
        console.log(`🔧 Aplicando template automaticamente (CRÍTICO para campos ACF)...`)
        try {
          console.log(`🔧 Tentando aplicar template: ${templateToApply}`)
          await this.applyPageTemplate(siteUrl, pageResult.pageId!, templateToApply)
          
          // Aguardar um pouco para garantir que o WordPress processou o template
          console.log(`⏳ Aguardando processamento do template...`)
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Verificar se o template foi realmente aplicado
          const verified = await this.verifyTemplate(siteUrl, pageResult.pageId!, templateToApply, auth)
          if (verified) {
            console.log(`✅ Template confirmado e aplicado: ${templateToApply}`)
          } else {
            console.log(`⚠️ Template aplicado, mas não confirmado na verificação`)
            console.log(`⚠️ Continuando mesmo assim - campos ACF serão salvos`)
          }
        } catch (templateError) {
          const errorMessage = templateError instanceof Error ? templateError.message : 'Erro desconhecido'
          console.log(`⚠️ Erro ao aplicar template: ${errorMessage}`)
          console.log(`⚠️ Continuando mesmo assim - campos ACF serão salvos`)
          // Continuar mesmo sem template - página foi criada
        }
      } else {
        console.log(`⚠️ Template padrão detectado (${templateToApply}), pulando aplicação`)
      }
      
      // Processar campos ACF (DEPOIS do template ser aplicado)
      console.log('🔧 Processando campos ACF...')
      console.log(`📊 Campos ACF para processar: ${Object.keys(jsonData.acf_fields).length}`)
      console.log(`📋 Campos: ${Object.keys(jsonData.acf_fields).join(', ')}`)
      
      let acfResult = { fieldsProcessed: 0 }
      try {
        acfResult = await this.processACFFields(siteUrl, pageResult.pageId!, jsonData.acf_fields, detectedModel)
        console.log(`✅ Campos ACF processados: ${acfResult.fieldsProcessed}`)
      } catch (acfError) {
        const errorMessage = acfError instanceof Error ? acfError.message : 'Erro desconhecido'
        console.log(`❌ Erro ao processar campos ACF: ${errorMessage}`)
        // Continuar mesmo com erro nos campos ACF
      }
      
      return {
        success: true,
        pageId: pageResult.pageId,
        pageUrl: pageResult.pageUrl,
        editUrl: pageResult.editUrl,
        modelUsed: detectedModel.modelName,
        fieldsProcessed: acfResult.fieldsProcessed
      }
      
    } catch (error) {
      console.error('❌ Erro ao criar página:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  // Criar página via WordPress REST API
  private async createPageViaAPI(siteUrl: string, pageData: any, template?: string): Promise<any> {
    const username = process.env.WORDPRESS_DEFAULT_USERNAME
    const password = process.env.WORDPRESS_DEFAULT_PASSWORD
    
    if (!username || !password) {
      throw new Error('Credenciais WordPress não configuradas')
    }
    
    const auth = Buffer.from(`${username}:${password}`).toString('base64')
    
    // Incluir template na criação se fornecido
    const dataToSend: any = { ...pageData }
    if (template && template !== 'page.php' && template !== 'default') {
      // Tentar definir template durante a criação
      dataToSend.meta = {
        ...dataToSend.meta,
        _wp_page_template: template
      }
      console.log(`📝 Incluindo template na criação: ${template}`)
    }
    
    const response = await fetch(`${siteUrl}/wp-json/wp/v2/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(dataToSend)
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Erro WordPress: ${errorData.message || response.statusText}`)
    }
    
    const result = await response.json()
    
    return {
      success: true,
      pageId: result.id,
      pageUrl: result.link,
      editUrl: `${siteUrl}/wp-admin/post.php?post=${result.id}&action=edit`,
      isUpdate: false
    }
  }

  // Processar campos ACF
  private async processACFFields(siteUrl: string, pageId: number, acfFields: any, detectedModel: DetectedModel): Promise<any> {
    console.log(`🔧 Processando ${Object.keys(acfFields).length} campos ACF...`)
    
    const username = process.env.WORDPRESS_DEFAULT_USERNAME
    const password = process.env.WORDPRESS_DEFAULT_PASSWORD
    const auth = Buffer.from(`${username}:${password}`).toString('base64')
    
    let fieldsProcessed = 0

    // Novo: mapear JSON -> ACF usando schema_map do modelo
    const mapper = PresselSchemaMapper.getInstance()
    const mapResult = mapper.mapToACF({ acf_fields: acfFields }, detectedModel.modelName)

    if (mapResult.errors.length > 0) {
      this.logger.erro('PS-ACF-004', 'Campos obrigatórios ausentes no JSON', { missing: mapResult.errors })
    }
    if (mapResult.warnings.length > 0) {
      this.logger.aviso('PS-ACF-002', 'Campos não mapeados no schema', { warnings: mapResult.warnings })
    }

    const mappedFields = mapResult.acfFields
    
    // Passo 1: Registrar campos ACF automaticamente
    console.log('🔧 Registrando campos ACF automaticamente...')
    await this.registerACFFields(siteUrl, mappedFields, auth)
    
    // Passo 2: Tentar múltiplas abordagens para campos ACF
    const approaches = [
      () => this.updateACFViaWordPressAPI(siteUrl, pageId, mappedFields, auth),
      () => this.updateACFViaMetaAPI(siteUrl, pageId, mappedFields, auth)
    ]
    
    for (const approach of approaches) {
      try {
        const result = await approach()
        if (result.success) {
          fieldsProcessed = result.fieldsProcessed
          break
        }
      } catch (error) {
        console.log(`⚠️ Abordagem falhou: ${error}`)
      }
    }
    
    return { fieldsProcessed }
  }

  // Atualizar ACF via API específica do ACF
  private async updateACFViaACFAPI(siteUrl: string, pageId: number, acfFields: any, auth: string): Promise<any> {
    const response = await fetch(`${siteUrl}/wp-json/acf/v3/pages/${pageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({ fields: acfFields })
    })
    
    if (response.ok) {
      return { success: true, fieldsProcessed: Object.keys(acfFields).length }
    }
    
    throw new Error(`ACF API falhou: ${response.statusText}`)
  }

  // Converter campos repeater para formato ACF
  private convertRepeaterFields(acfFields: any): any {
    const convertedFields: any = {}
    
    Object.entries(acfFields).forEach(([key, value]) => {
      // Campos repeater conhecidos do V4
      if (key === 'benefits' && Array.isArray(value)) {
        // Formato ACF para repeater: primeiro salva o número de linhas
        convertedFields[key] = value.length.toString()
        // Depois salva cada linha com o formato: {field_name}_{row_index}_{sub_field_name}
        value.forEach((item: any, index: number) => {
          convertedFields[`${key}_${index}_benefit_text`] = item.benefit_text || ''
        })
      } else if (key === 'faqs' && Array.isArray(value)) {
        // Formato ACF para repeater: primeiro salva o número de linhas
        convertedFields[key] = value.length.toString()
        // Depois salva cada linha com o formato: {field_name}_{row_index}_{sub_field_name}
        value.forEach((item: any, index: number) => {
          convertedFields[`${key}_${index}_question`] = item.question || ''
          convertedFields[`${key}_${index}_answer`] = item.answer || ''
        })
      } else {
        // Campos normais - manter como está
        convertedFields[key] = value
      }
    })
    
    return convertedFields
  }

  // Atualizar ACF via WordPress REST API com meta fields
  private async updateACFViaWordPressAPI(siteUrl: string, pageId: number, acfFields: any, auth: string): Promise<any> {
    console.log(`🔧 Tentando salvar campos ACF via WordPress API...`)
    
    // Converter campos repeater para formato ACF
    const convertedFields = this.convertRepeaterFields(acfFields)
    
    // Usar meta fields em vez de acf property
    const metaFields: any = {}
    Object.entries(convertedFields).forEach(([key, value]) => {
      metaFields[key] = value
    })
    
    console.log(`📊 Campos convertidos: ${Object.keys(convertedFields).length}`)
    console.log(`📋 Campos meta: ${Object.keys(metaFields).join(', ')}`)
    
    // Fazer update de campos em lotes menores para evitar timeouts
    const batchSize = 10
    const fieldEntries = Object.entries(metaFields)
    let savedCount = 0
    
    // Tentar salvar todos de uma vez primeiro
    let response = await fetch(`${siteUrl}/wp-json/wp/v2/pages/${pageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({ meta: metaFields })
    })
    
    if (response.ok) {
      // Verificar se realmente salvou fazendo um GET para confirmar
      await new Promise(resolve => setTimeout(resolve, 300)) // Aguardar processamento
      
      const verifyResponse = await fetch(`${siteUrl}/wp-json/wp/v2/pages/${pageId}?context=edit`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`
        }
      })
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json()
        const savedFields = Object.keys(metaFields).filter(key => {
          const value = verifyData.meta?.[key]
          return value !== undefined && value !== null && value !== ''
        })
        savedCount = savedFields.length
        
        console.log(`✅ Campos ACF salvos via WordPress API (${savedCount}/${fieldEntries.length} confirmados)`)
        
        if (savedCount < fieldEntries.length * 0.8) {
          console.log(`⚠️ Apenas ${savedCount} campos foram confirmados, tentando salvar em lotes...`)
          // Salvar em lotes se muitos campos falharem
          for (let i = 0; i < fieldEntries.length; i += batchSize) {
            const batch = Object.fromEntries(fieldEntries.slice(i, i + batchSize))
            await fetch(`${siteUrl}/wp-json/wp/v2/pages/${pageId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
              },
              body: JSON.stringify({ meta: batch })
            })
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
      }
      
      return { success: true, fieldsProcessed: Object.keys(acfFields).length, confirmedCount: savedCount }
    } else {
      const errorText = await response.text()
      console.log(`❌ Erro WordPress API: ${response.status} - ${errorText.substring(0, 200)}`)
      
      // Tentar salvar em lotes menores se falhar
      console.log(`🔄 Tentando salvar em lotes menores...`)
      for (let i = 0; i < fieldEntries.length; i += batchSize) {
        const batch = Object.fromEntries(fieldEntries.slice(i, i + batchSize))
        try {
          const batchResponse = await fetch(`${siteUrl}/wp-json/wp/v2/pages/${pageId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify({ meta: batch })
          })
          if (batchResponse.ok) {
            savedCount += Object.keys(batch).length
          }
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.log(`⚠️ Erro no lote ${i / batchSize + 1}: ${error}`)
        }
      }
      
      if (savedCount > 0) {
        console.log(`✅ ${savedCount} campos salvos em lotes`)
        return { success: true, fieldsProcessed: savedCount }
      }
      
      throw new Error(`WordPress API falhou: ${response.statusText}`)
    }
  }

  // Atualizar ACF via WordPress REST API com meta
  private async updateACFViaMetaAPI(siteUrl: string, pageId: number, acfFields: any, auth: string): Promise<any> {
    console.log(`🔧 Salvando ${Object.keys(acfFields).length} campos ACF via meta API...`)
    
    try {
      // Converter campos repeater para formato ACF
      const convertedFields = this.convertRepeaterFields(acfFields)
      
      // Usar apenas meta fields para evitar validação ACF
      const metaFields: any = {}
      Object.entries(convertedFields).forEach(([key, value]) => {
        metaFields[key] = value
      })
      
      const response = await fetch(`${siteUrl}/wp-json/wp/v2/pages/${pageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({ 
          meta: metaFields
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Todos os ${Object.keys(acfFields).length} campos ACF salvos via meta fields`)
        console.log(`📄 Campos salvos:`, Object.keys(acfFields).join(', '))
        return { success: true, fieldsProcessed: Object.keys(acfFields).length }
      } else {
        const errorText = await response.text()
        console.log(`❌ Erro ao salvar campos ACF: ${response.status} - ${errorText}`)
        throw new Error(`Meta fields API falhou: ${response.statusText}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.log(`❌ Erro na meta fields API: ${errorMessage}`)
      throw error
    }
  }

  // Fallback: Atualizar ACF via meta fields
  private async updateACFViaMetaFields(siteUrl: string, pageId: number, acfFields: any, auth: string): Promise<any> {
    console.log(`🔧 Fallback: Salvando ${Object.keys(acfFields).length} campos ACF via meta fields...`)
    
    try {
      // Criar objeto meta com todos os campos de uma vez
      const metaFields: any = {}
      Object.entries(acfFields).forEach(([key, value]) => {
        metaFields[key] = value
      })
      
      const response = await fetch(`${siteUrl}/wp-json/wp/v2/pages/${pageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({ 
          meta: metaFields
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Todos os ${Object.keys(acfFields).length} campos ACF salvos via meta fields`)
        return { success: true, fieldsProcessed: Object.keys(acfFields).length }
      } else {
        const errorText = await response.text()
        console.log(`❌ Erro ao salvar campos ACF via meta: ${response.status} - ${errorText}`)
        throw new Error(`Meta fields API falhou: ${response.statusText}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.log(`❌ Erro na meta fields API: ${errorMessage}`)
      throw error
    }
  }

  // Registrar campos ACF automaticamente no WordPress
  private async registerACFFields(siteUrl: string, acfFields: any, auth: string): Promise<boolean> {
    console.log(`🔧 Registrando ${Object.keys(acfFields).length} campos ACF no WordPress...`)
    
    try {
      // Criar grupo de campos ACF
      const acfGroup = {
        title: 'Pressel V1 - Campos Automáticos',
        fields: Object.keys(acfFields).map((fieldName, index) => ({
          key: `field_${fieldName}`,
          label: fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          name: fieldName,
          type: this.getFieldType(fieldName),
          instructions: `Campo automático ${fieldName}`,
          required: 0,
          conditional_logic: 0,
          wrapper: {
            width: '',
            class: '',
            id: ''
          },
          default_value: '',
          placeholder: '',
          maxlength: '',
          rows: fieldName.includes('content') ? 4 : 1,
          new_lines: fieldName.includes('content') ? 'wpautop' : ''
        })),
        location: [
          [
            {
              param: 'post_template',
              operator: '==',
              value: 'pressel-oficial.php'
            }
          ]
        ],
        menu_order: 0,
        position: 'normal',
        style: 'default',
        label_placement: 'top',
        instruction_placement: 'label',
        hide_on_screen: '',
        active: true,
        description: 'Campos ACF automáticos para Pressel V1'
      }

      // Tentar registrar via API ACF (se disponível)
      try {
        const acfResponse = await fetch(`${siteUrl}/wp-json/acf/v3/field-groups`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
          },
          body: JSON.stringify(acfGroup)
        })

        if (acfResponse.ok) {
          console.log('✅ Campos ACF registrados via API ACF')
          return true
        }
      } catch (error) {
        console.log('⚠️ API ACF não disponível, usando método alternativo')
      }

      // Método alternativo: registrar via WordPress API
      try {
        const wpResponse = await fetch(`${siteUrl}/wp-json/wp/v2/acf-field-groups`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
          },
          body: JSON.stringify(acfGroup)
        })

        if (wpResponse.ok) {
          console.log('✅ Campos ACF registrados via WordPress API')
          return true
        }
      } catch (error) {
        console.log('⚠️ WordPress API não disponível para registro')
      }

      // Se não conseguir registrar, continuar mesmo assim
      console.log('⚠️ Não foi possível registrar campos ACF, mas continuando...')
      return false

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.log(`⚠️ Erro ao registrar campos ACF: ${errorMessage}`)
      return false
    }
  }

  // Determinar tipo de campo baseado no nome
  private getFieldType(fieldName: string): string {
    if (fieldName.includes('cor') || fieldName.includes('color')) return 'color_picker'
    if (fieldName.includes('link') || fieldName.includes('url')) return 'url'
    if (fieldName.includes('content') || fieldName.includes('texto') || fieldName.includes('description')) return 'textarea'
    if (fieldName.includes('pergunta') || fieldName.includes('resposta') || fieldName.includes('titulo')) return 'text'
    return 'text'
  }

  // Processar JSON completo (função principal)
  async processJson(jsonData: any, siteUrl: string): Promise<any> {
    const startTime = Date.now()
    this.logger.logProcess('INIT', 'info', 'Iniciando processamento completo do JSON', { siteUrl })
    
    try {
      // Passo 1: Validar JSON básico
      if (!jsonData || typeof jsonData !== 'object') {
        const error = this.errorHandler.createJsonError('001', { jsonData })
        this.errorHandler.logError(error)
        return this.errorHandler.formatErrorResponse(error)
      }

      if (!jsonData.acf_fields || typeof jsonData.acf_fields !== 'object') {
        const error = this.errorHandler.createJsonError('002', { 
          missingField: 'acf_fields',
          providedFields: Object.keys(jsonData)
        })
        this.errorHandler.logError(error)
        return this.errorHandler.formatErrorResponse(error)
      }

      // Passo 2: Carregar modelos se necessário
      if (this.models.size === 0) {
        this.logger.logProcess('LOAD_MODELS', 'info', 'Carregando modelos disponíveis')
        try {
          await this.loadModels()
          this.logger.logProcess('LOAD_MODELS', 'success', `Modelos carregados: ${this.models.size}`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
          const modelError = this.errorHandler.createModelError('003', { error: errorMessage })
          this.errorHandler.logError(modelError)
          return this.errorHandler.formatErrorResponse(modelError)
        }
      }
      
      // Passo 3: Validar integridade do site
      this.logger.logProcess('SITE_INTEGRITY', 'info', 'Validando integridade do site')
      const integrityCheck = this.logger.validateSiteIntegrity(jsonData)
      if (integrityCheck.warnings.length > 0) {
        this.logger.logProcess('SITE_INTEGRITY', 'warning', `${integrityCheck.warnings.length} avisos de integridade`)
      }
      
      // Passo 4: Filtrar campos dinâmicos (preservar elementos fixos)
      this.logger.logProcess('FILTER_FIELDS', 'info', 'Filtrando campos dinâmicos')
      const filteredData = this.logger.filterDynamicFields(jsonData)
      
      // Passo 5: Identificar modelo (respeitar page_model ou detectar automaticamente)
      let detectedModel: DetectedModel | null = null
      
      if (filteredData.page_model) {
        // Usar modelo especificado no JSON
        this.logger.logProcess('IDENTIFY_MODEL', 'info', `Usando modelo especificado: ${filteredData.page_model}`)
        const modelName = filteredData.page_model.replace('modelo_', '').toUpperCase()
        
        // Buscar assinatura do modelo via ModelIdentifier (fonte confiável)
        const modelIdentifier = ModelIdentifier.getInstance()
        const modelSignature = modelIdentifier.getModel(modelName)
        
        if (modelSignature) {
          // Garantir que o template está definido (mesma lógica do V1)
          const templateFile = modelSignature.templateFile || this.getDefaultTemplate(modelName)
          
          detectedModel = {
            modelName: modelName,
            template: templateFile, // V4.php (sempre definido)
            acfFields: modelSignature.uniqueFields || [],
            confidence: 1.0,
            matchedFields: Object.keys(filteredData.acf_fields || {})
          }
          console.log(`✅ Modelo especificado encontrado: ${modelName}`)
          console.log(`📄 Template: ${templateFile}`)
          console.log(`📋 Campos únicos: ${modelSignature.uniqueFields?.length || 0}`)
        } else {
          console.log(`⚠️ Modelo especificado não encontrado: ${modelName}, detectando automaticamente...`)
        }
      }
      
      if (!detectedModel) {
        // Detecção automática como fallback
        this.logger.logProcess('IDENTIFY_MODEL', 'info', 'Identificando modelo automaticamente')
        detectedModel = await this.identifyModel(filteredData)
      }
      
      if (!detectedModel) {
        const error = this.errorHandler.createModelError('001', { 
          jsonFields: Object.keys(filteredData.acf_fields || {}),
          availableModels: Array.from(this.models.keys())
        })
        this.errorHandler.logError(error)
        return this.errorHandler.formatErrorResponse(error)
      }

      if (detectedModel.confidence < 0.3) {
        const error = this.errorHandler.createModelError('002', { 
          detectedModel: detectedModel.modelName,
          confidence: detectedModel.confidence,
          matchedFields: detectedModel.matchedFields
        })
        this.errorHandler.logError(error)
        return this.errorHandler.formatErrorResponse(error)
      }
      
      // Passo 6: Validar campos obrigatórios
      this.logger.logProcess('VALIDATE_FIELDS', 'info', 'Validando campos obrigatórios')
      const modelSignature = this.getModelSignature(detectedModel.modelName)
      
      if (!modelSignature) {
        const error = this.errorHandler.createAcfError('001', { 
          modelName: detectedModel.modelName,
          availableModels: Array.from(this.models.keys())
        })
        this.errorHandler.logError(error)
        return this.errorHandler.formatErrorResponse(error)
      }

      const validation = this.logger.validateRequiredFields(filteredData, modelSignature)
      
      if (!validation.valid) {
        const error = this.errorHandler.createValidationError('001', { 
          missingFields: validation.errors.map(e => e.field),
          requiredFields: modelSignature.requiredFields
        })
        this.errorHandler.logError(error)
        return this.errorHandler.formatErrorResponse(error)
      }
      
      // Passo 7: Criar página no WordPress
      this.logger.logProcess('CREATE_PAGE', 'info', 'Criando página no WordPress')
      const result = await this.createWordPressPage(filteredData, siteUrl, detectedModel)
      
      if (!result.success) {
        // Determinar tipo de erro do WordPress
        let errorCode = 'PS-WP-001' // Erro genérico
        if (result.error?.includes('template')) {
          errorCode = 'PS-WP-004'
        } else if (result.error?.includes('ACF') || result.error?.includes('acf')) {
          errorCode = 'PS-ACF-003'
        } else if (result.error?.includes('publish')) {
          errorCode = 'PS-WP-003'
        }

        const error = this.errorHandler.createError(errorCode, { 
          wordpressError: result.error,
          pageData: {
            title: filteredData.page_title,
            template: detectedModel.template
          }
        })
        this.errorHandler.logError(error)
        return this.errorHandler.formatErrorResponse(error)
      }
      
      // Passo 8: Processar campos ACF
      this.logger.logProcess('PROCESS_ACF', 'info', 'Processando campos ACF')
      try {
        const acfResult = await this.processACFFields(siteUrl, result.pageId!, filteredData.acf_fields, detectedModel)
        this.logger.logProcess('PROCESS_ACF', 'success', `Campos ACF processados: ${acfResult.fieldsProcessed}`)
        result.fieldsProcessed = acfResult.fieldsProcessed
      } catch (acfError) {
        const errorMessage = acfError instanceof Error ? acfError.message : 'Erro desconhecido'
        this.logger.logProcess('PROCESS_ACF', 'error', `Erro ao processar campos ACF: ${errorMessage}`)
        // Continuar mesmo com erro nos campos ACF
      }
      
      // Passo 9: Finalizar processamento
      const duration = Date.now() - startTime
      this.logger.logProcess('COMPLETE', 'success', 
        `Página criada com sucesso usando modelo ${detectedModel.modelName}`, 
        { pageId: result.pageId, pageUrl: result.pageUrl }, 
        duration
      )
      
      // Gerar relatório final
      const report = this.logger.generateReport()
      
      return {
        success: true,
        result: result,
        detectedModel: detectedModel,
        message: `Página criada com sucesso usando modelo ${detectedModel.modelName}`,
        stats: this.logger.getStats(),
        report: report,
        duration: duration
      }
      
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Determinar tipo de erro do sistema
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      let errorCode = 'PS-SYS-001' // Erro genérico
      if (errorMessage.includes('timeout')) {
        errorCode = 'PS-SYS-002'
      } else if (errorMessage.includes('memory')) {
        errorCode = 'PS-SYS-003'
      }

      const errorStack = error instanceof Error ? error.stack : undefined
      const systemError = this.errorHandler.createError(errorCode, { 
        originalError: errorMessage,
        stack: errorStack,
        duration: duration
      })
      this.errorHandler.logError(systemError)
      
      return this.errorHandler.formatErrorResponse(systemError)
    }
  }

  // Obter assinatura do modelo
  private getModelSignature(modelName: string): any {
    const modelIdentifier = ModelIdentifier.getInstance()
    return modelIdentifier.getModel(modelName)
  }
}
