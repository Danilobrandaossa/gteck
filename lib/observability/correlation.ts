/**
 * 🔗 CORRELATION ID - Rastreamento end-to-end de requisições
 * 
 * Responsabilidades:
 * - Gerar correlationId único por request
 * - Aceitar header de entrada (x-correlation-id)
 * - Propagar correlationId através de toda a stack
 * 
 * REGRAS:
 * - Sempre gerar se não existir
 * - Aceitar header do client (para debugging)
 * - Nunca vazar PII
 */

import { randomUUID } from 'crypto'

export const CORRELATION_ID_HEADER = 'x-correlation-id'

export interface CorrelationContext {
  correlationId: string
  organizationId?: string
  siteId?: string
  userId?: string
}

/**
 * Gera ou extrai correlationId de headers
 */
export function getOrCreateCorrelationId(headers: Headers | Record<string, string | string[] | undefined>): string {
  // Tentar extrair do header
  let correlationId: string | undefined

  if (headers instanceof Headers) {
    correlationId = headers.get(CORRELATION_ID_HEADER) || undefined
  } else {
    const headerKey = Object.keys(headers).find(
      k => k.toLowerCase() === CORRELATION_ID_HEADER.toLowerCase()
    )
    if (headerKey) {
      const value = headers[headerKey]
      correlationId = Array.isArray(value) ? value[0] : value
    }
  }

  // Validar formato (UUID)
  if (correlationId && isValidUUID(correlationId)) {
    return correlationId
  }

  // Gerar novo se não existir ou inválido
  return randomUUID()
}

/**
 * Valida se string é UUID válido
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Extrai correlationId de um objeto (ex: request body, context)
 */
export function extractCorrelationId(data: any): string | undefined {
  if (!data) return undefined

  if (typeof data === 'string') {
    return isValidUUID(data) ? data : undefined
  }

  if (typeof data === 'object') {
    // Tentar campos comuns
    const possibleFields = ['correlationId', 'correlation_id', 'correlation-id', 'requestId', 'request_id']
    
    for (const field of possibleFields) {
      if (data[field] && typeof data[field] === 'string' && isValidUUID(data[field])) {
        return data[field]
      }
    }
  }

  return undefined
}

/**
 * Cria contexto de correlação
 */
export function createCorrelationContext(
  correlationId: string,
  organizationId?: string,
  siteId?: string,
  userId?: string
): CorrelationContext {
  return {
    correlationId,
    organizationId,
    siteId,
    userId
  }
}

/**
 * Adiciona correlationId ao header da resposta NextResponse
 */
export function addCorrelationIdToResponse(
  response: Response,
  correlationId?: string
): Response {
  if (correlationId) {
    response.headers.set(CORRELATION_ID_HEADER, correlationId)
  }
  return response
}






