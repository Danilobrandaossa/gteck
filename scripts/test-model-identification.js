/**
 * Teste de Identificação Inteligente de Modelos Pressel
 * Cada modelo (V1, V3, V4, V5, B1) tem estrutura única
 */

const fetch = require('node-fetch');

const CMS_URL = 'http://localhost:3002';

async function testModelIdentification() {
  console.log('🧠 TESTE DE IDENTIFICAÇÃO INTELIGENTE DE MODELOS');
  console.log('================================================\n');

  // Dados de teste específicos para cada modelo
  const testCases = [
    {
      name: 'Modelo V1 - Pressel Oficial',
      description: 'Estrutura com seções de benefícios e FAQ',
      json: {
        page_title: 'Aplicativo de Figurinhas Cristãs',
        page_content: 'Conteúdo sobre aplicativo de figurinhas',
        acf_fields: {
          hero_title: 'Aplicativo de figurinhas cristãs para WhatsApp',
          hero_description: 'Aplicativo de figurinhas cristãs com pacotes grátis',
          titulo_da_secao: 'Instale grátis e teste pacotes selecionados',
          cor_botao: '#2352AE',
          texto_botao_p1: 'BAIXAR AGORA GRÁTIS',
          link_botao_p1: 'https://exemplo.com/app',
          titulo_h2_: 'Mensagens que acolhem: fé no dia a dia',
          titulo_h2_02: 'Como funciona com transparência',
          titulo_beneficios: 'Benefícios do aplicativo',
          titulo_faq: 'Perguntas Frequentes',
          pergunta_1: 'O aplicativo é gratuito?',
          pergunta_2: 'Funciona no meu WhatsApp?',
          pergunta_3: 'Vocês são afiliados ao WhatsApp?',
          resposta_1: 'Sim, o aplicativo é totalmente gratuito',
          resposta_2: 'Sim, funciona em qualquer WhatsApp',
          resposta_3: 'Não, somos independentes'
        }
      },
      expectedModel: 'V1'
    },
    {
      name: 'Modelo V3 - Estrutura de Conteúdo',
      description: 'Estrutura com seções de conteúdo e recursos',
      json: {
        page_title: 'Sistema de Gestão Empresarial',
        page_content: 'Conteúdo sobre sistema de gestão',
        acf_fields: {
          hero_title: 'Sistema de Gestão Empresarial',
          hero_subtitle: 'Gerencie sua empresa de forma inteligente',
          hero_cta_text: 'Começar Agora',
          hero_cta_link: 'https://exemplo.com/comecar',
          content_sections: [
            { title: 'Recursos Principais', content: 'Lista de recursos' },
            { title: 'Benefícios', content: 'Lista de benefícios' }
          ],
          features_list: ['Gestão de estoque', 'Controle financeiro', 'Relatórios'],
          testimonials: [
            { name: 'João Silva', text: 'Excelente sistema' },
            { name: 'Maria Santos', text: 'Muito fácil de usar' }
          ],
          pricing_section: {
            basic: 'R$ 99/mês',
            premium: 'R$ 199/mês',
            enterprise: 'R$ 399/mês'
          }
        }
      },
      expectedModel: 'V3'
    },
    {
      name: 'Modelo V4 - Produto com Galeria',
      description: 'Estrutura de produto com galeria e especificações',
      json: {
        page_title: 'Smartphone XYZ Pro',
        page_content: 'Conteúdo sobre smartphone',
        acf_fields: {
          banner_title: 'Smartphone XYZ Pro',
          banner_subtitle: 'O futuro da tecnologia móvel',
          banner_background: 'https://via.placeholder.com/1200x600',
          product_gallery: [
            'https://via.placeholder.com/600x400',
            'https://via.placeholder.com/600x400',
            'https://via.placeholder.com/600x400'
          ],
          specifications: {
            screen: '6.7 polegadas',
            camera: '108MP',
            battery: '5000mAh',
            storage: '256GB'
          },
          reviews_section: {
            rating: 4.8,
            total_reviews: 1250,
            reviews: [
              { rating: 5, text: 'Excelente produto' },
              { rating: 4, text: 'Muito bom' }
            ]
          },
          related_products: ['XYZ Lite', 'XYZ Max', 'XYZ Ultra']
        }
      },
      expectedModel: 'V4'
    },
    {
      name: 'Modelo V5 - Landing Page',
      description: 'Landing page com vídeo e seções de benefícios',
      json: {
        page_title: 'Curso Online de Marketing Digital',
        page_content: 'Conteúdo sobre curso',
        acf_fields: {
          landing_title: 'Domine o Marketing Digital',
          landing_subtitle: 'Aprenda as estratégias que realmente funcionam',
          landing_cta: 'Quero Começar Agora',
          video_section: {
            title: 'Veja como funciona',
            video_url: 'https://youtube.com/watch?v=exemplo',
            thumbnail: 'https://via.placeholder.com/800x450'
          },
          steps_section: [
            { step: 1, title: 'Inscreva-se', description: 'Cadastre-se gratuitamente' },
            { step: 2, title: 'Aprenda', description: 'Assista às aulas' },
            { step: 3, title: 'Pratique', description: 'Aplique o conhecimento' }
          ],
          benefits_grid: [
            { title: 'Certificado', description: 'Certificado reconhecido' },
            { title: 'Suporte', description: 'Suporte 24/7' },
            { title: 'Comunidade', description: 'Acesso à comunidade' }
          ],
          social_media: {
            instagram: '@exemplo',
            facebook: 'facebook.com/exemplo',
            youtube: 'youtube.com/exemplo'
          }
        }
      },
      expectedModel: 'V5'
    },
    {
      name: 'Modelo B1 - Blog',
      description: 'Blog com informações de autor e tags',
      json: {
        page_title: 'Como Criar um Blog de Sucesso',
        page_content: 'Conteúdo sobre criação de blog',
        acf_fields: {
          blog_title: 'Como Criar um Blog de Sucesso',
          blog_subtitle: 'Guia completo para iniciantes',
          author_info: {
            name: 'João Silva',
            bio: 'Especialista em marketing digital',
            avatar: 'https://via.placeholder.com/100x100',
            social: '@joaosilva'
          },
          publish_date: '2024-01-15',
          reading_time: '5 min',
          tags_list: ['blog', 'marketing', 'iniciantes', 'dicas'],
          related_posts: [
            'Como Escolher um Domínio',
            'Melhores Plataformas de Blog',
            'SEO para Iniciantes'
          ],
          comments_section: {
            enabled: true,
            moderation: true
          },
          share_buttons: {
            facebook: true,
            twitter: true,
            linkedin: true,
            whatsapp: true
          }
        }
      },
      expectedModel: 'B1'
    }
  ];

  console.log(`🧪 Testando ${testCases.length} casos de identificação...\n`);

  let successCount = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    console.log(`📋 Testando: ${testCase.name}`);
    console.log(`📝 Descrição: ${testCase.description}`);
    console.log(`🎯 Modelo esperado: ${testCase.expectedModel}`);
    
    try {
      const response = await fetch(`${CMS_URL}/api/pressel/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: 'https://atlz.online/',
          jsonData: testCase.json,
          testMode: true
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const detectedModel = result.result.steps[1].data.detectedModel;
        const confidence = result.result.steps[1].data.confidence;
        const matchedFields = result.result.steps[1].data.matchedFields;
        
        console.log(`✅ Modelo detectado: ${detectedModel}`);
        console.log(`📈 Confiança: ${Math.round(confidence * 100)}%`);
        console.log(`🔗 Campos correspondentes: ${matchedFields.length}`);
        
        if (detectedModel === testCase.expectedModel) {
          console.log(`🎉 SUCESSO: Modelo identificado corretamente!`);
          successCount++;
        } else {
          console.log(`❌ FALHA: Esperado ${testCase.expectedModel}, detectado ${detectedModel}`);
        }
      } else {
        console.log(`❌ Erro na identificação: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`❌ Erro na requisição: ${error.message}`);
    }
    
    console.log(''); // Linha em branco
  }

  // Resumo final
  console.log('📊 RESUMO DOS TESTES');
  console.log('===================');
  console.log(`✅ Testes bem-sucedidos: ${successCount}/${totalTests}`);
  console.log(`📈 Taxa de sucesso: ${Math.round((successCount / totalTests) * 100)}%`);
  
  if (successCount === totalTests) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Sistema de identificação funcionando perfeitamente.');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique a configuração dos modelos.');
  }
  
  console.log('\n🚀 Próximos passos:');
  console.log('   1. Fazer upload dos modelos reais (V1, V3, V4, V5, B1)');
  console.log('   2. Executar script de processamento');
  console.log('   3. Testar com dados reais de produção');
  console.log('   4. Configurar para todos os sites do CMS');
}

testModelIdentification();





