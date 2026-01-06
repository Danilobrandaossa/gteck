
/**
 * Teste do Pressel Automation com campos ACF corretos
 */

const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://atlz.online';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function testPresselWithCorrectACF() {
  console.log('🧪 TESTE DO PRESSEL AUTOMATION COM CAMPOS ACF CORRETOS');
  console.log('====================================================\n');

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  
  // JSON de teste com todos os campos ACF corretos
  const testJson = {
    page_title: "Driving Licence Test App: Practice for the Exam!",
    page_model: "modelo_v1",
    page_template: "pressel-oficial.php",
    page_slug: "driving-licence-test-app-corrected",
    post_status: "publish",
    acf_fields: {
      hero_description: "Prepare for your driving licence test with these top-rated free apps.",
      link_h1: "",
      botao_tipo_selecao: "normal",
      titulo_da_secao: "Get your approval!",
      cor_botao: "#2352AE",
      texto_botao_p1: "SEE IF YOU QUALIFY",
      link_botao_p1: "https://example.com/driving-licence-test-app",
      texto_botao_p2: "LEARN MORE",
      link_botao_p2: "https://example.com/driving-licence-test-app",
      texto_botao_p3: "GET STARTED",
      link_botao_p3: "https://example.com/driving-licence-test-app",
      texto_usuario: "Você permanecerá no mesmo site",
      titulo_h2_: "Study the Theory and Pass with Confidence",
      info_content: "<p>Want to pass your driving test on the first try? Use the best driving licence test app to practice for your exam and ensure you're fully prepared.</p>",
      titulo_h2_02: "Test Your Knowledge Anywhere, Anytime",
      info_content_2: "<p>With the Driving Licence Test App, you can practice anytime, anywhere, whether you're at home or on the go.</p>",
      titulo_beneficios: "Main Benefits",
      titulo_beneficios_1: "Interactive Practice Tests",
      _beneficio_text_1: "Take realistic practice exams that simulate the actual driving theory test.",
      titulo_beneficios_2: "Track Your Progress",
      _beneficio_text_2: "Monitor your progress with detailed reports.",
      titulo_beneficios_3: "Free and Accessible",
      _beneficio_text_3: "The app is free to download and provides essential study tools.",
      titulo_beneficios_4: "Flexible Learning",
      _beneficio_text_4: "Study on your own time, with access to offline tests.",
      titulo_faq: "Perguntas Frequentes",
      pergunta_1: "Is the app really free?",
      resposta_1: "Yes, the Driving Licence Test App is completely free to download and use.",
      pergunta_2: "Can I practice road signs and traffic laws?",
      resposta_2: "Absolutely! The app includes specific sections for road sign identification.",
      pergunta_3: "Can I track my progress in the app?",
      resposta_3: "Yes, the app provides detailed progress tracking.",
      aviso: "aviso_pt"
    },
    seo: {
      meta_title: "Driving Licence Test App: Practice & Pass",
      meta_description: "Practice theory tests, road signs and simulations. Study offline and track progress to pass your driving licence exam on the first try.",
      focus_keyword: "driving licence test app"
    }
  };

  console.log('📋 TESTE 1: Processamento completo com campos ACF corretos');
  console.log('=========================================================');
  
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

testPresselWithCorrectACF();
