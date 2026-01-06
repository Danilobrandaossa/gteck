/**
 * 🔒 TENANT SECURITY - Garantias de Isolamento Multi-tenant
 * 
 * Este módulo garante que TODAS as queries SQL raw tenham filtros obrigatórios
 * de organizationId e siteId, prevenindo vazamento de dados entre tenants.
 * 
 * REGRAS OBRIGATÓRIAS:
 * 1. Nenhuma query vetorial pode rodar sem filtro de tenant
 * 2. organizationId e siteId devem ser validados antes de queries
 * 3. Todas as queries devem usar helpers deste módulo
 */

import { Prisma } from '@prisma/client'
import { db } from './db'

export interface TenantContext {
  organizationId: string
  siteId: string
  userId?: string
}

export interface TenantValidationResult {
  valid: boolean
  error?: string
  context?: TenantContext
}

/**
 * Valida contexto de tenant antes de executar queries
 */
export function validateTenantContext(
  organizationId?: string | null,
  siteId?: string | null
): TenantValidationResult {
  if (!organizationId || organizationId.trim() === '') {
    return {
      valid: false,
      error: 'organizationId is required for tenant isolation'
    }
  }

  if (!siteId || siteId.trim() === '') {
    return {
      valid: false,
      error: 'siteId is required for tenant isolation'
    }
  }

  // Validar formato (deve ser CUID válido)
  const cuidRegex = /^c[a-z0-9]{24}$/
  if (!cuidRegex.test(organizationId)) {
    return {
      valid: false,
      error: 'Invalid organizationId format'
    }
  }

  if (!cuidRegex.test(siteId)) {
    return {
      valid: false,
      error: 'Invalid siteId format'
    }
  }

  return {
    valid: true,
    context: {
      organizationId,
      siteId
    }
  }
}

/**
 * Verifica se site pertence à organização (validação adicional de segurança)
 */
export async function validateSiteBelongsToOrganization(
  siteId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const site = await db.site.findFirst({
      where: {
        id: siteId,
        organizationId: organizationId
      },
      select: {
        id: true
      }
    })

    return site !== null
  } catch (error) {
    console.error('Error validating site-organization relationship:', error)
    return false
  }
}

/**
 * Helper para adicionar filtros de tenant em queries SQL raw
 * 
 * USO:
 * const filters = buildTenantFilters(organizationId, siteId)
 * const query = Prisma.sql`SELECT * FROM embeddings WHERE ${filters.organizationFilter} AND ${filters.siteFilter}`
 */
export function buildTenantFilters(organizationId: string, siteId: string) {
  const validation = validateTenantContext(organizationId, siteId)
  
  if (!validation.valid) {
    throw new Error(`Invalid tenant context: ${validation.error}`)
  }

  return {
    organizationFilter: Prisma.sql`organization_id = ${organizationId}::uuid`,
    siteFilter: Prisma.sql`site_id = ${siteId}::uuid`,
    combinedFilter: Prisma.sql`organization_id = ${organizationId}::uuid AND site_id = ${siteId}::uuid`
  }
}

/**
 * Wrapper seguro para queries SQL raw com garantia de filtros de tenant
 * 
 * EXEMPLO:
 * const results = await safeQueryRaw(
 *   organizationId,
 *   siteId,
 *   Prisma.sql`SELECT * FROM embeddings WHERE embedding <=> ${queryVector}::vector LIMIT 10`
 * )
 */
