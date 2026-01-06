/**
 * Teste Específico com JSON Real - Driving Licence Test App
 * Analisa a identificação de campos e taxa de sucesso
 */

const fetch = require('node-fetch');

const CMS_URL = 'http://localhost:3002';

async function testRealJson() {
  console.log('🚗 TESTE COM JSON REAL - DRIVING LICENCE TEST APP');
  console.log('==================================================\n');

  const realJson = {
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
      "link_botao_p1": "[https://example.com/driving-licence-test-app](https://example.com/driving-licence-test-app)",
      "texto_botao_p2": "LEARN MORE",
      "link_botao_p2": "[https://example.com/driving-licence-test-app](https://example.com/driving-licence-test-app)",
      "texto_botao_p3": "GET STARTED",
      "link_botao_p3": "[https://example.com/driving-licence-test-app](https://example.com/driving-licence-test-app)",
      "texto_usuario": "Você permanecerá no mesmo site",
      "titulo_h2_": "Study the Theory and Pass with Confidence",
      "info_content": "<p>Want to pass your driving test on the first try? Use the best driving licence test app to practice for your exam and ensure you're fully prepared.</p><p>With interactive tests, road sign recognition, and real-life simulations, this app is your ultimate study tool for the driving theory exam.</p><p>The Driving Licence Test App provides all the essential material you need to pass the theory exam. From traffic laws and road signs to safety rules, this app covers everything you need to know.</p><p>Whether you're new to driving or just need a refresher, the app's interactive quizzes and simulated exams will help you prepare effectively.</p><p>You can track your progress with real-time feedback and identify areas where you need to focus. The app's realistic test simulations give you a feel for the actual exam, making it easier to pass with confidence.</p>",
      "titulo_h2_02": "Test Your Knowledge Anywhere, Anytime",
      "info_content_2": "<p>With the Driving Licence Test App, you can practice anytime, anywhere, whether you're at home or on the go. Study at your own pace, and take as many practice tests as you need to feel ready.</p><p>You can access the app's resources offline, so you don't need an internet connection to study while you're on the move.</p><p>This flexibility allows you to fit studying into your daily routine, whether you have five minutes during your commute or a few hours at home.</p>",
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
      "aviso": "aviso_pt"
    },
    "seo": {
      "meta_title": "Driving Licence Test App: Practice & Pass",
      "meta_description": "Practice theory tests, road signs and simulations. Study offline and track progress to pass your driving licence exam on the first try.",
      "focus_keyword": "driving licence test app"
    },
    "featured_image": ""
  };

  console.log('📊 ANÁLISE DO JSON:');
  console.log('==================');
  console.log(`📝 Título: ${realJson.page_title}`);
  console.log(`🎯 Modelo: ${realJson.page_model}`);
  console.log(`📄 Template: ${realJson.page_template}`);
  console.log(`🔗 Slug: ${realJson.page_slug}`);
  console.log(`📊 Status: ${realJson.post_status}`);
  console.log(`📋 Total de campos ACF: ${Object.keys(realJson.acf_fields).length}`);
  
  console.log('\n📋 CAMPOS ACF PRESENTES:');
  console.log('========================');
  Object.keys(realJson.acf_fields).forEach((field, index) => {
    console.log(`${index + 1}. ${field}`);
  });

  console.log('\n🔍 TESTANDO IDENTIFICAÇÃO DO MODELO:');
  console.log('====================================');

  try {
    const response = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: 'https://atlz.online/',
        jsonData: realJson,
        testMode: false
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ SUCESSO! Página criada com sucesso!');
      console.log(`🎯 Modelo identificado: ${result.detectedModel?.modelName || 'N/A'}`);
      console.log(`📊 Confiança: ${Math.round((result.detectedModel?.confidence || 0) * 100)}%`);
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

  console.log('\n🎯 ANÁLISE DE CAMPOS IDENTIFICADOS:');
  console.log('====================================');
  
  // Campos que devem ser identificados pelo modelo V1
  const expectedV1Fields = [
    'hero_description',
    'titulo_da_secao',
    'cor_botao',
    'texto_botao_p1',
    'link_botao_p1',
    'texto_botao_p2',
    'link_botao_p2',
    'texto_botao_p3',
    'link_botao_p3',
    'titulo_h2_',
    'titulo_h2_02',
    'titulo_beneficios',
    'titulo_faq',
    'pergunta_1',
    'pergunta_2',
    'pergunta_3',
    'resposta_1',
    'resposta_2',
    'resposta_3',
    'titulo_beneficios_1',
    'titulo_beneficios_2',
    'titulo_beneficios_3',
    'titulo_beneficios_4',
    '_beneficio_text_1',
    '_beneficio_text_2',
    '_beneficio_text_3',
    '_beneficio_text_4',
    'info_content',
    'info_content_2',
    'aviso'
  ];

  const presentFields = Object.keys(realJson.acf_fields);
  const matchedFields = presentFields.filter(field => expectedV1Fields.includes(field));
  const unmatchedFields = presentFields.filter(field => !expectedV1Fields.includes(field));
  
  console.log(`📊 Total de campos no JSON: ${presentFields.length}`);
  console.log(`✅ Campos reconhecidos pelo modelo V1: ${matchedFields.length}`);
  console.log(`❓ Campos não reconhecidos: ${unmatchedFields.length}`);
  console.log(`📈 Taxa de reconhecimento: ${Math.round((matchedFields.length / presentFields.length) * 100)}%`);
  
  if (matchedFields.length > 0) {
    console.log('\n✅ CAMPOS RECONHECIDOS:');
    matchedFields.forEach(field => {
      console.log(`   ✅ ${field}`);
    });
  }
  
  if (unmatchedFields.length > 0) {
    console.log('\n❓ CAMPOS NÃO RECONHECIDOS:');
    unmatchedFields.forEach(field => {
      console.log(`   ❓ ${field}`);
    });
  }

  console.log('\n🚀 PRÓXIMOS PASSOS:');
  console.log('===================');
  console.log('1. ✅ Analisar campos não reconhecidos');
  console.log('2. ✅ Atualizar assinatura do modelo V1');
  console.log('3. ✅ Melhorar taxa de identificação');
  console.log('4. ✅ Testar publicação completa');
  console.log('5. ✅ Validar todos os campos ACF');
}

testRealJson();





