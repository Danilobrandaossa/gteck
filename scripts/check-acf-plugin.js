/**
 * Script para verificar se o plugin ACF está ativo e configurado
 */

const fetch = require('node-fetch');

const WORDPRESS_SITE = 'https://atlz.online/';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function checkAcfPlugin() {
  console.log('🔍 Verificação do Plugin ACF');
  console.log('============================\n');

  try {
    const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
    
    // [1] Verificar plugins ativos
    console.log('[1] Verificando plugins ativos...');
    const pluginsResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/plugins`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (pluginsResponse.ok) {
      const plugins = await pluginsResponse.json();
      console.log('✅ Plugins obtidos com sucesso');
      console.log(`📊 Total de plugins: ${plugins.length}`);
      
      const acfPlugin = plugins.find(plugin => 
        plugin.plugin.includes('advanced-custom-fields') || 
        plugin.plugin.includes('acf')
      );
      
      if (acfPlugin) {
        console.log('✅ Plugin ACF encontrado!');
        console.log(`📝 Nome: ${acfPlugin.name}`);
        console.log(`📝 Status: ${acfPlugin.status}`);
        console.log(`📝 Versão: ${acfPlugin.version}`);
      } else {
        console.log('❌ Plugin ACF não encontrado');
        console.log('📋 Plugins disponíveis:');
        plugins.forEach(plugin => {
          console.log(`   - ${plugin.name} (${plugin.status})`);
        });
      }
    } else {
      console.log(`❌ Erro ao obter plugins: ${pluginsResponse.status}`);
    }

    // [2] Verificar se a API ACF está disponível
    console.log('\n[2] Verificando disponibilidade da API ACF...');
    const acfApiResponse = await fetch(`${WORDPRESS_SITE}wp-json/acf/v3/pages`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    console.log(`📊 Status da API ACF: ${acfApiResponse.status}`);
    if (acfApiResponse.ok) {
      console.log('✅ API ACF disponível');
    } else {
      console.log('❌ API ACF não disponível');
      const errorData = await acfApiResponse.text();
      console.log(`📝 Erro: ${errorData}`);
    }

    // [3] Verificar campos ACF configurados
    console.log('\n[3] Verificando campos ACF configurados...');
    const fieldsResponse = await fetch(`${WORDPRESS_SITE}wp-json/acf/v3/fields`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    console.log(`📊 Status dos campos ACF: ${fieldsResponse.status}`);
    if (fieldsResponse.ok) {
      const fields = await fieldsResponse.json();
      console.log('✅ Campos ACF obtidos');
      console.log(`📊 Total de campos: ${fields.length}`);
      fields.forEach(field => {
        console.log(`   - ${field.name}: ${field.label}`);
      });
    } else {
      console.log('❌ Erro ao obter campos ACF');
      const errorData = await fieldsResponse.text();
      console.log(`📝 Erro: ${errorData}`);
    }

    // [4] Verificar se há campos ACF em uma página específica
    console.log('\n[4] Verificando campos ACF em página específica...');
    const pageId = 3782;
    const pageResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages/${pageId}`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (pageResponse.ok) {
      const pageData = await pageResponse.json();
      console.log('✅ Página obtida');
      console.log(`📄 Template: ${pageData.template || 'Não definido'}`);
      
      if (pageData.acf) {
        console.log(`🏷️  Campos ACF encontrados: ${Object.keys(pageData.acf).length}`);
        Object.keys(pageData.acf).forEach(key => {
          console.log(`   - ${key}: ${pageData.acf[key]}`);
        });
      } else {
        console.log('⚠️  Nenhum campo ACF encontrado na página');
      }
      
      // Verificar se há campos customizados
      if (pageData.meta) {
        console.log(`📊 Campos meta encontrados: ${Object.keys(pageData.meta).length}`);
        const acfMetaFields = Object.keys(pageData.meta).filter(key => key.startsWith('_'));
        if (acfMetaFields.length > 0) {
          console.log('🏷️  Campos meta ACF:');
          acfMetaFields.forEach(key => {
            console.log(`   - ${key}: ${pageData.meta[key]}`);
          });
        }
      }
    } else {
      console.log(`❌ Erro ao obter página: ${pageResponse.status}`);
    }

    // [5] Tentar criar um campo ACF de teste
    console.log('\n[5] Tentando criar campo ACF de teste...');
    const testField = {
      hero_title: 'Teste de Campo ACF',
      test_field: 'Valor de teste'
    };

    const createResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages/${pageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        acf: testField
      })
    });
    
    console.log(`📊 Status da criação de campo: ${createResponse.status}`);
    if (createResponse.ok) {
      console.log('✅ Campo ACF criado com sucesso!');
      const createdData = await createResponse.json();
      if (createdData.acf) {
        console.log('🏷️  Campos ACF após criação:');
        Object.keys(createdData.acf).forEach(key => {
          console.log(`   - ${key}: ${createdData.acf[key]}`);
        });
      }
    } else {
      const errorData = await createResponse.text();
      console.log(`❌ Erro ao criar campo: ${errorData}`);
    }

  } catch (error) {
    console.log(`❌ Erro inesperado: ${error.message}`);
  }

  console.log('\n============================');
  console.log('🎯 Verificação do Plugin ACF Concluída!');
  console.log('💡 Verifique se o plugin ACF está ativo e configurado corretamente');
}

checkAcfPlugin();








