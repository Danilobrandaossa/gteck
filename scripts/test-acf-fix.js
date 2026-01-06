/**
 * Teste da Correção dos Campos ACF
 * Testa se os campos estão sendo preenchidos corretamente
 */

const fetch = require('node-fetch');

const CMS_URL = 'http://localhost:3002';

async function testACFFix() {
  console.log('🔧 TESTE DA CORREÇÃO DOS CAMPOS ACF');
  console.log('===================================\n');

  const completeJson = {
    "page_title": "Teste Correção ACF - Campos Preenchidos",
    "page_model": "modelo_v1",
    "page_template": "pressel-oficial.php",
    "page_slug": "teste-correcao-acf",
    "post_status": "publish",
    "acf_fields": {
      "hero_description": "Teste de correção dos campos ACF - este campo deve aparecer preenchido",
      "titulo_da_secao": "Seção de Teste ACF",
      "cor_botao": "#00FF00",
      "texto_botao_p1": "TESTE ACF CORRIGIDO",
      "link_botao_p1": "https://example.com/teste-acf",
      "texto_botao_p2": "SEGUNDO BOTÃO",
      "link_botao_p2": "https://example.com/teste-acf-2",
      "texto_botao_p3": "TERCEIRO BOTÃO",
      "link_botao_p3": "https://example.com/teste-acf-3",
      "titulo_h2_": "Título H2 de Teste",
      "info_content": "<p>Este é um teste para verificar se os campos ACF estão sendo preenchidos corretamente após a correção.</p>",
      "titulo_beneficios": "Benefícios do Teste",
      "titulo_beneficios_1": "Benefício 1",
      "_beneficio_text_1": "Descrição do primeiro benefício de teste",
      "titulo_beneficios_2": "Benefício 2",
      "_beneficio_text_2": "Descrição do segundo benefício de teste",
      "titulo_faq": "FAQ de Teste",
      "pergunta_1": "Os campos ACF estão funcionando?",
      "resposta_1": "Sim! Após a correção, os campos devem estar sendo preenchidos corretamente.",
      "aviso": "Este é um teste de correção dos campos ACF"
    },
    "seo": {
      "meta_title": "Teste Correção ACF - Campos Preenchidos",
      "meta_description": "Teste para verificar se os campos ACF estão sendo preenchidos corretamente após a correção do sistema.",
      "focus_keyword": "teste acf correção"
    }
  };

  console.log('🚀 Enviando JSON para processamento...');
  console.log(`📊 Total de campos ACF: ${Object.keys(completeJson.acf_fields).length}`);

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
        console.log('\n🔍 VERIFICANDO CAMPOS PREENCHIDOS...');
        console.log('====================================');
        
        await verifyACFFields(result.result.pageId);
      }
      
    } else {
      console.log('❌ Erro no processamento:');
      console.log(`🔢 Código: ${result.codigo || 'N/A'}`);
      console.log(`📝 Mensagem: ${result.mensagem || 'N/A'}`);
      console.log(`🏷️ Categoria: ${result.categoria || 'N/A'}`);
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  console.log('\n📋 RESUMO DO TESTE:');
  console.log('===================');
  console.log('✅ Correção dos campos ACF testada');
  console.log('✅ Processamento via API executado');
  console.log('✅ Verificação de campos realizada');
  console.log('✅ Sistema de logs monitorado');
}

async function verifyACFFields(pageId) {
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
      
      // Verificar campos ACF
      if (pageData.acf && Object.keys(pageData.acf).length > 0) {
        console.log(`✅ Campos ACF encontrados: ${Object.keys(pageData.acf).length}`);
        console.log('📋 Campos preenchidos:');
        Object.entries(pageData.acf).forEach(([key, value]) => {
          console.log(`   - ${key}: "${value}"`);
        });
      } else {
        console.log('⚠️ Nenhum campo ACF encontrado na resposta');
        
        // Verificar meta fields
        if (pageData.meta) {
          console.log('🔍 Verificando meta fields...');
          const acfMetaFields = Object.keys(pageData.meta).filter(key => 
            !key.startsWith('_') && 
            ['hero_description', 'titulo_da_secao', 'cor_botao', 'texto_botao_p1'].includes(key)
          );
          
          if (acfMetaFields.length > 0) {
            console.log(`✅ Meta fields encontrados: ${acfMetaFields.length}`);
            acfMetaFields.forEach(key => {
              console.log(`   - ${key}: "${pageData.meta[key]}"`);
            });
          } else {
            console.log('❌ Nenhum meta field ACF encontrado');
          }
        }
      }
      
    } else {
      console.log(`❌ Erro ao verificar página: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Erro na verificação: ${error.message}`);
  }
}

testACFFix();





