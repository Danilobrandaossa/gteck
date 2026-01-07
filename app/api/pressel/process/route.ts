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

