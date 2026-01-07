# 🎨 Fidelity Image Generator

## Visão Geral

Sistema de geração de imagens focado em **alta fidelidade ao prompt do usuário**, priorizando:

- ✅ **Fidelidade ao prompt** - O prompt do usuário é sempre a fonte principal
- ✅ **Coerência visual** - Imagens profissionais e esteticamente consistentes
- ✅ **Qualidade estética** - Prontas para uso em marketing, redes sociais e apresentações
- ✅ **Enriquecimento técnico inteligente** - Adiciona detalhes técnicos apenas quando necessário, sem alterar o conceito

## Características Principais

### Campo Único de Entrada

**Prompt de Geração**: Descrição completa da imagem desejada, incluindo:
- Cenário
- Elementos
- Estilo visual
- Cores
- Iluminação
- Atmosfera
- Objetivo final

### Parâmetros do Sistema

Estes parâmetros **não interferem na inteligência da IA**, apenas ajustam aspectos técnicos:

#### Qualidade
- `low` - Rápida, menor qualidade
- `medium` - Balanceada
- `high` - Máxima qualidade (recomendado)
- `auto` - Automática (padrão: high)

#### Estilo
- `natural` - Mais realista (padrão)
- `vivid` - Mais dramático e vibrante

#### Modelo de IA
- `default` - Gemini 2.5 Flash Image (padrão)
- `dalle3` - DALL-E 3 (mais avançado)

## Regras Importantes

### ✅ O que o sistema FAZ:

1. **Utiliza o prompt do usuário como fonte principal** - Nunca simplifica ou resume
2. **Enriquece tecnicamente quando necessário** - Adiciona iluminação, composição, qualidade apenas se não mencionados
3. **Mantém a intenção original** - Nunca altera o conceito do usuário
4. **Ajusta detalhes técnicos automaticamente** - Iluminação, enquadramento, profundidade quando não especificados
5. **Prioriza qualidade profissional** - Imagens prontas para uso comercial

### ❌ O que o sistema NÃO FAZ:

1. **Não simplifica o prompt** - Mantém toda a descrição do usuário
2. **Não limita a criatividade** - Não aplica otimizações agressivas
3. **Não inventa requisitos** - Não adiciona elementos que mudem o significado
4. **Não altera o conceito** - O prompt original sempre tem prioridade

## Comportamento Esperado

### Interpretação Inteligente

O sistema interpreta o prompt de forma contextual e inteligente:

- **Prompts detalhados**: Usa como está, apenas adiciona qualidade técnica
- **Prompts médios**: Enriquece com iluminação e composição se não mencionados
- **Prompts curtos**: Adiciona detalhes visuais básicos (iluminação, ângulo, estilo) mantendo simplicidade

### Fallback Inteligente

Para prompts curtos ou pouco descritivos:

1. **Inferir detalhes visuais básicos**:
   - Iluminação natural suave (se não mencionada)
   - Composição profissional (se não mencionada)
   - Estilo visual realista (se não mencionado)

2. **Manter simplicidade**:
   - Não adiciona elementos complexos
   - Não muda o significado original
   - Preserva a intenção do usuário

## Uso da API

### Endpoint

```
POST /api/creative/fidelity-image
```

### Request Body

```json
{
  "prompt": "Uma fotografia profissional de um produto em destaque, com fundo limpo e iluminação suave",
  "quality": "auto",
  "style": "natural",
  "model": "default",
  "aspectRatio": "1:1",
  "includeTextInImage": false,
  "organizationId": "org-123",
  "siteId": "site-456"
}
```

### Response

```json
{
  "success": true,
  "imageUrl": "https://...",
  "revisedPrompt": "Prompt revisado (se DALL-E 3)",
  "metadata": {
    "model": "gemini-2.5-flash-image",
    "quality": "high",
    "style": "natural",
    "promptLength": 85,
    "technicalEnhancements": ["iluminação", "composição", "qualidade"]
  }
}
```

## Exemplos

### Exemplo 1: Prompt Detalhado

**Input:**
```json
{
  "prompt": "Fotografia profissional de um smartphone moderno em um fundo branco minimalista, iluminação suave vinda da esquerda, composição centralizada, estilo clean e moderno, cores vibrantes mas naturais"
}
```

**Comportamento:**
- ✅ Usa o prompt como está (já é completo)
- ✅ Adiciona apenas qualidade técnica (alta resolução, detalhes nítidos)
- ✅ Não altera nenhum elemento mencionado

### Exemplo 2: Prompt Médio

**Input:**
```json
{
  "prompt": "Produto de beleza em destaque com fundo rosa suave"
}
```

**Comportamento:**
- ✅ Mantém o conceito original (produto de beleza, fundo rosa)
- ✅ Adiciona iluminação natural suave (não mencionada)
- ✅ Adiciona composição profissional (não mencionada)
- ✅ Adiciona qualidade técnica (alta qualidade fotográfica)

### Exemplo 3: Prompt Curto

**Input:**
```json
{
  "prompt": "Café"
}
```

**Comportamento:**
- ✅ Mantém simplicidade (não adiciona elementos complexos)
- ✅ Adiciona iluminação natural suave
- ✅ Adiciona composição profissional
- ✅ Adiciona estilo visual realista
- ✅ Adiciona qualidade técnica
- ❌ NÃO adiciona elementos que mudem o significado (ex: "café com pessoas" se não mencionado)

## Integração

### Frontend

```typescript
const response = await fetch('/api/creative/fidelity-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: userPrompt,
    quality: 'auto',
    style: 'natural',
    model: 'default',
    aspectRatio: '1:1',
    organizationId: currentOrganization.id,
    siteId: currentSite?.id
  })
})

const result = await response.json()
if (result.success) {
  // Exibir imagem: result.imageUrl
}
```

## Status

- ✅ **Funcionalidade liberada**: Geração de imagens via Prompt de Geração
- 🚧 **Funcionalidades futuras**: Liberação gradual de novos modelos e recursos

## Objetivo Final

Entregar imagens de **alta qualidade**, alinhadas à **intenção do usuário**, com uma experiência **simples, poderosa e profissional**, **sem limitar a capacidade cognitiva da IA**.



