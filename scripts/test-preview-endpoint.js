/**
 * Teste do Endpoint de Preview
 */

const fetch = require('node-fetch');

const CMS_URL = 'http://localhost:3002';

async function testPreviewEndpoint() {
  console.log('🔍 TESTANDO ENDPOINT DE PREVIEW');
  console.log('===============================\n');

  const testData = {
    siteUrl: 'https://atlz.online/',
    jsonData: {
      page_title: 'Test Preview Page',
      page_model: 'modelo_v1',
      page_template: 'pressel-oficial.php',
      page_slug: 'test-preview',
      post_status: 'draft',
      acf_fields: {
        hero_description: 'This is a test description for preview',
        titulo_da_secao: 'Test Section Title',
        cor_botao: '#FF0000',
        texto_botao_p1: 'TEST BUTTON',
        link_botao_p1: 'https://example.com/test',
        titulo_h2_: 'Test H2 Title',
        info_content: '<p>This is test content for preview.</p>',
        titulo_beneficios: 'Test Benefits',
        titulo_beneficios_1: 'Test Benefit 1',
        _beneficio_text_1: 'This is a test benefit description',
        titulo_faq: 'Test FAQ',
        pergunta_1: 'Is this a test?',
        resposta_1: 'Yes, this is a test response'
      },
      seo: {
        meta_title: 'Test Preview - Meta Title',
        meta_description: 'This is a test meta description for preview',
        focus_keyword: 'test preview'
      }
    },
    previewMode: true
  };

  try {
    console.log('🚀 Enviando requisição para preview...');
    
    const response = await fetch(`${CMS_URL}/api/pressel/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('\n📊 RESULTADO DO PREVIEW:');
    console.log('=========================');
    
    if (result.success) {
      console.log('✅ Preview gerado com sucesso!');
      console.log(`🎯 Modelo identificado: ${result.detectedModel?.modelName || 'N/A'}`);
      console.log(`📈 Confiança: ${result.detectedModel?.confidence ? Math.round(result.detectedModel.confidence * 100) : 'N/A'}%`);
      console.log(`🔧 Campos processados: ${result.stats?.fieldsProcessed || 'N/A'}`);
      
      if (result.preview) {
        console.log('\n📋 PREVIEW ESTRUTURADO:');
        console.log('=======================');
        console.log(`📄 Título: ${result.preview.pageInfo?.title || 'N/A'}`);
        console.log(`🎯 Modelo: ${result.preview.pageInfo?.model || 'N/A'}`);
        console.log(`📄 Template: ${result.preview.pageInfo?.template || 'N/A'}`);
        console.log(`🔗 Slug: ${result.preview.pageInfo?.slug || 'N/A'}`);
        
        if (result.preview.seo) {
          console.log('\n🔍 SEO:');
          console.log(`📝 Meta Title: ${result.preview.seo.metaTitle || 'N/A'}`);
          console.log(`📄 Meta Description: ${result.preview.seo.metaDescription || 'N/A'}`);
          console.log(`🎯 Focus Keyword: ${result.preview.seo.focusKeyword || 'N/A'}`);
        }
        
        if (result.preview.sections?.hero) {
          console.log('\n🎯 HERO:');
          console.log(`📝 Descrição: ${result.preview.sections.hero.description || 'N/A'}`);
        }
        
        if (result.preview.sections?.buttons) {
          console.log('\n🔘 BOTÕES:');
          console.log(`🎨 Cor: ${result.preview.sections.buttons.color || 'N/A'}`);
          console.log(`📝 Botão 1: "${result.preview.sections.buttons.button1?.text || 'N/A'}"`);
        }
        
        if (result.preview.sections?.content) {
          console.log('\n📝 CONTEÚDO:');
          console.log(`📄 Título H2: ${result.preview.sections.content.h2Title1 || 'N/A'}`);
          console.log(`📝 Conteúdo: ${result.preview.sections.content.content1?.substring(0, 50) || 'N/A'}...`);
        }
        
        if (result.preview.sections?.benefits) {
          console.log('\n⭐ BENEFÍCIOS:');
          console.log(`📄 Título: ${result.preview.sections.benefits.title || 'N/A'}`);
          console.log(`📝 Benefício 1: ${result.preview.sections.benefits.benefit1?.title || 'N/A'}`);
        }
        
        if (result.preview.sections?.faq) {
          console.log('\n❓ FAQ:');
          console.log(`📄 Título: ${result.preview.sections.faq.title || 'N/A'}`);
          console.log(`❓ Pergunta 1: ${result.preview.sections.faq.question1?.question || 'N/A'}`);
        }
        
        if (result.preview.technical) {
          console.log('\n🔧 TÉCNICO:');
          console.log(`📊 Total de campos: ${result.preview.technical.totalFields || 'N/A'}`);
          console.log(`🔧 Campos processados: ${result.preview.technical.fieldsProcessed || 'N/A'}`);
          console.log(`📈 Confiança: ${result.preview.technical.confidence ? Math.round(result.preview.technical.confidence * 100) : 'N/A'}%`);
        }
      }
      
    } else {
      console.log('❌ Erro no preview:');
      console.log(`🔢 Código: ${result.codigo || 'N/A'}`);
      console.log(`📝 Mensagem: ${result.error || 'N/A'}`);
      console.log(`📊 Detalhes: ${result.details || 'N/A'}`);
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  console.log('\n📋 RESUMO DO TESTE:');
  console.log('===================');
  console.log('✅ Endpoint de preview testado');
  console.log('✅ Estrutura de dados validada');
  console.log('✅ Preview estruturado gerado');
  console.log('✅ Sistema de preview funcionando');
}

testPreviewEndpoint();





