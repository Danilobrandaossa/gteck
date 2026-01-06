#!/usr/bin/env node

/**
 * Script de Teste Real para Upload no WordPress
 * Testa a integração real com WordPress REST API
 */

const fs = require('fs');
const path = require('path');

// Configurações
const CMS_URL = 'http://localhost:3002';
const WORDPRESS_SITE = 'https://atlz.online/';

// Usar credenciais do sistema (do .env.local)
const WORDPRESS_USERNAME = process.env.WORDPRESS_DEFAULT_USERNAME || 'admin';
const WORDPRESS_PASSWORD = process.env.WORDPRESS_DEFAULT_PASSWORD || 'your_app_password';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testRealWordPressUpload() {
  log('🚀 Teste Real de Upload no WordPress', 'bright');
  log('=' .repeat(60), 'blue');

  try {
    // Passo 1: Verificar credenciais WordPress
    logStep('1', 'Verificando credenciais WordPress...');
    
    if (!WORDPRESS_PASSWORD || WORDPRESS_PASSWORD === 'your_app_password') {
      logWarning('⚠️  Configure as credenciais WordPress no script antes de executar');
      log('📝 Edite o arquivo e configure WORDPRESS_USERNAME e WORDPRESS_PASSWORD', 'yellow');
      return;
    }

    // Passo 2: Testar conexão com WordPress
    logStep('2', 'Testando conexão com WordPress...');
    
    try {
      const auth = Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_PASSWORD}`).toString('base64');
      
      const response = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const user = await response.json();
        logSuccess(`Conectado como: ${user.name} (${user.slug})`);
      } else {
        logError(`Falha na autenticação: ${response.status}`);
        return;
      }
    } catch (error) {
      logError(`Erro na conexão: ${error.message}`);
      return;
    }

    // Passo 3: Criar página de teste
    logStep('3', 'Criando página de teste no WordPress...');
    
    const testPageData = {
      title: `Teste Pressel Automation - ${new Date().toISOString()}`,
      content: `
        <h2>Página Criada pelo Pressel Automation</h2>
        <p>Esta página foi criada automaticamente para testar a integração entre o CMS e o WordPress.</p>
        <p><strong>Data de criação:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <p><strong>Sistema:</strong> Pressel Automation CMS</p>
        
        <h3>Seções de Teste</h3>
        <div style="background: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h4>Seção 1: Informações Básicas</h4>
          <p>Conteúdo da primeira seção de teste.</p>
        </div>
        
        <div style="background: #e8f5e8; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h4>Seção 2: Campos ACF</h4>
          <p>Esta seção simula campos ACF personalizados.</p>
        </div>
        
        <div style="background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h4>Seção 3: SEO e Metadados</h4>
          <p>Seção para testar otimização SEO.</p>
        </div>
      `,
      status: 'draft', // Começar como rascunho
      excerpt: 'Página de teste criada pelo Pressel Automation',
      meta: {
        _created_by: 'Pressel Automation',
        _creation_date: new Date().toISOString(),
        _test_mode: true
      }
    };

    try {
      const auth = Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_PASSWORD}`).toString('base64');
      
      const createResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPageData)
      });

      if (createResponse.ok) {
        const createdPage = await createResponse.json();
        logSuccess(`Página criada com sucesso!`);
        log(`📄 ID: ${createdPage.id}`, 'blue');
        log(`🔗 URL: ${createdPage.link}`, 'blue');
        log(`✏️  Editar: ${WORDPRESS_SITE}wp-admin/post.php?post=${createdPage.id}&action=edit`, 'blue');
        
        // Passo 4: Testar atualização da página
        logStep('4', 'Testando atualização da página...');
        
        const updateData = {
          content: testPageData.content + `
            <div style="background: #d1ecf1; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h4>Seção Adicionada via Atualização</h4>
              <p>Esta seção foi adicionada após a criação inicial da página.</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            </div>
          `,
          status: 'publish' // Publicar a página
        };

        const updateResponse = await fetch(`${WORDPRESS_SITE}wp-json/wp/v2/pages/${createdPage.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });

        if (updateResponse.ok) {
          const updatedPage = await updateResponse.json();
          logSuccess(`Página atualizada e publicada!`);
          log(`🔗 URL Final: ${updatedPage.link}`, 'green');
        } else {
          logWarning(`Falha na atualização: ${updateResponse.status}`);
        }

        // Passo 5: Testar campos ACF (se disponível)
        logStep('5', 'Testando campos ACF...');
        
        try {
          const acfData = {
            fields: {
              hero_title: 'Título Principal da Página',
              hero_subtitle: 'Subtítulo explicativo',
              hero_image: 'https://via.placeholder.com/1200x600/FF6B35/FFFFFF?text=Hero+Image',
              content_sections: [
                {
                  title: 'Seção 1',
                  content: 'Conteúdo da primeira seção',
                  image: 'https://via.placeholder.com/600x400/66BB6A/FFFFFF?text=Section+1'
                },
                {
                  title: 'Seção 2',
                  content: 'Conteúdo da segunda seção',
                  image: 'https://via.placeholder.com/600x400/90CAF9/FFFFFF?text=Section+2'
                }
              ],
              cta_button_text: 'Saiba Mais',
              cta_button_link: '#contact',
              seo_title: 'Teste SEO - Página Automatizada',
              seo_description: 'Descrição SEO para teste de página automatizada',
              seo_keywords: 'teste, automatização, wordpress, cms'
            }
          };

          const acfResponse = await fetch(`${WORDPRESS_SITE}wp-json/acf/v3/pages/${createdPage.id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(acfData)
          });

          if (acfResponse.ok) {
            logSuccess('Campos ACF adicionados com sucesso!');
          } else {
            logWarning(`ACF não disponível ou erro: ${acfResponse.status}`);
          }
        } catch (acfError) {
          logWarning(`Erro nos campos ACF: ${acfError.message}`);
        }

        // Resultado final
        log('\n' + '=' .repeat(60), 'blue');
        log('🎉 Teste Real Concluído com Sucesso!', 'bright');
        log(`📄 Página criada: ${createdPage.link}`, 'green');
        log(`✏️  Editar: ${WORDPRESS_SITE}wp-admin/post.php?post=${createdPage.id}&action=edit`, 'blue');
        log('📝 Verifique no WordPress se a página foi criada corretamente', 'yellow');

      } else {
        const errorText = await createResponse.text();
        logError(`Falha na criação: ${createResponse.status} - ${errorText}`);
      }

    } catch (error) {
      logError(`Erro na criação da página: ${error.message}`);
    }

  } catch (error) {
    logError(`Erro geral no teste: ${error.message}`);
  }
}

// Executar teste
if (require.main === module) {
  testRealWordPressUpload();
}

module.exports = { testRealWordPressUpload };
