#!/usr/bin/env node

const https = require('https');

console.log('🔑 TESTE DA NOVA CHAVE OPENAI');
console.log('=============================\n');

// Função para testar nova chave OpenAI
async function testNewOpenAIKey(apiKey) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Teste da nova chave - responda apenas: "Funcionando!"' }],
      max_tokens: 10,
      temperature: 0.7
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: response,
            success: res.statusCode === 200
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            error: error.message,
            success: false
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Função principal
async function main() {
  const newApiKey = process.argv[2];
  
  if (!newApiKey) {
    console.log('❌ ERRO: Forneça a nova chave OpenAI como parâmetro');
    console.log('   Uso: node scripts/test-new-openai-key.js sk-sua-nova-chave-aqui');
    process.exit(1);
  }

  if (!newApiKey.startsWith('sk-')) {
    console.log('❌ ERRO: A chave deve começar com "sk-"');
    process.exit(1);
  }

  try {
    console.log('🧪 Testando nova chave OpenAI...');
    console.log(`   Chave: ${newApiKey.substring(0, 10)}...`);
    
    const result = await testNewOpenAIKey(newApiKey);
    
    console.log(`\n📡 Status: ${result.status}`);
    
    if (result.success) {
      console.log('✅ SUCESSO! Nova chave funcionando');
      console.log(`   Resposta: ${result.data.choices?.[0]?.message?.content || 'N/A'}`);
      console.log(`   Modelo: ${result.data.model || 'N/A'}`);
      console.log(`   Tokens: ${result.data.usage?.total_tokens || 'N/A'}`);
      
      console.log('\n🎉 CHAVE VÁLIDA! Pode ser usada no CMS');
    } else {
      console.log('❌ ERRO! Chave não funcionou');
      console.log(`   Erro: ${result.data?.error?.message || result.data || 'Erro desconhecido'}`);
      
      console.log('\n⚠️  VERIFIQUE:');
      console.log('   - Se a chave foi copiada corretamente');
      console.log('   - Se tem permissões adequadas');
      console.log('   - Se tem créditos disponíveis');
    }

  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { testNewOpenAIKey };








