/**
 * 🔗 MIDDLEWARE - CorrelationId para Next.js API Routes
 * 
 * Responsabilidades:
 * - Extrair ou gerar correlationId
 * - Adicionar ao contexto da requisição
 * - Retornar no header de resposta
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateCorrelationId, CORRELATION_ID_HEADER } from './correlation'

/**
 * Middleware para Next.js (Edge Runtime)
 * Adiciona correlationId aos headers
 */
export function correlationMiddleware(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  
  // Criar response com correlationId no header
  const response = NextResponse.next()
  response.headers.set(CORRELATION_ID_HEADER, correlationId)
  
  return response
}

/**
 * Helper para extrair correlationId de request
 */
export function getCorrelationIdFromRequest(request: NextRequest): string {
  return getOrCreateCorrelationId(request.headers)
}

/**
 * Helper para adicionar correlationId à resposta
 */
export function addCorrelationIdToResponse(
  response: NextResponse,
  correlationId: string
): NextResponse {
  response.headers.set(CORRELATION_ID_HEADER, correlationId)
  return response
}









