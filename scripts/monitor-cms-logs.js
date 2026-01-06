// Script para monitorar logs do CMS em tempo real
const http = require('http');
const https = require('https');

console.log('🔍 MONITORANDO LOGS DO CMS');
console.log('===========================\n');

// Função para testar sincronização e capturar erros
function testSyncAndCaptureErrors() {
  return new Promise((resolve) => {
    console.log('🧪 TESTANDO SINCRONIZAÇÃO E CAPTURANDO ERROS...');
    
    const auth = Buffer.from('danilobrandao:iJnf 0vql tRVp ROMI GSZm daqA').toString('base64');
    
    const postData = JSON.stringify({
      url: 'https://atlz.online/wp-json/wp/v2/posts?per_page=1',
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
        console.log(`\n📊 RESPOSTA DO SERVIDOR:`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        
        try {
          const result = JSON.parse(data);
          console.log(`\n✅ Resposta JSON válida`);
          console.log(`Success: ${result.success}`);
          console.log(`Status: ${result.status}`);
          
          if (result.success) {
            console.log(`✅ Proxy funcionando`);
            if (typeof result.data === 'string') {
              try {
                const parsedData = JSON.parse(result.data);
                console.log(`✅ Dados parseados: ${parsedData.length} itens`);
                resolve({ success: true, data: parsedData });
              } catch (e) {
                console.log(`❌ Erro ao fazer parse: ${e.message}`);
                console.log(`Dados recebidos: ${result.data.substring(0, 200)}...`);
                resolve({ success: false, error: e.message, data: result.data });
              }
            } else if (Array.isArray(result.data)) {
              console.log(`✅ Dados diretos: ${result.data.length} itens`);
              resolve({ success: true, data: result.data });
            } else {
              console.log(`❌ Tipo de dados inválido: ${typeof result.data}`);
              resolve({ success: false, error: 'Invalid data type', data: result.data });
            }
          } else {
            console.log(`❌ Proxy retornou success: false`);
            console.log(`Erro: ${result.error || 'Erro desconhecido'}`);
            resolve({ success: false, error: result.error || 'Proxy failed' });
          }
        } catch (e) {
          console.log(`❌ Erro ao fazer parse da resposta: ${e.message}`);
          console.log(`Resposta bruta: ${data.substring(0, 500)}...`);
          resolve({ success: false, error: e.message, data: data });
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

// Função para testar múltiplas requisições
async function testMultipleRequests() {
  console.log('🔄 TESTANDO MÚLTIPLAS REQUISIÇÕES...');
  console.log('=====================================');
  
  const endpoints = [
    { name: 'Posts', url: 'https://atlz.online/wp-json/wp/v2/posts?per_page=1' },
    { name: 'Páginas', url: 'https://atlz.online/wp-json/wp/v2/pages?per_page=1' },
    { name: 'Mídia', url: 'https://atlz.online/wp-json/wp/v2/media?per_page=1' }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testando ${endpoint.name}...`);
    
    const auth = Buffer.from('danilobrandao:iJnf 0vql tRVp ROMI GSZm daqA').toString('base64');
    
    const postData = JSON.stringify({
      url: endpoint.url,
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

    try {
      const result = await new Promise((resolve) => {
        const req = http.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              if (response.success) {
                let count = 0;
                if (typeof response.data === 'string') {
                  count = JSON.parse(response.data).length;
                } else if (Array.isArray(response.data)) {
                  count = response.data.length;
                }
                console.log(`✅ ${endpoint.name}: ${count} itens`);
                resolve({ success: true, count });
              } else {
                console.log(`❌ ${endpoint.name}: ${response.error || 'Erro desconhecido'}`);
                resolve({ success: false, error: response.error });
              }
            } catch (e) {
              console.log(`❌ ${endpoint.name}: Erro de parse - ${e.message}`);
              resolve({ success: false, error: e.message });
            }
          });
        });

        req.on('error', (error) => {
          console.log(`❌ ${endpoint.name}: Erro de conexão - ${error.message}`);
          resolve({ success: false, error: error.message });
        });

        req.setTimeout(5000, () => {
          console.log(`❌ ${endpoint.name}: Timeout`);
          req.destroy();
          resolve({ success: false, error: 'Timeout' });
        });

        req.write(postData);
        req.end();
      });
      
      // Aguardar um pouco entre requisições
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Erro geral - ${error.message}`);
    }
  }
}

// Executar monitoramento
async function runMonitoring() {
  console.log('🚀 INICIANDO MONITORAMENTO...');
  console.log('==============================');
  
  // Teste 1: Requisição única
  console.log('\n📋 TESTE 1: REQUISIÇÃO ÚNICA');
  console.log('============================');
  const singleTest = await testSyncAndCaptureErrors();
  
  // Teste 2: Múltiplas requisições
  console.log('\n📋 TESTE 2: MÚLTIPLAS REQUISIÇÕES');
  console.log('==================================');
  await testMultipleRequests();
  
  // Resumo
  console.log('\n📊 RESUMO DO MONITORAMENTO:');
  console.log('=============================');
  console.log(`Requisição única: ${singleTest.success ? '✅' : '❌'}`);
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('===================');
  if (singleTest.success) {
    console.log('✅ CMS funcionando corretamente');
    console.log('✅ Teste a sincronização no navegador');
    console.log('✅ Verifique se os dados aparecem');
  } else {
    console.log('❌ Problema identificado no CMS');
    console.log('❌ Verificar logs do servidor Next.js');
    console.log('❌ Reiniciar servidor se necessário');
  }
  
  console.log('\n💡 DICAS PARA DEBUG:');
  console.log('=====================');
  console.log('1. Abra o DevTools (F12) no navegador');
  console.log('2. Vá para a aba "Console"');
  console.log('3. Tente sincronizar no CMS');
  console.log('4. Verifique os erros no console');
  console.log('5. Verifique a aba "Network" para requisições falhadas');
}

runMonitoring().catch(console.error);











