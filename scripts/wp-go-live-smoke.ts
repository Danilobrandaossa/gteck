#!/usr/bin/env tsx
/**
 * FASE I.6 - Script de Smoke Test para Go-Live
 * 
 * Executa testes básicos para validar WordPress Sync + IA
 * 
 * Uso:
 *   tsx scripts/wp-go-live-smoke.ts --siteId=site-id --organizationId=org-id
 * 
 * Exit Code:
 *   0 = Todos os testes passaram
 *   1 = Algum teste falhou
 */

import { execSync } from 'child_process'
import { createHmac } from 'crypto'

// Configuração
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const ADMIN_HEALTH_SECRET = process.env.ADMIN_HEALTH_SECRET || ''
const CRON_SECRET = process.env.CRON_SECRET || ''

// Argumentos
const args = process.argv.slice(2)
const siteId = args.find(arg => arg.startsWith('--siteId='))?.split('=')[1]
const organizationId = args.find(arg => arg.startsWith('--organizationId='))?.split('=')[1]

if (!siteId || !organizationId) {
  console.error('❌ Erro: siteId e organizationId são obrigatórios')
  console.error('Uso: tsx scripts/wp-go-live-smoke.ts --siteId=site-id --organizationId=org-id')
  process.exit(1)
}

if (!ADMIN_HEALTH_SECRET) {
  console.error('❌ Erro: ADMIN_HEALTH_SECRET não configurado')
  process.exit(1)
}

// Helpers
function curl(method: string, endpoint: string, body?: any, headers?: Record<string, string>): any {
  const url = `${BASE_URL}${endpoint}`
  const headersStr = Object.entries({ ...headers, 'Content-Type': 'application/json' })
    .map(([k, v]) => `-H "${k}: ${v}"`)
    .join(' ')
  
  const bodyStr = body ? `-d '${JSON.stringify(body)}'` : ''
  const command = `curl -s -X ${method} "${url}" ${headersStr} ${bodyStr}`
  
  try {
    const output = execSync(command, { encoding: 'utf-8' })
    return JSON.parse(output)
  } catch (error: any) {
    console.error(`❌ Erro ao executar: ${command}`)
    console.error(error.message)
    return null
  }
}

function test(name: string, fn: () => boolean): boolean {
  process.stdout.write(`🧪 ${name}... `)
  try {
    const result = fn()
    if (result) {
      console.log('✅')
      return true
    } else {
      console.log('❌')
      return false
    }
  } catch (error: any) {
    console.log(`❌ (${error.message})`)
    return false
  }
}

// Testes
const results: boolean[] = []
const correlationIds: string[] = []

console.log('🚀 Iniciando Smoke Tests para WordPress Sync + IA\n')
console.log(`📍 Site: ${siteId}`)
console.log(`📍 Organization: ${organizationId}`)
console.log(`📍 Base URL: ${BASE_URL}\n`)

// Teste 1: Validate Site
results.push(test('Validate Site', () => {
  const response = curl('POST', '/api/wordpress/validate-site', {
    siteUrl: 'https://test-wp-site.com',
    authType: 'basic',
    username: 'test',
    password: 'test'
  })
  return response !== null && (response.valid === true || response.valid === false)
}))

// Teste 2: Get WP Config (GET)
results.push(test('Get WP Config', () => {
  const response = curl('GET', `/api/sites/${siteId}/wordpress/configure`, undefined, {
    'Authorization': `Bearer ${ADMIN_HEALTH_SECRET}`
  })
  return response !== null && (response.success !== false)
}))

// Teste 3: Start Full Sync
let syncId: string | null = null
results.push(test('Start Full Sync', () => {
  const response = curl('POST', '/api/wordpress/sync-all', {
    siteId,
    organizationId
  }, {
    'Authorization': `Bearer ${ADMIN_HEALTH_SECRET}`
  })
  
  if (response && response.syncId) {
    syncId = response.syncId
    correlationIds.push(response.correlationId || '')
    return true
  }
  return false
}))

