/**
 * Script para gerar um post curto de teste e publicá-lo no WordPress
 */

const API_BASE = 'http://localhost:4000'

// Função auxiliar para fazer requisições
async function fetchAPI(endpoint, options = {}) {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    const data = await response.json().catch(() => ({ error: 'Erro ao parsear resposta' }))
    
    return {
      ok: response.ok,
      status: response.status,
      data
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: { error: error.message }
    }
  }
}

async function main() {
  console.log('\n' + '='.repeat(70))
  console.log('📝 GERANDO POST CURTO DE TESTE')
  console.log('='.repeat(70) + '\n')

  // 1. Obter siteId
  console.log('🔍 Obtendo sites disponíveis...')
  const sitesResponse = await fetchAPI('/api/organizations/sync')
  
  if (!sitesResponse.ok || !sitesResponse.data?.sites || sitesResponse.data.sites.length === 0) {
    console.error('❌ Nenhum site encontrado!')
    console.log('💡 Configure um site primeiro em Configurações > Sites')
    process.exit(1)
  }

  const siteId = sitesResponse.data.sites[0].id
  const siteName = sitesResponse.data.sites[0].name
  console.log(`✅ Site encontrado: ${siteName} (ID: ${siteId})\n`)

  // 2. Gerar conteúdo curto
  const title = "Post de Teste: Sistema de Publicação Funcionando"
  const keywords = "teste, cms, publicação automática"
  
  console.log(`📌 Título: ${title}`)
  console.log(`🔑 Palavras-chave: ${keywords}\n`)
  console.log('🤖 Gerando conteúdo com IA...')

  const generateResponse = await fetchAPI('/api/ai-content/generate', {
    method: 'POST',
    body: JSON.stringify({
      siteId,
      title,
      keywords,
      language: 'pt-BR',
      category: 'Teste',
      aiModel: 'gpt-4',
      prompt: `Crie um post curto e objetivo sobre o tema "${title}". 

REGRAS:
- Apenas 300-500 palavras (post curto para teste)
- Linguagem simples e direta
- Formatação HTML básica (parágrafos, negrito quando apropriado)
- Sem imagens no conteúdo
- Conclusão breve e positiva

Tema: Post de teste para verificar o sistema de publicação automática.`
    })
  })

  if (!generateResponse.ok || !generateResponse.data?.content) {
    console.error('❌ Erro ao gerar conteúdo:', generateResponse.status, generateResponse.data)
    process.exit(1)
  }

  const contentId = generateResponse.data.content.id
  console.log(`✅ Conteúdo gerado! ID: ${contentId}`)

  // 3. Aguardar um pouco para garantir que a geração assíncrona termine
  console.log('\n⏳ Aguardando processamento assíncrono (10 segundos)...')
  await new Promise(resolve => setTimeout(resolve, 10000))

  // 4. Verificar o conteúdo gerado
  console.log('\n📄 Verificando conteúdo gerado...')
  const contentResponse = await fetchAPI(`/api/ai-content/${contentId}`)

  if (!contentResponse.ok || !contentResponse.data?.content) {
    console.error('❌ Erro ao buscar conteúdo:', contentResponse.status, contentResponse.data)
    process.exit(1)
  }

  const content = contentResponse.data.content
  console.log(`✅ Status: ${content.status}`)
  console.log(`📊 Palavras: ${content.wordCount || 'N/A'}`)
  console.log(`📝 Conteúdo: ${content.content ? content.content.substring(0, 100) + '...' : 'Vazio'}`)

  if (!content.content || content.status === 'error') {
    console.error('❌ Conteúdo não foi gerado corretamente ou houve erro')
    console.log('💡 Aguarde alguns segundos e tente novamente, ou verifique os logs')
    process.exit(1)
  }

  // 5. Publicar no WordPress
  console.log('\n🚀 Publicando no WordPress...')
  const publishResponse = await fetchAPI(`/api/ai-content/${contentId}/publish`, {
    method: 'POST'
  })

  if (!publishResponse.ok) {
    console.error('❌ Erro ao publicar:', publishResponse.status, publishResponse.data)
    console.log('\n💡 O post foi criado no CMS, mas não foi publicado no WordPress.')
    console.log(`   Você pode publicá-lo manualmente em: http://localhost:4000/conteudo`)
    process.exit(1)
  }

  console.log('✅ Post publicado com sucesso!')
  
  if (publishResponse.data?.content?.wordpressUrl) {
    console.log(`🌐 URL do WordPress: ${publishResponse.data.content.wordpressUrl}`)
  }
  if (publishResponse.data?.content?.wordpressPostId) {
    console.log(`📌 ID do Post WordPress: ${publishResponse.data.content.wordpressPostId}`)
  }

  console.log('\n' + '='.repeat(70))
  console.log('✅ POST DE TESTE CRIADO E PUBLICADO COM SUCESSO!')
  console.log('='.repeat(70))
  console.log(`📝 ID no CMS: ${contentId}`)
  console.log(`📊 Palavras: ${content.wordCount}`)
  console.log(`📂 Status: ${publishResponse.data?.content?.status || content.status}`)
  console.log('\n💡 Próximos passos:')
  console.log(`   1. Verifique o post em: http://localhost:4000/conteudo`)
  console.log(`   2. Edite se necessário`)
  console.log(`   3. Verifique no WordPress se foi publicado corretamente`)
}

main().catch(error => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
})





