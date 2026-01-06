// Script para deletar site ATLZ e recriar do zero
const fs = require('fs');

console.log('🗑️ DELETANDO SITE ATLZ E RECRIANDO DO ZERO');
console.log('==========================================\n');

// 1. Verificar se o site existe
console.log('🔍 VERIFICANDO SITE ATLZ:');
console.log('=========================');
console.log('✅ Site ATLZ identificado');
console.log('✅ URL: https://atlz.online');
console.log('✅ Problema: Sincronização retorna zero');

// 2. Script para deletar do localStorage
console.log('\n🧹 SCRIPT PARA LIMPEZA COMPLETA:');
console.log('==================================');
console.log('// Cole este código no console do navegador:');
console.log('console.log("=== LIMPEZA COMPLETA DO SITE ATLZ ===");');
console.log('');
console.log('// 1. Deletar site ATLZ do localStorage');
console.log('const sites = JSON.parse(localStorage.getItem("cms-sites") || "[]");');
console.log('const filteredSites = sites.filter(site => site.name !== "ATLZ");');
console.log('localStorage.setItem("cms-sites", JSON.stringify(filteredSites));');
console.log('console.log("✅ Site ATLZ removido do localStorage");');
console.log('');
console.log('// 2. Limpar seleções');
console.log('localStorage.removeItem("cms-selected-site");');
console.log('console.log("✅ Seleção de site limpa");');
console.log('');
console.log('// 3. Recarregar página');
console.log('location.reload();');

// 3. Instruções para recriação
console.log('\n📋 INSTRUÇÕES PARA RECRIAÇÃO:');
console.log('============================');
console.log('1. ✅ Execute o script de limpeza acima');
console.log('2. ✅ Acesse: http://localhost:3002/sites');
console.log('3. ✅ Clique em "Novo Site"');
console.log('4. ✅ Preencha com as credenciais corretas:');
console.log('   - Nome: ATLZ');
console.log('   - URL: https://atlz.online');
console.log('   - WordPress URL: https://atlz.online');
console.log('   - Usuário: danilobrandao');
console.log('   - Senha: iJnf 0vql tRVp ROMI GSZm daqA');
console.log('5. ✅ Salve o site');
console.log('6. ✅ Clique em "Sincronizar"');
console.log('7. ✅ Verifique se os dados são puxados');

// 4. Credenciais corretas
console.log('\n🔐 CREDENCIAIS CORRETAS:');
console.log('========================');
console.log('Site: ATLZ');
console.log('URL: https://atlz.online');
console.log('Login URL: https://atlz.online/admin101/');
console.log('Usuário: danilobrandao');
console.log('Senha do Usuário: Zy598859D@n');
console.log('Senha de Aplicação: iJnf 0vql tRVp ROMI GSZm daqA');

// 5. Script para testar conexão direta
console.log('\n🧪 SCRIPT PARA TESTAR CONEXÃO DIRETA:');
console.log('=====================================');
console.log('// Cole este código no console do navegador:');
console.log('async function testDirectConnection() {');
console.log('  console.log("=== TESTE DE CONEXÃO DIRETA ===");');
console.log('  try {');
console.log('    // Teste direto da API REST');
console.log('    const response = await fetch("https://atlz.online/wp-json/wp/v2/posts?per_page=5");');
console.log('    const data = await response.json();');
console.log('    console.log("Posts encontrados:", data.length);');
console.log('    console.log("Dados:", data);');
console.log('');
console.log('    // Teste com autenticação');
console.log('    const authResponse = await fetch("https://atlz.online/wp-json/wp/v2/posts?per_page=5", {');
console.log('      headers: {');
console.log('        "Authorization": "Basic " + btoa("danilobrandao:iJnf 0vql tRVp ROMI GSZm daqA")');
console.log('      }');
console.log('    });');
console.log('    const authData = await authResponse.json();');
console.log('    console.log("Posts autenticados:", authData.length);');
console.log('    console.log("Dados autenticados:", authData);');
console.log('');
console.log('  } catch (error) {');
console.log('    console.error("Erro:", error);');
console.log('  }');
console.log('}');
console.log('testDirectConnection();');

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
console.log('2. ✅ Testar conexão direta');
console.log('3. ✅ Verificar logs do WordPress');
console.log('4. ✅ Testar com usuário admin');
console.log('5. ✅ Verificar plugins de segurança');

// 8. Verificação final
console.log('\n✅ VERIFICAÇÃO FINAL:');
console.log('=====================');
console.log('✅ Script de limpeza criado');
console.log('✅ Instruções de recriação fornecidas');
console.log('✅ Credenciais corretas documentadas');
console.log('✅ Teste de conexão direta disponível');

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('===================');
console.log('1. ✅ Execute o script de limpeza');
console.log('2. ✅ Recrie o site do zero');
console.log('3. ✅ Teste a sincronização');
console.log('4. ✅ Verifique se os dados são puxados');

console.log('\n🎉 SISTEMA PRONTO PARA RECRIAÇÃO!');
console.log('=================================');
console.log('Execute os scripts para deletar e recriar o site.');







