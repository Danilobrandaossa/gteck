/**
 * Monitor de Logs em Tempo Real - Pressel Automation
 * Monitora logs de erro e processo em tempo real
 */

const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(process.cwd(), 'logs', 'pressel-automation');

function monitorLogs() {
  console.log('🔍 MONITOR DE LOGS EM TEMPO REAL - PRESSEL AUTOMATION');
  console.log('====================================================\n');

  console.log('📁 Diretório de logs:', LOGS_DIR);
  console.log('⏰ Iniciando monitoramento...\n');

  // Verificar se os arquivos de log existem
  const errorLogPath = path.join(LOGS_DIR, 'errors.log');
  const processLogPath = path.join(LOGS_DIR, 'process.log');
  const validationLogPath = path.join(LOGS_DIR, 'validation.log');

  if (!fs.existsSync(errorLogPath)) {
    console.log('⚠️ Arquivo de log de erros não encontrado. Criando...');
    fs.writeFileSync(errorLogPath, '');
  }

  if (!fs.existsSync(processLogPath)) {
    console.log('⚠️ Arquivo de log de processo não encontrado. Criando...');
    fs.writeFileSync(processLogPath, '');
  }

  if (!fs.existsSync(validationLogPath)) {
    console.log('⚠️ Arquivo de log de validação não encontrado. Criando...');
    fs.writeFileSync(validationLogPath, '');
  }

  console.log('✅ Arquivos de log verificados');
  console.log('📊 Monitorando logs em tempo real...\n');

  // Função para formatar timestamp
  function formatTimestamp() {
    return new Date().toLocaleString('pt-BR');
  }

  // Função para obter emoji baseado no tipo de log
  function getLogEmoji(type) {
    switch (type) {
      case 'ERROR': return '🚨';
      case 'WARNING': return '⚠️';
      case 'SUCCESS': return '✅';
      case 'INFO': return 'ℹ️';
      default: return '📝';
    }
  }

  // Função para obter emoji baseado no código PS-
  function getErrorEmoji(code) {
    if (code.includes('PS-JSON')) return '📄';
    if (code.includes('PS-ACF')) return '🔧';
    if (code.includes('PS-WP')) return '🌐';
    if (code.includes('PS-SYS')) return '⚙️';
    if (code.includes('PS-MODEL')) return '🎯';
    if (code.includes('PS-VALIDATION')) return '✅';
    return '❓';
  }

  // Monitorar logs de erro
  console.log('🚨 MONITORANDO LOGS DE ERRO:');
  console.log('============================');
  
  const errorWatcher = fs.watchFile(errorLogPath, { interval: 1000 }, (curr, prev) => {
    if (curr.mtime > prev.mtime) {
      const content = fs.readFileSync(errorLogPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      const newLines = lines.slice(-5); // Últimas 5 linhas
      
      newLines.forEach(line => {
        if (line.includes('[PS-')) {
          const match = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z) \[([^\]]+)\] ([^:]+): (.+)/);
          if (match) {
            const [, timestamp, code, severity, message] = match;
            const emoji = getErrorEmoji(code);
            console.log(`${emoji} [${formatTimestamp()}] ${code} - ${message}`);
          }
        }
      });
    }
  });

  // Monitorar logs de processo
  console.log('\n📊 MONITORANDO LOGS DE PROCESSO:');
  console.log('================================');
  
  const processWatcher = fs.watchFile(processLogPath, { interval: 1000 }, (curr, prev) => {
    if (curr.mtime > prev.mtime) {
      const content = fs.readFileSync(processLogPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      const newLines = lines.slice(-3); // Últimas 3 linhas
      
      newLines.forEach(line => {
        if (line.includes('[') && line.includes(']')) {
          const match = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z) \[([^\]]+)\] ([^:]+): (.+)/);
          if (match) {
            const [, timestamp, step, status, message] = match;
            const emoji = getLogEmoji(status);
            console.log(`${emoji} [${formatTimestamp()}] ${step} - ${message}`);
          }
        }
      });
    }
  });

  // Monitorar logs de validação
  console.log('\n✅ MONITORANDO LOGS DE VALIDAÇÃO:');
  console.log('==================================');
  
  const validationWatcher = fs.watchFile(validationLogPath, { interval: 1000 }, (curr, prev) => {
    if (curr.mtime > prev.mtime) {
      const content = fs.readFileSync(validationLogPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      const newLines = lines.slice(-3); // Últimas 3 linhas
      
      newLines.forEach(line => {
        if (line.includes('[') && line.includes(']')) {
          const match = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z) \[([^\]]+)\] ([^:]+): (.+)/);
          if (match) {
            const [, timestamp, field, severity, message] = match;
            const emoji = getLogEmoji(severity);
            console.log(`${emoji} [${formatTimestamp()}] ${field} - ${message}`);
          }
        }
      });
    }
  });

  console.log('\n🎯 MONITORAMENTO ATIVO!');
  console.log('=======================');
  console.log('📝 Os logs serão exibidos em tempo real conforme os erros acontecem');
  console.log('🔄 Para parar o monitoramento, pressione Ctrl+C');
  console.log('📊 Teste o sistema executando: node scripts/test-error-codes.js\n');

  // Manter o processo rodando
  process.on('SIGINT', () => {
    console.log('\n🛑 Parando monitoramento de logs...');
    fs.unwatchFile(errorLogPath);
    fs.unwatchFile(processLogPath);
    fs.unwatchFile(validationLogPath);
    console.log('✅ Monitoramento finalizado');
    process.exit(0);
  });

  // Mostrar estatísticas a cada 30 segundos
  setInterval(() => {
    const errorContent = fs.readFileSync(errorLogPath, 'utf8');
    const processContent = fs.readFileSync(processLogPath, 'utf8');
    const validationContent = fs.readFileSync(validationLogPath, 'utf8');
    
    const errorCount = errorContent.split('\n').filter(line => line.trim()).length;
    const processCount = processContent.split('\n').filter(line => line.trim()).length;
    const validationCount = validationContent.split('\n').filter(line => line.trim()).length;
    
    console.log(`\n📊 ESTATÍSTICAS [${formatTimestamp()}]:`);
    console.log(`   🚨 Erros: ${errorCount}`);
    console.log(`   📊 Processos: ${processCount}`);
    console.log(`   ✅ Validações: ${validationCount}`);
  }, 30000);
}

monitorLogs();





