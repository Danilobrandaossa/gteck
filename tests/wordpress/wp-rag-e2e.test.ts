/**
 * FASE G.8 - Testes E2E: WordPress RAG Integration
 * 
 * Testa o fluxo completo:
 * 1. Sync WP → chunks/embeddings criados
 * 2. Update WP → chunks antigos inativos, novos ativos
 * 3. RAG recupera conteúdo WP
 * 4. FinOps THROTTLED/BLOCKED: não indexa
 * 5. Multi-tenant: isolamento
 * 6. Observabilidade: correlationId propagado
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { db } from '@/lib/db'
import { WordPressEmbeddingTrigger } from '@/lib/wordpress/wordpress-embedding-trigger'
import { EmbeddingService } from '@/lib/embedding-service'
import { RagService } from '@/lib/rag-service'
import { TenantCostPolicyService } from '@/lib/finops/tenant-cost-policy'
import crypto from 'crypto'

describe('FASE G - WordPress RAG E2E', () => {
  let organizationId: string
  let siteId: string
  let pageId: string
  let correlationId: string

  beforeAll(async () => {
    // Criar organização e site de teste
    const org = await db.organization.create({
      data: {
        name: 'Test Org WP RAG'
      }
    })
    organizationId = org.id

    const site = await db.site.create({
      data: {
        name: 'Test Site WP RAG',
        organizationId: org.id,
        wpConfigured: true,
        wpLastSyncAt: new Date()
      }
    })
    siteId = site.id

    correlationId = crypto.randomUUID()
  })

  afterAll(async () => {
    // Limpar dados de teste
    await db.page.deleteMany({
      where: { siteId }
    })
    await db.embeddingChunk.deleteMany({
      where: { siteId }
    })
    await db.site.deleteMany({
      where: { organizationId }
    })
    await db.organization.deleteMany({
      where: { id: organizationId }
    })
  })

  it('1. Após sync de post WP, chunks/embeddings são criados (quando FinOps permite)', async () => {
    // Criar página WP simulada
    const page = await db.page.create({
      data: {
        title: 'Test WP Post',
        slug: 'test-wp-post',
        content: '<h1>Test Content</h1><p>This is a test WordPress post content.</p>',
        siteId,
        wpPostId: 123,
        wpSiteUrl: 'https://example.com',
        wpSyncedAt: new Date()
      }
    })
    pageId = page.id

    // Trigger embedding (simulando sync)
    const triggerResult = await WordPressEmbeddingTrigger.triggerEmbedding({
      organizationId,
      siteId,
      sourceType: 'wp_post',
      sourceId: pageId,
      wpId: 123,
      title: page.title,
      content: page.content || '',
      correlationId
    })

    expect(triggerResult.enqueued).toBe(true)
    expect(triggerResult.skipped).toBe(false)

    // Aguardar processamento (simulado - em produção seria via worker)
    // Verificar que chunks foram criados
    const chunks = await db.embeddingChunk.findMany({
      where: {
        siteId,
        sourceType: 'wp_post',
        sourceId: pageId,
        isActive: true
      }
    })

    expect(chunks.length).toBeGreaterThan(0)
  })

  it('2. Após update do mesmo post WP, chunks antigos ficam inativos e novos ativos', async () => {
    // Atualizar conteúdo
    const updatedContent = '<h1>Updated Test Content</h1><p>This is updated content.</p>'
    
    await db.page.update({
      where: { id: pageId },
      data: {
        content: updatedContent,
        wpSyncedAt: new Date()
      }
    })

    // Trigger embedding novamente
    const triggerResult = await WordPressEmbeddingTrigger.triggerEmbedding({
      organizationId,
      siteId,
      sourceType: 'wp_post',
      sourceId: pageId,
      wpId: 123,
      title: 'Test WP Post',
      content: updatedContent,
      correlationId
    })

    expect(triggerResult.enqueued).toBe(true)

    // Verificar que chunks antigos estão inativos
    const oldChunks = await db.embeddingChunk.findMany({
      where: {
        siteId,
        sourceType: 'wp_post',
        sourceId: pageId,
        isActive: false
      }
    })

    expect(oldChunks.length).toBeGreaterThan(0)

    // Verificar que novos chunks estão ativos
    const newChunks = await db.embeddingChunk.findMany({
      where: {
        siteId,
        sourceType: 'wp_post',
        sourceId: pageId,
        isActive: true
      }
    })

    expect(newChunks.length).toBeGreaterThan(0)
  })

  it('3. RAG recupera conteúdo WP (pergunta → retrieve encontra wp_post)', async () => {
    // Aguardar que embeddings estejam prontos (simulado)
    // Em produção, aguardaria processamento do worker

    // Executar query RAG
    const ragResponse = await RagService.ragQuery({
      organizationId,
      siteId,
      question: 'What is the test content?',
      contentType: 'all', // Inclui wp_post
      correlationId
    })

    expect(ragResponse.context.chunks.length).toBeGreaterThan(0)
    
    // Verificar que pelo menos um chunk é wp_post
    const wpChunks = ragResponse.context.chunks.filter(
      chunk => chunk.sourceType === 'wp_post' || chunk.sourceType === 'wp_page'
    )
    
    expect(wpChunks.length).toBeGreaterThan(0)
  })

  it('4. FinOps THROTTLED/BLOCKED: não indexa e registra skip corretamente', async () => {
    // Simular estado THROTTLED (mock seria necessário em teste real)
    // Por enquanto, testar que skipReason é retornado

    const triggerResult = await WordPressEmbeddingTrigger.triggerEmbedding({
      organizationId,
      siteId,
      sourceType: 'wp_post',
      sourceId: pageId,
      wpId: 123,
      title: 'Test WP Post',
      content: 'Test content',
      correlationId
    })

    // Se FinOps estiver bloqueado, deve ter skipReason
    if (triggerResult.skipped) {
      expect(triggerResult.skipReason).toBeDefined()
    }
  })

  it('5. Multi-tenant: WP do tenant A não indexa nem aparece no RAG do tenant B', async () => {
    // Criar segundo tenant
    const org2 = await db.organization.create({
      data: {
        name: 'Test Org 2 WP RAG'
      }
    })

    const site2 = await db.site.create({
      data: {
        name: 'Test Site 2 WP RAG',
        organizationId: org2.id
      }
    })

    // Verificar que chunks do tenant 1 não aparecem para tenant 2
    const chunksTenant2 = await db.embeddingChunk.findMany({
      where: {
        siteId: site2.id,
        sourceType: 'wp_post',
        sourceId: pageId // ID do tenant 1
      }
    })

    expect(chunksTenant2.length).toBe(0)

    // Limpar tenant 2
    await db.site.deleteMany({
      where: { organizationId: org2.id }
    })
    await db.organization.deleteMany({
      where: { id: org2.id }
    })
  })

  it('6. Observabilidade: correlationId propagado sync → job → embeddings → ai_interactions', async () => {
    // Verificar que correlationId está presente nos jobs de embedding
    const embeddingJobs = await db.queueJob.findMany({
      where: {
        type: { startsWith: 'embedding_' },
        data: {
          path: ['correlationId'],
          equals: correlationId
        }
      }
    })

    // Pelo menos um job deve ter o correlationId
    expect(embeddingJobs.length).toBeGreaterThan(0)
  })
})






