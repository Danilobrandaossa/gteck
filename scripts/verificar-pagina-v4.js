/**
 * Script para verificar página V4 criada e campos ACF
 */

const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://atlz.online';
const PAGE_ID = 3953; // Última página criada

async function verificarPagina() {
  console.log('🔍 VERIFICAÇÃO DA PÁGINA V4');
  console.log('============================\n');
  console.log(`📄 Página ID: ${PAGE_ID}`);
  console.log(`🌐 URL: ${WORDPRESS_URL}/wp-admin/post.php?post=${PAGE_ID}&action=edit\n`);
  
  try {
    // Buscar dados da página via API do Next.js (usa credenciais do servidor)
    const response = await fetch(`http://localhost:3002/api/pressel/verify-page?id=${PAGE_ID}&siteUrl=${encodeURIComponent(WORDPRESS_URL)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      exibirResultado(result);
    } else {
      console.log('❌ Erro ao verificar via API Next.js');
      console.log('📋 Verifique manualmente no WordPress Admin:\n');
      console.log(`   ${WORDPRESS_URL}/wp-admin/post.php?post=${PAGE_ID}&action=edit\n`);
      console.log('🔍 Verifique:');
      console.log('   1. Template selecionado: "Pressel V4" ou "V4.php"');
      console.log('   2. Campos ACF preenchidos na aba de edição');
      console.log('   3. Benefits repeater com 5 itens');
      console.log('   4. FAQs repeater com 5 itens');
    }
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    console.log('\n📋 Verifique manualmente no WordPress:\n');
    console.log(`   ${WORDPRESS_URL}/wp-admin/post.php?post=${PAGE_ID}&action=edit\n`);
  }
}

function exibirResultado(data) {
  console.log('📊 RESULTADO DA VERIFICAÇÃO:');
  console.log('============================\n');
  
  if (data.template) {
    console.log('📄 TEMPLATE:');
    console.log(`   ${data.template}`);
    if (data.template.includes('V4')) {
      console.log('   ✅ Template V4 correto!');
    } else {
      console.log('   ⚠️ Template pode estar incorreto');
    }
  }
  
  if (data.acfFields) {
    console.log('\n📋 CAMPOS ACF:');
    const fields = Object.keys(data.acfFields);
    const filled = fields.filter(f => data.acfFields[f] && data.acfFields[f] !== '' && data.acfFields[f] !== '[]' && data.acfFields[f] !== '0');
    
    console.log(`   Total de campos: ${fields.length}`);
    console.log(`   Campos preenchidos: ${filled.length}`);
    
    console.log('\n   Campos principais:');
    ['idioma_footer', 'title_h1', 'sub_title', 'download_button_text', 'disclaimer', 'benefits_title', 'faq_title'].forEach(field => {
      const value = data.acfFields[field];
      if (value) {
        const preview = String(value).substring(0, 50);
        console.log(`   ✅ ${field}: ${preview}${String(value).length > 50 ? '...' : ''}`);
      } else {
        console.log(`   ❌ ${field}: NÃO PREENCHIDO`);
      }
    });
  }
  
  if (data.benefits) {
    console.log(`\n📊 BENEFITS: ${data.benefits.length} itens`);
    data.benefits.forEach((b, i) => {
      console.log(`   ${i + 1}. ${b.substring(0, 60)}${b.length > 60 ? '...' : ''}`);
    });
  }
  
  if (data.faqs) {
    console.log(`\n❓ FAQS: ${data.faqs.length} itens`);
    data.faqs.forEach((f, i) => {
      console.log(`   ${i + 1}. Q: ${f.question.substring(0, 50)}...`);
      console.log(`      A: ${f.answer.substring(0, 50)}...`);
    });
  }
  
  console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');
}

verificarPagina();



