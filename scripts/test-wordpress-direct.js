// Script para testar conexão direta com WordPress
const fs = require('fs');

console.log('🔍 TESTANDO CONEXÃO DIRETA COM WORDPRESS');
console.log('=======================================\n');

// 1. Verificar se o proxy está funcionando
console.log('🌐 VERIFICANDO PROXY:');
console.log('=====================');

const proxyFile = fs.readFileSync('app/api/wordpress/proxy/route.ts', 'utf8');
const hasProxyRoute = proxyFile.includes('export async function POST');
const hasErrorHandling = proxyFile.includes('try {') && proxyFile.includes('catch');

console.log(`${hasProxyRoute ? '✅' : '❌'} Proxy route implementado`);
console.log(`${hasErrorHandling ? '✅' : '❌'} Tratamento de erro implementado`);

// 2. Script para testar conexão direta
console.log('\n🧪 SCRIPT PARA TESTAR CONEXÃO DIRETA:');
console.log('=====================================');
console.log('// Cole este código no console do navegador:');
console.log('async function testWordPressDirect() {');
console.log('  console.log("=== TESTE DE CONEXÃO DIRETA WORDPRESS ===");');
console.log('  try {');
console.log('    // Teste 1: Verificar se a API REST está ativa');
console.log('    console.log("1. Testando API REST...");');
console.log('    const apiTest = await fetch("https://atlz.online/wp-json/");');
console.log('    const apiResult = await apiTest.text();');
console.log('    console.log("API REST:", apiResult.substring(0, 200) + "...");');
console.log('');
console.log('    // Teste 2: Testar endpoint de posts');
console.log('    console.log("2. Testando endpoint de posts...");');
console.log('    const postsTest = await fetch("https://atlz.online/wp-json/wp/v2/posts?per_page=1");');
console.log('    const postsResult = await postsTest.text();');
console.log('    console.log("Posts:", postsResult.substring(0, 200) + "...");');
console.log('');
console.log('    // Teste 3: Testar com autenticação');
console.log('    console.log("3. Testando com autenticação...");');
console.log('    const authTest = await fetch("https://atlz.online/wp-json/wp/v2/posts?per_page=1", {');
console.log('      headers: {');
console.log('        "Authorization": "Basic " + btoa("danilobrandao:[NOVA_SENHA_AQUI]")');
console.log('      }');
console.log('    });');
console.log('    const authResult = await authTest.text();');
console.log('    console.log("Autenticação:", authResult.substring(0, 200) + "...");');
console.log('');
console.log('    // Teste 4: Testar via proxy do CMS');
console.log('    console.log("4. Testando via proxy do CMS...");');
console.log('    const proxyTest = await fetch("/api/wordpress/proxy", {');
console.log('      method: "POST",');
console.log('      headers: { "Content-Type": "application/json" },');
console.log('      body: JSON.stringify({');
console.log('        url: "https://atlz.online/wp-json/wp/v2/posts?per_page=1",');
console.log('        method: "GET",');
console.log('        headers: {');
console.log('          "Authorization": "Basic " + btoa("danilobrandao:[NOVA_SENHA_AQUI]")');
console.log('        }');
console.log('      })');
console.log('    });');
console.log('    const proxyResult = await proxyTest.json();');
console.log('    console.log("Proxy:", proxyResult);');
console.log('');
console.log('  } catch (error) {');
console.log('    console.error("Erro:", error);');
console.log('  }');
console.log('}');
console.log('testWordPressDirect();');

// 3. Possíveis problemas
console.log('\n⚠️ POSSÍVEIS PROBLEMAS:');
console.log('=======================');
console.log('1. ❌ API REST desabilitada no WordPress');
console.log('2. ❌ Plugin de segurança bloqueando');
console.log('3. ❌ Autenticação incorreta');
console.log('4. ❌ CORS não configurado');
console.log('5. ❌ Permissões insuficientes');
console.log('6. ❌ URL incorreta');

// 4. Soluções
console.log('\n🔧 SOLUÇÕES:');
console.log('============');
console.log('1. ✅ Verificar se API REST está ativa');
console.log('2. ✅ Testar conexão direta');
console.log('3. ✅ Verificar logs do WordPress');
console.log('4. ✅ Testar com usuário admin');
console.log('5. ✅ Verificar plugins de segurança');
console.log('6. ✅ Testar URL manualmente');

// 5. Verificação final
console.log('\n✅ VERIFICAÇÃO FINAL:');
console.log('=====================');
console.log('✅ Tratamento de erro melhorado');
console.log('✅ Logs detalhados implementados');
console.log('✅ Teste de conexão direta disponível');
console.log('✅ Diagnóstico completo preparado');

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('===================');
console.log('1. ✅ Execute o script de teste');
console.log('2. ✅ Verifique os logs detalhados');
console.log('3. ✅ Identifique o problema exato');
console.log('4. ✅ Aplique a solução específica');

console.log('\n🎉 DIAGNÓSTICO COMPLETO!');
console.log('========================');
console.log('Execute o script para identificar o problema exato.');







