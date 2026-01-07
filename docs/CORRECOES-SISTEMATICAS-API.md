# 🛠️ CORREÇÕES SISTEMÁTICAS DA API
## Plano de Correção Baseado na Auditoria Técnica

**Data:** 2025-01-27  
**Baseado em:** `AUDITORIA-TECNICA-API-COMPLETA.md`  
**Metodologia:** Correção sistemática por prioridade (CRÍTICO → ALTO → MÉDIO → BAIXO)

---

## 📋 ÍNDICE DE CORREÇÕES

### 🔴 CRÍTICO - Segurança e Isolamento Multi-tenant

1. [Remover/Proteger `/api/debug/keys`](#correcao-1)
2. [Adicionar Isolamento de Tenant em `/api/creative/*` (5 rotas)](#correcao-2)
3. [Adicionar Isolamento de Tenant em `/api/ai/*` (3 rotas)](#correcao-3)
4. [Adicionar Isolamento de Tenant em `/api/pressel/*`](#correcao-4)
5. [Adicionar Isolamento de Tenant em `/api/wordpress/create-*`](#correcao-5)

### 🟠 ALTO - Validação de Ownership

6. [Adicionar Validação de Ownership em `/api/ai-content/[id]/*`](#correcao-6)
7. [Adicionar Autenticação em Rotas Admin Não Protegidas](#correcao-7)

### 🟡 MÉDIO - Status HTTP e Erros Silenciosos

8. [Corrigir Status HTTP em Operações Assíncronas (6 rotas)](#correcao-8)
9. [Remover Erros Silenciosos (4 rotas)](#correcao-9)
10. [Validar Parâmetros de Idioma/Nicho/Estilo](#correcao-10)

---

## 🔴 CORREÇÃO 1: Remover/Proteger `/api/debug/keys`

### 📌 PROBLEMA

**Severidade:** CRÍTICA  
**Rota:** `/api/debug/keys`  
**Problema:** Expõe informações sensíveis (chaves API parcialmente mascaradas) sem autenticação.

### 🧠 CAUSA RAIZ

A rota está acessível publicamente e retorna informações de variáveis de ambiente, mesmo que parcialmente mascaradas. Isso viola princípios de segurança.

### 🛠️ CORREÇÃO

**Opção 1 (Recomendada):** Remover a rota completamente  
**Opção 2:** Proteger com autenticação ADMIN (se realmente necessária para debug)

### 💻 PATCH DE CÓDIGO

**Opção 1 - Remover Rota:**

```typescript
// DELETAR arquivo: app/api/debug/keys/route.ts
// Esta rota não deve existir em produção
```

**Opção 2 - Proteger com Autenticação ADMIN:**

```typescript
// app/api/debug/keys/route.ts
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
  // Validar autenticação
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Permitir apenas em desenvolvimento/staging
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' },
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
      message: 'Chaves carregadas do .env.local'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar chaves',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
```

### 📤 STATUS HTTP

- **401 Unauthorized:** Quando autenticação falha
- **403 Forbidden:** Quando tentativa de acesso em produção
- **200 OK:** Quando autorizado e em dev/staging
- **500 Internal Server Error:** Quando há erro interno

### 🧪 TESTE DE VALIDAÇÃO

```bash
# Teste 1: Sem autenticação (deve retornar 401)
curl -X GET http://localhost:3000/api/debug/keys

# Teste 2: Com autenticação inválida (deve retornar 401)
curl -X GET http://localhost:3000/api/debug/keys \
  -H "Authorization: Bearer token-invalido"

# Teste 3: Com autenticação válida (deve retornar 200 em dev)
curl -X GET http://localhost:3000/api/debug/keys \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}"

# Teste 4: Em produção (deve retornar 403)
# Simular NODE_ENV=production
```

### ✅ RESULTADO ESPERADO

- Rota protegida com autenticação ADMIN
- Bloqueio em produção
- Status HTTP correto em todos os cenários
- Sem exposição de informações sensíveis em produção

---

## 🔴 CORREÇÃO 2: Adicionar Isolamento de Tenant em `/api/creative/generate`

### 📌 PROBLEMA

**Severidade:** CRÍTICA  
**Rota:** `/api/creative/generate`  
**Problema:** Não valida `organizationId` nem `siteId`, permitindo vazamento de dados entre tenants.

### 🧠 CAUSA RAIZ

A rota não recebe nem valida parâmetros de tenant, permitindo que qualquer requisição seja processada sem isolamento.

### 🛠️ CORREÇÃO

Adicionar validação de tenant no início da rota usando `requireTenantContext()`.

### 💻 PATCH DE CÓDIGO

```typescript
// app/api/creative/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { CreativeGenerator, CreativeBrief } from '@/lib/creative-generator'
import { AIService } from '@/lib/ai-services'
import { resolveFeatureFlags } from '@/lib/feature-flags'
import { requireTenantContext } from '@/lib/tenant-security'
import { StructuredLogger } from '@/lib/observability/logger'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'

export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('creative.generate', correlationId)

  try {
    const body = await request.json()
    
    // ✅ CORREÇÃO: Validar contexto de tenant
    const { organizationId, siteId } = body
    const tenantContext = requireTenantContext(organizationId, siteId)
    
    logger.info('Creative generation request', {
      organizationId: tenantContext.organizationId,
      siteId: tenantContext.siteId,
      hasMainPrompt: !!body.mainPrompt
    })
    
    // Validar campos obrigatórios
    if (!body.mainPrompt || typeof body.mainPrompt !== 'string' || !body.mainPrompt.trim()) {
      return addCorrelationIdToResponse(
        NextResponse.json({
          status: 'failed',
          failureReason: 'mainPrompt é obrigatório e deve ser uma string não vazia'
        }, { status: 400 }),
        correlationId
      )
    }

    // ... resto do código existente ...
    // IMPORTANTE: Passar organizationId e siteId para serviços que precisam

    // Gerar requestId para logs
    const requestId = correlationId

    // ... resto da implementação ...

  } catch (error) {
    // Se erro for de validação de tenant, retornar 400
    if (error instanceof Error && error.message.includes('Tenant context required')) {
      logger.warn('Tenant validation failed', { error: error.message })
      return addCorrelationIdToResponse(
        NextResponse.json({
          status: 'failed',
          failureReason: 'organizationId e siteId são obrigatórios',
          error: 'INVALID_TENANT_CONTEXT'
        }, { status: 400 }),
        correlationId
      )
    }

    logger.error('Error generating creative', { error })
    return addCorrelationIdToResponse(
      NextResponse.json({
        status: 'failed',
        failureReason: 'Erro interno ao gerar criativo',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }),
      correlationId
    )
  }
}
```

### 📤 STATUS HTTP

- **400 Bad Request:** Quando `organizationId` ou `siteId` estão ausentes/inválidos
- **200 OK:** Quando geração é bem-sucedida
- **500 Internal Server Error:** Quando há erro interno

### 🧪 TESTE DE VALIDAÇÃO

```bash
# Teste 1: Sem organizationId e siteId (deve retornar 400)
curl -X POST http://localhost:3000/api/creative/generate \
  -H "Content-Type: application/json" \
  -d '{"mainPrompt": "Teste"}'

# Teste 2: Com organizationId e siteId válidos (deve retornar 200)
curl -X POST http://localhost:3000/api/creative/generate \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "c123456789012345678901234",
    "siteId": "c987654321098765432109876",
    "mainPrompt": "Teste"
  }'

# Teste 3: Com IDs inválidos (deve retornar 400)
curl -X POST http://localhost:3000/api/creative/generate \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "invalid",
    "siteId": "invalid",
    "mainPrompt": "Teste"
  }'
```

### ✅ RESULTADO ESPERADO

- Validação obrigatória de `organizationId` e `siteId`
- Erro 400 quando tenant inválido
- Isolamento garantido entre tenants
- Logs estruturados com contexto de tenant

---

*Este documento será expandido com todas as correções sistemáticas...*






