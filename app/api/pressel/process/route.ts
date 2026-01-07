import { NextRequest, NextResponse } from 'next/server'
import { PresselAutomationService } from '@/lib/pressel-automation-core'
import { requireTenantContext, validateSiteBelongsToOrganization } from '@/lib/tenant-security'
import { StructuredLogger } from '@/lib/observability/logger'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'

export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('pressel.process', correlationId)

  try {
    const { jsonData, siteUrl, action, options, testMode = false, organizationId, siteId } = await request.json()
    
    // ✅ CORREÇÃO CRÍTICA: Validar contexto de tenant
    let tenantContext
    try {
      tenantContext = requireTenantContext(organizationId, siteId)
    } catch (error) {
      logger.warn('Tenant validation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return addCorrelationIdToResponse(
        NextResponse.json({
          success: false,
          error: 'organizationId e siteId são obrigatórios e devem ser CUIDs válidos',
          errorCode: 'INVALID_TENANT_CONTEXT'
        }, { status: 400 }),
        correlationId
      )
    }

    // ✅ CORREÇÃO: Validar que site pertence à organização
    const siteBelongsToOrg = await validateSiteBelongsToOrganization(siteId, organizationId)
    if (!siteBelongsToOrg) {
      logger.warn('Site ownership validation failed', { siteId, organizationId })
      return addCorrelationIdToResponse(
        NextResponse.json({
          success: false,
          error: 'Site não pertence à organização especificada',
          errorCode: 'SITE_OWNERSHIP_MISMATCH'
        }, { status: 403 }),
        correlationId
      )
    }
    
    logger.info('Processing Pressel JSON', {
      organizationId: tenantContext.organizationId,
      siteId: tenantContext.siteId,
      action,
      testMode,
      hasJsonData: !!jsonData
    })

    // Validar dados
    if (!jsonData || !siteUrl) {
      return addCorrelationIdToResponse(
        NextResponse.json({
          success: false,
          error: 'Dados obrigatórios não fornecidos'
        }, { status: 400 }),
        correlationId
      )
    }

    // Usar o novo sistema de automação Pressel
    const automationService = PresselAutomationService.getInstance()
    
    if (testMode) {
      // Modo teste - apenas simular
      logger.info('Running in test mode (simulation)')
      const result = await simulateProcessing(jsonData, siteUrl, options)
      return addCorrelationIdToResponse(
        NextResponse.json({
          success: true,
          message: 'Processamento simulado realizado',
          result,
          testMode: true
        }),
        correlationId
      )
    } else {
      // Modo real - processar com automação
      logger.info('Running in production mode')
      const result = await automationService.processJson(jsonData, siteUrl)
      
      // Se result já contém os campos de erro formatados, retornar diretamente
      if (result.status === 'erro') {
        logger.error('Processing failed', { error: result.error })
        return addCorrelationIdToResponse(
          NextResponse.json(result, { status: 400 }),
          correlationId
        )
      }
      
      logger.info('Processing completed successfully', { 
        detectedModel: result.detectedModel,
        duration: result.duration
      })
      
      return addCorrelationIdToResponse(
        NextResponse.json({
          success: result.success,
          message: result.message || 'Processamento realizado',
          result: result.result,
          detectedModel: result.detectedModel,
          stats: result.stats,
          report: result.report,
          duration: result.duration
        }),
        correlationId
      )
    }

  } catch (error) {
    if (error instanceof Error && error.message.includes('Tenant context required')) {
      logger.warn('Tenant validation failed in catch', { error: error.message })
      return addCorrelationIdToResponse(
        NextResponse.json({
          success: false,
          error: 'organizationId e siteId são obrigatórios',
          errorCode: 'INVALID_TENANT_CONTEXT'
        }, { status: 400 }),
        correlationId
      )
    }

    logger.error('Error processing Pressel JSON', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return addCorrelationIdToResponse(
      NextResponse.json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 500 }),
      correlationId
    )
  }
}

