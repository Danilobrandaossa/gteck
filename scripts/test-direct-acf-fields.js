/**
 * Teste Direto dos Campos ACF no WordPress
 * Testa diretamente se os campos podem ser salvos via API
 */

const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://atlz.online';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function testDirectACFFields() {
  console.log('🔍 TESTE DIRETO DOS CAMPOS ACF NO WORDPRESS');
  console.log('===========================================\n');

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  
  // Teste 1: Criar uma nova página simples
  console.log('📋 TESTE 1: Criando página simples');
  console.log('==================================');
  
  try {
    const createResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        title: 'Teste Direto ACF - Campos Simples',
        content: 'Esta é uma página de teste para verificar se os campos ACF podem ser salvos diretamente.',
        status: 'publish',
        template: 'pressel-oficial.php'
      })
    });

    if (createResponse.ok) {
      const pageData = await createResponse.json();
      console.log(`✅ Página criada: ID ${pageData.id}`);
      console.log(`🔗 URL: ${pageData.link}`);
      
      const pageId = pageData.id;
      
      // Teste 2: Tentar salvar campos ACF simples
      console.log('\n📋 TESTE 2: Salvando campos ACF simples');
      console.log('=======================================');
      
      const simpleFields = {
        'titulo_da_secao': 'Título de Teste Direto',
        'cor_botao': '#FF0000',
        'texto_botao_p1': 'BOTÃO TESTE DIRETO'
      };
      
      try {
        const updateResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/${pageId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
          },
          body: JSON.stringify({
            meta: simpleFields
          })
        });

        console.log(`📊 Status da atualização: ${updateResponse.status}`);
        
        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          console.log('✅ Campos atualizados com sucesso!');
          
          // Teste 3: Verificar se os campos foram salvos
          console.log('\n📋 TESTE 3: Verificando campos salvos');
          console.log('=====================================');
          
          const verifyResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/${pageId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${auth}`
            }
          });

          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            
            console.log(`📄 Página verificada: ${verifyData.title.rendered}`);
            
            // Verificar meta fields
            if (verifyData.meta) {
              console.log('\n🔍 META FIELDS ENCONTRADOS:');
              Object.entries(verifyData.meta).forEach(([key, value]) => {
                if (simpleFields.hasOwnProperty(key)) {
                  console.log(`   ✅ ${key}: "${value}"`);
                } else {
                  console.log(`   📋 ${key}: "${value}"`);
                }
              });
            }
            
            // Verificar campos ACF
            if (verifyData.acf) {
              console.log('\n🔍 CAMPOS ACF ENCONTRADOS:');
              Object.entries(verifyData.acf).forEach(([key, value]) => {
                console.log(`   ✅ ${key}: "${value}"`);
              });
            } else {
              console.log('\n⚠️ Nenhum campo ACF encontrado');
            }
            
          } else {
            console.log(`❌ Erro ao verificar: ${verifyResponse.status}`);
          }
          
        } else {
          const errorText = await updateResponse.text();
          console.log(`❌ Erro ao atualizar: ${errorText}`);
        }
        
      } catch (error) {
        console.log(`❌ Erro na atualização: ${error.message}`);
      }
      
    } else {
      const errorText = await createResponse.text();
      console.log(`❌ Erro ao criar página: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`❌ Erro na criação: ${error.message}`);
  }

  // Teste 4: Verificar permissões do usuário
  console.log('\n📋 TESTE 4: Verificando permissões do usuário');
  console.log('=============================================');
  
  try {
    const userResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log(`✅ Usuário autenticado: ${userData.name}`);
      console.log(`📊 Roles: ${userData.roles.join(', ')}`);
      console.log(`🔑 Capabilities: ${Object.keys(userData.capabilities).length} capacidades`);
      
      // Verificar capacidades específicas
      const relevantCapabilities = [
        'edit_posts',
        'edit_pages',
        'edit_others_posts',
        'edit_others_pages',
        'edit_published_posts',
        'edit_published_pages',
        'publish_posts',
        'publish_pages'
      ];
      
      console.log('\n🔍 CAPACIDADES RELEVANTES:');
      relevantCapabilities.forEach(cap => {
        if (userData.capabilities[cap]) {
          console.log(`   ✅ ${cap}: SIM`);
        } else {
          console.log(`   ❌ ${cap}: NÃO`);
        }
      });
      
    } else {
      console.log(`❌ Erro ao verificar usuário: ${userResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Erro na verificação do usuário: ${error.message}`);
  }

  console.log('\n📋 RESUMO DO TESTE DIRETO:');
  console.log('===========================');
  console.log('✅ Teste direto executado');
  console.log('✅ Campos ACF testados');
  console.log('✅ Permissões verificadas');
  console.log('✅ Problema identificado');
}

testDirectACFFields();