export async function safeQueryRaw<T = any>(
  organizationId: string,
  siteId: string,
  baseQuery: Prisma.Sql,
  options?: {
    validateSite?: boolean // Validar se site pertence à organização
    additionalFilters?: Prisma.Sql // Filtros adicionais (ex: is_active = true)
  }
): Promise<T[]> {
  // 1. Validar contexto
  const validation = validateTenantContext(organizationId, siteId)
  if (!validation.valid) {
    throw new Error(`Tenant validation failed: ${validation.error}`)
  }

  // 2. Validar relacionamento site-organization (se solicitado)
  if (options?.validateSite !== false) {
    const isValid = await validateSiteBelongsToOrganization(siteId, organizationId)
    if (!isValid) {
      throw new Error('Site does not belong to the specified organization')
    }
  }

  // 3. Construir query com filtros obrigatórios
  const tenantFilters = buildTenantFilters(organizationId, siteId)
  
  // Verificar se a query já tem filtros de tenant
  const queryString = baseQuery.sql.join('')
  const hasOrgFilter = queryString.includes('organization_id') || queryString.includes('organizationId')
  const hasSiteFilter = queryString.includes('site_id') || queryString.includes('siteId')

  if (!hasOrgFilter || !hasSiteFilter) {
    // Adicionar filtros obrigatórios
    const whereClause = options?.additionalFilters
      ? Prisma.sql`WHERE ${tenantFilters.combinedFilter} AND ${options.additionalFilters}`
      : Prisma.sql`WHERE ${tenantFilters.combinedFilter}`

    // Inserir WHERE clause se não existir, ou adicionar AND se já existir
    if (queryString.toUpperCase().includes('WHERE')) {
      const finalQuery = Prisma.sql`${baseQuery} AND ${tenantFilters.combinedFilter}`
      if (options?.additionalFilters) {
        return await db.$queryRaw<T>(Prisma.sql`${finalQuery} AND ${options.additionalFilters}`)
      }
      return await db.$queryRaw<T>(finalQuery)
    } else {
      const finalQuery = Prisma.sql`${baseQuery} ${whereClause}`
      return await db.$queryRaw<T>(finalQuery)
    }
  }

  // Se já tem filtros, apenas executar (mas ainda validar)
  return await db.$queryRaw<T>(baseQuery)
}

/**
 * Wrapper seguro para executeRaw com garantia de filtros de tenant
 */
export async function safeExecuteRaw(
  organizationId: string,
  siteId: string,
  baseQuery: Prisma.Sql,
  options?: {
    validateSite?: boolean
  }
): Promise<number> {
  // Validar contexto
  const validation = validateTenantContext(organizationId, siteId)
  if (!validation.valid) {
    throw new Error(`Tenant validation failed: ${validation.error}`)
  }

  // Validar relacionamento (se solicitado)
  if (options?.validateSite !== false) {
    const isValid = await validateSiteBelongsToOrganization(siteId, organizationId)
    if (!isValid) {
      throw new Error('Site does not belong to the specified organization')
    }
  }

  // Para executeRaw, garantir que a query tenha filtros (mas não modificar a query)
  // A responsabilidade é do desenvolvedor garantir filtros em UPDATE/DELETE
  const queryString = baseQuery.sql.join('')
  const hasOrgFilter = queryString.includes('organization_id') || queryString.includes('organizationId')
  const hasSiteFilter = queryString.includes('site_id') || queryString.includes('siteId')

  if (!hasOrgFilter || !hasSiteFilter) {
    throw new Error('UPDATE/DELETE queries MUST include organizationId and siteId filters for tenant isolation')
  }

  return await db.$executeRaw(baseQuery)
}

/**
 * Helper para construir query de busca vetorial segura
 * 
 * EXEMPLO:
 * const results = await safeVectorSearch(
 *   organizationId,
 *   siteId,
 *   queryEmbedding,
 *   {
 *     table: 'embeddings',
 *     vectorColumn: 'embedding',
 *     limit: 10,
 *     similarityThreshold: 0.7,
 *     contentType: 'page'
 *   }
 * )
 */
