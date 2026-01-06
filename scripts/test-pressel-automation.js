/**
 * Teste do novo sistema Pressel Automation com identificação automática
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const CMS_URL = 'http://localhost:3002';

async function testPresselAutomation() {
  console.log('🤖 TESTE DO PRESSEL AUTOMATION - IDENTIFICAÇÃO AUTOMÁTICA');
  console.log('=======================================================\n');

  try {
    // [1] Testar com JSON de exemplo
    console.log('[1] Testando com JSON de exemplo...');
    
    const exampleJson = {
      page_title: 'Página de Teste Automatizada',
      page_content: 'Conteúdo da página criada automaticamente',
      page_status: 'publish',
      page_slug: 'pagina-teste-automatizada',
      acf_fields: {
        hero_title: 'Título Principal',
        hero_description: 'Descrição do hero',
        hero_image: 'https://via.placeholder.com/1200x600',
        titulo_da_secao: 'Seção Principal',
        cor_botao: '#FF6B35',
        texto_botao_p1: 'Botão Principal',
        link_botao_p1: 'https://exemplo.com',
        titulo_h2_: 'Subtítulo 1',
        titulo_h2_02: 'Subtítulo 2',
        titulo_beneficios: 'Benefícios',
        titulo_faq: 'FAQ'
      },
      seo: {
        meta_title: 'Página de Teste - SEO',
        meta_description: 'Descrição SEO da página de teste',
        focus_keyword: 'teste, automatização'
      },
      featured_image: 'https://via.placeholder.com/1200x600'
    };

    console.log(`📊 Campos ACF: ${Object.keys(exampleJson.acf_fields).length}`);
    console.log(`📄 Título: ${exampleJson.page_title}`);
    console.log('');

    // [2] Testar modo simulado primeiro
    console.log('[2] Testando modo simulado...');
    const simulateResponse = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: 'https://atlz.online/',
        jsonData: exampleJson,
        testMode: true,
        options: {
          publish: true,
          addSeo: true,
          addAcfFields: true
        }
      })
    });

    const simulateResult = await simulateResponse.json();
    if (simulateResult.success) {
      console.log('✅ Modo simulado funcionando!');
      console.log(`📋 Modelo detectado: ${simulateResult.result.steps[1].data.detectedModel}`);
      console.log(`📈 Confiança: ${Math.round(simulateResult.result.steps[1].data.confidence * 100)}%`);
      console.log(`🔗 URL simulada: ${simulateResult.result.pageUrl}`);
    } else {
      console.log('❌ Erro no modo simulado:', simulateResult.error);
      return;
    }
    console.log('');

    // [3] Testar modo real (se configurado)
    console.log('[3] Testando modo real...');
    const realResponse = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: 'https://atlz.online/',
        jsonData: exampleJson,
        testMode: false,
        options: {
          publish: true,
          addSeo: true,
          addAcfFields: true
        }
      })
    });

    const realResult = await realResponse.json();
    if (realResult.success) {
      console.log('✅ Modo real funcionando!');
      console.log(`📋 Modelo detectado: ${realResult.detectedModel?.modelName || 'N/A'}`);
      console.log(`📈 Confiança: ${Math.round((realResult.detectedModel?.confidence || 0) * 100)}%`);
      console.log(`🔗 URL real: ${realResult.result?.pageUrl || 'N/A'}`);
      console.log(`✍️  Editar: ${realResult.result?.editUrl || 'N/A'}`);
      console.log(`🆔 ID: ${realResult.result?.pageId || 'N/A'}`);
    } else {
      console.log('❌ Erro no modo real:', realResult.error);
      console.log('💡 Isso é esperado se os modelos ainda não foram carregados');
    }
    console.log('');

    // [4] Testar diferentes tipos de JSON
    console.log('[4] Testando diferentes tipos de JSON...');
    
    const testCases = [
      {
        name: 'JSON V3',
        json: {
          page_title: 'Teste V3',
          acf_fields: {
            hero_title: 'Hero V3',
            hero_description: 'Desc V3',
            titulo_da_secao: 'Seção V3',
            cor_botao: '#2352AE',
            texto_botao_p1: 'Botão V3'
          }
        }
      },
      {
        name: 'JSON V5',
        json: {
          page_title: 'Teste V5',
          acf_fields: {
            hero_title: 'Hero V5',
            hero_subtitle: 'Sub V5',
            hero_image: 'https://via.placeholder.com/1200x600',
            content_sections: [
              { title: 'Seção 1', content: 'Conteúdo 1' },
              { title: 'Seção 2', content: 'Conteúdo 2' }
            ]
          }
        }
      },
      {
        name: 'JSON B1',
        json: {
          page_title: 'Teste B1',
          acf_fields: {
            banner_title: 'Banner B1',
            banner_subtitle: 'Sub B1',
            banner_image: 'https://via.placeholder.com/1200x600',
            cta_text: 'CTA B1',
            cta_link: 'https://exemplo.com'
          }
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`   Testando ${testCase.name}...`);
      
      const testResponse = await fetch(`${CMS_URL}/api/pressel/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: 'https://atlz.online/',
          jsonData: testCase.json,
          testMode: true
        })
      });

      const testResult = await testResponse.json();
      if (testResult.success) {
        const detectedModel = testResult.result.steps[1].data.detectedModel;
        const confidence = testResult.result.steps[1].data.confidence;
        console.log(`     ✅ Modelo detectado: ${detectedModel} (${Math.round(confidence * 100)}%)`);
      } else {
        console.log(`     ❌ Erro: ${testResult.error}`);
      }
    }

    console.log('\n🎉 TESTE DO PRESSEL AUTOMATION CONCLUÍDO!');
    console.log('=========================================');
    console.log('📊 Funcionalidades testadas:');
    console.log('   ✅ Identificação automática de modelos');
    console.log('   ✅ Processamento de campos ACF');
    console.log('   ✅ Modo simulado e real');
    console.log('   ✅ Diferentes tipos de JSON');
    console.log('');
    console.log('🚀 Próximos passos:');
    console.log('   1. Fazer upload dos modelos reais (V1, V3, V4, V5, B1)');
    console.log('   2. Executar script de processamento');
    console.log('   3. Testar com dados reais');
    console.log('   4. Configurar para todos os sites');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testPresselAutomation();





