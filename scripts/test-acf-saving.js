/**
 * Teste Específico de Salvamento de Campos ACF
 * Verifica se os campos ACF estão sendo salvos corretamente
 */

const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://atlz.online';

async function testAcfFieldSaving() {
  console.log('🔧 TESTE DE SALVAMENTO DE CAMPOS ACF');
  console.log('====================================\n');

  const username = process.env.WORDPRESS_DEFAULT_USERNAME || 'danilobrandao';
  const password = process.env.WORDPRESS_DEFAULT_PASSWORD || 'Zy598859D@n';
  
  console.log(`🔐 Usando credenciais: ${username}`);
  
  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  
  // Dados de teste para campos ACF
  const testAcfFields = {
    'hero_description': 'Teste de descrição do hero',
    'titulo_da_secao': 'Seção de Teste',
    'cor_botao': '#FF0000',
    'texto_botao_p1': 'BOTÃO TESTE',
    'link_botao_p1': 'https://example.com/test'
  };

  console.log('📋 Campos ACF para teste:');
  Object.entries(testAcfFields).forEach(([field, value]) => {
    console.log(`   ${field}: ${value}`);
  });

  console.log('\n🔍 Testando diferentes métodos de salvamento...\n');

  // Método 1: API específica do ACF
  console.log('1️⃣ TESTANDO API ESPECÍFICA DO ACF:');
  console.log('===================================');
  
  try {
    const acfResponse = await fetch(`${WORDPRESS_URL}/wp-json/acf/v3/pages/3810`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({ fields: testAcfFields })
    });

    console.log(`📊 Status: ${acfResponse.status} ${acfResponse.statusText}`);
    
    if (acfResponse.ok) {
      const acfData = await acfResponse.json();
      console.log('✅ Sucesso! Campos salvos via API ACF');
      console.log('📋 Resposta:', JSON.stringify(acfData, null, 2));
    } else {
      const errorData = await acfResponse.json();
      console.log('❌ Erro:', errorData);
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  // Método 2: WordPress REST API com propriedade acf
  console.log('\n2️⃣ TESTANDO WORDPRESS API COM PROPRIEDADE ACF:');
  console.log('===============================================');
  
  try {
    const wpAcfResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/3810`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({ acf: testAcfFields })
    });

    console.log(`📊 Status: ${wpAcfResponse.status} ${wpAcfResponse.statusText}`);
    
    if (wpAcfResponse.ok) {
      const wpAcfData = await wpAcfResponse.json();
      console.log('✅ Sucesso! Campos salvos via WordPress API com ACF');
      console.log('📋 Campos ACF na resposta:', wpAcfData.acf);
    } else {
      const errorData = await wpAcfResponse.json();
      console.log('❌ Erro:', errorData);
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  // Método 3: WordPress REST API com meta
  console.log('\n3️⃣ TESTANDO WORDPRESS API COM META:');
  console.log('===================================');
  
  try {
    const metaResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/3810`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({ meta: testAcfFields })
    });

    console.log(`📊 Status: ${metaResponse.status} ${metaResponse.statusText}`);
    
    if (metaResponse.ok) {
      const metaData = await metaResponse.json();
      console.log('✅ Sucesso! Campos salvos via WordPress API com Meta');
      console.log('📋 Meta fields na resposta:', metaData.meta);
    } else {
      const errorData = await metaResponse.json();
      console.log('❌ Erro:', errorData);
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  // Verificar se os campos foram salvos
  console.log('\n🔍 VERIFICANDO SE OS CAMPOS FORAM SALVOS:');
  console.log('==========================================');
  
  try {
    const checkResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/3810`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (checkResponse.ok) {
      const pageData = await checkResponse.json();
      
      console.log('📋 Campos ACF encontrados:');
      if (pageData.acf && Object.keys(pageData.acf).length > 0) {
        Object.entries(pageData.acf).forEach(([field, value]) => {
          console.log(`   ✅ ${field}: ${value}`);
        });
      } else {
        console.log('   ❌ Nenhum campo ACF encontrado');
      }
      
      console.log('\n📋 Meta fields encontrados:');
      if (pageData.meta && Object.keys(pageData.meta).length > 0) {
        Object.entries(pageData.meta).forEach(([field, value]) => {
          if (field.startsWith('hero_') || field.startsWith('titulo_') || field.startsWith('cor_') || field.startsWith('texto_') || field.startsWith('link_')) {
            console.log(`   ✅ ${field}: ${value}`);
          }
        });
      } else {
        console.log('   ❌ Nenhum meta field relevante encontrado');
      }
      
    } else {
      console.log('❌ Erro ao verificar página:', checkResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Erro ao verificar campos:', error.message);
  }

  console.log('\n🚀 PRÓXIMOS PASSOS:');
  console.log('===================');
  console.log('1. ✅ Identificar qual método funciona melhor');
  console.log('2. ✅ Ajustar o código para usar o método correto');
  console.log('3. ✅ Testar com todos os campos do JSON');
  console.log('4. ✅ Validar que os campos aparecem no frontend');
  console.log('5. ✅ Otimizar o processo de salvamento');
}

testAcfFieldSaving();





