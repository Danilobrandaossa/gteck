/**
 * Exemplo Prático dos Códigos de Erro PS- do Pressel Automation
 * Demonstra como usar e interpretar os códigos de erro
 */

const fetch = require('node-fetch');

const CMS_URL = 'http://localhost:3002';

async function demonstrateErrorCodes() {
  console.log('📚 EXEMPLO PRÁTICO DOS CÓDIGOS DE ERRO PS-');
  console.log('==========================================\n');

  console.log('🎯 OBJETIVO:');
  console.log('Demonstrar como os códigos PS- facilitam a identificação e solução de problemas\n');

  // Exemplo 1: JSON mal formatado
  console.log('📋 EXEMPLO 1: JSON mal formatado');
  console.log('--------------------------------');
  
  const invalidJson = '{"titulo": "Teste", "campos": }'; // JSON inválido
  
  try {
    const response = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: 'https://atlz.online/',
        jsonData: invalidJson,
        testMode: false
      })
    });

    const result = await response.json();
    
    console.log('📊 Resposta da API:');
    console.log(`   🚨 Status: ${result.status}`);
    console.log(`   🔢 Código: ${result.codigo}`);
    console.log(`   📝 Mensagem: ${result.mensagem}`);
    console.log(`   🏷️ Categoria: ${result.categoria}`);
    console.log(`   ⚠️ Severidade: ${result.severidade}`);
    
    if (result.sugestoes) {
      console.log('   💡 Sugestões:');
      result.sugestoes.forEach(sugestao => {
        console.log(`      - ${sugestao}`);
      });
    }
    
    console.log('\n✅ INTERPRETAÇÃO:');
    console.log('   O código PS-JSON-001 indica que o JSON está mal formatado.');
    console.log('   As sugestões fornecem soluções específicas para corrigir o problema.\n');
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  // Exemplo 2: Campo obrigatório ausente
  console.log('📋 EXEMPLO 2: Campo obrigatório ausente');
  console.log('--------------------------------------');
  
  const incompleteJson = {
    page_title: 'Página de Teste',
    // acf_fields ausente - campo obrigatório
  };
  
  try {
    const response = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: 'https://atlz.online/',
        jsonData: incompleteJson,
        testMode: false
      })
    });

    const result = await response.json();
    
    console.log('📊 Resposta da API:');
    console.log(`   🚨 Status: ${result.status}`);
    console.log(`   🔢 Código: ${result.codigo}`);
    console.log(`   📝 Mensagem: ${result.mensagem}`);
    console.log(`   🏷️ Categoria: ${result.categoria}`);
    
    if (result.detalhes) {
      console.log('   📊 Detalhes:');
      console.log(`      - Campo ausente: ${result.detalhes.missingField}`);
      console.log(`      - Campos fornecidos: ${result.detalhes.providedFields.join(', ')}`);
    }
    
    console.log('\n✅ INTERPRETAÇÃO:');
    console.log('   O código PS-JSON-002 indica que um campo obrigatório está ausente.');
    console.log('   Os detalhes mostram exatamente qual campo está faltando.\n');
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  // Exemplo 3: Modelo não identificado
  console.log('📋 EXEMPLO 3: Modelo não identificado');
  console.log('------------------------------------');
  
  const unknownModelJson = {
    page_title: 'Página com modelo desconhecido',
    acf_fields: {
      campo_estranho_1: 'valor 1',
      campo_estranho_2: 'valor 2',
      campo_estranho_3: 'valor 3'
    }
  };
  
  try {
    const response = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: 'https://atlz.online/',
        jsonData: unknownModelJson,
        testMode: false
      })
    });

    const result = await response.json();
    
    console.log('📊 Resposta da API:');
    console.log(`   🚨 Status: ${result.status}`);
    console.log(`   🔢 Código: ${result.codigo}`);
    console.log(`   📝 Mensagem: ${result.mensagem}`);
    console.log(`   🏷️ Categoria: ${result.categoria}`);
    
    if (result.detalhes) {
      console.log('   📊 Detalhes:');
      console.log(`      - Campos do JSON: ${result.detalhes.jsonFields.join(', ')}`);
      console.log(`      - Modelos disponíveis: ${result.detalhes.availableModels.join(', ')}`);
    }
    
    console.log('\n✅ INTERPRETAÇÃO:');
    console.log('   O código PS-MODEL-001 indica que nenhum modelo foi identificado.');
    console.log('   Os detalhes mostram quais campos estão disponíveis vs. esperados.\n');
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  // Resumo dos benefícios
  console.log('🎯 BENEFÍCIOS DOS CÓDIGOS PS-:');
  console.log('===============================');
  console.log('✅ Identificação Rápida:');
  console.log('   - Cada erro tem um código único e específico');
  console.log('   - Facilita busca em documentação e logs');
  console.log('');
  console.log('✅ Mensagens Claras:');
  console.log('   - Descrições específicas do problema');
  console.log('   - Contexto detalhado do erro');
  console.log('');
  console.log('✅ Soluções Automáticas:');
  console.log('   - Sugestões específicas para cada tipo de erro');
  console.log('   - Guias de correção passo a passo');
  console.log('');
  console.log('✅ Categorização:');
  console.log('   - JSON: Problemas de formato e estrutura');
  console.log('   - ACF: Problemas com campos personalizados');
  console.log('   - WP: Problemas com WordPress');
  console.log('   - SYS: Problemas de sistema');
  console.log('   - MODEL: Problemas de identificação de modelo');
  console.log('   - VALIDATION: Problemas de validação');
  console.log('');
  console.log('✅ Logs Detalhados:');
  console.log('   - Registro automático de todos os erros');
  console.log('   - Histórico para análise e debugging');
  console.log('');
  console.log('✅ Suporte Técnico:');
  console.log('   - Códigos facilitam comunicação com suporte');
  console.log('   - Reduzem tempo de resolução de problemas');

  console.log('\n🚀 COMO USAR:');
  console.log('=============');
  console.log('1. Quando receber um erro, anote o código PS-');
  console.log('2. Consulte a documentação usando o código');
  console.log('3. Siga as sugestões fornecidas');
  console.log('4. Se necessário, envie o código para suporte técnico');
  console.log('5. Use os logs para análise detalhada');
}

demonstrateErrorCodes();





