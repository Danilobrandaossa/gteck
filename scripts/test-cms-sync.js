// Script para testar sincronização via CMS
const https = require('https');
const http = require('http');

console.log('🔧 TESTANDO SINCRONIZAÇÃO VIA CMS');
console.log('==================================\n');

// Dados do site ATLZ
const siteData = {
  url: 'https://atlz.online',
  wordpressUrl: 'https://atlz.online',
  wordpressUser: 'danilobrandao',
  wordpressAppPassword: 'iJnf 0vql tRVp ROMI GSZm daqA'
};

// Função para testar proxy do CMS
function testCMSProxy(endpoint, description) {
  return new Promise((resolve) => {
    console.log(`\n🧪 TESTANDO VIA CMS: ${description}`);
    console.log(`Endpoint: ${endpoint}`);
    
    const url = new URL('http://localhost:3002/api/wordpress/proxy');
    const auth = Buffer.from(`${siteData.wordpressUser}:${siteData.wordpressAppPassword}`).toString('base64');
    
    const postData = JSON.stringify({
      url: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3002,
      path: url.pathname,
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
        console.log(`Headers:`, res.headers);
        
        try {
          const result = JSON.parse(data);
          console.log('✅ Resposta JSON válida do CMS');
          console.log(`Success: ${result.success}`);
          console.log(`Status: ${result.status}`);
          
          if (result.success) {
            // Verificar se result.data é string ou array
            if (typeof result.data === 'string') {
              try {
                const parsedData = JSON.parse(result.data);
                console.log(`Dados parseados: ${Array.isArray(parsedData) ? parsedData.length : 'não é array'} itens`);
                resolve({ success: true, data: parsedData, count: Array.isArray(parsedData) ? parsedData.length : 0 });
              } catch (e) {
                console.log('❌ Erro ao fazer parse dos dados:', e.message);
                console.log(`Primeiros 200 chars: ${result.data.substring(0, 200)}`);
                resolve({ success: false, error: 'Parse error', data: result.data });
              }
            } else if (Array.isArray(result.data)) {
              console.log(`Dados diretos: ${result.data.length} itens`);
              resolve({ success: true, data: result.data, count: result.data.length });
            } else {
              console.log('❌ Dados não são string nem array');
              resolve({ success: false, error: 'Invalid data type', data: result.data });
            }
          } else {
            console.log('❌ CMS retornou success: false');
            resolve({ success: false, error: 'CMS returned false', data: result });
          }
        } catch (e) {
          console.log('❌ Erro ao fazer parse da resposta do CMS:', e.message);
          console.log(`Resposta (primeiros 500 chars): ${data.substring(0, 500)}`);
          resolve({ success: false, error: e.message, data: data });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro de conexão com CMS: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(10000, () => {
      console.log('❌ Timeout da requisição para CMS');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.write(postData);
    req.end();
  });
}

// Executar testes
async function runTests() {
  console.log('🚀 INICIANDO TESTES VIA CMS...');
  console.log('================================');

  // Teste 1: Posts via CMS
  const test1 = await testCMSProxy(`${siteData.wordpressUrl}/wp-json/wp/v2/posts?per_page=1`, 'Posts via CMS');
  
  // Teste 2: Páginas via CMS
  const test2 = await testCMSProxy(`${siteData.wordpressUrl}/wp-json/wp/v2/pages?per_page=1`, 'Páginas via CMS');
  
  // Teste 3: Mídia via CMS
  const test3 = await testCMSProxy(`${siteData.wordpressUrl}/wp-json/wp/v2/media?per_page=1`, 'Mídia via CMS');

  // Resumo dos resultados
  console.log('\n📊 RESUMO DOS TESTES VIA CMS:');
  console.log('==============================');
  console.log(`Posts via CMS: ${test1.success ? '✅' : '❌'} ${test1.success ? `(${test1.count} itens)` : `(${test1.error})`}`);
  console.log(`Páginas via CMS: ${test2.success ? '✅' : '❌'} ${test2.success ? `(${test2.count} itens)` : `(${test2.error})`}`);
  console.log(`Mídia via CMS: ${test3.success ? '✅' : '❌'} ${test3.success ? `(${test3.count} itens)` : `(${test3.error})`}`);

  // Diagnóstico
  console.log('\n🔍 DIAGNÓSTICO CMS:');
  console.log('===================');
  
  if (test1.success && test2.success && test3.success) {
    console.log('✅ CMS proxy funcionando perfeitamente');
    console.log('✅ Sincronização deve funcionar');
  } else {
    console.log('❌ Problema no CMS proxy');
    if (!test1.success) console.log(`- Posts: ${test1.error}`);
    if (!test2.success) console.log(`- Páginas: ${test2.error}`);
    if (!test3.success) console.log(`- Mídia: ${test3.error}`);
  }

  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('====================');
  if (test1.success && test2.success && test3.success) {
    console.log('✅ CMS proxy funcionando');
    console.log('✅ Teste a sincronização no navegador');
    console.log('✅ Verifique os logs no console do navegador');
  } else {
    console.log('❌ Verificar configuração do CMS');
    console.log('🔧 Verificar se o servidor está rodando na porta 3002');
    console.log('🔧 Verificar logs do servidor Next.js');
  }
}

runTests().catch(console.error);











