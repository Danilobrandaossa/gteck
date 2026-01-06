/**
 * Script para verificar se a página foi criada no WordPress
 */

const fs = require('fs');
const path = require('path');

// Usar fetch
let fetch;
try {
  fetch = require('node-fetch');
} catch (e) {
  console.log('❌ node-fetch não encontrado');
  process.exit(1);
}

const WORDPRESS_SITE = 'https://atlz.online/';

async function checkWordPressPage() {
  console.log('🔍 Verificando Página no WordPress');
  console.log('==================================\n');

  try {
    // [1] Verificar se o site WordPress está acessível
    console.log('[1] Verificando acessibilidade do site...');
    const siteResponse = await fetch(WORDPRESS_SITE);
    
    if (siteResponse.ok) {
      console.log('✅ Site WordPress está acessível');
    } else {
      console.log(`❌ Site retornou status: ${siteResponse.status}`);
      return;
    }

    // [2] Verificar API REST do WordPress
    console.log('\n[2] Verificando API REST do WordPress...');
    const apiResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/`);
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('✅ API REST do WordPress está funcionando');
      console.log(`📝 Nome do site: ${apiData.name || 'N/A'}`);
      console.log(`🔗 URL: ${apiData.url || 'N/A'}`);
    } else {
      console.log(`❌ API REST retornou status: ${apiResponse.status}`);
    }

    // [3] Listar páginas recentes
    console.log('\n[3] Listando páginas recentes...');
    const pagesResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages?per_page=5&orderby=date&order=desc`);
    
    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      console.log(`✅ Encontradas ${pagesData.length} páginas recentes:`);
      
      pagesData.forEach((page, index) => {
        console.log(`\n📄 Página ${index + 1}:`);
        console.log(`   ID: ${page.id}`);
        console.log(`   Título: ${page.title.rendered}`);
        console.log(`   Status: ${page.status}`);
        console.log(`   Data: ${page.date}`);
        console.log(`   Link: ${page.link}`);
        console.log(`   Slug: ${page.slug}`);
      });
    } else {
      console.log(`❌ Erro ao listar páginas: ${pagesResponse.status}`);
    }

    // [4] Procurar por páginas com "figurinhas" ou "aplicativo"
    console.log('\n[4] Procurando páginas relacionadas...');
    const searchResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages?search=figurinhas`);
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`🔍 Encontradas ${searchData.length} páginas com "figurinhas":`);
      
      searchData.forEach((page, index) => {
        console.log(`\n📄 Página ${index + 1}:`);
        console.log(`   Título: ${page.title.rendered}`);
        console.log(`   Link: ${page.link}`);
        console.log(`   Status: ${page.status}`);
      });
    }

    // [5] Verificar se há páginas criadas hoje
    console.log('\n[5] Verificando páginas criadas hoje...');
    const today = new Date().toISOString().split('T')[0];
    const todayResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages?after=${today}T00:00:00`);
    
    if (todayResponse.ok) {
      const todayData = await todayResponse.json();
      console.log(`📅 Encontradas ${todayData.length} páginas criadas hoje:`);
      
      todayData.forEach((page, index) => {
        console.log(`\n📄 Página ${index + 1}:`);
        console.log(`   Título: ${page.title.rendered}`);
        console.log(`   Link: ${page.link}`);
        console.log(`   Data: ${page.date}`);
      });
    }

  } catch (error) {
    console.log(`❌ Erro inesperado: ${error.message}`);
  }

  console.log('\n==================================');
  console.log('🎉 Verificação concluída!');
}

checkWordPressPage();








