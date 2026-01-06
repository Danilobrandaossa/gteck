/**
 * Teste de debug do PresselAutomationService
 */

const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://atlz.online';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function testDebugPressel() {
  console.log('🔍 DEBUG DO PRESSEL AUTOMATION');
  console.log('==============================\n');

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  
  // JSON simples para debug
  const testJson = {
    page_title: "Debug Pressel V4",
    page_content: "<p>Conteúdo de debug</p>",
    page_status: "publish",
    page_slug: `debug-pressel-${Date.now()}`,
    acf_fields: {
      idioma_footer: "en",
      title_h1: "Debug Pressel V4",
      sub_title: "Subtítulo de debug",
      download_button_text: "Botão de debug"
    }
  };

  console.log('📋 JSON enviado:');
  console.log(JSON.stringify(testJson, null, 2));
  console.log('\n📋 TESTE: Processamento via API');
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
      console.log(`📄 Modelo detectado: ${result.detectedModel?.modelName || 'N/A'}`);
      console.log(`📄 Campos processados: ${result.stats?.fieldsProcessed || 'N/A'}`);
      
      // Mostrar resultado completo
      console.log('\n📋 RESULTADO COMPLETO:');
      console.log(JSON.stringify(result, null, 2));
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

testDebugPressel();
