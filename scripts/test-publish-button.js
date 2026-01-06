/**
 * Script para testar o botão de publicar no WordPress
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

async function testPublishButton() {
  console.log('🚀 Teste do Botão de Publicar no WordPress');
  console.log('==========================================\n');

  try {
    // [1] Verificar se o CMS está rodando
    console.log('[1] Verificando CMS...');
    const healthResponse = await fetch(`${CMS_URL}/api/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.status === 'healthy') {
      console.log('✅ CMS está funcionando');
    } else {
      console.log('❌ CMS com problemas');
      return;
    }

    // [2] Carregar JSON de teste
    console.log('\n[2] Carregando JSON de teste...');
    const jsonPath = path.join(__dirname, '../test-data/sample-pressel.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('✅ JSON carregado com sucesso');

    // [3] Simular upload de JSON (como se fosse feito pela interface)
    console.log('\n[3] Simulando upload de JSON...');
    const uploadResponse = await fetch(`${CMS_URL}/api/pressel/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jsonData)
    });
    
    const uploadResult = await uploadResponse.json();
    if (uploadResult.success) {
      console.log('✅ Upload simulado com sucesso');
    } else {
      console.log('❌ Erro no upload simulado');
      return;
    }

    // [4] Simular conversão (como se fosse feito pela interface)
    console.log('\n[4] Simulando conversão...');
    const conversionData = {
      page_title: jsonData.page_title,
      page_content: jsonData.page_content,
      page_model: 'modelo_v1',
      page_template: 'pressel-oficial.php',
      acf_fields: jsonData.acf_fields,
      page_url: 'https://atlz.online/teste-pagina-automatizada/',
      edit_url: 'https://atlz.online/wp-admin/post.php?post=123&action=edit'
    };
    console.log('✅ Conversão simulada com sucesso');

    // [5] Testar publicação real (simulando o clique no botão "Publicar no WordPress")
    console.log('\n[5] Testando publicação real...');
    console.log('⚠️  ATENÇÃO: Este teste tentará criar uma página real no WordPress!');
    
    const publishData = {
      siteUrl: 'https://atlz.online/',
      jsonData: conversionData,
      testMode: false, // Modo real - publicar no WordPress
      options: {
        publish: true,
        addSeo: true,
        addAcfFields: true,
        notifyOnComplete: true
      }
    };

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

    // [6] Verificar se a página foi realmente criada
    if (publishResult.success && publishResult.result.pageUrl) {
      console.log('\n[6] Verificando página criada...');
      try {
        const pageResponse = await fetch(publishResult.result.pageUrl);
        if (pageResponse.ok) {
          console.log('✅ Página acessível no WordPress!');
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

  console.log('\n==========================================');
  console.log('🎉 Teste do Botão de Publicar Concluído!');
  console.log('💡 Agora você pode usar o botão "Publicar no WordPress" na interface');
}

testPublishButton();








