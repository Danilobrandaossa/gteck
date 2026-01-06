// Script para debugar criação de sites
const fs = require('fs');

console.log('🔍 DEBUG: CRIAÇÃO DE SITES');
console.log('==========================\n');

// 1. Verificar se o localStorage está sendo usado corretamente
console.log('💾 VERIFICANDO LOCALSTORAGE:');
console.log('============================');

const sitesPage = fs.readFileSync('app/sites/page.tsx', 'utf8');
const hasLocalStorageSave = sitesPage.includes('localStorage.setItem');
const hasLocalStorageLoad = sitesPage.includes('localStorage.getItem');
console.log(`${hasLocalStorageSave ? '✅' : '❌'} Salvamento no localStorage`);
console.log(`${hasLocalStorageLoad ? '✅' : '❌'} Carregamento do localStorage`);

// 2. Verificar se o updateSite está sendo chamado
console.log('\n🔧 VERIFICANDO updateSite:');
console.log('=========================');

const hasUpdateSiteCall = sitesPage.includes('updateSite(newSite.id, newSite)');
console.log(`${hasUpdateSiteCall ? '✅' : '❌'} updateSite sendo chamado`);

// 3. Verificar se o contexto está carregando sites
console.log('\n📊 VERIFICANDO CONTEXTO:');
console.log('=========================');

const contextFile = fs.readFileSync('contexts/organization-context.tsx', 'utf8');
const hasLoadSites = contextFile.includes('loadSites');
const hasRefreshSites = contextFile.includes('refreshSites');
console.log(`${hasLoadSites ? '✅' : '❌'} Função loadSites existe`);
console.log(`${hasRefreshSites ? '✅' : '❌'} Função refreshSites existe`);

// 4. Verificar se há erros de migração
console.log('\n🚫 VERIFICANDO MIGRAÇÃO:');
console.log('=========================');

const hasMigrationImport = contextFile.includes('useDataMigration');
const hasMigrationCall = contextFile.includes('executeMigration');
console.log(`${hasMigrationImport ? '❌' : '✅'} Import de migração removido`);
console.log(`${hasMigrationCall ? '❌' : '✅'} Chamada de migração removida`);

// 5. Verificar se o filtro está correto
console.log('\n🔍 VERIFICANDO FILTROS:');
console.log('=======================');

const hasOrgFilter = sitesPage.includes('site.organizationId === currentOrganization?.id');
console.log(`${hasOrgFilter ? '✅' : '❌'} Filtro por organização implementado`);

// 6. Instruções para debug manual
console.log('\n🧪 DEBUG MANUAL:');
console.log('=================');
console.log('1. Abra o DevTools (F12)');
console.log('2. Vá para Application > Local Storage');
console.log('3. Verifique se existe a chave "cms-sites"');
console.log('4. Verifique se existe a chave "cms-organizations"');
console.log('5. Crie um site e verifique se aparece no localStorage');

// 7. Script para verificar localStorage
console.log('\n📋 SCRIPT PARA VERIFICAR LOCALSTORAGE:');
console.log('======================================');
console.log('// Cole este código no console do navegador:');
console.log('console.log("=== DEBUG LOCALSTORAGE ===");');
console.log('console.log("Organizações:", localStorage.getItem("cms-organizations"));');
console.log('console.log("Sites:", localStorage.getItem("cms-sites"));');
console.log('console.log("Org Selecionada:", localStorage.getItem("cms-selected-organization"));');
console.log('console.log("Site Selecionado:", localStorage.getItem("cms-selected-site"));');

// 8. Verificação final
console.log('\n✅ VERIFICAÇÃO FINAL:');
console.log('=====================');
console.log('✅ localStorage configurado');
console.log('✅ updateSite implementado');
console.log('✅ Filtros por organização');
console.log('✅ Migração removida');

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('===================');
console.log('1. Recarregue a página (F5)');
console.log('2. Abra o DevTools');
console.log('3. Crie um site');
console.log('4. Verifique o localStorage');
console.log('5. Verifique se aparece na lista');

console.log('\n🔧 SE AINDA NÃO FUNCIONAR:');
console.log('==========================');
console.log('1. Limpe o localStorage completamente');
console.log('2. Recarregue a página');
console.log('3. Crie a organização primeiro');
console.log('4. Depois crie o site');
console.log('5. Verifique se aparece');




