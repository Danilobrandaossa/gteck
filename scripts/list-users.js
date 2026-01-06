/**
 * Script para listar todos os usuários do sistema
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listUsers() {
  console.log('👥 Listando todos os usuários...\n');

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
      console.log('💡 Execute: node scripts/seed-local.js para criar usuários padrão.');
    } else {
      console.log(`✅ Encontrados ${users.length} usuário(s):\n`);
      
      users.forEach((user, index) => {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`👤 Usuário ${index + 1}:`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👨‍💼 Nome: ${user.name || 'Não definido'}`);
        console.log(`   🔑 Role: ${user.role}`);
        console.log(`   ✅ Ativo: ${user.isActive ? 'Sim' : 'Não'}`);
        console.log(`   🏢 Organização: ${user.organization?.name || 'N/A'}`);
        console.log(`   📅 Criado em: ${user.createdAt.toLocaleString('pt-BR')}`);
        console.log(`   🔐 Senha: [Hash bcrypt - não pode ser exibida]`);
        
        // Informar senha conhecida se for o admin padrão
        if (user.email === 'admin@cms.local') {
          console.log(`   💡 Senha padrão: password`);
        }
        
        console.log('');
      });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`\n📊 Resumo:`);
      console.log(`   - Total de usuários: ${users.length}`);
      console.log(`   - Usuários ativos: ${users.filter(u => u.isActive).length}`);
      console.log(`   - Usuários admin: ${users.filter(u => u.role === 'admin').length}`);
    }

  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    if (error.message && error.message.includes('database')) {
      console.error('\n💡 Dica: Certifique-se de que:');
      console.error('   1. O banco de dados está configurado corretamente');
      console.error('   2. Você executou: npm run db:local:generate (para SQLite)');
      console.error('   3. O arquivo .env.local tem DATABASE_URL configurado');
    }
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();



