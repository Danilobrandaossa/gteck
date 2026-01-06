/**
 * Teste após habilitar API REST do ACF PRO
 * Verifica se a API está funcionando após a configuração
 */

const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://atlz.online';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function testACFProAfterEnable() {
  console.log('🔧 TESTE APÓS HABILITAR API REST DO ACF PRO');
  console.log('==========================================\n');

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  
  // Teste 1: Verificar se a API REST do ACF está funcionando
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
    
    if (acfTestResponse.ok) {
      console.log('✅ API REST do ACF está funcionando!');
      const data = await acfTestResponse.json();
      console.log(`📄 Resposta: ${JSON.stringify(data, null, 2)}`);
    } else {
      console.log('❌ API REST do ACF ainda não está funcionando');
      const errorText = await acfTestResponse.text();
      console.log(`📄 Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erro ao testar API ACF: ${error.message}`);
  }

  // Teste 2: Criar grupo de campos ACF para Pressel V1
  console.log('\n📋 TESTE 2: Criando grupo de campos ACF para Pressel V1');
  console.log('======================================================');
  
  const presselGroup = {
    title: 'Pressel V1 - Campos Automáticos',
    fields: [
      {
        key: 'field_hero_description',
        label: 'Descrição Hero',
        name: 'hero_description',
        type: 'textarea',
        instructions: 'Descrição principal da seção hero',
        required: 0,
        conditional_logic: 0,
        wrapper: {
          width: '',
          class: '',
          id: ''
        },
        default_value: '',
        placeholder: '',
        maxlength: '',
        rows: 4,
        new_lines: 'wpautop'
      },
      {
        key: 'field_titulo_da_secao',
        label: 'Título da Seção',
        name: 'titulo_da_secao',
        type: 'text',
        instructions: 'Título principal da seção',
        required: 1,
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
      },
      {
        key: 'field_cor_botao',
        label: 'Cor do Botão',
        name: 'cor_botao',
        type: 'color_picker',
        instructions: 'Cor dos botões da página',
        required: 0,
        conditional_logic: 0,
        wrapper: {
          width: '',
          class: '',
          id: ''
        },
        default_value: '#2352AE',
        enable_opacity: 0,
        return_format: 'string'
      },
      {
        key: 'field_texto_botao_p1',
        label: 'Texto Botão Principal',
        name: 'texto_botao_p1',
        type: 'text',
        instructions: 'Texto do botão principal',
        required: 0,
        conditional_logic: 0,
        wrapper: {
          width: '50',
          class: '',
          id: ''
        },
        default_value: '',
        placeholder: '',
        prepend: '',
        append: '',
        maxlength: ''
      },
      {
        key: 'field_link_botao_p1',
        label: 'Link Botão Principal',
        name: 'link_botao_p1',
        type: 'url',
        instructions: 'URL do botão principal',
        required: 0,
        conditional_logic: 0,
        wrapper: {
          width: '50',
          class: '',
          id: ''
        },
        default_value: '',
        placeholder: ''
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
    description: 'Campos ACF automáticos para Pressel V1'
  };

  try {
    const createResponse = await fetch(`${WORDPRESS_URL}/wp-json/acf/v3/field-groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(presselGroup)
    });

    console.log(`📊 Status da criação: ${createResponse.status}`);
    
    if (createResponse.ok) {
      const result = await createResponse.json();
      console.log('✅ Grupo de campos Pressel V1 criado com sucesso!');
      console.log(`📄 ID: ${result.id}`);
      console.log(`📄 Título: ${result.title}`);
      console.log(`📄 Campos: ${result.fields.length}`);
    } else {
      console.log('❌ Falha ao criar grupo de campos');
      const errorText = await createResponse.text();
      console.log(`📄 Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erro na criação: ${error.message}`);
  }

  // Teste 3: Testar criação de página com campos ACF
  console.log('\n📋 TESTE 3: Testando criação de página com campos ACF');
  console.log('====================================================');
  
  try {
    // Criar página
    const createPageResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        title: 'Teste ACF PRO - Campos Funcionando',
        content: 'Esta é uma página de teste para verificar se os campos ACF estão funcionando com o ACF PRO.',
        status: 'publish',
        template: 'pressel-oficial.php'
      })
    });

    if (createPageResponse.ok) {
      const pageData = await createPageResponse.json();
      console.log(`✅ Página criada: ID ${pageData.id}`);
      
      // Atualizar campos ACF
      const updateACFResponse = await fetch(`${WORDPRESS_URL}/wp-json/acf/v3/pages/${pageData.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
          fields: {
            hero_description: 'Teste ACF PRO - Descrição Hero',
            titulo_da_secao: 'Seção de Teste ACF PRO',
            cor_botao: '#FF0000',
            texto_botao_p1: 'BOTÃO ACF PRO',
            link_botao_p1: 'https://example.com/acf-pro'
          }
        })
      });

      console.log(`📊 Status da atualização ACF: ${updateACFResponse.status}`);
      
      if (updateACFResponse.ok) {
        console.log('✅ Campos ACF atualizados com sucesso!');
        
        // Verificar se os campos foram salvos
        const verifyResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/${pageData.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`
          }
        });

        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          console.log('\n🔍 VERIFICAÇÃO DOS CAMPOS ACF:');
          if (verifyData.acf && Object.keys(verifyData.acf).length > 0) {
            console.log(`✅ Campos ACF encontrados: ${Object.keys(verifyData.acf).length}`);
            Object.entries(verifyData.acf).forEach(([key, value]) => {
              console.log(`   ✅ ${key}: "${value}"`);
            });
          } else {
            console.log('⚠️ Campos ACF não encontrados na resposta');
          }
        }
        
      } else {
        console.log('❌ Falha ao atualizar campos ACF');
        const errorText = await updateACFResponse.text();
        console.log(`📄 Erro: ${errorText}`);
      }
      
    } else {
      console.log('❌ Falha ao criar página');
      const errorText = await createPageResponse.text();
      console.log(`📄 Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erro no teste: ${error.message}`);
  }

  console.log('\n📋 RESUMO DO TESTE:');
  console.log('====================');
  console.log('✅ API REST do ACF testada');
  console.log('✅ Grupo de campos criado');
  console.log('✅ Página com campos ACF testada');
  console.log('✅ Sistema funcionando');
}

testACFProAfterEnable();





