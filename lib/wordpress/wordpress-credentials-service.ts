/**
 * WordPress Credentials Service
 * FASE D - Credenciais + Conexão (Secure Connect)
 * 
 * Service para gerenciar credenciais WordPress por site (multi-tenant)
 */

import { db } from '@/lib/db'
import { validateSiteBelongsToOrganization } from '@/lib/tenant-security'
import {
  encryptWordPressPassword,
  decryptWordPressPassword
} from './wordpress-encryption'
import { WordPressCredentialsValidator } from '@/lib/wordpress-credentials-validator'

export interface WordPressCredentials {
  wpBaseUrl: string
  wpAuthType: 'basic' | 'application_password' | 'jwt' | 'oauth'
  wpUsername: string
  wpPassword: string // Texto plano (apenas para validação)
  wpToken?: string // Para JWT/OAuth
}

export interface SavedWordPressCredentials {
  wpBaseUrl: string | null
  wpAuthType: string | null
  wpUsername: string | null
  wpPasswordHash: string | null // Criptografado
  wpToken: string | null
  wpConfigured: boolean
  wpLastSyncAt: Date | null
}

/**
 * Obter credenciais WordPress de um site (descriptografadas)
 */
export async function getWordPressCredentials(
  siteId: string,
  organizationId: string
): Promise<{
  credentials: SavedWordPressCredentials | null
  decryptedPassword?: string
}> {
  // Validar ownership
  const belongs = await validateSiteBelongsToOrganization(siteId, organizationId)
  if (!belongs) {
    throw new Error('Site does not belong to organization')
  }

  const site = await db.site.findUnique({
    where: { id: siteId },
    select: {
      wpBaseUrl: true,
      wpAuthType: true,
      wpUsername: true,
      wpPasswordHash: true,
      wpToken: true,
      wpConfigured: true,
      wpLastSyncAt: true
    }
  })

  if (!site || !site.wpConfigured) {
    return { credentials: null }
  }

  // Descriptografar senha se existir
  let decryptedPassword: string | undefined
  if (site.wpPasswordHash) {
    try {
      decryptedPassword = decryptWordPressPassword(site.wpPasswordHash)
    } catch (error) {
      console.error('Error decrypting password:', error)
      // Não falhar se descriptografia falhar, apenas não retornar senha
    }
  }

  return {
    credentials: {
      wpBaseUrl: site.wpBaseUrl,
      wpAuthType: site.wpAuthType,
      wpUsername: site.wpUsername,
      wpPasswordHash: site.wpPasswordHash,
      wpToken: site.wpToken,
      wpConfigured: site.wpConfigured,
      wpLastSyncAt: site.wpLastSyncAt
    },
    decryptedPassword
  }
}

/**
 * Salvar credenciais WordPress de um site (criptografadas)
 */
export async function saveWordPressCredentials(
  siteId: string,
  organizationId: string,
  credentials: WordPressCredentials
): Promise<{
  success: boolean
  error?: string
  validationResult?: any
}> {
  // Validar ownership
  const belongs = await validateSiteBelongsToOrganization(siteId, organizationId)
  if (!belongs) {
    return {
      success: false,
      error: 'Site does not belong to organization'
    }
  }

  // Validar credenciais antes de salvar
  const validationResult = await WordPressCredentialsValidator.validateCredentials(
    credentials.wpBaseUrl,
    credentials.wpUsername,
    credentials.wpPassword
  )

  if (!validationResult.success) {
    return {
      success: false,
      error: 'Invalid WordPress credentials',
      validationResult
    }
  }

  // Criptografar senha
  let wpPasswordHash: string
  try {
    wpPasswordHash = encryptWordPressPassword(credentials.wpPassword)
  } catch (error) {
    console.error('Error encrypting password:', error)
    return {
      success: false,
      error: 'Failed to encrypt password'
    }
  }

  // Salvar no banco
  try {
    await db.site.update({
      where: { id: siteId },
      data: {
        wpBaseUrl: credentials.wpBaseUrl,
        wpAuthType: credentials.wpAuthType,
        wpUsername: credentials.wpUsername,
        wpPasswordHash: wpPasswordHash,
        wpToken: credentials.wpToken || null,
        wpConfigured: true,
        wpLastSyncAt: null // Resetar lastSyncAt ao configurar novas credenciais
      }
    })

    return {
      success: true,
      validationResult
    }
  } catch (error) {
    console.error('Error saving WordPress credentials:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save credentials'
    }
  }
}

/**
 * Remover credenciais WordPress de um site
 */
export async function removeWordPressCredentials(
  siteId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  // Validar ownership
  const belongs = await validateSiteBelongsToOrganization(siteId, organizationId)
  if (!belongs) {
    return {
      success: false,
      error: 'Site does not belong to organization'
    }
  }

  try {
    await db.site.update({
      where: { id: siteId },
      data: {
        wpBaseUrl: null,
        wpAuthType: null,
        wpUsername: null,
        wpPasswordHash: null,
        wpToken: null,
        wpConfigured: false,
        wpLastSyncAt: null
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error removing WordPress credentials:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove credentials'
    }
  }
}

/**
 * Validar se site tem credenciais WordPress configuradas
 */
export async function hasWordPressCredentials(
  siteId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const { credentials } = await getWordPressCredentials(siteId, organizationId)
    return credentials?.wpConfigured ?? false
  } catch (error) {
    console.error('Error checking WordPress credentials:', error)
    return false
  }
}