// Função para simular processamento (modo teste)
async function simulateProcessing(jsonData: any, siteUrl: string, _options: any) {
  const steps = []
  
  // Passo 1: Validar JSON
  steps.push({
    step: 'validation',
    status: 'success',
    message: 'JSON validado com sucesso',
    data: {
      fields: Object.keys(jsonData.acf_fields || {}).length,
      title: jsonData.page_title || 'Sem título'
    }
  })

  // Passo 2: Identificar modelo
  steps.push({
    step: 'model_detection',
    status: 'success',
    message: 'Modelo identificado automaticamente',
    data: {
      detectedModel: 'V3', // Simular detecção
      confidence: 0.85,
      matchedFields: Object.keys(jsonData.acf_fields || {}).slice(0, 5)
    }
  })

  // Passo 3: Preparar dados
  steps.push({
    step: 'preparation',
    status: 'success',
    message: 'Dados preparados para WordPress',
    data: {
      template: 'modelo-v3.php',
      status: 'publish',
      fieldsCount: Object.keys(jsonData.acf_fields || {}).length
    }
  })

  // Passo 4: Criar página (simulado)
  steps.push({
    step: 'page_creation',
    status: 'success',
    message: 'Página criada com sucesso no WordPress (simulado)',
    data: {
      pageId: Math.floor(Math.random() * 1000) + 3000,
      pageUrl: `${siteUrl}pagina-teste-${Date.now()}`,
      editUrl: `${siteUrl}wp-admin/post.php?post=${Math.floor(Math.random() * 1000) + 3000}&action=edit`
    }
  })

  // Passo 5: Processar campos ACF (simulado)
  steps.push({
    step: 'acf_fields',
    status: 'success',
    message: `Campos ACF processados: ${Object.keys(jsonData.acf_fields || {}).length} campos`,
    data: {
      fieldsProcessed: Object.keys(jsonData.acf_fields || {}).length,
      method: 'meta_api'
    }
  })

  // Passo 6: Otimizar SEO (simulado)
  steps.push({
    step: 'seo_optimization',
    status: 'success',
    message: 'SEO otimizado com sucesso',
    data: {
      metaTitle: jsonData.seo?.meta_title || jsonData.page_title,
      metaDescription: jsonData.seo?.meta_description || 'Descrição automática',
      focusKeyword: jsonData.seo?.focus_keyword || 'palavra-chave'
    }
  })

  return {
    steps,
    summary: {
      totalSteps: steps.length,
      successfulSteps: steps.filter(s => s.status === 'success').length,
      failedSteps: steps.filter(s => s.status === 'error').length
    },
    pageUrl: `${siteUrl}pagina-teste-${Date.now()}`,
    editUrl: `${siteUrl}wp-admin/post.php?post=${Math.floor(Math.random() * 1000) + 3000}&action=edit`,
    pageId: Math.floor(Math.random() * 1000) + 3000
  }
}

