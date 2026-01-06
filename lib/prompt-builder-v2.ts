/**
 * Prompt Builder V2 - Direção Fotográfica Real
 * 
 * Refatoração completa dos prompts para:
 * - Evitar listas de keywords
 * - Escrever como direção fotográfica (lente, ambiente, iluminação, DOF, composição)
 * - Incluir negativos sempre
 * - Pedir negative space para overlay quando includeTextInImage=false
 */

export interface PromptContext {
  mainPrompt: string
  productName?: string
  imageReferences?: Array<{
    role: 'style' | 'produto' | 'inspiração'
    description?: string
  }>
  aspectRatio: '1:1' | '4:5' | '9:16' | '16:9'
  imageType: 'conceptual' | 'commercial'
  variation: number
  includeTextInImage: boolean
  qualityTier: 'draft' | 'production'
  tone?: 'professional' | 'casual' | 'friendly' | 'urgent' | 'inspiring'
  objective?: 'cliques' | 'whatsapp' | 'vendas' | 'leads' | 'visualizacoes'
}

export type StyleVariant = 'lifestyle' | 'studio-product' | 'editorial' | 'ugc-realista'

/**
 * Configurações técnicas por estilo
 */
const STYLE_CONFIGS: Record<StyleVariant, {
  lens: string
  environment: string
  lighting: string
  depthOfField: string
  composition: string
}> = {
  'lifestyle': {
    lens: '85mm f/1.4',
    environment: 'Cenário natural, lifestyle, contexto de uso real',
    lighting: 'Luz natural suave, rebatedor para preencher sombras',
    depthOfField: 'f/2.8 com bokeh suave no fundo',
    composition: 'Regra dos terços, pessoa/produto em contexto natural'
  },
  'studio-product': {
    lens: '50mm f/2.8',
    environment: 'Estúdio com fundo infinito (branco/cinza/colorido)',
    lighting: 'Três pontos estúdio (key, fill, rim)',
    depthOfField: 'f/8 com tudo em foco, produto isolado',
    composition: 'Centralizada, produto em destaque absoluto'
  },
  'editorial': {
    lens: '24-70mm f/4',
    environment: 'Cenário editorial, ambiente controlado mas natural',
    lighting: 'Luz ambiente difusa + rebatedor estratégico',
    depthOfField: 'f/5.6 com contexto visível mas desfocado',
    composition: 'Perspectiva dinâmica, elementos em camadas'
  },
  'ugc-realista': {
    lens: '35mm f/2.8 (simula smartphone)',
    environment: 'Ambiente real, não estúdio, contexto autêntico',
    lighting: 'Luz ambiente natural, sem rebatedores',
    depthOfField: 'f/4 com contexto real',
    composition: 'Casual, não perfeita, ângulo natural'
  }
}

/**
 * Seleciona estilo baseado em variation e imageType
 */
function selectStyle(context: PromptContext): StyleVariant {
  const { imageType, variation } = context
  
  if (imageType === 'conceptual') {
    // Conceitual: lifestyle ou studio-product
    return variation === 1 ? 'lifestyle' : 'studio-product'
  } else {
    // Comercial: editorial ou ugc-realista
    return variation === 1 ? 'editorial' : 'ugc-realista'
  }
}

/**
 * Mapeia aspect ratio para safe areas
 */
function getSafeArea(aspectRatio: string, includeTextInImage: boolean): string {
  if (!includeTextInImage) {
    switch (aspectRatio) {
      case '9:16':
        return 'Negative space reservado: topo 20% e inferior 30% para overlay de texto/CTA'
      case '4:5':
        return 'Negative space reservado: inferior 25% para overlay de texto/CTA'
      case '16:9':
        return 'Negative space reservado: inferior 20% para overlay de texto/CTA'
      case '1:1':
        return 'Negative space reservado: inferior 20% para overlay de texto/CTA'
      default:
        return 'Negative space reservado para overlay de texto/CTA'
    }
  }
  return ''
}

/**
 * Constrói prompt conceitual (background premium)
 */
export function buildConceptualPrompt(context: PromptContext): string {
  const style = selectStyle(context)
  const config = STYLE_CONFIGS[style]
  const characteristics = extractCharacteristics(context.imageReferences)
  
  const parts: string[] = []
  
  // Base: prompt principal do usuário
  parts.push(`Fotografia profissional de ${context.mainPrompt || context.productName || 'produto'}`)
  
  // Direção técnica
  parts.push('')
  parts.push('Direção técnica:')
  parts.push(`- Lente: ${config.lens}`)
  parts.push(`- Ambiente: ${config.environment}`)
  parts.push(`- Iluminação: ${config.lighting}`)
  parts.push(`- Profundidade de campo: ${config.depthOfField}`)
  parts.push(`- Composição: ${config.composition}`)
  parts.push(`- Proporção: ${context.aspectRatio}`)
  
  // Características de referências
  if (characteristics.style) {
    parts.push(`- Estilo visual: ${characteristics.style}`)
  }
  if (characteristics.product) {
    parts.push(`- Produto: ${characteristics.product}`)
  }
  if (characteristics.composition) {
    parts.push(`- Composição adicional: ${characteristics.composition}`)
  }
  
  // Qualidade
  parts.push('')
  parts.push('Qualidade:')
  parts.push('- Fotografia real, não renderização 3D')
  parts.push('- Texturas naturais e orgânicas')
  parts.push('- Pele humana realista (se aplicável)')
  parts.push('- Cores calibradas e naturais')
  
  // Safe area (se não incluir texto)
  if (!context.includeTextInImage) {
    parts.push('')
    parts.push(getSafeArea(context.aspectRatio, false))
  }
  
  // Negativos obrigatórios
  parts.push('')
  parts.push('Negativos obrigatórios:')
  if (!context.includeTextInImage) {
    parts.push('- Sem texto, sem logo, sem marca d\'água')
    parts.push('- Negative space reservado para overlay de texto')
  } else {
    parts.push('- Sem logo, sem marca d\'água')
  }
  parts.push('- Sem aparência 3D, CG, renderização ou ilustração')
  parts.push('- Sem pele plástica ou artificial')
  parts.push('- Sem iluminação artificial ou overexposição')
  parts.push('- Sem elementos decorativos desnecessários')
  
  // Tom (se aplicável)
  if (context.tone) {
    const toneMap: Record<string, string> = {
      professional: 'Tom sério, confiável, corporativo',
      casual: 'Tom descontraído, acessível, amigável',
      friendly: 'Tom amigável, acolhedor, caloroso',
      urgent: 'Tom de urgência genuína (sem exageros)',
      inspiring: 'Tom inspirador, motivador, positivo'
    }
    parts.push('')
    parts.push(`Tom: ${toneMap[context.tone] || context.tone}`)
  }
  
  return parts.join('\n')
}

