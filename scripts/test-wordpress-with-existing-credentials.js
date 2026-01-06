/**
 * Script para testar upload real no WordPress usando credenciais já configuradas
 * Este script usa as credenciais que já estão no sistema CMS
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Configurações
const CMS_URL = 'http://localhost:3002';
const WORDPRESS_SITE = 'https://atlz.online/';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Função para log colorido
const log = (message, color = 'white') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Função para delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testWordPressWithExistingCredentials() {
  log('🚀 Teste de Upload Real no WordPress com Credenciais Existentes', 'cyan');
  log('============================================================', 'cyan');
  console.log('');

  try {
    // [1] Verificar se o CMS está rodando
    log('[1] Verificando se o CMS está rodando...', 'blue');
    const healthResponse = await fetch(`${CMS_URL}/api/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.status === 'ok') {
      log('✅ CMS está rodando e acessível', 'green');
    } else {
      log('❌ CMS não está rodando ou inacessível', 'red');
      return;
    }
    console.log('');

    // [2] Carregar JSON de teste
    log('[2] Carregando JSON de teste...', 'blue');
    const testJsonPath = path.join(__dirname, '../test-data/sample-pressel.json');
    const jsonData = JSON.parse(fs.readFileSync(testJsonPath, 'utf8'));
    log(`✅ JSON carregado: ${Object.keys(jsonData).length} propriedades`, 'green');
    console.log('');

    // [3] Verificar credenciais WordPress no sistema
    log('[3] Verificando credenciais WordPress no sistema...', 'blue');
    
    // Tentar obter credenciais do contexto do sistema
    const credentialsResponse = await fetch(`${CMS_URL}/api/wordpress/credentials`);
    if (credentialsResponse.ok) {
      const credentials = await credentialsResponse.json();
      log('✅ Credenciais WordPress encontradas no sistema', 'green');
      log(`👤 Usuário: ${credentials.username || 'admin'}`, 'yellow');
      log(`🔑 Senha: ${credentials.password ? '***' + credentials.password.slice(-4) : 'Não configurada'}`, 'yellow');
    } else {
      log('⚠️  Credenciais não encontradas no sistema, usando padrões', 'yellow');
      log('💡 Configure as credenciais em /settings para usar autenticação real', 'yellow');
    }
    console.log('');

    // [4] Testar validação do site
    log('[4] Testando validação do site WordPress...', 'blue');
    const validateResponse = await fetch(`${CMS_URL}/api/wordpress/validate-site`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteUrl: WORDPRESS_SITE }),
    });
    
    const validateResult = await validateResponse.json();
    if (validateResult.success) {
      log('✅ Site WordPress validado com sucesso', 'green');
      log(`🌐 Site: ${validateResult.siteUrl}`, 'yellow');
      log(`📊 Status: ${validateResult.status}`, 'yellow');
    } else {
      log('❌ Erro na validação do site', 'red');
      log(`📝 Detalhes: ${validateResult.error}`, 'red');
    }
    console.log('');

    // [5] Testar upload de JSON
    log('[5] Testando upload de JSON...', 'blue');
    const uploadResponse = await fetch(`${CMS_URL}/api/pressel/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jsonData),
    });
    
    const uploadResult = await uploadResponse.json();
    if (uploadResult.success) {
      log('✅ Upload de JSON realizado com sucesso', 'green');
      log(`📄 Resultado: ${JSON.stringify(uploadResult.data, null, 2)}`, 'yellow');
    } else {
      log('❌ Erro no upload de JSON', 'red');
      log(`📝 Detalhes: ${uploadResult.error}`, 'red');
      return;
    }
    console.log('');

    // [6] Testar processo completo (modo real)
    log('[6] Testando processo completo (modo real)...', 'blue');
    log('⚠️  ATENÇÃO: Este teste tentará criar uma página real no WordPress!', 'yellow');
    
    const processResponse = await fetch(`${CMS_URL}/api/pressel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: WORDPRESS_SITE,
        jsonContent: jsonData,
        testMode: false, // Modo real - tentará publicar no WordPress
        options: {
          publish: true,
          addSeo: true,
          addAcfFields: true,
          notifyOnComplete: true
        }
      }),
    });
    
    const processResult = await processResponse.json();
    if (processResult.success) {
      log('✅ Processo completo executado com sucesso!', 'green');
      log(`📋 Resultado: ${JSON.stringify(processResult.result, null, 2)}`, 'yellow');
      
      if (processResult.result.pageUrl) {
        log(`🌐 Página criada em: ${processResult.result.pageUrl}`, 'green');
      }
      if (processResult.result.editUrl) {
        log(`✍️  Editar página em: ${processResult.result.editUrl}`, 'green');
      }
    } else {
      log('❌ Erro no processo completo', 'red');
      log(`📝 Detalhes: ${processResult.error}`, 'red');
      
      // Se for erro de credenciais, dar dicas
      if (processResult.error && processResult.error.includes('authentication')) {
        log('💡 Dica: Verifique as credenciais WordPress em /settings', 'yellow');
        log('💡 Dica: Certifique-se de que a senha de aplicativo está correta', 'yellow');
      }
    }
    console.log('');

    // [7] Verificar se a página foi realmente criada
    log('[7] Verificando se a página foi criada no WordPress...', 'blue');
    if (processResult.success && processResult.result.pageUrl) {
      log('🔍 Tentando acessar a página criada...', 'blue');
      
      try {
        const pageResponse = await fetch(processResult.result.pageUrl);
        if (pageResponse.ok) {
          log('✅ Página acessível no WordPress!', 'green');
          log(`🌐 URL: ${processResult.result.pageUrl}`, 'green');
        } else {
          log(`⚠️  Página retornou status ${pageResponse.status}`, 'yellow');
        }
      } catch (error) {
        log(`⚠️  Erro ao acessar página: ${error.message}`, 'yellow');
      }
    } else {
      log('⚠️  Não foi possível verificar a página (URL não disponível)', 'yellow');
    }

  } catch (error) {
    log(`❌ Erro inesperado durante o teste: ${error.message}`, 'red');
    console.error('Stack trace:', error.stack);
  } finally {
    console.log('');
    log('============================================================', 'cyan');
    log('🎉 Teste de Upload Real com Credenciais Existentes Concluído!', 'cyan');
    log('📝 Verifique os logs acima para detalhes dos resultados', 'white');
    log('💡 Se houver erros de autenticação, configure as credenciais em /settings', 'yellow');
  }
}

// Executar o teste
testWordPressWithExistingCredentials();
