# 🔍 AUDITORIA: Fluxo de Geração de Imagens

**Data:** 2025-01-27  
**Engenheiro:** Auto (Cursor AI)  
**Objetivo:** Validar arquitetura do fluxo de geração de imagens conforme especificação do usuário

---

## ✅ CONFORMIDADE COM ESPECIFICAÇÃO

### 1. Campo "Descreva a imagem que você quer criar"

**Status:** ✅ **CONFORME**

- **Localização:** `app/criativos/page.tsx` linha 96
- **Campo:** `const [prompt, setPrompt] = useState('')`
- **Label:** "Descreva a imagem que você quer criar" (linha 484)
- **Comportamento:**
  - ✅ É o único campo de prompt principal
  - ✅ Aceita descrição completa da imagem
  - ✅ É enviado como `mainPrompt` para a API (linha 411)
  - ✅ Não há outros campos que recebem texto de prompt principal

**Conclusão:** Campo único e exclusivo para prompt principal. ✅

---

### 2. Campo "Referências de Imagem"

**Status:** ✅ **CONFORME**

- **Localização:** `app/criativos/page.tsx` linha 97
- **Campo:** `const [imageReferences, setImageReferences] = useState<Array<...>>([])`
- **Comportamento:**
  - ✅ Usado exclusivamente para adicionar imagens de criativos
  - ✅ Serve como referência visual para o modelo (Nano/Pro)
  - ✅ Não contém texto descritivo ou prompt
  - ✅ É processado via `extractImageCharacteristics` (linha 279 de `creative-generator.ts`)
  - ✅ As características extraídas enriquecem o prompt, não substituem

**Conclusão:** Referências visuais funcionam corretamente como complemento. ✅

---

### 3. Configurações Avançadas (Modo Performance)

**Status:** ⚠️ **PROBLEMAS IDENTIFICADOS**

#### 3.1. Modo Performance ignora `mainPrompt` no prompt de imagem

**Problema:**
- **Arquivo:** `lib/performance-creative-engine.ts` linha 221-256
- **Método:** `generateImagePrompt()`
- **Comportamento atual:**
  ```typescript
  // ❌ IGNORA mainPrompt completamente
  if (request.product_name) {
    parts.push(`Produto principal: ${request.product_name}`)
  }
  if (request.offer) {
    parts.push(`Oferta: ${request.offer}`)
  }
  // mainPrompt NÃO é usado aqui
  ```

**Impacto:**
- O prompt principal do usuário é ignorado no Modo Performance
- Apenas `product_name` e `offer` são usados
- Viola a regra: "Prompt principal vem somente do campo correto"

**Correção necessária:**
- `mainPrompt` deve ser a BASE do prompt de imagem
- `product_name`, `offer`, etc. devem ser apenas complementos
- Se `mainPrompt` existir, usar ele primeiro; caso contrário, construir a partir dos outros campos

#### 3.2. Modo Performance trata `mainPrompt` como opcional no copy

**Problema:**
- **Arquivo:** `lib/performance-creative-engine.ts` linha 570-571
- **Método:** `buildCopyPrompt()`
- **Comportamento atual:**
  ```typescript
  // ⚠️ mainPrompt é apenas contexto adicional
  if (request.mainPrompt) {
    parts.push(`- Prompt principal: ${request.mainPrompt}`)
  }
  ```

**Impacto:**
- `mainPrompt` é tratado como contexto opcional, não como base principal
- Deveria ser a fonte da verdade para a geração de copy também

**Correção necessária:**
- `mainPrompt` deve ser a BASE do prompt de copy
- Outros campos devem enriquecer, não substituir

---

### 4. Fluxo de Geração (Modo Tradicional)

**Status:** ✅ **CONFORME**

- **Arquivo:** `lib/creative-generator.ts` e `lib/prompt-builder-v2.ts`
- **Comportamento:**
  - ✅ `mainPrompt` é usado como base (linha 925, 1002 de `creative-generator.ts`)
  - ✅ `mainPrompt` é usado como base (linha 116, 194 de `prompt-builder-v2.ts`)
  - ✅ Referências visuais enriquecem o prompt (via `extractImageCharacteristics`)
  - ✅ Configurações avançadas (tone, objective, etc.) ajustam o comportamento, não substituem

**Conclusão:** Fluxo tradicional está correto. ✅

---

## 🚨 PROBLEMAS CRÍTICOS

### Problema 1: Modo Performance ignora `mainPrompt` no prompt de imagem

**Severidade:** 🔴 **ALTA**

**Descrição:**
O método `generateImagePrompt()` do `PerformanceCreativeEngine` não usa o `mainPrompt` como base. Ele constrói o prompt apenas a partir de `product_name` e `offer`, ignorando completamente o prompt principal do usuário.

