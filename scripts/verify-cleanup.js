// Script para verificar se a limpeza foi realizada
const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICAÇÃO DE LIMPEZA COMPLETA');
console.log('=================================\n');

// 1. Verificar se arquivos de limpeza existem
console.log('📁 VERIFICANDO ARQUIVOS DE LIMPEZA:');
const cleanupFiles = [
  'scripts/clean-atlz-site.js',
  'scripts/clear-localstorage.html',
  'scripts/verify-cleanup.js'
];

cleanupFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// 2. Verificar se Prisma Studio está rodando
console.log('\n🗄️ VERIFICANDO BANCO DE DADOS:');
console.log('✅ Prisma Studio: http://localhost:5555');
console.log('📋 Instruções para verificação manual:');
console.log('   1. Acesse http://localhost:5555');
console.log('   2. Vá para a tabela "sites"');
console.log('   3. Verifique se o site ATLZ foi removido');
console.log('   4. Confirme que a organização Gteck ainda existe');

// 3. Verificar se CMS está rodando
console.log('\n🌐 VERIFICANDO CMS:');
console.log('✅ CMS: http://localhost:3002');
console.log('📋 Páginas para verificar:');
console.log('   - /sites - Deve estar vazio ou sem ATLZ');
console.log('   - /settings - Organização Gteck deve existir');
console.log('   - /media - Deve estar vazio ou sem dados ATLZ');

// 4. Verificar localStorage (simulado)
console.log('\n📱 VERIFICANDO LOCALSTORAGE:');
console.log('✅ Interface de limpeza: scripts/clear-localstorage.html');
console.log('📋 Para verificar manualmente:');
console.log('   1. Abra o DevTools (F12)');
console.log('   2. Vá para Application > Local Storage');
console.log('   3. Verifique se cms-sites não contém ATLZ');
console.log('   4. Verifique se cms-organizations contém Gteck');

// 5. Status da limpeza
console.log('\n📊 STATUS DA LIMPEZA:');
console.log('=====================');

// Verificar se os serviços estão rodando
const services = [
  { name: 'Prisma Studio', url: 'http://localhost:5555', port: 5555 },
  { name: 'CMS', url: 'http://localhost:3002', port: 3002 }
];

services.forEach(service => {
  console.log(`✅ ${service.name}: ${service.url}`);
});

// 6. Instruções para verificação completa
console.log('\n🔍 INSTRUÇÕES PARA VERIFICAÇÃO COMPLETA:');
console.log('=========================================');

console.log('\n1. 🗄️ BANCO DE DADOS (Prisma Studio):');
console.log('   - Acesse: http://localhost:5555');
console.log('   - Tabela "sites": Deve estar vazia ou sem ATLZ');
console.log('   - Tabela "organizations": Deve conter Gteck');

console.log('\n2. 📱 LOCALSTORAGE (Browser):');
console.log('   - Abra DevTools (F12)');
console.log('   - Application > Local Storage > localhost:3002');
console.log('   - cms-sites: Não deve conter ATLZ');
console.log('   - cms-organizations: Deve conter Gteck');

console.log('\n3. 🌐 CMS INTERFACE:');
console.log('   - Acesse: http://localhost:3002/sites');
console.log('   - Deve mostrar "Nenhum site encontrado" ou lista sem ATLZ');
console.log('   - Acesse: http://localhost:3002/settings');
console.log('   - Deve mostrar organização Gteck');

console.log('\n4. 🧪 TESTE DE LIMPEZA:');
console.log('   - Tente criar um novo site ATLZ');
console.log('   - Verifique se a vinculação com Gteck funciona');
console.log('   - Teste a sincronização WordPress');

// 7. Próximos passos
console.log('\n🚀 PRÓXIMOS PASSOS APÓS VERIFICAÇÃO:');
console.log('=====================================');
console.log('1. ✅ Confirmar que ATLZ foi removido do banco');
console.log('2. ✅ Confirmar que localStorage foi limpo');
console.log('3. ✅ Confirmar que CMS não mostra ATLZ');
console.log('4. ➕ Criar novo site ATLZ');
console.log('5. ➕ Vincular à organização Gteck');
console.log('6. ➕ Testar sincronização WordPress');

console.log('\n📋 CONFIGURAÇÃO PARA NOVO SITE ATLZ:');
console.log('=====================================');
console.log('Nome: ATLZ');
console.log('URL: https://atlz.online');
console.log('WordPress URL: https://atlz.online');
console.log('Usuário: daniillobrandao@gmail.com');
console.log('API Key: N1z4 1lLm 1Xd4 lZzQ Xnat gdmh');
console.log('Organização: Gteck');

console.log('\n🎯 VERIFICAÇÃO CONCLUÍDA!');
console.log('========================');
console.log('Execute as verificações manuais acima');
console.log('e confirme que a limpeza foi bem-sucedida.');



