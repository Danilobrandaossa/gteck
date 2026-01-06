// Script para limpeza completa do sistema
const fs = require('fs');
const path = require('path');

console.log('🧹 LIMPEZA COMPLETA DO SISTEMA');
console.log('==============================\n');

// 1. Verificar arquivos problemáticos
console.log('📁 VERIFICANDO ARQUIVOS PROBLEMÁTICOS:');
console.log('=====================================');

const problematicFiles = [
  'contexts/site-context.tsx',
  'hooks/use-data-migration.ts',
  'components/migration-notification.tsx',
  'lib/data-migration.ts',
  'app/api/migrate-data/route.ts'
];

problematicFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`❌ ${file} - REMOVER`);
  } else {
    console.log(`✅ ${file} - NÃO EXISTE`);
  }
});

// 2. Verificar imports problemáticos
console.log('\n🔍 VERIFICANDO IMPORTS PROBLEMÁTICOS:');
console.log('=====================================');

const filesToCheck = [
  'app/layout.tsx',
  'contexts/organization-context.tsx',
  'app/sites/page.tsx',
  'app/settings/page.tsx'
];

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const hasMigrationImport = content.includes('MigrationNotification');
    const hasDataMigrationImport = content.includes('useDataMigration');
    const hasPrismaClient = content.includes('PrismaClient');
    
    console.log(`\n📄 ${file}:`);
    console.log(`  ${hasMigrationImport ? '❌' : '✅'} MigrationNotification`);
    console.log(`  ${hasDataMigrationImport ? '❌' : '✅'} useDataMigration`);
    console.log(`  ${hasPrismaClient ? '❌' : '✅'} PrismaClient`);
  }
});

// 3. Script para limpeza manual
console.log('\n🧪 SCRIPT PARA LIMPEZA MANUAL:');
console.log('==============================');
console.log('// Cole este código no console do navegador:');
console.log('console.log("=== LIMPEZA COMPLETA DO LOCALSTORAGE ===");');
console.log('');
console.log('// 1. Limpar todos os dados do CMS');
console.log('localStorage.removeItem("cms-organizations");');
console.log('localStorage.removeItem("cms-sites");');
console.log('localStorage.removeItem("cms-selected-organization");');
console.log('localStorage.removeItem("cms-selected-site");');
console.log('localStorage.removeItem("cms-migration-status");');
console.log('localStorage.removeItem("cms-has-local-data");');
console.log('');
console.log('// 2. Limpar dados de migração');
console.log('localStorage.removeItem("cms-migration-completed");');
console.log('localStorage.removeItem("cms-migration-error");');
console.log('');
console.log('// 3. Recarregar página');
console.log('location.reload();');
console.log('');
console.log('console.log("✅ Limpeza completa realizada!");');

// 4. Instruções para limpeza
console.log('\n📋 INSTRUÇÕES PARA LIMPEZA:');
console.log('============================');
console.log('1. ✅ Execute o script de limpeza acima');
console.log('2. ✅ Remova arquivos problemáticos');
console.log('3. ✅ Limpe imports desnecessários');
console.log('4. ✅ Recrie sistema do zero');

// 5. Arquivos para remover
console.log('\n🗑️ ARQUIVOS PARA REMOVER:');
console.log('=========================');
problematicFiles.forEach(file => {
  console.log(`- ${file}`);
});

// 6. Verificação final
console.log('\n✅ VERIFICAÇÃO FINAL:');
console.log('=====================');
console.log('✅ Script de limpeza criado');
console.log('✅ Arquivos problemáticos identificados');
console.log('✅ Instruções de limpeza fornecidas');

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('===================');
console.log('1. ✅ Execute a limpeza manual');
console.log('2. ✅ Remova arquivos problemáticos');
console.log('3. ✅ Limpe imports desnecessários');
console.log('4. ✅ Recrie sistema limpo');

console.log('\n🎉 LIMPEZA COMPLETA!');
console.log('====================');
console.log('Execute a limpeza para remover todos os códigos problemáticos.');













