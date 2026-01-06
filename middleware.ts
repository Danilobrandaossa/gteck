import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const DEFAULT_ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:4000,http://localhost:5000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const allowedOriginsSet = new Set(DEFAULT_ALLOWED_ORIGINS)

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60', 10)
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || `${60_000}`, 10)

type RateLimitEntry = {
  count: number
  expiresAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function getClientIdentifier(request: NextRequest): string {
  const headerIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return request.ip || headerIp || 'local'
}

function isAllowedOrigin(origin: string | null): origin is string {
  if (!origin) {
    return false
  }
  if (allowedOriginsSet.has(origin)) {
    return true
  }
  try {
    const url = new URL(origin)
    return allowedOriginsSet.has(url.origin)
  } catch {
    return false
  }
}

function appendCorsHeaders(headers: Headers, origin: string | null) {
  const allowedOrigin = isAllowedOrigin(origin) ? origin : DEFAULT_ALLOWED_ORIGINS[0] || '*'
  headers.set('Access-Control-Allow-Origin', allowedOrigin)
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token')
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.append('Vary', 'Origin')
}

function applyRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || entry.expiresAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      expiresAt: now + RATE_LIMIT_WINDOW_MS
    })
    return { allowed: true }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.expiresAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  entry.count += 1
  return { allowed: true }
}

function isCsrfSafe(request: NextRequest, origin: string | null): boolean {
  if (SAFE_METHODS.has(request.method)) {
    return true
  }

  // Se origin está na lista permitida, é seguro
  if (origin && isAllowedOrigin(origin)) {
    return true
  }

  // Verificar referer
  const referer = request.headers.get('referer')
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin
      if (isAllowedOrigin(refererOrigin)) {
        return true
      }
    } catch {
      // ignora parse inválido
    }
  }

  // Verificar se a requisição vem do mesmo host (same-origin)
  const requestOrigin = `${request.nextUrl.protocol}//${request.nextUrl.host}`
  if (isAllowedOrigin(requestOrigin)) {
    return true
  }

  // Para localhost, permitir requisições same-origin mesmo sem origin header
  if (request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1') {
    const port = request.nextUrl.port || (request.nextUrl.protocol === 'https:' ? '443' : '80')
    const localhostOrigin = `${request.nextUrl.protocol}//${request.nextUrl.hostname}:${port}`
    if (isAllowedOrigin(localhostOrigin)) {
      return true
    }
  }

  const csrfHeader = request.headers.get('x-csrf-token')
  const csrfCookie = request.cookies.get('csrf-token')?.value

  if (csrfHeader && csrfCookie && csrfHeader === csrfCookie) {
    return true
  }

  return false
}

function createErrorResponse(status: number, message: string, origin: string | null) {
  const response = NextResponse.json({ error: message }, { status })
  appendCorsHeaders(response.headers, origin)
  return response
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')
  const pathname = request.nextUrl.pathname

  // Exceção para rotas admin e auth (temporárias)
  if (pathname === '/api/admin/create-user' || 
      pathname === '/api/admin/list-users' ||
      pathname === '/api/auth/login') {
    const response = NextResponse.next()
    appendCorsHeaders(response.headers, origin)
    return response
  }

  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })
    appendCorsHeaders(response.headers, origin)
    return response
  }

  if (origin && !isAllowedOrigin(origin)) {
    return createErrorResponse(403, 'Origin não permitido', origin)
  }

  if (!isCsrfSafe(request, origin)) {
    return createErrorResponse(403, 'CSRF check failed', origin)
  }

  const clientKey = `${getClientIdentifier(request)}:${request.nextUrl.pathname}`
  const rateLimitResult = applyRateLimit(clientKey)

  if (!rateLimitResult.allowed) {
    const response = createErrorResponse(429, 'Limite de requisições excedido', origin)
    if (rateLimitResult.retryAfter) {
      response.headers.set('Retry-After', `${rateLimitResult.retryAfter}`)
    }
    return response
  }

  const response = NextResponse.next()
  appendCorsHeaders(response.headers, origin)
  return response
}

export const config = {
  matcher: ['/api/:path*']
}

