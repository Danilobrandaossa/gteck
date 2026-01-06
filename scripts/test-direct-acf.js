/**
 * Teste direto de preenchimento de campos ACF
 */

const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://atlz.online';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function testDirectACFUpdate() {
  console.log('🧪 TESTE DIRETO DE CAMPOS ACF');
  console.log('============================\n');

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  const pageId = 3889;
  
  // Campos ACF para testar
  const acfFields = {
    title_h1: "YarnPal – Crochet for Beginner (ACF Test)",
    sub_title: "Perfect for those starting their crochet journey with easy and guided learning",
    download_button_text: "START YOUR CROCHET JOURNEY TODAY",
    disclaimer: "You will remain on the same site",
    description: "<p>Discover how YarnPal helps beginners learn crochet step-by-step with simple, guided lessons.</p>",
    benefits_title: "Main Benefits",
    faq_title: "FAQ"
  };
  
  console.log('📋 TESTE 1: Atualização via meta fields');
  console.log('======================================');
  
  try {
    const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/${pageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        meta: acfFields
      })
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Campos atualizados via meta!');
    } else {
      const error = await response.text();
      console.log(`❌ Erro: ${error}`);
    }
  } catch (error) {
    console.log(`❌ Erro de conexão: ${error.message}`);
  }
  
  console.log('\n📋 TESTE 2: Atualização via acf property');
  console.log('=========================================');
  
  try {
    const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/${pageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        acf: acfFields
      })
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Campos atualizados via acf!');
    } else {
      const error = await response.text();
      console.log(`❌ Erro: ${error}`);
    }
  } catch (error) {
    console.log(`❌ Erro de conexão: ${error.message}`);
  }
  
  console.log('\n📋 TESTE 3: Verificação dos campos');
  console.log('==================================');
  
  try {
    const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/${pageId}`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (response.ok) {
      const pageData = await response.json();
      console.log(`📊 Campos ACF: ${Object.keys(pageData.acf || {}).length}`);
      console.log(`📊 Campos Meta: ${Object.keys(pageData.meta || {}).length}`);
      
      if (Object.keys(pageData.acf || {}).length > 0) {
        console.log('✅ Campos ACF encontrados:');
        Object.entries(pageData.acf).forEach(([key, value]) => {
          console.log(`  - ${key}: ${value}`);
        });
      }
      
      if (Object.keys(pageData.meta || {}).length > 0) {
        console.log('✅ Campos Meta encontrados:');
        Object.entries(pageData.meta).forEach(([key, value]) => {
          if (key.startsWith('_')) return; // Pular campos internos
          console.log(`  - ${key}: ${value}`);
        });
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

testDirectACFUpdate();





