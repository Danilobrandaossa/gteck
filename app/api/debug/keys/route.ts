/**
 * 🔒 CORREÇÃO CRÍTICA DE SEGURANÇA
 * 
 * Esta rota foi protegida com autenticação ADMIN e bloqueada em produção
 * para evitar exposição de informações sensíveis.
 * 
 * GET /api/debug/keys
 * 
 * Headers:
 * - Authorization: Bearer {ADMIN_HEALTH_SECRET}
 * 
 * Response:
 * - 401: Não autenticado
 * - 403: Tentativa de acesso em produção
 * - 200: Chaves mascaradas (apenas em dev/staging)
 */

import { NextRequest, NextResponse } from 'next/server'

const ADMIN_SECRET = process.env.ADMIN_HEALTH_SECRET

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !ADMIN_SECRET) {
    return false
  }
  
  const token = authHeader.replace('Bearer ', '')
  return token === ADMIN_SECRET
}

export async function GET(request: NextRequest) {
  // ✅ CORREÇÃO: Validar autenticação
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { 
        error: 'Unauthorized',
        message: 'This endpoint requires ADMIN authentication'
      },
      { status: 401 }
    )
  }

  // ✅ CORREÇÃO: Bloquear em produção
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { 
        error: 'Forbidden',
        message: 'This endpoint is not available in production'
      },
      { status: 403 }
    )
  }

  try {
    const keys = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 
        `${process.env.OPENAI_API_KEY.substring(0, 10)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 4)}` : 'NÃO DEFINIDA',
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 
        `${process.env.GOOGLE_API_KEY.substring(0, 10)}...${process.env.GOOGLE_API_KEY.substring(process.env.GOOGLE_API_KEY.length - 4)}` : 'NÃO DEFINIDA',
      KOALA_API_KEY: process.env.KOALA_API_KEY ? 
        `${process.env.KOALA_API_KEY.substring(0, 10)}...${process.env.KOALA_API_KEY.substring(process.env.KOALA_API_KEY.length - 4)}` : 'NÃO DEFINIDA',
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL
    }

    return NextResponse.json({
      success: true,
      keys,
      timestamp: new Date().toISOString(),
      message: 'Chaves carregadas do .env.local',
      environment: process.env.NODE_ENV,
      warning: 'This endpoint should only be used in development/staging'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar chaves',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}








