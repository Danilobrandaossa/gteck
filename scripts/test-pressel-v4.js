/**
 * Teste do Pressel Automation com modelo V4
 */

const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://atlz.online';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function testPresselV4() {
  console.log('🧪 TESTE DO PRESSEL AUTOMATION - MODELO V4');
  console.log('==========================================\n');

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  
  // JSON de teste para o modelo V4 (usando o arquivo example-data.json)
  const fs = require('fs');
  const path = require('path');
  const jsonPath = path.join(__dirname, '..', 'uploads', 'pressel-models', 'V4', 'example-data.json');
  const testJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  // Ajustar para teste
  testJson.page_slug = `yarnpal-crochet-download-v4-test-${Date.now()}`;

  console.log('📋 TESTE 1: Processamento completo do modelo V4');
  console.log('===============================================');
  
  try {
    const response = await fetch('http://localhost:3002/api/pressel/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonData: testJson,
        siteUrl: WORDPRESS_URL,
        testMode: false,
        options: {
          publish: true,
          addSeo: true,
          addAcfFields: true,
          notifyOnComplete: true
        }
      })
    });

    console.log(`📊 Status do Processamento: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Processamento completo funcionando!');
      console.log(`📄 Página criada: ${result.result?.pageUrl || 'N/A'}`);
      console.log(`📄 ID da página: ${result.result?.pageId || 'N/A'}`);
      console.log(`📄 Modelo detectado: ${result.detectedModel || 'N/A'}`);
      console.log(`📄 Campos processados: ${result.stats?.fieldsProcessed || 'N/A'}`);
      
      // Verificar se os campos ACF foram preenchidos
      console.log('\n📋 TESTE 2: Verificando campos ACF preenchidos');
      console.log('==============================================');
      
      const acfResponse = await fetch(`${WORDPRESS_URL}/wp-json/acf/v3/pages/${result.result?.pageId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });
      
      if (acfResponse.ok) {
        const pageData = await acfResponse.json();
        const acfFields = pageData.acf || {};
        
        console.log(`📊 Campos ACF encontrados: ${Object.keys(acfFields).length}`);
        
        if (Object.keys(acfFields).length > 0) {
          console.log('✅ Campos ACF foram preenchidos corretamente!');
          console.log('📋 Campos preenchidos:');
          Object.entries(acfFields).forEach(([key, value]) => {
            console.log(`  - ${key}: ${value}`);
          });
        } else {
          console.log('❌ Nenhum campo ACF foi preenchido');
        }
      } else {
        console.log('❌ Não foi possível verificar campos ACF');
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Erro no processamento:');
      console.log(`📄 ${error}`);
    }
  } catch (error) {
    console.log(`❌ Erro de conexão: ${error.message}`);
  }

  console.log('\n🎉 TESTE CONCLUÍDO!');
  console.log('===================');
}

testPresselV4();
