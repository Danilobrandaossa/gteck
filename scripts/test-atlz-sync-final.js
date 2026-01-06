// Script final para testar sincronização ATLZ
const http = require('http');

console.log('🎯 TESTE FINAL - SINCRONIZAÇÃO ATLZ');
console.log('===================================\n');

// Dados do site ATLZ
const siteData = {
  name: 'ATLZ',
  url: 'https://atlz.online',
  wordpressUrl: 'https://atlz.online',
  wordpressUser: 'danilobrandao',
  wordpressAppPassword: 'svWq K2kC fETN P8iq dppv kBhp'
};

// Função para testar conexão WordPress
function testWordPressConnection() {
  return new Promise((resolve) => {
    console.log('🔗 TESTANDO CONEXÃO WORDPRESS...');
    console.log('================================');
    
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
          
          if (result.success && result.data) {
            let dataArray = [];
            if (typeof result.data === 'string') {
              dataArray = JSON.parse(result.data);
            } else if (Array.isArray(result.data)) {
              dataArray = result.data;
            }
            
            console.log(`Posts encontrados: ${dataArray.length}`);
            if (dataArray.length > 0) {
              console.log(`Primeiro post: ${dataArray[0].title?.rendered || 'Sem título'}`);
            }
            
            console.log('✅ CONEXÃO WORDPRESS FUNCIONANDO!');
            resolve({ success: true, data: dataArray });
          } else {
            console.log('❌ CONEXÃO WORDPRESS COM PROBLEMAS');
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

// Função para testar páginas
function testPages() {
  return new Promise((resolve) => {
    console.log('\n📄 TESTANDO PÁGINAS...');
    console.log('======================');
    
    const auth = Buffer.from(`${siteData.wordpressUser}:${siteData.wordpressAppPassword}`).toString('base64');
    
    const postData = JSON.stringify({
      url: `${siteData.wordpressUrl}/wp-json/wp/v2/pages?per_page=1`,
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
        try {
          const result = JSON.parse(data);
          if (result.success && result.data) {
            let dataArray = [];
            if (typeof result.data === 'string') {
              dataArray = JSON.parse(result.data);
            } else if (Array.isArray(result.data)) {
              dataArray = result.data;
            }
            
            console.log(`Páginas encontradas: ${dataArray.length}`);
            console.log('✅ PÁGINAS FUNCIONANDO!');
            resolve({ success: true, count: dataArray.length });
          } else {
            console.log('❌ PÁGINAS COM PROBLEMAS');
            resolve({ success: false });
          }
        } catch (e) {
          console.log('❌ Erro ao processar páginas:', e.message);
          resolve({ success: false });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro de conexão: ${error.message}`);
      resolve({ success: false });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false });
    });

    req.write(postData);
    req.end();
  });
}

// Função para testar mídia
function testMedia() {
  return new Promise((resolve) => {
    console.log('\n🖼️ TESTANDO MÍDIA...');
    console.log('====================');
    
    const auth = Buffer.from(`${siteData.wordpressUser}:${siteData.wordpressAppPassword}`).toString('base64');
    
    const postData = JSON.stringify({
      url: `${siteData.wordpressUrl}/wp-json/wp/v2/media?per_page=1`,
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
        try {
          const result = JSON.parse(data);
          if (result.success && result.data) {
            let dataArray = [];
            if (typeof result.data === 'string') {
              dataArray = JSON.parse(result.data);
            } else if (Array.isArray(result.data)) {
              dataArray = result.data;
            }
            
            console.log(`Mídia encontrada: ${dataArray.length}`);
            console.log('✅ MÍDIA FUNCIONANDO!');
            resolve({ success: true, count: dataArray.length });
          } else {
            console.log('❌ MÍDIA COM PROBLEMAS');
            resolve({ success: false });
          }
        } catch (e) {
          console.log('❌ Erro ao processar mídia:', e.message);
          resolve({ success: false });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro de conexão: ${error.message}`);
      resolve({ success: false });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false });
    });

    req.write(postData);
    req.end();
  });
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 INICIANDO TESTES COMPLETOS...');
  console.log('================================');
  
  const connectionTest = await testWordPressConnection();
  const pagesTest = await testPages();
  const mediaTest = await testMedia();
  
  console.log('\n📊 RESUMO FINAL:');
  console.log('================');
  console.log(`Conexão WordPress: ${connectionTest.success ? '✅' : '❌'}`);
  console.log(`Páginas: ${pagesTest.success ? '✅' : '❌'}`);
  console.log(`Mídia: ${mediaTest.success ? '✅' : '❌'}`);
  
  if (connectionTest.success && pagesTest.success && mediaTest.success) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ CMS funcionando perfeitamente!');
    console.log('✅ Sincronização WordPress funcionando!');
    console.log('✅ Pronto para cadastrar o site ATLZ!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Acesse: http://localhost:3002');
    console.log('2. Vá para: Configurações > Sites');
    console.log('3. Clique em: "Adicionar Site"');
    console.log('4. Preencha os dados do ATLZ');
    console.log('5. Teste a sincronização');
  } else {
    console.log('\n❌ ALGUNS TESTES FALHARAM');
    console.log('Verifique as configurações do WordPress');
  }
}

runAllTests().catch(console.error);











