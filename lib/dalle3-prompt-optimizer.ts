/**
 * DALL-E 3 Prompt Optimizer
 * 
 * Otimiza prompts para DALL-E 3 seguindo as melhores práticas da OpenAI:
 * - Prompts detalhados e descritivos funcionam melhor
 * - Descrições naturais são preferíveis a instruções técnicas
 * - Incluir detalhes sobre composição, iluminação, cores, estilo
 * - Evitar comandos diretos, preferir descrições
 * - Focar em qualidade visual e estética
 */

export interface Dalle3OptimizationConfig {
  imageType: 'conceptual' | 'commercial'
  qualityTier: 'draft' | 'production'
  aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9'
  includeTextInImage?: boolean
  tone?: 'professional' | 'casual' | 'friendly' | 'urgent' | 'inspiring'
  objective?: string
}

/**
 * Otimiza prompt para DALL-E 3 seguindo melhores práticas da OpenAI
 * 
 * DALL-E 3 funciona melhor com:
 * - Descrições detalhadas e naturais
 * - Detalhes sobre composição, iluminação, cores
 * - Estilo visual bem definido
 * - Contexto e atmosfera
 * - Evitar comandos técnicos diretos
 */
export function optimizePromptForDalle3(
  originalPrompt: string,
  config: Dalle3OptimizationConfig
): string {
  const parts: string[] = []
  
  // 1. BASE: Prompt original do usuário (fonte da verdade)
  if (originalPrompt && originalPrompt.trim()) {
    parts.push(originalPrompt.trim())
  }
  
  // 2. ESTILO VISUAL (baseado no tipo de imagem)
  if (config.imageType === 'conceptual') {
    parts.push('A high-quality conceptual advertising image with a clean, modern, professional aesthetic. The composition features artistic photography with soft, diffused lighting and harmonious color palette. The style emphasizes visual storytelling and premium aesthetics.')
  } else {
    parts.push('A high-conversion commercial advertising image with vibrant colors, high contrast, and impactful composition. The style is bold and direct, designed to capture immediate attention and drive action. Visual elements are striking and eye-catching.')
  }
  
  // 3. COMPOSIÇÃO E ENQUADRAMENTO
  if (config.aspectRatio) {
    const compositionGuidance = getCompositionForAspectRatio(config.aspectRatio, config.imageType)
    parts.push(compositionGuidance)
  }
  
  // 4. ILUMINAÇÃO (baseado no tipo)
  if (config.imageType === 'conceptual') {
    parts.push('Professional soft lighting with gentle shadows that enhance the subject. Natural, diffused light creates depth and dimension.')
  } else {
    parts.push('Dramatic lighting with high contrast that highlights key elements. Bold shadows and bright highlights create visual impact.')
  }
  
  // 5. CORES E PALETA
  if (config.imageType === 'conceptual') {
    parts.push('Refined color palette with harmonious tones. Colors are sophisticated and balanced, creating an elegant visual experience.')
  } else {
    parts.push('Vibrant, saturated colors that pop. High contrast color combinations create energy and visual excitement.')
  }
  
  // 6. QUALIDADE E DETALHES
  if (config.qualityTier === 'production') {
    parts.push('Ultra-high resolution with exceptional detail and clarity. Professional photography quality with sharp focus and precise rendering. Every element is crisp and well-defined.')
  } else {
    parts.push('High resolution with good detail and clarity. Professional quality image with clear focus.')
  }
  
  // 7. TEXTO NA IMAGEM (se necessário)
  if (config.includeTextInImage) {
    parts.push('Include clear, readable text that is professionally integrated into the design. Text should be legible, well-positioned, and free of spelling errors.')
  } else {
    parts.push('No text overlay. Focus purely on visual elements and composition.')
  }
  
  // 8. TOM E ATMOSFERA
  if (config.tone) {
    const toneDescription = getToneDescription(config.tone)
    parts.push(toneDescription)
  }
  
  // 9. OBJETIVO (se fornecido)
  if (config.objective) {
    parts.push(`The image should support the objective of ${config.objective} through its visual design and composition.`)
  }
  
  // 10. NEGATIVOS (evitar problemas comuns)
  parts.push('Avoid 3D rendering appearance, generic stock photo look, or overly artificial elements. Maintain a natural, professional aesthetic.')
  
  // Juntar todas as partes de forma natural
  // DALL-E 3 funciona melhor com descrições fluidas, não listas fragmentadas
  return parts.join(' ')
}

/**
 * Retorna orientação de composição baseada no aspect ratio
 */
function getCompositionForAspectRatio(
  aspectRatio: '1:1' | '4:5' | '9:16' | '16:9',
  imageType: 'conceptual' | 'commercial'
): string {
  const baseComposition = imageType === 'conceptual'
    ? 'Centered composition with balanced elements'
    : 'Dynamic composition with strong focal points'
  
  switch (aspectRatio) {
    case '9:16':
      return `${baseComposition}, optimized for vertical social media feeds. The layout works well in a tall, narrow format with elements arranged vertically.`
    case '16:9':
      return `${baseComposition}, optimized for horizontal display ads. The wide format allows for expansive layouts with room for multiple elements.`
    case '4:5':
      return `${baseComposition}, optimized for Instagram feed. The slightly vertical format is ideal for mobile viewing with a balanced aspect ratio.`
    case '1:1':
      return `${baseComposition}, optimized for square format. The balanced square layout works well across platforms with equal width and height.`
    default:
      return baseComposition
  }
}

/**
 * Retorna descrição do tom
 */
function getToneDescription(tone: string): string {
  switch (tone) {
    case 'professional':
      return 'The overall tone is serious, trustworthy, and corporate. The image conveys professionalism and reliability.'
    case 'casual':
      return 'The overall tone is relaxed, accessible, and friendly. The image feels approachable and down-to-earth.'
    case 'friendly':
      return 'The overall tone is warm, welcoming, and approachable. The image creates a sense of connection and friendliness.'
    case 'urgent':
      return 'The overall tone conveys urgency and opportunity without being false. The image suggests time-sensitivity and action.'
    case 'inspiring':
      return 'The overall tone is inspiring, motivational, and positive. The image uplifts and energizes the viewer.'
    default:
      return ''
  }
}

/**
 * Valida e limpa prompt para DALL-E 3
 * 
 * DALL-E 3 tem algumas limitações:
 * - Prompts muito longos podem ser truncados
 * - Caracteres especiais podem causar problemas
 * - Comandos diretos não funcionam bem
 */
export function cleanPromptForDalle3(prompt: string): string {
  // Remover caracteres problemáticos
  let cleaned = prompt
    .replace(/[^\w\s.,!?;:()\-'"]/g, ' ') // Manter apenas caracteres seguros
    .replace(/\s+/g, ' ') // Normalizar espaços
    .trim()
  
  // Limitar tamanho (DALL-E 3 tem limite de ~4000 caracteres, mas recomendado ~1000)
  // Manter o prompt original, mas garantir que não seja excessivamente longo
  if (cleaned.length > 2000) {
    // Se muito longo, manter as primeiras partes mais importantes
    const sentences = cleaned.split(/[.!?]+/)
    let truncated = ''
    for (const sentence of sentences) {
      if ((truncated + sentence).length < 1800) {
        truncated += sentence + '. '
      } else {
        break
      }
    }
    cleaned = truncated.trim()
  }
  
  return cleaned
}



