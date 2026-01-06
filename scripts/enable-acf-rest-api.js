/**
 * Habilitar API REST do ACF PRO via Código
 * Força a habilitação da API REST através de configuração direta
 */

const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://atlz.online';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function enableACFRESTAPI() {
  console.log('🔧 HABILITANDO API REST DO ACF PRO VIA CÓDIGO');
  console.log('=============================================\n');

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  
  // Método 1: Tentar atualizar configurações via API
  console.log('📋 MÉTODO 1: Atualizando configurações via API');
  console.log('==============================================');
  
  try {
    const settingsResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/acf-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        rest_api_enabled: true,
        rest_api_version: 'v3'
      })
    });

    console.log(`📊 Status: ${settingsResponse.status}`);
    
    if (settingsResponse.ok) {
      console.log('✅ Configurações atualizadas com sucesso!');
    } else {
      console.log('❌ Falha ao atualizar configurações');
      const errorText = await settingsResponse.text();
      console.log(`📄 Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }

  // Método 2: Tentar criar um grupo de campos para forçar a ativação
  console.log('\n📋 MÉTODO 2: Criando grupo de campos para forçar ativação');
  console.log('=======================================================');
  
  const testGroup = {
    title: 'Teste Ativação API REST',
    fields: [
      {
        key: 'field_teste_ativacao',
        label: 'Campo Teste',
        name: 'teste_ativacao',
        type: 'text',
        instructions: 'Campo para testar ativação da API REST',
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
    description: 'Grupo para testar ativação da API REST'
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

    console.log(`📊 Status: ${createResponse.status}`);
    
    if (createResponse.ok) {
      const result = await createResponse.json();
      console.log('✅ Grupo criado com sucesso!');
      console.log(`📄 ID: ${result.id}`);
      console.log('🎯 API REST do ACF está funcionando!');
    } else {
      console.log('❌ Falha ao criar grupo');
      const errorText = await createResponse.text();
      console.log(`📄 Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }

  // Método 3: Verificar se a API está funcionando agora
  console.log('\n📋 MÉTODO 3: Verificando se a API está funcionando');
  console.log('================================================');
  
  try {
    const testResponse = await fetch(`${WORDPRESS_URL}/wp-json/acf/v3/pages`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    console.log(`📊 Status: ${testResponse.status}`);
    
    if (testResponse.ok) {
      console.log('✅ API REST do ACF está funcionando!');
      console.log('🎉 Sistema pronto para usar!');
    } else {
      console.log('❌ API REST ainda não está funcionando');
      console.log('💡 Você precisa habilitar manualmente no WordPress Admin');
    }
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }

  console.log('\n📋 INSTRUÇÕES MANUAIS:');
  console.log('======================');
  console.log('1. Acesse: https://atlz.online/wp-admin/');
  console.log('2. Procure por "Custom Fields" no menu lateral');
  console.log('3. Clique em "Settings" ou "Configurações"');
  console.log('4. Na aba "REST API", marque "Enable the REST API"');
  console.log('5. Salve as configurações');
  console.log('6. Teste novamente');
}

enableACFRESTAPI();





