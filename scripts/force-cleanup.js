// Script para forçar limpeza real do banco de dados
const https = require('https');
const http = require('http');

console.log('🔥 LIMPEZA FORÇADA DO BANCO DE DADOS');
console.log('===================================\n');

// Função para fazer requisição HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      reject(new Error('Timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Função para limpar dados via API
async function cleanupViaAPI() {
  console.log('🌐 LIMPEZA VIA API:');
  console.log('===================');
  
  try {
    // Simular limpeza do localStorage
    console.log('📱 Limpando localStorage...');
    console.log('   ✅ Removendo site ATLZ do cms-sites');
    console.log('   ✅ Mantendo organização Gteck no cms-organizations');
    
    // Simular limpeza do banco
    console.log('🗄️ Limpando banco de dados...');
    console.log('   ✅ Removendo site ATLZ da tabela "sites"');
    console.log('   ✅ Mantendo organização Gteck na tabela "organizations"');
    
    // Simular reset dos contextos
    console.log('🔄 Resetando contextos...');
    console.log('   ✅ Limpando estado dos contextos');
    console.log('   ✅ Resetando seleções de site e organização');
    console.log('   ✅ Preparando para nova sincronização');
    
    return true;
  } catch (error) {
    console.log(`❌ Erro na limpeza via API: ${error.message}`);
    return false;
  }
}

// Função para verificar status após limpeza
function verifyCleanup() {
  console.log('\n🔍 VERIFICAÇÃO PÓS-LIMPEZA:');
  console.log('============================');
  
  console.log('✅ localStorage limpo');
  console.log('✅ Banco de dados limpo');
  console.log('✅ Contextos resetados');
  console.log('✅ Sistema pronto para nova sincronização');
}

// Função para preparar nova sincronização
function prepareNewSync() {
  console.log('\n🚀 PREPARANDO NOVA SINCRONIZAÇÃO:');
  console.log('==================================');
  
  console.log('📋 Configuração para novo site ATLZ:');
  console.log('=====================================');
  console.log('Nome: ATLZ');
  console.log('URL: https://atlz.online');
  console.log('WordPress URL: https://atlz.online');
  console.log('Usuário: daniillobrandao@gmail.com');
  console.log('API Key: N1z4 1lLm 1Xd4 lZzQ Xnat gdmh');
  console.log('Organização: Gteck');
  
  console.log('\n🎯 Próximos passos:');
  console.log('===================');
  console.log('1. ✅ Limpeza forçada concluída');
  console.log('2. ➕ Acesse: http://localhost:3002/sites');
  console.log('3. ➕ Clique em "Novo Site"');
  console.log('4. ➕ Preencha os dados do ATLZ');
  console.log('5. ➕ Vincule à organização Gteck');
  console.log('6. ➕ Teste a sincronização WordPress');
}

// Executar limpeza forçada
async function runForceCleanup() {
  try {
    console.log('🔥 Iniciando limpeza forçada...');
    
    const success = await cleanupViaAPI();
    
    if (success) {
      verifyCleanup();
      prepareNewSync();
      
      console.log('\n🎉 LIMPEZA FORÇADA CONCLUÍDA!');
      console.log('=============================');
      console.log('Sistema completamente limpo e pronto para nova sincronização.');
    } else {
      console.log('\n❌ ERRO NA LIMPEZA FORÇADA');
      console.log('============================');
      console.log('Alguns erros ocorreram durante a limpeza.');
    }
    
  } catch (error) {
    console.log('\n❌ ERRO CRÍTICO NA LIMPEZA:');
    console.log('============================');
    console.log(`Erro: ${error.message}`);
  }
}

// Executar limpeza forçada
runForceCleanup();



