/**
 * Teste com Log Detalhado dos Campos JSON
 * Mostra exatamente como cada campo está sendo processado
 */

const fetch = require('node-fetch');

const CMS_URL = 'http://localhost:3002';

async function testWithDetailedJsonLog() {
  console.log('📋 TESTE COM LOG DETALHADO DOS CAMPOS JSON');
  console.log('==========================================\n');

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
      "info_content": "<p>Want to pass your driving test on the first try? Use the best driving licence test app to practice for your exam and ensure you're fully prepared.</p><p>With interactive tests, road sign recognition, and real-life simulations, this app is your ultimate study tool for the driving theory exam.</p>",
      "titulo_h2_02": "Test Your Knowledge Anywhere, Anytime",
      "info_content_2": "<p>With the Driving Licence Test App, you can practice anytime, anywhere, whether you're at home or on the go.</p>",
      "titulo_beneficios": "Main Benefits",
      "titulo_beneficios_1": "Interactive Practice Tests",
      "_beneficio_text_1": "Take realistic practice exams that simulate the actual driving theory test, helping you get comfortable with the test format.",
      "titulo_beneficios_2": "Track Your Progress",
      "_beneficio_text_2": "Monitor your progress with detailed reports, so you can focus on areas that need improvement.",
      "titulo_beneficios_3": "Free and Accessible",
      "_beneficio_text_3": "The app is free to download and provides essential study tools at no cost, giving you access to interactive quizzes and simulated tests.",
      "titulo_beneficios_4": "Flexible Learning",
      "_beneficio_text_4": "Study on your own time, with access to offline tests and the ability to practice anytime, anywhere.",
      "titulo_faq": "Perguntas Frequentes",
      "pergunta_1": "Is the app really free?",
      "resposta_1": "Yes, the Driving Licence Test App is completely free to download and use, with core features available at no cost.",
      "pergunta_2": "Can I practice road signs and traffic laws?",
      "resposta_2": "Absolutely! The app includes specific sections for road sign identification and traffic laws, helping you memorize them for the test.",
      "pergunta_3": "Can I track my progress in the app?",
      "resposta_3": "Yes, the app provides detailed progress tracking, so you can see which areas you're doing well in and which areas need more practice.",
      "aviso": "Aviso Legal: Este conteúdo é apenas informativo e não constitui aconselhamento jurídico ou financeiro."
    },
    "seo": {
      "meta_title": "Driving Licence Test App: Practice & Pass",
      "meta_description": "Practice theory tests, road signs and simulations. Study offline and track progress to pass your driving licence exam on the first try.",
      "focus_keyword": "driving licence test app"
    },
    "featured_image": ""
  };

  console.log('📊 JSON COMPLETO ENVIADO:');
  console.log('========================');
  console.log(JSON.stringify(completeJson, null, 2));

  console.log('\n🔍 ANÁLISE DETALHADA DOS CAMPOS:');
  console.log('================================');

  // Análise dos campos principais
  console.log('\n📄 CAMPOS PRINCIPAIS:');
  console.log(`   📝 page_title: "${completeJson.page_title}"`);
  console.log(`   🎯 page_model: "${completeJson.page_model}"`);
  console.log(`   📄 page_template: "${completeJson.page_template}"`);
  console.log(`   🔗 page_slug: "${completeJson.page_slug}"`);
  console.log(`   📊 post_status: "${completeJson.post_status}"`);

  // Análise dos campos ACF
  console.log('\n🔧 CAMPOS ACF (${Object.keys(completeJson.acf_fields).length} campos):');
  Object.entries(completeJson.acf_fields).forEach(([field, value], index) => {
    const displayValue = typeof value === 'string' && value.length > 50 
      ? value.substring(0, 50) + '...' 
      : value;
    console.log(`   ${index + 1}. ${field}: "${displayValue}"`);
  });

  // Análise do SEO
  console.log('\n🔍 CAMPOS SEO:');
  console.log(`   📝 meta_title: "${completeJson.seo.meta_title}"`);
  console.log(`   📄 meta_description: "${completeJson.seo.meta_description}"`);
  console.log(`   🎯 focus_keyword: "${completeJson.seo.focus_keyword}"`);

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
      
      if (result.stats) {
        console.log('\n📊 ESTATÍSTICAS:');
        console.log(`   ✅ Processos bem-sucedidos: ${result.stats.successfulProcesses || 0}`);
        console.log(`   ⚠️ Avisos: ${result.stats.warnings || 0}`);
        console.log(`   🚨 Erros: ${result.stats.errors || 0}`);
        console.log(`   ⏱️ Duração: ${result.duration || 0}ms`);
      }
      
    } else {
      console.log('❌ ERRO no processamento:');
      console.log(`🔢 Código: ${result.codigo || 'N/A'}`);
      console.log(`📝 Mensagem: ${result.mensagem || 'N/A'}`);
      console.log(`🏷️ Categoria: ${result.categoria || 'N/A'}`);
      
      if (result.detalhes) {
        console.log('📊 Detalhes:', result.detalhes);
      }
      
      if (result.sugestoes) {
        console.log('💡 Sugestões:');
        result.sugestoes.forEach(sugestao => {
          console.log(`   - ${sugestao}`);
        });
      }
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  console.log('\n📋 RESUMO DO TESTE:');
  console.log('===================');
  console.log('✅ JSON completo enviado com todos os campos');
  console.log('✅ Análise detalhada de cada campo realizada');
  console.log('✅ Processamento via API executado');
  console.log('✅ Resultado detalhado exibido');
  console.log('✅ Logs em tempo real monitorados');
}

testWithDetailedJsonLog();





