/**
 * Teste específico para upload e processamento de JSON no Pressel Automation
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const CMS_URL = 'http://localhost:3002';
const TEST_JSON_PATH = path.join(__dirname, '../test-data/sample-pressel.json');

async function testPresselJsonUpload() {
  console.log('🔧 TESTE DE UPLOAD E PROCESSAMENTO DE JSON - PRESSEL AUTOMATION');
  console.log('================================================================\n');

  try {
    // [1] Verificar arquivo JSON de teste
    console.log('[1] Verificando arquivo JSON de teste...');
    if (!fs.existsSync(TEST_JSON_PATH)) {
      console.log('❌ Arquivo JSON de teste não encontrado');
      return;
    }
    
    const jsonData = JSON.parse(fs.readFileSync(TEST_JSON_PATH, 'utf8'));
    console.log('✅ Arquivo JSON carregado com sucesso');
    console.log(`📝 Propriedades: ${Object.keys(jsonData).length}`);
    console.log(`📄 Título: ${jsonData.page_title || 'N/A'}`);
    console.log(`🔗 Slug: ${jsonData.page_slug || 'N/A'}`);
    console.log(`📊 Status: ${jsonData.post_status || 'N/A'}`);
    console.log(`🏷️  Campos ACF: ${Object.keys(jsonData.acf_fields || {}).length}`);
    console.log('');

    // [2] Testar endpoint de upload
    console.log('[2] Testando endpoint de upload...');
    const uploadResponse = await fetch(`${CMS_URL}/api/pressel/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonData: jsonData,
        siteUrl: 'https://atlz.online/',
        action: 'upload'
      })
    });

    const uploadResult = await uploadResponse.json();
    if (uploadResult.success) {
      console.log('✅ Upload realizado com sucesso!');
      console.log(`📋 Resultado: ${uploadResult.message}`);
    } else {
      console.log('❌ Erro no upload:', uploadResult.error);
      return;
    }
    console.log('');

    // [3] Testar processamento completo
    console.log('[3] Testando processamento completo...');
    const processResponse = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: 'https://atlz.online/',
        jsonData: jsonData,
        testMode: true, // Modo teste primeiro
        options: {
          publish: false,
          addSeo: true,
          addAcfFields: true,
          notifyOnComplete: true
        }
      })
    });

    const processResult = await processResponse.json();
    if (processResult.success) {
      console.log('✅ Processamento completo realizado!');
      console.log('📊 Etapas executadas:');
      
      if (processResult.result && processResult.result.steps) {
        processResult.result.steps.forEach((step, index) => {
          const status = step.status === 'success' ? '✅' : '❌';
          console.log(`   ${index + 1}. ${status} ${step.step}: ${step.message}`);
        });
      }
    } else {
      console.log('❌ Erro no processamento:', processResult.error);
      return;
    }
    console.log('');

    // [4] Testar publicação real (opcional)
    console.log('[4] Testando publicação real no WordPress...');
    const publishResponse = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: 'https://atlz.online/',
        jsonData: jsonData,
        testMode: false, // Modo real
        options: {
          publish: true,
          addSeo: true,
          addAcfFields: true,
          notifyOnComplete: true
        }
      })
    });

    const publishResult = await publishResponse.json();
    if (publishResult.success) {
      console.log('✅ Publicação real realizada!');
      console.log(`🌐 URL: ${publishResult.result?.pageUrl || 'N/A'}`);
      console.log(`✍️  Editar: ${publishResult.result?.editUrl || 'N/A'}`);
      console.log(`🆔 ID: ${publishResult.result?.pageId || 'N/A'}`);
    } else {
      console.log('❌ Erro na publicação real:', publishResult.error);
    }
    console.log('');

    // [5] Verificar página criada
    if (publishResult.success && publishResult.result?.pageUrl) {
      console.log('[5] Verificando página criada...');
      try {
        const pageResponse = await fetch(publishResult.result.pageUrl);
        if (pageResponse.ok) {
          console.log('✅ Página acessível no WordPress!');
          console.log(`🌐 URL: ${publishResult.result.pageUrl}`);
        } else {
          console.log('⚠️  Página não acessível ainda (pode estar sendo processada)');
        }
      } catch (error) {
        console.log('⚠️  Erro ao verificar página:', error.message);
      }
    }

    console.log('\n🎉 TESTE DE UPLOAD E PROCESSAMENTO CONCLUÍDO!');
    console.log('=============================================');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testPresselJsonUpload();
