#!/usr/bin/env node

const http = require('http');

console.log('🧪 TESTE DO LABORATÓRIO DE IA');
console.log('==============================\n');

// Teste da API de IA
async function testAIAPI() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      prompt: 'Teste do Laboratório de IA',
      model: 'openai'
    });

    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/ai/test',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: response
          });
        } catch (error) {
          reject(new Error(`Erro ao parsear JSON: ${error.message}`));
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

// Teste da página do Laboratório
async function testAILabPage() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/ai-tests',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          hasContent: data.includes('Laboratório de IA'),
          contentLength: data.length
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Função principal
async function main() {
  try {
    console.log('🔍 Testando página do Laboratório de IA...');
    const pageResult = await testAILabPage();
    
    if (pageResult.status === 200) {
      console.log('✅ Página do Laboratório carregada com sucesso');
      console.log(`   Status: ${pageResult.status}`);
      console.log(`   Tamanho: ${pageResult.contentLength} bytes`);
      console.log(`   Contém título: ${pageResult.hasContent ? 'Sim' : 'Não'}`);
    } else {
      console.log(`❌ Erro ao carregar página: ${pageResult.status}`);
    }

    console.log('\n🧪 Testando API de IA...');
    const apiResult = await testAIAPI();
    
    if (apiResult.status === 200 && apiResult.data.success) {
      console.log('✅ API de IA funcionando');
      console.log(`   Status: ${apiResult.status}`);
      console.log(`   Resposta: ${apiResult.data.data?.content || 'N/A'}`);
      console.log(`   API Real: ${apiResult.data.isRealAPI ? 'Sim' : 'Não (Simulado)'}`);
    } else {
      console.log(`❌ Erro na API: ${apiResult.status}`);
      console.log(`   Erro: ${apiResult.data.error || 'Erro desconhecido'}`);
    }

    console.log('\n📊 RESUMO:');
    console.log('===========');
    console.log(`✅ Página: ${pageResult.status === 200 ? 'OK' : 'ERRO'}`);
    console.log(`✅ API: ${apiResult.status === 200 ? 'OK' : 'ERRO'}`);
    
    if (pageResult.status === 200 && apiResult.status === 200) {
      console.log('\n🎉 LABORATÓRIO DE IA FUNCIONANDO!');
      console.log('   Acesse: http://localhost:3002/ai-tests');
    } else {
      console.log('\n⚠️  ALGUNS PROBLEMAS DETECTADOS');
      console.log('   Verifique os logs do servidor');
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

module.exports = { testAIAPI, testAILabPage };








