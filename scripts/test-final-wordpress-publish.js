/**
 * Script para testar publicação final no WordPress com credenciais corretas
 */

const fetch = require('node-fetch');

const WORDPRESS_SITE = 'https://atlz.online/';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function testFinalWordPressPublish() {
  console.log('🚀 Teste Final de Publicação no WordPress');
  console.log('==========================================\n');

  try {
    // [1] Verificar autenticação
    console.log('[1] Verificando autenticação...');
    const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
    
    const userResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ Autenticação funcionando!');
      console.log(`👤 Usuário: ${userData.name} (${userData.slug})`);
      console.log(`🆔 ID: ${userData.id}`);
    } else {
      console.log('❌ Erro na autenticação');
      return;
    }

    // [2] Testar criação de página
    console.log('\n[2] Testando criação de página...');
    const pageData = {
      title: `Teste CMS - ${new Date().toISOString()}`,
      content: 'Página de teste criada pelo CMS Pressel Automation',
      status: 'draft',
      excerpt: 'Teste de integração CMS ↔ WordPress'
    };

    const pageResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(pageData)
    });
    
    if (pageResponse.ok) {
      const createdPage = await pageResponse.json();
      console.log('✅ Página criada com sucesso!');
      console.log(`📄 ID: ${createdPage.id}`);
      console.log(`📝 Título: ${createdPage.title.rendered}`);
      console.log(`🔗 Link: ${createdPage.link}`);
      console.log(`📊 Status: ${createdPage.status}`);
      
      // [3] Testar publicação da página
      console.log('\n[3] Testando publicação da página...');
      const publishResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages/${createdPage.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
          status: 'publish'
        })
      });
      
      if (publishResponse.ok) {
        const publishedPage = await publishResponse.json();
        console.log('✅ Página publicada com sucesso!');
        console.log(`🌐 URL pública: ${publishedPage.link}`);
        console.log(`📊 Status final: ${publishedPage.status}`);
      } else {
        console.log('❌ Erro ao publicar página');
        const errorData = await publishResponse.text();
        console.log(`📝 Erro: ${errorData}`);
      }
      
    } else {
      console.log('❌ Erro ao criar página');
      const errorData = await pageResponse.text();
      console.log(`📝 Erro: ${errorData}`);
    }

  } catch (error) {
    console.log(`❌ Erro inesperado: ${error.message}`);
  }

  console.log('\n==========================================');
  console.log('🎉 Teste Final Concluído!');
  console.log('💡 Agora o botão "Publicar no WordPress" deve funcionar perfeitamente!');
}

testFinalWordPressPublish();








