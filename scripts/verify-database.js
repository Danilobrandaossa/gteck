/**
 * Script para verificar a estrutura completa do banco de dados
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyDatabaseStructure() {
  console.log('🔍 VERIFICANDO ESTRUTURA COMPLETA DO BANCO DE DADOS');
  console.log('==================================================\n');

  try {
    // 1. Verificar conexão
    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida\n');

    // 2. Verificar todas as tabelas e seus dados
    const tables = [
      { name: 'Organizations', model: prisma.organization },
      { name: 'Users', model: prisma.user },
      { name: 'Sites', model: prisma.site },
      { name: 'Templates', model: prisma.template },
      { name: 'Categories', model: prisma.category },
      { name: 'Pages', model: prisma.page },
      { name: 'Media', model: prisma.media },
      { name: 'QueueJobs', model: prisma.queueJob },
      { name: 'WordPressDiagnostics', model: prisma.wordPressDiagnostic }
    ];

    console.log('📊 CONTAGEM DE REGISTROS POR TABELA:');
    console.log('-----------------------------------');

    for (const table of tables) {
      try {
        const count = await table.model.count();
        console.log(`✅ ${table.name}: ${count} registros`);
        
        // Mostrar alguns registros de exemplo para tabelas com dados
        if (count > 0 && count <= 5) {
          const records = await table.model.findMany();
          console.log(`   📝 Registros:`);
          records.forEach((record, index) => {
            const key = record.name || record.title || record.email || record.filename || `ID: ${record.id}`;
            console.log(`      ${index + 1}. ${key}`);
          });
        } else if (count > 5) {
          const sample = await table.model.findMany({ take: 3 });
          console.log(`   📝 Amostra (3 de ${count}):`);
          sample.forEach((record, index) => {
            const key = record.name || record.title || record.email || record.filename || `ID: ${record.id}`;
            console.log(`      ${index + 1}. ${key}`);
          });
        }
        console.log('');
      } catch (error) {
        console.log(`❌ ${table.name}: Erro - ${error.message}`);
      }
    }

    // 3. Verificar relacionamentos
    console.log('🔗 VERIFICANDO RELACIONAMENTOS:');
    console.log('-------------------------------');

    try {
      const orgs = await prisma.organization.findMany({
        include: {
          users: true,
          sites: true
        }
      });

      orgs.forEach(org => {
        console.log(`📁 Organização: ${org.name}`);
        console.log(`   👥 Usuários: ${org.users.length}`);
        console.log(`   🌐 Sites: ${org.sites.length}`);
        
        org.sites.forEach(site => {
          console.log(`      - ${site.name} (${site.url})`);
        });
        console.log('');
      });
    } catch (error) {
      console.log(`❌ Erro ao verificar relacionamentos: ${error.message}`);
    }

    // 4. Verificar integridade dos dados
    console.log('🔍 VERIFICANDO INTEGRIDADE DOS DADOS:');
    console.log('------------------------------------');

    try {
      // Verificar se há usuário admin
      const adminUser = await prisma.user.findFirst({
        where: { email: 'admin@cms.local' }
      });
      
      if (adminUser) {
        console.log('✅ Usuário admin encontrado:', adminUser.email);
        console.log(`   👤 Nome: ${adminUser.name}`);
        console.log(`   🔑 Role: ${adminUser.role}`);
        console.log(`   ✅ Ativo: ${adminUser.isActive ? 'Sim' : 'Não'}`);
      } else {
        console.log('❌ Usuário admin não encontrado');
      }

      // Verificar se há site padrão
      const defaultSite = await prisma.site.findFirst({
        where: { url: 'https://atlz.online/' }
      });
      
      if (defaultSite) {
        console.log('✅ Site padrão encontrado:', defaultSite.name);
        console.log(`   🌐 URL: ${defaultSite.url}`);
        console.log(`   ✅ Ativo: ${defaultSite.isActive ? 'Sim' : 'Não'}`);
      } else {
        console.log('❌ Site padrão não encontrado');
      }

      // Verificar se há página de exemplo
      const examplePage = await prisma.page.findFirst({
        where: { slug: 'pagina-exemplo' }
      });
      
      if (examplePage) {
        console.log('✅ Página de exemplo encontrada:', examplePage.title);
        console.log(`   📄 Slug: ${examplePage.slug}`);
        console.log(`   📊 Status: ${examplePage.status}`);
      } else {
        console.log('❌ Página de exemplo não encontrada');
      }

    } catch (error) {
      console.log(`❌ Erro ao verificar integridade: ${error.message}`);
    }

    // 5. Verificar configurações JSON
    console.log('\n⚙️ VERIFICANDO CONFIGURAÇÕES JSON:');
    console.log('----------------------------------');

    try {
      const org = await prisma.organization.findFirst();
      if (org && org.settings) {
        const settings = JSON.parse(org.settings);
        console.log('✅ Configurações da organização:');
        console.log(`   🎨 Tema: ${settings.theme || 'N/A'}`);
        console.log(`   🔧 Funcionalidades: ${settings.features ? settings.features.join(', ') : 'N/A'}`);
      }

      const site = await prisma.site.findFirst();
      if (site && site.settings) {
        const settings = JSON.parse(site.settings);
        console.log('✅ Configurações do site:');
        console.log(`   🎨 Tema: ${settings.theme || 'N/A'}`);
        console.log(`   🔧 Funcionalidades: ${settings.features ? settings.features.join(', ') : 'N/A'}`);
      }

      const template = await prisma.template.findFirst();
      if (template && template.fields) {
        const fields = JSON.parse(template.fields);
        console.log('✅ Campos do template:');
        fields.forEach((field, index) => {
          console.log(`   ${index + 1}. ${field.name} (${field.type}) - ${field.label}`);
        });
      }

    } catch (error) {
      console.log(`❌ Erro ao verificar configurações JSON: ${error.message}`);
    }

    console.log('\n🎉 VERIFICAÇÃO COMPLETA FINALIZADA!');
    console.log('===================================');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabaseStructure();





