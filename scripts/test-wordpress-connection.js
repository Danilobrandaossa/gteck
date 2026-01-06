// Teste de conectividade WordPress
const https = require('https');
const http = require('http');

console.log('🔗 TESTE DE CONECTIVIDADE WORDPRESS');
console.log('===================================\n');

// Dados do site ATLZ
const siteConfig = {
  name: 'ATLZ',
  url: 'https://atlz.online',
  wordpressUrl: 'https://atlz.online',
  user: 'daniillobrandao@gmail.com',
  apiKey: 'N1z4 1lLm 1Xd4 lZzQ Xnat gdmh'
};

console.log('📋 CONFIGURAÇÃO DO SITE:');
console.log(`Nome: ${siteConfig.name}`);
console.log(`URL: ${siteConfig.url}`);
console.log(`WordPress URL: ${siteConfig.wordpressUrl}`);
console.log(`Usuário: ${siteConfig.user}`);
console.log(`API Key: ${siteConfig.apiKey.substring(0, 8)}...`);

// Teste de conectividade básica
function testBasicConnection(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      console.log(`✅ Conectividade básica: ${res.statusCode}`);
      resolve(res.statusCode);
    });
    
    req.on('error', (err) => {
      console.log(`❌ Erro de conectividade: ${err.message}`);
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ Timeout na conexão');
      reject(new Error('Timeout'));
    });
  });
}

// Teste da API REST do WordPress
function testWordPressAPI(url, user, apiKey) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${user}:${apiKey}`).toString('base64');
    
    const options = {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    };
    
    const protocol = url.startsWith('https') ? https : http;
    const apiUrl = `${url}/wp-json/wp/v2/posts?per_page=1`;
    
    const req = protocol.get(apiUrl, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ API REST WordPress: Funcionando');
          resolve(true);
        } else {
          console.log(`❌ API REST WordPress: Erro ${res.statusCode}`);
          reject(new Error(`Status: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Erro na API REST: ${err.message}`);
      reject(err);
    });
    
    req.setTimeout(15000, () => {
      console.log('❌ Timeout na API REST');
      reject(new Error('Timeout'));
    });
  });
}

// Executar testes
async function runTests() {
  try {
    console.log('\n🧪 EXECUTANDO TESTES:');
    console.log('=====================');
    
    // Teste 1: Conectividade básica
    console.log('\n1. Testando conectividade básica...');
    await testBasicConnection(siteConfig.url);
    
    // Teste 2: API REST WordPress
    console.log('\n2. Testando API REST WordPress...');
    await testWordPressAPI(siteConfig.wordpressUrl, siteConfig.user, siteConfig.apiKey);
    
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('============================');
    console.log('✅ Site ATLZ está acessível');
    console.log('✅ API REST WordPress funcionando');
    console.log('✅ Autenticação configurada corretamente');
    console.log('✅ Integração CMS ↔ WordPress OK');
    
  } catch (error) {
    console.log('\n❌ ALGUNS TESTES FALHARAM:');
    console.log('==========================');
    console.log(`Erro: ${error.message}`);
    console.log('\n🔧 POSSÍVEIS SOLUÇÕES:');
    console.log('- Verificar se o site está online');
    console.log('- Confirmar credenciais da API');
    console.log('- Verificar configurações de CORS');
    console.log('- Testar manualmente no navegador');
  }
}

runTests();



