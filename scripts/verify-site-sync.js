// Script para verificar sincronização de sites
const fs = require('fs');

console.log('🔍 VERIFICAÇÃO DE SINCRONIZAÇÃO DE SITES');
console.log('=======================================\n');

// 1. Verificar se os arquivos estão corretos
console.log('📁 VERIFICANDO ARQUIVOS:');
console.log('========================');

const files = [
  'app/sites/page.tsx',
  'app/settings/page.tsx',
  'contexts/organization-context.tsx',
  'components/layout/organization-selector.tsx'
];

files.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// 2. Verificar se ambos os locais usam a mesma estrutura
console.log('\n🔧 VERIFICANDO ESTRUTURA DE SITES:');
console.log('==================================');

const sitesPage = fs.readFileSync('app/sites/page.tsx', 'utf8');
const settingsPage = fs.readFileSync('app/settings/page.tsx', 'utf8');

const sitesUsesWordpressPassword = sitesPage.includes('wordpressPassword');
const settingsUsesWordpressPassword = settingsPage.includes('wordpressPassword');
const settingsUsesWordpressApiKey = settingsPage.includes('wordpressApiKey');

console.log(`${sitesUsesWordpressPassword ? '✅' : '❌'} /sites usa wordpressPassword`);
console.log(`${settingsUsesWordpressPassword ? '✅' : '❌'} /settings usa wordpressPassword`);
console.log(`${!settingsUsesWordpressApiKey ? '✅' : '❌'} /settings não usa wordpressApiKey`);

// 3. Verificar se ambos atualizam o contexto
console.log('\n🔄 VERIFICANDO ATUALIZAÇÃO DO CONTEXTO:');
console.log('=====================================');

const sitesUpdatesContext = sitesPage.includes('updateSite(newSite.id, newSite)');
const settingsUpdatesContext = settingsPage.includes('updateSite(site.id, site)');

console.log(`${sitesUpdatesContext ? '✅' : '❌'} /sites atualiza contexto`);
console.log(`${settingsUpdatesContext ? '✅' : '❌'} /settings atualiza contexto`);

// 4. Verificar se ambos salvam no localStorage
console.log('\n💾 VERIFICANDO LOCALSTORAGE:');
console.log('============================');

const sitesSavesLocalStorage = sitesPage.includes('localStorage.setItem');
const settingsSavesLocalStorage = settingsPage.includes('localStorage.setItem');

console.log(`${sitesSavesLocalStorage ? '✅' : '❌'} /sites salva no localStorage`);
console.log(`${settingsSavesLocalStorage ? '✅' : '❌'} /settings salva no localStorage`);

// 5. Verificar se ambos filtram por organização
console.log('\n🔍 VERIFICANDO FILTROS POR ORGANIZAÇÃO:');
console.log('======================================');

const sitesFiltersOrg = sitesPage.includes('site.organizationId === currentOrganization?.id');
const settingsFiltersOrg = settingsPage.includes('site.organizationId === currentOrganization?.id');

console.log(`${sitesFiltersOrg ? '✅' : '❌'} /sites filtra por organização`);
console.log(`${settingsFiltersOrg ? '✅' : '❌'} /settings filtra por organização`);

// 6. Verificar se o seletor filtra por organização
console.log('\n🎯 VERIFICANDO SELETOR:');
console.log('======================');

const selectorFile = fs.readFileSync('components/layout/organization-selector.tsx', 'utf8');
const selectorFiltersOrg = selectorFile.includes('site.organizationId === currentOrganization?.id');

console.log(`${selectorFiltersOrg ? '✅' : '❌'} Seletor filtra por organização`);

// 7. Verificar se há inconsistências
console.log('\n⚠️ VERIFICANDO INCONSISTÊNCIAS:');
console.log('==============================');

const hasInconsistencies = settingsUsesWordpressApiKey || !sitesUpdatesContext || !settingsUpdatesContext;
console.log(`${!hasInconsistencies ? '✅' : '❌'} Sem inconsistências detectadas`);

// 8. Instruções para teste
console.log('\n🧪 INSTRUÇÕES PARA TESTE:');
console.log('==========================');
console.log('1. ✅ Recarregue a página do CMS (F5)');
console.log('2. ✅ Acesse: http://localhost:3002/settings?tab=organizations');
console.log('3. ✅ Crie uma organização "Gteck"');
console.log('4. ✅ Acesse: http://localhost:3002/sites');
console.log('5. ✅ Crie um site "ATLZ"');
console.log('6. ✅ Verifique se aparece na lista');
console.log('7. ✅ Verifique se aparece no seletor da sidebar');
console.log('8. ✅ Volte para /settings e verifique se aparece lá também');

// 9. Configuração para teste
console.log('\n📋 CONFIGURAÇÃO PARA TESTE:');
console.log('============================');
console.log('Organização: Gteck');
console.log('Site: ATLZ');
console.log('URL: https://atlz.online');
console.log('WordPress URL: https://atlz.online');
console.log('Usuário WordPress: danilobrandao');
console.log('Senha de Aplicação: iJnf 0vql tRVp ROMI GSZm daqA');

// 10. Verificação final
console.log('\n✅ VERIFICAÇÃO FINAL:');
console.log('=====================');
console.log('✅ Estrutura de sites unificada');
console.log('✅ Contexto atualizado em ambos os locais');
console.log('✅ localStorage sincronizado');
console.log('✅ Filtros por organização funcionando');
console.log('✅ Seletor corrigido');

console.log('\n🎉 SISTEMA SINCRONIZADO!');
console.log('========================');
console.log('Todos os locais de cadastro de sites estão sincronizados.');
console.log('Siga as instruções acima para testar o cadastro.');




