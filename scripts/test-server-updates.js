// Script para testar se as atualizações foram aplicadas no servidor
const http = require('http');

console.log('🔄 VERIFICANDO ATUALIZAÇÕES NO SERVIDOR');
console.log('======================================\n');

// Dados do site ATLZ
const siteData = {
  url: 'https://atlz.online',
  wordpressUser: 'danilobrandao',
  wordpressAppPassword: 'iJnf 0vql tRVp ROMI GSZm daqA'
};

// Função para testar proxy
function testProxy() {
  return new Promise((resolve) => {
    console.log('🧪 TESTANDO PROXY WORDPRESS...');
    
    const auth = Buffer.from(`${siteData.wordpressUser}:${siteData.wordpressAppPassword}`).toString('base64');
    
    const postData = JSON.stringify({
      url: `${siteData.url}/wp-json/wp/v2/posts?per_page=1`,
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
          console.log('✅ Resposta JSON válida');
          console.log(`Success: ${result.success}`);
          console.log(`Status: ${result.status}`);
          
          if (result.success) {
            // Verificar se data é string ou array
            if (typeof result.data === 'string') {
              try {
                const parsedData = JSON.parse(result.data);
                console.log(`✅ Dados parseados: ${Array.isArray(parsedData) ? parsedData.length : 'não é array'} itens`);
                resolve({ success: true, data: parsedData, count: Array.isArray(parsedData) ? parsedData.length : 0 });
              } catch (e) {
                console.log('❌ Erro ao fazer parse dos dados:', e.message);
                console.log(`Primeiros 200 chars: ${result.data.substring(0, 200)}`);
                resolve({ success: false, error: 'Parse error', data: result.data });
              }
            } else if (Array.isArray(result.data)) {
              console.log(`✅ Dados diretos: ${result.data.length} itens`);
              resolve({ success: true, data: result.data, count: result.data.length });
            } else {
              console.log('❌ Dados não são string nem array');
              resolve({ success: false, error: 'Invalid data type', data: result.data });
            }
          } else {
            console.log('❌ Proxy retornou success: false');
            resolve({ success: false, error: 'Proxy returned false', data: result });
          }
        } catch (e) {
          console.log('❌ Erro ao fazer parse da resposta:', e.message);
          console.log(`Resposta (primeiros 500 chars): ${data.substring(0, 500)}`);
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

// Executar teste
async function runTest() {
  console.log('🚀 INICIANDO TESTE...');
  console.log('======================');

  const result = await testProxy();

  console.log('\n📊 RESULTADO:');
  console.log('=============');
  console.log(`Proxy funcionando: ${result.success ? '✅' : '❌'}`);
  
  if (result.success) {
    console.log(`Dados recebidos: ${result.count} itens`);
    console.log('✅ Atualizações aplicadas no servidor');
    console.log('✅ Sincronização deve funcionar');
  } else {
    console.log(`Erro: ${result.error}`);
    console.log('❌ Problema no servidor');
  }

  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('====================');
  if (result.success) {
    console.log('✅ Teste a sincronização no navegador');
    console.log('✅ Acesse: http://localhost:3002/settings?tab=sites');
    console.log('✅ Clique em "Sincronizar" no site ATLZ');
  } else {
    console.log('❌ Verificar logs do servidor');
    console.log('❌ Reiniciar servidor se necessário');
  }
}

runTest().catch(console.error);











