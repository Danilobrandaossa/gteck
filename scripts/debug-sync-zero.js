// Script para debugar sincronização retornando zero
const fs = require('fs');

console.log('🔍 DEBUGANDO SINCRONIZAÇÃO RETORNANDO ZERO');
console.log('==========================================\n');

// 1. Verificar se o proxy está funcionando
console.log('🌐 VERIFICANDO PROXY:');
console.log('=====================');

const proxyFile = fs.readFileSync('app/api/wordpress/proxy/route.ts', 'utf8');
const hasProxyRoute = proxyFile.includes('export async function POST');
const hasErrorHandling = proxyFile.includes('try {') && proxyFile.includes('catch');

console.log(`${hasProxyRoute ? '✅' : '❌'} Proxy route implementado`);
console.log(`${hasErrorHandling ? '✅' : '❌'} Tratamento de erro implementado`);

// 2. Verificar se a API está sendo chamada corretamente
console.log('\n🔧 VERIFICANDO API:');
console.log('==================');

const wordpressApiFile = fs.readFileSync('lib/wordpress-api.ts', 'utf8');
const usesProxy = wordpressApiFile.includes('/api/wordpress/proxy');
const hasGetTotalCount = wordpressApiFile.includes('getTotalCount');

console.log(`${usesProxy ? '✅' : '❌'} Usa proxy para chamadas`);
console.log(`${hasGetTotalCount ? '✅' : '❌'} Função getTotalCount implementada`);

// 3. Script para testar sincronização passo a passo
console.log('\n🧪 SCRIPT PARA DEBUGAR SINCRONIZAÇÃO:');
console.log('=====================================');
console.log('// Cole este código no console do navegador:');
console.log('async function debugSyncZero() {');
console.log('  console.log("=== DEBUG SINCRONIZAÇÃO RETORNANDO ZERO ===");');
console.log('  try {');
console.log('    // Teste 1: Verificar se a API REST está ativa');
console.log('    console.log("1. Testando API REST...");');
console.log('    const apiTest = await fetch("https://atlz.online/wp-json/");');
console.log('    const apiResult = await apiTest.text();');
console.log('    console.log("API REST:", apiResult.substring(0, 200) + "...");');
console.log('');
console.log('    // Teste 2: Testar endpoint de posts sem autenticação');
console.log('    console.log("2. Testando posts sem autenticação...");');
console.log('    const postsTest = await fetch("https://atlz.online/wp-json/wp/v2/posts?per_page=5");');
console.log('    const postsResult = await postsTest.text();');
console.log('    console.log("Posts sem auth:", postsResult.substring(0, 200) + "...");');
console.log('');
console.log('    // Teste 3: Testar endpoint de posts com autenticação');
console.log('    console.log("3. Testando posts com autenticação...");');
console.log('    const authTest = await fetch("https://atlz.online/wp-json/wp/v2/posts?per_page=5", {');
console.log('      headers: {');
console.log('        "Authorization": "Basic " + btoa("danilobrandao:iJnf 0vql tRVp ROMI GSZm daqA")');
console.log('      }');
console.log('    });');
console.log('    const authResult = await authTest.text();');
console.log('    console.log("Posts com auth:", authResult.substring(0, 200) + "...");');
console.log('');
console.log('    // Teste 4: Testar via proxy do CMS');
console.log('    console.log("4. Testando via proxy do CMS...");');
console.log('    const proxyTest = await fetch("/api/wordpress/proxy", {');
console.log('      method: "POST",');
console.log('      headers: { "Content-Type": "application/json" },');
console.log('      body: JSON.stringify({');
console.log('        url: "https://atlz.online/wp-json/wp/v2/posts?per_page=5",');
console.log('        method: "GET",');
console.log('        headers: {');
console.log('          "Authorization": "Basic " + btoa("danilobrandao:iJnf 0vql tRVp ROMI GSZm daqA")');
console.log('        }');
console.log('      })');
console.log('    });');
console.log('    const proxyResult = await proxyTest.json();');
console.log('    console.log("Proxy resultado:", proxyResult);');
console.log('');
console.log('    // Teste 5: Verificar se há dados reais');
console.log('    if (proxyResult.success) {');
console.log('      const data = JSON.parse(proxyResult.data);');
console.log('      console.log("Dados encontrados:", data.length);');
console.log('      console.log("Primeiro item:", data[0]);');
console.log('    } else {');
console.log('      console.log("Erro no proxy:", proxyResult.error);');
console.log('    }');
console.log('');
console.log('    // Teste 6: Testar outros endpoints');
console.log('    console.log("6. Testando páginas...");');
console.log('    const pagesTest = await fetch("/api/wordpress/proxy", {');
console.log('      method: "POST",');
console.log('      headers: { "Content-Type": "application/json" },');
console.log('      body: JSON.stringify({');
console.log('        url: "https://atlz.online/wp-json/wp/v2/pages?per_page=5",');
console.log('        method: "GET",');
console.log('        headers: {');
console.log('          "Authorization": "Basic " + btoa("danilobrandao:iJnf 0vql tRVp ROMI GSZm daqA")');
console.log('        }');
console.log('      })');
console.log('    });');
console.log('    const pagesResult = await pagesTest.json();');
console.log('    console.log("Páginas resultado:", pagesResult);');
console.log('');
console.log('  } catch (error) {');
console.log('    console.error("Erro:", error);');
console.log('  }');
console.log('}');
console.log('debugSyncZero();');

// 4. Possíveis problemas
console.log('\n⚠️ POSSÍVEIS PROBLEMAS:');
console.log('=======================');
console.log('1. ❌ API REST desabilitada no WordPress');
console.log('2. ❌ Plugin de segurança bloqueando');
console.log('3. ❌ Autenticação incorreta');
console.log('4. ❌ CORS não configurado');
console.log('5. ❌ Permissões insuficientes');
console.log('6. ❌ Site sem conteúdo');
console.log('7. ❌ Proxy não funcionando');

// 5. Soluções
console.log('\n🔧 SOLUÇÕES:');
console.log('============');
console.log('1. ✅ Verificar se API REST está ativa');
console.log('2. ✅ Testar conexão direta');
console.log('3. ✅ Verificar logs do WordPress');
console.log('4. ✅ Testar com usuário admin');
console.log('5. ✅ Verificar plugins de segurança');
console.log('6. ✅ Verificar se há conteúdo no site');
console.log('7. ✅ Testar proxy manualmente');

// 6. Verificação final
console.log('\n✅ VERIFICAÇÃO FINAL:');
console.log('=====================');
console.log('✅ Script de debug criado');
console.log('✅ Testes passo a passo implementados');
console.log('✅ Diagnóstico completo disponível');

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('===================');
console.log('1. ✅ Execute o script de debug');
console.log('2. ✅ Verifique cada etapa do teste');
console.log('3. ✅ Identifique onde está falhando');
console.log('4. ✅ Aplique a solução específica');

console.log('\n🎉 DEBUG COMPLETO!');
console.log('==================');
console.log('Execute o script para identificar exatamente onde está o problema.');













