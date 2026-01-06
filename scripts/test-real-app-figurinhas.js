/**
 * Script para testar com JSON real do aplicativo de figurinhas
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const CMS_URL = 'http://localhost:3002';
const WORDPRESS_SITE = 'https://atlz.online/';

async function testRealAppFigurinhas() {
  console.log('🚀 Teste com JSON Real - Aplicativo de Figurinhas');
  console.log('================================================\n');

  try {
    // [1] Carregar JSON real
    console.log('[1] Carregando JSON real do aplicativo de figurinhas...');
    const jsonPath = path.join(__dirname, '../test-data/real-app-figurinhas.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('✅ JSON real carregado com sucesso');
    console.log(`📝 Título: ${jsonData.page_title}`);
    console.log(`🔗 Slug: ${jsonData.page_slug}`);
    console.log(`📄 Template: ${jsonData.page_template}`);
    console.log(`📊 Status: ${jsonData.post_status}`);
    console.log(`🏷️  Campos ACF: ${Object.keys(jsonData.acf_fields).length}`);
    console.log(`🔍 SEO: ${jsonData.seo.meta_title}`);

    // [2] Testar publicação completa
    console.log('\n[2] Testando publicação completa...');
    
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
    console.log('⚠️  ATENÇÃO: Este teste criará uma página real no WordPress!');
    
    const publishResponse = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishData)
    });
    
    const publishResult = await publishResponse.json();
    
    if (publishResult.success) {
      console.log('✅ Publicação realizada com sucesso!');
      console.log(`🌐 URL: ${publishResult.result.pageUrl}`);
      console.log(`✍️  Editar: ${publishResult.result.editUrl}`);
      console.log(`🆔 ID: ${publishResult.result.pageId}`);
      
      // Verificar detalhes do processamento
      if (publishResult.result.steps) {
        console.log('\n📊 Detalhes do processamento:');
        publishResult.result.steps.forEach((step, index) => {
          console.log(`   ${index + 1}. ${step.step}: ${step.status} - ${step.message}`);
          if (step.data && step.data.fieldsProcessed) {
            console.log(`      📊 Campos processados: ${step.data.fieldsProcessed}`);
          }
        });
      }
      
      // Verificar resumo
      if (publishResult.result.summary) {
        console.log('\n📈 Resumo:');
        console.log(`   ✅ Etapas bem-sucedidas: ${publishResult.result.summary.successfulSteps}`);
        console.log(`   ❌ Etapas com falha: ${publishResult.result.summary.failedSteps}`);
        console.log(`   📊 Total de etapas: ${publishResult.result.summary.totalSteps}`);
      }
    } else {
      console.log('❌ Erro na publicação');
      console.log(`📝 Erro: ${publishResult.error}`);
      if (publishResult.details) {
        console.log(`📝 Detalhes: ${publishResult.details}`);
      }
    }

    // [3] Verificar página criada
    if (publishResult.success && publishResult.result.pageUrl) {
      console.log('\n[3] Verificando página criada...');
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
            console.log(`⚠️  Slug pode estar incorreto. Esperado: ${expectedSlug}`);
          }
        } else {
          console.log(`⚠️  Página retornou status ${pageResponse.status}`);
        }
      } catch (error) {
        console.log(`⚠️  Erro ao acessar página: ${error.message}`);
      }
    }

    // [4] Verificar campos ACF via API
    if (publishResult.success && publishResult.result.pageId) {
      console.log('\n[4] Verificando campos ACF via API...');
      try {
        const auth = Buffer.from('danilobrandao:j4qD STH0 m2SB e2xc ZAfW 4XAK').toString('base64');
        const pageId = publishResult.result.pageId;
        
        const apiResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages/${pageId}`, {
          headers: {
            'Authorization': `Basic ${auth}`
          }
        });
        
        if (apiResponse.ok) {
          const pageData = await apiResponse.json();
          console.log('✅ Dados da página obtidos via API');
          console.log(`📄 Template: ${pageData.template || 'Não definido'}`);
          console.log(`🔗 Slug: ${pageData.slug}`);
          console.log(`📊 Status: ${pageData.status}`);
          
          if (pageData.acf) {
            console.log(`🏷️  Campos ACF encontrados: ${Object.keys(pageData.acf).length}`);
            Object.keys(pageData.acf).forEach(key => {
              console.log(`   - ${key}: ${pageData.acf[key]}`);
            });
          } else {
            console.log('⚠️  Nenhum campo ACF encontrado via API');
          }
        } else {
          console.log(`❌ Erro ao obter dados da página: ${apiResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar API: ${error.message}`);
      }
    }

    // [5] Resumo dos campos testados
    console.log('\n[5] Resumo dos campos ACF testados:');
    console.log('📋 Campos principais:');
    console.log(`   - hero_description: ${jsonData.acf_fields.hero_description}`);
    console.log(`   - titulo_da_secao: ${jsonData.acf_fields.titulo_da_secao}`);
    console.log(`   - cor_botao: ${jsonData.acf_fields.cor_botao}`);
    console.log(`   - texto_botao_p1: ${jsonData.acf_fields.texto_botao_p1}`);
    console.log(`   - link_botao_p1: ${jsonData.acf_fields.link_botao_p1}`);
    
    console.log('📋 Campos de conteúdo:');
    console.log(`   - titulo_h2_: ${jsonData.acf_fields.titulo_h2_}`);
    console.log(`   - titulo_h2_02: ${jsonData.acf_fields.titulo_h2_02}`);
    console.log(`   - titulo_beneficios: ${jsonData.acf_fields.titulo_beneficios}`);
    console.log(`   - titulo_faq: ${jsonData.acf_fields.titulo_faq}`);
    
    console.log('📋 Campos de benefícios:');
    console.log(`   - titulo_beneficios_1: ${jsonData.acf_fields.titulo_beneficios_1}`);
    console.log(`   - titulo_beneficios_2: ${jsonData.acf_fields.titulo_beneficios_2}`);
    console.log(`   - titulo_beneficios_3: ${jsonData.acf_fields.titulo_beneficios_3}`);
    console.log(`   - titulo_beneficios_4: ${jsonData.acf_fields.titulo_beneficios_4}`);
    
    console.log('📋 Campos de FAQ:');
    console.log(`   - pergunta_1: ${jsonData.acf_fields.pergunta_1}`);
    console.log(`   - pergunta_2: ${jsonData.acf_fields.pergunta_2}`);
    console.log(`   - pergunta_3: ${jsonData.acf_fields.pergunta_3}`);

  } catch (error) {
    console.log(`❌ Erro inesperado: ${error.message}`);
  }

  console.log('\n================================================');
  console.log('🎯 Teste com JSON Real Concluído!');
  console.log('💡 Verifique se a página foi criada corretamente no WordPress');
  console.log('🔗 Acesse a página no WordPress Admin para verificar os campos ACF');
}

testRealAppFigurinhas();







