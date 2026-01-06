#!/usr/bin/env node

/**
 * Script de Teste para Upload de JSON - Pressel Automation
 * Testa o envio de JSON para WordPress via CMS
 */

const fs = require('fs');
const path = require('path');

// Configurações
const CMS_URL = 'http://localhost:3002';
const TEST_JSON_PATH = './test-data/sample-pressel.json';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testJsonUpload() {
  log('🚀 Iniciando Teste de Upload de JSON - Pressel Automation', 'bright');
  log('=' .repeat(60), 'blue');

  try {
    // Passo 1: Verificar se o arquivo JSON existe
    logStep('1', 'Verificando arquivo JSON de teste...');
    
    if (!fs.existsSync(TEST_JSON_PATH)) {
      logError(`Arquivo JSON não encontrado: ${TEST_JSON_PATH}`);
      return;
    }
    
    const jsonContent = fs.readFileSync(TEST_JSON_PATH, 'utf8');
    const testData = JSON.parse(jsonContent);
    logSuccess(`Arquivo JSON carregado: ${Object.keys(testData).length} propriedades`);

    // Passo 2: Verificar se o CMS está rodando
    logStep('2', 'Verificando se o CMS está rodando...');
    
    try {
      const response = await fetch(`${CMS_URL}/api/health`);
      if (response.ok) {
        logSuccess('CMS está rodando e acessível');
      } else {
        logWarning('CMS pode não estar rodando corretamente');
      }
    } catch (error) {
      logError(`Erro ao conectar com CMS: ${error.message}`);
      log('💡 Certifique-se de que o servidor está rodando com: npm run dev', 'yellow');
      return;
    }

    // Passo 3: Testar endpoint de upload
    logStep('3', 'Testando endpoint de upload de JSON...');
    
    const uploadData = {
      jsonData: testData,
      siteUrl: 'https://atlz.online/', // Site padrão para teste
      action: 'create_page'
    };

    try {
      const uploadResponse = await fetch(`${CMS_URL}/api/pressel/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData)
      });

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        logSuccess('Upload realizado com sucesso!');
        log(`📄 Resultado: ${JSON.stringify(result, null, 2)}`, 'blue');
      } else {
        const errorText = await uploadResponse.text();
        logError(`Erro no upload: ${uploadResponse.status} - ${errorText}`);
      }
    } catch (error) {
      logError(`Erro na requisição de upload: ${error.message}`);
    }

    // Passo 4: Testar validação de site
    logStep('4', 'Testando validação de site selecionado...');
    
    try {
      const siteResponse = await fetch(`${CMS_URL}/api/wordpress/validate-site`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteUrl: 'https://atlz.online/'
        })
      });

      if (siteResponse.ok) {
        const siteResult = await siteResponse.json();
        logSuccess('Site validado com sucesso!');
        log(`🌐 Site: ${siteResult.siteUrl}`, 'blue');
        log(`📊 Status: ${siteResult.status}`, 'blue');
      } else {
        logWarning('Validação de site falhou - continuando com teste...');
      }
    } catch (error) {
      logWarning(`Erro na validação de site: ${error.message}`);
    }

    // Passo 5: Simular processo completo
    logStep('5', 'Simulando processo completo de criação de página...');
    
    const fullProcessData = {
      jsonData: testData,
      siteUrl: 'https://atlz.online/',
      action: 'create_page',
      options: {
        publish: true,
        addSeo: true,
        addAcfFields: true,
        notifyOnComplete: true
      }
    };

    try {
      const processResponse = await fetch(`${CMS_URL}/api/pressel/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullProcessData)
      });

      if (processResponse.ok) {
        const processResult = await processResponse.json();
        logSuccess('Processo completo executado!');
        log(`📋 Resultado: ${JSON.stringify(processResult, null, 2)}`, 'blue');
        
        if (processResult.pageUrl) {
          log(`🔗 URL da página criada: ${processResult.pageUrl}`, 'green');
        }
      } else {
        const errorText = await processResponse.text();
        logError(`Erro no processo: ${processResponse.status} - ${errorText}`);
      }
    } catch (error) {
      logError(`Erro no processo completo: ${error.message}`);
    }

    log('\n' + '=' .repeat(60), 'blue');
    log('🎉 Teste de Upload de JSON Concluído!', 'bright');
    log('📝 Verifique os logs acima para detalhes dos resultados', 'yellow');

  } catch (error) {
    logError(`Erro geral no teste: ${error.message}`);
    log('💡 Verifique se todos os serviços estão rodando corretamente', 'yellow');
  }
}

// Executar teste
if (require.main === module) {
  testJsonUpload();
}

module.exports = { testJsonUpload };








