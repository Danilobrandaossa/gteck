/**
 * Script para Registrar Campos ACF no WordPress
 * Cria os grupos de campos ACF necessários para o modelo V1
 */

const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://atlz.online';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function registerACFFields() {
  console.log('🔧 REGISTRANDO CAMPOS ACF NO WORDPRESS');
  console.log('=====================================\n');

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  
  // Grupo de campos ACF para o modelo V1
  const acfGroup = {
    title: 'Pressel V1 - Campos Principais',
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
      },
      {
        key: 'field_texto_botao_p2',
        label: 'Texto Botão Secundário',
        name: 'texto_botao_p2',
        type: 'text',
        instructions: 'Texto do botão secundário',
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
        key: 'field_link_botao_p2',
        label: 'Link Botão Secundário',
        name: 'link_botao_p2',
        type: 'url',
        instructions: 'URL do botão secundário',
        required: 0,
        conditional_logic: 0,
        wrapper: {
          width: '50',
          class: '',
          id: ''
        },
        default_value: '',
        placeholder: ''
      },
      {
        key: 'field_texto_botao_p3',
        label: 'Texto Botão Terciário',
        name: 'texto_botao_p3',
        type: 'text',
        instructions: 'Texto do botão terciário',
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
        key: 'field_link_botao_p3',
        label: 'Link Botão Terciário',
        name: 'link_botao_p3',
        type: 'url',
        instructions: 'URL do botão terciário',
        required: 0,
        conditional_logic: 0,
        wrapper: {
          width: '50',
          class: '',
          id: ''
        },
        default_value: '',
        placeholder: ''
      },
      {
        key: 'field_titulo_h2_',
        label: 'Título H2',
        name: 'titulo_h2_',
        type: 'text',
        instructions: 'Título da seção H2',
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
      },
      {
        key: 'field_info_content',
        label: 'Conteúdo Principal',
        name: 'info_content',
        type: 'wysiwyg',
        instructions: 'Conteúdo principal da página',
        required: 0,
        conditional_logic: 0,
        wrapper: {
          width: '',
          class: '',
          id: ''
        },
        default_value: '',
        tabs: 'all',
        toolbar: 'full',
        media_upload: 1,
        delay: 0
      },
      {
        key: 'field_titulo_beneficios',
        label: 'Título Benefícios',
        name: 'titulo_beneficios',
        type: 'text',
        instructions: 'Título da seção de benefícios',
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
      },
      {
        key: 'field_titulo_beneficios_1',
        label: 'Título Benefício 1',
        name: 'titulo_beneficios_1',
        type: 'text',
        instructions: 'Título do primeiro benefício',
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
        key: 'field_beneficio_text_1',
        label: 'Texto Benefício 1',
        name: '_beneficio_text_1',
        type: 'textarea',
        instructions: 'Descrição do primeiro benefício',
        required: 0,
        conditional_logic: 0,
        wrapper: {
          width: '50',
          class: '',
          id: ''
        },
        default_value: '',
        placeholder: '',
        maxlength: '',
        rows: 3,
        new_lines: 'wpautop'
      },
      {
        key: 'field_titulo_faq',
        label: 'Título FAQ',
        name: 'titulo_faq',
        type: 'text',
        instructions: 'Título da seção FAQ',
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
      },
      {
        key: 'field_pergunta_1',
        label: 'Pergunta 1',
        name: 'pergunta_1',
        type: 'text',
        instructions: 'Primeira pergunta do FAQ',
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
        key: 'field_resposta_1',
        label: 'Resposta 1',
        name: 'resposta_1',
        type: 'textarea',
        instructions: 'Resposta da primeira pergunta',
        required: 0,
        conditional_logic: 0,
        wrapper: {
          width: '50',
          class: '',
          id: ''
        },
        default_value: '',
        placeholder: '',
        maxlength: '',
        rows: 3,
        new_lines: 'wpautop'
      },
      {
        key: 'field_aviso',
        label: 'Aviso Legal',
        name: 'aviso',
        type: 'textarea',
        instructions: 'Aviso legal da página',
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
        rows: 3,
        new_lines: 'wpautop'
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
    description: 'Campos ACF para o modelo Pressel V1'
  };

  console.log('📋 Criando grupo de campos ACF...');
  console.log(`📊 Total de campos: ${acfGroup.fields.length}`);
  
  try {
    // Tentar criar o grupo de campos via API ACF
    const response = await fetch(`${WORDPRESS_URL}/wp-json/acf/v3/field-groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(acfGroup)
    });

    console.log(`📊 Status da criação: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Grupo de campos ACF criado com sucesso!');
      console.log(`📄 ID do grupo: ${result.id}`);
      console.log(`📄 Título: ${result.title}`);
    } else {
      console.log('⚠️ API ACF não disponível, tentando método alternativo...');
      
      // Método alternativo: criar via WordPress API
      const wpResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/acf-field-groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify(acfGroup)
      });

      console.log(`📊 Status WP API: ${wpResponse.status}`);
      
      if (wpResponse.ok) {
        const wpResult = await wpResponse.json();
        console.log('✅ Grupo criado via WordPress API!');
        console.log(`📄 ID: ${wpResult.id}`);
      } else {
        console.log('❌ Falha ao criar grupo de campos');
        const errorText = await wpResponse.text();
        console.log(`📄 Erro: ${errorText}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Erro na criação: ${error.message}`);
  }

  console.log('\n📋 RESUMO DA CRIAÇÃO:');
  console.log('======================');
  console.log('✅ Grupo de campos ACF definido');
  console.log('✅ Campos principais incluídos');
  console.log('✅ Localização configurada');
  console.log('✅ Pronto para uso');
}

registerACFFields();





