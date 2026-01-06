#!/usr/bin/env node

const https = require('https');
const http = require('http');

console.log('🤖 TESTE SIMPLES DE APIS DE IA');
console.log('==============================\n');

// Configurações das APIs
const apiConfigs = [
  {
    name: 'OpenAI GPT-4',
    type: 'openai',
    endpoint: 'http://localhost:3002/api/ai/generate',
    apiKey: 'your-openai-api-key-here'
  },
  {
    name: 'Google Gemini',
    type: 'gemini', 
    endpoint: 'http://localhost:3002/api/ai/generate',
    apiKey: 'your-google-gemini-api-key-here'
  },
  {
    name: 'Koala.sh SEO',
    type: 'koala',
    endpoint: 'http://localhost:3002/api/ai/generate',
    apiKey: 'b97d07a6-2d70-4a62-8810-bbd8d94ff231'
  }
];

// Prompt de teste
const testPrompt = 'Crie um título para um artigo sobre inteligência artificial';

// Função para fazer requisição HTTP
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers
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

// Função para testar uma API
async function testAPI(apiConfig) {
  console.log(`🧪 Testando ${apiConfig.name}...`);
  
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(apiConfig.endpoint, {
      prompt: testPrompt,
      model: apiConfig.type,
      maxTokens: 100,
      temperature: 0.7
    });

    const duration = Date.now() - startTime;

    if (response.status === 200 && response.data.success) {
      console.log(`✅ ${apiConfig.name}: SUCESSO`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Duração: ${duration}ms`);
      console.log(`   Resposta: ${response.data.data?.content?.substring(0, 100)}...`);
      
      if (response.data.usage) {
        console.log(`   Tokens: ${response.data.usage.totalTokens || 'N/A'}`);
        console.log(`   Custo: $${response.data.usage.cost || 'N/A'}`);
      }
      
      return { success: true, duration, response: response.data };
    } else {
      console.log(`❌ ${apiConfig.name}: ERRO`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Erro: ${response.data.error || 'Erro desconhecido'}`);
      
      return { success: false, duration, error: response.data.error };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ ${apiConfig.name}: FALHA DE CONEXÃO`);
    console.log(`   Erro: ${error.message}`);
    console.log(`   Duração: ${duration}ms`);
    
    return { success: false, duration, error: error.message };
  }
  
  console.log('');
}

// Função para testar todas as APIs
async function testAllAPIs() {
  console.log('🚀 INICIANDO TESTES DE IA...');
  console.log('=============================\n');
  
  const results = [];
  
  for (const apiConfig of apiConfigs) {
    const result = await testAPI(apiConfig);
    results.push({
      name: apiConfig.name,
      ...result
    });
    
    // Pequena pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

// Função para mostrar resumo
function showSummary(results) {
  console.log('\n📊 RESUMO DOS TESTES');
  console.log('=====================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Sucessos: ${successful.length}/${results.length}`);
  console.log(`❌ Falhas: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎉 APIs FUNCIONANDO:');
    successful.forEach(result => {
      console.log(`   ✅ ${result.name} (${result.duration}ms)`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n⚠️  APIs COM PROBLEMAS:');
    failed.forEach(result => {
      console.log(`   ❌ ${result.name}: ${result.error}`);
    });
  }
  
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  console.log(`\n⏱️  Duração média: ${Math.round(avgDuration)}ms`);
  
  if (successful.length === results.length) {
    console.log('\n🎯 TODAS AS APIS ESTÃO FUNCIONANDO!');
  } else {
    console.log('\n🔧 ALGUMAS APIS PRECISAM DE AJUSTES');
  }
}

// Função principal
async function main() {
  try {
    const results = await testAllAPIs();
    showSummary(results);
    
    // Código de saída baseado nos resultados
    const allSuccessful = results.every(r => r.success);
    process.exit(allSuccessful ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { testAllAPIs, testAPI };








