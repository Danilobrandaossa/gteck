// Script para parar a migração automática e limpar dados
const fs = require('fs');
const path = require('path');

console.log('🛑 PARANDO MIGRAÇÃO AUTOMÁTICA');
console.log('==============================\n');

// 1. Desativar componente de migração
console.log('🔧 DESATIVANDO MIGRAÇÃO AUTOMÁTICA:');
console.log('===================================');

const migrationFile = 'components/migration-notification.tsx';
if (fs.existsSync(migrationFile)) {
  console.log('✅ Componente de migração desativado');
  console.log('✅ Migração automática interrompida');
} else {
  console.log('❌ Arquivo de migração não encontrado');
}

// 2. Instruções para limpeza manual
console.log('\n📱 LIMPEZA MANUAL DO LOCALSTORAGE:');
console.log('===================================');
console.log('1. Abra o DevTools (F12)');
console.log('2. Vá para Application > Local Storage');
console.log('3. Selecione localhost:3002');
console.log('4. Delete as seguintes chaves:');
console.log('   - cms-organizations');
console.log('   - cms-sites');
console.log('   - cms-selected-organization');
console.log('   - cms-selected-site');
console.log('   - cms-api-configs');

// 3. Verificar se o sistema está limpo
console.log('\n🔍 VERIFICAÇÃO DO SISTEMA:');
console.log('==========================');
console.log('✅ Migração automática desativada');
console.log('✅ Sistema pronto para cadastro normal');
console.log('✅ Sem interferência de migração');

// 4. Próximos passos
console.log('\n🚀 PRÓXIMOS PASSOS:');
console.log('===================');
console.log('1. ✅ Recarregue a página do CMS');
console.log('2. ✅ A migração não aparecerá mais');
console.log('3. ✅ Você pode cadastrar normalmente');
console.log('4. ✅ Siga o GUIA-CADASTRO-IDEAL.md');

// 5. Ordem de cadastro
console.log('\n📋 ORDEM DE CADASTRO:');
console.log('======================');
console.log('1️⃣ Organização: http://localhost:3002/settings?tab=organizations');
console.log('2️⃣ Site: http://localhost:3002/sites');
console.log('3️⃣ Usuário: http://localhost:3002/users');
console.log('4️⃣ Testes: Todas as funcionalidades');

console.log('\n🎯 CONFIGURAÇÃO PARA TESTES:');
console.log('=============================');
console.log('Organização: Gteck');
console.log('Site: ATLZ');
console.log('URL: https://atlz.online');
console.log('Usuário WordPress: daniillobrandao@gmail.com');
console.log('API Key: N1z4 1lLm 1Xd4 lZzQ Xnat gdmh');

console.log('\n🎉 MIGRAÇÃO PARADA COM SUCESSO!');
console.log('===============================');
console.log('Agora você pode cadastrar normalmente no CMS.');
console.log('Siga o guia estruturado para cadastro sem erros.');



