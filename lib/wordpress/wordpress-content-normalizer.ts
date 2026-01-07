/**
 * WordPress Content Normalizer
 * FASE G.2 - Normalização de Conteúdo WP (Antes de Chunking)
 * 
 * Converte conteúdo WordPress (HTML) em texto limpo para IA
 */

export interface WordPressContent {
  title: string
  slug?: string
  content: string
  excerpt?: string
  categories?: string[]
  tags?: string[]
  acfFields?: Record<string, any>
}

export interface NormalizedContent {
  text: string
  metadata: {
    title: string
    slug?: string
    hasExcerpt: boolean
    hasCategories: boolean
    hasTags: boolean
    hasAcf: boolean
  }
}

export class WordPressContentNormalizer {
  /**
   * Normaliza conteúdo WordPress para texto IA
   */
  static normalize(content: WordPressContent): NormalizedContent {
    const parts: string[] = []

    // 1. Título (sempre primeiro)
    if (content.title) {
      parts.push(`# ${content.title}`)
      parts.push('') // Linha em branco
    }

    // 2. Excerpt (se existir, antes do corpo)
    if (content.excerpt && content.excerpt.trim().length > 0) {
      const excerptText = this.stripHtml(content.excerpt)
      if (excerptText.trim().length > 0) {
        parts.push(`**Resumo:** ${excerptText}`)
        parts.push('') // Linha em branco
      }
    }

    // 3. Taxonomias importantes (categorias e tags)
    if (content.categories && content.categories.length > 0) {
      parts.push(`**Categorias:** ${content.categories.join(', ')}`)
    }
    if (content.tags && content.tags.length > 0) {
      parts.push(`**Tags:** ${content.tags.join(', ')}`)
    }
    if ((content.categories && content.categories.length > 0) || 
        (content.tags && content.tags.length > 0)) {
      parts.push('') // Linha em branco
    }

    // 4. Conteúdo principal (HTML → Texto)
    if (content.content) {
      const normalizedContent = this.normalizeHtml(content.content)
      if (normalizedContent.trim().length > 0) {
        parts.push(normalizedContent)
      }
    }

    // 5. ACF Fields importantes (opcional, apenas campos textuais relevantes)
    if (content.acfFields) {
      const acfText = this.extractAcfText(content.acfFields)
      if (acfText.trim().length > 0) {
        parts.push('') // Linha em branco
        parts.push('---')
        parts.push('**Informações Adicionais:**')
        parts.push(acfText)
      }
    }

    const text = parts.join('\n').trim()

    return {
      text,
      metadata: {
        title: content.title,
        slug: content.slug,
        hasExcerpt: !!(content.excerpt && content.excerpt.trim().length > 0),
        hasCategories: !!(content.categories && content.categories.length > 0),
        hasTags: !!(content.tags && content.tags.length > 0),
        hasAcf: !!(content.acfFields && Object.keys(content.acfFields).length > 0)
      }
    }
  }

  /**
   * Remove HTML e preserva estrutura básica
   */
  private static stripHtml(html: string): string {
    if (!html) return ''

    // Remover scripts e styles
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

    // Converter headings para markdown
    text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')
    text = text.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n')
    text = text.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n')

    // Converter listas
    text = text.replace(/<ul[^>]*>/gi, '\n')
    text = text.replace(/<\/ul>/gi, '\n')
    text = text.replace(/<ol[^>]*>/gi, '\n')
    text = text.replace(/<\/ol>/gi, '\n')
    text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')

    // Converter parágrafos
    text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')

    // Converter quebras de linha
    text = text.replace(/<br[^>]*>/gi, '\n')

    // Converter strong e em
    text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')

    // Converter links (preservar texto)
    text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')

    // Remover todas as outras tags HTML
    text = text.replace(/<[^>]+>/g, '')

    // Decodificar entidades HTML
    text = text.replace(/&nbsp;/g, ' ')
    text = text.replace(/&amp;/g, '&')
    text = text.replace(/&lt;/g, '<')
    text = text.replace(/&gt;/g, '>')
    text = text.replace(/&quot;/g, '"')
    text = text.replace(/&#39;/g, "'")
    text = text.replace(/&apos;/g, "'")

    // Limpar espaços em branco excessivos
    text = text.replace(/\n{3,}/g, '\n\n')
    text = text.replace(/[ \t]+/g, ' ')
    text = text.trim()

    return text
  }

  /**
   * Normaliza HTML preservando estrutura de headings
   */
  private static normalizeHtml(html: string): string {
    return this.stripHtml(html)
  }

  /**
   * Extrai texto relevante de campos ACF
   */
  private static extractAcfText(acfFields: Record<string, any>): string {
    const textParts: string[] = []

    for (const [key, value] of Object.entries(acfFields)) {
      if (value === null || value === undefined) continue

      // Ignorar campos que não são texto
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Objeto aninhado (recursivo)
        const nestedText = this.extractAcfText(value)
        if (nestedText.trim().length > 0) {
          textParts.push(`**${key}:** ${nestedText}`)
        }
      } else if (Array.isArray(value)) {
        // Array (juntar valores)
        const arrayText = value
          .filter(v => v !== null && v !== undefined)
          .map(v => typeof v === 'string' ? v : JSON.stringify(v))
          .join(', ')
        if (arrayText.trim().length > 0) {
          textParts.push(`**${key}:** ${arrayText}`)
        }
      } else if (typeof value === 'string' && value.trim().length > 0) {
        // String (adicionar diretamente)
        const cleanValue = this.stripHtml(value)
        if (cleanValue.trim().length > 0) {
          textParts.push(`**${key}:** ${cleanValue}`)
        }
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        // Número ou boolean
        textParts.push(`**${key}:** ${value}`)
      }
    }

    return textParts.join('\n')
  }

  /**
   * Remove shortcodes WordPress (básico)
   */
// @ts-ignore
  private static _removeShortcodes(text: string): string {
    // Remover shortcodes simples [shortcode] ou [shortcode param="value"]
    return text.replace(/\[[^\]]+\]/g, '')
  }
}








