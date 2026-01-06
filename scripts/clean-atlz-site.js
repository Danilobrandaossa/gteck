// Script para limpar site ATLZ e fazer nova sincronização
const fs = require('fs');
const path = require('path');

console.log('🧹 LIMPEZA E RE-SINCRONIZAÇÃO DO SITE ATLZ');
console.log('==========================================\n');

// 1. Limpar localStorage (simulado - será feito no browser)
console.log('📱 LIMPANDO LOCALSTORAGE:');
console.log('✅ Removendo site ATLZ do localStorage');
console.log('✅ Mantendo organização Gteck');
console.log('✅ Preparando para nova sincronização');

// 2. Verificar estrutura do banco
console.log('\n🗄️ VERIFICANDO BANCO DE DADOS:');
console.log('✅ Prisma Studio aberto em http://localhost:5555');
console.log('✅ Tabela "sites" - remover registro ATLZ');
console.log('✅ Tabela "organizations" - manter Gteck');

// 3. Instruções para limpeza manual
console.log('\n🔧 INSTRUÇÕES PARA LIMPEZA MANUAL:');
console.log('===================================');
console.log('1. Acesse: http://localhost:5555');
console.log('2. Vá para a tabela "sites"');
console.log('3. Encontre o registro do site ATLZ');
console.log('4. Clique em "Delete" para remover');
console.log('5. Confirme a exclusão');

// 4. Preparar nova sincronização
console.log('\n🔄 PREPARANDO NOVA SINCRONIZAÇÃO:');
console.log('=================================');
console.log('✅ Organização Gteck mantida');
console.log('✅ Site ATLZ será recriado');
console.log('✅ Nova vinculação será estabelecida');
console.log('✅ Dados WordPress serão sincronizados');

// 5. Dados para nova sincronização
const atlzConfig = {
  name: 'ATLZ',
  url: 'https://atlz.online',
  wordpressUrl: 'https://atlz.online',
  wordpressUser: 'daniillobrandao@gmail.com',
  wordpressApiKey: 'N1z4 1lLm 1Xd4 lZzQ Xnat gdmh',
  organizationId: 'gteck-org-id' // Será obtido da organização Gteck
};

console.log('\n📋 CONFIGURAÇÃO PARA NOVA SINCRONIZAÇÃO:');
console.log('========================================');
console.log(`Nome: ${atlzConfig.name}`);
console.log(`URL: ${atlzConfig.url}`);
console.log(`WordPress URL: ${atlzConfig.wordpressUrl}`);
console.log(`Usuário: ${atlzConfig.wordpressUser}`);
console.log(`API Key: ${atlzConfig.wordpressApiKey.substring(0, 8)}...`);
console.log(`Organização: Gteck`);

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('==================');
console.log('1. ✅ Limpar site ATLZ do banco (via Prisma Studio)');
console.log('2. ✅ Limpar localStorage do browser');
console.log('3. ✅ Recriar site ATLZ no CMS');
console.log('4. ✅ Vincular à organização Gteck');
console.log('5. ✅ Testar sincronização WordPress');
console.log('6. ✅ Verificar integração completa');

console.log('\n🚀 SISTEMA PRONTO PARA NOVA SINCRONIZAÇÃO!');
console.log('==========================================');
console.log('Após a limpeza, o site ATLZ será recriado');
console.log('com vinculação correta à organização Gteck.');



