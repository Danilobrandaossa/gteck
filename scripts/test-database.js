/**
 * Script para testar o banco SQLite local
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🔍 Testando banco de dados SQLite...');

  try {
    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida');

    // Testar criação de uma organização
    const testOrg = await prisma.organization.create({
      data: {
        name: 'Teste',
        slug: 'teste-' + Date.now(),
        description: 'Organização de teste',
        settings: '{}'
      }
    });

    console.log('✅ Organização criada:', testOrg.name);

    // Testar busca
    const orgs = await prisma.organization.findMany();
    console.log('✅ Organizações encontradas:', orgs.length);

    // Limpar dados de teste
    await prisma.organization.delete({
      where: { id: testOrg.id }
    });

    console.log('✅ Dados de teste removidos');

    console.log('\n🎉 Banco de dados SQLite funcionando perfeitamente!');

  } catch (error) {
    console.error('❌ Erro ao testar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();





