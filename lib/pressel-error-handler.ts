/**
 * Sistema de Códigos de Erro para Pressel Automation
 * Todos os erros têm códigos únicos iniciados com PS-
 */

export interface PresselError {
  code: string
  message: string
  category: 'JSON' | 'ACF' | 'WP' | 'SYS' | 'MODEL' | 'VALIDATION'
  severity: 'error' | 'warning' | 'info'
  timestamp: string
  details?: any
  suggestions?: string[]
}

export class PresselErrorHandler {
  private static instance: PresselErrorHandler
  private errorCodes: Map<string, PresselError> = new Map()

  static getInstance(): PresselErrorHandler {
    if (!PresselErrorHandler.instance) {
      PresselErrorHandler.instance = new PresselErrorHandler()
      PresselErrorHandler.instance.initializeErrorCodes()
    }
    return PresselErrorHandler.instance
  }

  // Inicializar códigos de erro
  private initializeErrorCodes(): void {
    // Erros de JSON
    this.errorCodes.set('PS-JSON-001', {
      code: 'PS-JSON-001',
      message: 'JSON inválido ou mal formatado',
      category: 'JSON',
      severity: 'error',
      timestamp: '',
      suggestions: [
        'Verifique se o JSON está bem formatado',
        'Use um validador JSON online',
        'Confirme se todas as chaves estão entre aspas'
      ]
    })

    this.errorCodes.set('PS-JSON-002', {
      code: 'PS-JSON-002',
      message: 'Campo obrigatório ausente no JSON',
      category: 'JSON',
      severity: 'error',
      timestamp: '',
      suggestions: [
        'Verifique a documentação dos campos obrigatórios',
        'Confirme se todos os campos necessários estão presentes',
        'Use o JSON de exemplo como referência'
      ]
    })

    this.errorCodes.set('PS-JSON-003', {
      code: 'PS-JSON-003',
      message: 'Estrutura do JSON não corresponde ao modelo esperado',
      category: 'JSON',
      severity: 'error',
      timestamp: '',
      suggestions: [
        'Verifique se está usando o modelo correto',
        'Confirme a estrutura dos campos ACF',
        'Use o template de exemplo do modelo'
      ]
    })

    // Erros de ACF
    this.errorCodes.set('PS-ACF-001', {
      code: 'PS-ACF-001',
      message: 'Modelo ACF não encontrado',
      category: 'ACF',
      severity: 'error',
      timestamp: '',
      suggestions: [
        'Verifique se o modelo está carregado no sistema',
        'Confirme se os arquivos ACF estão na pasta correta',
        'Execute o script de processamento de modelos'
      ]
    })

    this.errorCodes.set('PS-ACF-002', {
      code: 'PS-ACF-002',
      message: 'Erro ao mapear campos do ACF',
      category: 'ACF',
      severity: 'error',
      timestamp: '',
      suggestions: [
        'Verifique se os nomes dos campos estão corretos',
        'Confirme se os tipos de campo são compatíveis',
        'Revise a estrutura do arquivo ACF JSON'
      ]
    })

    this.errorCodes.set('PS-ACF-003', {
      code: 'PS-ACF-003',
      message: 'Campos ACF não puderam ser salvos no WordPress',
      category: 'ACF',
      severity: 'error',
      timestamp: '',
      suggestions: [
        'Verifique as credenciais do WordPress',
        'Confirme se o plugin ACF está ativo',
        'Teste a conexão com a API do WordPress'
      ]
    })

    // Erros de WordPress
    this.errorCodes.set('PS-WP-001', {
      code: 'PS-WP-001',
      message: 'Erro ao criar página no WordPress',
      category: 'WP',
      severity: 'error',
      timestamp: '',
      suggestions: [
        'Verifique as credenciais do WordPress',
        'Confirme se o usuário tem permissões adequadas',
        'Teste a conexão com a API REST do WordPress'
      ]
    })

    this.errorCodes.set('PS-WP-002', {
      code: 'PS-WP-002',
      message: 'Erro ao salvar campos ACF no WordPress',
      category: 'WP',
      severity: 'error',
      timestamp: '',
      suggestions: [
        'Verifique se o plugin ACF está ativo',
        'Confirme se os campos ACF existem no WordPress',
        'Teste a API específica do ACF'
      ]
    })

    this.errorCodes.set('PS-WP-003', {
      code: 'PS-WP-003',
      message: 'Erro ao publicar a página',
      category: 'WP',
      severity: 'error',
      timestamp: '',
      suggestions: [
        'Verifique se o usuário tem permissão para publicar',
        'Confirme se não há conflitos de slug',
        'Teste a publicação manual no WordPress'
      ]
    })

    this.errorCodes.set('PS-WP-004', {
      code: 'PS-WP-004',
      message: 'Template não encontrado no WordPress',
      category: 'WP',
      severity: 'error',
      timestamp: '',
      suggestions: [
        'Verifique se o arquivo de template existe',
        'Confirme se o template está no tema ativo',
        'Upload o template para o WordPress'
      ]
    })

    // Erros de Sistema
    this.errorCodes.set('PS-SYS-001', {
      code: 'PS-SYS-001',
      message: 'Falha de permissão ou configuração do servidor',
      category: 'SYS',
      severity: 'error',
      timestamp: '',
      suggestions: [
        'Verifique as permissões de arquivo',
        'Confirme as configurações do servidor',
        'Teste o acesso aos diretórios necessários'
      ]
    })

    this.errorCodes.set('PS-SYS-002', {
      code: 'PS-SYS-002',
      message: 'Timeout na conexão com WordPress',
      category: 'SYS',
      severity: 'error',
      timestamp: '',
      suggestions: [
        'Verifique a conectividade com o WordPress',
        'Aumente o timeout da requisição',
        'Teste a velocidade da conexão'
      ]
    })

    this.errorCodes.set('PS-SYS-003', {
      code: 'PS-SYS-003',
      message: 'Memória insuficiente para processar o JSON',
      category: 'SYS',
      severity: 'error',
      timestamp: '',
      suggestions: [
        'Reduza o tamanho do JSON',
        'Aumente a memória do servidor',
        'Processe os dados em lotes menores'
      ]
    })

    // Erros de Modelo
    this.errorCodes.set('PS-MODEL-001', {
      code: 'PS-MODEL-001',
      message: 'Modelo não identificado automaticamente',
      category: 'MODEL',
      severity: 'error',
      timestamp: '',
      suggestions: [
        'Verifique se os campos únicos estão presentes',
        'Confirme se o modelo está carregado',
        'Use campos mais específicos do modelo'
      ]
    })

    this.errorCodes.set('PS-MODEL-002', {
      code: 'PS-MODEL-002',
      message: 'Confiança na identificação do modelo muito baixa',
      category: 'MODEL',
      severity: 'warning',
      timestamp: '',
      suggestions: [
        'Adicione mais campos únicos do modelo',
        'Verifique se está usando o modelo correto',
        'Confirme a estrutura dos campos ACF'
      ]
    })

    this.errorCodes.set('PS-MODEL-003', {
      code: 'PS-MODEL-003',
      message: 'Template do modelo não encontrado',
      category: 'MODEL',
      severity: 'error',
      timestamp: '',
      suggestions: [
        'Verifique se o arquivo de template existe',
        'Confirme se o template está na pasta correta',
        'Execute o processamento de modelos'
      ]
    })

    // Erros de Validação
    this.errorCodes.set('PS-VALIDATION-001', {
      code: 'PS-VALIDATION-001',
      message: 'Campos obrigatórios ausentes',
      category: 'VALIDATION',
      severity: 'error',
      timestamp: '',
      suggestions: [
        'Verifique a lista de campos obrigatórios',
        'Adicione os campos ausentes ao JSON',
        'Use o JSON de exemplo como referência'
      ]
    })

    this.errorCodes.set('PS-VALIDATION-002', {
      code: 'PS-VALIDATION-002',
      message: 'Campos com valores inválidos',
      category: 'VALIDATION',
      severity: 'warning',
      timestamp: '',
      suggestions: [
        'Verifique os tipos de dados dos campos',
        'Confirme se os valores estão no formato correto',
        'Revise as validações específicas de cada campo'
      ]
    })

    this.errorCodes.set('PS-VALIDATION-003', {
      code: 'PS-VALIDATION-003',
      message: 'Campos protegidos detectados - serão ignorados',
      category: 'VALIDATION',
      severity: 'info',
      timestamp: '',
      suggestions: [
        'Remova campos fixos do site do JSON',
        'Use apenas campos dinâmicos da página',
        'Confirme que elementos fixos não serão alterados'
      ]
    })
  }

