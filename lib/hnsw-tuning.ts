/**
 * ⚡ HNSW TUNING - Tuning de ef_search para controle de latência/recall
 * 
 * Responsabilidades:
 * - Detectar suporte ao parâmetro ef_search
 * - Aplicar SET LOCAL de forma segura
 * - Policy de ef_search por use case/prioridade
 * 
 * REGRAS:
 * - SET LOCAL sempre dentro de transação
 * - Nunca expor SET LOCAL fora do helper
 * - Fallback silencioso se não suportado
 */

import { Prisma } from '@prisma/client'
import { db } from './db'

// Cache em memória por processo
let hnswSupportCache: boolean | null = null

export interface HnswTuningConfig {
  efSearch?: number
  priority?: 'low' | 'medium' | 'high' | 'debug'
  useCase?: 'rag' | 'chat' | 'generation' | 'editing' | 'diagnostic'
}

export interface HnswTuningResult {
  supported: boolean
  applied: boolean
  efSearchRequested?: number
  efSearchApplied?: number
}

/**
 * Detecta se o PostgreSQL/pgvector suporta ef_search tuning
 */
export async function detectHnswEfSearchSupport(): Promise<boolean> {
  // Retornar cache se disponível
  if (hnswSupportCache !== null) {
    return hnswSupportCache
  }

  try {
    // Tentar executar SET LOCAL em uma transação curta
    await db.$transaction(async (tx) => {
      // Tentar definir ef_search (pode falhar se não suportado)
      await tx.$executeRaw`SET LOCAL hnsw.ef_search = 40`
      
      // Se chegou aqui, suporta
      hnswSupportCache = true
    })

    return true
  } catch (error) {
    // Se falhar, não suporta
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Verificar se é erro de parâmetro não reconhecido
    if (
      errorMessage.includes('unrecognized configuration parameter') ||
      errorMessage.includes('hnsw.ef_search') ||
      errorMessage.includes('parameter "hnsw.ef_search" does not exist')
    ) {
      hnswSupportCache = false
      return false
    }

    // Outros erros podem ser temporários, tentar novamente na próxima vez
    console.warn('[HnswTuning] Error detecting HNSW support, will retry:', errorMessage)
    hnswSupportCache = false
    return false
  }
}

/**
 * Executa query vetorial com tuning de ef_search (se suportado)
 */
export async function safeVectorSearchWithTuning<T = any>(
  organizationId: string,
  siteId: string,
  queryVector: number[],
  baseQuery: Prisma.Sql,
  options: {
    efSearch?: number
    tuningEnabled?: boolean
  } = {}
): Promise<{
  results: Array<T & { similarity: number }>
  tuning: HnswTuningResult
  durationMs: number
}> {
  const startTime = Date.now()
  const tuningEnabled = options.tuningEnabled ?? (process.env.RAG_HNSW_TUNING_ENABLED === 'true')
  const efSearch = options.efSearch

  // Se tuning desabilitado ou efSearch não fornecido, executar query normal
  if (!tuningEnabled || !efSearch) {
    const results = await db.$queryRaw<T & { similarity: number }>(baseQuery)
    return {
      results,
      tuning: {
        supported: false,
        applied: false
      },
      durationMs: Date.now() - startTime
    }
  }

  // Verificar suporte
  const supported = await detectHnswEfSearchSupport()

  if (!supported) {
    // Fallback: executar query sem tuning
    const results = await db.$queryRaw<T & { similarity: number }>(baseQuery)
    return {
      results,
      tuning: {
        supported: false,
        applied: false,
        efSearchRequested: efSearch
      },
      durationMs: Date.now() - startTime
    }
  }

  // Executar com SET LOCAL dentro de transação
  try {
    const results = await db.$transaction(async (tx) => {
      // Aplicar SET LOCAL (só dentro desta transação)
      await tx.$executeRaw(Prisma.sql`SET LOCAL hnsw.ef_search = ${efSearch}`)
      
      // Executar query vetorial
      const queryResults = await tx.$queryRaw<T & { similarity: number }>(baseQuery)
      
      return queryResults
    })

    return {
      results,
      tuning: {
        supported: true,
        applied: true,
        efSearchRequested: efSearch,
        efSearchApplied: efSearch
      },
      durationMs: Date.now() - startTime
    }
  } catch (error) {
    // Se falhar, fallback silencioso
    console.warn('[HnswTuning] Failed to apply ef_search, falling back:', error)
    
    const results = await db.$queryRaw<T & { similarity: number }>(baseQuery)
    return {
      results,
      tuning: {
        supported: true,
        applied: false,
        efSearchRequested: efSearch,
        efSearchApplied: undefined
      },
      durationMs: Date.now() - startTime
    }
  }
}

/**
 * Calcula ef_search baseado em prioridade e use case
 */
export function calculateEfSearch(
  priority: 'low' | 'medium' | 'high' | 'debug' = 'medium',
  useCase?: string
): number {
  // Configs via env (com defaults)
  const efSearchLow = parseInt(process.env.RAG_EF_SEARCH_LOW || '20', 10)
  const efSearchMedium = parseInt(process.env.RAG_EF_SEARCH_MEDIUM || '40', 10)
  const efSearchHigh = parseInt(process.env.RAG_EF_SEARCH_HIGH || '80', 10)
  const efSearchDebug = parseInt(process.env.RAG_EF_SEARCH_DEBUG || '120', 10)

  switch (priority) {
    case 'low':
      return efSearchLow
    case 'medium':
      return efSearchMedium
    case 'high':
      return efSearchHigh
    case 'debug':
      return efSearchDebug
    default:
      return efSearchMedium
  }
}

/**
 * Policy de ef_search (pode ser estendida com overrides por tenant)
 */
export class HnswTuningPolicy {
  /**
   * Obtém ef_search para uma request
   */
  static getEfSearch(
    priority?: 'low' | 'medium' | 'high' | 'debug',
    useCase?: 'rag' | 'chat' | 'generation' | 'editing' | 'diagnostic',
    tenantOverride?: number
  ): number {
    // Se tenant tem override, usar
    if (tenantOverride !== undefined) {
      return tenantOverride
    }

    // Usar priority (default: medium)
    const finalPriority = priority || 'medium'
    return calculateEfSearch(finalPriority, useCase)
  }
}









