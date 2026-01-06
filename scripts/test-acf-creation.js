/**
 * Teste de Criação e Salvamento de Campos ACF
 * Cria uma nova página e testa o salvamento de campos ACF
 */

const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://atlz.online';

async function testAcfCreationAndSaving() {
  console.log('🔧 TESTE DE CRIAÇÃO E SALVAMENTO DE CAMPOS ACF');
  console.log('==============================================\n');

  const username = process.env.WORDPRESS_DEFAULT_USERNAME || 'danilobrandao';
  const password = process.env.WORDPRESS_DEFAULT_PASSWORD || 'Zy598859D@n';
  
  console.log(`🔐 Usando credenciais: ${username}`);
  
  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  
  // Dados para criar uma nova página
  const pageData = {
    title: 'Teste ACF - ' + new Date().toISOString(),
    content: 'Página de teste para campos ACF',
    status: 'publish',
    slug: 'teste-acf-' + Date.now()
  };

  console.log('📋 Dados da página:');
  console.log(`   Título: ${pageData.title}`);
  console.log(`   Slug: ${pageData.slug}`);
  console.log(`   Status: ${pageData.status}`);

  // Campos ACF para teste
  const testAcfFields = {
    'hero_description': 'Descrição do hero para teste',
    'titulo_da_secao': 'Seção de Teste ACF',
    'cor_botao': '#00FF00',
    'texto_botao_p1': 'TESTE ACF',
    'link_botao_p1': 'https://example.com/acf-test'
  };

  console.log('\n📋 Campos ACF para teste:');
  Object.entries(testAcfFields).forEach(([field, value]) => {
    console.log(`   ${field}: ${value}`);
  });

  console.log('\n1️⃣ CRIANDO NOVA PÁGINA:');
  console.log('========================');
  
  try {
    const createResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(pageData)
    });

    console.log(`📊 Status: ${createResponse.status} ${createResponse.statusText}`);
    
    if (createResponse.ok) {
      const createdPage = await createResponse.json();
      console.log('✅ Página criada com sucesso!');
      console.log(`📝 ID: ${createdPage.id}`);
      console.log(`🔗 URL: ${createdPage.link}`);
      
      const pageId = createdPage.id;
      
      console.log('\n2️⃣ TESTANDO SALVAMENTO DE CAMPOS ACF:');
      console.log('=====================================');
      
      // Tentar salvar campos ACF via meta
      try {
        const metaResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/${pageId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
          },
          body: JSON.stringify({ meta: testAcfFields })
        });

        console.log(`📊 Status Meta: ${metaResponse.status} ${metaResponse.statusText}`);
        
        if (metaResponse.ok) {
          const metaData = await metaResponse.json();
          console.log('✅ Campos salvos via Meta API!');
          console.log('📋 Meta fields salvos:', Object.keys(testAcfFields));
        } else {
          const errorData = await metaResponse.json();
          console.log('❌ Erro Meta API:', errorData);
        }
        
      } catch (error) {
        console.log('❌ Erro Meta API:', error.message);
      }

      // Tentar salvar campos ACF via propriedade acf
      try {
        const acfResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/${pageId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
          },
          body: JSON.stringify({ acf: testAcfFields })
        });

        console.log(`📊 Status ACF: ${acfResponse.status} ${acfResponse.statusText}`);
        
        if (acfResponse.ok) {
          const acfData = await acfResponse.json();
          console.log('✅ Campos salvos via ACF API!');
          console.log('📋 Campos ACF salvos:', Object.keys(testAcfFields));
        } else {
          const errorData = await acfResponse.json();
          console.log('❌ Erro ACF API:', errorData);
        }
        
      } catch (error) {
        console.log('❌ Erro ACF API:', error.message);
      }

      console.log('\n3️⃣ VERIFICANDO CAMPOS SALVOS:');
      console.log('==============================');
      
      // Verificar se os campos foram salvos
      try {
        const checkResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/${pageId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (checkResponse.ok) {
          const pageData = await checkResponse.json();
          
          console.log('📋 Campos ACF encontrados:');
          if (pageData.acf && Object.keys(pageData.acf).length > 0) {
            Object.entries(pageData.acf).forEach(([field, value]) => {
              console.log(`   ✅ ${field}: ${value}`);
            });
          } else {
            console.log('   ❌ Nenhum campo ACF encontrado');
          }
          
          console.log('\n📋 Meta fields encontrados:');
          if (pageData.meta && Object.keys(pageData.meta).length > 0) {
            let foundMetaFields = 0;
            Object.entries(pageData.meta).forEach(([field, value]) => {
              if (testAcfFields.hasOwnProperty(field)) {
                console.log(`   ✅ ${field}: ${value}`);
                foundMetaFields++;
              }
            });
            
            if (foundMetaFields === 0) {
              console.log('   ❌ Nenhum meta field relevante encontrado');
            } else {
              console.log(`   📊 Total de meta fields encontrados: ${foundMetaFields}`);
            }
          } else {
            console.log('   ❌ Nenhum meta field encontrado');
          }
          
        } else {
          console.log('❌ Erro ao verificar página:', checkResponse.status);
        }
        
      } catch (error) {
        console.log('❌ Erro ao verificar campos:', error.message);
      }
      
    } else {
      const errorData = await createResponse.json();
      console.log('❌ Erro ao criar página:', errorData);
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  console.log('\n🚀 PRÓXIMOS PASSOS:');
  console.log('===================');
  console.log('1. ✅ Identificar qual método funciona');
  console.log('2. ✅ Ajustar o código do Pressel Automation');
  console.log('3. ✅ Testar com o JSON completo');
  console.log('4. ✅ Validar publicação completa');
  console.log('5. ✅ Otimizar taxa de sucesso para 100%');
}

testAcfCreationAndSaving();





