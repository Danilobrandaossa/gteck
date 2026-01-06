#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 MONITORAMENTO EM TEMPO REAL DO CMS');
console.log('=====================================\n');

// Função para executar comandos
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

// Função para monitorar containers
async function monitorContainers() {
  try {
    console.log('📊 STATUS DOS CONTAINERS:');
    const stats = await runCommand('docker stats --no-stream --format "table {{.Container}}\t{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"');
    console.log(stats);
    console.log('');
  } catch (error) {
    console.error('❌ Erro ao obter stats dos containers:', error.message);
  }
}

// Função para monitorar logs do PostgreSQL
async function monitorPostgresLogs() {
  try {
    console.log('🐘 LOGS POSTGRESQL (últimas 5 linhas):');
    const logs = await runCommand('docker logs cms_postgres_dev --tail 5');
    console.log(logs);
    console.log('');
  } catch (error) {
    console.error('❌ Erro ao obter logs do PostgreSQL:', error.message);
  }
}

// Função para monitorar logs do Redis
async function monitorRedisLogs() {
  try {
    console.log('🔴 LOGS REDIS (últimas 3 linhas):');
    const logs = await runCommand('docker logs cms_redis_dev --tail 3');
    console.log(logs);
    console.log('');
  } catch (error) {
    console.error('❌ Erro ao obter logs do Redis:', error.message);
  }
}

// Função para verificar conexões de rede
async function monitorNetworkConnections() {
  try {
    console.log('🌐 CONEXÕES DE REDE (portas 3002, 5433, 6379, 5050):');
    const netstat = await runCommand('netstat -an | findstr ":3002\\|:5433\\|:6379\\|:5050"');
    console.log(netstat || 'Nenhuma conexão ativa encontrada');
    console.log('');
  } catch (error) {
    console.error('❌ Erro ao verificar conexões de rede:', error.message);
  }
}

// Função para verificar uso de memória do processo Node.js
async function monitorNodeProcess() {
  try {
    console.log('⚡ PROCESSOS NODE.JS (CMS):');
    const processes = await runCommand('tasklist | findstr node.exe');
    console.log(processes || 'Nenhum processo Node.js encontrado');
    console.log('');
  } catch (error) {
    console.error('❌ Erro ao verificar processos Node.js:', error.message);
  }
}

// Função para verificar arquivos de log do CMS
async function monitorCMSLogs() {
  try {
    console.log('📝 LOGS DO CMS:');
    const logFiles = ['logs/cms.log', 'logs/error.log', 'logs/access.log'];
    
    for (const logFile of logFiles) {
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        console.log(`📄 ${logFile}: ${(stats.size / 1024).toFixed(2)} KB, modificado em ${stats.mtime.toLocaleString()}`);
        
        // Mostrar últimas 3 linhas do log
        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        const lastLines = lines.slice(-3);
        if (lastLines.length > 0) {
          console.log('   Últimas linhas:');
          lastLines.forEach(line => console.log(`   ${line}`));
        }
      } else {
        console.log(`📄 ${logFile}: Arquivo não encontrado`);
      }
    }
    console.log('');
  } catch (error) {
    console.error('❌ Erro ao verificar logs do CMS:', error.message);
  }
}

// Função principal de monitoramento
async function startMonitoring() {
  console.log(`⏰ ${new Date().toLocaleString()} - Iniciando monitoramento...\n`);
  
  await monitorContainers();
  await monitorPostgresLogs();
  await monitorRedisLogs();
  await monitorNetworkConnections();
  await monitorNodeProcess();
  await monitorCMSLogs();
  
  console.log('🔄 Próxima verificação em 30 segundos...\n');
  console.log('=====================================\n');
}

// Iniciar monitoramento
startMonitoring();

// Configurar monitoramento contínuo
setInterval(startMonitoring, 30000); // A cada 30 segundos

// Capturar sinais de interrupção
process.on('SIGINT', () => {
  console.log('\n🛑 Monitoramento interrompido pelo usuário');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Monitoramento interrompido');
  process.exit(0);
});








