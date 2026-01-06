// Script para cadastrar site ATLZ e testar conexão
const http = require('http');

console.log('🔧 CADASTRANDO SITE ATLZ');
console.log('========================\n');

// Dados do site ATLZ
const siteData = {
  name: 'ATLZ',
  url: 'https://atlz.online',
  wordpressUrl: 'https://atlz.online',
  wordpressUser: 'danilobrandao',
  wordpressAppPassword: 'svWq K2kC fETN P8iq dppv kBhp'
};

console.log('📋 DADOS DO SITE:');
console.log('==================');
console.log(`Nome: ${siteData.name}`);
console.log(`URL: ${siteData.url}`);
console.log(`WordPress URL: ${siteData.wordpressUrl}`);
console.log(`Usuário: ${siteData.wordpressUser}`);
console.log(`Senha de Aplicação: ${siteData.wordpressAppPassword.substring(0, 10)}...`);

// Função para testar conexão
function testConnection() {
  return new Promise((resolve) => {
    console.log('\n🧪 TESTANDO CONEXÃO...');
    console.log('========================');
    
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
            console.log('✅ Conexão funcionando!');
            if (typeof result.data === 'string') {
              try {
                const parsedData = JSON.parse(result.data);
                console.log(`✅ Posts encontrados: ${parsedData.length}`);
                resolve({ success: true, posts: parsedData.length });
              } catch (e) {
                console.log('❌ Erro ao fazer parse dos dados');
                resolve({ success: false, error: 'Parse error' });
              }
            } else if (Array.isArray(result.data)) {
              console.log(`✅ Posts encontrados: ${result.data.length}`);
              resolve({ success: true, posts: result.data.length });
            } else {
              console.log('❌ Dados não são string nem array');
              resolve({ success: false, error: 'Invalid data type' });
            }
          } else {
            console.log('❌ Conexão falhou');
            console.log(`Erro: ${result.error || 'Erro desconhecido'}`);
            resolve({ success: false, error: result.error || 'Connection failed' });
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

// Função para testar sincronização completa
async function testFullSync() {
  console.log('\n🔄 TESTANDO SINCRONIZAÇÃO COMPLETA...');
  console.log('=====================================');
  
  const endpoints = [
    { name: 'Posts', url: `${siteData.wordpressUrl}/wp-json/wp/v2/posts?per_page=1` },
    { name: 'Páginas', url: `${siteData.wordpressUrl}/wp-json/wp/v2/pages?per_page=1` },
    { name: 'Mídia', url: `${siteData.wordpressUrl}/wp-json/wp/v2/media?per_page=1` },
    { name: 'Usuários', url: `${siteData.wordpressUrl}/wp-json/wp/v2/users?per_page=1` }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testando ${endpoint.name}...`);
    
    const auth = Buffer.from(`${siteData.wordpressUser}:${siteData.wordpressAppPassword}`).toString('base64');
    
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
      
      results.push({ endpoint: endpoint.name, ...result });
      
      // Aguardar um pouco entre requisições
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Erro geral - ${error.message}`);
      results.push({ endpoint: endpoint.name, success: false, error: error.message });
    }
  }
  
  return results;
}

// Executar testes
async function runTests() {
  console.log('🚀 INICIANDO TESTES...');
  console.log('======================');
  
  // Teste 1: Conexão básica
  const connectionTest = await testConnection();
  
  // Teste 2: Sincronização completa
  const syncResults = await testFullSync();
  
  // Resumo dos resultados
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('======================');
  console.log(`Conexão básica: ${connectionTest.success ? '✅' : '❌'}`);
  
  console.log('\nSincronização completa:');
  syncResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const info = result.success ? `${result.count} itens` : result.error;
    console.log(`${status} ${result.endpoint}: ${info}`);
  });
  
  // Verificar se todos os testes passaram
  const allTestsPassed = connectionTest.success && syncResults.every(r => r.success);
  
  console.log('\n🎯 RESULTADO FINAL:');
  console.log('===================');
  if (allTestsPassed) {
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('✅ Site ATLZ configurado corretamente');
    console.log('✅ Sincronização funcionando');
    console.log('✅ Pronto para usar no CMS');
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM');
    console.log('❌ Verificar configurações');
    console.log('❌ Verificar credenciais');
  }
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('====================');
  if (allTestsPassed) {
    console.log('1. ✅ Acesse: http://localhost:3002/settings?tab=sites');
    console.log('2. ✅ Clique em "Adicionar Site"');
    console.log('3. ✅ Preencha os dados:');
    console.log(`   - Nome: ${siteData.name}`);
    console.log(`   - URL: ${siteData.url}`);
    console.log(`   - WordPress URL: ${siteData.wordpressUrl}`);
    console.log(`   - Usuário: ${siteData.wordpressUser}`);
    console.log(`   - Senha de Aplicação: ${siteData.wordpressAppPassword}`);
    console.log('4. ✅ Clique em "Salvar"');
    console.log('5. ✅ Teste a sincronização');
  } else {
    console.log('1. ❌ Verificar credenciais do WordPress');
    console.log('2. ❌ Verificar se a REST API está habilitada');
    console.log('3. ❌ Verificar permissões do usuário');
  }
}

runTests().catch(console.error);











