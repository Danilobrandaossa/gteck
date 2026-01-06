/**
 * WordPress Test Harness
 * FASE H.2 - Ambiente de Teste
 * 
 * Seeds, fixtures e helpers para testes E2E
 */

import { db } from '@/lib/db'
import crypto from 'crypto'

export interface TestTenant {
  organizationId: string
  siteId: string
  userId: string
}

export interface WordPressMockContent {
  posts: Array<{
    id: number
    title: { rendered: string }
    content: { rendered: string }
    excerpt: { rendered: string }
    status: string
    date: string
    modified: string
    categories: number[]
    tags: number[]
    author: number
    acf?: Record<string, any>
  }>
  pages: Array<{
    id: number
    title: { rendered: string }
    content: { rendered: string }
    excerpt: { rendered: string }
    status: string
    date: string
    modified: string
    categories: number[]
    author: number
    acf?: Record<string, any>
  }>
  categories: Array<{
    id: number
    name: string
    slug: string
    description: string
    parent: number
  }>
  media: Array<{
    id: number
    title: { rendered: string }
    source_url: string
    mime_type: string
    alt_text: string
  }>
}

export class WordPressTestHarness {
  /**
   * Criar 2 tenants de teste (2 organizações, 2 sites cada)
   */
  static async createTestTenants(): Promise<{
    tenant1: TestTenant
    tenant2: TestTenant
  }> {
    // Tenant 1
    const org1 = await db.organization.create({
      data: {
        name: 'Test Organization 1 - E2E'
      }
    })

    const user1 = await db.user.create({
      data: {
        email: `test-user-1-${crypto.randomUUID()}@test.com`,
        name: 'Test User 1',
        organizationId: org1.id
      }
    })

    const site1 = await db.site.create({
      data: {
        name: 'Test Site 1 - E2E',
        organizationId: org1.id,
        wpConfigured: true,
        wpBaseUrl: 'https://test-wp-1.example.com',
        wpAuthType: 'basic',
        wpLastSyncAt: new Date()
      }
    })

    // Tenant 2
    const org2 = await db.organization.create({
      data: {
        name: 'Test Organization 2 - E2E'
      }
    })

    const user2 = await db.user.create({
      data: {
        email: `test-user-2-${crypto.randomUUID()}@test.com`,
        name: 'Test User 2',
        organizationId: org2.id
      }
    })

    const site2 = await db.site.create({
      data: {
        name: 'Test Site 2 - E2E',
        organizationId: org2.id,
        wpConfigured: true,
        wpBaseUrl: 'https://test-wp-2.example.com',
        wpAuthType: 'basic',
        wpLastSyncAt: new Date()
      }
    })

    return {
      tenant1: {
        organizationId: org1.id,
        siteId: site1.id,
        userId: user1.id
      },
      tenant2: {
        organizationId: org2.id,
        siteId: site2.id,
        userId: user2.id
      }
    }
  }

  /**
   * Limpar tenants de teste
   */
  static async cleanupTestTenants(tenant1: TestTenant, tenant2: TestTenant): Promise<void> {
    // Limpar dados relacionados
    await db.page.deleteMany({
      where: {
        OR: [
          { siteId: tenant1.siteId },
          { siteId: tenant2.siteId }
        ]
      }
    })

    await db.embeddingChunk.deleteMany({
      where: {
        OR: [
          { siteId: tenant1.siteId },
          { siteId: tenant2.siteId }
        ]
      }
    })

    await db.queueJob.deleteMany({
      where: {
        OR: [
          { siteId: tenant1.siteId },
          { siteId: tenant2.siteId }
        ]
      }
    })

    await db.site.deleteMany({
      where: {
        OR: [
          { id: tenant1.siteId },
          { id: tenant2.siteId }
        ]
      }
    })

    await db.user.deleteMany({
      where: {
        OR: [
          { id: tenant1.userId },
          { id: tenant2.userId }
        ]
      }
    })

    await db.organization.deleteMany({
      where: {
        OR: [
          { id: tenant1.organizationId },
          { id: tenant2.organizationId }
        ]
      }
    })
  }

