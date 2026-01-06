/**
 * 🧩 TEXT CHUNKING - Divisão de texto em chunks para embeddings
 * 
 * Responsabilidades:
 * - Dividir texto em chunks menores e melhores
 * - Overlap configurável para contexto
 * - Preservar estrutura (parágrafos, sentenças)
 * - Evitar quebrar palavras/sentenças
 */

export interface ChunkingConfig {
  chunkSize?: number // Tamanho do chunk em caracteres (default: 1000)
  overlap?: number // Overlap entre chunks em caracteres (default: 200)
  preserveParagraphs?: boolean // Tentar manter parágrafos intactos (default: true)
  preserveSentences?: boolean // Tentar manter sentenças intactas (default: true)
  minChunkSize?: number // Tamanho mínimo do chunk (default: 100)
}

export interface TextChunk {
  text: string
  index: number
  startChar: number
  endChar: number
}

export class TextChunking {
  private static readonly DEFAULT_CHUNK_SIZE = 1000
  private static readonly DEFAULT_OVERLAP = 200
  private static readonly DEFAULT_MIN_CHUNK_SIZE = 100

  /**
   * Divide texto em chunks com overlap
   */
  static chunkText(
    text: string,
    config: ChunkingConfig = {}
  ): TextChunk[] {
    const {
      chunkSize = this.DEFAULT_CHUNK_SIZE,
      overlap = this.DEFAULT_OVERLAP,
      preserveParagraphs = true,
      preserveSentences = true,
      minChunkSize = this.DEFAULT_MIN_CHUNK_SIZE
    } = config

    if (!text || text.trim().length === 0) {
      return []
    }

    // Normalizar texto
    const normalizedText = text.trim().replace(/\s+/g, ' ')

    // Se texto é menor que chunkSize, retornar único chunk
    if (normalizedText.length <= chunkSize) {
      return [{
        text: normalizedText,
        index: 0,
        startChar: 0,
        endChar: normalizedText.length
      }]
    }

    const chunks: TextChunk[] = []
    let currentIndex = 0
    let chunkIndex = 0

    while (currentIndex < normalizedText.length) {
      const chunkEnd = Math.min(currentIndex + chunkSize, normalizedText.length)
      let actualEnd = chunkEnd

      // Ajustar fim do chunk para preservar estrutura
      if (preserveParagraphs || preserveSentences) {
        actualEnd = this.findBestBreakPoint(
          normalizedText,
          currentIndex,
          chunkEnd,
          preserveParagraphs,
          preserveSentences
        )
      }

      // Garantir tamanho mínimo
      if (actualEnd - currentIndex < minChunkSize && currentIndex > 0) {
        // Se chunk muito pequeno, estender até o próximo break point
        actualEnd = Math.min(
          currentIndex + chunkSize + (minChunkSize - (actualEnd - currentIndex)),
          normalizedText.length
        )
      }

      const chunkText = normalizedText.substring(currentIndex, actualEnd).trim()

      if (chunkText.length > 0) {
        chunks.push({
          text: chunkText,
          index: chunkIndex,
          startChar: currentIndex,
          endChar: actualEnd
        })
        chunkIndex++
      }

      // Mover para próximo chunk com overlap
      currentIndex = actualEnd - overlap

      // Evitar loop infinito
      if (currentIndex <= chunks[chunks.length - 1]?.startChar) {
        currentIndex = chunks[chunks.length - 1].endChar
      }

      // Se chegou ao fim, parar
      if (currentIndex >= normalizedText.length) {
        break
      }
    }

    return chunks
  }

  /**
   * Encontra melhor ponto de quebra (parágrafo ou sentença)
   */
  private static findBestBreakPoint(
    text: string,
    start: number,
    preferredEnd: number,
    preserveParagraphs: boolean,
    preserveSentences: boolean
  ): number {
    // Tentar encontrar quebra de parágrafo primeiro
    if (preserveParagraphs) {
      const paragraphBreak = text.lastIndexOf('\n\n', preferredEnd)
      if (paragraphBreak > start + (preferredEnd - start) * 0.5) {
        return paragraphBreak + 2 // Incluir as quebras de linha
      }

      const singleLineBreak = text.lastIndexOf('\n', preferredEnd)
      if (singleLineBreak > start + (preferredEnd - start) * 0.7) {
        return singleLineBreak + 1
      }
    }

    // Tentar encontrar quebra de sentença
    if (preserveSentences) {
      const sentenceEndings = ['. ', '! ', '? ', '.\n', '!\n', '?\n']
      
      for (const ending of sentenceEndings) {
        const sentenceBreak = text.lastIndexOf(ending, preferredEnd)
        if (sentenceBreak > start + (preferredEnd - start) * 0.8) {
          return sentenceBreak + ending.length
        }
      }
    }

    // Se não encontrou break point bom, usar preferredEnd
    return preferredEnd
  }

  /**
   * Calcula hash SHA-256 de um chunk
   */
  static calculateChunkHash(chunkText: string): string {
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(chunkText.trim()).digest('hex')
  }
}









