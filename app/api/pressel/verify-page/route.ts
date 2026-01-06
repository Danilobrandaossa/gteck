import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const pageId = searchParams.get('id')
    const siteUrl = searchParams.get('siteUrl')
    
    if (!pageId || !siteUrl) {
      return NextResponse.json({
        success: false,
        error: 'ID da página e siteUrl são obrigatórios'
      }, { status: 400 })
    }

    const username = process.env.WORDPRESS_DEFAULT_USERNAME
    const password = process.env.WORDPRESS_DEFAULT_PASSWORD
    
    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: 'Credenciais WordPress não configuradas',
        pageId,
        editUrl: `${siteUrl}/wp-admin/post.php?post=${pageId}&action=edit`
      }, { status: 500 })
    }
    
    const auth = Buffer.from(`${username}:${password}`).toString('base64')
    
    // Buscar página com contexto edit (inclui meta fields)
    const response = await fetch(`${siteUrl}/wp-json/wp/v2/pages/${pageId}?context=edit`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    })
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Erro ao buscar página: ${response.status}`,
        pageId,
        editUrl: `${siteUrl}/wp-admin/post.php?post=${pageId}&action=edit`
      }, { status: response.status })
    }
    
    const pageData = await response.json()
    
    // Extrair template
    const template = pageData.meta?._wp_page_template || pageData.page_template || 'padrão'
    
    // Extrair campos ACF dos meta fields
    const acfFields: any = {}
    const metaFields = pageData.meta || {}
    
    // Campos principais
    const mainFields = [
      'idioma_footer', 'title_h1', 'sub_title', 'imagem_destaque',
      'tipo_botao', 'download_button_url', 'download_button_text',
      'disclaimer', 'description', 'benefits_title', 'title2',
      'description1', 'faq_title'
    ]
    
    mainFields.forEach(field => {
      if (metaFields[field] !== undefined) {
        acfFields[field] = metaFields[field]
      }
    })
    
    // Extrair benefits
    const benefits: string[] = []
    const benefitsCount = parseInt(metaFields.benefits || '0')
    for (let i = 0; i < benefitsCount; i++) {
      const benefitText = metaFields[`benefits_${i}_benefit_text`]
      if (benefitText) {
        benefits.push(benefitText)
      }
    }
    
    // Extrair FAQs
    const faqs: Array<{question: string, answer: string}> = []
    const faqsCount = parseInt(metaFields.faqs || '0')
    for (let i = 0; i < faqsCount; i++) {
      const question = metaFields[`faqs_${i}_question`]
      const answer = metaFields[`faqs_${i}_answer`]
      if (question && answer) {
        faqs.push({ question, answer })
      }
    }
    
    return NextResponse.json({
      success: true,
      pageId: parseInt(pageId),
      template,
      acfFields,
      benefits,
      faqs,
      pageTitle: pageData.title?.rendered || pageData.title,
      pageUrl: pageData.link || pageData.guid?.rendered,
      editUrl: `${siteUrl}/wp-admin/post.php?post=${pageId}&action=edit`,
      stats: {
        totalFields: Object.keys(acfFields).length,
        benefitsCount: benefits.length,
        faqsCount: faqs.length,
        templateApplied: template.includes('V4') || template === 'V4.php'
      }
    })
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}



