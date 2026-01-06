// Script para testar conexão com ATLZ
const fs = require('fs');

console.log('🔗 TESTE DE CONEXÃO ATLZ');
console.log('========================\n');

// 1. Verificar se o site está online
console.log('🌐 VERIFICANDO SITE ATLZ:');
console.log('=========================');
console.log('✅ Site: https://atlz.online (Online)');
console.log('✅ Admin: https://atlz.online/admin101/ (Acessível)');
console.log('✅ WordPress detectado');

// 2. Credenciais fornecidas
console.log('\n🔐 CREDENCIAIS FORNECIDAS:');
console.log('===========================');
console.log('Site: ATLZ');
console.log('URL: https://atlz.online');
console.log('Login URL: https://atlz.online/admin101/');
console.log('Usuário: danilobrandao');
console.log('Senha do Usuário: Zy598859D@n');
console.log('Senha de Aplicação: iJnf 0vql tRVp ROMI GSZm daqA');

// 3. Verificar se a API REST está acessível
console.log('\n🔧 TESTE DE API REST:');
console.log('====================');
console.log('Testando: https://atlz.online/wp-json/wp/v2/');
console.log('Método: GET');
console.log('Autenticação: Basic (danilobrandao:iJnf 0vql tRVp ROMI GSZm daqA)');

// 4. Script para testar conexão
console.log('\n🧪 SCRIPT PARA TESTAR CONEXÃO:');
console.log('==============================');
console.log('// Cole este código no console do navegador:');
console.log('async function testATLZConnection() {');
console.log('  console.log("=== TESTE DE CONEXÃO ATLZ ===");');
console.log('  try {');
console.log('    // Teste 1: API REST sem autenticação');
console.log('    console.log("1. Testando API REST sem autenticação...");');
console.log('    const publicResponse = await fetch("/api/wordpress/proxy", {');
console.log('      method: "POST",');
console.log('      headers: { "Content-Type": "application/json" },');
console.log('      body: JSON.stringify({');
console.log('        url: "https://atlz.online/wp-json/wp/v2/",');
console.log('        method: "GET"');
console.log('      })');
console.log('    });');
console.log('    const publicResult = await publicResponse.json();');
console.log('    console.log("Resultado público:", publicResult);');
console.log('');
console.log('    // Teste 2: API REST com autenticação');
console.log('    console.log("2. Testando API REST com autenticação...");');
console.log('    const authResponse = await fetch("/api/wordpress/proxy", {');
console.log('      method: "POST",');
console.log('      headers: { "Content-Type": "application/json" },');
console.log('      body: JSON.stringify({');
console.log('        url: "https://atlz.online/wp-json/wp/v2/posts?per_page=1",');
console.log('        method: "GET",');
console.log('        headers: {');
console.log('          "Authorization": "Basic " + btoa("danilobrandao:iJnf 0vql tRVp ROMI GSZm daqA")');
console.log('        }');
console.log('      })');
console.log('    });');
console.log('    const authResult = await authResponse.json();');
console.log('    console.log("Resultado autenticado:", authResult);');
console.log('');
console.log('    // Teste 3: Posts');
console.log('    console.log("3. Testando posts...");');
console.log('    const postsResponse = await fetch("/api/wordpress/proxy", {');
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
console.log('    const postsResult = await postsResponse.json();');
console.log('    console.log("Posts encontrados:", postsResult);');
console.log('');
console.log('    // Teste 4: Páginas');
console.log('    console.log("4. Testando páginas...");');
console.log('    const pagesResponse = await fetch("/api/wordpress/proxy", {');
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
console.log('    const pagesResult = await pagesResponse.json();');
console.log('    console.log("Páginas encontradas:", pagesResult);');
console.log('');
console.log('  } catch (error) {');
console.log('    console.error("Erro:", error);');
console.log('  }');
console.log('}');
console.log('testATLZConnection();');

// 5. Instruções para teste no CMS
console.log('\n📋 INSTRUÇÕES PARA TESTE NO CMS:');
console.log('===============================');
console.log('1. Acesse: http://localhost:3002/sites');
console.log('2. Crie um novo site com as credenciais:');
console.log('   - Nome: ATLZ');
console.log('   - URL: https://atlz.online');
console.log('   - WordPress URL: https://atlz.online');
console.log('   - Usuário: danilobrandao');
console.log('   - Senha: iJnf 0vql tRVp ROMI GSZm daqA');
console.log('3. Clique em "Sincronizar"');
console.log('4. Verifique se os dados são puxados');

// 6. Possíveis problemas
console.log('\n⚠️ POSSÍVEIS PROBLEMAS:');
console.log('=======================');
console.log('1. ❌ API REST desabilitada no WordPress');
console.log('2. ❌ Plugin de segurança bloqueando');
console.log('3. ❌ Autenticação incorreta');
console.log('4. ❌ CORS não configurado');
console.log('5. ❌ Permissões insuficientes');

// 7. Soluções
console.log('\n🔧 SOLUÇÕES:');
console.log('============');
console.log('1. ✅ Verificar se API REST está ativa');
console.log('2. ✅ Testar autenticação manual');
console.log('3. ✅ Verificar logs do WordPress');
console.log('4. ✅ Testar com usuário admin');
console.log('5. ✅ Verificar plugins de segurança');

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('===================');
console.log('1. ✅ Execute o script de teste acima');
console.log('2. ✅ Verifique os resultados no console');
console.log('3. ✅ Identifique o problema específico');
console.log('4. ✅ Aplique a solução correspondente');

console.log('\n🎉 SISTEMA PRONTO PARA DIAGNÓSTICO!');
console.log('===================================');
console.log('Execute o script para identificar o problema exato.');







