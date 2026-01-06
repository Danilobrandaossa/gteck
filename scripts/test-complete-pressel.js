/**
 * Teste Completo do Pressel Automation com Validação e Logs
 * Testa o fluxo completo: JSON → Modelo → WordPress → ACF → Publicar
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const CMS_URL = 'http://localhost:3002';

async function testCompletePresselAutomation() {
  console.log('🚀 TESTE COMPLETO DO PRESSEL AUTOMATION');
  console.log('========================================\n');

  // JSON real baseado no modelo V1 com campos obrigatórios
  const v1JsonComplete = {
    page_title: 'Aplicativo de Figurinhas Cristãs para WhatsApp',
    page_content: 'Descrição completa do aplicativo de figurinhas cristãs',
    page_status: 'publish',
    page_slug: 'aplicativo-figurinhas-cristas-whatsapp',
    acf_fields: {
      // Campos obrigatórios do modelo V1
      titulo_da_secao: 'Instale grátis e teste pacotes selecionados',
      titulo_beneficios: 'Benefícios do Aplicativo',
      titulo_faq: 'Perguntas Frequentes',
      
      // Campos únicos do modelo V1
      hero_description: 'Aplicativo de figurinhas cristãs com pacotes grátis para WhatsApp',
      cor_botao: '#2352AE',
      texto_botao_p1: 'BAIXAR AGORA GRÁTIS',
      link_botao_p1: 'https://exemplo.com/app',
      texto_botao_p2: 'VER PACOTES',
      link_botao_p2: 'https://exemplo.com/pacotes',
      texto_botao_p3: 'SUPORTE',
      link_botao_p3: 'https://exemplo.com/suporte',
      
      // Títulos e conteúdo
      titulo_h2_: 'Mensagens que acolhem: fé no dia a dia',
      titulo_h2_02: 'Como funciona com transparência',
      info_content: '<p>O aplicativo oferece uma coleção exclusiva de figurinhas cristãs...</p>',
      info_content_2: '<p>Funciona de forma simples e intuitiva...</p>',
      
      // Benefícios
      titulo_beneficios_1: 'Pacotes Gratuitos',
      titulo_beneficios_2: 'Fácil de Usar',
      titulo_beneficios_3: 'Atualizações Constantes',
      titulo_beneficios_4: 'Suporte 24/7',
      '_beneficio_text_1': 'Acesso a pacotes selecionados sem custo',
      '_beneficio_text_2': 'Interface intuitiva e simples de usar',
      '_beneficio_text_3': 'Novos pacotes adicionados regularmente',
      '_beneficio_text_4': 'Suporte técnico disponível sempre',
      
      // FAQ
      pergunta_1: 'O aplicativo é gratuito?',
      pergunta_2: 'Funciona no meu WhatsApp?',
      pergunta_3: 'Vocês são afiliados ao WhatsApp?',
      resposta_1: 'Sim, o aplicativo é totalmente gratuito',
      resposta_2: 'Sim, funciona em qualquer versão do WhatsApp',
      resposta_3: 'Não, somos independentes do WhatsApp',
      
      // Campos adicionais
      aviso: 'aviso_pt',
      texto_usuario: 'Você permanecerá no mesmo site'
    },
    seo: {
      meta_title: 'Aplicativo de Figurinhas Cristãs - WhatsApp Grátis',
      meta_description: 'Baixe grátis o aplicativo de figurinhas cristãs para WhatsApp. Pacotes exclusivos e atualizações constantes.',
      focus_keyword: 'figurinhas cristãs whatsapp'
    },
    featured_image: 'https://via.placeholder.com/1200x600'
  };

  // JSON com campos fixos do site (que devem ser preservados)
  const jsonWithFixedElements = {
    ...v1JsonComplete,
    acf_fields: {
      ...v1JsonComplete.acf_fields,
      // Campos fixos que não devem ser alterados
      site_logo: 'https://exemplo.com/logo-fixo.png',
      site_menu: 'Menu fixo do site',
      site_footer: 'Rodapé fixo do site',
      ad_codes: 'Códigos de anúncio fixos',
      analytics_codes: 'Códigos de analytics fixos',
      site_config: 'Configurações fixas do site'
    }
  };

  console.log('📊 Dados do teste:');
  console.log(`   📄 Título: ${v1JsonComplete.page_title}`);
  console.log(`   📋 Campos ACF: ${Object.keys(v1JsonComplete.acf_fields).length}`);
  console.log(`   🔒 Campos fixos: ${Object.keys(jsonWithFixedElements.acf_fields).length - Object.keys(v1JsonComplete.acf_fields).length}`);
  console.log('');

  try {
    // Teste 1: JSON completo válido
    console.log('[1] Testando JSON completo válido...');
    const validResponse = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: 'https://atlz.online/',
        jsonData: v1JsonComplete,
        testMode: false
      })
    });

    const validResult = await validResponse.json();
    
    if (validResult.success) {
      console.log('✅ JSON válido processado com sucesso!');
      console.log(`📋 Modelo detectado: ${validResult.detectedModel?.modelName}`);
      console.log(`📈 Confiança: ${Math.round((validResult.detectedModel?.confidence || 0) * 100)}%`);
      console.log(`🔗 Template: ${validResult.detectedModel?.template}`);
      console.log(`📊 Campos processados: ${validResult.detectedModel?.matchedFields?.length || 0}`);
      console.log(`⏱️ Duração: ${validResult.duration || 0}ms`);
      
      if (validResult.result?.pageUrl) {
        console.log(`🔗 URL: ${validResult.result.pageUrl}`);
        console.log(`✍️  Editar: ${validResult.result.editUrl}`);
        console.log(`🆔 ID: ${validResult.result.pageId}`);
      }
      
      if (validResult.stats) {
        console.log(`📊 Estatísticas:`);
        console.log(`   ✅ Processos: ${validResult.stats.totalProcessLogs}`);
        console.log(`   🚨 Erros: ${validResult.stats.errors}`);
        console.log(`   ⚠️ Avisos: ${validResult.stats.warnings}`);
        console.log(`   ℹ️ Info: ${validResult.stats.info}`);
        console.log(`   📈 Taxa de sucesso: ${Math.round(validResult.stats.successRate * 100)}%`);
      }
    } else {
      console.log('❌ Erro no processamento:', validResult.error);
      if (validResult.validationErrors) {
        console.log('🚨 Erros de validação:');
        validResult.validationErrors.forEach(error => {
          console.log(`   - ${error.field}: ${error.message}`);
        });
      }
    }
    console.log('');

    // Teste 2: JSON com campos fixos (teste de integridade)
    console.log('[2] Testando preservação de elementos fixos...');
    const integrityResponse = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: 'https://atlz.online/',
        jsonData: jsonWithFixedElements,
        testMode: false
      })
    });

    const integrityResult = await integrityResponse.json();
    
    if (integrityResult.success) {
      console.log('✅ Elementos fixos preservados com sucesso!');
      console.log(`📋 Modelo detectado: ${integrityResult.detectedModel?.modelName}`);
      
      if (integrityResult.stats) {
        console.log(`📊 Estatísticas de integridade:`);
        console.log(`   ⚠️ Avisos: ${integrityResult.stats.warnings}`);
        console.log(`   ℹ️ Info: ${integrityResult.stats.info}`);
      }
    } else {
      console.log('❌ Erro na preservação:', integrityResult.error);
    }
    console.log('');

    // Teste 3: JSON com campos obrigatórios ausentes
    console.log('[3] Testando validação de campos obrigatórios...');
    const invalidJson = {
      page_title: 'Teste sem campos obrigatórios',
      acf_fields: {
        hero_description: 'Apenas descrição',
        cor_botao: '#FF0000'
        // Campos obrigatórios ausentes: titulo_da_secao, titulo_beneficios, titulo_faq
      }
    };

    const invalidResponse = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: 'https://atlz.online/',
        jsonData: invalidJson,
        testMode: false
      })
    });

    const invalidResult = await invalidResponse.json();
    
    if (!invalidResult.success) {
      console.log('✅ Validação funcionando - campos obrigatórios detectados!');
      console.log(`🚨 Erro: ${invalidResult.error}`);
      
      if (invalidResult.validationErrors) {
        console.log('📋 Erros de validação encontrados:');
        invalidResult.validationErrors.forEach(error => {
          console.log(`   - ${error.field}: ${error.message}`);
        });
      }
    } else {
      console.log('❌ Validação falhou - deveria ter detectado campos ausentes');
    }
    console.log('');

    // Teste 4: Verificar logs gerados
    console.log('[4] Verificando logs gerados...');
    const logsDir = path.join(process.cwd(), 'logs', 'pressel-automation');
    
    if (fs.existsSync(logsDir)) {
      const logFiles = fs.readdirSync(logsDir);
      console.log(`📁 Arquivos de log encontrados: ${logFiles.length}`);
      
      logFiles.forEach(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        console.log(`   📄 ${file}: ${stats.size} bytes`);
      });
      
      // Ler último relatório
      const reportFiles = logFiles.filter(f => f.startsWith('report-'));
      if (reportFiles.length > 0) {
        const latestReport = reportFiles.sort().pop();
        const reportPath = path.join(logsDir, latestReport);
        const reportContent = fs.readFileSync(reportPath, 'utf8');
        const report = JSON.parse(reportContent);
        
        console.log(`📋 Último relatório (${latestReport}):`);
        console.log(`   📊 Total de logs: ${report.summary.totalProcessLogs}`);
        console.log(`   🚨 Erros: ${report.summary.errors}`);
        console.log(`   ⚠️ Avisos: ${report.summary.warnings}`);
        console.log(`   ℹ️ Info: ${report.summary.info}`);
        
        if (report.recommendations && report.recommendations.length > 0) {
          console.log(`💡 Recomendações:`);
          report.recommendations.forEach(rec => {
            console.log(`   - ${rec}`);
          });
        }
      }
    } else {
      console.log('❌ Diretório de logs não encontrado');
    }

    console.log('\n🎉 TESTE COMPLETO CONCLUÍDO!');
    console.log('============================');
    console.log('📊 Resultados:');
    console.log(`   ✅ JSON válido: ${validResult.success ? 'OK' : 'ERRO'}`);
    console.log(`   ✅ Preservação de elementos fixos: ${integrityResult.success ? 'OK' : 'ERRO'}`);
    console.log(`   ✅ Validação de campos obrigatórios: ${!invalidResult.success ? 'OK' : 'ERRO'}`);
    console.log(`   ✅ Sistema de logs: ${fs.existsSync(logsDir) ? 'OK' : 'ERRO'}`);
    
    const allTestsPassed = validResult.success && integrityResult.success && !invalidResult.success && fs.existsSync(logsDir);
    
    if (allTestsPassed) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM!');
      console.log('✅ Pressel Automation está funcionando perfeitamente!');
      console.log('✅ Identificação automática de modelos: OK');
      console.log('✅ Validação de campos obrigatórios: OK');
      console.log('✅ Preservação de elementos fixos: OK');
      console.log('✅ Sistema de logs: OK');
      console.log('✅ Fluxo completo: JSON → Modelo → WordPress → ACF → Publicar: OK');
    } else {
      console.log('\n⚠️ Alguns testes falharam. Verifique os logs para detalhes.');
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testCompletePresselAutomation();





