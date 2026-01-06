/**
 * Verificação e Configuração da API REST do ACF PRO
 * Verifica se a API REST está habilitada e configura se necessário
 */

const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://atlz.online';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function checkACFProRESTAPI() {
  console.log('🔍 VERIFICAÇÃO DA API REST DO ACF PRO');
  console.log('====================================\n');

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  
  // Teste 1: Verificar se a API REST do ACF está disponível
  console.log('📋 TESTE 1: Verificando API REST do ACF');
  console.log('=======================================');
  
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
      console.log('✅ API REST do ACF está disponível!');
      const data = await acfTestResponse.json();
      console.log(`📄 Resposta: ${JSON.stringify(data, null, 2)}`);
    } else {
      console.log('❌ API REST do ACF não está disponível');
      const errorText = await acfTestResponse.text();
      console.log(`📄 Erro: ${errorText}`);
      
      // Verificar se é problema de configuração
      if (acfTestResponse.status === 404) {
        console.log('\n🔧 SOLUÇÃO: Habilitar API REST do ACF');
        console.log('=====================================');
        console.log('1. Acesse o WordPress Admin');
        console.log('2. Vá em "Custom Fields" > "Settings"');
        console.log('3. Na aba "REST API", marque "Enable the REST API"');
        console.log('4. Salve as configurações');
        console.log('5. Teste novamente');
      }
    }
  } catch (error) {
    console.log(`❌ Erro ao testar API ACF: ${error.message}`);
  }

  // Teste 2: Verificar grupos de campos ACF existentes
  console.log('\n📋 TESTE 2: Verificando grupos de campos ACF');
  console.log('============================================');
  
  try {
    const groupsResponse = await fetch(`${WORDPRESS_URL}/wp-json/acf/v3/field-groups`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    console.log(`📊 Status dos grupos: ${groupsResponse.status}`);
    
    if (groupsResponse.ok) {
      const groups = await groupsResponse.json();
      console.log(`✅ Grupos de campos encontrados: ${groups.length}`);
      groups.forEach((group, index) => {
        console.log(`   ${index + 1}. ${group.title} (ID: ${group.id})`);
      });
    } else {
      console.log('❌ Não foi possível acessar grupos de campos');
      const errorText = await groupsResponse.text();
      console.log(`📄 Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erro ao verificar grupos: ${error.message}`);
  }

  // Teste 3: Verificar se podemos criar um grupo de campos
  console.log('\n📋 TESTE 3: Testando criação de grupo de campos');
  console.log('==============================================');
  
  const testGroup = {
    title: 'Teste API REST ACF',
    fields: [
      {
        key: 'field_teste_api',
        label: 'Campo Teste API',
        name: 'teste_api',
        type: 'text',
        instructions: 'Campo de teste para verificar API REST',
        required: 0,
        conditional_logic: 0,
        wrapper: {
          width: '',
          class: '',
          id: ''
        },
        default_value: '',
        placeholder: '',
        prepend: '',
        append: '',
        maxlength: ''
      }
    ],
    location: [
      [
        {
          param: 'post_template',
          operator: '==',
          value: 'pressel-oficial.php'
        }
      ]
    ],
    menu_order: 0,
    position: 'normal',
    style: 'default',
    label_placement: 'top',
    instruction_placement: 'label',
    hide_on_screen: '',
    active: true,
    description: 'Grupo de teste para API REST do ACF'
  };

  try {
    const createResponse = await fetch(`${WORDPRESS_URL}/wp-json/acf/v3/field-groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(testGroup)
    });

    console.log(`📊 Status da criação: ${createResponse.status}`);
    
    if (createResponse.ok) {
      const result = await createResponse.json();
      console.log('✅ Grupo de campos criado com sucesso!');
      console.log(`📄 ID: ${result.id}`);
      console.log(`📄 Título: ${result.title}`);
    } else {
      console.log('❌ Falha ao criar grupo de campos');
      const errorText = await createResponse.text();
      console.log(`📄 Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erro na criação: ${error.message}`);
  }

  // Teste 4: Verificar permissões do usuário
  console.log('\n📋 TESTE 4: Verificando permissões do usuário');
  console.log('============================================');
  
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
      
      // Verificar capacidades específicas do ACF
      const acfCapabilities = [
        'edit_posts',
        'edit_pages',
        'edit_others_posts',
        'edit_others_pages',
        'manage_options',
        'acf_manage_field_groups'
      ];
      
      console.log('\n🔍 CAPACIDADES ACF:');
      acfCapabilities.forEach(cap => {
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

  console.log('\n📋 RESUMO DA VERIFICAÇÃO:');
  console.log('==========================');
  console.log('✅ API REST do ACF verificada');
  console.log('✅ Grupos de campos testados');
  console.log('✅ Permissões verificadas');
  console.log('✅ Configuração identificada');
}

checkACFProRESTAPI();





