/**
 * Script para testar aplicação de template e campos ACF
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const CMS_URL = 'http://localhost:3002';
const WORDPRESS_SITE = 'https://atlz.online/';

async function testTemplateAndAcf() {
  console.log('🔧 Teste de Template e Campos ACF');
  console.log('==================================\n');

  try {
    // [1] Carregar JSON simples de teste
    console.log('[1] Carregando JSON simples de teste...');
    const jsonPath = path.join(__dirname, '../test-data/simple-pressel-test.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('✅ JSON simples carregado');
    console.log(`📝 Título: ${jsonData.page_title}`);
    console.log(`🔗 Slug: ${jsonData.page_slug}`);
    console.log(`📄 Template: ${jsonData.page_template}`);
    console.log(`🏷️  Campos ACF: ${Object.keys(jsonData.acf_fields).length}`);

    // [2] Testar publicação com template e ACF
    console.log('\n[2] Testando publicação com template e ACF...');
    
    const publishData = {
      siteUrl: WORDPRESS_SITE,
      jsonData: jsonData,
      testMode: false,
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
      console.log('✅ Publicação realizada!');
      console.log(`🌐 URL: ${publishResult.result.pageUrl}`);
      console.log(`✍️  Editar: ${publishResult.result.editUrl}`);
      console.log(`🆔 ID: ${publishResult.result.pageId}`);
      
      // [3] Verificar se a página foi criada corretamente
      console.log('\n[3] Verificando página criada...');
      try {
        const pageResponse = await fetch(publishResult.result.pageUrl);
        if (pageResponse.ok) {
          console.log('✅ Página acessível no WordPress!');
          
          // Verificar se o slug está correto
          const expectedSlug = jsonData.page_slug;
          const actualUrl = publishResult.result.pageUrl;
          if (actualUrl.includes(expectedSlug)) {
            console.log(`✅ Slug correto: ${expectedSlug}`);
          } else {
            console.log(`⚠️  Slug pode estar incorreto. Esperado: ${expectedSlug}`);
          }
        } else {
          console.log(`⚠️  Página retornou status ${pageResponse.status}`);
        }
      } catch (error) {
        console.log(`⚠️  Erro ao acessar página: ${error.message}`);
      }
      
      // [4] Verificar template e ACF via API do WordPress
      console.log('\n[4] Verificando template e ACF via API...');
      try {
        const apiResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages/${publishResult.result.pageId}`, {
          headers: {
            'Authorization': 'Basic ' + Buffer.from('danilobrandao:j4qD STH0 m2SB e2xc ZAfW 4XAK').toString('base64')
          }
        });
        
        if (apiResponse.ok) {
          const pageData = await apiResponse.json();
          console.log('✅ Dados da página obtidos via API');
          console.log(`📄 Template: ${pageData.template || 'Não definido'}`);
          console.log(`🔗 Slug: ${pageData.slug}`);
          console.log(`📊 Status: ${pageData.status}`);
          
          // Verificar campos ACF
          if (pageData.acf) {
            console.log(`🏷️  Campos ACF encontrados: ${Object.keys(pageData.acf).length}`);
            console.log('📋 Campos ACF:');
            Object.keys(pageData.acf).forEach(key => {
              console.log(`   - ${key}: ${pageData.acf[key]}`);
            });
          } else {
            console.log('⚠️  Nenhum campo ACF encontrado');
          }
        } else {
          console.log(`❌ Erro ao obter dados da página: ${apiResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar API: ${error.message}`);
      }
      
    } else {
      console.log('❌ Erro na publicação');
      console.log(`📝 Erro: ${publishResult.error}`);
    }

  } catch (error) {
    console.log(`❌ Erro inesperado: ${error.message}`);
  }

  console.log('\n==================================');
  console.log('🎯 Teste de Template e ACF Concluído!');
  console.log('💡 Verifique se o template e campos ACF foram aplicados corretamente');
}

testTemplateAndAcf();








