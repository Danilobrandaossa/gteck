/**
 * Testes mínimos para Prompt Builder V2
 * 
 * Testa negativos obrigatórios e safe areas por ratio
 */

import { describe, it, expect } from 'vitest'
import { buildConceptualPrompt, buildCommercialPrompt } from '@/lib/prompt-builder-v2'
import type { PromptContext } from '@/lib/prompt-builder-v2'

describe('Prompt Builder V2', () => {
  const baseContext: PromptContext = {
    mainPrompt: 'Produto teste',
    aspectRatio: '1:1',
    imageType: 'conceptual',
    variation: 1,
    includeTextInImage: false,
    qualityTier: 'draft'
  }

  it('deve incluir negativos obrigatórios no prompt conceitual', () => {
    const prompt = buildConceptualPrompt(baseContext)
    const promptLower = prompt.toLowerCase()
    
    expect(promptLower).toContain('sem texto')
    expect(promptLower).toContain('sem logo')
    expect(promptLower).toContain('sem marca d\'água')
    expect(promptLower).toContain('sem aparência 3d')
    expect(promptLower).toContain('sem pele plástica')
  })

  it('deve incluir negativos obrigatórios no prompt comercial', () => {
    const prompt = buildCommercialPrompt(baseContext)
    const promptLower = prompt.toLowerCase()
    
    expect(promptLower).toContain('sem texto')
    expect(promptLower).toContain('sem logo')
    expect(promptLower).toContain('sem marca d\'água')
    expect(promptLower).toContain('sem aparência 3d')
    expect(promptLower).toContain('sem pele plástica')
  })

  it('deve incluir safe area quando includeTextInImage=false', () => {
    const prompt = buildConceptualPrompt({
      ...baseContext,
      includeTextInImage: false,
      aspectRatio: '9:16'
    })
    
    expect(prompt).toContain('Negative space')
    expect(prompt).toContain('overlay')
  })

  it('deve incluir direção técnica (lente, ambiente, iluminação)', () => {
    const prompt = buildConceptualPrompt(baseContext)
    
    expect(prompt).toContain('Lente:')
    expect(prompt).toContain('Ambiente:')
    expect(prompt).toContain('Iluminação:')
    expect(prompt).toContain('Profundidade de campo:')
    expect(prompt).toContain('Composição:')
  })

  it('deve variar estilo baseado em variation', () => {
    const prompt1 = buildConceptualPrompt({
      ...baseContext,
      variation: 1
    })
    
    const prompt2 = buildConceptualPrompt({
      ...baseContext,
      variation: 2
    })
    
    // Prompts devem ser diferentes (diferentes estilos)
    expect(prompt1).not.toBe(prompt2)
  })

  it('deve incluir características de referências quando fornecidas', () => {
    const prompt = buildConceptualPrompt({
      ...baseContext,
      imageReferences: [
        {
          role: 'style',
          description: 'Cores vibrantes, iluminação natural'
        }
      ]
    })
    
    expect(prompt).toContain('Estilo visual:')
  })
})

