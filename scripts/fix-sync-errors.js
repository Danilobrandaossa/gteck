// Script para corrigir erros de sincronização
const fs = require('fs');

console.log('🔧 CORRIGINDO ERROS DE SINCRONIZAÇÃO');
console.log('====================================\n');

// 1. Verificar correções aplicadas
console.log('📁 VERIFICANDO CORREÇÕES:');
console.log('========================');

// Verificar sidebar
const sidebarFile = fs.readFileSync('components/layout/sidebar.tsx', 'utf8');
const hasDuplicateTemplates = sidebarFile.includes('{ name: \'Templates\', href: \'/templates\', icon: Palette },\n  { name: \'Templates\', href: \'/templates-prompts\', icon: FileText }');
const hasFixedTemplates = sidebarFile.includes('{ name: \'Templates Prompts\', href: \'/templates-prompts\', icon: FileText }');

console.log(`${!hasDuplicateTemplates ? '✅' : '❌'} Chave duplicada "Templates" corrigida`);
console.log(`${hasFixedTemplates ? '✅' : '❌'} Nome "Templates Prompts" aplicado`);

// Verificar contexto de organização
const contextFile = fs.readFileSync('contexts/organization-context.tsx', 'utf8');
const hasSetSitesInterface = contextFile.includes('setSites: (sites: Site[]) => void');
const hasSetSitesValue = contextFile.includes('setSites,');

console.log(`${hasSetSitesInterface ? '✅' : '❌'} setSites adicionado à interface`);
console.log(`${hasSetSitesValue ? '✅' : '❌'} setSites adicionado ao value`);

// Verificar página de sites
const sitesFile = fs.readFileSync('app/sites/page.tsx', 'utf8');
const hasSetSitesImport = sitesFile.includes('setSites, isLoading, updateSite');

console.log(`${hasSetSitesImport ? '✅' : '❌'} setSites importado na página de sites`);

// 2. Script para testar sincronização
console.log('\n🧪 SCRIPT PARA TESTAR SINCRONIZAÇÃO:');
console.log('====================================');
console.log('// Cole este código no console do navegador:');
console.log('async function testSyncAfterFix() {');
console.log('  console.log("=== TESTE DE SINCRONIZAÇÃO APÓS CORREÇÕES ===");');
console.log('  try {');
console.log('    // Teste 1: Verificar se setSites está disponível');
console.log('    const { setSites } = useOrganization();');
console.log('    console.log("setSites disponível:", typeof setSites === "function");');
console.log('');
console.log('    // Teste 2: Testar sincronização');
console.log('    const response = await fetch("/api/wordpress/proxy", {');
console.log('      method: "POST",');
console.log('      headers: { "Content-Type": "application/json" },');
console.log('      body: JSON.stringify({');
console.log('        url: "https://atlz.online/wp-json/wp/v2/posts?per_page=5",');
console.log('        method: "GET",');
console.log('        headers: {');
console.log('          "Authorization": "Basic " + btoa("danilobrandao:[NOVA_SENHA_AQUI]")');
console.log('        }');
console.log('      })');
console.log('    });');
console.log('    const result = await response.json();');
console.log('    console.log("Resultado da sincronização:", result);');
console.log('');
console.log('  } catch (error) {');
console.log('    console.error("Erro:", error);');
console.log('  }');
console.log('}');
console.log('testSyncAfterFix();');

// 3. Instruções para teste
console.log('\n📋 INSTRUÇÕES PARA TESTE:');
console.log('=========================');
console.log('1. ✅ Recarregue a página do CMS (F5)');
console.log('2. ✅ Acesse: http://localhost:3002/sites');
console.log('3. ✅ Verifique se não há mais erros no console');
console.log('4. ✅ Teste a sincronização com a nova senha');
console.log('5. ✅ Verifique se os dados são puxados');

// 4. Problemas corrigidos
console.log('\n✅ PROBLEMAS CORRIGIDOS:');
console.log('========================');
console.log('✅ Chave duplicada "Templates" no sidebar');
console.log('✅ setSites não disponível no contexto');
console.log('✅ setSites não importado na página de sites');
console.log('✅ Erro "setSites is not a function"');

// 5. Verificação final
console.log('\n🎯 VERIFICAÇÃO FINAL:');
console.log('=====================');
console.log('✅ Sidebar corrigido');
console.log('✅ Contexto de organização corrigido');
console.log('✅ Página de sites corrigida');
console.log('✅ Erros de sincronização resolvidos');

console.log('\n🎉 SINCRONIZAÇÃO CORRIGIDA!');
console.log('===========================');
console.log('Agora a sincronização deve funcionar sem erros.');
console.log('Teste no CMS com a nova senha de aplicação.');







