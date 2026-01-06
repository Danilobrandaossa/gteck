/**
 * Sistema de Feature Flags com Scopes (Request > Tenant > Env > Default)
 * 
 * Prioridade:
 * 1. Request (brief.*) - Maior prioridade
 * 2. Tenant (se existir multi-tenant)
 * 3. Ambiente (.env)
 * 4. Default hardcoded - Menor prioridade
 */

export interface FeatureFlags {
  qualityTier: 'draft' | 'production'
  includeTextInImage: boolean
  enableRefinePass: boolean
  enableScoring: boolean
  enableOverlay: boolean
  creativeType?: 'image' | 'video'
  imageModel?: 'nano' | 'pro'
  videoModel?: 'veo3' | 'veo31'
  videoMaxVariations?: number
  videoDefaultDuration?: 4 | 6 | 8
  videoDefaultAspectRatio?: '9:16' | '16:9'
}

export interface FlagSource {
  value: any
  source: 'request' | 'tenant' | 'env' | 'default'
}

export interface FeatureFlagsWithSource {
  qualityTier: FlagSource
  includeTextInImage: FlagSource
  enableRefinePass: FlagSource
  enableScoring: FlagSource
  enableOverlay: FlagSource
  creativeType?: FlagSource
  imageModel?: FlagSource
  videoModel?: FlagSource
  videoMaxVariations?: FlagSource
  videoDefaultDuration?: FlagSource
  videoDefaultAspectRatio?: FlagSource
}

// Defaults hardcoded (menor prioridade)
const DEFAULTS: FeatureFlags = {
  qualityTier: 'draft',
  includeTextInImage: false,
  enableRefinePass: false,
  enableScoring: false,
  enableOverlay: true,
  creativeType: (process.env.DEFAULT_CREATIVE_TYPE as 'image' | 'video') || 'image',
  imageModel: (process.env.DEFAULT_IMAGE_MODEL as 'nano' | 'pro') || 'nano',
  videoModel: (process.env.DEFAULT_VIDEO_MODEL as 'veo3' | 'veo31') || 'veo3',
  videoMaxVariations: parseInt(process.env.VIDEO_MAX_VARIATIONS || '1', 10),
  videoDefaultDuration: (parseInt(process.env.VIDEO_DEFAULT_DURATION_SECONDS || '6', 10) as 4 | 6 | 8),
  videoDefaultAspectRatio: (process.env.VIDEO_DEFAULT_ASPECT_RATIO as '9:16' | '16:9') || '9:16'
}

/**
 * Resolve feature flags com scopes
 */