async function processCompleteJson(jsonData: any, siteUrl: string, options: any, testMode: boolean = true) {
  const steps = []
  
  // Passo 1: Validar JSON
  steps.push({
    step: 'validation',
    status: 'success',
    message: 'JSON validado com sucesso',
    data: {
      title: jsonData.page_title,
      hasContent: !!jsonData.page_content,
      hasAcfFields: !!jsonData.acf_fields,
      acfFieldsCount: Object.keys(jsonData.acf_fields || {}).length
    }
  })

  // Passo 2: Preparar dados para WordPress
  const wordpressData = {
    title: jsonData.page_title || 'Página sem título',
    content: jsonData.page_content || '',
    status: options.publish ? 'publish' : 'draft',
    excerpt: jsonData.page_excerpt || '',
    slug: jsonData.page_slug || jsonData.page_title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'pagina-sem-titulo',
    template: jsonData.page_template || 'page.php',
    acf: jsonData.acf_fields || {},
    meta: {
      _created_by: jsonData.meta_data?.created_by || 'Pressel Automation',
      _creation_date: new Date().toISOString(),
      _test_mode: options.testMode || false,
      _source: jsonData.meta_data?.source || 'cms_pressel_automation'
    }
  }

  steps.push({
    step: 'preparation',
    status: 'success',
    message: 'Dados preparados para WordPress',
    data: wordpressData
  })

  // Passo 3: Criar página (real ou simulada)
  const pageResult = await createPage(siteUrl, wordpressData, testMode)
  
  steps.push({
    step: 'page_creation',
    status: pageResult.success ? 'success' : 'error',
    message: pageResult.message,
    data: pageResult
  })

  // Se a criação da página falhou, retornar erro
  if (!pageResult.success) {
    return {
      siteUrl,
      steps,
      summary: {
        totalSteps: steps.length,
        successfulSteps: steps.filter(s => s.status === 'success').length,
        failedSteps: steps.filter(s => s.status === 'error').length
      },
      error: pageResult.message
    }
  }

  // Passo 4: Adicionar campos ACF (se habilitado)
  if (options.addAcfFields && jsonData.acf_fields && pageResult.pageId) {
    const acfResult = await simulateAcfFields(siteUrl, pageResult.pageId, jsonData.acf_fields)
    
    steps.push({
      step: 'acf_fields',
      status: acfResult.success ? 'success' : 'error',
      message: acfResult.message,
      data: acfResult
    })
  }

  // Passo 5: Adicionar SEO (se habilitado)
  if (options.addSeo && pageResult.pageId) {
    const seoResult = await simulateSeoOptimization(siteUrl, pageResult.pageId, jsonData)
    
    steps.push({
      step: 'seo_optimization',
      status: seoResult.success ? 'success' : 'error',
      message: seoResult.message,
      data: seoResult
    })
  }

  return {
    siteUrl,
    pageUrl: pageResult.pageUrl || '',
    editUrl: pageResult.editUrl || '',
    pageId: pageResult.pageId || 0,
    steps,
    summary: {
      totalSteps: steps.length,
      successfulSteps: steps.filter(s => s.status === 'success').length,
      failedSteps: steps.filter(s => s.status === 'error').length
    }
  }
}

