# 🎨 Sistema de Geração Dupla de Criativos

## 📋 Visão Geral

O sistema agora gera **DUAS versões** de cada criativo usando modelos diferentes:

1. **🎨 Criativo Conceitual (DALL-E 3)**
   - Foco: Estética profissional, storytelling visual
   - Melhor para: Awareness, consideração, topo de funil
   - Estilo: Limpo, minimalista, elegante

2. **💼 Criativo Comercial (Gemini)**
   - Foco: Conversão, ação imediata
   - Melhor para: Conversão, bottom de funil, vendas diretas
   - Estilo: Agressivo, alto contraste, CTA forte

---

## 🎯 Prompt Principal (Fonte da Verdade)

O sistema agora possui um campo **"Prompt Principal"** que é a **FONTE DA VERDADE** e **NUNCA é sobrescrito**.

### Como Funciona:
- O Prompt Principal é a base de tudo
- Os campos estruturados apenas **ENRIQUECEM** o prompt principal
- Se você escrever um prompt detalhado, ele será usado como base
- Os outros campos complementam, não substituem

### Exemplo:
```
Prompt Principal: "Uma mulher sorrindo segurando um cartão presente Walmart, fundo azul e amarelo vibrante, estilo publicitário"

Campos Estruturados:
- Objetivo: Vendas
- Proporção: 9:16
- Idioma: pt-BR

Resultado: O prompt principal é mantido e enriquecido com os campos estruturados
```

---

## 📋 Campos Estruturados

Os campos estruturados **ENRIQUECEM** o prompt principal:

- **Objetivo do Anúncio**: cliques, whatsapp, vendas, leads, visualizações
- **Proporção da Imagem**: 1:1, 4:5, 9:16, 16:9
- **Idioma**: pt-BR, en-US, es-ES
- **Variações**: Quantidade de variações desejadas (1-5)

---

## 🔧 Configuração

### Variáveis de Ambiente

Adicione no seu `.env.local`:

```env
# OpenAI (para DALL-E 3)
OPENAI_API_KEY="sk-proj-..."

# Google AI Studio (para Gemini)
GOOGLE_AI_STUDIO_API_KEY="your-google-ai-studio-api-key-here"
# OU
GEMINI_API_KEY="your-google-ai-studio-api-key-here"
```

---

## 📊 Resultado da Geração

Quando você gerar um criativo com imagens, receberá:

1. **Copy**: Texto do anúncio
2. **Image Prompt**: Prompt conceitual (DALL-E)
3. **🎨 Criativo Conceitual (DALL-E 3)**:
   - Imagem gerada
   - Prompt usado
   - Prompt revisado (se disponível)

4. **💼 Criativo Comercial (Gemini)**:
   - Imagem gerada (se API configurada)
   - Prompt comercial otimizado
   - Se não gerar imagem, retorna o prompt para uso externo

5. **📊 Explicação das Diferenças**:
   - Comparação entre os dois criativos
   - Recomendações para teste A/B

---

## 🚀 Como Usar

1. **Preencha o Prompt Principal** (opcional, mas recomendado)
   - Descreva o criativo que você quer
   - Seja específico sobre estilo, cores, elementos

2. **Preencha os Campos Estruturados**
   - Objetivo, Proporção, Idioma, Variações
   - Esses campos enriquecem o prompt principal

3. **Adicione Referências de Imagem** (opcional)
   - Faça upload de imagens
   - A IA analisará e extrairá características

4. **Marque "Gerar DUAS imagens"**
   - Sistema gerará versão conceitual (DALL-E) e comercial (Gemini)

5. **Compare os Resultados**
   - Veja as duas versões lado a lado
   - Use a explicação para entender as diferenças
   - Teste A/B para identificar qual performa melhor

---

## ⚠️ Notas Importantes

- **Gemini Imagen 3**: Atualmente, o Gemini Imagen 3 não está disponível publicamente. O sistema retorna o prompt comercial otimizado para uso em outro gerador de imagens ou aguarda a disponibilização pública.

- **Custo**: 
  - DALL-E 3 HD: ~$0.12 por imagem
  - Gemini: Gratuito (apenas prompt otimizado por enquanto)

- **Prompt Principal**: Sempre use o Prompt Principal como base. Os campos estruturados são complementares.

---

## 🎨 Diferenças entre os Criativos

### Criativo Conceitual (DALL-E 3)
- ✅ Estética profissional
- ✅ Storytelling visual
- ✅ Composição limpa
- ✅ Ideal para construir marca
- ✅ Topo de funil

### Criativo Comercial (Gemini)
- ✅ Foco em conversão
- ✅ CTA forte e visível
- ✅ Alto contraste
- ✅ Elementos chamativos
- ✅ Bottom de funil

---

## 🧪 Teste A/B

O sistema foi projetado para facilitar testes A/B:

1. Gere ambos os criativos
2. Compare visualmente
3. Teste em campanhas reais
4. Identifique qual performa melhor
5. Use o vencedor como base para próximos criativos

---

## 📝 Exemplo de Uso

```
Prompt Principal: "Uma mulher sorrindo segurando um cartão presente Walmart, fundo azul e amarelo vibrante, estilo publicitário"

Campos:
- Objetivo: Vendas
- Proporção: 9:16
- Idioma: pt-BR
- Tom: Amigável
- Plataforma: Instagram

Resultado:
- Copy gerada
- Imagem Conceitual (DALL-E): Estilo limpo e profissional
- Imagem Comercial (Gemini): Estilo agressivo com CTA forte
- Explicação das diferenças
```

---

**Sistema pronto para gerar criativos de alta performance!** 🚀