export function resolveFeatureFlags(
  requestOverrides?: Partial<FeatureFlags>,
  tenantOverrides?: Partial<FeatureFlags>
): FeatureFlagsWithSource {
  // 4. Default hardcoded
  const flags: FeatureFlagsWithSource = {
    qualityTier: { value: DEFAULTS.qualityTier, source: 'default' },
    includeTextInImage: { value: DEFAULTS.includeTextInImage, source: 'default' },
    enableRefinePass: { value: DEFAULTS.enableRefinePass, source: 'default' },
    enableScoring: { value: DEFAULTS.enableScoring, source: 'default' },
    enableOverlay: { value: DEFAULTS.enableOverlay, source: 'default' },
    creativeType: { value: DEFAULTS.creativeType, source: 'default' },
    imageModel: { value: DEFAULTS.imageModel, source: 'default' },
    videoModel: { value: DEFAULTS.videoModel, source: 'default' },
    videoMaxVariations: { value: DEFAULTS.videoMaxVariations, source: 'default' },
    videoDefaultDuration: { value: DEFAULTS.videoDefaultDuration, source: 'default' },
    videoDefaultAspectRatio: { value: DEFAULTS.videoDefaultAspectRatio, source: 'default' }
  }

  // 3. Ambiente (.env)
  const envQualityTier = process.env.DEFAULT_QUALITY_TIER
  if (envQualityTier && (envQualityTier === 'draft' || envQualityTier === 'production')) {
    flags.qualityTier = { value: envQualityTier, source: 'env' }
  } else if (envQualityTier) {
    // Valor inválido: ignorar e usar default
    console.warn(`[FeatureFlags] DEFAULT_QUALITY_TIER inválido: "${envQualityTier}". Usando default: "${DEFAULTS.qualityTier}"`)
  }

  const envIncludeText = process.env.DEFAULT_INCLUDE_TEXT_IN_IMAGE
  if (envIncludeText !== undefined) {
    flags.includeTextInImage = { value: envIncludeText === 'true', source: 'env' }
  }

  const envRefinePass = process.env.FEATURE_REFINE_PASS
  if (envRefinePass !== undefined) {
    flags.enableRefinePass = { value: envRefinePass === 'true', source: 'env' }
  }

  const envScoring = process.env.FEATURE_VISION_SCORING
  if (envScoring !== undefined) {
    flags.enableScoring = { value: envScoring === 'true', source: 'env' }
  }

  const envOverlay = process.env.FEATURE_IMAGE_OVERLAY
  if (envOverlay !== undefined) {
    flags.enableOverlay = { value: envOverlay === 'true', source: 'env' }
  }

  // Novos campos de vídeo/imagem
  const envCreativeType = process.env.DEFAULT_CREATIVE_TYPE
  if (envCreativeType && (envCreativeType === 'image' || envCreativeType === 'video')) {
    flags.creativeType = { value: envCreativeType, source: 'env' }
  }

  const envImageModel = process.env.DEFAULT_IMAGE_MODEL
  if (envImageModel && (envImageModel === 'nano' || envImageModel === 'pro')) {
    flags.imageModel = { value: envImageModel, source: 'env' }
  }

  const envVideoModel = process.env.DEFAULT_VIDEO_MODEL
  if (envVideoModel && (envVideoModel === 'veo3' || envVideoModel === 'veo31')) {
    flags.videoModel = { value: envVideoModel, source: 'env' }
  }

  const envVideoMaxVariations = process.env.VIDEO_MAX_VARIATIONS
  if (envVideoMaxVariations) {
    const parsed = parseInt(envVideoMaxVariations, 10)
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 2) {
      flags.videoMaxVariations = { value: parsed, source: 'env' }
    }
  }

  const envVideoDuration = process.env.VIDEO_DEFAULT_DURATION_SECONDS
  if (envVideoDuration) {
    const parsed = parseInt(envVideoDuration, 10) as 4 | 6 | 8
    if (parsed === 4 || parsed === 6 || parsed === 8) {
      flags.videoDefaultDuration = { value: parsed, source: 'env' }
    }
  }

  const envVideoAspectRatio = process.env.VIDEO_DEFAULT_ASPECT_RATIO
  if (envVideoAspectRatio && (envVideoAspectRatio === '9:16' || envVideoAspectRatio === '16:9')) {
    flags.videoDefaultAspectRatio = { value: envVideoAspectRatio, source: 'env' }
  }

  // 2. Tenant (se existir)
  if (tenantOverrides) {
    if (tenantOverrides.qualityTier !== undefined) {
      flags.qualityTier = { value: tenantOverrides.qualityTier, source: 'tenant' }
    }
    if (tenantOverrides.includeTextInImage !== undefined) {
      flags.includeTextInImage = { value: tenantOverrides.includeTextInImage, source: 'tenant' }
    }
    if (tenantOverrides.enableRefinePass !== undefined) {
      flags.enableRefinePass = { value: tenantOverrides.enableRefinePass, source: 'tenant' }
    }
    if (tenantOverrides.enableScoring !== undefined) {
      flags.enableScoring = { value: tenantOverrides.enableScoring, source: 'tenant' }
    }
    if (tenantOverrides.enableOverlay !== undefined) {
      flags.enableOverlay = { value: tenantOverrides.enableOverlay, source: 'tenant' }
    }
    if (tenantOverrides.creativeType !== undefined) {
      flags.creativeType = { value: tenantOverrides.creativeType, source: 'tenant' }
    }
    if (tenantOverrides.imageModel !== undefined) {
      flags.imageModel = { value: tenantOverrides.imageModel, source: 'tenant' }
    }
    if (tenantOverrides.videoModel !== undefined) {
      flags.videoModel = { value: tenantOverrides.videoModel, source: 'tenant' }
    }
    if (tenantOverrides.videoMaxVariations !== undefined) {
      flags.videoMaxVariations = { value: tenantOverrides.videoMaxVariations, source: 'tenant' }
    }
    if (tenantOverrides.videoDefaultDuration !== undefined) {
      flags.videoDefaultDuration = { value: tenantOverrides.videoDefaultDuration, source: 'tenant' }
    }
    if (tenantOverrides.videoDefaultAspectRatio !== undefined) {
      flags.videoDefaultAspectRatio = { value: tenantOverrides.videoDefaultAspectRatio, source: 'tenant' }
    }
  }

  // 1. Request (maior prioridade)
  if (requestOverrides) {
    if (requestOverrides.qualityTier !== undefined) {
      flags.qualityTier = { value: requestOverrides.qualityTier, source: 'request' }
    }
    if (requestOverrides.includeTextInImage !== undefined) {
      flags.includeTextInImage = { value: requestOverrides.includeTextInImage, source: 'request' }
    }
    if (requestOverrides.enableRefinePass !== undefined) {
      flags.enableRefinePass = { value: requestOverrides.enableRefinePass, source: 'request' }
    }
    if (requestOverrides.enableScoring !== undefined) {
      flags.enableScoring = { value: requestOverrides.enableScoring, source: 'request' }
    }
    if (requestOverrides.enableOverlay !== undefined) {
      flags.enableOverlay = { value: requestOverrides.enableOverlay, source: 'request' }
    }
    if (requestOverrides.creativeType !== undefined) {
      flags.creativeType = { value: requestOverrides.creativeType, source: 'request' }
    }
    if (requestOverrides.imageModel !== undefined) {
      flags.imageModel = { value: requestOverrides.imageModel, source: 'request' }
    }
    if (requestOverrides.videoModel !== undefined) {
      flags.videoModel = { value: requestOverrides.videoModel, source: 'request' }
    }
    if (requestOverrides.videoMaxVariations !== undefined) {
      flags.videoMaxVariations = { value: requestOverrides.videoMaxVariations, source: 'request' }
    }
    if (requestOverrides.videoDefaultDuration !== undefined) {
      flags.videoDefaultDuration = { value: requestOverrides.videoDefaultDuration, source: 'request' }
    }
    if (requestOverrides.videoDefaultAspectRatio !== undefined) {
      flags.videoDefaultAspectRatio = { value: requestOverrides.videoDefaultAspectRatio, source: 'request' }
    }
  }

  // Log flags ativas (apenas se DEBUG_FLAGS=true ou NODE_ENV !== 'production')
  const shouldLog = process.env.DEBUG_FLAGS === 'true' || process.env.NODE_ENV !== 'production'
  if (shouldLog) {
    console.log('[FeatureFlags] Flags ativas:', {
      qualityTier: flags.qualityTier,
      includeTextInImage: flags.includeTextInImage,
      enableRefinePass: flags.enableRefinePass,
      enableScoring: flags.enableScoring,
      enableOverlay: flags.enableOverlay
    })
  }

  return flags
}

/**
 * Extrai valores finais (sem source) para uso
 */
export function getFeatureFlags(
  requestOverrides?: Partial<FeatureFlags>,
  tenantOverrides?: Partial<FeatureFlags>
): FeatureFlags {
  const flagsWithSource = resolveFeatureFlags(requestOverrides, tenantOverrides)
  
  return {
    qualityTier: flagsWithSource.qualityTier.value,
    includeTextInImage: flagsWithSource.includeTextInImage.value,
    enableRefinePass: flagsWithSource.enableRefinePass.value,
    enableScoring: flagsWithSource.enableScoring.value,
    enableOverlay: flagsWithSource.enableOverlay.value,
    creativeType: flagsWithSource.creativeType?.value,
    imageModel: flagsWithSource.imageModel?.value,
    videoModel: flagsWithSource.videoModel?.value,
    videoMaxVariations: flagsWithSource.videoMaxVariations?.value,
    videoDefaultDuration: flagsWithSource.videoDefaultDuration?.value,
    videoDefaultAspectRatio: flagsWithSource.videoDefaultAspectRatio?.value
  }
}

