import { Buffer } from 'node:buffer'

type IntegrationStatus = 'ready' | 'warning' | 'error' | 'not_configured'

interface IntegrationCheckResult {
  key: string
  name: string
  status: IntegrationStatus
  latencyMs?: number
  message?: string
}

const DEFAULT_TIMEOUT = parseInt(process.env.INTEGRATION_HEALTH_TIMEOUT_MS || '5000', 10)

function now() {
  return Date.now()
}

function elapsed(start: number) {
  return now() - start
}

function createAbortSignal(timeout: number) {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeout)
  return controller.signal
}

function sanitizeUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

function basicAuth(username: string, password: string) {
  return Buffer.from(`${username}:${password}`).toString('base64')
}

async function checkWordPress(): Promise<IntegrationCheckResult> {
  const baseUrl = process.env.WORDPRESS_DEFAULT_URL || process.env.WORDPRESS_URL

  if (!baseUrl) {
    return {
      key: 'wordpress',
      name: 'WordPress',
      status: 'not_configured',
      message: 'URL não configurada'
    }
  }

  const url = `${sanitizeUrl(baseUrl)}/wp-json`
  const username = process.env.WORDPRESS_DEFAULT_USERNAME
  const password = process.env.WORDPRESS_DEFAULT_PASSWORD
  const start = now()

  try {
    const headers: HeadersInit = {}
    if (username && password) {
      headers.Authorization = `Basic ${basicAuth(username, password)}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: createAbortSignal(DEFAULT_TIMEOUT)
    })

    if (response.ok || response.status === 401) {
      return {
        key: 'wordpress',
        name: 'WordPress',
        status: 'ready',
        latencyMs: elapsed(start),
        message: response.status === 401 ? 'Autenticação WP falhou (verificar credenciais)' : undefined
      }
    }

    return {
      key: 'wordpress',
      name: 'WordPress',
      status: 'error',
      latencyMs: elapsed(start),
      message: `Status inesperado: ${response.status}`
    }
  } catch (error) {
    return {
      key: 'wordpress',
      name: 'WordPress',
      status: 'error',
      latencyMs: elapsed(start),
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

async function checkOpenAI(): Promise<IntegrationCheckResult> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return {
      key: 'openai',
      name: 'OpenAI',
      status: 'not_configured',
      message: 'OPENAI_API_KEY ausente'
    }
  }

  // Evita requisições em modo mock
  if (apiKey.startsWith('sk-mock')) {
    return {
      key: 'openai',
      name: 'OpenAI',
      status: 'warning',
      message: 'Usando chave mock, sem validação externa'
    }
  }

  const start = now()

  try {
    const response = await fetch('https://api.openai.com/v1/models?limit=1', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      signal: createAbortSignal(DEFAULT_TIMEOUT)
    })

    if (response.ok) {
      return {
        key: 'openai',
        name: 'OpenAI',
        status: 'ready',
        latencyMs: elapsed(start)
      }
    }

    return {
      key: 'openai',
      name: 'OpenAI',
      status: 'error',
      latencyMs: elapsed(start),
      message: `Status ${response.status}`
    }
  } catch (error) {
    return {
      key: 'openai',
      name: 'OpenAI',
      status: 'error',
      latencyMs: elapsed(start),
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

async function checkN8N(): Promise<IntegrationCheckResult> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL

  if (!webhookUrl) {
    return {
      key: 'n8n',
      name: 'n8n',
      status: 'not_configured',
      message: 'N8N_WEBHOOK_URL ausente'
    }
  }

  const start = now()

  try {
    const response = await fetch(webhookUrl, {
      method: 'HEAD',
      headers: process.env.N8N_API_KEY
        ? { 'X-N8N-API-Key': process.env.N8N_API_KEY }
        : undefined,
      signal: createAbortSignal(DEFAULT_TIMEOUT)
    })

    if (response.ok || response.status === 405) {
      return {
        key: 'n8n',
        name: 'n8n',
        status: 'ready',
        latencyMs: elapsed(start),
        message: response.status === 405 ? 'HEAD não suportado, endpoint respondeu' : undefined
      }
    }

    return {
      key: 'n8n',
      name: 'n8n',
      status: 'warning',
      latencyMs: elapsed(start),
      message: `Status ${response.status} ao consultar o webhook`
    }
  } catch (error) {
    return {
      key: 'n8n',
      name: 'n8n',
      status: 'error',
      latencyMs: elapsed(start),
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

async function checkZapier(): Promise<IntegrationCheckResult> {
  const webhookUrl = process.env.ZAPIER_WEBHOOK_URL

  if (!webhookUrl) {
    return {
      key: 'zapier',
      name: 'Zapier',
      status: 'not_configured',
      message: 'ZAPIER_WEBHOOK_URL ausente'
    }
  }

  const start = now()

  try {
    const response = await fetch(webhookUrl, {
      method: 'OPTIONS',
      signal: createAbortSignal(DEFAULT_TIMEOUT)
    })

    if (response.ok || response.status === 200 || response.status === 405) {
      return {
        key: 'zapier',
        name: 'Zapier',
        status: 'ready',
        latencyMs: elapsed(start),
        message: response.status === 405 ? 'OPTIONS não suportado, webhook respondeu' : undefined
      }
    }

    return {
      key: 'zapier',
      name: 'Zapier',
      status: 'warning',
      latencyMs: elapsed(start),
      message: `Status ${response.status}`
    }
  } catch (error) {
    return {
      key: 'zapier',
      name: 'Zapier',
      status: 'error',
      latencyMs: elapsed(start),
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

async function checkWhatsApp(): Promise<IntegrationCheckResult> {
  const apiUrl = process.env.WHATSAPP_API_URL

  if (!apiUrl) {
    return {
      key: 'whatsapp',
      name: 'WhatsApp',
      status: 'not_configured',
      message: 'WHATSAPP_API_URL ausente'
    }
  }

  // Muitos provedores não expõem ping público - validar apenas presença
  return {
    key: 'whatsapp',
    name: 'WhatsApp',
    status: 'warning',
    message: 'Sem endpoint de health-check configurado'
  }
}

export async function getIntegrationsHealth() {
  const checks = await Promise.all([
    checkWordPress(),
    checkOpenAI(),
    checkN8N(),
    checkZapier(),
    checkWhatsApp()
  ])

  const summary = checks.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    },
    {} as Record<IntegrationStatus, number>
  )

  return {
    summary,
    integrations: checks
  }
}

