/**
 * Script simples para testar upload no WordPress usando credenciais existentes
 */

const fs = require('fs');
const path = require('path');

// Usar fetch nativo do Node.js 18+ ou importar node-fetch
let fetch;
try {
  fetch = require('node-fetch');
} catch (e) {
  console.log('❌ node-fetch não encontrado. Instalando...');
  require('child_process').execSync('npm install node-fetch', { stdio: 'inherit' });
  fetch = require('node-fetch');
}

const CMS_URL = 'http://localhost:3002';

async function testSimple() {
  console.log('🚀 Teste Simples de Upload WordPress');
  console.log('=====================================\n');

  try {
    // [1] Testar saúde do CMS
    console.log('[1] Testando CMS...');
    const healthResponse = await fetch(`${CMS_URL}/api/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.status === 'healthy') {
      console.log('✅ CMS está funcionando');
    } else {
      console.log('❌ CMS com problemas');
      return;
    }

    // [2] Testar credenciais WordPress
    console.log('\n[2] Testando credenciais WordPress...');
    const credentialsResponse = await fetch(`${CMS_URL}/api/wordpress/credentials`);
    const credentialsData = await credentialsResponse.json();
    
    if (credentialsData.success) {
      console.log('✅ Credenciais encontradas');
      console.log(`👤 Usuário: ${credentialsData.credentials.username}`);
      console.log(`🔑 Senha: ${credentialsData.credentials.hasPassword ? 'Configurada' : 'Não configurada'}`);
      console.log(`⚙️  Configurado: ${credentialsData.credentials.configured ? 'Sim' : 'Não'}`);
    } else {
      console.log('❌ Erro ao verificar credenciais');
    }

    // [3] Testar upload de JSON
    console.log('\n[3] Testando upload de JSON...');
    const jsonPath = path.join(__dirname, '../test-data/sample-pressel.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    const uploadResponse = await fetch(`${CMS_URL}/api/pressel/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jsonData)
    });
    
    const uploadResult = await uploadResponse.json();
    if (uploadResult.success) {
      console.log('✅ Upload de JSON funcionando');
    } else {
      console.log('❌ Erro no upload de JSON');
    }

    // [4] Testar processo completo (modo simulado)
    console.log('\n[4] Testando processo completo (modo simulado)...');
    const processResponse = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: 'https://atlz.online/',
        jsonData: jsonData,
        testMode: true, // Modo simulado
        options: {
          publish: true,
          addSeo: true,
          addAcfFields: true
        }
      })
    });
    
    const processResult = await processResponse.json();
    if (processResult.success) {
      console.log('✅ Processo simulado funcionando');
      console.log(`📄 Página simulada: ${processResult.result.pageUrl || 'N/A'}`);
    } else {
      console.log('❌ Erro no processo simulado');
      console.log(`📝 Erro: ${processResult.error}`);
    }

    // [5] Testar processo real (se credenciais estiverem configuradas)
    if (credentialsData.credentials.configured) {
      console.log('\n[5] Testando processo real...');
      console.log('⚠️  ATENÇÃO: Este teste tentará criar uma página real!');
      
      const realProcessResponse = await fetch(`${CMS_URL}/api/pressel/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: 'https://atlz.online/',
          jsonData: jsonData,
          testMode: false, // Modo real
          options: {
            publish: true,
            addSeo: true,
            addAcfFields: true
          }
        })
      });
      
      const realProcessResult = await realProcessResponse.json();
      if (realProcessResult.success) {
        console.log('✅ Processo real funcionando!');
        console.log(`🌐 Página real criada: ${realProcessResult.result.pageUrl || 'N/A'}`);
      } else {
        console.log('❌ Erro no processo real');
        console.log(`📝 Erro: ${realProcessResult.error}`);
      }
    } else {
      console.log('\n[5] Pulando teste real (credenciais não configuradas)');
      console.log('💡 Configure WORDPRESS_DEFAULT_PASSWORD no .env.local para testar modo real');
    }

  } catch (error) {
    console.log(`❌ Erro inesperado: ${error.message}`);
  }

  console.log('\n=====================================');
  console.log('🎉 Teste concluído!');
}

testSimple();








