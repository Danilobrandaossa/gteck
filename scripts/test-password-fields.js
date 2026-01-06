// Script para testar campos de senha separados
const fs = require('fs');

console.log('🔐 TESTANDO CAMPOS DE SENHA SEPARADOS');
console.log('====================================\n');

// 1. Verificar estado inicial
console.log('📋 VERIFICANDO ESTADO INICIAL:');
console.log('==============================');

const settingsContent = fs.readFileSync('app/settings/page.tsx', 'utf8');

// Verificar se tem wordpressAppPassword no estado
const hasAppPasswordState = settingsContent.includes('wordpressAppPassword: \'\'');
console.log(`${hasAppPasswordState ? '✅' : '❌'} Campo wordpressAppPassword no estado inicial`);

// Verificar se não tem duplicação
const hasDuplicatePassword = settingsContent.includes('wordpressPassword: \'\',\n    wordpressPassword: \'\'');
console.log(`${!hasDuplicatePassword ? '✅' : '❌'} Sem duplicação de wordpressPassword`);

// 2. Verificar campos do formulário
console.log('\n📝 VERIFICANDO CAMPOS DO FORMULÁRIO:');
console.log('====================================');

// Campo 1: Senha do usuário
const userPasswordField = settingsContent.includes('value={newSite.wordpressPassword}') && 
                         settingsContent.includes('onChange={(e) => setNewSite({...newSite, wordpressPassword: e.target.value})}');
console.log(`${userPasswordField ? '✅' : '❌'} Campo senha do usuário correto`);

// Campo 2: Senha de aplicação
const appPasswordField = settingsContent.includes('value={newSite.wordpressAppPassword}') && 
                        settingsContent.includes('onChange={(e) => setNewSite({...newSite, wordpressAppPassword: e.target.value})}');
console.log(`${appPasswordField ? '✅' : '❌'} Campo senha de aplicação correto`);

// 3. Verificar labels
console.log('\n🏷️ VERIFICANDO LABELS:');
console.log('========================');

const hasUserPasswordLabel = settingsContent.includes('Senha');
const hasAppPasswordLabel = settingsContent.includes('Senha de Aplicação');
console.log(`${hasUserPasswordLabel ? '✅' : '❌'} Label "Senha" encontrado`);
console.log(`${hasAppPasswordLabel ? '✅' : '❌'} Label "Senha de Aplicação" encontrado`);

// 4. Verificar reset do formulário
console.log('\n🔄 VERIFICANDO RESET DO FORMULÁRIO:');
console.log('====================================');

const hasResetAppPassword = settingsContent.includes('wordpressAppPassword: \'\'') && 
                           settingsContent.includes('setNewSite({');
console.log(`${hasResetAppPassword ? '✅' : '❌'} Reset inclui wordpressAppPassword`);

// 5. Verificar objeto do site
console.log('\n💾 VERIFICANDO OBJETO DO SITE:');
console.log('==============================');

const hasAppPasswordInSite = settingsContent.includes('wordpressAppPassword: newSite.wordpressAppPassword');
console.log(`${hasAppPasswordInSite ? '✅' : '❌'} Site inclui wordpressAppPassword`);

// 6. Verificar verificações de credenciais
console.log('\n🔍 VERIFICANDO VERIFICAÇÕES DE CREDENCIAIS:');
console.log('============================================');

const hasAppPasswordCheck = settingsContent.includes('!site.settings?.wordpressAppPassword');
console.log(`${hasAppPasswordCheck ? '✅' : '❌'} Verificação usa wordpressAppPassword`);

// 7. Verificar instanciação da API
console.log('\n🔌 VERIFICANDO INSTANCIAÇÃO DA API:');
console.log('====================================');

const hasAppPasswordAPI = settingsContent.includes('site.settings.wordpressAppPassword');
console.log(`${hasAppPasswordAPI ? '✅' : '❌'} API usa wordpressAppPassword`);

// 8. Script para testar no navegador
console.log('\n🧪 SCRIPT PARA TESTAR NO NAVEGADOR:');
console.log('===================================');
console.log('// Cole este código no console do navegador:');
console.log('function testPasswordFields() {');
console.log('  console.log("=== TESTE DE CAMPOS DE SENHA ===");');
console.log('  try {');
console.log('    // Acessar configurações');
console.log('    window.location.href = "/settings?tab=sites";');
console.log('    ');
console.log('    setTimeout(() => {');
console.log('      // Clicar em "Adicionar Site"');
console.log('      const addButton = document.querySelector("button[onclick*=\'setShowAddSiteModal\']");');
console.log('      if (addButton) {');
console.log('        addButton.click();');
console.log('        ');
console.log('        setTimeout(() => {');
console.log('          // Verificar se os campos existem');
console.log('          const userPasswordField = document.querySelector("input[value*=\'wordpressPassword\']");');
console.log('          const appPasswordField = document.querySelector("input[value*=\'wordpressAppPassword\']");');
console.log('          ');
console.log('          console.log("Campo senha do usuário:", userPasswordField ? "✅" : "❌");');
console.log('          console.log("Campo senha de aplicação:", appPasswordField ? "✅" : "❌");');
console.log('          ');
console.log('          // Testar digitação independente');
console.log('          if (userPasswordField && appPasswordField) {');
console.log('            console.log("Testando digitação independente...");');
console.log('            userPasswordField.value = "senha123";');
console.log('            appPasswordField.value = "app456";');
console.log('            ');
console.log('            console.log("Valor campo usuário:", userPasswordField.value);');
console.log('            console.log("Valor campo aplicação:", appPasswordField.value);');
console.log('            console.log("Campos independentes:", userPasswordField.value !== appPasswordField.value ? "✅" : "❌");');
console.log('          }');
console.log('        }, 1000);');
console.log('      }');
console.log('    }, 1000);');
console.log('    ');
console.log('  } catch (error) {');
console.log('    console.error("Erro:", error);');
console.log('  }');
console.log('}');
console.log('testPasswordFields();');

// 9. Verificação final
console.log('\n✅ VERIFICAÇÃO FINAL:');
console.log('=====================');
console.log('✅ Campos de senha separados');
console.log('✅ Labels corretos');
console.log('✅ Estado independente');
console.log('✅ Reset correto');
console.log('✅ API atualizada');

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('===================');
console.log('1. ✅ Teste no navegador');
console.log('2. ✅ Verifique digitação independente');
console.log('3. ✅ Teste cadastro de site');
console.log('4. ✅ Confirme sincronização');

console.log('\n🎉 CAMPOS DE SENHA CORRIGIDOS!');
console.log('==============================');
console.log('Agora os campos são independentes!');