// Teste 4: Get Sync Report (Polling)
if (syncId) {
  results.push(test('Get Sync Report (Polling)', () => {
    let attempts = 0
    const maxAttempts = 12 // 1 minuto (5s * 12)
    
    while (attempts < maxAttempts) {
      const response = curl('GET', `/api/wordpress/sync/${syncId}`, undefined, {
        'Authorization': `Bearer ${ADMIN_HEALTH_SECRET}`
      })
      
      if (response && response.status === 'completed') {
        return true
      }
      
      if (response && response.status === 'failed') {
        return false
      }
      
      attempts++
      if (attempts < maxAttempts) {
        // Aguardar 5 segundos
        execSync('sleep 5', { encoding: 'utf-8' })
      }
    }
    
    return false // Timeout
  }))
}

// Teste 5: Webhook Signed (Exemplo)
results.push(test('Webhook Signed (Exemplo)', () => {
  const webhookSecret = 'test-secret-key'
  const timestamp = Math.floor(Date.now() / 1000)
  const body = JSON.stringify({
    event: 'post',
    action: 'updated',
    wpId: 123,
    siteUrl: 'https://test-wp-site.com',
    timestamp
  })
  
  const signature = createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')
  
  const response = curl('POST', '/api/wordpress/webhook', JSON.parse(body), {
    'X-WP-Signature': signature,
    'X-WP-Timestamp': timestamp.toString()
  })
  
  return response !== null
}))

// Teste 6: Admin Health (Sync Health)
results.push(test('Admin Health (Sync Health)', () => {
  const response = curl('GET', `/api/admin/wordpress/sync-health?organizationId=${organizationId}&siteId=${siteId}`, undefined, {
    'Authorization': `Bearer ${ADMIN_HEALTH_SECRET}`
  })
  return response !== null && response.status !== undefined
}))

// Teste 7: Admin Health (AI Health)
results.push(test('Admin Health (AI Health)', () => {
  const response = curl('GET', '/api/admin/ai/health?windowHours=24', undefined, {
    'Authorization': `Bearer ${ADMIN_HEALTH_SECRET}`
  })
  return response !== null && response.wpIndexing !== undefined
}))

// Teste 8: Admin Alerts
results.push(test('Admin Alerts', () => {
  const response = curl('GET', '/api/admin/ai/alerts?windowHours=24', undefined, {
    'Authorization': `Bearer ${ADMIN_HEALTH_SECRET}`
  })
  return response !== null && Array.isArray(response.alerts)
}))

// Teste 9: RAG Query (Retornando Fonte WP)
results.push(test('RAG Query (Retornando Fonte WP)', () => {
  const response = curl('POST', '/api/ai/rag', {
    organizationId,
    siteId,
    question: 'What is RAG?',
    contentType: 'all'
  }, {
    'Authorization': `Bearer ${ADMIN_HEALTH_SECRET}`
  })
  
  if (response && response.sources) {
    const wpSources = response.sources.filter((s: any) => 
      s.sourceType === 'wp_post' || s.sourceType === 'wp_page'
    )
    return wpSources.length > 0
  }
  return false
}))

// Resumo
console.log('\n📊 Resumo dos Testes:')
console.log(`✅ Passou: ${results.filter(r => r).length}/${results.length}`)
console.log(`❌ Falhou: ${results.filter(r => !r).length}/${results.length}`)

if (correlationIds.length > 0) {
  console.log('\n🔗 CorrelationIds:')
  correlationIds.forEach((id, index) => {
    if (id) {
      console.log(`  ${index + 1}. ${id}`)
    }
  })
}

// Exit code
const allPassed = results.every(r => r)
if (allPassed) {
  console.log('\n✅ Todos os testes passaram!')
  process.exit(0)
} else {
  console.log('\n❌ Alguns testes falharam!')
  process.exit(1)
}






