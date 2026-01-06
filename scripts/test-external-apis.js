#!/usr/bin/env node

const https = require('https');

console.log('🌐 TESTE DIRETO DAS APIS EXTERNAS');
console.log('==================================\n');

// Teste OpenAI direto
async function testOpenAIDirect() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Teste simples' }],
      max_tokens: 10,
      temperature: 0.7
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer your-openai-api-key-here',
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
            data: response
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            error: error.message
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

// Teste Gemini direto
async function testGeminiDirect() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [{
        parts: [{
          text: 'Teste simples'
        }]
      }],
      generationConfig: {
        maxOutputTokens: 10,
        temperature: 0.7
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: '/v1beta/models/gemini-pro:generateContent?key=your-google-gemini-api-key-here',
      method: 'POST',
      headers: {
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
            data: response
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            error: error.message
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
  try {
    console.log('🧪 Testando OpenAI diretamente...');
    const openaiResult = await testOpenAIDirect();
    
    console.log(`   Status: ${openaiResult.status}`);
    if (openaiResult.status === 200) {
      console.log('✅ OpenAI: FUNCIONANDO');
      console.log(`   Resposta: ${openaiResult.data.choices?.[0]?.message?.content || 'N/A'}`);
    } else {
      console.log('❌ OpenAI: ERRO');
      console.log(`   Erro: ${openaiResult.data?.error?.message || openaiResult.data || 'Erro desconhecido'}`);
    }

    console.log('\n🧪 Testando Gemini diretamente...');
    const geminiResult = await testGeminiDirect();
    
    console.log(`   Status: ${geminiResult.status}`);
    if (geminiResult.status === 200) {
      console.log('✅ Gemini: FUNCIONANDO');
      console.log(`   Resposta: ${geminiResult.data.candidates?.[0]?.content?.parts?.[0]?.text || 'N/A'}`);
    } else {
      console.log('❌ Gemini: ERRO');
      console.log(`   Erro: ${geminiResult.data?.error?.message || geminiResult.data || 'Erro desconhecido'}`);
    }

    console.log('\n📊 RESUMO:');
    console.log('===========');
    
    const openaiWorking = openaiResult.status === 200;
    const geminiWorking = geminiResult.status === 200;
    
    console.log(`✅ OpenAI: ${openaiWorking ? 'OK' : 'ERRO'}`);
    console.log(`✅ Gemini: ${geminiWorking ? 'OK' : 'ERRO'}`);
    
    if (openaiWorking && geminiWorking) {
      console.log('\n🎉 APIS EXTERNAS FUNCIONANDO!');
      console.log('   O problema pode estar no CMS');
    } else {
      console.log('\n⚠️  PROBLEMAS COM APIS EXTERNAS');
      console.log('   Verifique as chaves e conectividade');
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

module.exports = { testOpenAIDirect, testGeminiDirect };