  // Criar erro personalizado
  createError(code: string, details?: any, customMessage?: string): PresselError {
    const baseError = this.errorCodes.get(code)
    
    if (!baseError) {
      // Erro não catalogado
      return {
        code: 'PS-UNKNOWN-001',
        message: 'Erro não catalogado',
        category: 'SYS',
        severity: 'error',
        timestamp: new Date().toISOString(),
        details,
        suggestions: ['Entre em contato com o suporte técnico']
      }
    }

    return {
      ...baseError,
      message: customMessage || baseError.message,
      timestamp: new Date().toISOString(),
      details
    }
  }

  // Criar erro de JSON
  createJsonError(subCode: string, details?: any): PresselError {
    return this.createError(`PS-JSON-${subCode}`, details)
  }

  // Criar erro de ACF
  createAcfError(subCode: string, details?: any): PresselError {
    return this.createError(`PS-ACF-${subCode}`, details)
  }

  // Criar erro de WordPress
  createWordPressError(subCode: string, details?: any): PresselError {
    return this.createError(`PS-WP-${subCode}`, details)
  }

  // Criar erro de Sistema
  createSystemError(subCode: string, details?: any): PresselError {
    return this.createError(`PS-SYS-${subCode}`, details)
  }

  // Criar erro de Modelo
  createModelError(subCode: string, details?: any): PresselError {
    return this.createError(`PS-MODEL-${subCode}`, details)
  }

