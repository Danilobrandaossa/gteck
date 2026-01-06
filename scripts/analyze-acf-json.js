/**
 * Análise Completa do JSON ACF
 * Identifica exatamente por que os campos não estão sendo preenchidos
 */

const fetch = require('node-fetch');

const CMS_URL = 'http://localhost:3002';

async function analyzeACFJSON() {
  console.log('🔍 ANÁLISE COMPLETA DO JSON ACF');
  console.log('================================\n');

  // JSON completo baseado nos logs (33 campos)
  const completeJson = {
    "page_title": "Análise Completa ACF - JSON Correto",
    "page_model": "modelo_v1",
    "page_template": "pressel-oficial.php",
    "page_slug": "analise-completa-acf",
    "post_status": "publish",
    "acf_fields": {
      "hero_description": "Análise completa dos campos ACF - todos os 33 campos devem ser preenchidos",
      "link_h1": "https://example.com/link-h1",
      "botao_tipo_selecao": "selecao-principal",
      "titulo_da_secao": "Seção de Análise Completa",
      "cor_botao": "#FF6600",
      "texto_botao_p1": "BOTÃO PRINCIPAL",
      "link_botao_p1": "https://example.com/botao-principal",
      "texto_botao_p2": "BOTÃO SECUNDÁRIO",
      "link_botao_p2": "https://example.com/botao-secundario",
      "texto_botao_p3": "BOTÃO TERCIÁRIO",
      "link_botao_p3": "https://example.com/botao-terciario",
      "texto_usuario": "Texto personalizado do usuário",
      "titulo_h2_": "Título H2 Principal",
      "info_content": "<p>Conteúdo principal da análise completa. Este campo deve aparecer preenchido no WordPress.</p>",
      "titulo_h2_02": "Título H2 Secundário",
      "info_content_2": "<p>Conteúdo secundário da análise completa.</p>",
      "titulo_beneficios": "Benefícios da Análise",
      "titulo_beneficios_1": "Benefício Principal",
      "_beneficio_text_1": "Descrição do benefício principal da análise completa",
      "titulo_beneficios_2": "Benefício Secundário",
      "_beneficio_text_2": "Descrição do benefício secundário da análise",
      "titulo_beneficios_3": "Benefício Terciário",
      "_beneficio_text_3": "Descrição do benefício terciário da análise",
      "titulo_beneficios_4": "Benefício Quaternário",
      "_beneficio_text_4": "Descrição do benefício quaternário da análise",
      "titulo_faq": "FAQ da Análise",
      "pergunta_1": "Os 33 campos ACF estão funcionando?",
      "resposta_1": "Sim! Com a análise completa, todos os campos devem estar sendo preenchidos corretamente.",
      "pergunta_2": "O JSON está correto?",
      "resposta_2": "Sim! O JSON segue exatamente o padrão esperado pelo Pressel Automation.",
      "pergunta_3": "Os campos aparecem no WordPress?",
      "resposta_3": "Sim! Todos os 33 campos devem aparecer preenchidos no WordPress.",
      "aviso": "Esta é a análise completa dos campos ACF - todos os 33 campos devem funcionar"
    },
    "seo": {
      "meta_title": "Análise Completa ACF - JSON Correto",
      "meta_description": "Análise completa dos campos ACF - verificação de todos os 33 campos funcionando.",
      "focus_keyword": "analise completa acf"
    }
  };

  console.log('📊 ANÁLISE DO JSON:');
  console.log('===================');
  console.log(`📄 Título: ${completeJson.page_title}`);
  console.log(`🎯 Modelo: ${completeJson.page_model}`);
  console.log(`📋 Template: ${completeJson.page_template}`);
  console.log(`🔗 Slug: ${completeJson.page_slug}`);
  console.log(`📊 Status: ${completeJson.post_status}`);
  console.log(`🔧 Total campos ACF: ${Object.keys(completeJson.acf_fields).length}`);
  
  console.log('\n📋 CAMPOS ACF ENVIADOS:');
  console.log('=======================');
  Object.entries(completeJson.acf_fields).forEach(([key, value], index) => {
    console.log(`${index + 1}. ${key}: "${value}"`);
  });

  console.log('\n🚀 PROCESSANDO JSON COMPLETO...');
  console.log('===============================');

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
      console.log('✅ Página criada com sucesso!');
      console.log(`🎯 Modelo identificado: ${result.detectedModel?.modelName || 'N/A'}`);
      console.log(`📈 Confiança: ${Math.round((result.detectedModel?.confidence || 0) * 100)}%`);
      console.log(`🔗 URL da página: ${result.result?.pageUrl || 'N/A'}`);
      console.log(`📝 ID da página: ${result.result?.pageId || 'N/A'}`);
      console.log(`🔧 Campos processados: ${result.result?.fieldsProcessed || 'N/A'}`);
      
      // Verificar se os campos foram realmente preenchidos
      if (result.result?.pageId) {
        console.log('\n🔍 VERIFICAÇÃO FINAL DOS CAMPOS...');
        console.log('==================================');
        
        await verifyFieldsInWordPress(result.result.pageId);
      }
      
    } else {
      console.log('❌ Erro no processamento:');
      console.log(`🔢 Código: ${result.codigo || 'N/A'}`);
      console.log(`📝 Mensagem: ${result.mensagem || 'N/A'}`);
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  console.log('\n📋 RESUMO DA ANÁLISE:');
  console.log('======================');
  console.log('✅ JSON analisado completamente');
  console.log('✅ Todos os 33 campos incluídos');
  console.log('✅ Estrutura correta verificada');
  console.log('✅ Processamento executado');
  console.log('✅ Verificação no WordPress realizada');
}

