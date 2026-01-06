/**
 * Teste de Verificação dos Campos ACF no WordPress
 * Verifica se todos os campos foram salvos corretamente
 */

const fetch = require('node-fetch');

const CMS_URL = 'http://localhost:3002';
const WORDPRESS_URL = 'https://atlz.online';

async function verifyAcfFields() {
  console.log('🔍 VERIFICAÇÃO DOS CAMPOS ACF NO WORDPRESS');
  console.log('==========================================\n');

  // IDs das páginas criadas nos testes
  const pageIds = [3806, 3808, 3810];
  
  console.log('📋 Páginas criadas nos testes:');
  pageIds.forEach((id, index) => {
    console.log(`${index + 1}. ID: ${id} - URL: ${WORDPRESS_URL}/driving-licence-test-app-${index + 2}/`);
  });

  console.log('\n🔍 Verificando campos ACF da página mais recente (ID: 3810)...\n');

  try {
    // Verificar campos ACF via API REST do WordPress
    const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/3810`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.log('❌ Erro ao acessar a página:', response.status, response.statusText);
      return;
    }

    const pageData = await response.json();
    
    console.log('✅ Página encontrada!');
    console.log(`📝 Título: ${pageData.title.rendered}`);
    console.log(`🔗 URL: ${pageData.link}`);
    console.log(`📊 Status: ${pageData.status}`);
    console.log(`📅 Criada em: ${pageData.date}`);

    // Verificar se há campos ACF
    if (pageData.acf) {
      console.log('\n📋 CAMPOS ACF ENCONTRADOS:');
      console.log('==========================');
      
      const acfFields = pageData.acf;
      const fieldCount = Object.keys(acfFields).length;
      
      console.log(`📊 Total de campos ACF: ${fieldCount}`);
      console.log('\n📝 Campos e valores:');
      
      Object.entries(acfFields).forEach(([field, value], index) => {
        const displayValue = typeof value === 'string' && value.length > 100 
          ? value.substring(0, 100) + '...' 
          : value;
        console.log(`${index + 1}. ${field}: ${displayValue}`);
      });

      // Verificar campos específicos do JSON
      const expectedFields = [
        'hero_description',
        'titulo_da_secao',
        'cor_botao',
        'texto_botao_p1',
        'link_botao_p1',
        'titulo_beneficios',
        'titulo_faq',
        'pergunta_1',
        'resposta_1'
      ];

      console.log('\n🎯 VERIFICAÇÃO DE CAMPOS ESPECÍFICOS:');
      console.log('=====================================');
      
      let foundFields = 0;
      expectedFields.forEach(field => {
        if (acfFields[field]) {
          console.log(`✅ ${field}: ${acfFields[field]}`);
          foundFields++;
        } else {
          console.log(`❌ ${field}: NÃO ENCONTRADO`);
        }
      });

      console.log(`\n📊 Taxa de campos encontrados: ${Math.round((foundFields / expectedFields.length) * 100)}% (${foundFields}/${expectedFields.length})`);

    } else {
      console.log('❌ Nenhum campo ACF encontrado na página');
    }

    // Verificar meta fields
    if (pageData.meta) {
      console.log('\n📋 META FIELDS ENCONTRADOS:');
      console.log('===========================');
      
      const metaFields = pageData.meta;
      const metaCount = Object.keys(metaFields).length;
      
      console.log(`📊 Total de meta fields: ${metaCount}`);
      
      // Mostrar alguns meta fields importantes
      const importantMetaFields = [
        '_yoast_wpseo_title',
        '_yoast_wpseo_metadesc',
        '_yoast_wpseo_focuskw'
      ];
      
      importantMetaFields.forEach(field => {
        if (metaFields[field]) {
          console.log(`✅ ${field}: ${metaFields[field]}`);
        } else {
          console.log(`❌ ${field}: NÃO ENCONTRADO`);
        }
      });
    }

  } catch (error) {
    console.log('❌ Erro ao verificar campos ACF:', error.message);
  }

  console.log('\n🚀 PRÓXIMOS PASSOS:');
  console.log('===================');
  console.log('1. ✅ Verificar se todos os campos ACF foram salvos');
  console.log('2. ✅ Confirmar que os valores estão corretos');
  console.log('3. ✅ Testar a exibição no frontend');
  console.log('4. ✅ Validar SEO e meta fields');
  console.log('5. ✅ Otimizar taxa de reconhecimento para 100%');
}

verifyAcfFields();





