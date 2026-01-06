/**
 * Script para criar ou atualizar um usuário
 * 
 * Uso: node scripts/create-or-update-user.js <email> <senha> <nome>
 * Exemplo: node scripts/create-or-update-user.js contato@danilobrandao.com.br Zy598859D@n "Danilo Brandão"
 */

// Carregar variáveis de ambiente do .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createOrUpdateUser() {
  // Pegar argumentos da linha de comando
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Usuário';

  if (!email || !password) {
    console.log('❌ Erro: Email e senha são obrigatórios');
    console.log('');
    console.log('Uso: node scripts/create-or-update-user.js <email> <senha> [nome]');
    console.log('Exemplo: node scripts/create-or-update-user.js contato@danilobrandao.com.br Zy598859D@n "Danilo Brandão"');
    process.exit(1);
  }

  console.log('👤 Criando ou atualizando usuário...');
  console.log(`   Email: ${email}`);
  console.log(`   Nome: ${name}`);

  try {
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    // Buscar ou criar organização padrão
    let organization = await prisma.organization.findFirst({
      where: { slug: 'default-org' }
    });

    if (!organization) {
      console.log('📦 Criando organização padrão...');
      organization = await prisma.organization.create({
        data: {
          name: 'Organização Padrão',
          slug: 'default-org',
          description: 'Organização padrão',
          settings: JSON.stringify({
            theme: 'default',
            features: ['pages', 'media', 'templates', 'ai']
          })
        }
      });
      console.log('✅ Organização criada:', organization.name);
    }

    // Gerar hash da senha
    console.log('🔐 Gerando hash da senha...');
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      // Atualizar usuário existente
      console.log('⚠️  Usuário já existe. Atualizando...');
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          name: name,
          isActive: true
        }
      });

      console.log('');
      console.log('✅ Usuário atualizado com sucesso!');
      console.log('📋 Detalhes:');
      console.log(`   - Email: ${updatedUser.email}`);
      console.log(`   - Nome: ${updatedUser.name}`);
      console.log(`   - Role: ${updatedUser.role}`);
      console.log(`   - Organização: ${organization.name}`);
      console.log(`   - Ativo: ${updatedUser.isActive ? 'Sim' : 'Não'}`);
      console.log(`   - Nova senha: ${password}`);
    } else {
      // Criar novo usuário
      console.log('📝 Criando novo usuário...');
      const user = await prisma.user.create({
        data: {
          email: email,
          name: name,
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          organizationId: organization.id
        }
      });

      console.log('');
      console.log('✅ Usuário criado com sucesso!');
      console.log('📋 Detalhes:');
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Nome: ${user.name}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Organização: ${organization.name}`);
      console.log(`   - Ativo: ${user.isActive ? 'Sim' : 'Não'}`);
      console.log(`   - Senha: ${password}`);
    }

    console.log('');
    console.log('💡 Agora você pode fazer login com essas credenciais!');

  } catch (error) {
    console.error('❌ Erro:', error);
    if (error.code === 'P2002') {
      console.error('   Erro: Email já está em uso');
    } else if (error.message && error.message.includes('database')) {
      console.error('\n💡 Dica: Certifique-se de que:');
      console.error('   1. O banco de dados está configurado corretamente');
      console.error('   2. O arquivo .env.local tem DATABASE_URL configurado');
      console.error('   3. Você executou: npm run db:local:generate');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createOrUpdateUser();

