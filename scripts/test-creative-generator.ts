/**
 * 🧪 Script de Teste - Creative Generator
 * 
 * Testa a integração do gerador de criativos com a API de IA
 */

import { CreativeGenerator, CreativeBrief } from '../lib/creative-generator'
import { AIService } from '../lib/ai-services'

async function testCreativeGenerator() {
  console.log('🧪 Iniciando testes do Creative Generator...\n')

  // Verificar variáveis de ambiente
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey.startsWith('sk-mock')) {
    console.warn('⚠️  OPENAI_API_KEY não configurada ou é mock')
    console.warn('   Configure OPENAI_API_KEY no arquivo .env.local\n')
  } else {
    console.log('✅ OPENAI_API_KEY configurada\n')
  }

  // Teste 1: Validação de briefing
  console.log('📋 Teste 1: Validação de Briefing')
  const invalidBrief: CreativeBrief = {
    productName: 'Produto com conteúdo proibido sobre violência',
    productDescription: 'Este produto promove violência e ódio'
  }
  
  const validation = CreativeGenerator.validateBriefing(invalidBrief)
  if (!validation.valid) {
    console.log('✅ Validação funcionando - conteúdo proibido detectado')
    console.log(`   Motivo: ${validation.reason}\n`)
  } else {
    console.log('❌ ERRO: Validação não detectou conteúdo proibido\n')
  }

  // Teste 2: Geração de ImagePrompt
  console.log('🖼️  Teste 2: Geração de ImagePrompt')
  const briefWithRefs: CreativeBrief = {
    productName: 'Curso de Marketing Digital',
    platform: 'instagram',
    imageReferences: [
      {
        url: 'https://example.com/style.jpg',
        role: 'style',
        description: 'estilo minimalista, cores vibrantes, iluminação clara'
      },
      {
        url: 'https://example.com/product.jpg',
        role: 'produto',
        description: 'notebook com tela mostrando dashboard'
      }
    ]
  }
  
  const imagePrompt = CreativeGenerator.generateImagePrompt(briefWithRefs)
  console.log('✅ ImagePrompt gerado:')
  console.log(`   ${imagePrompt}\n`)

  // Teste 3: Integração com AIService (se API key configurada)
  if (apiKey && !apiKey.startsWith('sk-mock')) {
    console.log('🤖 Teste 3: Integração com AIService')
    
    const validBrief: CreativeBrief = {
      productName: 'Curso Online de Programação',
      productDescription: 'Aprenda programação do zero com certificado',
      targetAudience: 'Iniciantes em tecnologia',
      keyBenefits: ['Certificado válido', 'Acesso vitalício', 'Suporte especializado'],
      tone: 'professional',
      platform: 'facebook',
      maxLength: 200,
      callToAction: 'Comece agora'
    }

    try {
      const aiService = new AIService({
        id: 'test-creative',
        name: 'Test Creative Service',
        type: 'openai',
        status: 'active',
        credentials: {
          apiKey: apiKey,
          endpoint: 'https://api.openai.com/v1'
        },
        settings: {
          model: 'gpt-4o-mini',
          maxTokens: 300,
          temperature: 0.8
        },
        usage: { requests: 0, tokens: 0, cost: 0 },
        lastUsed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })

      console.log('   Gerando criativo...')
      const result = await CreativeGenerator.generateCreative(validBrief, aiService)
      
      if (result.status === 'success') {
        console.log('✅ Criativo gerado com sucesso!')
        console.log(`\n   Copy (${result.metadata?.characterCount} caracteres):`)
        console.log(`   "${result.copy}"`)
        console.log(`\n   ImagePrompt:`)
        console.log(`   "${result.imagePrompt}"`)
      } else {
        console.log('❌ Falha na geração:')
        console.log(`   ${result.failureReason}`)
      }
    } catch (error) {
      console.log('❌ Erro na integração:')
      console.log(`   ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  } else {
    console.log('⏭️  Teste 3: Pulado (API key não configurada)')
    console.log('   Configure OPENAI_API_KEY para testar a integração completa\n')
  }

  // Teste 4: Teste de endpoint HTTP (simulado)
  console.log('🌐 Teste 4: Estrutura de Request/Response')
  const exampleRequest = {
    productName: 'Produto Teste',
    productDescription: 'Descrição do produto',
    targetAudience: 'Público-alvo',
    tone: 'professional',
    platform: 'facebook'
  }
  
  console.log('   Request exemplo:')
  console.log(JSON.stringify(exampleRequest, null, 2))
  
  console.log('\n   Response esperado:')
  console.log(JSON.stringify({
    status: 'success',
    copy: 'Copy gerada aqui...',
    imagePrompt: 'Prompt de imagem aqui...',
    metadata: {
      characterCount: 100,
      tone: 'professional',
      platform: 'facebook'
    }
  }, null, 2))

  console.log('\n✅ Testes concluídos!')
}

// Executar testes
testCreativeGenerator().catch(error => {
  console.error('❌ Erro ao executar testes:', error)
  process.exit(1)
})






