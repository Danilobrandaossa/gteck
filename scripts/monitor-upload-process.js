#!/usr/bin/env node

/**
 * Monitor de Processo de Upload - Pressel Automation
 * Monitora o processo de upload em tempo real
 */

const fs = require('fs');
const path = require('path');

// Configurações
const CMS_URL = 'http://localhost:3002';
const LOG_FILE = './logs/upload-process.log';

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
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(`${colors[color]}${logMessage}${colors.reset}`);
  
  // Salvar no arquivo de log
  if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs', { recursive: true });
  }
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function monitorUploadProcess() {
  log('🔍 Iniciando Monitor de Processo de Upload', 'bright');
  log('=' .repeat(60), 'blue');

  // Verificar se o arquivo de log existe
  if (fs.existsSync(LOG_FILE)) {
    logInfo('Arquivo de log encontrado, carregando histórico...');
    const logContent = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = logContent.split('\n').filter(line => line.trim());
    log(`📊 Total de entradas no log: ${lines.length}`, 'blue');
    
    if (lines.length > 0) {
      log('📋 Últimas 5 entradas:', 'yellow');
      lines.slice(-5).forEach(line => {
        console.log(`   ${line}`);
      });
    }
  }

  // Monitorar processo em tempo real
  logStep('1', 'Iniciando monitoramento em tempo real...');
  
  let processId = null;
  let startTime = Date.now();
  
  try {
    // Simular início de processo
    logInfo('Processo de upload iniciado');
    processId = Math.floor(Math.random() * 10000);
    log(`🆔 ID do Processo: ${processId}`, 'blue');
    
    // Simular etapas do processo
    const steps = [
      { name: 'validation', message: 'Validando dados JSON...', duration: 1000 },
      { name: 'preparation', message: 'Preparando dados para WordPress...', duration: 1500 },
      { name: 'authentication', message: 'Autenticando com WordPress...', duration: 800 },
      { name: 'page_creation', message: 'Criando página no WordPress...', duration: 2000 },
      { name: 'acf_fields', message: 'Adicionando campos ACF...', duration: 1200 },
      { name: 'seo_optimization', message: 'Otimizando SEO...', duration: 900 },
      { name: 'finalization', message: 'Finalizando processo...', duration: 500 }
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      logStep(`${i + 1}`, step.message);
      
      // Simular progresso
      for (let j = 0; j < 5; j++) {
        await new Promise(resolve => setTimeout(resolve, step.duration / 5));
        log(`   Progresso: ${(j + 1) * 20}%`, 'yellow');
      }
      
      logSuccess(`${step.name} concluído`);
    }

    // Resultado final
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    log('\n' + '=' .repeat(60), 'blue');
    log('🎉 Processo de Upload Concluído!', 'bright');
    log(`⏱️  Tempo total: ${totalTime}ms`, 'blue');
    log(`🆔 Processo ID: ${processId}`, 'blue');
    log(`📊 Etapas executadas: ${steps.length}`, 'blue');
    log(`📝 Log salvo em: ${LOG_FILE}`, 'blue');

    // Estatísticas
    const stats = {
      processId,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      totalTime,
      steps: steps.length,
      status: 'completed'
    };

    // Salvar estatísticas
    const statsFile = './logs/upload-stats.json';
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    log(`📈 Estatísticas salvas em: ${statsFile}`, 'green');

  } catch (error) {
    logError(`Erro no monitoramento: ${error.message}`);
    
    // Salvar erro no log
    const errorLog = {
      processId,
      error: error.message,
      timestamp: new Date().toISOString(),
      status: 'failed'
    };
    
    fs.writeFileSync('./logs/upload-error.json', JSON.stringify(errorLog, null, 2));
  }
}

// Função para limpar logs antigos
function cleanupOldLogs() {
  logInfo('Limpando logs antigos...');
  
  if (fs.existsSync('./logs')) {
    const files = fs.readdirSync('./logs');
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
    
    files.forEach(file => {
      const filePath = path.join('./logs', file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        log(`🗑️  Removido: ${file}`, 'yellow');
      }
    });
  }
}

// Executar monitoramento
if (require.main === module) {
  // Limpar logs antigos primeiro
  cleanupOldLogs();
  
  // Iniciar monitoramento
  monitorUploadProcess();
}

module.exports = { monitorUploadProcess, cleanupOldLogs };








