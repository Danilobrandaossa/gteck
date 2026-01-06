#!/usr/bin/env node

const http = require('http');

console.log('🤖 TESTE DAS APIS REAIS DE IA');
console.log('==============================\n');

// Teste OpenAI
async function testOpenAI() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      prompt: 'Crie um título para um artigo sobre inteligência artificial',
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

// Teste Gemini
async function testGemini() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      prompt: 'Crie um título para um artigo sobre inteligência artificial',
      model: 'gemini'
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

// Teste Koala
async function testKoala() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      prompt: 'Crie um título para um artigo sobre inteligência artificial',
      model: 'koala'
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

// Função principal
async function main() {
  try {
    console.log('🧪 Testando OpenAI...');
    const openaiResult = await testOpenAI();
    
    if (openaiResult.status === 200 && openaiResult.data.success) {
      console.log('✅ OpenAI: SUCESSO');
      console.log(`   Resposta: ${openaiResult.data.data?.content || 'N/A'}`);
      console.log(`   API Real: ${openaiResult.data.isRealAPI ? 'SIM' : 'NÃO'}`);
    } else {
      console.log(`❌ OpenAI: ERRO ${openaiResult.status}`);
      console.log(`   Erro: ${openaiResult.data.error || 'Erro desconhecido'}`);
    }

    console.log('\n🧪 Testando Gemini...');
    const geminiResult = await testGemini();
    
    if (geminiResult.status === 200 && geminiResult.data.success) {
      console.log('✅ Gemini: SUCESSO');
      console.log(`   Resposta: ${geminiResult.data.data?.content || 'N/A'}`);
      console.log(`   API Real: ${geminiResult.data.isRealAPI ? 'SIM' : 'NÃO'}`);
    } else {
      console.log(`❌ Gemini: ERRO ${geminiResult.status}`);
      console.log(`   Erro: ${geminiResult.data.error || 'Erro desconhecido'}`);
    }

    console.log('\n🧪 Testando Koala...');
    const koalaResult = await testKoala();
    
    if (koalaResult.status === 200 && koalaResult.data.success) {
      console.log('✅ Koala: SUCESSO');
      console.log(`   Resposta: ${koalaResult.data.data?.content || 'N/A'}`);
      console.log(`   API Real: ${koalaResult.data.isRealAPI ? 'SIM' : 'NÃO'}`);
    } else {
      console.log(`❌ Koala: ERRO ${koalaResult.status}`);
      console.log(`   Erro: ${koalaResult.data.error || 'Erro desconhecido'}`);
    }

    console.log('\n📊 RESUMO:');
    console.log('===========');
    
    const results = [openaiResult, geminiResult, koalaResult];
    const successful = results.filter(r => r.status === 200 && r.data.success);
    const realAPIs = results.filter(r => r.status === 200 && r.data.success && r.data.isRealAPI);
    
    console.log(`✅ Sucessos: ${successful.length}/3`);
    console.log(`🔑 APIs Reais: ${realAPIs.length}/3`);
    
    if (realAPIs.length === successful.length) {
      console.log('\n🎉 TODAS AS APIS ESTÃO USANDO CHAVES REAIS!');
    } else if (realAPIs.length > 0) {
      console.log('\n🔧 ALGUMAS APIS ESTÃO USANDO CHAVES REAIS');
    } else {
      console.log('\n⚠️  NENHUMA API ESTÁ USANDO CHAVES REAIS');
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

module.exports = { testOpenAI, testGemini, testKoala };








