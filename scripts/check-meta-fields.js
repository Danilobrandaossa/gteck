/**
 * Script para verificar campos meta aplicados
 */

const fetch = require('node-fetch');

const WORDPRESS_SITE = 'https://atlz.online/';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function checkMetaFields() {
  console.log('🔍 Verificação de Campos Meta');
  console.log('==============================\n');

  try {
    const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
    const pageId = 3784; // ID da página de teste
    
    // [1] Verificar campos meta da página
    console.log(`[1] Verificando campos meta da página (ID: ${pageId})...`);
    const pageResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages/${pageId}`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (pageResponse.ok) {
      const pageData = await pageResponse.json();
      console.log('✅ Página obtida com sucesso');
      console.log(`📄 Template: ${pageData.template || 'Não definido'}`);
      console.log(`🔗 Slug: ${pageData.slug}`);
      console.log(`📊 Status: ${pageData.status}`);
      
      if (pageData.meta) {
        console.log(`📊 Total de campos meta: ${Object.keys(pageData.meta).length}`);
        console.log('🏷️  Campos meta encontrados:');
        Object.keys(pageData.meta).forEach(key => {
          console.log(`   - ${key}: ${pageData.meta[key]}`);
        });
      } else {
        console.log('⚠️  Nenhum campo meta encontrado');
      }
      
      if (pageData.acf) {
        console.log(`🏷️  Campos ACF encontrados: ${Object.keys(pageData.acf).length}`);
        Object.keys(pageData.acf).forEach(key => {
          console.log(`   - ${key}: ${pageData.acf[key]}`);
        });
      } else {
        console.log('⚠️  Nenhum campo ACF encontrado');
      }
    } else {
      console.log(`❌ Erro ao obter página: ${pageResponse.status}`);
    }

    // [2] Tentar atualizar campos meta diretamente
    console.log('\n[2] Tentando atualizar campos meta diretamente...');
    const metaFields = {
      hero_title: 'Título do Hero - Meta Test',
      hero_subtitle: 'Subtítulo do Hero - Meta Test',
      cta_button_text: 'Botão Meta Test',
      cta_button_link: '#meta-test',
      seo_title: 'SEO Meta Test',
      seo_description: 'Descrição SEO Meta Test',
      seo_keywords: 'meta, test, wordpress'
    };

    const updateResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages/${pageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        meta: metaFields
      })
    });
    
    console.log(`📊 Status da atualização meta: ${updateResponse.status}`);
    if (updateResponse.ok) {
      console.log('✅ Campos meta atualizados com sucesso!');
      const updatedData = await updateResponse.json();
      
      if (updatedData.meta) {
        console.log('🏷️  Campos meta após atualização:');
        Object.keys(updatedData.meta).forEach(key => {
          console.log(`   - ${key}: ${updatedData.meta[key]}`);
        });
      }
    } else {
      const errorData = await updateResponse.text();
      console.log(`❌ Erro na atualização meta: ${errorData}`);
    }

    // [3] Verificar se os campos meta foram realmente aplicados
    console.log('\n[3] Verificando campos meta aplicados...');
    const verifyResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages/${pageId}`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('✅ Campos meta verificados:');
      
      if (verifyData.meta) {
        console.log(`🏷️  Total de campos meta: ${Object.keys(verifyData.meta).length}`);
        Object.keys(verifyData.meta).forEach(key => {
          console.log(`   - ${key}: ${verifyData.meta[key]}`);
        });
      } else {
        console.log('⚠️  Nenhum campo meta encontrado após verificação');
      }
    } else {
      console.log('❌ Erro ao verificar campos meta');
    }

  } catch (error) {
    console.log(`❌ Erro inesperado: ${error.message}`);
  }

  console.log('\n==============================');
  console.log('🎯 Verificação de Campos Meta Concluída!');
  console.log('💡 Verifique se os campos meta foram aplicados corretamente');
}

checkMetaFields();








