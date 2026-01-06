const express = require('express');
const router = express.Router();

/**
 * POST /api/pressel/convert
 * Converte texto do ChatGPT para JSON estruturado do Pressel Automation
 */
router.post('/convert', async (req, res) => {
  try {
    const { text, model = 'modelo_v1', options = {} } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Texto do ChatGPT é obrigatório'
      });
    }

    // Converter texto para JSON estruturado
    const jsonData = await convertTextToPresselJSON(text, model, options);

    res.json({
      success: true,
      data: {
        json: jsonData,
        model: model,
        preview: {
          title: jsonData.page_title,
          description: jsonData.acf_fields?.hero_description?.substring(0, 100) + '...',
          buttons: extractButtons(jsonData.acf_fields)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao converter texto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao converter texto'
    });
  }
});

/**
 * Converte texto do ChatGPT para JSON do Pressel Automation
 */
async function convertTextToPresselJSON(text, model, options) {
  // Extrair informações do texto usando regex e análise
  const title = extractTitle(text);
  const description = extractDescription(text);
  const benefits = extractBenefits(text);
  const faq = extractFAQ(text);
  const buttons = extractButtonsFromText(text, options);

  // Estrutura base do JSON conforme schema do guia
  const jsonData = {
    page_title: title,
    page_model: model,
    page_slug: options.slug || generateSlug(title),
    post_status: 'publish',
    acf_fields: {
      // Hero Section
      hero_description: description,
      
      // Botões principais
      titulo_da_secao: "Acesse Agora",
      texto_botao_p1: buttons[0]?.text || "VER MAIS",
      link_botao_p1: buttons[0]?.url || options.button1Url || "https://exemplo.com",
      texto_botao_p2: buttons[1]?.text || "SAIBA MAIS",
      link_botao_p2: buttons[1]?.url || options.button2Url || "https://exemplo.com",
      texto_botao_p3: buttons[2]?.text || "CONHEÇA",
      link_botao_p3: buttons[2]?.url || options.button3Url || "https://exemplo.com",
      
      // Conteúdo principal
      texto_usuario: text,
      titulo_h2_: "Por que escolher nosso produto?",
      info_content: description,
      
      // Benefícios
      titulo_beneficios: "Principais Benefícios",
      beneficios: benefits,
      
      // FAQ
      titulo_faq: "Perguntas Frequentes",
      faq_items: faq,
      
      // Configurações de botão
      botao_tipo_selecao: options.buttonType || "normal",
      cor_botao: options.buttonColor || "#2352AE"
    },
    seo: {
      meta_title: title,
      meta_description: description.substring(0, 160),
      focus_keyword: extractMainKeyword(text)
    }
  };

  return jsonData;
}

/**
 * Extrai título do texto
 */
function extractTitle(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const firstLine = lines[0]?.trim();
  
  // Se a primeira linha parece um título (curta e sem pontuação no final)
  if (firstLine && firstLine.length < 100 && !firstLine.endsWith('.')) {
    return firstLine;
  }
  
  // Buscar por padrões de título
  const titleMatch = text.match(/^(?:#\s*)?(.+?)(?:\n|$)/m);
  return titleMatch ? titleMatch[1].trim() : "Página Pressel";
}

/**
 * Extrai descrição/primeiro parágrafo
 */
function extractDescription(text) {
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  const firstParagraph = paragraphs[0]?.trim();
  
  if (firstParagraph && firstParagraph.length > 50) {
    return firstParagraph.substring(0, 200) + '...';
  }
  
  return "Descrição da página pressel gerada automaticamente.";
}

/**
 * Extrai benefícios do texto
 */
function extractBenefits(text) {
  const benefits = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^[-•]\s+/) || trimmed.match(/^\d+\.\s+/)) {
      benefits.push(trimmed.replace(/^[-•]\s+/, '').replace(/^\d+\.\s+/, ''));
    }
  }
  
  return benefits.slice(0, 5); // Máximo 5 benefícios
}

/**
 * Extrai FAQ do texto
 */
function extractFAQ(text) {
  const faq = [];
  const lines = text.split('\n');
  let currentQ = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^[Pp]ergunta|^[Qq]uestion|^[Ff]AQ/)) {
      if (currentQ) faq.push(currentQ);
      currentQ = { question: trimmed, answer: '' };
    } else if (currentQ && trimmed.length > 10) {
      currentQ.answer += (currentQ.answer ? ' ' : '') + trimmed;
    }
  }
  
  if (currentQ) faq.push(currentQ);
  return faq.slice(0, 5); // Máximo 5 FAQs
}

/**
 * Extrai botões do texto e opções
 */
function extractButtonsFromText(text, options) {
  const buttons = [];
  
  // Buscar por links no texto
  const linkRegex = /https?:\/\/[^\s]+/g;
  const links = text.match(linkRegex) || [];
  
  // Usar links encontrados ou opções fornecidas
  if (options.button1Url) buttons.push({ text: "VER MAIS", url: options.button1Url });
  if (options.button2Url) buttons.push({ text: "SAIBA MAIS", url: options.button2Url });
  if (options.button3Url) buttons.push({ text: "CONHEÇA", url: options.button3Url });
  
  // Se não há opções, usar links encontrados
  if (buttons.length === 0 && links.length > 0) {
    buttons.push({ text: "ACESSAR", url: links[0] });
  }
  
  return buttons;
}

/**
 * Extrai botões do JSON ACF
 */
function extractButtons(acfFields) {
  const buttons = [];
  if (acfFields?.texto_botao_p1 && acfFields?.link_botao_p1) {
    buttons.push({ text: acfFields.texto_botao_p1, url: acfFields.link_botao_p1 });
  }
  if (acfFields?.texto_botao_p2 && acfFields?.link_botao_p2) {
    buttons.push({ text: acfFields.texto_botao_p2, url: acfFields.link_botao_p2 });
  }
  if (acfFields?.texto_botao_p3 && acfFields?.link_botao_p3) {
    buttons.push({ text: acfFields.texto_botao_p3, url: acfFields.link_botao_p3 });
  }
  return buttons;
}

/**
 * Gera slug a partir do título
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

/**
 * Extrai palavra-chave principal
 */
function extractMainKeyword(text) {
  // Buscar por palavras-chave comuns
  const keywords = text.match(/\b(aprender|curso|gratuito|download|tutorial|guia|como|melhor|top|melhores)\b/gi);
  return keywords ? keywords[0].toLowerCase() : 'pressel';
}

module.exports = router;

