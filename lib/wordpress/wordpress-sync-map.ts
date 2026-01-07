/**
 * WordPress Sync Mapping Helpers
 * FASE C - Modelagem de Dados
 * 
 * Helpers para mapear entidades WordPress ↔ Entidades CMS locais
 * Garantem idempotência e unicidade via (siteId, wpEntityId)
 */

import { db } from '@/lib/db'
import { validateTenantContext } from '@/lib/tenant-security'

// ============================================
// TIPOS
// ============================================

export interface WordPressPost {
  id: number
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  status: string
  date: string
  modified: string
  slug: string
  type: string
  author: number
  featured_media: number
  categories: number[]
  tags: number[]
  acf?: Record<string, any>
  link?: string
}

export interface WordPressCategory {
  id: number
  name: string
  slug: string
  description: string
  parent: number
}

export interface WordPressMedia {
  id: number
  title: { rendered: string }
  media_type: string
  mime_type: string
  source_url: string
  date: string
  modified: string
  alt_text: string
}

// ============================================
// HELPERS DE MAPEAMENTO
// ============================================

/**
 * Encontrar Page local por wpPostId
 */
export async function findPageByWpPostId(
  siteId: string,
  wpPostId: number
): Promise<{ id: string; wpPostId: number | null } | null> {
  const validation = await validateTenantContext(
    undefined, // organizationId será validado via siteId
    siteId
  )
  if (!validation.valid) {
    throw new Error(`Invalid tenant context: ${validation.error}`)
  }

  const page = await db.page.findFirst({
    where: {
      siteId,
      wpPostId
    },
    select: {
      id: true,
      wpPostId: true
    }
  })

  return page
}

/**
 * Encontrar Category local por wpTermId
 */
export async function findCategoryByWpTermId(
  siteId: string,
  wpTermId: number
): Promise<{ id: string; wpTermId: number | null } | null> {
  const validation = await validateTenantContext(undefined, siteId)
  if (!validation.valid) {
    throw new Error(`Invalid tenant context: ${validation.error}`)
  }

  const category = await db.category.findFirst({
    where: {
      siteId,
      wpTermId
    },
    select: {
      id: true,
      wpTermId: true
    }
  })

  return category
}

/**
 * Encontrar Media local por wpMediaId
 */
export async function findMediaByWpMediaId(
  siteId: string,
  wpMediaId: number
): Promise<{ id: string; wpMediaId: number | null } | null> {
  const validation = await validateTenantContext(undefined, siteId)
  if (!validation.valid) {
    throw new Error(`Invalid tenant context: ${validation.error}`)
  }

  const media = await db.media.findFirst({
    where: {
      siteId,
      wpMediaId
    },
    select: {
      id: true,
      wpMediaId: true
    }
  })

  return media
}

/**
 * Encontrar wpPostId por Page local
 */
export async function findWpPostIdByPageId(
  pageId: string
): Promise<number | null> {
  const page = await db.page.findUnique({
    where: { id: pageId },
    select: { wpPostId: true }
  })

  return page?.wpPostId ?? null
}

/**
 * Encontrar wpTermId por Category local
 */
export async function findWpTermIdByCategoryId(
  categoryId: string
): Promise<number | null> {
  const category = await db.category.findUnique({
    where: { id: categoryId },
    select: { wpTermId: true }
  })

  return category?.wpTermId ?? null
}

/**
 * Encontrar wpMediaId por Media local
 */
export async function findWpMediaIdByMediaId(
  mediaId: string
): Promise<number | null> {
  const media = await db.media.findUnique({
    where: { id: mediaId },
    select: { wpMediaId: true }
  })

  return media?.wpMediaId ?? null
}

// ============================================
// HELPERS DE VALIDAÇÃO
// ============================================

/**
 * Validar se wpPostId já está mapeado para outro Page
 */
export async function isWpPostIdMapped(
  siteId: string,
  wpPostId: number,
  excludePageId?: string
): Promise<boolean> {
  const page = await db.page.findFirst({
    where: {
      siteId,
      wpPostId,
      ...(excludePageId ? { id: { not: excludePageId } } : {})
    },
    select: { id: true }
  })

  return !!page
}

/**
 * Validar se wpTermId já está mapeado para outra Category
 */
export async function isWpTermIdMapped(
  siteId: string,
  wpTermId: number,
  excludeCategoryId?: string
): Promise<boolean> {
  const category = await db.category.findFirst({
    where: {
      siteId,
      wpTermId,
      ...(excludeCategoryId ? { id: { not: excludeCategoryId } } : {})
    },
    select: { id: true }
  })

  return !!category
}

/**
 * Validar se wpMediaId já está mapeado para outro Media
 */
export async function isWpMediaIdMapped(
  siteId: string,
  wpMediaId: number,
  excludeMediaId?: string
): Promise<boolean> {
  const media = await db.media.findFirst({
    where: {
      siteId,
      wpMediaId,
      ...(excludeMediaId ? { id: { not: excludeMediaId } } : {})
    },
    select: { id: true }
  })

  return !!media
}

// ============================================
// HELPERS DE ESTATÍSTICAS
// ============================================

/**
 * Contar Pages sincronizados do WordPress
 */
export async function countSyncedPages(
  organizationId: string,
  siteId: string
): Promise<number> {
  const validation = validateTenantContext(organizationId, siteId)
  if (!validation.valid) {
    throw new Error(`Invalid tenant context: ${validation.error}`)
  }

  return await db.page.count({
    where: {
      siteId,
      wpPostId: { not: null }
    }
  })
}

/**
 * Contar Categories sincronizadas do WordPress
 */
export async function countSyncedCategories(
  organizationId: string,
  siteId: string
): Promise<number> {
  const validation = validateTenantContext(organizationId, siteId)
  if (!validation.valid) {
    throw new Error(`Invalid tenant context: ${validation.error}`)
  }

  return await db.category.count({
    where: {
      siteId,
      wpTermId: { not: null }
    }
  })
}

/**
 * Contar Media sincronizada do WordPress
 */
export async function countSyncedMedia(
  organizationId: string,
  siteId: string
): Promise<number> {
  const validation = validateTenantContext(organizationId, siteId)
  if (!validation.valid) {
    throw new Error(`Invalid tenant context: ${validation.error}`)
  }

  return await db.media.count({
    where: {
      siteId,
      wpMediaId: { not: null }
    }
  })
}









