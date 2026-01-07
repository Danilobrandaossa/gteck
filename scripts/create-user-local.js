/**
 * Script para criar um novo usuário no banco SQLite local
 * 
 * Uso: node scripts/create-user-local.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');

// Usar PrismaClient gerado do schema-dev.prisma (SQLite)
// Nota: Você precisa ter gerado o client com: npm run db:local:generate
const prisma = new PrismaClient();

async function createUser() {
  console.log('👤 Criando novo usuário no banco local...');

  try {
    // Dados do usuário
    const email = 'contato@danilobrandao.com.br';
    const password = 'Zy598859D@n2';
    const name = 'Danilo Brandão';

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('⚠️  Usuário já existe:', email);
      console.log('   Atualizando senha...');
      
      // Fazer hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Atualizar usuário existente
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          isActive: true
        }
      });

      console.log('✅ Usuário atualizado com sucesso!');
      console.log(`   - Email: ${updatedUser.email}`);
      console.log(`   - Nome: ${updatedUser.name || 'Não definido'}`);
      console.log(`   - Role: ${updatedUser.role}`);
      console.log(`   - Ativo: ${updatedUser.isActive ? 'Sim' : 'Não'}`);
      
      await prisma.$disconnect();
      return;
    }

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

    // Fazer hash da senha
    console.log('🔐 Gerando hash da senha...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
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

    console.log('\n✅ Usuário criado com sucesso!');
    console.log('📊 Detalhes:');
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Nome: ${user.name}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Organização: ${organization.name}`);
    console.log(`   - Ativo: ${user.isActive ? 'Sim' : 'Não'}`);
    console.log(`\n🔑 Credenciais de login:`);
    console.log(`   - Email: ${email}`);
    console.log(`   - Senha: ${password}`);

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    if (error.code === 'P2002') {
      console.error('   Erro: Email já está em uso');
    } else if (error.message && error.message.includes('database')) {
      console.error('\n💡 Dica: Certifique-se de que:');
      console.error('   1. O banco de dados está configurado corretamente');
      console.error('   2. Você executou: npm run db:local:generate');
      console.error('   3. O arquivo .env.local tem DATABASE_URL configurado');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createUser();





