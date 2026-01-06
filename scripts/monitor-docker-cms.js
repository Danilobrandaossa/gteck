// Script para monitorar CMS no Docker em tempo real
const http = require('http');

console.log('🐳 MONITORANDO CMS NO DOCKER');
console.log('============================\n');

// Dados do site ATLZ
const siteData = {
  name: 'ATLZ',
  url: 'https://atlz.online',
  wordpressUrl: 'https://atlz.online',
  wordpressUser: 'danilobrandao',
  wordpressAppPassword: 'svWq K2kC fETN P8iq dppv kBhp'
};

// Função para testar CMS
function testCMS() {
  return new Promise((resolve) => {
    console.log('🧪 TESTANDO CMS NO DOCKER...');
    console.log('============================');
    
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'CMS-Monitor/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        
        if (res.statusCode === 200) {
          console.log('✅ CMS funcionando no Docker!');
          console.log('✅ Acessível em: http://localhost:3002');
          resolve({ success: true, status: res.statusCode });
        } else {
          console.log('❌ CMS com problemas');
          resolve({ success: false, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro de conexão: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(5000, () => {
      console.log('❌ Timeout da requisição');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
}

// Função para testar sincronização WordPress
function testWordPressSync() {
  return new Promise((resolve) => {
    console.log('\n🔄 TESTANDO SINCRONIZAÇÃO WORDPRESS...');
    console.log('=====================================');
    
    const auth = Buffer.from(`${siteData.wordpressUser}:${siteData.wordpressAppPassword}`).toString('base64');
    
    const postData = JSON.stringify({
      url: `${siteData.wordpressUrl}/wp-json/wp/v2/posts?per_page=1`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
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
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        
        try {
          const result = JSON.parse(data);
          console.log(`Success: ${result.success}`);
          
          if (result.success) {
            console.log('✅ Sincronização WordPress funcionando!');
            console.log('✅ Proxy funcionando no Docker!');
            resolve({ success: true, data: result });
          } else {
            console.log('❌ Sincronização com problemas');
            console.log(`Erro: ${result.error || 'Erro desconhecido'}`);
            resolve({ success: false, error: result.error });
          }
        } catch (e) {
          console.log('❌ Erro ao fazer parse da resposta:', e.message);
          resolve({ success: false, error: e.message });
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

    req.write(postData);
    req.end();
  });
}

// Função para monitorar logs em tempo real
function monitorLogs() {
  console.log('\n📊 MONITORANDO LOGS EM TEMPO REAL...');
  console.log('====================================');
  console.log('Para ver logs em tempo real, execute:');
  console.log('docker logs cms_app -f');
  console.log('');
  console.log('Para ver logs de todos os containers:');
  console.log('docker-compose logs -f');
}

// Executar monitoramento completo
async function runMonitoring() {
  console.log('🚀 INICIANDO MONITORAMENTO COMPLETO...');
  console.log('======================================');
  
  // Teste 1: CMS funcionando
  const cmsTest = await testCMS();
  
  // Teste 2: Sincronização WordPress
  const syncTest = await testWordPressSync();
  
  // Monitoramento de logs
  monitorLogs();
  
  // Resumo dos resultados
  console.log('\n📊 RESUMO DO MONITORAMENTO:');
  console.log('============================');
  console.log(`CMS funcionando: ${cmsTest.success ? '✅' : '❌'}`);
  console.log(`Sincronização WordPress: ${syncTest.success ? '✅' : '❌'}`);
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('===================');
  if (cmsTest.success && syncTest.success) {
    console.log('✅ CMS funcionando perfeitamente no Docker!');
    console.log('✅ Sincronização WordPress funcionando!');
    console.log('✅ Pronto para cadastrar o site ATLZ!');
    console.log('');
    console.log('📋 INSTRUÇÕES:');
    console.log('1. Acesse: http://localhost:3002');
    console.log('2. Vá para: Configurações > Sites');
    console.log('3. Clique em: "Adicionar Site"');
    console.log('4. Preencha os dados do ATLZ');
    console.log('5. Teste a sincronização');
  } else {
    console.log('❌ Alguns problemas detectados');
    if (!cmsTest.success) {
      console.log('❌ CMS não está funcionando');
    }
    if (!syncTest.success) {
      console.log('❌ Sincronização WordPress com problemas');
    }
  }
  
  console.log('\n🔍 COMANDOS ÚTEIS:');
  console.log('==================');
  console.log('Ver logs do CMS: docker logs cms_app -f');
  console.log('Ver logs de todos: docker-compose logs -f');
  console.log('Status dos containers: docker ps');
  console.log('Reiniciar CMS: docker-compose restart cms');
  console.log('Parar tudo: docker-compose down');
  console.log('Iniciar tudo: docker-compose up -d');
}

runMonitoring().catch(console.error);











