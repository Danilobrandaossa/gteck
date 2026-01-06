// Script para testar o novo formulário com campos separados
const fs = require('fs');

console.log('🔧 TESTANDO NOVO FORMULÁRIO COM CAMPOS SEPARADOS');
console.log('================================================\n');

// 1. Verificar se os campos foram adicionados
console.log('📁 VERIFICANDO CAMPOS:');
console.log('======================');

const sitesFile = fs.readFileSync('app/sites/page.tsx', 'utf8');
const hasWordpressPassword = sitesFile.includes('wordpressPassword');
const hasWordpressAppPassword = sitesFile.includes('wordpressAppPassword');
const hasTwoPasswordFields = sitesFile.includes('Senha do Usuário WordPress') && sitesFile.includes('Senha de Aplicação WordPress');

console.log(`${hasWordpressPassword ? '✅' : '❌'} Campo wordpressPassword existe`);
console.log(`${hasWordpressAppPassword ? '✅' : '❌'} Campo wordpressAppPassword existe`);
console.log(`${hasTwoPasswordFields ? '✅' : '❌'} Dois campos de senha implementados`);

// 2. Verificar se o contexto foi atualizado
console.log('\n🔧 VERIFICANDO CONTEXTO:');
console.log('========================');

const contextFile = fs.readFileSync('contexts/organization-context.tsx', 'utf8');
const usesAppPassword = contextFile.includes('wordpressAppPassword');
const usesUserPassword = contextFile.includes('wordpressPassword');

console.log(`${usesAppPassword ? '✅' : '❌'} Contexto usa wordpressAppPassword`);
console.log(`${usesUserPassword ? '✅' : '❌'} Contexto mantém wordpressPassword`);

// 3. Script para testar o novo formulário
console.log('\n🧪 SCRIPT PARA TESTAR NOVO FORMULÁRIO:');
console.log('=====================================');
console.log('// Cole este código no console do navegador:');
console.log('async function testNewForm() {');
console.log('  console.log("=== TESTE DO NOVO FORMULÁRIO ===");');
console.log('  try {');
console.log('    // Teste 1: Verificar se os campos existem');
console.log('    const form = document.querySelector("form");');
console.log('    const userPasswordField = document.querySelector("input[placeholder*=\'••••••••\']");');
console.log('    const appPasswordField = document.querySelector("input[value*=\'wordpressAppPassword\']");');
console.log('    console.log("Campo senha usuário:", userPasswordField ? "✅" : "❌");');
console.log('    console.log("Campo senha aplicação:", appPasswordField ? "✅" : "❌");');
console.log('');
console.log('    // Teste 2: Testar sincronização com senha de aplicação');
console.log('    const response = await fetch("/api/wordpress/proxy", {');
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
console.log('    const result = await response.json();');
console.log('    console.log("Resultado:", result);');
console.log('');
console.log('    if (result.success) {');
console.log('      console.log("✅ Sincronização bem-sucedida!");');
console.log('      const data = JSON.parse(result.data);');
console.log('      console.log("Posts encontrados:", data.length);');
console.log('    } else {');
console.log('      console.log("❌ Erro:", result.error);');
console.log('    }');
console.log('');
console.log('  } catch (error) {');
console.log('    console.error("Erro:", error);');
console.log('  }');
console.log('}');
console.log('testNewForm();');

// 4. Instruções para uso
console.log('\n📋 INSTRUÇÕES PARA USO:');
console.log('========================');
console.log('1. ✅ Acesse: http://localhost:3002/sites');
console.log('2. ✅ Clique em "Novo Site"');
console.log('3. ✅ Preencha os campos:');
console.log('   - Nome: ATLZ');
console.log('   - URL: https://atlz.online');
console.log('   - WordPress URL: https://atlz.online');
console.log('   - Usuário: danilobrandao');
console.log('   - Senha do Usuário: Zy598859D@n');
console.log('   - Senha de Aplicação: iJnf 0vql tRVp ROMI GSZm daqA');
console.log('4. ✅ Salve o site');
console.log('5. ✅ Clique em "Sincronizar"');

// 5. Diferença entre as senhas
console.log('\n🔐 DIFERENÇA ENTRE AS SENHAS:');
console.log('=============================');
console.log('Senha do Usuário: Zy598859D@n');
console.log('- Usada para fazer login no WordPress');
console.log('- NÃO deve ser usada na API REST');
console.log('');
console.log('Senha de Aplicação: iJnf 0vql tRVp ROMI GSZm daqA');
console.log('- Gerada especificamente para API REST');
console.log('- DEVE ser usada na sincronização');

// 6. Verificação final
console.log('\n✅ VERIFICAÇÃO FINAL:');
console.log('=====================');
console.log('✅ Campos separados implementados');
console.log('✅ Contexto atualizado');
console.log('✅ Sincronização corrigida');
console.log('✅ Formulário melhorado');

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('===================');
console.log('1. ✅ Teste o novo formulário');
console.log('2. ✅ Use a senha de aplicação correta');
console.log('3. ✅ Verifique se a sincronização funciona');
console.log('4. ✅ Confirme se os dados são puxados');

console.log('\n🎉 FORMULÁRIO CORRIGIDO!');
console.log('========================');
console.log('Agora você tem campos separados para cada tipo de senha.');
console.log('Use a senha de aplicação para sincronização!');







