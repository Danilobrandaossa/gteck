/**
 * Image Model Selector - Seleciona modelo de imagem (Nano vs Pro)
 */

export type ImageModel = 'nano' | 'pro'

export interface ImageModelConfig {
  imageModel?: ImageModel
  qualityTier?: 'draft' | 'production'
}

/**
 * Seleciona modelo de imagem baseado em request e env
 */
export function selectImageModel(config: ImageModelConfig): string {
  const { imageModel, qualityTier } = config

  // Request tem prioridade
  if (imageModel === 'pro') {
    return process.env.GEMINI_IMAGE_MODEL_PRO || 'gemini-3-pro-image-preview' // Modelo premium
  }

  if (imageModel === 'nano') {
    return process.env.GEMINI_IMAGE_MODEL_NANO || 'gemini-2.5-flash-image' // Modelo nano (padrão)
  }

  // Se não especificado, usar baseado em qualityTier
  if (qualityTier === 'production') {
    // Production pode usar pro se disponível
    const usePro = process.env.FEATURE_IMAGE_PRO === 'true'
    return usePro 
      ? (process.env.GEMINI_IMAGE_MODEL_PRO || 'gemini-3-pro-image-preview')
      : (process.env.GEMINI_IMAGE_MODEL_NANO || 'gemini-2.5-flash-image')
  }

  // Draft sempre usa nano (rápido e barato)
  return process.env.GEMINI_IMAGE_MODEL_NANO || 'gemini-2.5-flash-image'
}

