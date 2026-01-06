/**
 * Script para atualizar a senha de um usuário
 * 
 * Uso: node scripts/update-password.js <email> <nova-senha>
 * Exemplo: node scripts/update-password.js admin@cms.local minhaNovaSenha123
 */

// Carregar variáveis de ambiente do .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');

// Detectar se é SQLite ou PostgreSQL pela DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || '';
const isSQLite = databaseUrl.startsWith('file:');

// Se for SQLite, precisamos usar o schema-dev.prisma
// Mas o PrismaClient já deve estar gerado com o schema correto
const prisma = new PrismaClient();

async function updatePassword() {
  // Pegar argumentos da linha de comando
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log('❌ Erro: Email e senha são obrigatórios');
    console.log('');
    console.log('Uso: node scripts/update-password.js <email> <nova-senha>');
    console.log('Exemplo: node scripts/update-password.js admin@cms.local minhaNovaSenha123');
    process.exit(1);
  }

  console.log('🔐 Atualizando senha do usuário...');
  console.log(`   Email: ${email}`);

  try {
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log(`❌ Usuário não encontrado: ${email}`);
      console.log('');
      console.log('💡 Dica: Liste os usuários com:');
      console.log('   node scripts/list-users.js');
      await prisma.$disconnect();
      process.exit(1);
    }

    console.log(`✅ Usuário encontrado: ${user.name || 'Sem nome'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Ativo: ${user.isActive ? 'Sim' : 'Não'}`);

    // Gerar hash da nova senha
    console.log('🔒 Gerando hash da senha...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword
      }
    });

    console.log('');
    console.log('✅ Senha atualizada com sucesso!');
    console.log('');
    console.log('📋 Detalhes:');
    console.log(`   - Email: ${updatedUser.email}`);
    console.log(`   - Nome: ${updatedUser.name || 'Não definido'}`);
    console.log(`   - Nova senha: ${newPassword}`);
    console.log('');
    console.log('💡 Agora você pode fazer login com a nova senha!');

  } catch (error) {
    console.error('❌ Erro ao atualizar senha:', error);
    if (error.code === 'P2002') {
      console.error('   Erro: Email já está em uso');
    } else if (error.message && error.message.includes('database')) {
      console.error('\n💡 Dica: Certifique-se de que:');
      console.error('   1. O banco de dados está configurado corretamente');
      console.error('   2. O arquivo .env.local tem DATABASE_URL configurado');
      console.error('   3. Você executou: npm run db:generate');
    }
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();

