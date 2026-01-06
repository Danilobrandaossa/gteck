/**
 * Log Super Detalhado - Mostra cada campo sendo processado
 * Inclui análise de cada campo ACF individualmente
 */

const fetch = require('node-fetch');

const CMS_URL = 'http://localhost:3002';

async function testSuperDetailedLog() {
  console.log('🔍 LOG SUPER DETALHADO - ANÁLISE CAMPO POR CAMPO');
  console.log('================================================\n');

  const completeJson = {
    "page_title": "Driving Licence Test App: Practice for the Exam!",
    "page_model": "modelo_v1", 
    "page_template": "pressel-oficial.php",
    "page_slug": "driving-licence-test-app",
    "post_status": "publish",
    "acf_fields": {
      "hero_description": "Prepare for your driving licence test with these top-rated free apps.",
      "link_h1": "",
      "botao_tipo_selecao": "normal",
      "titulo_da_secao": "Get your approval!",
      "cor_botao": "#2352AE",
      "texto_botao_p1": "SEE IF YOU QUALIFY",
      "link_botao_p1": "https://example.com/driving-licence-test-app",
      "texto_botao_p2": "LEARN MORE", 
      "link_botao_p2": "https://example.com/driving-licence-test-app",
      "texto_botao_p3": "GET STARTED",
      "link_botao_p3": "https://example.com/driving-licence-test-app",
      "texto_usuario": "Você permanecerá no mesmo site",
      "titulo_h2_": "Study the Theory and Pass with Confidence",
      "info_content": "<p>Want to pass your driving test on the first try? Use the best driving licence test app to practice for your exam and ensure you're fully prepared.</p>",
      "titulo_h2_02": "Test Your Knowledge Anywhere, Anytime",
      "info_content_2": "<p>With the Driving Licence Test App, you can practice anytime, anywhere, whether you're at home or on the go.</p>",
      "titulo_beneficios": "Main Benefits",
      "titulo_beneficios_1": "Interactive Practice Tests",
      "_beneficio_text_1": "Take realistic practice exams that simulate the actual driving theory test.",
      "titulo_beneficios_2": "Track Your Progress",
      "_beneficio_text_2": "Monitor your progress with detailed reports.",
      "titulo_beneficios_3": "Free and Accessible", 
      "_beneficio_text_3": "The app is free to download and provides essential study tools.",
      "titulo_beneficios_4": "Flexible Learning",
      "_beneficio_text_4": "Study on your own time, with access to offline tests.",
      "titulo_faq": "Perguntas Frequentes",
      "pergunta_1": "Is the app really free?",
      "resposta_1": "Yes, the Driving Licence Test App is completely free to download and use.",
      "pergunta_2": "Can I practice road signs and traffic laws?",
      "resposta_2": "Absolutely! The app includes specific sections for road sign identification.",
      "pergunta_3": "Can I track my progress in the app?",
      "resposta_3": "Yes, the app provides detailed progress tracking.",
      "aviso": "Aviso Legal: Este conteúdo é apenas informativo e não constitui aconselhamento jurídico ou financeiro."
    },
    "seo": {
      "meta_title": "Driving Licence Test App: Practice & Pass",
      "meta_description": "Practice theory tests, road signs and simulations. Study offline and track progress to pass your driving licence exam on the first try.",
      "focus_keyword": "driving licence test app"
    },
    "featured_image": ""
  };

  console.log('📊 ESTRUTURA COMPLETA DO JSON:');
  console.log('==============================');
  console.log(JSON.stringify(completeJson, null, 2));

  console.log('\n🔍 ANÁLISE CAMPO POR CAMPO:');
  console.log('============================');

  // Análise dos campos principais
  console.log('\n📄 CAMPOS PRINCIPAIS DA PÁGINA:');
  console.log('--------------------------------');
  console.log(`📝 page_title: "${completeJson.page_title}"`);
  console.log(`   └─ Tipo: string, Tamanho: ${completeJson.page_title.length} caracteres`);
  console.log(`🎯 page_model: "${completeJson.page_model}"`);
  console.log(`   └─ Tipo: string, Modelo: ${completeJson.page_model}`);
  console.log(`📄 page_template: "${completeJson.page_template}"`);
  console.log(`   └─ Tipo: string, Template: ${completeJson.page_template}`);
  console.log(`🔗 page_slug: "${completeJson.page_slug}"`);
  console.log(`   └─ Tipo: string, Slug: ${completeJson.page_slug}`);
  console.log(`📊 post_status: "${completeJson.post_status}"`);
  console.log(`   └─ Tipo: string, Status: ${completeJson.post_status}`);

  // Análise detalhada dos campos ACF
  console.log('\n🔧 CAMPOS ACF DETALHADOS:');
  console.log('-------------------------');
  
  const acfFields = completeJson.acf_fields;
  const fieldCount = Object.keys(acfFields).length;
  
  console.log(`📊 Total de campos ACF: ${fieldCount}`);
  console.log('');

  // Categorizar campos por tipo
  const heroFields = [];
  const buttonFields = [];
  const contentFields = [];
  const benefitFields = [];
  const faqFields = [];
  const otherFields = [];

  Object.entries(acfFields).forEach(([field, value]) => {
    if (field.includes('hero')) {
      heroFields.push({ field, value });
    } else if (field.includes('botao') || field.includes('button')) {
      buttonFields.push({ field, value });
    } else if (field.includes('content') || field.includes('titulo_h2')) {
      contentFields.push({ field, value });
    } else if (field.includes('beneficio')) {
      benefitFields.push({ field, value });
    } else if (field.includes('pergunta') || field.includes('resposta') || field.includes('faq')) {
      faqFields.push({ field, value });
    } else {
      otherFields.push({ field, value });
    }
  });

  // Hero Section
  console.log('🎯 SEÇÃO HERO:');
  heroFields.forEach(({ field, value }, index) => {
    console.log(`   ${index + 1}. ${field}: "${value}"`);
    console.log(`      └─ Tipo: ${typeof value}, Tamanho: ${value.length} caracteres`);
  });

  // Button Section
  console.log('\n🔘 SEÇÃO BOTÕES:');
  buttonFields.forEach(({ field, value }, index) => {
    console.log(`   ${index + 1}. ${field}: "${value}"`);
    console.log(`      └─ Tipo: ${typeof value}, Tamanho: ${value.length} caracteres`);
  });

  // Content Section
  console.log('\n📝 SEÇÃO CONTEÚDO:');
  contentFields.forEach(({ field, value }, index) => {
    const displayValue = value.length > 100 ? value.substring(0, 100) + '...' : value;
    console.log(`   ${index + 1}. ${field}: "${displayValue}"`);
    console.log(`      └─ Tipo: ${typeof value}, Tamanho: ${value.length} caracteres`);
  });

  // Benefits Section
  console.log('\n⭐ SEÇÃO BENEFÍCIOS:');
  benefitFields.forEach(({ field, value }, index) => {
    const displayValue = value.length > 80 ? value.substring(0, 80) + '...' : value;
    console.log(`   ${index + 1}. ${field}: "${displayValue}"`);
    console.log(`      └─ Tipo: ${typeof value}, Tamanho: ${value.length} caracteres`);
  });

  // FAQ Section
  console.log('\n❓ SEÇÃO FAQ:');
  faqFields.forEach(({ field, value }, index) => {
    const displayValue = value.length > 80 ? value.substring(0, 80) + '...' : value;
    console.log(`   ${index + 1}. ${field}: "${displayValue}"`);
    console.log(`      └─ Tipo: ${typeof value}, Tamanho: ${value.length} caracteres`);
  });

  // Other Fields
  console.log('\n🔧 OUTROS CAMPOS:');
  otherFields.forEach(({ field, value }, index) => {
    const displayValue = value.length > 80 ? value.substring(0, 80) + '...' : value;
    console.log(`   ${index + 1}. ${field}: "${displayValue}"`);
    console.log(`      └─ Tipo: ${typeof value}, Tamanho: ${value.length} caracteres`);
  });

  // Análise do SEO
  console.log('\n🔍 CAMPOS SEO:');
  console.log('---------------');
  console.log(`📝 meta_title: "${completeJson.seo.meta_title}"`);
  console.log(`   └─ Tipo: string, Tamanho: ${completeJson.seo.meta_title.length} caracteres`);
  console.log(`📄 meta_description: "${completeJson.seo.meta_description}"`);
  console.log(`   └─ Tipo: string, Tamanho: ${completeJson.seo.meta_description.length} caracteres`);
  console.log(`🎯 focus_keyword: "${completeJson.seo.focus_keyword}"`);
  console.log(`   └─ Tipo: string, Tamanho: ${completeJson.seo.focus_keyword.length} caracteres`);

  // Estatísticas gerais
  console.log('\n📊 ESTATÍSTICAS GERAIS:');
  console.log('------------------------');
  console.log(`📄 Total de campos: ${fieldCount + 5}`); // 5 campos principais + ACF
  console.log(`🔧 Campos ACF: ${fieldCount}`);
  console.log(`📝 Campos principais: 5`);
  console.log(`🔍 Campos SEO: 3`);
  console.log(`🖼️ Featured image: ${completeJson.featured_image ? 'Sim' : 'Não'}`);

  // Análise de tipos de dados
  const stringFields = Object.values(acfFields).filter(v => typeof v === 'string').length;
  const numberFields = Object.values(acfFields).filter(v => typeof v === 'number').length;
  const booleanFields = Object.values(acfFields).filter(v => typeof v === 'boolean').length;
  const objectFields = Object.values(acfFields).filter(v => typeof v === 'object').length;

  console.log('\n📈 ANÁLISE DE TIPOS DE DADOS:');
  console.log('-----------------------------');
  console.log(`📝 Campos string: ${stringFields}`);
  console.log(`🔢 Campos number: ${numberFields}`);
  console.log(`✅ Campos boolean: ${booleanFields}`);
  console.log(`📦 Campos object: ${objectFields}`);

  console.log('\n🚀 ENVIANDO PARA PROCESSAMENTO...');
  console.log('=================================');

  try {
    const response = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: 'https://atlz.online/',
        jsonData: completeJson,
        testMode: false
      })
    });

    const result = await response.json();
    
    console.log('\n📊 RESULTADO DO PROCESSAMENTO:');
    console.log('==============================');
    
    if (result.success) {
      console.log('✅ SUCESSO! Página criada com sucesso!');
      console.log(`🎯 Modelo identificado: ${result.detectedModel?.modelName || 'N/A'}`);
      console.log(`📈 Confiança: ${Math.round((result.detectedModel?.confidence || 0) * 100)}%`);
      console.log(`🔗 URL da página: ${result.result?.pageUrl || 'N/A'}`);
      console.log(`📝 ID da página: ${result.result?.pageId || 'N/A'}`);
      console.log(`🔧 Campos processados: ${result.result?.fieldsProcessed || 'N/A'}`);
      
      console.log('\n📋 CAMPOS IDENTIFICADOS PELO MODELO:');
      if (result.detectedModel?.matchedFields) {
        result.detectedModel.matchedFields.forEach((field, index) => {
          console.log(`   ${index + 1}. ${field}`);
        });
      }
      
    } else {
      console.log('❌ ERRO no processamento:');
      console.log(`🔢 Código: ${result.codigo || 'N/A'}`);
      console.log(`📝 Mensagem: ${result.mensagem || 'N/A'}`);
      console.log(`🏷️ Categoria: ${result.categoria || 'N/A'}`);
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  console.log('\n📋 RESUMO FINAL:');
  console.log('================');
  console.log('✅ JSON completo analisado campo por campo');
  console.log('✅ Categorização por seções realizada');
  console.log('✅ Análise de tipos de dados concluída');
  console.log('✅ Estatísticas detalhadas geradas');
  console.log('✅ Processamento via API executado');
  console.log('✅ Resultado detalhado exibido');
}

testSuperDetailedLog();





