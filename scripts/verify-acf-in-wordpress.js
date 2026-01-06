/**
 * Script para verificar se os campos ACF foram aplicados no WordPress
 */

const fetch = require('node-fetch');

const WORDPRESS_SITE = 'https://atlz.online/';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function verifyAcfInWordPress() {
  console.log('🔍 Verificação de Campos ACF no WordPress');
  console.log('=========================================\n');

  try {
    const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
    const pageId = 3790; // ID da página de teste mais recente
    
    // [1] Verificar página via API REST
    console.log(`[1] Verificando página via API REST (ID: ${pageId})...`);
    const restResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages/${pageId}`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (restResponse.ok) {
      const pageData = await restResponse.json();
      console.log('✅ Página obtida via API REST');
      console.log(`📄 Template: ${pageData.template || 'Não definido'}`);
      console.log(`🔗 Slug: ${pageData.slug}`);
      console.log(`📊 Status: ${pageData.status}`);
      
      if (pageData.acf) {
        console.log(`🏷️  Campos ACF via REST: ${Object.keys(pageData.acf).length}`);
        Object.keys(pageData.acf).forEach(key => {
          console.log(`   - ${key}: ${pageData.acf[key]}`);
        });
      } else {
        console.log('⚠️  Nenhum campo ACF via REST');
      }
      
      if (pageData.meta) {
        console.log(`📊 Campos meta via REST: ${Object.keys(pageData.meta).length}`);
        const acfFields = Object.keys(pageData.meta).filter(key => 
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
        
        if (acfFields.length > 0) {
          console.log('🏷️  Campos ACF via meta:');
          acfFields.forEach(key => {
            console.log(`   - ${key}: ${pageData.meta[key]}`);
          });
        }
      }
    } else {
      console.log(`❌ Erro via API REST: ${restResponse.status}`);
    }

    // [2] Tentar API ACF específica
    console.log('\n[2] Tentando API ACF específica...');
    const acfResponse = await fetch(`${WORDPRESS_SITE}wp-json/acf/v3/pages/${pageId}`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    console.log(`📊 Status da API ACF: ${acfResponse.status}`);
    if (acfResponse.ok) {
      const acfData = await acfResponse.json();
      console.log('✅ Campos ACF obtidos via API ACF');
      console.log(`🏷️  Total de campos: ${Object.keys(acfData).length}`);
      Object.keys(acfData).forEach(key => {
        console.log(`   - ${key}: ${acfData[key]}`);
      });
    } else {
      const errorData = await acfResponse.text();
      console.log(`❌ Erro na API ACF: ${errorData}`);
    }

    // [3] Verificar se os campos estão no banco de dados
    console.log('\n[3] Verificando campos no banco de dados...');
    const metaResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages/${pageId}/meta`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (metaResponse.ok) {
      const metaData = await metaResponse.json();
      console.log('✅ Campos meta obtidos');
      console.log(`📊 Total de campos meta: ${metaData.length}`);
      
      const acfFields = metaData.filter(meta => 
        !meta.key.startsWith('_') && 
        (meta.key.includes('sub_titulo') || 
         meta.key.includes('link_int') || 
         meta.key.includes('titulo_da_secao') || 
         meta.key.includes('cor_botao') ||
         meta.key.includes('texto_botao') ||
         meta.key.includes('link_botao') ||
         meta.key.includes('titulo_h2') ||
         meta.key.includes('paragrafo') ||
         meta.key.includes('hero_') ||
         meta.key.includes('cta_') ||
         meta.key.includes('seo_'))
      );
      
      if (acfFields.length > 0) {
        console.log('🏷️  Campos ACF no banco de dados:');
        acfFields.forEach(field => {
          console.log(`   - ${field.key}: ${field.value}`);
        });
      } else {
        console.log('⚠️  Nenhum campo ACF encontrado no banco de dados');
      }
    } else {
      console.log(`❌ Erro ao obter campos meta: ${metaResponse.status}`);
    }

    // [4] Tentar atualizar campos ACF diretamente
    console.log('\n[4] Tentando atualizar campos ACF diretamente...');
    const testFields = {
      sub_titulo: 'Subtítulo Atualizado - Teste Direto',
      titulo_da_secao: 'Título Atualizado - Teste Direto',
      cor_botao: '#00FF00',
      texto_botao_p1: 'Botão Atualizado - Teste Direto',
      titulo_h2: 'H2 Atualizado - Teste Direto',
      paragrafo: 'Parágrafo atualizado via teste direto dos campos ACF.'
    };

    const updateResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages/${pageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        acf: testFields
      })
    });
    
    console.log(`📊 Status da atualização: ${updateResponse.status}`);
    if (updateResponse.ok) {
      console.log('✅ Campos ACF atualizados com sucesso!');
      const updatedData = await updateResponse.json();
      
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

  } catch (error) {
    console.log(`❌ Erro inesperado: ${error.message}`);
  }

  console.log('\n=========================================');
  console.log('🎯 Verificação de Campos ACF Concluída!');
  console.log('💡 Verifique se os campos foram aplicados no WordPress Admin');
}

verifyAcfInWordPress();







