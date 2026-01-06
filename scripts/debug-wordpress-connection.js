// Script para debugar conexão WordPress em tempo real
const http = require('http');
const https = require('https');

console.log('🔍 DEBUG CONEXÃO WORDPRESS - TEMPO REAL');
console.log('======================================\n');

// Dados do site ATLZ
const siteData = {
  name: 'ATLZ',
  url: 'https://atlz.online',
  wordpressUrl: 'https://atlz.online',
  wordpressUser: 'danilobrandao',
  wordpressAppPassword: 'svWq K2kC fETN P8iq dppv kBhp'
};

// Função para testar conexão direta
function testDirectConnection() {
  return new Promise((resolve) => {
    console.log('🌐 TESTANDO CONEXÃO DIRETA...');
    console.log('=============================');
    console.log(`URL: ${siteData.wordpressUrl}`);
    console.log(`Usuário: ${siteData.wordpressUser}`);
    console.log(`Senha: ${siteData.wordpressAppPassword.substring(0, 8)}...`);
    
    const auth = Buffer.from(`${siteData.wordpressUser}:${siteData.wordpressAppPassword}`).toString('base64');
    
    const options = {
      hostname: 'atlz.online',
      port: 443,
      path: '/wp-json/wp/v2/posts?per_page=1',
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'CMS-Moderno/1.0',
        'Accept': 'application/json'
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Dados recebidos: ${data.length} bytes`);
        console.log(`Primeiros 200 chars: ${data.substring(0, 200)}`);
        
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            console.log(`Posts encontrados: ${jsonData.length}`);
            if (jsonData.length > 0) {
              console.log(`Primeiro post: ${jsonData[0].title?.rendered || 'Sem título'}`);
            }
            console.log('✅ CONEXÃO DIRETA FUNCIONANDO!');
            resolve({ success: true, data: jsonData });
          } catch (e) {
            console.log('❌ Erro ao fazer parse JSON:', e.message);
            console.log('Resposta recebida:', data);
            resolve({ success: false, error: e.message, rawData: data });
          }
        } else {
          console.log('❌ Status não OK:', res.statusCode);
          console.log('Resposta:', data);
          resolve({ success: false, error: `Status ${res.statusCode}`, rawData: data });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro de conexão: ${error.message}`);
      console.log(`Código: ${error.code}`);
      resolve({ success: false, error: error.message, code: error.code });
    });

    req.on('timeout', () => {
      console.log('❌ Timeout da conexão');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.setTimeout(15000);
    req.end();
  });
}

// Função para testar via proxy CMS
function testViaProxy() {
  return new Promise((resolve) => {
    console.log('\n🔄 TESTANDO VIA PROXY CMS...');
    console.log('============================');
    
    const auth = Buffer.from(`${siteData.wordpressUser}:${siteData.wordpressAppPassword}`).toString('base64');
    
    const postData = JSON.stringify({
      url: `${siteData.wordpressUrl}/wp-json/wp/v2/posts?per_page=1`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'CMS-Moderno/1.0',
        'Accept': 'application/json'
      }
    });
    
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/wordpress/proxy',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      console.log(`Status: ${res.statusCode}`);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Dados recebidos: ${data.length} bytes`);
        
        try {
          const result = JSON.parse(data);
          console.log(`Success: ${result.success}`);
          
          if (result.success) {
            let dataArray = [];
            if (typeof result.data === 'string') {
              dataArray = JSON.parse(result.data);
            } else if (Array.isArray(result.data)) {
              dataArray = result.data;
            }
            
            console.log(`Posts via proxy: ${dataArray.length}`);
            console.log('✅ PROXY CMS FUNCIONANDO!');
            resolve({ success: true, data: dataArray });
          } else {
            console.log('❌ PROXY CMS COM PROBLEMAS');
            console.log(`Erro: ${result.error || 'Erro desconhecido'}`);
            resolve({ success: false, error: result.error });
          }
        } catch (e) {
          console.log('❌ Erro ao fazer parse da resposta do proxy:', e.message);
          console.log('Resposta bruta:', data.substring(0, 500));
          resolve({ success: false, error: e.message, rawData: data });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro de conexão com proxy: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(15000, () => {
      console.log('❌ Timeout da requisição ao proxy');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.write(postData);
    req.end();
  });
}

// Função para testar conectividade básica
function testBasicConnectivity() {
  return new Promise((resolve) => {
    console.log('\n🌍 TESTANDO CONECTIVIDADE BÁSICA...');
    console.log('===================================');
    
    const options = {
      hostname: 'atlz.online',
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Site acessível: ${res.statusCode === 200 ? '✅' : '❌'}`);
        console.log(`Tamanho da resposta: ${data.length} bytes`);
        resolve({ success: res.statusCode === 200, status: res.statusCode });
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro de conectividade: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      console.log('❌ Timeout na conectividade');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.setTimeout(10000);
    req.end();
  });
}

// Executar todos os testes
async function runDebugTests() {
  console.log('🚀 INICIANDO DEBUG COMPLETO...');
  console.log('===============================');
  
  const basicTest = await testBasicConnectivity();
  const directTest = await testDirectConnection();
  const proxyTest = await testViaProxy();
  
  console.log('\n📊 RESUMO DO DEBUG:');
  console.log('===================');
  console.log(`Conectividade básica: ${basicTest.success ? '✅' : '❌'}`);
  console.log(`Conexão direta WordPress: ${directTest.success ? '✅' : '❌'}`);
  console.log(`Proxy CMS: ${proxyTest.success ? '✅' : '❌'}`);
  
  console.log('\n🔧 POSSÍVEIS SOLUÇÕES:');
  console.log('=======================');
  
  if (!basicTest.success) {
    console.log('❌ Site não acessível - verifique DNS/conectividade');
  }
  
  if (!directTest.success) {
    console.log('❌ WordPress API bloqueada - verifique:');
    console.log('   - Credenciais corretas');
    console.log('   - REST API habilitada');
    console.log('   - Plugins de segurança');
    console.log('   - Firewall do servidor');
  }
  
  if (!proxyTest.success) {
    console.log('❌ Proxy CMS com problemas - verifique:');
    console.log('   - CMS rodando corretamente');
    console.log('   - Configuração do proxy');
  }
  
  if (directTest.success && !proxyTest.success) {
    console.log('🔧 SOLUÇÃO: Problema no proxy CMS - vamos corrigir');
  }
  
  if (!directTest.success) {
    console.log('🔧 SOLUÇÃO: Problema na conexão WordPress - verifique credenciais');
  }
}

runDebugTests().catch(console.error);











