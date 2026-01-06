import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/health/integrations/route'

describe('GET /api/health/integrations', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    process.env.WORDPRESS_DEFAULT_URL = 'https://wordpress.test'
    process.env.WORDPRESS_DEFAULT_USERNAME = 'user'
    process.env.WORDPRESS_DEFAULT_PASSWORD = 'pass'
    process.env.OPENAI_API_KEY = 'sk-test-123'
    process.env.N8N_WEBHOOK_URL = 'https://n8n.test/webhook'
    process.env.N8N_API_KEY = 'n8n-key'
    process.env.ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.test'
    process.env.WHATSAPP_API_URL = 'https://api.whatsapp.test'

    global.fetch = vi.fn(async (input, init) => {
      const url = typeof input === 'string' ? input : input.url

      if (url === 'https://wordpress.test/wp-json') {
        return new Response('{}', { status: 200 })
      }

      if (url.startsWith('https://api.openai.com')) {
        expect(init?.headers).toMatchObject({
          Authorization: expect.stringContaining('Bearer'),
        })
        return new Response(JSON.stringify({ data: [] }), { status: 200 })
      }

      if (url === 'https://n8n.test/webhook') {
        expect(init?.method).toBe('HEAD')
        return new Response(null, { status: 200 })
      }

      if (url === 'https://hooks.zapier.test') {
        expect(init?.method).toBe('OPTIONS')
        return new Response(null, { status: 200 })
      }

      throw new Error(`Unexpected fetch call: ${url}`)
    }) as typeof fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  test('retorna status agregado das integrações', async () => {
    const request = new NextRequest('http://localhost/api/health/integrations')
    const response = await GET(request, {})

    expect(response.status).toBe(200)

    const body = await response.json() as {
      data: {
        summary: Record<string, number>
        integrations: Array<{ key: string; status: string }>
      }
      requestId: string
    }

    expect(body.requestId).toBeTruthy()
    expect(body.data.summary.ready).toBe(4)
    expect(body.data.summary.warning).toBe(1)
    expect(body.data.summary.error ?? 0).toBe(0)

    const statuses = Object.fromEntries(body.data.integrations.map(item => [item.key, item.status]))

    expect(statuses.wordpress).toBe('ready')
    expect(statuses.openai).toBe('ready')
    expect(statuses.n8n).toBe('ready')
    expect(statuses.zapier).toBe('ready')
    expect(statuses.whatsapp).toBe('warning')

    expect(global.fetch).toHaveBeenCalledTimes(4)
  })
})


