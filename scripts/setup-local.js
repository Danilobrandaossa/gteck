/**
 * Script de configuração automática para desenvolvimento local
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Configurando CMS para desenvolvimento local...\n');

try {
  // 1. Verificar se o arquivo .env.local existe
  if (!fs.existsSync('.env.local')) {
    console.log('📝 Criando arquivo .env.local...');
    if (fs.existsSync('env.local')) {
      fs.copyFileSync('env.local', '.env.local');
      console.log('✅ Arquivo .env.local criado');
    } else {
      console.log('❌ Arquivo env.local não encontrado');
      process.exit(1);
    }
  } else {
    console.log('✅ Arquivo .env.local já existe');
  }

  // 2. Verificar se o schema de desenvolvimento existe
  if (!fs.existsSync('prisma/schema-dev.prisma')) {
    console.log('❌ Schema de desenvolvimento não encontrado');
    process.exit(1);
  }

  // 3. Copiar schema de desenvolvimento para schema principal
  console.log('🔧 Configurando schema para SQLite...');
  fs.copyFileSync('prisma/schema-dev.prisma', 'prisma/schema.prisma');
  console.log('✅ Schema configurado para SQLite');

  // 4. Gerar cliente Prisma
  console.log('📦 Gerando cliente Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Cliente Prisma gerado');

  // 5. Criar banco de dados SQLite
  console.log('🗄️ Criando banco de dados SQLite...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Banco de dados SQLite criado');

  // 6. Popular dados iniciais
  console.log('🌱 Populando dados iniciais...');
  execSync('node scripts/seed-local.js', { stdio: 'inherit' });
  console.log('✅ Dados iniciais populados');

  console.log('\n🎉 Configuração local concluída com sucesso!');
  console.log('📊 Sistema configurado com:');
  console.log('   - SQLite como banco de dados');
  console.log('   - Dados iniciais populados');
  console.log('   - Usuário admin: admin@cms.local (senha: password)');
  console.log('   - Site padrão: https://atlz.online/');
  console.log('\n🚀 Execute "npm run dev" para iniciar o servidor');

} catch (error) {
  console.error('❌ Erro durante a configuração:', error.message);
  process.exit(1);
}





