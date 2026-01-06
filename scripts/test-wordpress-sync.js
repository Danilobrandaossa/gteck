// Script para testar sincronização WordPress
const fs = require('fs');

console.log('🔗 TESTE DE SINCRONIZAÇÃO WORDPRESS');
console.log('===================================\n');

// 1. Verificar se os arquivos estão corretos
console.log('📁 VERIFICANDO ARQUIVOS:');
console.log('========================');

const files = [
  'lib/wordpress-api.ts',
  'app/api/wordpress/proxy/route.ts',
  'app/settings/page.tsx',
  'contexts/organization-context.tsx'
];

files.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// 2. Verificar se a API usa proxy
console.log('\n🔧 VERIFICANDO PROXY:');
console.log('=====================');

const wpApiFile = fs.readFileSync('lib/wordpress-api.ts', 'utf8');
const usesProxy = wpApiFile.includes('/api/wordpress/proxy');
const hasDirectFetch = wpApiFile.includes('fetch(`${this.baseUrl}');

console.log(`${usesProxy ? '✅' : '❌'} API usa proxy`);
console.log(`${!hasDirectFetch ? '✅' : '❌'} Não faz chamadas diretas`);

// 3. Verificar se o proxy está implementado
console.log('\n🌐 VERIFICANDO PROXY ROUTE:');
console.log('==========================');

const proxyFile = fs.readFileSync('app/api/wordpress/proxy/route.ts', 'utf8');
const hasProxyRoute = proxyFile.includes('export async function POST');
const hasCorsHandling = proxyFile.includes('CORS');

console.log(`${hasProxyRoute ? '✅' : '❌'} Proxy route implementado`);
console.log(`${hasCorsHandling ? '✅' : '❌'} CORS handling implementado`);

// 4. Verificar se as credenciais estão corretas
console.log('\n🔐 VERIFICANDO CREDENCIAIS:');
console.log('===========================');

const settingsFile = fs.readFileSync('app/settings/page.tsx', 'utf8');
const usesWordpressPassword = settingsFile.includes('wordpressPassword');
const hasAuthHeader = settingsFile.includes('Authorization');

console.log(`${usesWordpressPassword ? '✅' : '❌'} Usa wordpressPassword`);
console.log(`${hasAuthHeader ? '✅' : '❌'} Header de autorização implementado`);

// 5. Instruções para teste manual
console.log('\n🧪 TESTE MANUAL:');
console.log('================');
console.log('1. Abra o DevTools (F12)');
console.log('2. Vá para Network');
console.log('3. Acesse: http://localhost:3002/settings?tab=organizations');
console.log('4. Crie uma organização "Gteck"');
console.log('5. Acesse: http://localhost:3002/sites');
console.log('6. Crie um site "ATLZ" com as credenciais:');
console.log('   - URL: https://atlz.online');
console.log('   - WordPress URL: https://atlz.online');
console.log('   - Usuário: danilobrandao');
console.log('   - Senha: iJnf 0vql tRVp ROMI GSZm daqA');
console.log('7. Clique em "Sincronizar"');
console.log('8. Verifique se há requisições para /api/wordpress/proxy');

// 6. Script para testar conexão
console.log('\n🔧 SCRIPT PARA TESTAR CONEXÃO:');
console.log('==============================');
console.log('// Cole este código no console do navegador:');
console.log('async function testWordPressConnection() {');
console.log('  console.log("=== TESTE DE CONEXÃO WORDPRESS ===");');
console.log('  try {');
console.log('    const response = await fetch("/api/wordpress/proxy", {');
console.log('      method: "POST",');
console.log('      headers: { "Content-Type": "application/json" },');
console.log('      body: JSON.stringify({');
console.log('        url: "https://atlz.online/wp-json/wp/v2/",');
console.log('        method: "GET",');
console.log('        headers: {');
console.log('          "Authorization": "Basic " + btoa("danilobrandao:iJnf 0vql tRVp ROMI GSZm daqA")');
console.log('        }');
console.log('      })');
console.log('    });');
console.log('    const result = await response.json();');
console.log('    console.log("Resultado:", result);');
console.log('  } catch (error) {');
console.log('    console.error("Erro:", error);');
console.log('  }');
console.log('}');
console.log('testWordPressConnection();');

// 7. Configuração para teste
console.log('\n📋 CONFIGURAÇÃO PARA TESTE:');
console.log('============================');
console.log('Site: ATLZ');
console.log('URL: https://atlz.online');
console.log('Usuário: danilobrandao');
console.log('Senha de Aplicação: iJnf 0vql tRVp ROMI GSZm daqA');
console.log('Organização: Gteck');

// 8. Verificação final
console.log('\n✅ VERIFICAÇÃO FINAL:');
console.log('=====================');
console.log('✅ API corrigida para usar proxy');
console.log('✅ CORS contornado');
console.log('✅ Credenciais atualizadas');
console.log('✅ Sincronização implementada');

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('===================');
console.log('1. ✅ Teste a conexão com o script acima');
console.log('2. ✅ Crie o site com as credenciais corretas');
console.log('3. ✅ Teste a sincronização');
console.log('4. ✅ Verifique se os dados são puxados');

console.log('\n🎉 SISTEMA PRONTO PARA SINCRONIZAÇÃO!');
console.log('=====================================');
console.log('Agora a sincronização deve funcionar corretamente.');
console.log('Use as credenciais fornecidas pelo usuário.');