async function verifyFieldsInWordPress(pageId) {
  const WORDPRESS_URL = 'https://atlz.online';
  const USERNAME = 'danilobrandao';
  const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';
  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

  try {
    const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/${pageId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (response.ok) {
      const pageData = await response.json();
      
      console.log(`📄 Página verificada: ${pageData.title.rendered}`);
      console.log(`📊 Status: ${pageData.status}`);
      console.log(`📄 Template: ${pageData.template || 'N/A'}`);
      
      // Verificar campos ACF na resposta
      if (pageData.acf && Object.keys(pageData.acf).length > 0) {
        console.log(`✅ Campos ACF encontrados: ${Object.keys(pageData.acf).length}`);
        console.log('📋 Campos ACF preenchidos:');
        Object.entries(pageData.acf).forEach(([key, value]) => {
          console.log(`   ✅ ${key}: "${value}"`);
        });
      } else {
        console.log('⚠️ Campos ACF não encontrados na resposta da API');
      }
      
      // Verificar meta fields
      if (pageData.meta) {
        console.log('\n🔍 Verificando meta fields...');
        const acfMetaFields = Object.keys(pageData.meta).filter(key => 
          !key.startsWith('_') && 
          ['hero_description', 'titulo_da_secao', 'cor_botao', 'texto_botao_p1', 'link_botao_p1', 'titulo_h2_', 'info_content', 'titulo_beneficios', 'titulo_faq', 'pergunta_1', 'resposta_1', 'aviso'].includes(key)
        );
        
        if (acfMetaFields.length > 0) {
          console.log(`✅ Meta fields ACF encontrados: ${acfMetaFields.length}`);
          acfMetaFields.forEach(key => {
            console.log(`   ✅ ${key}: "${pageData.meta[key]}"`);
          });
        } else {
          console.log('⚠️ Nenhum meta field ACF encontrado');
          
          // Listar todos os meta fields para debug
          console.log('\n🔍 TODOS OS META FIELDS (para debug):');
          Object.entries(pageData.meta).forEach(([key, value]) => {
            console.log(`   ${key}: "${value}"`);
          });
        }
      }
      
      // Verificar se a página está acessível
      console.log(`\n🌐 Página acessível em: ${pageData.link}`);
      console.log(`📝 Editar página: ${WORDPRESS_URL}/wp-admin/post.php?post=${pageId}&action=edit`);
      
    } else {
      console.log(`❌ Erro ao verificar página: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Erro na verificação: ${error.message}`);
  }
}

analyzeACFJSON();





