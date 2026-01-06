/**
 * Script para testar diferentes tipos de autenticação WordPress
 */

const fetch = require('node-fetch');

const WORDPRESS_SITE = 'https://atlz.online/';

async function testWordPressAuth() {
  console.log('🔐 Testando Autenticação WordPress');
  console.log('==================================\n');

  // Teste 1: Verificar se o site WordPress está acessível
  console.log('[1] Verificando acessibilidade do site...');
  try {
    const response = await fetch(`${WORDPRESS_SITE}wp-json/`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Site WordPress acessível');
      console.log(`📝 Nome: ${data.name}`);
      console.log(`🔗 URL: ${data.url}`);
    } else {
      console.log(`❌ Site retornou status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Erro ao acessar site: ${error.message}`);
  }

  console.log('\n[2] Testando credenciais atuais...');
  
  // Teste 2: Credenciais atuais
  const currentAuth = Buffer.from('admin:admin123').toString('base64');
  try {
    const response = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Basic ${currentAuth}`
      }
    });
    
    if (response.ok) {
      const userData = await response.json();
      console.log('✅ Credenciais funcionando!');
      console.log(`👤 Usuário: ${userData.name} (${userData.slug})`);
      console.log(`🔑 Capacidades: ${userData.capabilities ? Object.keys(userData.capabilities).join(', ') : 'N/A'}`);
    } else {
      const errorData = await response.text();
      console.log(`❌ Credenciais não funcionam: ${response.status}`);
      console.log(`📝 Erro: ${errorData}`);
    }
  } catch (error) {
    console.log(`❌ Erro na autenticação: ${error.message}`);
  }

  console.log('\n[3] Testando criação de página...');
  
  // Teste 3: Tentar criar uma página
  try {
    const response = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${currentAuth}`
      },
      body: JSON.stringify({
        title: 'Teste CMS - ' + new Date().toISOString(),
        content: 'Página de teste criada pelo CMS',
        status: 'draft'
      })
    });
    
    if (response.ok) {
      const pageData = await response.json();
      console.log('✅ Página criada com sucesso!');
      console.log(`📄 ID: ${pageData.id}`);
      console.log(`🔗 URL: ${pageData.link}`);
    } else {
      const errorData = await response.text();
      console.log(`❌ Erro ao criar página: ${response.status}`);
      console.log(`📝 Erro: ${errorData}`);
      
      if (errorData.includes('rest_cannot_create')) {
        console.log('\n💡 SOLUÇÃO: O usuário não tem permissão para criar posts/páginas');
        console.log('   - Acesse: https://atlz.online/wp-admin/users.php');
        console.log('   - Verifique se o usuário "admin" tem papel "Editor" ou "Administrador"');
        console.log('   - Ou crie uma senha de aplicativo em: https://atlz.online/wp-admin/profile.php');
      }
    }
  } catch (error) {
    console.log(`❌ Erro ao criar página: ${error.message}`);
  }

  console.log('\n==================================');
  console.log('🎯 Próximos passos:');
  console.log('1. Verificar permissões do usuário no WordPress');
  console.log('2. Criar senha de aplicativo se necessário');
  console.log('3. Atualizar credenciais no .env.local');
}

testWordPressAuth();








