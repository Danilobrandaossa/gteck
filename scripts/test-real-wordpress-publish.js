/**
 * Script para testar publicação real no WordPress
 */

const fs = require('fs');
const path = require('path');

// Usar fetch
let fetch;
try {
  fetch = require('node-fetch');
} catch (e) {
  console.log('❌ node-fetch não encontrado');
  process.exit(1);
}

const CMS_URL = 'http://localhost:3002';

async function testRealWordPressPublish() {
  console.log('🚀 Teste de Publicação Real no WordPress');
  console.log('========================================\n');

  try {
    // [1] Verificar CMS
    console.log('[1] Verificando CMS...');
    const healthResponse = await fetch(`${CMS_URL}/api/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.status === 'healthy') {
      console.log('✅ CMS está funcionando');
    } else {
      console.log('❌ CMS com problemas');
      return;
    }

    // [2] Verificar credenciais
    console.log('\n[2] Verificando credenciais WordPress...');
    const credentialsResponse = await fetch(`${CMS_URL}/api/wordpress/credentials`);
    const credentialsData = await credentialsResponse.json();
    
    if (credentialsData.success && credentialsData.credentials.configured) {
      console.log('✅ Credenciais WordPress configuradas');
      console.log(`👤 Usuário: ${credentialsData.credentials.username}`);
      console.log(`🔑 Senha: ${credentialsData.credentials.hasPassword ? 'Configurada' : 'Não configurada'}`);
    } else {
      console.log('❌ Credenciais não configuradas');
      return;
    }

    // [3] Carregar JSON de teste
    console.log('\n[3] Carregando JSON de teste...');
    const jsonPath = path.join(__dirname, '../test-data/sample-pressel.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('✅ JSON carregado com sucesso');

    // [4] Testar publicação real
    console.log('\n[4] Testando publicação real no WordPress...');
    console.log('⚠️  ATENÇÃO: Este teste criará uma página real no WordPress!');
    
    const publishData = {
      siteUrl: 'https://atlz.online/',
      jsonData: {
        page_title: jsonData.page_title,
        page_content: jsonData.page_content,
        page_status: 'publish',
        page_template: 'page.php',
        acf_fields: jsonData.acf_fields
      },
      testMode: false, // Modo real - publicar no WordPress
      options: {
        publish: true,
        addSeo: true,
        addAcfFields: true,
        notifyOnComplete: true
      }
    };

    console.log('📤 Enviando dados para publicação...');
    const publishResponse = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishData)
    });
    
    const publishResult = await publishResponse.json();
    
    if (publishResult.success) {
      console.log('✅ Publicação realizada com sucesso!');
      console.log(`📄 Resultado: ${JSON.stringify(publishResult.result, null, 2)}`);
      
      if (publishResult.result.pageUrl) {
        console.log(`🌐 Página criada: ${publishResult.result.pageUrl}`);
      }
      if (publishResult.result.editUrl) {
        console.log(`✍️  Editar página: ${publishResult.result.editUrl}`);
      }
    } else {
      console.log('❌ Erro na publicação');
      console.log(`📝 Erro: ${publishResult.error}`);
      
      if (publishResult.error && publishResult.error.includes('MISSING_CREDENTIALS')) {
        console.log('💡 Dica: Configure WORDPRESS_DEFAULT_PASSWORD no .env.local');
      }
    }

    // [5] Verificar se a página foi realmente criada
    if (publishResult.success && publishResult.result.pageUrl) {
      console.log('\n[5] Verificando página criada...');
      try {
        const pageResponse = await fetch(publishResult.result.pageUrl);
        if (pageResponse.ok) {
          console.log('✅ Página acessível no WordPress!');
          console.log(`🌐 URL: ${publishResult.result.pageUrl}`);
        } else {
          console.log(`⚠️  Página retornou status ${pageResponse.status}`);
        }
      } catch (error) {
        console.log(`⚠️  Erro ao acessar página: ${error.message}`);
      }
    }

  } catch (error) {
    console.log(`❌ Erro inesperado: ${error.message}`);
  }

  console.log('\n========================================');
  console.log('🎉 Teste de Publicação Real Concluído!');
  console.log('💡 Agora o botão "Publicar no WordPress" deve funcionar corretamente');
}

testRealWordPressPublish();








