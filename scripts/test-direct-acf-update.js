/**
 * Script para testar atualização direta de campos ACF
 */

const fetch = require('node-fetch');

const WORDPRESS_SITE = 'https://atlz.online/';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function testDirectAcfUpdate() {
  console.log('🔧 Teste Direto de Atualização ACF');
  console.log('==================================\n');

  try {
    const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
    const pageId = 3782; // ID da página de teste
    
    // [1] Verificar página atual
    console.log(`[1] Verificando página atual (ID: ${pageId})...`);
    const currentResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages/${pageId}`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (currentResponse.ok) {
      const pageData = await currentResponse.json();
      console.log('✅ Página atual obtida');
      console.log(`📄 Template: ${pageData.template || 'Não definido'}`);
      console.log(`🔗 Slug: ${pageData.slug}`);
      console.log(`📊 Status: ${pageData.status}`);
      
      if (pageData.acf) {
        console.log(`🏷️  Campos ACF atuais: ${Object.keys(pageData.acf).length}`);
        Object.keys(pageData.acf).forEach(key => {
          console.log(`   - ${key}: ${pageData.acf[key]}`);
        });
      } else {
        console.log('⚠️  Nenhum campo ACF atual');
      }
    } else {
      console.log(`❌ Erro ao obter página: ${currentResponse.status}`);
      return;
    }

    // [2] Tentar atualizar campos ACF
    console.log('\n[2] Tentando atualizar campos ACF...');
    const acfFields = {
      hero_title: 'Título do Hero - Atualizado via API',
      hero_subtitle: 'Subtítulo do Hero - Atualizado via API',
      hero_image: 'https://via.placeholder.com/1200x600/FF6B35/FFFFFF?text=Hero+Updated',
      cta_button_text: 'Botão Atualizado',
      cta_button_link: '#updated',
      seo_title: 'SEO Atualizado - Teste API',
      seo_description: 'Descrição SEO atualizada via API',
      seo_keywords: 'teste, api, atualizado, wordpress'
    };

    const updateResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages/${pageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        acf: acfFields
      })
    });
    
    console.log(`📊 Status da atualização: ${updateResponse.status}`);
    if (updateResponse.ok) {
      console.log('✅ Campos ACF atualizados com sucesso!');
      const updatedData = await updateResponse.json();
      console.log(`📋 Campos atualizados: ${Object.keys(acfFields).length}`);
      
      if (updatedData.acf) {
        console.log('🏷️  Campos ACF após atualização:');
        Object.keys(updatedData.acf).forEach(key => {
          console.log(`   - ${key}: ${updatedData.acf[key]}`);
        });
      } else {
        console.log('⚠️  Nenhum campo ACF retornado após atualização');
      }
    } else {
      const errorData = await updateResponse.text();
      console.log(`❌ Erro na atualização: ${errorData}`);
    }

    // [3] Verificar se os campos foram realmente atualizados
    console.log('\n[3] Verificando campos atualizados...');
    const verifyResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages/${pageId}`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('✅ Campos ACF verificados:');
      
      if (verifyData.acf) {
        console.log(`🏷️  Total de campos ACF: ${Object.keys(verifyData.acf).length}`);
        Object.keys(verifyData.acf).forEach(key => {
          console.log(`   - ${key}: ${verifyData.acf[key]}`);
        });
      } else {
        console.log('⚠️  Nenhum campo ACF encontrado após verificação');
      }
    } else {
      console.log('❌ Erro ao verificar campos');
    }

    // [4] Testar com campos ACF individuais
    console.log('\n[4] Testando com campos ACF individuais...');
    const individualFields = {
      hero_title: 'Título Individual - Teste',
      cta_button_text: 'Botão Individual - Teste'
    };

    const individualResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages/${pageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        acf: individualFields
      })
    });
    
    console.log(`📊 Status da atualização individual: ${individualResponse.status}`);
    if (individualResponse.ok) {
      console.log('✅ Campos individuais atualizados!');
    } else {
      const errorData = await individualResponse.text();
      console.log(`❌ Erro na atualização individual: ${errorData}`);
    }

  } catch (error) {
    console.log(`❌ Erro inesperado: ${error.message}`);
  }

  console.log('\n==================================');
  console.log('🎯 Teste Direto de ACF Concluído!');
  console.log('💡 Verifique se os campos ACF foram atualizados no WordPress');
}

testDirectAcfUpdate();