/**
 * Constrói prompt comercial (background com energia + safe area)
 */
export function buildCommercialPrompt(context: PromptContext): string {
  const style = selectStyle(context)
  const config = STYLE_CONFIGS[style]
  const characteristics = extractCharacteristics(context.imageReferences)
  
  const parts: string[] = []
  
  // Base: prompt principal do usuário
  parts.push(`Fotografia publicitária comercial de ${context.mainPrompt || context.productName || 'produto'}`)
  
  // Direção técnica
  parts.push('')
  parts.push('Direção técnica:')
  parts.push(`- Lente: ${config.lens}`)
  parts.push(`- Ambiente: ${config.environment}`)
  parts.push(`- Iluminação: ${config.lighting}`)
  parts.push(`- Profundidade de campo: ${config.depthOfField}`)
  parts.push(`- Composição: ${config.composition}`)
  parts.push(`- Proporção: ${context.aspectRatio}`)
  
  // Safe area (sempre importante em comercial)
  if (!context.includeTextInImage) {
    parts.push(`- Safe area: ${getSafeArea(context.aspectRatio, false)}`)
  }
  
  // Características de referências
  if (characteristics.style) {
    parts.push(`- Estilo visual: ${characteristics.style}`)
  }
  if (characteristics.product) {
    parts.push(`- Produto: ${characteristics.product}`)
  }
  if (characteristics.composition) {
    parts.push(`- Composição adicional: ${characteristics.composition}`)
  }
  
  // Objetivo do anúncio (comercial)
  if (context.objective) {
    parts.push('')
    parts.push(`Objetivo: ${context.objective}`)
    parts.push(`- Incluir elementos visuais que incentivem ${context.objective}`)
  }
  
  // Qualidade comercial
  parts.push('')
  parts.push('Qualidade:')
  parts.push('- Fotografia real, não renderização 3D')
  parts.push('- Alto contraste e cores saturadas (mas naturais)')
  parts.push('- Texturas reais e orgânicas')
  parts.push('- Pele humana realista (se aplicável)')
  
  // Safe area (se não incluir texto)
  if (!context.includeTextInImage) {
    parts.push('')
    parts.push(getSafeArea(context.aspectRatio, false))
  }
  
  // Negativos obrigatórios
  parts.push('')
  parts.push('Negativos obrigatórios:')
  if (!context.includeTextInImage) {
    parts.push('- Sem texto, sem logo, sem marca d\'água (texto será adicionado via overlay)')
    parts.push('- Negative space na safe area definida')
  } else {
    parts.push('- Sem logo, sem marca d\'água')
  }
  parts.push('- Sem aparência 3D, CG, renderização ou ilustração')
  parts.push('- Sem pele plástica ou artificial')
  parts.push('- Sem overexposição ou cores não-naturais')
  if (!context.includeTextInImage) {
    parts.push('- Sem elementos que competem com safe area')
  }
  
  // Tom urgente (se aplicável)
  if (context.tone === 'urgent') {
    parts.push('')
    parts.push('Tom: urgente, com senso de oportunidade e escassez (sem ser falso)')
  }
  
  return parts.join('\n')
}

/**
 * Extrai características de referências visuais
 */
function extractCharacteristics(references?: PromptContext['imageReferences']): {
  style?: string
  product?: string
  composition?: string
} {
  if (!references || references.length === 0) {
    return {}
  }

  const characteristics = {
    style: [] as string[],
    product: [] as string[],
    composition: [] as string[]
  }

  for (const ref of references) {
    if (ref.description && ref.description.length > 20) {
      if (ref.role === 'style') {
        characteristics.style.push(ref.description)
      } else if (ref.role === 'produto') {
        characteristics.product.push(ref.description)
      } else if (ref.role === 'inspiração') {
        characteristics.composition.push(ref.description)
      }
    }
  }

  return {
    style: characteristics.style.length > 0 ? characteristics.style.join('. ') : undefined,
    product: characteristics.product.length > 0 ? characteristics.product.join('. ') : undefined,
    composition: characteristics.composition.length > 0 ? characteristics.composition.join('. ') : undefined
  }
}

