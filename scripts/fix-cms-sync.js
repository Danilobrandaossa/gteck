// Script para corrigir sincronização no CMS
const http = require('http');

console.log('🔧 CORRIGINDO SINCRONIZAÇÃO CMS');
console.log('===============================\n');

// Função para testar sincronização completa
function testFullSync() {
  return new Promise((resolve) => {
    console.log('🔄 TESTANDO SINCRONIZAÇÃO COMPLETA...');
    console.log('=====================================');
    
    const auth = Buffer.from('danilobrandao:svWq K2kC fETN P8iq dppv kBhp').toString('base64');
    
    // Testar posts
    const postsData = JSON.stringify({
      url: 'https://atlz.online/wp-json/wp/v2/posts?per_page=10',
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
        'Content-Length': Buffer.byteLength(postsData)
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
          if (result.success) {
            let postsArray = [];
            if (typeof result.data === 'string') {
              postsArray = JSON.parse(result.data);
            } else if (Array.isArray(result.data)) {
              postsArray = result.data;
            }
            
            console.log(`✅ POSTS: ${postsArray.length} encontrados`);
            if (postsArray.length > 0) {
              console.log(`   Primeiro: ${postsArray[0].title?.rendered || 'Sem título'}`);
            }
            
            // Testar páginas
            testPages().then(pagesResult => {
              // Testar mídia
              testMedia().then(mediaResult => {
                console.log('\n📊 RESULTADO FINAL:');
                console.log('==================');
                console.log(`Posts: ${postsArray.length} ✅`);
                console.log(`Páginas: ${pagesResult.count} ✅`);
                console.log(`Mídia: ${mediaResult.count} ✅`);
                
                if (postsArray.length > 0 && pagesResult.count > 0) {
                  console.log('\n🎉 SINCRONIZAÇÃO FUNCIONANDO!');
                  console.log('✅ O problema está na interface do CMS');
                  console.log('✅ Os dados estão sendo puxados corretamente');
                  console.log('✅ Verifique se o site está cadastrado no CMS');
                } else {
                  console.log('\n❌ PROBLEMA NA SINCRONIZAÇÃO');
                }
                
                resolve({ success: true, posts: postsArray.length, pages: pagesResult.count, media: mediaResult.count });
              });
            });
          } else {
            console.log('❌ Erro na sincronização:', result.error);
            resolve({ success: false, error: result.error });
          }
        } catch (e) {
          console.log('❌ Erro ao processar resposta:', e.message);
          resolve({ success: false, error: e.message });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro de conexão: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(15000, () => {
      console.log('❌ Timeout da requisição');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.write(postsData);
    req.end();
  });
}

// Função para testar páginas
function testPages() {
  return new Promise((resolve) => {
    const auth = Buffer.from('danilobrandao:svWq K2kC fETN P8iq dppv kBhp').toString('base64');
    
    const pagesData = JSON.stringify({
      url: 'https://atlz.online/wp-json/wp/v2/pages?per_page=10',
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
        'Content-Length': Buffer.byteLength(pagesData)
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
          if (result.success) {
            let pagesArray = [];
            if (typeof result.data === 'string') {
              pagesArray = JSON.parse(result.data);
            } else if (Array.isArray(result.data)) {
              pagesArray = result.data;
            }
            
            console.log(`✅ PÁGINAS: ${pagesArray.length} encontradas`);
            resolve({ success: true, count: pagesArray.length });
          } else {
            console.log('❌ Erro nas páginas:', result.error);
            resolve({ success: false, count: 0 });
          }
        } catch (e) {
          console.log('❌ Erro ao processar páginas:', e.message);
          resolve({ success: false, count: 0 });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro de conexão páginas: ${error.message}`);
      resolve({ success: false, count: 0 });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, count: 0 });
    });

    req.write(pagesData);
    req.end();
  });
}

// Função para testar mídia
function testMedia() {
  return new Promise((resolve) => {
    const auth = Buffer.from('danilobrandao:svWq K2kC fETN P8iq dppv kBhp').toString('base64');
    
    const mediaData = JSON.stringify({
      url: 'https://atlz.online/wp-json/wp/v2/media?per_page=10',
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
        'Content-Length': Buffer.byteLength(mediaData)
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
          if (result.success) {
            let mediaArray = [];
            if (typeof result.data === 'string') {
              mediaArray = JSON.parse(result.data);
            } else if (Array.isArray(result.data)) {
              mediaArray = result.data;
            }
            
            console.log(`✅ MÍDIA: ${mediaArray.length} encontrada`);
            resolve({ success: true, count: mediaArray.length });
          } else {
            console.log('❌ Erro na mídia:', result.error);
            resolve({ success: false, count: 0 });
          }
        } catch (e) {
          console.log('❌ Erro ao processar mídia:', e.message);
          resolve({ success: false, count: 0 });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro de conexão mídia: ${error.message}`);
      resolve({ success: false, count: 0 });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, count: 0 });
    });

    req.write(mediaData);
    req.end();
  });
}

// Executar teste completo
testFullSync().catch(console.error);











