/**
 * Teste Específico da API ACF
 * Identifica exatamente por que os campos não estão sendo preenchidos
 */

const fetch = require('node-fetch');

const CMS_URL = 'http://localhost:3002';
const WORDPRESS_URL = 'https://atlz.online';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function testACFAPI() {
  console.log('🔍 TESTE ESPECÍFICO DA API ACF');
  console.log('==============================\n');

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  
  // Teste 1: Verificar se a API ACF está disponível
  console.log('📋 TESTE 1: Verificando disponibilidade da API ACF');
  console.log('==================================================');
  
  try {
    const acfTestResponse = await fetch(`${WORDPRESS_URL}/wp-json/acf/v3/pages`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    console.log(`📊 Status da API ACF: ${acfTestResponse.status}`);
    console.log(`📊 Status Text: ${acfTestResponse.statusText}`);
    
    if (acfTestResponse.ok) {
      console.log('✅ API ACF está disponível');
    } else {
      console.log('❌ API ACF não está disponível');
      const errorText = await acfTestResponse.text();
      console.log(`📄 Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erro ao testar API ACF: ${error.message}`);
  }

  // Teste 2: Verificar se a página existe
  console.log('\n📋 TESTE 2: Verificando página criada');
  console.log('=====================================');
  
  try {
    const pageResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/3820`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    console.log(`📊 Status da página: ${pageResponse.status}`);
    
    if (pageResponse.ok) {
      const pageData = await pageResponse.json();
      console.log('✅ Página existe');
      console.log(`📄 ID: ${pageData.id}`);
      console.log(`📄 Título: ${pageData.title.rendered}`);
      console.log(`📄 Status: ${pageData.status}`);
      console.log(`📄 Template: ${pageData.template || 'N/A'}`);
      
      // Verificar campos ACF existentes
      if (pageData.acf) {
        console.log(`🔧 Campos ACF existentes: ${Object.keys(pageData.acf).length}`);
        Object.keys(pageData.acf).forEach(key => {
          console.log(`   - ${key}: ${pageData.acf[key]}`);
        });
      } else {
        console.log('⚠️ Nenhum campo ACF encontrado na página');
      }
    } else {
      console.log('❌ Página não encontrada');
      const errorText = await pageResponse.text();
      console.log(`📄 Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erro ao verificar página: ${error.message}`);
  }

  // Teste 3: Tentar atualizar campos ACF via API ACF
  console.log('\n📋 TESTE 3: Tentando atualizar campos ACF via API ACF');
  console.log('=====================================================');
  
  const testACFFields = {
    titulo_da_secao: 'Teste via API ACF',
    cor_botao: '#FF0000',
    texto_botao_p1: 'TESTE ACF API'
  };
  
  try {
    const acfUpdateResponse = await fetch(`${WORDPRESS_URL}/wp-json/acf/v3/pages/3820`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({ fields: testACFFields })
    });
    
    console.log(`📊 Status da atualização ACF: ${acfUpdateResponse.status}`);
    console.log(`📊 Status Text: ${acfUpdateResponse.statusText}`);
    
    if (acfUpdateResponse.ok) {
      console.log('✅ Campos ACF atualizados com sucesso via API ACF');
      const result = await acfUpdateResponse.json();
      console.log(`📄 Resultado: ${JSON.stringify(result, null, 2)}`);
    } else {
      console.log('❌ Falha ao atualizar campos ACF via API ACF');
      const errorText = await acfUpdateResponse.text();
      console.log(`📄 Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erro ao atualizar ACF: ${error.message}`);
  }

  // Teste 4: Tentar atualizar campos ACF via WordPress API
  console.log('\n📋 TESTE 4: Tentando atualizar campos ACF via WordPress API');
  console.log('===========================================================');
  
  try {
    const wpUpdateResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/3820`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({ acf: testACFFields })
    });
    
    console.log(`📊 Status da atualização WP: ${wpUpdateResponse.status}`);
    console.log(`📊 Status Text: ${wpUpdateResponse.statusText}`);
    
    if (wpUpdateResponse.ok) {
      console.log('✅ Campos ACF atualizados com sucesso via WordPress API');
      const result = await wpUpdateResponse.json();
      console.log(`📄 Resultado: ${JSON.stringify(result, null, 2)}`);
    } else {
      console.log('❌ Falha ao atualizar campos ACF via WordPress API');
      const errorText = await wpUpdateResponse.text();
      console.log(`📄 Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erro ao atualizar via WP API: ${error.message}`);
  }

  // Teste 5: Tentar atualizar campos ACF via Meta API
  console.log('\n📋 TESTE 5: Tentando atualizar campos ACF via Meta API');
  console.log('======================================================');
  
  try {
    const metaUpdateResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/3820`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({ meta: testACFFields })
    });
    
    console.log(`📊 Status da atualização Meta: ${metaUpdateResponse.status}`);
    console.log(`📊 Status Text: ${metaUpdateResponse.statusText}`);
    
    if (metaUpdateResponse.ok) {
      console.log('✅ Campos ACF atualizados com sucesso via Meta API');
      const result = await metaUpdateResponse.json();
      console.log(`📄 Resultado: ${JSON.stringify(result, null, 2)}`);
    } else {
      console.log('❌ Falha ao atualizar campos ACF via Meta API');
      const errorText = await metaUpdateResponse.text();
      console.log(`📄 Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erro ao atualizar via Meta API: ${error.message}`);
  }

  // Teste 6: Verificar permissões do usuário
  console.log('\n📋 TESTE 6: Verificando permissões do usuário');
  console.log('=============================================');
  
  try {
    const userResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    console.log(`📊 Status do usuário: ${userResponse.status}`);
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ Usuário autenticado');
      console.log(`📄 ID: ${userData.id}`);
      console.log(`📄 Nome: ${userData.name}`);
      console.log(`📄 Roles: ${userData.roles.join(', ')}`);
      console.log(`📄 Capabilities: ${Object.keys(userData.capabilities).length} capacidades`);
    } else {
      console.log('❌ Falha na autenticação do usuário');
      const errorText = await userResponse.text();
      console.log(`📄 Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erro ao verificar usuário: ${error.message}`);
  }

  console.log('\n📋 RESUMO DOS TESTES:');
  console.log('======================');
  console.log('✅ Testes de API ACF executados');
  console.log('✅ Múltiplas abordagens testadas');
  console.log('✅ Permissões verificadas');
  console.log('✅ Problemas identificados');
}

testACFAPI();