/**
 * Sistema de Logs Estruturados com PS-CÓDIGOS
 * Padrão: PS-[MODULO]-[NUMERO]
 */

export type LogLevel = 'sucesso' | 'aviso' | 'erro'

export interface PSLog {
  timestamp: string
  status: LogLevel
  codigo: string
  mensagem: string
  detalhes: {
    arquivo?: string
    linha?: number
    modelo?: string
    campo?: string
    valor?: any
    [key: string]: any
  }
}

export class PresselLogger {
  private static instance: PresselLogger
  private logs: PSLog[] = []

  static getInstance(): PresselLogger {
    if (!PresselLogger.instance) {
      PresselLogger.instance = new PresselLogger()
    }
    return PresselLogger.instance
  }

  log(status: LogLevel, codigo: string, mensagem: string, detalhes?: any): PSLog {
    const logEntry: PSLog = {
      timestamp: new Date().toISOString(),
      status,
      codigo,
      mensagem,
      detalhes: detalhes || {}
    }
    
    this.logs.push(logEntry)
    
    // Log no console também para debug
    const emoji = status === 'sucesso' ? '✅' : status === 'aviso' ? '⚠️' : '❌'
    console.log(`${emoji} [${codigo}] ${mensagem}`, detalhes || '')
    
    return logEntry
  }

  sucesso(codigo: string, mensagem: string, detalhes?: any): PSLog {
    return this.log('sucesso', codigo, mensagem, detalhes)
  }

  aviso(codigo: string, mensagem: string, detalhes?: any): PSLog {
    return this.log('aviso', codigo, mensagem, detalhes)
  }

  erro(codigo: string, mensagem: string, detalhes?: any): PSLog {
    return this.log('erro', codigo, mensagem, detalhes)
  }

  getAllLogs(): PSLog[] {
    return [...this.logs]
  }

  getLogsByCodigo(codigo: string): PSLog[] {
    return this.logs.filter(log => log.codigo === codigo)
  }

  getLogsByStatus(status: LogLevel): PSLog[] {
    return this.logs.filter(log => log.status === status)
  }

  getErros(): PSLog[] {
    return this.getLogsByStatus('erro')
  }

  clearLogs(): void {
    this.logs = []
  }

  toJSON(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Métodos de compatibilidade com código existente
  logProcess(processo: string, nivel: 'info' | 'success' | 'warning' | 'error', mensagem: string, detalhes?: any): void {
    const status: LogLevel = nivel === 'success' ? 'sucesso' : nivel === 'warning' ? 'aviso' : nivel === 'error' ? 'erro' : 'aviso'
    const codigo = `PS-SYS-${processo}`
    this.log(status, codigo, mensagem, detalhes)
  }

  validateSiteIntegrity(jsonData: any): { warnings: string[]; errors: string[] } {
    const warnings: string[] = []
    const errors: string[] = []

    if (!jsonData.page_title) {
      errors.push('Campo page_title ausente')
    }

    if (!jsonData.acf_fields) {
      warnings.push('Nenhum campo ACF definido')
    }

    return { warnings, errors }
  }

  filterDynamicFields(jsonData: any): any {
    // Filtrar apenas campos dinâmicos, preservando estrutura fixa
    const filtered = { ...jsonData }
    
    // Manter apenas campos permitidos
    const allowedTopLevel = ['page_title', 'page_model', 'page_template', 'page_slug', 'post_status', 'acf_fields', 'pressel']
    const filteredData: any = {}
    
    for (const key of allowedTopLevel) {
      if (filtered[key] !== undefined) {
        filteredData[key] = filtered[key]
      }
    }

    return filteredData
  }

  validateRequiredFields(jsonData: any, modelSignature: any): { valid: boolean; errors: Array<{ field: string; message: string }> } {
    const errors: Array<{ field: string; message: string }> = []
    const acfFields = jsonData.acf_fields || {}
    const requiredFields = modelSignature?.requiredFields || []

    for (const field of requiredFields) {
      if (!acfFields[field] || acfFields[field] === '' || acfFields[field] === null) {
        errors.push({
          field,
          message: `Campo obrigatório ausente: ${field}`
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  generateReport(): { summary: any; logs: PSLog[]; errors: PSLog[] } {
    const erros = this.getErros()
    const sucessos = this.getLogsByStatus('sucesso')
    const avisos = this.getLogsByStatus('aviso')

    return {
      summary: {
        total: this.logs.length,
        sucessos: sucessos.length,
        avisos: avisos.length,
        erros: erros.length
      },
      logs: this.logs,
      errors: erros
    }
  }

  getStats(): { total: number; byStatus: Record<string, number>; byCodigo: Record<string, number> } {
    const byStatus: Record<string, number> = {}
    const byCodigo: Record<string, number> = {}

    this.logs.forEach(log => {
      byStatus[log.status] = (byStatus[log.status] || 0) + 1
      byCodigo[log.codigo] = (byCodigo[log.codigo] || 0) + 1
    })

    return {
      total: this.logs.length,
      byStatus,
      byCodigo
    }
  }
}