  /**
   * Gerar fixtures de conteúdo WordPress (mock)
   */
  static generateWordPressFixtures(): WordPressMockContent {
    return {
      categories: [
        {
          id: 1,
          name: 'Technology',
          slug: 'technology',
          description: 'Technology articles',
          parent: 0
        },
        {
          id: 2,
          name: 'Programming',
          slug: 'programming',
          description: 'Programming articles',
          parent: 1
        }
      ],
      media: [
        {
          id: 1,
          title: { rendered: 'Test Image 1' },
          source_url: 'https://example.com/image1.jpg',
          mime_type: 'image/jpeg',
          alt_text: 'Test image'
        }
      ],
      pages: [
        {
          id: 101,
          title: { rendered: 'About Us' },
          content: { rendered: '<h1>About Us</h1><p>This is the about us page content.</p>' },
          excerpt: { rendered: 'Learn more about us' },
          status: 'publish',
          date: new Date().toISOString(),
          modified: new Date().toISOString(),
          categories: [1],
          author: 1,
          acf: {
            custom_field: 'Custom value',
            number_field: 42
          }
        }
      ],
      posts: [
        {
          id: 201,
          title: { rendered: 'Getting Started with RAG' },
          content: { rendered: '<h2>Introduction</h2><p>RAG (Retrieval Augmented Generation) is a powerful technique...</p><h2>Conclusion</h2><p>In summary, RAG improves AI responses.</p>' },
          excerpt: { rendered: 'Learn about RAG systems' },
          status: 'publish',
          date: new Date().toISOString(),
          modified: new Date().toISOString(),
          categories: [1, 2],
          tags: [1, 2],
          author: 1,
          acf: {
            difficulty: 'intermediate',
            reading_time: 5
          }
        },
        {
          id: 202,
          title: { rendered: 'WordPress Integration Guide' },
          content: { rendered: '<h1>WordPress Integration</h1><p>This guide explains how to integrate WordPress with our CMS.</p>' },
          excerpt: { rendered: 'Complete guide to WordPress integration' },
          status: 'publish',
          date: new Date().toISOString(),
          modified: new Date().toISOString(),
          categories: [2],
          tags: [1],
          author: 1
        }
      ]
    }
  }

  /**
   * Simular resposta da API WordPress (mock)
   */
  static mockWordPressAPI(endpoint: string, method: string = 'GET'): any {
    const fixtures = this.generateWordPressFixtures()

    if (endpoint.includes('/wp/v2/categories')) {
      return fixtures.categories
    }

    if (endpoint.includes('/wp/v2/media')) {
      return fixtures.media
    }

    if (endpoint.includes('/wp/v2/pages')) {
      if (endpoint.match(/\/wp\/v2\/pages\/(\d+)/)) {
        const id = parseInt(endpoint.match(/\/wp\/v2\/pages\/(\d+)/)![1])
        return fixtures.pages.find(p => p.id === id) || null
      }
      return fixtures.pages
    }

    if (endpoint.includes('/wp/v2/posts')) {
      if (endpoint.match(/\/wp\/v2\/posts\/(\d+)/)) {
        const id = parseInt(endpoint.match(/\/wp\/v2\/posts\/(\d+)/)![1])
        return fixtures.posts.find(p => p.id === id) || null
      }
      return fixtures.posts
    }

    return null
  }

  /**
   * Gerar correlationId para testes
   */
  static generateCorrelationId(): string {
    return crypto.randomUUID()
  }

  /**
   * Aguardar processamento de jobs (helper)
   */
  static async waitForJobs(
    siteId: string,
    type: string,
    maxWaitMs: number = 30000,
    intervalMs: number = 500
  ): Promise<void> {
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitMs) {
      const pendingJobs = await db.queueJob.count({
        where: {
          siteId,
          type: { startsWith: type },
          status: { in: ['pending', 'processing'] }
        }
      })

      if (pendingJobs === 0) {
        return
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs))
    }

    throw new Error(`Jobs not completed within ${maxWaitMs}ms`)
  }
}






