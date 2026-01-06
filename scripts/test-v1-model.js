/**
 * Teste específico para o modelo V1 real carregado
 */

const fetch = require('node-fetch');

const CMS_URL = 'http://localhost:3002';

async function testV1Model() {
  console.log('🧪 TESTE ESPECÍFICO DO MODELO V1 REAL');
  console.log('=====================================\n');

  // JSON baseado nos campos reais do modelo V1
  const v1Json = {
    page_title: 'Aplicativo de Figurinhas Cristãs',
    page_content: 'Conteúdo sobre aplicativo de figurinhas',
    acf_fields: {
      hero_description: 'Aplicativo de figurinhas cristãs com pacotes grátis',
      titulo_da_secao: 'Instale grátis e teste pacotes selecionados',
      cor_botao: '#2352AE',
      texto_botao_p1: 'BAIXAR AGORA GRÁTIS',
      link_botao_p1: 'https://exemplo.com/app',
      texto_botao_p2: 'VER PACOTES',
      link_botao_p2: 'https://exemplo.com/pacotes',
      titulo_h2_: 'Mensagens que acolhem: fé no dia a dia',
      titulo_h2_02: 'Como funciona com transparência',
      titulo_beneficios: 'Benefícios do aplicativo',
      titulo_faq: 'Perguntas Frequentes',
      pergunta_1: 'O aplicativo é gratuito?',
      pergunta_2: 'Funciona no meu WhatsApp?',
      pergunta_3: 'Vocês são afiliados ao WhatsApp?',
      resposta_1: 'Sim, o aplicativo é totalmente gratuito',
      resposta_2: 'Sim, funciona em qualquer WhatsApp',
      resposta_3: 'Não, somos independentes',
      titulo_beneficios_1: 'Pacotes Gratuitos',
      titulo_beneficios_2: 'Fácil de Usar',
      titulo_beneficios_3: 'Atualizações Constantes',
      titulo_beneficios_4: 'Suporte 24/7',
      '_beneficio_text_1': 'Acesso a pacotes selecionados sem custo',
      '_beneficio_text_2': 'Interface intuitiva e simples',
      '_beneficio_text_3': 'Novos pacotes adicionados regularmente',
      '_beneficio_text_4': 'Suporte técnico disponível sempre',
      info_content: '<p>Descrição detalhada sobre o aplicativo...</p>',
      info_content_2: '<p>Informações adicionais sobre funcionamento...</p>',
      aviso: 'aviso_pt'
    },
    seo: {
      meta_title: 'Aplicativo de Figurinhas Cristãs - WhatsApp',
      meta_description: 'Baixe grátis o aplicativo de figurinhas cristãs para WhatsApp',
      focus_keyword: 'figurinhas cristãs'
    }
  };

  console.log('📊 Campos ACF do JSON V1:', Object.keys(v1Json.acf_fields).length);
  console.log('📋 Campos:', Object.keys(v1Json.acf_fields).join(', '));
  console.log('');

  try {
    // Teste 1: Modo simulado
    console.log('[1] Testando modo simulado...');
    const simulateResponse = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: 'https://atlz.online/',
        jsonData: v1Json,
        testMode: true
      })
    });

    const simulateResult = await simulateResponse.json();
    if (simulateResult.success) {
      console.log('✅ Modo simulado funcionando!');
      console.log(`📋 Modelo detectado: ${simulateResult.result.steps[1].data.detectedModel}`);
      console.log(`📈 Confiança: ${Math.round(simulateResult.result.steps[1].data.confidence * 100)}%`);
    } else {
      console.log('❌ Erro no modo simulado:', simulateResult.error);
    }
    console.log('');

    // Teste 2: Modo real (usando sistema de identificação)
    console.log('[2] Testando modo real com identificação...');
    const realResponse = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: 'https://atlz.online/',
        jsonData: v1Json,
        testMode: false
      })
    });

    const realResult = await realResponse.json();
    if (realResult.success) {
      console.log('✅ Modo real funcionando!');
      console.log(`📋 Modelo detectado: ${realResult.detectedModel?.modelName || 'N/A'}`);
      console.log(`📈 Confiança: ${Math.round((realResult.detectedModel?.confidence || 0) * 100)}%`);
      console.log(`🔗 Template: ${realResult.detectedModel?.template || 'N/A'}`);
      console.log(`📊 Campos correspondentes: ${realResult.detectedModel?.matchedFields?.length || 0}`);
      
      if (realResult.detectedModel?.matchedFields) {
        console.log(`🔗 Campos: ${realResult.detectedModel.matchedFields.join(', ')}`);
      }
      
      if (realResult.result?.pageUrl) {
        console.log(`🔗 URL: ${realResult.result.pageUrl}`);
        console.log(`✍️  Editar: ${realResult.result.editUrl}`);
        console.log(`🆔 ID: ${realResult.result.pageId}`);
      }
    } else {
      console.log('❌ Erro no modo real:', realResult.error);
      console.log('💡 Detalhes:', realResult.details);
    }
    console.log('');

    // Teste 3: Verificar se o modelo V1 está sendo identificado corretamente
    console.log('[3] Verificando identificação específica do V1...');
    
    // Contar campos únicos do V1 presentes no JSON
    const v1UniqueFields = [
      'hero_description', 'titulo_da_secao', 'cor_botao', 'texto_botao_p1', 'link_botao_p1',
      'texto_botao_p2', 'link_botao_p2', 'texto_botao_p3', 'link_botao_p3',
      'titulo_h2_', 'titulo_h2_02', 'titulo_beneficios', 'titulo_faq',
      'pergunta_1', 'pergunta_2', 'pergunta_3', 'resposta_1', 'resposta_2', 'resposta_3',
      'titulo_beneficios_1', 'titulo_beneficios_2', 'titulo_beneficios_3', 'titulo_beneficios_4',
      '_beneficio_text_1', '_beneficio_text_2', '_beneficio_text_3', '_beneficio_text_4',
      'info_content', 'info_content_2', 'aviso'
    ];
    
    const presentV1Fields = v1UniqueFields.filter(field => 
      Object.keys(v1Json.acf_fields).includes(field)
    );
    
    console.log(`📊 Campos únicos do V1 presentes: ${presentV1Fields.length}/${v1UniqueFields.length}`);
    console.log(`📋 Campos presentes: ${presentV1Fields.join(', ')}`);
    
    const v1Score = presentV1Fields.length / v1UniqueFields.length;
    console.log(`📈 Score V1: ${Math.round(v1Score * 100)}%`);
    
    if (v1Score > 0.3) {
      console.log('✅ JSON V1 tem score suficiente para identificação!');
    } else {
      console.log('❌ JSON V1 não tem score suficiente');
    }

    console.log('\n🎉 TESTE DO MODELO V1 CONCLUÍDO!');
    console.log('================================');
    console.log('📊 Resultados:');
    console.log(`   ✅ Modo simulado: ${simulateResult.success ? 'OK' : 'ERRO'}`);
    console.log(`   ✅ Modo real: ${realResult.success ? 'OK' : 'ERRO'}`);
    console.log(`   ✅ Identificação V1: ${v1Score > 0.3 ? 'OK' : 'ERRO'}`);
    
    if (realResult.success && realResult.detectedModel?.modelName === 'V1') {
      console.log('\n🎉 SUCESSO TOTAL! Modelo V1 identificado corretamente!');
    } else {
      console.log('\n⚠️ Modelo V1 não foi identificado corretamente.');
      console.log('💡 Verifique se o sistema está carregando os modelos corretamente.');
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testV1Model();





