/**
 * Script para testar com campos ACF reais configurados
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const CMS_URL = 'http://localhost:3002';
const WORDPRESS_SITE = 'https://atlz.online/';

async function testRealAcfFields() {
  console.log('🔧 Teste com Campos ACF Reais');
  console.log('=============================\n');

  try {
    // [1] Carregar JSON com campos ACF reais
    console.log('[1] Carregando JSON com campos ACF reais...');
    const jsonPath = path.join(__dirname, '../test-data/acf-real-test.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('✅ JSON com campos ACF reais carregado');
    console.log(`📝 Título: ${jsonData.page_title}`);
    console.log(`🔗 Slug: ${jsonData.page_slug}`);
    console.log(`📄 Template: ${jsonData.page_template}`);
    console.log(`🏷️  Campos ACF: ${Object.keys(jsonData.acf_fields).length}`);
    console.log(`📊 Grupos ACF usados: ${jsonData.meta_data.acf_groups_used.join(', ')}`);

    // [2] Testar publicação com campos ACF reais
    console.log('\n[2] Testando publicação com campos ACF reais...');
    
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
      
      // Verificar se os campos ACF foram aplicados
      if (publishResult.result.steps) {
        const acfStep = publishResult.result.steps.find(step => step.step === 'acf_fields');
        if (acfStep) {
          console.log(`🔧 Status dos campos ACF: ${acfStep.status}`);
          console.log(`📝 Mensagem: ${acfStep.message}`);
          if (acfStep.data) {
            console.log(`📊 Campos processados: ${acfStep.data.fieldsProcessed || 0}`);
            console.log(`🔧 Método usado: ${acfStep.data.method || 'N/A'}`);
          }
        }
      }
    } else {
      console.log('❌ Erro na publicação');
      console.log(`📝 Erro: ${publishResult.error}`);
    }

    // [3] Verificar campos ACF via API do WordPress
    console.log('\n[3] Verificando campos ACF via API...');
    try {
      const auth = Buffer.from('danilobrandao:j4qD STH0 m2SB e2xc ZAfW 4XAK').toString('base64');
      const pageId = publishResult.result?.pageId || 3788;
      
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
          console.log('📋 Campos ACF:');
          Object.keys(pageData.acf).forEach(key => {
            console.log(`   - ${key}: ${pageData.acf[key]}`);
          });
        } else {
          console.log('⚠️  Nenhum campo ACF encontrado');
        }
        
        if (pageData.meta) {
          console.log(`📊 Campos meta encontrados: ${Object.keys(pageData.meta).length}`);
          const acfMetaFields = Object.keys(pageData.meta).filter(key => 
            !key.startsWith('_') && 
            (key.includes('sub_titulo') || 
             key.includes('link_int') || 
             key.includes('titulo_da_secao') || 
             key.includes('cor_botao') ||
             key.includes('texto_botao') ||
             key.includes('link_botao') ||
             key.includes('titulo_h2') ||
             key.includes('paragrafo') ||
             key.includes('hero_') ||
             key.includes('cta_') ||
             key.includes('seo_'))
          );
          
          if (acfMetaFields.length > 0) {
            console.log('🏷️  Campos meta ACF encontrados:');
            acfMetaFields.forEach(key => {
              console.log(`   - ${key}: ${pageData.meta[key]}`);
            });
          }
        }
      } else {
        console.log(`❌ Erro ao obter dados da página: ${apiResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao verificar API: ${error.message}`);
    }

    // [4] Resumo dos campos testados
    console.log('\n[4] Resumo dos campos ACF testados:');
    console.log('📋 Campos da Primeira Dobra:');
    console.log(`   - sub_titulo: ${jsonData.acf_fields.sub_titulo}`);
    console.log(`   - link_int: ${jsonData.acf_fields.link_int}`);
    
    console.log('📋 Campos do Botão Sugestão:');
    console.log(`   - titulo_da_secao: ${jsonData.acf_fields.titulo_da_secao}`);
    console.log(`   - cor_botao: ${jsonData.acf_fields.cor_botao}`);
    console.log(`   - texto_botao_p1: ${jsonData.acf_fields.texto_botao_p1}`);
    console.log(`   - link_botao_p1: ${jsonData.acf_fields.link_botao_p1}`);
    
    console.log('📋 Campos de Texto:');
    console.log(`   - titulo_h2: ${jsonData.acf_fields.titulo_h2}`);
    console.log(`   - paragrafo: ${jsonData.acf_fields.paragrafo.substring(0, 50)}...`);

  } catch (error) {
    console.log(`❌ Erro inesperado: ${error.message}`);
  }

  console.log('\n=============================');
  console.log('🎯 Teste com Campos ACF Reais Concluído!');
  console.log('💡 Verifique se os campos ACF foram aplicados corretamente no WordPress');
}

testRealAcfFields();