**Impacto:**
- Usuário preenche o campo "Descreva a imagem que você quer criar"
- No Modo Performance, esse prompt é ignorado
- Apenas `product_name` e `offer` são usados
- Resultado: imagem não corresponde ao que o usuário descreveu

**Correção:**
```typescript
// ANTES (ERRADO):
private generateImagePrompt(request: PerformanceCreativeRequest, style: Style): string {
  const parts: string[] = []
  if (request.product_name) {
    parts.push(`Produto principal: ${request.product_name}`)
  }
  // mainPrompt é ignorado ❌
}

// DEPOIS (CORRETO):
private generateImagePrompt(request: PerformanceCreativeRequest, style: Style): string {
  const parts: string[] = []
  
  // BASE: mainPrompt (fonte da verdade)
  if (request.mainPrompt) {
    parts.push(request.mainPrompt)
  } else {
    // Fallback: construir a partir de product_name/offer se mainPrompt não existir
    if (request.product_name) {
      parts.push(`Produto principal: ${request.product_name}`)
    }
    if (request.offer) {
      parts.push(`Oferta: ${request.offer}`)
    }
  }
  
  // Complementos (enriquecem, não substituem)
  const visualStyle = this.styleEngine.getVisualStyle(style, request.niche)
  parts.push(`Estilo visual: ${visualStyle}`)
  // ... resto dos complementos
}
```

---

### Problema 2: Modo Performance trata `mainPrompt` como opcional no copy

**Severidade:** 🟡 **MÉDIA**

**Descrição:**
O método `buildCopyPrompt()` inclui `mainPrompt` apenas como contexto adicional, não como base principal.

**Impacto:**
- Copy gerada pode não refletir o prompt principal do usuário
- `mainPrompt` deveria ser a base, com outros campos como complementos

**Correção:**
```typescript
// ANTES (ERRADO):
if (request.mainPrompt) {
  parts.push(`- Prompt principal: ${request.mainPrompt}`)
}

// DEPOIS (CORRETO):
// BASE: mainPrompt (fonte da verdade)
if (request.mainPrompt) {
  parts.push('PROMPT PRINCIPAL:')
  parts.push(request.mainPrompt)
  parts.push('')
  parts.push('CONTEXTO ADICIONAL:')
} else {
  parts.push('CONTEXTO:')
}
// ... resto dos campos como complementos
```

---

## 📋 CHECKLIST DE CONFORMIDADE

| Item | Status | Observação |
|------|--------|------------|
| Campo único para prompt principal | ✅ | `prompt` é o único campo |
| Referências visuais como complemento | ✅ | Funcionam corretamente |
| Modo Tradicional usa `mainPrompt` como base | ✅ | Correto em `creative-generator.ts` |
| Modo Performance usa `mainPrompt` como base (imagem) | ❌ | **PROBLEMA:** Ignora `mainPrompt` |
| Modo Performance usa `mainPrompt` como base (copy) | ⚠️ | **PROBLEMA:** Tratado como opcional |
| Configurações avançadas como complemento | ✅ | Funcionam corretamente |
| Sem campos redundantes | ✅ | Não há campos duplicados |
| Fluxo simples e direto | ✅ | Interface intuitiva |

---

## 🔧 CORREÇÕES NECESSÁRIAS

### Correção 1: `lib/performance-creative-engine.ts` - `generateImagePrompt()`

**Prioridade:** 🔴 **ALTA**

**Ação:**
1. Usar `mainPrompt` como BASE do prompt de imagem
2. Se `mainPrompt` não existir, construir a partir de `product_name`/`offer`
3. Outros campos (estilo, direção técnica, etc.) devem ser complementos

### Correção 2: `lib/performance-creative-engine.ts` - `buildCopyPrompt()`

**Prioridade:** 🟡 **MÉDIA**

**Ação:**
1. Usar `mainPrompt` como BASE do prompt de copy
2. Outros campos devem ser complementos, não substituições

---

## ✅ CONCLUSÃO

**Fluxo Tradicional:** ✅ **CONFORME** - Funciona corretamente

**Modo Performance:** ✅ **CORRIGIDO** - Agora usa `mainPrompt` como base tanto no prompt de imagem quanto no copy

**Correções Aplicadas:**
1. ✅ `generateImagePrompt()` agora usa `mainPrompt` como BASE (fonte da verdade)
2. ✅ `buildCopyPrompt()` agora usa `mainPrompt` como BASE (fonte da verdade)
3. ✅ Outros campos (`product_name`, `offer`, etc.) são apenas complementos

**Status Final:** ✅ **CONFORME COM ESPECIFICAÇÃO**

