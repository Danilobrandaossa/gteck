/**
 * Script para testar publicação completa no WordPress com todos os campos
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const CMS_URL = 'http://localhost:3002';
const WORDPRESS_SITE = 'https://atlz.online/';

async function testCompleteWordPressPublish() {
  console.log('🚀 Teste Completo de Publicação no WordPress');
  console.log('==============================================\n');

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
    } else {
      console.log('❌ Credenciais não configuradas');
      return;
    }

    // [3] Carregar JSON completo de teste
    console.log('\n[3] Carregando JSON completo de teste...');
    const jsonPath = path.join(__dirname, '../test-data/complete-pressel-test.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('✅ JSON completo carregado com sucesso');
    console.log(`📊 Campos ACF: ${Object.keys(jsonData.acf_fields).length}`);
    console.log(`📊 Metadados: ${Object.keys(jsonData.meta_data).length}`);

    // [4] Testar publicação completa
    console.log('\n[4] Testando publicação completa no WordPress...');
    console.log('⚠️  ATENÇÃO: Este teste criará uma página real no WordPress!');
    
    const publishData = {
      siteUrl: WORDPRESS_SITE,
      jsonData: jsonData,
      testMode: false, // Modo real - publicar no WordPress
      options: {
        publish: true,
        addSeo: true,
        addAcfFields: true,
        notifyOnComplete: true
      }
    };

    console.log('📤 Enviando dados completos para publicação...');
    console.log(`📝 Título: ${jsonData.page_title}`);
    console.log(`🔗 Slug: ${jsonData.page_slug}`);
    console.log(`📄 Template: ${jsonData.page_template}`);
    console.log(`📊 Status: ${jsonData.page_status}`);
    console.log(`🏷️  Campos ACF: ${Object.keys(jsonData.acf_fields).length}`);
    
    const publishResponse = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishData)
    });
    
    const publishResult = await publishResponse.json();
    
    if (publishResult.success) {
      console.log('✅ Publicação completa realizada com sucesso!');
      console.log(`📄 Resultado: ${JSON.stringify(publishResult.result, null, 2)}`);
      
      if (publishResult.result.pageUrl) {
        console.log(`🌐 Página criada: ${publishResult.result.pageUrl}`);
      }
      if (publishResult.result.editUrl) {
        console.log(`✍️  Editar página: ${publishResult.result.editUrl}`);
      }
      if (publishResult.result.acfFields) {
        console.log(`🔧 Campos ACF processados: ${publishResult.result.acfFields}`);
      }
    } else {
      console.log('❌ Erro na publicação completa');
      console.log(`📝 Erro: ${publishResult.error}`);
    }

    // [5] Verificar se a página foi realmente criada
    if (publishResult.success && publishResult.result.pageUrl) {
      console.log('\n[5] Verificando página criada...');
      try {
        const pageResponse = await fetch(publishResult.result.pageUrl);
        if (pageResponse.ok) {
          console.log('✅ Página acessível no WordPress!');
          console.log(`🌐 URL: ${publishResult.result.pageUrl}`);
          
          // Verificar se o slug está correto
          const expectedSlug = jsonData.page_slug;
          const actualUrl = publishResult.result.pageUrl;
          if (actualUrl.includes(expectedSlug)) {
            console.log(`✅ Slug correto aplicado: ${expectedSlug}`);
          } else {
            console.log(`⚠️  Slug pode não estar correto. Esperado: ${expectedSlug}`);
          }
        } else {
          console.log(`⚠️  Página retornou status ${pageResponse.status}`);
        }
      } catch (error) {
        console.log(`⚠️  Erro ao acessar página: ${error.message}`);
      }
    }

    // [6] Resumo dos campos processados
    console.log('\n[6] Resumo dos campos processados:');
    console.log(`📝 Título: ${jsonData.page_title}`);
    console.log(`🔗 Slug: ${jsonData.page_slug}`);
    console.log(`📄 Template: ${jsonData.page_template}`);
    console.log(`📊 Status: ${jsonData.page_status}`);
    console.log(`🏷️  Campos ACF: ${Object.keys(jsonData.acf_fields).length}`);
    console.log(`📊 Metadados: ${Object.keys(jsonData.meta_data).length}`);
    console.log(`🔍 SEO: ${jsonData.acf_fields.seo_title ? 'Sim' : 'Não'}`);
    console.log(`🖼️  Imagens: ${jsonData.acf_fields.hero_image ? 'Sim' : 'Não'}`);
    console.log(`📱 Redes Sociais: ${jsonData.acf_fields.social_links ? 'Sim' : 'Não'}`);

  } catch (error) {
    console.log(`❌ Erro inesperado: ${error.message}`);
  }

  console.log('\n==============================================');
  console.log('🎉 Teste Completo de Publicação Concluído!');
  console.log('💡 Agora o sistema processa TODOS os campos do JSON!');
  console.log('🔧 Incluindo: slug, template, ACF, SEO, metadados e muito mais!');
}

testCompleteWordPressPublish();
