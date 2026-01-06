/**
 * Verificação de Acesso às Configurações do ACF PRO
 * Tenta acessar diferentes URLs de configuração
 */

const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://atlz.online';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function checkACFSettingsAccess() {
  console.log('🔍 VERIFICAÇÃO DE ACESSO ÀS CONFIGURAÇÕES DO ACF PRO');
  console.log('==================================================\n');

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  
  // URLs possíveis para configurações do ACF
  const settingsUrls = [
    '/wp-admin/edit.php?post_type=acf-field-group&page=acf-settings',
    '/wp-admin/admin.php?page=acf-settings',
    '/wp-admin/admin.php?page=acf-settings-rest',
    '/wp-admin/edit.php?post_type=acf-field-group&page=acf-settings-rest',
    '/wp-admin/admin.php?page=acf-settings-rest-api',
    '/wp-admin/edit.php?post_type=acf-field-group&page=acf-settings-rest-api'
  ];

  console.log('📋 TESTANDO DIFERENTES URLs DE CONFIGURAÇÃO:');
  console.log('=============================================');

  for (let i = 0; i < settingsUrls.length; i++) {
    const url = settingsUrls[i];
    console.log(`\n${i + 1}. Testando: ${url}`);
    
    try {
      const response = await fetch(`${WORDPRESS_URL}${url}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      console.log(`   📊 Status: ${response.status}`);
      
      if (response.ok) {
        console.log(`   ✅ URL acessível! Esta é a URL correta para configurações`);
        console.log(`   🔗 Acesse: ${WORDPRESS_URL}${url}`);
        break;
      } else {
        console.log(`   ❌ URL não acessível`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }

  // Teste alternativo: Verificar se ACF está ativo
  console.log('\n📋 VERIFICAÇÃO DE PLUGINS ATIVOS:');
  console.log('==================================');
  
  try {
    const pluginsResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/plugins`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (pluginsResponse.ok) {
      const plugins = await pluginsResponse.json();
      console.log(`✅ Plugins encontrados: ${plugins.length}`);
      
      const acfPlugins = plugins.filter(plugin => 
        plugin.name.toLowerCase().includes('acf') || 
        plugin.name.toLowerCase().includes('custom fields')
      );
      
      if (acfPlugins.length > 0) {
        console.log('\n🔍 PLUGINS ACF ENCONTRADOS:');
        acfPlugins.forEach(plugin => {
          console.log(`   📦 ${plugin.name} - Status: ${plugin.status}`);
        });
      } else {
        console.log('⚠️ Nenhum plugin ACF encontrado');
      }
    } else {
      console.log('❌ Não foi possível verificar plugins');
    }
  } catch (error) {
    console.log(`❌ Erro ao verificar plugins: ${error.message}`);
  }

  console.log('\n📋 INSTRUÇÕES ALTERNATIVAS:');
  console.log('============================');
  console.log('1. Acesse o WordPress Admin');
  console.log('2. Procure por "Custom Fields" no menu lateral');
  console.log('3. Se não encontrar, procure por "ACF" ou "Advanced Custom Fields"');
  console.log('4. Dentro do menu, procure por "Settings" ou "Configurações"');
  console.log('5. Na aba "REST API", marque "Enable the REST API"');
  console.log('6. Salve as configurações');
}

checkACFSettingsAccess();





