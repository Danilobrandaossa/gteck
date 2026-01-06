import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text, model } = await request.json()

    if (!text || !model) {
      return NextResponse.json(
        { error: 'Texto e modelo são obrigatórios' },
        { status: 400 }
      )
    }

    // Simular processamento de IA para converter texto em JSON
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Simular conversão baseada no modelo
    const jsonOutput = {
      page_title: extractTitle(text),
      page_model: `modelo_v${model}`,
      page_slug: generateSlug(extractTitle(text)),
      post_status: 'draft',
      acf_fields: generateACFFields(text, model),
      seo: {
        meta_title: extractTitle(text),
        meta_description: extractDescription(text),
        focus_keyword: extractKeywords(text)
      }
    }

    return NextResponse.json({
      success: true,
      data: jsonOutput,
      message: 'Texto convertido para JSON com sucesso'
    })

  } catch (error) {
    console.error('Erro ao converter texto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Funções auxiliares
function extractTitle(text: string): string {
  const lines = text.split('\n').filter(line => line.trim())
  return lines[0]?.trim() || 'Nova Página Pressel'
}

function extractDescription(text: string): string {
  const lines = text.split('\n').filter(line => line.trim())
  return lines[1]?.trim() || 'Descrição da página'
}

function extractKeywords(text: string): string {
  const words = text.toLowerCase().split(/\s+/)
  const commonWords = ['de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos', 'para', 'com', 'por', 'sobre', 'entre', 'até', 'desde', 'durante', 'após', 'antes', 'depois', 'quando', 'onde', 'como', 'porque', 'que', 'qual', 'quais', 'quem', 'cujo', 'cuja', 'cujos', 'cujas', 'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'meu', 'minha', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'seu', 'sua', 'seus', 'suas', 'nosso', 'nossa', 'nossos', 'nossas', 'vosso', 'vossa', 'vossos', 'vossas', 'se', 'não', 'mais', 'muito', 'pouco', 'bem', 'mal', 'sempre', 'nunca', 'já', 'ainda', 'também', 'só', 'apenas', 'até', 'mesmo', 'outro', 'outra', 'outros', 'outras', 'todo', 'toda', 'todos', 'todas', 'cada', 'qualquer', 'algum', 'alguma', 'alguns', 'algumas', 'nenhum', 'nenhuma', 'nenhuns', 'nenhumas', 'tanto', 'tanta', 'tantos', 'tantas', 'quanto', 'quanta', 'quantos', 'quantas', 'tanto', 'quanto', 'mais', 'menos', 'muito', 'pouco', 'bem', 'mal', 'melhor', 'pior', 'maior', 'menor', 'mais', 'menos', 'bem', 'mal', 'melhor', 'pior', 'maior', 'menor']
  const filteredWords = words.filter(word => word.length > 3 && !commonWords.includes(word))
  return Array.from(new Set(filteredWords)).slice(0, 3).join(', ')
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function generateACFFields(text: string, model: string): Record<string, any> {
  const acfFields: Record<string, any> = {}
  
  // Campos baseados no modelo
  switch (model) {
    case '1': // Pressel Oficial
      acfFields.hero_description = extractDescription(text)
      acfFields.titulo_da_secao = 'Acesse Agora'
      acfFields.texto_usuario = text.split('\n')[2]?.trim() || 'Conteúdo sobre o usuário'
      acfFields.titulo_h2_ = 'O que você vai aprender'
      acfFields.info_content = text.split('\n').slice(3).join('\n').trim() || 'Conteúdo informativo'
      acfFields.titulo_beneficios = 'Benefícios Exclusivos'
      acfFields.titulo_faq = 'Perguntas Frequentes'
      acfFields.texto_botao_p1 = 'VER MAIS'
      acfFields.link_botao_p1 = 'https://exemplo.com'
      break
    case '2': // Presell English
      acfFields.hero_description = extractDescription(text)
      acfFields.section_title = 'Access Now'
      break
    case '3': // Presell Minimal
      acfFields.titulo_principal = extractTitle(text)
      acfFields.conteudo_principal = text.split('\n').slice(1).join('\n').trim()
      break
    case '4': // Presell E-commerce
      acfFields.produto_nome = extractTitle(text)
      acfFields.produto_preco = 'R$ 99,90'
      acfFields.produto_descricao = extractDescription(text)
      break
    case '5': // Presell Affiliate
      acfFields.produto_afiliado = extractTitle(text)
      acfFields.link_afiliado = 'https://afiliado.com/produto'
      acfFields.comissao = '50% de comissão'
      break
    default:
      acfFields.hero_description = extractDescription(text)
      acfFields.titulo_principal = extractTitle(text)
  }
  
  return acfFields
}

