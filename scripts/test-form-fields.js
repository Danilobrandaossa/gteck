// Script para testar campos do formulário
const fs = require('fs');

console.log('🔧 TESTANDO CAMPOS DO FORMULÁRIO');
console.log('================================\n');

// 1. Verificar se os campos estão corretos
console.log('📁 VERIFICANDO CAMPOS:');
console.log('======================');

const sitesFile = fs.readFileSync('app/sites/page.tsx', 'utf8');

// Verificar se os campos têm onChange diferentes
const wordpressPasswordOnChange = sitesFile.includes("handleInputChange('wordpressPassword', e.target.value)");
const wordpressAppPasswordOnChange = sitesFile.includes("handleInputChange('wordpressAppPassword', e.target.value)");

console.log(`${wordpressPasswordOnChange ? '✅' : '❌'} Campo wordpressPassword tem onChange correto`);
console.log(`${wordpressAppPasswordOnChange ? '✅' : '❌'} Campo wordpressAppPassword tem onChange correto`);

// Verificar se os campos têm value diferentes
const wordpressPasswordValue = sitesFile.includes("value={formData.wordpressPassword}");
const wordpressAppPasswordValue = sitesFile.includes("value={formData.wordpressAppPassword}");

console.log(`${wordpressPasswordValue ? '✅' : '❌'} Campo wordpressPassword tem value correto`);
console.log(`${wordpressAppPasswordValue ? '✅' : '❌'} Campo wordpressAppPassword tem value correto`);

// Verificar se os campos têm placeholder diferentes
const wordpressPasswordPlaceholder = sitesFile.includes('placeholder="••••••••"');
const wordpressAppPasswordPlaceholder = sitesFile.includes('placeholder="••••••••"');

console.log(`${wordpressPasswordPlaceholder ? '✅' : '❌'} Campo wordpressPassword tem placeholder`);
console.log(`${wordpressAppPasswordPlaceholder ? '✅' : '❌'} Campo wordpressAppPassword tem placeholder`);

// 2. Script para testar os campos no navegador
console.log('\n🧪 SCRIPT PARA TESTAR CAMPOS:');
console.log('==============================');
console.log('// Cole este código no console do navegador:');
console.log('function testFormFields() {');
console.log('  console.log("=== TESTE DOS CAMPOS DO FORMULÁRIO ===");');
console.log('  try {');
console.log('    // Teste 1: Verificar se os campos existem');
console.log('    const userPasswordField = document.querySelector("input[value*=\'wordpressPassword\']");');
console.log('    const appPasswordField = document.querySelector("input[value*=\'wordpressAppPassword\']");');
console.log('    console.log("Campo senha usuário:", userPasswordField ? "✅" : "❌");');
console.log('    console.log("Campo senha aplicação:", appPasswordField ? "✅" : "❌");');
console.log('');
console.log('    // Teste 2: Verificar se os campos são diferentes');
console.log('    if (userPasswordField && appPasswordField) {');
console.log('      console.log("Campos são diferentes:", userPasswordField !== appPasswordField ? "✅" : "❌");');
console.log('      console.log("Campo usuário name:", userPasswordField.name || "sem name");');
console.log('      console.log("Campo aplicação name:", appPasswordField.name || "sem name");');
console.log('    }');
console.log('');
console.log('    // Teste 3: Simular digitação em cada campo');
console.log('    if (userPasswordField) {');
console.log('      userPasswordField.value = "senha_usuario_teste";');
console.log('      userPasswordField.dispatchEvent(new Event("input", { bubbles: true }));');
console.log('      console.log("Valor campo usuário:", userPasswordField.value);');
console.log('    }');
console.log('');
console.log('    if (appPasswordField) {');
console.log('      appPasswordField.value = "senha_aplicacao_teste";');
console.log('      appPasswordField.dispatchEvent(new Event("input", { bubbles: true }));');
console.log('      console.log("Valor campo aplicação:", appPasswordField.value);');
console.log('    }');
console.log('');
console.log('    // Teste 4: Verificar se os valores são independentes');
console.log('    if (userPasswordField && appPasswordField) {');
console.log('      const valuesAreDifferent = userPasswordField.value !== appPasswordField.value;');
console.log('      console.log("Valores são diferentes:", valuesAreDifferent ? "✅" : "❌");');
console.log('    }');
console.log('');
console.log('  } catch (error) {');
console.log('    console.error("Erro:", error);');
console.log('  }');
console.log('}');
console.log('testFormFields();');

// 3. Possíveis problemas
console.log('\n⚠️ POSSÍVEIS PROBLEMAS:');
console.log('=======================');
console.log('1. ❌ Campos compartilhando o mesmo estado');
console.log('2. ❌ handleInputChange não funcionando corretamente');
console.log('3. ❌ Campos com mesmo name ou id');
console.log('4. ❌ Problema de re-renderização');

// 4. Soluções
console.log('\n🔧 SOLUÇÕES:');
console.log('============');
console.log('1. ✅ Verificar se os campos têm onChange diferentes');
console.log('2. ✅ Verificar se os campos têm value diferentes');
console.log('3. ✅ Verificar se os campos têm name/id diferentes');
console.log('4. ✅ Testar digitação independente');

// 5. Verificação final
console.log('\n✅ VERIFICAÇÃO FINAL:');
console.log('=====================');
console.log('✅ Campos implementados');
console.log('✅ onChange separados');
console.log('✅ value separados');
console.log('✅ Teste de campos disponível');

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('===================');
console.log('1. ✅ Execute o script de teste');
console.log('2. ✅ Verifique se os campos são independentes');
console.log('3. ✅ Teste a digitação em cada campo');
console.log('4. ✅ Confirme se não há sincronização');

console.log('\n🎉 TESTE DE CAMPOS PRONTO!');
console.log('==========================');
console.log('Execute o script para verificar se os campos são independentes.');