  // Criar erro de Validação
  createValidationError(subCode: string, details?: any): PresselError {
    return this.createError(`PS-VALIDATION-${subCode}`, details)
  }

  // Formatar erro para resposta da API
  formatErrorResponse(error: PresselError): any {
    return {
      status: 'erro',
      codigo: error.code,
      mensagem: error.message,
      categoria: error.category,
      severidade: error.severity,
      timestamp: error.timestamp,
      detalhes: error.details,
      sugestoes: error.suggestions
    }
  }

  // Log do erro
  logError(error: PresselError): void {
    const emoji = this.getSeverityEmoji(error.severity)
    console.log(`${emoji} [${error.code}] ${error.message}`)
    
    if (error.details) {
      console.log(`   📊 Detalhes:`, error.details)
    }
    
    if (error.suggestions && error.suggestions.length > 0) {
      console.log(`   💡 Sugestões:`)
      error.suggestions.forEach(suggestion => {
        console.log(`      - ${suggestion}`)
      })
    }

    // Salvar em arquivo de log
    this.saveErrorToFile(error)
  }

  // Obter emoji baseado na severidade
  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'error': return '🚨'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📝'
    }
  }

  // Salvar erro em arquivo
  private saveErrorToFile(error: PresselError): void {
    try {
      const fs = require('fs')
      const path = require('path')
      
      const logDir = path.join(process.cwd(), 'logs', 'pressel-automation')
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }
      
      const logPath = path.join(logDir, 'errors.log')
      const logLine = `${error.timestamp} [${error.code}] ${error.severity.toUpperCase()}: ${error.message}\n`
      
      fs.appendFileSync(logPath, logLine)
    } catch (err) {
      console.error('Erro ao salvar log:', err)
    }
  }

  // Obter todos os códigos de erro disponíveis
  getAllErrorCodes(): PresselError[] {
    return Array.from(this.errorCodes.values())
  }

  // Obter códigos por categoria
  getErrorCodesByCategory(category: string): PresselError[] {
    return Array.from(this.errorCodes.values()).filter(error => error.category === category)
  }

  // Validar se um código existe
  isValidErrorCode(code: string): boolean {
    return this.errorCodes.has(code)
  }

  // Obter estatísticas de erros
  getErrorStats(errors: PresselError[]): any {
    const stats = {
      total: errors.length,
      byCategory: {} as any,
      bySeverity: {} as any,
      byCode: {} as any
    }

    errors.forEach(error => {
      // Por categoria
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1
      
      // Por severidade
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1
      
      // Por código
      stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1
    })

    return stats
  }
}





