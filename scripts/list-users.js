/**
 * Script para listar todos os usuários do sistema
 * 
 * Uso: node scripts/list-users.js
 */

// Carregar variáveis de ambiente do .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

// Detectar se é SQLite ou PostgreSQL pela DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || '';
const isSQLite = databaseUrl.startsWith('file:');

const prisma = new PrismaClient();

async function listUsers() {
  console.log('👥 Listando usuários do sistema...');
  console.log('');

  try {
    const users = await prisma.user.findMany({
      include: {
        organization: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (users.length === 0) {
      console.log('⚠️  Nenhum usuário encontrado no banco de dados.');
      console.log('');
      console.log('💡 Dica: Crie um usuário com:');
      console.log('   node scripts/create-user-local.js');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuário(s):`);
    console.log('');
    console.log('─'.repeat(80));

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name || 'Sem nome'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Organização: ${user.organization?.name || 'N/A'}`);
      console.log(`   Ativo: ${user.isActive ? '✅ Sim' : '❌ Não'}`);
      console.log(`   Último login: ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('pt-BR') : 'Nunca'}`);
      console.log(`   Criado em: ${new Date(user.createdAt).toLocaleString('pt-BR')}`);
      if (index < users.length - 1) {
        console.log('   ' + '─'.repeat(76));
      }
    });

    console.log('');
    console.log('─'.repeat(80));
    console.log('');
    console.log('💡 Para atualizar a senha de um usuário:');
    console.log('   node scripts/update-password.js <email> <nova-senha>');
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    if (error.message && error.message.includes('database')) {
      console.error('\n💡 Dica: Certifique-se de que:');
      console.error('   1. O banco de dados está configurado corretamente');
      console.error('   2. O arquivo .env.local tem DATABASE_URL configurado');
      console.error('   3. Você executou: npm run db:generate');
    }
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
