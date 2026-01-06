# 🎨 OVERVIEW COMPLETO: Sistema de Geração de Imagens

**Data de Atualização:** Janeiro 2025  
**Versão:** 2.0 (Gemini-only)  
**Status:** ✅ **PRODUÇÃO**

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Componentes Principais](#componentes-principais)
4. [Fluxo de Geração](#fluxo-de-geração)
5. [Modelos e APIs](#modelos-e-apis)
6. [Configuração](#configuração)
7. [Interface do Usuário](#interface-do-usuário)
8. [Estrutura de Dados](#estrutura-de-dados)
9. [Prompts e Otimização](#prompts-e-otimização)
10. [Tratamento de Erros](#tratamento-de-erros)
11. [Performance e Custos](#performance-e-custos)
12. [Troubleshooting](#troubleshooting)
13. [Exemplos Práticos](#exemplos-práticos)

---

## 🎯 Visão Geral

O sistema de geração de imagens é um módulo completo para criação de criativos publicitários de alta performance, utilizando **Google Gemini 2.5 Flash Image (Nano Banana)** como motor principal de geração.

### Características Principais

- ✅ **Geração de múltiplas variações** (até 4 imagens por execução)
- ✅ **Estilos alternados**: Conceitual e Comercial
- ✅ **Análise de referências visuais** via GPT-4 Vision
- ✅ **Prompts otimizados** automaticamente
- ✅ **Interface simplificada** estilo chat
- ✅ **Validação de conteúdo** (proibido, urgência falsa, etc.)
- ✅ **Suporte a múltiplos idiomas** (pt-BR, en-US, es-ES)
- ✅ **Múltiplas proporções** (1:1, 4:5, 9:16, 16:9)

### Modelo Utilizado

**Google Gemini 2.5 Flash Image (Nano Banana)**
- Modelo primário: `gemini-2.5-flash-image-exp` (experimental)
- Modelo fallback: `gemini-2.5-flash-image`
- Endpoint: `https://generativelanguage.googleapis.com/v1beta`

---

## 🏗️ Arquitetura do Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Next.js)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  app/criativos/page.tsx                               │   │
│  │  - Formulário simplificado                            │   │
│  │  - Upload de referências                              │   │
│  │  - Visualização de resultados                         │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             │ HTTP POST
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              API Routes (Next.js API Routes)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/creative/generate                                │   │
│  │  - Validação de entrada                               │   │
│  │  - Orquestração da geração                            │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/creative/analyze-image                           │   │
│  │  - Análise de imagens via GPT-4 Vision                │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             │
┌────────────────────────────┴─────────────────────────────────┐
│              Core Services (lib/)                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  creative-generator.ts                                │   │
│  │  - Validação de briefing                              │   │
│  │  - Geração de prompts                                  │   │
│  │  - Geração de copy                                     │   │
│  │  - Orquestração de imagens                             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  gemini-image-service.ts                               │   │
│  │  - Integração com Gemini API                           │   │
│  │  - Extração de imagens                                 │   │
│  │  - Tratamento de erros                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ai-services.ts                                       │   │
│  │  - Integração com OpenAI (copy + análise)             │   │
│  │  - GPT-4 Vision para análise de imagens               │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             │
┌────────────────────────────┴─────────────────────────────────┐
│                    External APIs                               │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │  Google Gemini API        │  │  OpenAI API               │ │
│  │  - Image Generation       │  │  - Text Generation        │ │
│  │  - gemini-2.5-flash-image │  │  - GPT-4 Vision           │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔧 Componentes Principais

### 1. Frontend (`app/criativos/page.tsx`)

**Responsabilidades:**
- Interface do usuário simplificada (estilo chat)
- Upload e gerenciamento de referências visuais
- Análise de imagens via IA
- Visualização de resultados (múltiplas variações)
- Configurações avançadas (proporção, variações)

**Principais Estados:**
```typescript
- prompt: string                    // Prompt principal
- imageReferences: Array            // Referências visuais
- imageRatio: '1:1' | '4:5' | '9:16' | '16:9'
- variations: number                // 1-4 variações
- isGenerating: boolean
- result: CreativeResult | null
```

**Funcionalidades:**
- ✅ Upload de imagens de referência
- ✅ Análise automática via GPT-4 Vision
- ✅ Geração de múltiplas variações
- ✅ Visualização de resultados em grid
- ✅ Links para abrir imagens geradas

### 2. API Route (`app/api/creative/generate/route.ts`)

**Endpoint:** `POST /api/creative/generate`

**Validação:**
- `mainPrompt` é obrigatório (string não vazia)
- `productName` é opcional (pode ser extraído do mainPrompt)

**Fluxo:**
1. Recebe `CreativeBrief` do frontend
2. Valida campos obrigatórios
3. Inicializa `AIService` (OpenAI para copy)
4. Chama `CreativeGenerator.generateCreative()`
5. Retorna `CreativeOutput` em JSON

**Request Body:**
```typescript
{
  mainPrompt: string              // OBRIGATÓRIO
  productName?: string
  productDescription?: string
  targetAudience?: string
  keyBenefits?: string[]
  callToAction?: string
  tone?: 'professional' | 'casual' | 'friendly' | 'urgent' | 'inspiring'
  platform?: 'facebook' | 'instagram' | 'google' | 'linkedin' | 'twitter'
  objective?: 'cliques' | 'whatsapp' | 'vendas' | 'leads' | 'visualizacoes'
  imageRatio?: '1:1' | '4:5' | '9:16' | '16:9'
  language?: 'pt-BR' | 'en-US' | 'es-ES'
  variations?: number              // 1-4
  imageReferences?: Array<{
    url: string
    role: 'style' | 'produto' | 'inspiração'
    description?: string
  }>
  avoidWords?: string[]
  mustInclude?: string[]
  brandGuidelines?: string
  generateImage?: boolean          // true = gerar imagens automaticamente
}
```

**Response:**
```typescript
{
  status: 'success' | 'failed'
  copy?: string
  imagePrompt?: string
  conceptualImages?: Array<{
    url: string
    prompt: string
    revisedPrompt?: string
    model: 'gemini-imagen'
    variation: number
  }>
  commercialImages?: Array<{
    url: string
    prompt: string
    model: 'gemini-imagen'
    variation: number
  }>
  explanation?: string
  failureReason?: string
  metadata?: {
    characterCount?: number
    tone?: string
    platform?: string
  }
}
```

### 3. Creative Generator (`lib/creative-generator.ts`)

**Classe Principal:** `CreativeGenerator`

**Métodos Principais:**

#### `validateBriefing(brief: CreativeBrief)`
Valida o briefing contra:
- Conteúdo proibido (ódio, violência, etc.)
- Afirmações absolutas não autorizadas
- Urgência falsa
- Presença de `mainPrompt` ou `productName`

#### `extractImageCharacteristics(references)`
Extrai características visuais de referências:
- Estilo (iluminação, cores, estética)
- Produto (descrição, elementos)
- Composição (layout, perspectiva)

#### `generateConceptualImagePrompt(brief, variation)`
Gera prompt conceitual:
- Foco em estética profissional
- Storytelling visual
- Composição limpa e minimalista
- Variações por número (1-2)

#### `generateCommercialImagePrompt(brief, variation)`
Gera prompt comercial:
- Foco em conversão
- CTA forte e visível
- Alto contraste
- Elementos chamativos
- Variações por número (1-2)

#### `generateCopy(brief, aiService)`
Gera copy do anúncio:
- Usa GPT-3.5-turbo (OpenAI)
- Prompt otimizado para CTR
- Validação de regras (sem afirmações absolutas, etc.)
- Limpeza e otimização

#### `generateCreative(brief, aiService, generateImage)`
**Método principal** que orquestra tudo:
1. Valida briefing
2. Gera copy
3. Gera imagePrompt base
4. Se `generateImage = true`:
   - Inicializa `GeminiImageService`
   - Loop de variações (até 4)
   - Alterna entre conceitual e comercial
   - Chama `geminiService.generateImage()`
   - Armazena resultados
5. Gera explicação das diferenças
6. Retorna `CreativeOutput`

### 4. Gemini Image Service (`lib/gemini-image-service.ts`)

**Classe:** `GeminiImageService`

**Configuração:**
```typescript
- endpoint: 'https://generativelanguage.googleapis.com/v1beta'
- model: 'gemini-2.5-flash-image-exp' (primário)
- fallback: 'gemini-2.5-flash-image'
```

**Método Principal:** `generateImage(request: GeminiImageRequest)`

**Request:**
```typescript
{
  prompt: string
  aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9'
  safetyFilter?: 'block_some' | 'block_most' | 'block_few' | 'block_none'
}
```

**Estrutura da Requisição HTTP:**
```json
{
  "contents": [{
    "parts": [{
      "text": "prompt completo aqui"
    }]
  }],
  "generationConfig": {
    "temperature": 0.4,        // Reduzido para textos legíveis
    "topK": 40,
    "topP": 0.95,
    "maxOutputTokens": 8192
  },
  "imageGenerationConfig": {
    "numberOfImages": 1,
    "aspectRatio": "1:1",
    "safetyFilterLevel": "block_some",
    "personGeneration": "allow_all"
  },
  "safetySettings": [...]
}
```

**Tratamento de Resposta:**
O serviço verifica múltiplos formatos possíveis:
1. `candidates[0].content.parts[].inlineData` (base64)
2. `candidates[0].content.parts[].imageUrl` (URL)
3. `data.imageUrl` (formato alternativo)
4. `data.inlineData` (formato alternativo)
5. `data.generatedImages` (formato específico)
6. Busca recursiva em toda a estrutura

**Response:**
```typescript
{
  success: boolean
  imageUrl?: string              // URL ou data URL
  base64Image?: string
  prompt?: string                // Prompt usado
  error?: string
}
```

**Tratamento de Erros:**
- Se modelo experimental falhar, tenta modelo não-experimental
- Se ambos falharem, retorna prompt otimizado
- Logs detalhados para debug

### 5. AI Services (`lib/ai-services.ts`)

**Classe:** `AIService`

**Funcionalidades:**
- Geração de texto (GPT-3.5-turbo, GPT-4)
- Análise de imagens (GPT-4 Vision)
- Integração com OpenAI API

**Método:** `analyzeImageWithVision(imageBase64: string)`
- Recebe imagem em base64
- Envia para GPT-4 Vision
- Retorna descrição estruturada das características visuais

---

## 🔄 Fluxo de Geração

### Fluxo Completo (com geração de imagens)

```
1. Usuário preenche formulário
   ├─ Prompt principal
   ├─ Referências visuais (opcional)
   ├─ Configurações (proporção, variações)
   └─ Clica "Gerar Imagens"

2. Frontend envia POST /api/creative/generate
   └─ Body: CreativeBrief com generateImage: true

3. API Route valida entrada
   ├─ Verifica mainPrompt
   └─ Constrói CreativeBrief

4. CreativeGenerator.generateCreative()
   ├─ Valida briefing
   ├─ Gera copy (GPT-3.5-turbo)
   ├─ Gera imagePrompt base
   └─ Se generateImage = true:
      ├─ Inicializa GeminiImageService
      ├─ Loop de variações (1 a numVariations):
      │  ├─ Determina tipo (conceitual ou comercial)
      │  ├─ Gera prompt específico
      │  ├─ Chama geminiService.generateImage()
      │  ├─ Extrai imagem da resposta
      │  └─ Armazena em conceptualImages ou commercialImages
      └─ Gera explicação das diferenças

5. Retorna CreativeOutput
   ├─ copy
   ├─ conceptualImages[] (até 2)
   ├─ commercialImages[] (até 2)
   ├─ explanation
   └─ metadata

6. Frontend exibe resultados
   ├─ Grid de imagens
   ├─ Prompts usados
   ├─ Explicação
   └─ Links para abrir imagens
```

### Fluxo de Análise de Referências

```
1. Usuário faz upload de imagem
   └─ Frontend armazena File

2. Usuário clica "Analisar com IA"
   └─ Frontend envia POST /api/creative/analyze-image
      └─ FormData com imagem

3. API Route processa
   ├─ Converte File para base64
   └─ Chama aiService.analyzeImageWithVision()

4. GPT-4 Vision analisa
   └─ Retorna descrição estruturada

5. Frontend preenche campo description
   └─ Usuário pode editar se necessário
```

---

## 🤖 Modelos e APIs

### Google Gemini 2.5 Flash Image

**Modelo:** `gemini-2.5-flash-image-exp` (experimental)  
**Fallback:** `gemini-2.5-flash-image`

**Endpoint:**
```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}
```

**Parâmetros:**
- `temperature`: 0.4 (reduzido para textos legíveis)
- `topK`: 40
- `topP`: 0.95
- `maxOutputTokens`: 8192
- `aspectRatio`: 1:1, 4:5, 9:16, 16:9
- `safetyFilterLevel`: block_some
- `personGeneration`: allow_all

**Formato de Resposta:**
A API pode retornar imagens em múltiplos formatos:
- Base64 inline (`inlineData`)
- URL da imagem (`imageUrl`)
- Campo específico (`generatedImages`)

**Limitações:**
- Modelo experimental pode não estar disponível para todos
- Rate limits da API (verificar documentação oficial)
- Tamanho máximo de prompt (verificar documentação)

### OpenAI (GPT-4 Vision + GPT-3.5-turbo)

**Uso:**
- **GPT-4 Vision**: Análise de imagens de referência
- **GPT-3.5-turbo**: Geração de copy

**Endpoints:**
- Vision: `POST https://api.openai.com/v1/chat/completions`
- Text: `POST https://api.openai.com/v1/chat/completions`

**Modelos:**
- `gpt-4-vision-preview` (análise)
- `gpt-3.5-turbo` (copy)

---

## ⚙️ Configuração

### Variáveis de Ambiente

**Arquivo:** `.env.local`

```env
# Google AI Studio (Gemini)
GOOGLE_AI_STUDIO_API_KEY="AIzaSy..."
# OU
GEMINI_API_KEY="AIzaSy..."

# OpenAI (Copy + Análise)
OPENAI_API_KEY="sk-proj-..."
```

### Verificação

```bash
# Verificar se as chaves estão configuradas
cat .env.local | grep -E "GOOGLE_AI_STUDIO_API_KEY|GEMINI_API_KEY|OPENAI_API_KEY"
```

### Reiniciar Servidor

Após configurar variáveis de ambiente:
```bash
# Parar servidor (Ctrl+C)
# Reiniciar
npm run dev
```

---

## 🖥️ Interface do Usuário

### Layout

**Duas colunas:**
- **Esquerda**: Formulário de entrada
- **Direita**: Resultados e visualização

### Campos Principais

1. **Prompt Principal** (textarea grande)
   - Campo principal, estilo chat
   - Obrigatório
   - Aceita descrição detalhada

2. **Referências de Imagem** (opcional)
   - Upload de arquivo ou URL
   - Botão "Analisar com IA"
   - Múltiplas referências suportadas

3. **Configurações Avançadas** (colapsadas)
   - Proporção: 1:1, 4:5, 9:16, 16:9
   - Variações: 1-4

4. **Botão "Gerar Imagens"**
   - Implicitamente gera imagens
   - Mostra loading durante geração

### Visualização de Resultados

**Grid de Imagens:**
- Imagens conceituais (até 2)
- Imagens comerciais (até 2)
- Cada imagem mostra:
  - Preview
  - Número da variação
  - Link "Abrir"
  - Prompt usado

**Explicação:**
- Total de imagens geradas
- Diferenças entre estilos
- Recomendações para teste A/B

**Tratamento de Erros:**
- Mensagem clara quando imagem não é gerada
- Explicação do motivo
- Prompt otimizado disponível

---

## 📊 Estrutura de Dados

### CreativeBrief

```typescript
interface CreativeBrief {
  // PROMPT PRINCIPAL (FONTE DA VERDADE)
  mainPrompt: string              // OBRIGATÓRIO
  
  // Informações do produto/serviço
  productName?: string
  productDescription?: string
  targetAudience?: string
  keyBenefits?: string[]
  callToAction?: string
  
  // Diretrizes de copy
  tone?: 'professional' | 'casual' | 'friendly' | 'urgent' | 'inspiring'
  maxLength?: number
  platform?: 'facebook' | 'instagram' | 'google' | 'linkedin' | 'twitter'
  
  // Campos estruturados
  objective?: 'cliques' | 'whatsapp' | 'vendas' | 'leads' | 'visualizacoes'
  imageRatio?: '1:1' | '4:5' | '9:16' | '16:9'
  language?: 'pt-BR' | 'en-US' | 'es-ES'
  variations?: number              // 1-4
  
  // Referências visuais
  imageReferences?: Array<{
    url: string
    role: 'style' | 'produto' | 'inspiração'
    description?: string
  }>
  
  // Restrições
  avoidWords?: string[]
  mustInclude?: string[]
  
  // Informações adicionais
  brandGuidelines?: string
  competitorExamples?: string[]
}
```

### CreativeOutput

```typescript
interface CreativeOutput {
  status: 'success' | 'failed'
  copy?: string
  imagePrompt?: string
  imageUrl?: string              // Compatibilidade (primeira imagem)
  revisedPrompt?: string         // Compatibilidade
  
  // Geração de múltiplas variações
  conceptualImages?: Array<{
    url: string
    prompt: string
    revisedPrompt?: string
    model: 'gemini-imagen'
    variation: number
  }>
  commercialImages?: Array<{
    url: string
    prompt: string
    model: 'gemini-imagen'
    variation: number
  }>
  
  // Compatibilidade (primeira imagem de cada tipo)
  conceptualImage?: {
    url: string
    prompt: string
    revisedPrompt?: string
    model: 'gemini-imagen'
  }
  commercialImage?: {
    url: string
    prompt: string
    model: 'gemini-imagen'
  }
  
  explanation?: string
  failureReason?: string
  metadata?: {
    characterCount?: number
    tone?: string
    platform?: string
  }
}
```

---

## ✍️ Prompts e Otimização

### Estrutura de Prompts

**Prompt Conceitual:**
```
Crie uma imagem publicitária de alta qualidade
IMPORTANTE: Todos os textos na imagem devem ser legíveis, profissionais e sem erros ortográficos
[mainPrompt]
[características do produto]
Estilo visual: conceitual, limpo, moderno, profissional...
Composição: produto em destaque, fundo limpo...
Formato: [aspectRatio]
Qualidade: fotografia profissional de alta resolução, 8K...
Iluminação: suave e difusa...
Fundo: limpo e minimalista...
```

**Prompt Comercial:**
```
Crie uma imagem publicitária comercial de alta conversão
IMPORTANTE: Todos os textos na imagem devem ser legíveis, profissionais, sem erros ortográficos e claramente visíveis
[mainPrompt]
[características do produto]
Estilo visual: agressivo, comercial, alto contraste...
Composição: produto em destaque, elementos de CTA visual...
Formato: [aspectRatio]
Qualidade: alta resolução, cores vibrantes...
Iluminação: dramática, alto contraste...
Fundo: vibrante ou contrastante...
[objetivo do anúncio]
[CTA visual]
```

### Variações

**Conceitual:**
- Variação 1: Estilo conceitual, limpo, moderno, perspectiva central
- Variação 2: Estilo minimalista, elegante, sofisticado, perspectiva dinâmica

**Comercial:**
- Variação 1: Estilo agressivo, alto contraste, layout dinâmico
- Variação 2: Estilo impactante, cores saturadas, layout direto

### Otimizações Aplicadas

1. **Temperature reduzida** (0.4) para textos legíveis
2. **Instruções explícitas** sobre legibilidade de texto
3. **Uso do mainPrompt** como base (nunca sobrescrito)
4. **Características de referências** integradas
5. **Aspect ratio** específico por plataforma
6. **Variações sutis** para diversidade

---

## ⚠️ Tratamento de Erros

### Erros Comuns

1. **API Key não configurada**
   - **Erro**: "Google AI Studio API key não configurada"
   - **Solução**: Configurar `GOOGLE_AI_STUDIO_API_KEY` no `.env.local`

2. **Modelo não disponível**
   - **Erro**: API retorna erro 404 ou 403
   - **Solução**: Sistema tenta automaticamente modelo fallback
   - **Fallback**: Se experimental falhar, tenta não-experimental

3. **Imagem não gerada (apenas prompt)**
   - **Causa**: API retorna texto em vez de imagem
   - **Tratamento**: Sistema retorna prompt otimizado
   - **Frontend**: Mostra mensagem explicativa

4. **Timeout ou rate limit**
   - **Causa**: API demora muito ou excede limites
   - **Tratamento**: Erro capturado, prompt otimizado retornado
   - **Logs**: Detalhes no console do servidor

### Logs e Debug

**Console do Servidor:**
```
[CreativeGenerator] Gerando imagem conceptual 1/4 com Gemini...
[GeminiImage] Chamando API Gemini: https://...
[GeminiImage] Modelo: gemini-2.5-flash-image-exp
[GeminiImage] Resposta completa da API: {...}
[GeminiImage] Imagem encontrada em inlineData, tamanho: 123456
```

**Verificar Logs:**
```bash
# Terminal onde o servidor está rodando
# Logs aparecem em tempo real
```

---

## 📈 Performance e Custos

### Tempo de Geração

- **1 variação**: ~30-60 segundos
- **2 variações**: ~60-120 segundos
- **4 variações**: ~120-240 segundos

**Fatores que afetam:**
- Latência da API Gemini
- Tamanho do prompt
- Complexidade da imagem

### Custos

**Gemini (Google AI Studio):**
- **Gratuito** (dentro dos limites da conta)
- Verificar limites em: https://aistudio.google.com/

**OpenAI:**
- **GPT-4 Vision**: ~$0.01-0.03 por análise de imagem
- **GPT-3.5-turbo**: ~$0.001-0.002 por copy gerada

**Custo Total Estimado (por geração com 4 imagens):**
- Gemini: Gratuito (ou conforme limites)
- OpenAI: ~$0.01-0.05 (copy + análise de referências)

### Otimizações

1. **Cache de referências**: Análise feita apenas uma vez
2. **Geração assíncrona**: Múltiplas imagens em paralelo (futuro)
3. **Fallback inteligente**: Modelo alternativo se primário falhar

---

## 🔍 Troubleshooting

### Problema: Imagens não são geradas

**Sintomas:**
- Sistema retorna apenas prompts
- Mensagem "Imagem não gerada" no frontend

**Soluções:**
1. Verificar API key no `.env.local`
2. Verificar logs do servidor para erros específicos
3. Testar API key diretamente no Google AI Studio
4. Verificar se modelo experimental está disponível

### Problema: Textos ilegíveis nas imagens

**Sintomas:**
- Textos com erros ortográficos
- Textos borrados ou ilegíveis

**Soluções:**
1. Verificar se prompt contém instruções de legibilidade
2. Ajustar `temperature` (já configurado em 0.4)
3. Adicionar instruções mais explícitas no prompt

### Problema: Qualidade das imagens baixa

**Sintomas:**
- Imagens pixeladas
- Cores desbotadas
- Composição ruim

**Soluções:**
1. Melhorar o Prompt Principal (mais detalhes)
2. Adicionar referências visuais
3. Especificar qualidade no prompt ("8K", "alta resolução")

### Problema: Erro 403 ou 401 na API

**Sintomas:**
- Erro de autenticação
- API retorna 403/401

**Soluções:**
1. Verificar se API key está correta
2. Verificar se API key tem permissões para geração de imagens
3. Verificar se API key não expirou
4. Verificar limites da conta Google AI Studio

---

## 💡 Exemplos Práticos

### Exemplo 1: Produto Físico (E-commerce)

**Prompt Principal:**
```
Uma mulher sorrindo segurando um cartão presente Walmart, fundo azul e amarelo vibrante, estilo publicitário moderno, iluminação natural, composição centralizada, cores da marca Walmart (azul #004C9F e amarelo #FFC72C)
```

**Configurações:**
- Objetivo: `vendas`
- Proporção: `9:16`
- Idioma: `pt-BR`
- Variações: `2`

**Resultado Esperado:**
- 1 imagem conceitual: mulher com cartão, estilo limpo e profissional
- 1 imagem comercial: foco em CTA e conversão, estilo agressivo

### Exemplo 2: Serviço Digital (Curso Online)

**Prompt Principal:**
```
Um laptop aberto mostrando uma tela de curso online de marketing digital, ambiente moderno e profissional, iluminação suave, elementos visuais de aprendizado (gráficos, ícones), cores vibrantes mas profissionais
```

**Configurações:**
- Objetivo: `leads`
- Proporção: `4:5`
- Idioma: `pt-BR`
- Variações: `4`

**Resultado Esperado:**
- 2 imagens conceituais: foco em educação e profissionalismo
- 2 imagens comerciais: foco em captura de leads e CTA

### Exemplo 3: Produto Alimentício

**Prompt Principal:**
```
Prato de comida vegana colorida e apetitosa, ingredientes frescos em destaque, iluminação natural, estilo food photography profissional, fundo neutro, composição que evoca saúde e bem-estar
```

**Configurações:**
- Objetivo: `cliques`
- Proporção: `1:1`
- Idioma: `pt-BR`
- Variações: `2`

**Resultado Esperado:**
- 1 imagem conceitual: foco em estética e qualidade
- 1 imagem comercial: foco em apetite e ação

---

## 📚 Referências e Documentação

### Documentação Interna

- [Sistema de Geração Dupla](./SISTEMA-GERACAO-DUPLA.md)
- [Guia de Prompts](./GUIA-PROMPTS-CRIATIVOS.md)
- [Verificação Gemini API](./VERIFICACAO-GEMINI-API.md)
- [Status do Gerador](./CREATIVE-GENERATOR-STATUS.md)

### Documentação Externa

- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [GPT-4 Vision](https://platform.openai.com/docs/guides/vision)

---

## ✅ Checklist de Verificação

Antes de usar o sistema, verifique:

- [ ] `GOOGLE_AI_STUDIO_API_KEY` configurada no `.env.local`
- [ ] `OPENAI_API_KEY` configurada no `.env.local`
- [ ] Servidor rodando (`npm run dev`)
- [ ] Endpoint acessível (`/api/creative/generate`)
- [ ] Frontend acessível (`/criativos`)
- [ ] API keys válidas e com permissões corretas

---

## 🎯 Resumo Executivo

**Sistema de Geração de Imagens** é um módulo completo para criação de criativos publicitários usando Google Gemini 2.5 Flash Image.

**Características:**
- ✅ Geração de até 4 variações por execução
- ✅ Estilos alternados (conceitual e comercial)
- ✅ Análise de referências visuais
- ✅ Interface simplificada estilo chat
- ✅ Validação de conteúdo
- ✅ Suporte a múltiplos idiomas e proporções

**Arquitetura:**
- Frontend React/Next.js
- API Routes para orquestração
- Core services (CreativeGenerator, GeminiImageService)
- Integração com APIs externas (Gemini, OpenAI)

**Status:** ✅ **PRODUÇÃO**

---

**Última Atualização:** Janeiro 2025  
**Versão:** 2.0 (Gemini-only)





