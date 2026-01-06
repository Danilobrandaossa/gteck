const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * POST /api/pressel/create
 * Cria página no WordPress usando Pressel Automation
 */
router.post('/create', async (req, res) => {
  try {
    const { siteId, json, slug } = req.body;

    if (!siteId || !json) {
      return res.status(400).json({
        success: false,
        error: 'Site ID e JSON são obrigatórios'
      });
    }

    // Buscar configurações do site
    const site = await getSiteConfig(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site não encontrado'
      });
    }

    // Validar se o site tem configuração WordPress
    if (!site.wpBaseUrl || !site.wpAuth) {
      return res.status(400).json({
        success: false,
        error: 'Site não possui configuração WordPress válida'
      });
    }

    // Criar página no WordPress
    const result = await createWordPressPage(site, json, slug);

    // Adicionar à fila de processamento para monitoramento
    await addToQueue({
      type: 'pressel_create',
      siteId: siteId,
      pageId: result.post_id,
      status: 'completed',
      data: {
        title: json.page_title,
        url: result.view_link,
        editUrl: result.edit_link
      }
    });

    res.json({
      success: true,
      data: {
        post_id: result.post_id,
        edit_link: result.edit_link,
        view_link: result.view_link,
        message: 'Página criada com sucesso!'
      }
    });

  } catch (error) {
    console.error('Erro ao criar página:', error);
    
    // Adicionar erro à fila
    await addToQueue({
      type: 'pressel_create',
      siteId: req.body.siteId,
      status: 'failed',
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno ao criar página'
    });
  }
});

/**
 * Busca configurações do site
 */
async function getSiteConfig(siteId) {
  // Simular busca no banco de dados
  // Em produção, usar Prisma ou similar
  const sites = {
    'cri4': {
      id: 'cri4',
      name: 'cri4',
      wpBaseUrl: 'https://cri4.com',
      wpAuth: {
        type: 'basic',
        username: 'admin',
        password: 'app_password_here'
      }
    },
    'gr0k': {
      id: 'gr0k',
      name: 'gr0k',
      wpBaseUrl: 'https://gr0k.club',
      wpAuth: {
        type: 'basic',
        username: 'admin',
        password: 'app_password_here'
      }
    }
  };

  return sites[siteId] || null;
}

/**
 * Cria página no WordPress via Pressel Automation API
 */
async function createWordPressPage(site, json, customSlug) {
  const { wpBaseUrl, wpAuth } = site;
  
  // Preparar dados para a API do Pressel Automation
  const payload = {
    page_title: json.page_title,
    page_model: json.page_model || 'modelo_v1',
    page_slug: customSlug || json.page_slug,
    post_status: json.post_status || 'publish',
    acf_fields: json.acf_fields,
    seo: json.seo
  };

  // Configurar autenticação
  const authConfig = getAuthConfig(wpAuth);
  
  // Fazer requisição para o WordPress
  const response = await axios.post(
    `${wpBaseUrl}/wp-json/pressel-automation/v1/create-page`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        ...authConfig.headers
      },
      timeout: 30000 // 30 segundos
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.error || 'Erro desconhecido do WordPress');
  }

  return response.data.data;
}

/**
 * Configura autenticação para WordPress
 */
function getAuthConfig(wpAuth) {
  if (wpAuth.type === 'basic') {
    const credentials = Buffer.from(`${wpAuth.username}:${wpAuth.password}`).toString('base64');
    return {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    };
  } else if (wpAuth.type === 'bearer') {
    return {
      headers: {
        'Authorization': `Bearer ${wpAuth.token}`
      }
    };
  } else if (wpAuth.type === 'nonce') {
    return {
      headers: {
        'X-WP-Nonce': wpAuth.nonce
      }
    };
  }
  
  throw new Error('Tipo de autenticação não suportado');
}

/**
 * Adiciona job à fila de processamento
 */
async function addToQueue(jobData) {
  // Em produção, usar sistema de fila real (Redis, Bull, etc.)
  console.log('Job adicionado à fila:', jobData);
  
  // Simular inserção no banco
  // await db.queue.create({ data: jobData });
}

/**
 * GET /api/pressel/models
 * Lista modelos disponíveis
 */
router.get('/models', async (req, res) => {
  const models = [
    {
      id: 'modelo_v1',
      name: 'Modelo V1 (Brasileiro)',
      description: 'Template padrão brasileiro com design completo',
      template: 'pressel-oficial.php',
      locale: 'pt-BR',
      fields: [
        'hero_description',
        'titulo_da_secao',
        'texto_botao_p1',
        'link_botao_p1',
        'texto_botao_p2',
        'link_botao_p2',
        'texto_botao_p3',
        'link_botao_p3',
        'texto_usuario',
        'titulo_h2_',
        'info_content',
        'titulo_beneficios',
        'beneficios',
        'titulo_faq',
        'faq_items',
        'botao_tipo_selecao',
        'cor_botao'
      ]
    }
    // Futuros modelos serão adicionados aqui
  ];

  res.json({
    success: true,
    data: models
  });
});

/**
 * GET /api/pressel/sites
 * Lista sites com configuração WordPress
 */
router.get('/sites', async (req, res) => {
  const sites = await getSitesWithWordPress();
  
  res.json({
    success: true,
    data: sites
  });
});

/**
 * Busca sites com configuração WordPress
 */
async function getSitesWithWordPress() {
  // Em produção, buscar do banco de dados
  return [
    {
      id: 'cri4',
      name: 'cri4',
      url: 'https://cri4.com',
      wpConfigured: true,
      wpBaseUrl: 'https://cri4.com',
      lastSync: '2025-01-15T10:30:00Z'
    },
    {
      id: 'gr0k',
      name: 'gr0k',
      url: 'https://gr0k.club',
      wpConfigured: true,
      wpBaseUrl: 'https://gr0k.club',
      lastSync: '2025-01-15T09:15:00Z'
    }
  ];
}

module.exports = router;

