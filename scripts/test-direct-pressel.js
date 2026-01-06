/**
 * Teste direto do PresselAutomationService
 */

const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://atlz.online';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function testDirectPressel() {
  console.log('🧪 TESTE DIRETO DO PRESSEL AUTOMATION');
  console.log('====================================\n');

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  
  // JSON simples para teste com campos únicos do V4
  const testJson = {
    page_title: "Teste Direto Pressel V4",
    page_content: "<p>Conteúdo de teste</p>",
    page_status: "publish",
    page_slug: `teste-direto-pressel-${Date.now()}`,
    acf_fields: {
      idioma_footer: "en", // Campo obrigatório do V4
      title_h1: "Teste Direto Pressel V4",
      sub_title: "Subtítulo de teste",
      download_button_text: "Botão de teste",
      disclaimer: "Texto de teste",
      tipo_botao: "normal",
      benefits_title: "Benefícios de Teste",
      faq_title: "FAQ de Teste"
    }
  };

  console.log('📋 TESTE: Processamento via API');
  console.log('==============================');
  
  try {
    const response = await fetch('http://localhost:3002/api/pressel/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonData: testJson,
        siteUrl: WORDPRESS_URL,
        testMode: false
      })
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Processamento realizado!');
      console.log(`📄 Página: ${result.result?.pageUrl || 'N/A'}`);
      console.log(`📄 ID: ${result.result?.pageId || 'N/A'}`);
      
      // Verificar campos salvos
      if (result.result?.pageId) {
        console.log('\n📋 VERIFICAÇÃO DOS CAMPOS');
        console.log('=========================');
        
        const checkResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/${result.result.pageId}`, {
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

testDirectPressel();
