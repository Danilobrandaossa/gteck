/**
 * Script para testar criação completa da página V4 e verificar campos
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const WORDPRESS_URL = 'https://atlz.online';
const JSON_FILE = path.join(__dirname, '..', 'uploads', 'pressel-models', 'V4', 'yarnpal-completo-v4.json');

async function testV4Complete() {
  console.log('🧪 TESTE COMPLETO: MODELO V4');
  console.log('================================\n');

  // Ler o JSON
  const jsonData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  
  console.log('📋 DADOS DO JSON:');
  console.log(`   Título: ${jsonData.page_title}`);
  console.log(`   Modelo: ${jsonData.page_model}`);
  console.log(`   Slug: ${jsonData.page_slug}`);
  console.log(`   Campos ACF: ${Object.keys(jsonData.acf_fields).length}`);
  console.log(`   Benefits: ${jsonData.acf_fields.benefits?.length || 0}`);
  console.log(`   FAQs: ${jsonData.acf_fields.faqs?.length || 0}`);
  
  console.log('\n🚀 CRIANDO PÁGINA NO WORDPRESS...');
  console.log('==================================\n');
  
  try {
    // Passo 1: Criar página
    const response = await fetch('http://localhost:3002/api/pressel/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonData: jsonData,
        siteUrl: WORDPRESS_URL,
        options: {
          publish: true,
          addSeo: true,
          addAcfFields: true,
          notifyOnComplete: true
        },
        testMode: false
      })
    });

    const result = await response.json();
    
    console.log(`📊 STATUS: ${response.status}`);
    
    if (response.ok && result.success) {
      const pageId = result.result?.pageId;
      const pageUrl = result.result?.pageUrl;
      
      console.log('\n✅ PÁGINA CRIADA!');
      console.log(`   ID: ${pageId}`);
      console.log(`   URL: ${pageUrl}`);
      console.log(`   Modelo detectado: ${result.detectedModel?.modelName}`);
      console.log(`   Template: ${result.detectedModel?.template}`);
      
      // Passo 2: Verificar página no WordPress via API Next.js
      console.log('\n🔍 VERIFICANDO PÁGINA NO WORDPRESS...');
      console.log('====================================\n');
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar processamento
      await verifyPageViaAPI(pageId, WORDPRESS_URL);
      
      console.log('\n🎉 PROCESSO CONCLUÍDO!');
      
    } else {
      console.log('\n❌ ERRO:');
      console.log(result.error || result.message || 'Erro desconhecido');
    }
  } catch (error) {
    console.log(`\n❌ ERRO DE CONEXÃO: ${error.message}`);
  }
}

async function verifyPageViaAPI(pageId, siteUrl) {
  try {
    const response = await fetch(`http://localhost:3002/api/pressel/verify-page?id=${pageId}&siteUrl=${encodeURIComponent(siteUrl)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ Erro ao verificar: ${response.status}`);
      console.log(`\n📋 Verifique manualmente: ${siteUrl}/wp-admin/post.php?post=${pageId}&action=edit`);
      return;
    }
    
    const data = await response.json();
    exibirResultadoVerificacao(data);
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    console.log(`\n📋 Verifique manualmente: ${siteUrl}/wp-admin/post.php?post=${pageId}&action=edit`);
  }
}

function exibirResultadoVerificacao(data) {
  
  try {
    // Buscar página com contexto edit (inclui meta fields)
    const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/${pageId}?context=edit`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (!response.ok) {
      console.log(`❌ Erro ao buscar página: ${response.status}`);
      return;
    }
    
    const pageData = await response.json();
    
    // Verificar template
    console.log('📄 TEMPLATE:');
    const template = pageData.meta?._wp_page_template || pageData.page_template || 'padrão';
    console.log(`   Template aplicado: ${template}`);
    
    if (template === 'V4.php' || template.includes('V4')) {
      console.log('   ✅ Template V4 correto!');
    } else {
      console.log('   ⚠️ Template pode estar incorreto');
    }
    
    // Verificar campos ACF principais
    console.log('\n📋 CAMPOS ACF VERIFICADOS:');
    
    const acfFields = originalJson.acf_fields;
    const metaFields = pageData.meta || {};
    
    const fieldsToCheck = [
      'idioma_footer',
      'title_h1',
      'sub_title',
      'download_button_text',
      'download_button_url',
      'disclaimer',
      'description',
      'benefits_title',
      'faq_title'
    ];
    
    let filledCount = 0;
    let missingCount = 0;
    
    for (const field of fieldsToCheck) {
      const value = metaFields[field];
      const originalValue = acfFields[field];
      
      if (value && value !== '' && value !== null && value !== '[]') {
        console.log(`   ✅ ${field}: ${String(value).substring(0, 50)}${String(value).length > 50 ? '...' : ''}`);
        filledCount++;
      } else if (originalValue && originalValue !== '' && originalValue !== null) {
        console.log(`   ❌ ${field}: NÃO PREENCHIDO (esperado: ${String(originalValue).substring(0, 30)}...)`);
        missingCount++;
      } else {
        console.log(`   ⚪ ${field}: vazio (opcional)`);
      }
    }
    
    // Verificar repeaters
    console.log('\n📊 REPEATERS:');
    
    // Benefits
    const benefitsCount = metaFields.benefits || '0';
    const benefitsFound = [];
    for (let i = 0; i < 10; i++) {
      const benefitField = `benefits_${i}_benefit_text`;
      if (metaFields[benefitField]) {
        benefitsFound.push(metaFields[benefitField]);
      }
    }
    
    console.log(`   Benefits: ${benefitsCount} itens esperados, ${benefitsFound.length} encontrados`);
    if (benefitsFound.length > 0) {
      console.log(`   ✅ Benefits salvos corretamente`);
      benefitsFound.forEach((b, i) => {
        console.log(`      ${i + 1}. ${b.substring(0, 50)}${b.length > 50 ? '...' : ''}`);
      });
    } else if (acfFields.benefits?.length > 0) {
      console.log(`   ❌ Benefits NÃO foram salvos`);
    }
    
    // FAQs
    const faqsCount = metaFields.faqs || '0';
    const faqsFound = [];
    for (let i = 0; i < 10; i++) {
      const question = metaFields[`faqs_${i}_question`];
      const answer = metaFields[`faqs_${i}_answer`];
      if (question && answer) {
        faqsFound.push({ question, answer });
      }
    }
    
    console.log(`   FAQs: ${faqsCount} itens esperados, ${faqsFound.length} encontrados`);
    if (faqsFound.length > 0) {
      console.log(`   ✅ FAQs salvos corretamente`);
      faqsFound.forEach((f, i) => {
        console.log(`      ${i + 1}. Q: ${f.question.substring(0, 40)}...`);
        console.log(`         A: ${f.answer.substring(0, 40)}...`);
      });
    } else if (acfFields.faqs?.length > 0) {
      console.log(`   ❌ FAQs NÃO foram salvos`);
    }
    
    // Resumo
    console.log('\n📊 RESUMO DA VERIFICAÇÃO:');
    console.log(`   Campos preenchidos: ${filledCount}/${fieldsToCheck.length}`);
    console.log(`   Campos faltando: ${missingCount}`);
    console.log(`   Benefits salvos: ${benefitsFound.length}/${acfFields.benefits?.length || 0}`);
    console.log(`   FAQs salvos: ${faqsFound.length}/${acfFields.faqs?.length || 0}`);
    console.log(`   Template aplicado: ${template}`);
    
    if (filledCount >= 5 && benefitsFound.length > 0 && faqsFound.length > 0 && template.includes('V4')) {
      console.log('\n✅ VERIFICAÇÃO: TUDO OK!');
    } else {
      console.log('\n⚠️ VERIFICAÇÃO: Alguns itens podem estar faltando');
    }
    
    console.log(`\n🔗 Link para editar: ${WORDPRESS_URL}/wp-admin/post.php?post=${pageId}&action=edit`);
    console.log(`🔗 Link para visualizar: ${pageData.link || 'N/A'}`);
    
  } catch (error) {
    console.log(`❌ Erro ao verificar página: ${error.message}`);
  }
}

testV4Complete();

