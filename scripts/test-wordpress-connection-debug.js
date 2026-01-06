// Script para debugar conexão WordPress
const https = require('https');
const http = require('http');

console.log('🔍 DEBUGANDO CONEXÃO WORDPRESS');
console.log('==============================\n');

// Dados do site ATLZ
const siteData = {
  url: 'https://atlz.online',
  wordpressUrl: 'https://atlz.online',
  wordpressUser: 'danilobrandao',
  wordpressAppPassword: 'iJnf 0vql tRVp ROMI GSZm daqA'
};

console.log('📋 DADOS DO SITE:');
console.log('=================');
console.log(`URL: ${siteData.url}`);
console.log(`WordPress URL: ${siteData.wordpressUrl}`);
console.log(`Usuário: ${siteData.wordpressUser}`);
console.log(`Senha de Aplicação: ${siteData.wordpressAppPassword.substring(0, 10)}...`);

// Função para testar endpoint
function testEndpoint(endpoint, description) {
  return new Promise((resolve) => {
    console.log(`\n🧪 TESTANDO: ${description}`);
    console.log(`URL: ${endpoint}`);
    
    const url = new URL(endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'CMS-Moderno/1.0',
        'Accept': 'application/json'
      }
    };

    const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        
        // Verificar se é JSON válido
        try {
          const jsonData = JSON.parse(data);
          console.log('✅ Resposta JSON válida');
          console.log(`Dados:`, JSON.stringify(jsonData, null, 2).substring(0, 200) + '...');
          resolve({ success: true, data: jsonData, status: res.statusCode });
        } catch (e) {
          console.log('❌ Resposta não é JSON válido');
          console.log(`Primeiros 200 caracteres:`, data.substring(0, 200));
          resolve({ success: false, data: data, status: res.statusCode, error: e.message });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro de conexão: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(10000, () => {
      console.log('❌ Timeout da requisição');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
}

// Função para testar com autenticação
function testWithAuth(endpoint, description) {
  return new Promise((resolve) => {
    console.log(`\n🔐 TESTANDO COM AUTH: ${description}`);
    console.log(`URL: ${endpoint}`);
    
    const url = new URL(endpoint);
    const auth = Buffer.from(`${siteData.wordpressUser}:${siteData.wordpressAppPassword}`).toString('base64');
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'CMS-Moderno/1.0',
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    };

    const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        
        // Verificar se é JSON válido
        try {
          const jsonData = JSON.parse(data);
          console.log('✅ Resposta JSON válida com auth');
          console.log(`Dados:`, JSON.stringify(jsonData, null, 2).substring(0, 200) + '...');
          resolve({ success: true, data: jsonData, status: res.statusCode });
        } catch (e) {
          console.log('❌ Resposta não é JSON válido com auth');
          console.log(`Primeiros 200 caracteres:`, data.substring(0, 200));
          resolve({ success: false, data: data, status: res.statusCode, error: e.message });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro de conexão com auth: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(10000, () => {
      console.log('❌ Timeout da requisição com auth');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
}

// Executar testes
async function runTests() {
  console.log('\n🚀 INICIANDO TESTES...');
  console.log('=======================');

  // Teste 1: Site básico
  const test1 = await testEndpoint(siteData.url, 'Site básico (sem API)');
  
  // Teste 2: REST API sem auth
  const test2 = await testEndpoint(`${siteData.wordpressUrl}/wp-json/wp/v2/`, 'REST API sem autenticação');
  
  // Teste 3: REST API com auth
  const test3 = await testWithAuth(`${siteData.wordpressUrl}/wp-json/wp/v2/posts?per_page=1`, 'REST API com autenticação (posts)');
  
  // Teste 4: Páginas com auth
  const test4 = await testWithAuth(`${siteData.wordpressUrl}/wp-json/wp/v2/pages?per_page=1`, 'REST API com autenticação (páginas)');
  
  // Teste 5: Mídia com auth
  const test5 = await testWithAuth(`${siteData.wordpressUrl}/wp-json/wp/v2/media?per_page=1`, 'REST API com autenticação (mídia)');

  // Resumo dos resultados
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('======================');
  console.log(`Site básico: ${test1.success ? '✅' : '❌'}`);
  console.log(`REST API sem auth: ${test2.success ? '✅' : '❌'}`);
  console.log(`Posts com auth: ${test3.success ? '✅' : '❌'}`);
  console.log(`Páginas com auth: ${test4.success ? '✅' : '❌'}`);
  console.log(`Mídia com auth: ${test5.success ? '✅' : '❌'}`);

  // Diagnóstico
  console.log('\n🔍 DIAGNÓSTICO:');
  console.log('================');
  
  if (!test1.success) {
    console.log('❌ Site não está acessível');
  }
  
  if (!test2.success) {
    console.log('❌ REST API não está habilitada ou acessível');
  }
  
  if (!test3.success && !test4.success && !test5.success) {
    console.log('❌ Problema de autenticação - verificar credenciais');
  } else if (test3.success || test4.success || test5.success) {
    console.log('✅ Autenticação funcionando');
  }

  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('====================');
  if (test3.success || test4.success || test5.success) {
    console.log('✅ Credenciais estão corretas');
    console.log('✅ Problema pode estar no proxy ou na integração CMS');
    console.log('🔧 Verificar logs do proxy WordPress');
  } else {
    console.log('❌ Credenciais podem estar incorretas');
    console.log('🔧 Verificar usuário e senha de aplicação');
    console.log('🔧 Verificar se REST API está habilitada');
  }
}

runTests().catch(console.error);











