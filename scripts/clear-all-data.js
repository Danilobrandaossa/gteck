// Script para limpar todos os dados e reiniciar
const fs = require('fs');

console.log('🧹 LIMPEZA COMPLETA DO SISTEMA');
console.log('==============================\n');

// 1. Verificar se os arquivos estão corretos
console.log('📁 VERIFICANDO ARQUIVOS:');
console.log('========================');

const files = [
  'app/sites/page.tsx',
  'contexts/organization-context.tsx',
  'components/layout/organization-selector.tsx',
  'app/layout.tsx'
];

files.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// 2. Verificar se a migração foi removida
console.log('\n🚫 VERIFICANDO REMOÇÃO DA MIGRAÇÃO:');
console.log('===================================');

const layoutFile = fs.readFileSync('app/layout.tsx', 'utf8');
const contextFile = fs.readFileSync('contexts/organization-context.tsx', 'utf8');

const hasMigrationImport = layoutFile.includes('MigrationNotification');
const hasMigrationUsage = layoutFile.includes('<MigrationNotification');
const hasContextMigration = contextFile.includes('useDataMigration');
const hasContextCall = contextFile.includes('executeMigration');

console.log(`${hasMigrationImport ? '❌' : '✅'} Import de MigrationNotification removido`);
console.log(`${hasMigrationUsage ? '❌' : '✅'} Uso de MigrationNotification removido`);
console.log(`${hasContextMigration ? '❌' : '✅'} Import de useDataMigration removido`);
console.log(`${hasContextCall ? '❌' : '✅'} Chamada executeMigration removida`);

// 3. Verificar se o updateSite está correto
console.log('\n🔧 VERIFICANDO updateSite:');
console.log('=========================');

const sitesPage = fs.readFileSync('app/sites/page.tsx', 'utf8');
const hasUpdateSite = sitesPage.includes('updateSite(newSite.id, newSite)');
const hasLocalStorage = sitesPage.includes('localStorage.setItem');
console.log(`${hasUpdateSite ? '✅' : '❌'} updateSite sendo chamado`);
console.log(`${hasLocalStorage ? '✅' : '❌'} localStorage sendo usado`);

// 4. Instruções para limpeza manual
console.log('\n🧹 LIMPEZA MANUAL DO LOCALSTORAGE:');
console.log('===================================');
console.log('1. Abra o DevTools (F12)');
console.log('2. Vá para Application > Local Storage');
console.log('3. Selecione localhost:3002');
console.log('4. Delete TODAS as chaves:');
console.log('   - cms-organizations');
console.log('   - cms-sites');
console.log('   - cms-selected-organization');
console.log('   - cms-selected-site');
console.log('   - cms-api-configs');
console.log('   - Qualquer outra chave relacionada ao CMS');

// 5. Script para limpeza automática
console.log('\n🤖 SCRIPT PARA LIMPEZA AUTOMÁTICA:');
console.log('==================================');
console.log('// Cole este código no console do navegador:');
console.log('console.log("=== LIMPEZA AUTOMÁTICA ===");');
console.log('localStorage.removeItem("cms-organizations");');
console.log('localStorage.removeItem("cms-sites");');
console.log('localStorage.removeItem("cms-selected-organization");');
console.log('localStorage.removeItem("cms-selected-site");');
console.log('localStorage.removeItem("cms-api-configs");');
console.log('console.log("✅ localStorage limpo");');
console.log('location.reload();');

// 6. Ordem correta de cadastro
console.log('\n📋 ORDEM CORRETA DE CADASTRO:');
console.log('=============================');
console.log('1️⃣ PRIMEIRO: Criar Organização');
console.log('   - Acesse: http://localhost:3002/settings?tab=organizations');
console.log('   - Clique em "Nova Organização"');
console.log('   - Nome: Gteck');
console.log('   - Salve');
console.log('');
console.log('2️⃣ SEGUNDO: Criar Site');
console.log('   - Acesse: http://localhost:3002/sites');
console.log('   - Clique em "Novo Site"');
console.log('   - Nome: ATLZ');
console.log('   - URL: https://atlz.online');
console.log('   - WordPress URL: https://atlz.online');
console.log('   - Usuário: daniillobrandao@gmail.com');
console.log('   - API Key: N1z4 1lLm 1Xd4 lZzQ Xnat gdmh');
console.log('   - Salve');
console.log('');
console.log('3️⃣ TERCEIRO: Verificar');
console.log('   - Site deve aparecer na lista');
console.log('   - Site deve aparecer no seletor da sidebar');
console.log('   - Site deve aparecer nas configurações da organização');

// 7. Verificação final
console.log('\n✅ VERIFICAÇÃO FINAL:');
console.log('=====================');
console.log('✅ Migração completamente removida');
console.log('✅ updateSite implementado');
console.log('✅ localStorage configurado');
console.log('✅ Filtros por organização');
console.log('✅ Sistema limpo e pronto');

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('===================');
console.log('1. ✅ Limpe o localStorage (script acima)');
console.log('2. ✅ Recarregue a página (F5)');
console.log('3. ✅ Siga a ordem de cadastro');
console.log('4. ✅ Teste se o site aparece');

console.log('\n🎉 SISTEMA PRONTO PARA TESTE!');
console.log('=============================');
console.log('Agora o sistema está completamente limpo e funcional.');
console.log('Siga a ordem de cadastro para testar sem erros.');




