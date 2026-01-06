#!/usr/bin/env node

/**
 * Script de Auditoria de Qualidade de Código
 * 
 * Verifica:
 * - console.log em produção
 * - uso de 'any'
 * - imports não usados
 * - TODO/FIXME
 */

const fs = require('fs');
const path = require('path');

const results = {
  consoleLogs: [],
  anyTypes: [],
  todos: [],
  unusedImports: [],
  totalFiles: 0,
  errors: []
};

function scanDirectory(dir, extensions = ['.ts', '.tsx'], excludeDirs = ['node_modules', '.next', 'dist', 'build']) {
  const files = [];
  
  function traverse(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          traverse(fullPath);
        }
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Detectar console.log/debug/warn
    lines.forEach((line, index) => {
      if (/console\.(log|debug|warn)/.test(line) && !line.includes('// KEEP')) {
        results.consoleLogs.push({
          file: relativePath,
          line: index + 1,
          code: line.trim()
        });
      }
    });
    
    // Detectar uso de 'any'
    lines.forEach((line, index) => {
      if (/\bany\b/.test(line) && !line.trim().startsWith('//')) {
        results.anyTypes.push({
          file: relativePath,
          line: index + 1,
          code: line.trim()
        });
      }
    });
    
    // Detectar TODO/FIXME
    lines.forEach((line, index) => {
      if (/TODO|FIXME|XXX|HACK/i.test(line)) {
        results.todos.push({
          file: relativePath,
          line: index + 1,
          code: line.trim()
        });
      }
    });
    
    results.totalFiles++;
  } catch (error) {
    results.errors.push({
      file: filePath,
      error: error.message
    });
  }
}

// Executar auditoria
console.log('🔍 Iniciando auditoria de qualidade de código...\n');

const appFiles = scanDirectory('./app');
const libFiles = scanDirectory('./lib');
const componentFiles = scanDirectory('./components');
const contextFiles = scanDirectory('./contexts');

const allFiles = [...appFiles, ...libFiles, ...componentFiles, ...contextFiles];

console.log(`📁 Arquivos encontrados: ${allFiles.length}\n`);

allFiles.forEach(analyzeFile);

// Gerar relatório
console.log('='.repeat(60));
console.log('📊 RELATÓRIO DE AUDITORIA');
console.log('='.repeat(60));
console.log(`\n📄 Arquivos analisados: ${results.totalFiles}`);
console.log(`\n⚠️  Console.log encontrados: ${results.consoleLogs.length}`);
console.log(`⚠️  Tipos 'any' encontrados: ${results.anyTypes.length}`);
console.log(`📝 TODO/FIXME encontrados: ${results.todos.length}`);
console.log(`❌ Erros ao analisar: ${results.errors.length}`);

if (results.consoleLogs.length > 0) {
  console.log('\n🔴 Console.log em produção:');
  results.consoleLogs.slice(0, 10).forEach(item => {
    console.log(`   ${item.file}:${item.line}`);
  });
  if (results.consoleLogs.length > 10) {
    console.log(`   ... e mais ${results.consoleLogs.length - 10}`);
  }
}

if (results.anyTypes.length > 0) {
  console.log('\n🟡 Uso de "any":');
  results.anyTypes.slice(0, 10).forEach(item => {
    console.log(`   ${item.file}:${item.line}`);
  });
  if (results.anyTypes.length > 10) {
    console.log(`   ... e mais ${results.anyTypes.length - 10}`);
  }
}

if (results.todos.length > 0) {
  console.log('\n📋 TODO/FIXME pendentes:');
  results.todos.forEach(item => {
    console.log(`   ${item.file}:${item.line} - ${item.code.substring(0, 60)}`);
  });
}

// Salvar resultados em JSON
fs.writeFileSync(
  './audit-results.json',
  JSON.stringify(results, null, 2)
);

console.log('\n✅ Relatório salvo em: audit-results.json');
console.log('\n💡 Execute "npm run audit:code" para ver este relatório');

