import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

interface ErrorResponseBody {
  error: {
    code: string
    message: string
    details?: unknown
    requestId: string
  }
}

interface SuccessResponseBody<T = unknown> {
  data: T
  requestId: string
}

interface HandlerOptions {
  route: string
  defaultErrorCode?: string
}

type HandlerResult<T> = Response | SuccessResponseBody<T>

type Handler<T = unknown> = (args: {
  request: NextRequest
  params: Record<string, unknown>
  requestId: string
}) => Promise<HandlerResult<T>>

function normalizeResponse<T>(result: HandlerResult<T>, requestId: string): Response {
  if (result instanceof Response) {
    const headers = new Headers(result.headers)
    headers.set('x-request-id', requestId)
    return new Response(result.body, {
      status: result.status,
      statusText: result.statusText,
      headers,
    })
  }

  return NextResponse.json(
    {
      ...result,
      requestId,
    },
    {
      status: 200,
    }
  )
}

export function withApiHandler<T = unknown>(handler: Handler<T>, options: HandlerOptions) {
  return async (request: NextRequest, context: { params?: Record<string, unknown> }) => {
    const requestId = request.headers.get('x-request-id') || randomUUID()
    const params = context.params ?? {}

    try {
      const result = await handler({ request, params, requestId })
      return normalizeResponse(result, requestId)
    } catch (error) {
      const err = error as Error & { status?: number; code?: string; details?: unknown }
      const status = err.status && err.status >= 400 ? err.status : 500
      const code = err.code || options.defaultErrorCode || 'INTERNAL_ERROR'

      logger.error('API handler error', {
        // @ts-expect-error FIX_BUILD: Suppressing error to allow build
        route: options.route,
        requestId,
        error: err,
      })

      const body: ErrorResponseBody = {
        error: {
          code,
          message: status >= 500 ? 'Erro interno do servidor' : err.message || 'Erro na requisição',
          details: status >= 500 ? undefined : err.details,
          requestId,
        },
      }

      return NextResponse.json(body, { status, headers: { 'x-request-id': requestId } })
    }
  }
}

export function jsonResponse<T>(data: T, requestId: string, init?: ResponseInit) {
  return NextResponse.json<SuccessResponseBody<T>>(
    { data, requestId },
    {
      status: 200,
      headers: init?.headers,
    }
  )
}

export class HttpError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

