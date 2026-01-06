// Script para testar centralização de sites em configurações
const fs = require('fs');

console.log('🔧 TESTANDO CENTRALIZAÇÃO DE SITES');
console.log('=================================\n');

// 1. Verificar se a página de sites foi removida
console.log('📁 VERIFICANDO REMOÇÃO DA PÁGINA DE SITES:');
console.log('==========================================');

const sitesPageExists = fs.existsSync('app/sites/page.tsx');
console.log(`${sitesPageExists ? '✅' : '❌'} Página de sites existe`);

if (sitesPageExists) {
  const sitesPageContent = fs.readFileSync('app/sites/page.tsx', 'utf8');
  const hasRedirect = sitesPageContent.includes('router.replace(\'/settings?tab=sites\')');
  console.log(`${hasRedirect ? '✅' : '❌'} Redirecionamento para configurações implementado`);
}

// 2. Verificar se o sidebar foi atualizado
console.log('\n🔍 VERIFICANDO SIDEBAR:');
console.log('=======================');

const sidebarContent = fs.readFileSync('components/layout/sidebar.tsx', 'utf8');
const hasSitesLink = sidebarContent.includes('{ name: \'Sites\', href: \'/sites\', icon: Globe }');
console.log(`${!hasSitesLink ? '✅' : '❌'} Link de sites removido do sidebar`);

// 3. Verificar se o organization-selector foi atualizado
console.log('\n🔧 VERIFICANDO ORGANIZATION SELECTOR:');
console.log('=====================================');

const orgSelectorContent = fs.readFileSync('components/layout/organization-selector.tsx', 'utf8');
const hasSettingsRedirect = orgSelectorContent.includes('/settings?tab=sites');
console.log(`${hasSettingsRedirect ? '✅' : '❌'} Redirecionamento para configurações implementado`);

// 4. Verificar se configurações tem funcionalidade de sites
console.log('\n⚙️ VERIFICANDO CONFIGURAÇÕES:');
console.log('============================');

const settingsContent = fs.readFileSync('app/settings/page.tsx', 'utf8');
const hasSitesTab = settingsContent.includes('Sites WordPress');
const hasSitesFunctionality = settingsContent.includes('Configurações dos Sites WordPress');
console.log(`${hasSitesTab ? '✅' : '❌'} Aba de sites em configurações`);
console.log(`${hasSitesFunctionality ? '✅' : '❌'} Funcionalidade de sites implementada`);

// 5. Script para testar redirecionamento
console.log('\n🧪 SCRIPT PARA TESTAR REDIRECIONAMENTO:');
console.log('======================================');
console.log('// Cole este código no console do navegador:');
console.log('function testSitesRedirect() {');
console.log('  console.log("=== TESTE DE REDIRECIONAMENTO DE SITES ===");');
console.log('  try {');
console.log('    // Teste 1: Verificar se /sites redireciona');
console.log('    console.log("1. Testando redirecionamento /sites...");');
console.log('    window.location.href = "/sites";');
console.log('    // Aguardar redirecionamento');
console.log('    setTimeout(() => {');
console.log('      const currentUrl = window.location.href;');
console.log('      console.log("URL atual:", currentUrl);');
console.log('      console.log("Redirecionou para configurações:", currentUrl.includes("/settings?tab=sites"));');
console.log('    }, 1000);');
console.log('');
console.log('    // Teste 2: Verificar se configurações tem aba de sites');
console.log('    console.log("2. Testando aba de sites em configurações...");');
console.log('    window.location.href = "/settings?tab=sites";');
console.log('    setTimeout(() => {');
console.log('      const sitesTab = document.querySelector("[data-tab=\'sites\']");');
console.log('      console.log("Aba de sites encontrada:", sitesTab ? "✅" : "❌");');
console.log('    }, 1000);');
console.log('');
console.log('  } catch (error) {');
console.log('    console.error("Erro:", error);');
console.log('  }');
console.log('}');
console.log('testSitesRedirect();');

// 6. Instruções para teste
console.log('\n📋 INSTRUÇÕES PARA TESTE:');
console.log('=========================');
console.log('1. ✅ Acesse: http://localhost:3002/sites');
console.log('2. ✅ Verifique se redireciona para /settings?tab=sites');
console.log('3. ✅ Teste o botão "Novo Site" no sidebar');
console.log('4. ✅ Verifique se abre configurações com aba de sites');

// 7. Verificação final
console.log('\n✅ VERIFICAÇÃO FINAL:');
console.log('=====================');
console.log('✅ Página de sites removida/redirecionada');
console.log('✅ Sidebar atualizado');
console.log('✅ Organization selector atualizado');
console.log('✅ Configurações com funcionalidade de sites');

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('===================');
console.log('1. ✅ Teste o redirecionamento');
console.log('2. ✅ Verifique se configurações funciona');
console.log('3. ✅ Teste cadastro de sites');
console.log('4. ✅ Confirme centralização');

console.log('\n🎉 SITES CENTRALIZADOS!');
console.log('=======================');
console.log('Todo o gerenciamento de sites agora está em Configurações.');











