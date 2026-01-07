# 🚀 Performance Creative Engine

Sistema de geração de criativos de alta performance para tráfego direto, focados em conversão.

---

## 📋 Visão Geral

O **Performance Creative Engine** é um sistema especializado em gerar criativos publicitários otimizados para performance marketing, respeitando:

- ✅ Idioma e cultura (pt-BR, en-US, es-ES)
- ✅ Nicho de mercado (10 nichos suportados)
- ✅ Plataforma de anúncio (Meta, Google, TikTok, YouTube, Display)
- ✅ Objetivo da campanha (conversão, CTR, retenção visual, clareza)
- ✅ Estilo criativo (9 estilos disponíveis)

---

## 🎯 Características Principais

### 1. **Foco em Performance**
- Criativos orientados a conversão
- Otimização para CTR
- Clareza da proposta de valor
- CTA explícito e direto

### 2. **Adaptação Cultural**
- Tom ajustado por idioma
- Linguagem adaptada à cultura
- Evita traduções literais
- Respeita nuances regionais

### 3. **Múltiplas Variações A/B**
- Gera múltiplas versões automaticamente
- Variação de estilo e tom
- Otimizado para testes
- Comparação facilitada

### 4. **Style Engine Inteligente**
- Seleção automática de estilo baseado em nicho/objetivo
- Variações para A/B testing
- Adaptação visual por plataforma

---

## 📡 API Endpoint

### POST `/api/creative/performance`

#### Campos Obrigatórios

```json
{
  "language": "pt-BR",
  "niche": "e-commerce",
  "platform": "meta-ads",
  "creative_type": "variações A/B",
  "objective": "conversão"
}
```

#### Campos Opcionais

```json
{
  "product_name": "Curso de Marketing Digital",
  "offer": "50% de desconto",
  "target_audience": "Empreendedores iniciantes",
  "tone": "friendly",
  "style": "direto e agressivo",
  "pain_point": "Falta de conhecimento em marketing",
  "desired_action": "Compre Agora",
  "quantity_of_variations": 3,
  "mainPrompt": "Prompt adicional para contexto",
  "imageRatio": "9:16"
}
```

#### Resposta de Sucesso

```json
{
  "status": "success",
  "language": "pt-BR",
  "niche": "e-commerce",
  "platform": "meta-ads",
  "creative_versions": [
    {
      "version_number": 1,
      "headline": "CURSO DE MARKETING DIGITAL - 50% DE DESCONTO",
      "copy": "Transforme seu negócio com estratégias comprovadas...",
      "image_prompt": "Produto principal: Curso de Marketing Digital...",
      "cta": "Compre Agora",
      "style_applied": "direto e agressivo",
      "tone_applied": "friendly",
      "notes": "Versão direto e agressivo com tom friendly..."
    }
  ],
  "cta": "Compre Agora",
  "notes": "Criativos gerados para e-commerce na plataforma meta-ads...",
  "metadata": {
    "generated_at": "2025-01-XX...",
    "variations_count": 3,
    "style_engine_version": "1.0.0"
  }
}
```

---

## 🎨 Estilos Disponíveis

### 1. **Direto e Agressivo**
- Alto contraste, cores vibrantes
- Foco em ação imediata
- Ideal para: e-commerce, conversão direta

### 2. **Emocional**
- Cores suaves mas impactantes
- Conexão emocional
- Ideal para: saúde, beleza, fitness

### 3. **Educacional**
- Layout limpo, tipografia clara
- Foco em clareza
- Ideal para: infoprodutos, educação

### 4. **Minimalista**
- Espaço em branco generoso
- Elegância
- Ideal para: tecnologia, serviços premium

### 5. **Premium**
- Qualidade fotográfica alta
- Exclusividade
- Ideal para: beleza, imobiliário

### 6. **UGC (User Generated Content)**
- Estilo autêntico, não perfeito
- Realismo
- Ideal para: fitness, e-commerce

