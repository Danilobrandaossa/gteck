/**
 * Script para popular dados iniciais no banco SQLite local
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedLocalDatabase() {
  console.log('🌱 Populando banco de dados local...');

  try {
    // 1. Criar organização padrão
    const organization = await prisma.organization.create({
      data: {
        name: 'Organização Padrão',
        slug: 'default-org',
        description: 'Organização padrão para desenvolvimento local',
        settings: JSON.stringify({
          theme: 'default',
          features: ['pages', 'media', 'templates', 'ai']
        })
      }
    });

    console.log('✅ Organização criada:', organization.name);

    // 2. Criar usuário admin
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@cms.local',
        name: 'Administrador',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'admin',
        isActive: true,
        organizationId: organization.id
      }
    });

    console.log('✅ Usuário admin criado:', adminUser.email);

    // 3. Criar site padrão
    const defaultSite = await prisma.site.create({
      data: {
        name: 'Site Padrão',
        url: 'https://atlz.online/',
        description: 'Site padrão para desenvolvimento local',
        isActive: true,
        organizationId: organization.id,
        settings: JSON.stringify({
          theme: 'pressel-v3',
          features: ['acf', 'seo', 'analytics']
        })
      }
    });

    console.log('✅ Site criado:', defaultSite.name);

    // 4. Criar template padrão
    const defaultTemplate = await prisma.template.create({
      data: {
        name: 'Template Padrão',
        slug: 'default-template',
        description: 'Template padrão para páginas',
        content: '<div class="page-content">{{content}}</div>',
        fields: JSON.stringify([
          {
            name: 'title',
            type: 'text',
            label: 'Título',
            required: true
          },
          {
            name: 'content',
            type: 'textarea',
            label: 'Conteúdo',
            required: true
          }
        ]),
        isActive: true
      }
    });

    console.log('✅ Template criado:', defaultTemplate.name);

    // 5. Criar categoria padrão
    const defaultCategory = await prisma.category.create({
      data: {
        name: 'Geral',
        slug: 'geral',
        description: 'Categoria geral para páginas',
        siteId: defaultSite.id
      }
    });

    console.log('✅ Categoria criada:', defaultCategory.name);

    // 6. Criar página de exemplo
    const examplePage = await prisma.page.create({
      data: {
        title: 'Página de Exemplo',
        slug: 'pagina-exemplo',
        content: '<h1>Bem-vindo ao CMS!</h1><p>Esta é uma página de exemplo criada automaticamente.</p>',
        excerpt: 'Página de exemplo do CMS',
        status: 'published',
        seoTitle: 'Página de Exemplo - CMS',
        seoDescription: 'Esta é uma página de exemplo do CMS Moderno',
        seoKeywords: 'cms, exemplo, página',
        publishedAt: new Date(),
        siteId: defaultSite.id,
        authorId: adminUser.id,
        categoryId: defaultCategory.id,
        templateId: defaultTemplate.id,
        customFields: JSON.stringify({
          hero_title: 'Bem-vindo ao CMS Moderno',
          hero_subtitle: 'Sistema de gerenciamento de conteúdo com IA'
        })
      }
    });

    console.log('✅ Página de exemplo criada:', examplePage.title);

    // 7. Criar conteúdo de IA de exemplo
    const aiContent = await prisma.aIContent.create({
      data: {
        title: 'Ideias de Post para o Blog',
        status: 'draft',
        language: 'pt-BR',
        keywords: 'marketing digital, conteúdo',
        prompt: 'Crie um artigo sobre estratégias de marketing digital para pequenos negócios.',
        siteId: defaultSite.id,
        authorId: adminUser.id,
        generationConfig: JSON.stringify({ model: 'gpt-4', temperature: 0.7 }),
        history: {
          create: [
            {
              action: 'generate',
              metadata: JSON.stringify({ generatedBy: 'seed-local', origin: 'seed' })
            }
          ]
        }
      }
    });

    console.log('✅ Conteúdo de IA criado:', aiContent.title);

    // 8. Criar job na fila de exemplo
    const queueJob = await prisma.queueJob.create({
      data: {
        type: 'ai-regeneration',
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
        data: JSON.stringify({
          contentId: aiContent.id,
          requestedBy: adminUser.email,
          prompt: aiContent.prompt
        })
      }
    });

    console.log('✅ Job de fila criado:', queueJob.id);

    console.log('\n🎉 Banco de dados local populado com sucesso!');
    console.log('📊 Dados criados:');
    console.log(`   - Organização: ${organization.name}`);
    console.log(`   - Usuário: ${adminUser.email} (senha: password)`);
    console.log(`   - Site: ${defaultSite.name}`);
    console.log(`   - Template: ${defaultTemplate.name}`);
    console.log(`   - Categoria: ${defaultCategory.name}`);
    console.log(`   - Página: ${examplePage.title}`);
    console.log(`   - Conteúdo IA: ${aiContent.title}`);
    console.log(`   - Job Fila: ${queueJob.id}`);

  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedLocalDatabase();
