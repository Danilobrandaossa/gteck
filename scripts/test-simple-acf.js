/**
 * Teste simples de preenchimento de campos ACF
 */

const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://atlz.online';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function testSimpleACF() {
  console.log('🧪 TESTE SIMPLES DE CAMPOS ACF');
  console.log('==============================\n');

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  const pageId = 3892;
  
  // Campos simples para testar
  const simpleFields = {
    title_h1: "Teste ACF Simples",
    sub_title: "Subtítulo de teste",
    download_button_text: "Botão de teste"
  };
  
  console.log('📋 TESTE: Atualização via meta fields');
  console.log('====================================');
  
  try {
    const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/${pageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        meta: simpleFields
      })
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Campos atualizados!');
      console.log(`📄 Página: ${result.link}`);
      
      // Verificar se os campos foram salvos
      const checkResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/${pageId}`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });
      
      if (checkResponse.ok) {
        const pageData = await checkResponse.json();
        console.log(`📊 Campos Meta: ${Object.keys(pageData.meta || {}).length}`);
        
        // Mostrar campos não-internos
        const nonInternalFields = Object.entries(pageData.meta || {}).filter(([key]) => !key.startsWith('_'));
        console.log(`📊 Campos não-internos: ${nonInternalFields.length}`);
        
        if (nonInternalFields.length > 0) {
          console.log('✅ Campos salvos:');
          nonInternalFields.forEach(([key, value]) => {
            console.log(`  - ${key}: ${value}`);
          });
        } else {
          console.log('❌ Nenhum campo foi salvo');
        }
      }
    } else {
      const error = await response.text();
      console.log(`❌ Erro: ${error}`);
    }
  } catch (error) {
    console.log(`❌ Erro de conexão: ${error.message}`);
  }
  
  console.log('\n🎉 TESTE CONCLUÍDO!');
  console.log('==================');
}

testSimpleACF();