### 7. **Storytelling Curto**
- Sequência visual narrativa
- História
- Ideal para: retenção visual

### 8. **Comparativo**
- Elementos lado a lado
- Contraste claro
- Ideal para: conversão, clareza

### 9. **Prova Social**
- Pessoas reais, expressões autênticas
- Confiança
- Ideal para: CTR, conversão

---

## 🌍 Adaptação por Idioma

### Português (pt-BR)
- **Tom:** Mais emocional e conversacional
- **Linguagem:** Direta mas calorosa
- **Exemplo CTA:** "Compre Agora", "Saiba Mais"

### Inglês (en-US)
- **Tom:** Mais direto e objetivo
- **Linguagem:** Concisa e clara
- **Exemplo CTA:** "Buy Now", "Learn More"

### Espanhol (es-ES)
- **Tom:** Emocional com clareza comercial
- **Linguagem:** Expressiva mas profissional
- **Exemplo CTA:** "Comprar Ahora", "Saber Más"

---

## 🎯 Objetivos Suportados

### 1. **Conversão**
- Foco: Venda direta
- Estilo recomendado: Direto e agressivo
- CTA: "Compre Agora"

### 2. **CTR**
- Foco: Cliques
- Estilo recomendado: Prova social
- CTA: "Clique Aqui"

### 3. **Retenção Visual**
- Foco: Engajamento
- Estilo recomendado: Storytelling curto
- CTA: "Veja Mais"

### 4. **Clareza da Oferta**
- Foco: Entendimento
- Estilo recomendado: Minimalista
- CTA: "Saiba Mais"

---

## 📊 Nichos Suportados

1. **e-commerce** → Estilo: Direto e agressivo
2. **infoprodutos** → Estilo: Educacional
3. **saúde** → Estilo: Emocional
4. **beleza** → Estilo: Premium
5. **fitness** → Estilo: UGC
6. **finanças** → Estilo: Profissional
7. **educação** → Estilo: Educacional
8. **tecnologia** → Estilo: Minimalista
9. **serviços** → Estilo: Storytelling curto
10. **imobiliário** → Estilo: Premium

---

## 🚀 Exemplo de Uso

### cURL

```bash
curl -X POST http://localhost:4000/api/creative/performance \
  -H "Content-Type: application/json" \
  -d '{
    "language": "pt-BR",
    "niche": "e-commerce",
    "platform": "meta-ads",
    "creative_type": "variações A/B",
    "objective": "conversão",
    "product_name": "Curso de Marketing Digital",
    "offer": "50% de desconto",
    "target_audience": "Empreendedores iniciantes",
    "quantity_of_variations": 3
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('/api/creative/performance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    language: 'pt-BR',
    niche: 'e-commerce',
    platform: 'meta-ads',
    creative_type: 'variações A/B',
    objective: 'conversão',
    product_name: 'Curso de Marketing Digital',
    offer: '50% de desconto',
    quantity_of_variations: 3
  })
})

const result = await response.json()
console.log(result.creative_versions)
```

---

## 🔧 Integração com Sistema Existente

O Performance Creative Engine pode ser usado em conjunto com o sistema existente:

1. **Geração de Copy:** Usa o mesmo AIService
2. **Geração de Imagens:** Pode usar o GeminiImageServiceV2
3. **Feature Flags:** Respeita as flags existentes
4. **Cache:** Pode usar o mesmo sistema de cache (quando implementado)

---

## 📈 Próximos Passos

1. ✅ Implementar cache de resultados
2. ✅ Adicionar métricas de performance
3. ✅ Integrar com sistema de scoring
4. ✅ Dashboard de analytics
5. ✅ A/B testing automático

---

## 📝 Notas Técnicas

- **Modelo de IA:** GPT-3.5-turbo (configurável)
- **Temperatura:** 0.8 (para criatividade balanceada)
- **Max Tokens:** 300 (para copy concisa)
- **Timeout:** 60s (padrão)

---

**Versão:** 1.0.0  
**Última atualização:** Janeiro 2025