async function createPage(siteUrl: string, data: any, testMode: boolean = true) {
  if (testMode) {
    // Modo simulado
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const pageId = Math.floor(Math.random() * 1000) + 1
    const slug = data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    
    return {
      success: true,
      pageId,
      pageUrl: `${siteUrl}${slug}/`,
      editUrl: `${siteUrl}wp-admin/post.php?post=${pageId}&action=edit`,
      message: 'Página criada com sucesso no WordPress (simulado)'
    }
  } else {
    // Modo real - usar credenciais do sistema
    try {
      const username = process.env.WORDPRESS_DEFAULT_USERNAME || 'admin'
      const password = process.env.WORDPRESS_DEFAULT_PASSWORD
      
      if (!password) {
        return {
          success: false,
          message: 'Credenciais WordPress não configuradas. Configure WORDPRESS_DEFAULT_PASSWORD no .env.local',
          error: 'MISSING_CREDENTIALS'
        }
      }

      // Criar página real no WordPress
      const response = await fetch(`${siteUrl}/wp-json/wp/v2/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
        },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          status: data.status || 'publish',
          excerpt: data.excerpt || '',
          slug: data.slug,
          template: data.template,
          meta: data.meta || {}
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        return {
          success: false,
          message: `Erro ao criar página no WordPress: ${response.status}`,
          error: errorData
        }
      }

      const pageData = await response.json()
      
      // Processar campos ACF se existirem
      if (data.acf && Object.keys(data.acf).length > 0) {
        await processAcfFields(siteUrl, pageData.id, data.acf, username, password)
      }
      
      return {
        success: true,
        pageId: pageData.id,
        pageUrl: `${siteUrl}${pageData.slug || pageData.slug}/`,
        editUrl: `${siteUrl}wp-admin/post.php?post=${pageData.id}&action=edit`,
        message: 'Página criada com sucesso no WordPress (real)',
        acfFields: data.acf ? Object.keys(data.acf).length : 0
      }

    } catch (error) {
      return {
        success: false,
        message: `Erro ao conectar com WordPress: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }
}

async function simulateAcfFields(siteUrl: string, pageId: number, acfFields: any) {
  // Simular delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  return {
    success: true,
    fieldsAdded: Object.keys(acfFields).length,
    message: `Campos ACF adicionados: ${Object.keys(acfFields).length} campos`
  }
}

async function simulateSeoOptimization(siteUrl: string, pageId: number, jsonData: any) {
  // Simular delay
  await new Promise(resolve => setTimeout(resolve, 600))
  
  return {
    success: true,
    seoTitle: jsonData.acf_fields?.seo_title || jsonData.page_title,
    seoDescription: jsonData.acf_fields?.seo_description || jsonData.page_excerpt,
    message: 'SEO otimizado com sucesso'
  }
}

// Função para processar campos ACF reais
async function processAcfFields(siteUrl: string, pageId: number, acfFields: any, username: string, password: string) {
  try {
    console.log(`🔧 Processando ${Object.keys(acfFields).length} campos ACF para página ${pageId}`)
    
    // Tentar múltiplas abordagens para aplicar campos ACF
    const auth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
    
    // Abordagem 1: API ACF específica
    console.log('🔄 Tentativa 1: API ACF específica...')
    try {
      const acfResponse = await fetch(`${siteUrl}/wp-json/acf/v3/pages/${pageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth
        },
        body: JSON.stringify(acfFields)
      })
      
      if (acfResponse.ok) {
        console.log(`✅ Campos ACF processados via API ACF específica`)
        return { success: true, fieldsProcessed: Object.keys(acfFields).length, method: 'acf-api' }
      }
    } catch (error) {
      console.log(`⚠️ API ACF específica falhou: ${error.message}`)
    }
    
    // Abordagem 2: API WordPress padrão com acf
    console.log('🔄 Tentativa 2: API WordPress com acf...')
    try {
      const wpResponse = await fetch(`${siteUrl}/wp-json/wp/v2/pages/${pageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth
        },
        body: JSON.stringify({
          acf: acfFields
        })
      })
      
      if (wpResponse.ok) {
        console.log(`✅ Campos ACF processados via API WordPress`)
        const responseData = await wpResponse.json()
        return { success: true, fieldsProcessed: Object.keys(acfFields).length, method: 'wp-api', data: responseData }
      } else {
        const errorData = await wpResponse.text()
        console.log(`⚠️ API WordPress falhou: ${errorData}`)
      }
    } catch (error) {
      console.log(`⚠️ API WordPress falhou: ${error.message}`)
    }
    
    // Abordagem 3: Campos meta individuais
    console.log('🔄 Tentativa 3: Campos meta individuais...')
    try {
      const metaFields = {}
      Object.keys(acfFields).forEach(key => {
        metaFields[key] = acfFields[key]
      })
      
      const metaResponse = await fetch(`${siteUrl}/wp-json/wp/v2/pages/${pageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth
        },
        body: JSON.stringify({
          meta: metaFields
        })
      })
      
      if (metaResponse.ok) {
        console.log(`✅ Campos processados como meta`)
        return { success: true, fieldsProcessed: Object.keys(acfFields).length, method: 'meta' }
      }
    } catch (error) {
      console.log(`⚠️ Campos meta falharam: ${error.message}`)
    }
    
    console.log(`❌ Todas as abordagens falharam`)
    return { success: false, error: 'Todas as abordagens de ACF falharam' }
    
  } catch (error) {
    console.log(`❌ Erro ao processar campos ACF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}
