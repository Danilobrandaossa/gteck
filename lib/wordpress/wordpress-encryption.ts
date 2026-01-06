/**
 * WordPress Encryption Helpers
 * FASE D - Credenciais + Conexão (Secure Connect)
 * 
 * Criptografia AES-256-CBC para senhas WordPress armazenadas no banco
 */

import crypto from 'crypto'

const ENCRYPTION_ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16 // 16 bytes para AES

/**
 * Obter chave de criptografia do ambiente
 * Deve ter 32 bytes (256 bits) para AES-256
 */
function getEncryptionKey(): Buffer {
  const key = process.env.WORDPRESS_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY

  if (!key) {
    throw new Error(
      'WORDPRESS_ENCRYPTION_KEY or ENCRYPTION_KEY environment variable is required'
    )
  }

  // Se a chave for menor que 32 bytes, fazer hash SHA-256
  if (key.length < 32) {
    return crypto.createHash('sha256').update(key).digest()
  }

  // Se for exatamente 32 bytes, usar diretamente
  if (key.length === 32) {
    return Buffer.from(key, 'utf8')
  }

  // Se for maior, truncar para 32 bytes
  return Buffer.from(key.slice(0, 32), 'utf8')
}

/**
 * Criptografar senha WordPress
 * 
 * Formato: IV_HEX:ENCRYPTED_HEX
 * - IV (16 bytes) em hex
 * - Dados criptografados em hex
 * 
 * @param password - Senha em texto plano
 * @returns String criptografada no formato "iv:encrypted"
 */
export function encryptWordPressPassword(password: string): string {
  if (!password || password.trim().length === 0) {
    throw new Error('Password cannot be empty')
  }

  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)

    let encrypted = cipher.update(password, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Formato: IV_HEX:ENCRYPTED_HEX
    return `${iv.toString('hex')}:${encrypted}`
  } catch (error) {
    console.error('Error encrypting WordPress password:', error)
    throw new Error('Failed to encrypt password')
  }
}

/**
 * Descriptografar senha WordPress
 * 
 * @param encryptedPassword - String criptografada no formato "iv:encrypted"
 * @returns Senha em texto plano
 */
export function decryptWordPressPassword(encryptedPassword: string): string {
  if (!encryptedPassword || encryptedPassword.trim().length === 0) {
    throw new Error('Encrypted password cannot be empty')
  }

  try {
    const parts = encryptedPassword.split(':')
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted password format')
    }

    const [ivHex, encrypted] = parts
    const key = getEncryptionKey()
    const iv = Buffer.from(ivHex, 'hex')

    if (iv.length !== IV_LENGTH) {
      throw new Error('Invalid IV length')
    }

    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Error decrypting WordPress password:', error)
    throw new Error('Failed to decrypt password')
  }
}

/**
 * Validar se uma string está no formato de senha criptografada
 */
export function isEncryptedPassword(value: string): boolean {
  if (!value || value.trim().length === 0) {
    return false
  }

  const parts = value.split(':')
  if (parts.length !== 2) {
    return false
  }

  const [ivHex] = parts
  // IV deve ter 32 caracteres hex (16 bytes)
  return /^[0-9a-f]{32}$/i.test(ivHex)
}