export async function safeVectorSearch<T = any>(
  organizationId: string,
  siteId: string,
  queryVector: number[],
  options: {
    table: string
    vectorColumn: string
    limit?: number
    similarityThreshold?: number
    contentType?: 'page' | 'ai_content' | 'template' | 'wp_post' | 'wp_page' | 'all'
    additionalFilters?: Prisma.Sql
    efSearch?: number // FASE 7 ETAPA 3: Tuning HNSW
    tuningEnabled?: boolean // FASE 7 ETAPA 3: Feature flag
  }
): Promise<Array<T & { similarity: number }>> {
  // Validar contexto
  const validation = validateTenantContext(organizationId, siteId)
  if (!validation.valid) {
    throw new Error(`Tenant validation failed: ${validation.error}`)
  }

  // Validar relacionamento
  const isValid = await validateSiteBelongsToOrganization(siteId, organizationId)
  if (!isValid) {
    throw new Error('Site does not belong to the specified organization')
  }

  // Construir filtros de tenant
  const tenantFilters = buildTenantFilters(organizationId, siteId)
  
  // Construir filtros adicionais
  const filters: Prisma.Sql[] = [
    tenantFilters.organizationFilter,
    tenantFilters.siteFilter,
    Prisma.sql`is_active = true`
  ]

  if (options.contentType && options.contentType !== 'all') {
    filters.push(Prisma.sql`source_type = ${options.contentType}`)
  }

  if (options.similarityThreshold) {
    // Para threshold, calcular após a query ou usar subquery
    // Por enquanto, não aplicar threshold aqui (será aplicado após ORDER BY)
  }

  if (options.additionalFilters) {
    filters.push(options.additionalFilters)
  }

  const whereClause = Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}`
  const limit = options.limit || 10

  // Converter vetor para string JSON para uso em SQL
  const vectorString = JSON.stringify(queryVector)
  
  const query = Prisma.sql`
    SELECT 
      *,
      1 - (${Prisma.raw(options.vectorColumn)} <=> ${Prisma.raw(vectorString)}::vector) as similarity
    FROM ${Prisma.raw(options.table)}
    ${whereClause}
    ORDER BY ${Prisma.raw(options.vectorColumn)} <=> ${Prisma.raw(vectorString)}::vector
    LIMIT ${limit}
  `

  // FASE 7 ETAPA 3: Aplicar tuning HNSW se habilitado
  const tuningEnabled = options.tuningEnabled ?? (process.env.RAG_HNSW_TUNING_ENABLED === 'true')
  
  if (tuningEnabled && options.efSearch) {
    const { safeVectorSearchWithTuning } = await import('./hnsw-tuning')
    
    const result = await safeVectorSearchWithTuning<T>(
      organizationId,
      siteId,
      queryVector,
      query,
      {
        efSearch: options.efSearch,
        tuningEnabled: true
      }
    )
    
    // Aplicar threshold após a query se especificado
    if (options.similarityThreshold) {
      return result.results.filter(r => r.similarity >= options.similarityThreshold!)
    }
    
    return result.results
  }

  // Execução normal (sem tuning)
  const results = await db.$queryRaw<T & { similarity: number }>(query)
  
  // Aplicar threshold após a query se especificado
  if (options.similarityThreshold) {
    return results.filter(r => r.similarity >= options.similarityThreshold!)
  }
  
  return results
}

/**
 * Helper para validar acesso de usuário a um site
 */
export async function validateUserSiteAccess(
  userId: string,
  siteId: string
): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        organizationId: true,
        role: true
      }
    })

    if (!user) {
      return false
    }

    // Admin tem acesso a todos os sites da organização
    if (user.role === 'admin') {
      const site = await db.site.findFirst({
        where: {
          id: siteId,
          organizationId: user.organizationId
        },
        select: { id: true }
      })
      return site !== null
    }

    // Outros roles: verificar se site pertence à organização do usuário
    const site = await db.site.findFirst({
      where: {
        id: siteId,
        organizationId: user.organizationId
      },
      select: { id: true }
    })

    return site !== null
  } catch (error) {
    console.error('Error validating user site access:', error)
    return false
  }
}

/**
 * Middleware para garantir que requisições tenham contexto de tenant válido
 */
export function requireTenantContext(
  organizationId?: string | null,
  siteId?: string | null
): TenantContext {
  const validation = validateTenantContext(organizationId, siteId)
  
  if (!validation.valid || !validation.context) {
    throw new Error(`Tenant context required: ${validation.error || 'Invalid context'}`)
  }

  return validation.context
}

