# 📝 Exemplo Prático: Performance Creative Engine

## 🎯 Cenário: E-commerce de Infoprodutos

### Objetivo
Gerar 3 variações A/B de criativos para campanha no Meta Ads, focado em conversão de curso de marketing digital.

---

## 📋 Request Completo

```json
{
  "language": "pt-BR",
  "niche": "infoprodutos",
  "platform": "meta-ads",
  "creative_type": "variações A/B",
  "objective": "conversão",
  "product_name": "Curso Completo de Marketing Digital",
  "offer": "50% de desconto + Bônus Exclusivos",
  "target_audience": "Empreendedores iniciantes que querem escalar seus negócios online",
  "pain_point": "Falta de conhecimento técnico em marketing digital",
  "desired_action": "Garantir Minha Vaga",
  "quantity_of_variations": 3,
  "imageRatio": "9:16"
}
```

---

## ✅ Response Esperado

```json
{
  "status": "success",
  "language": "pt-BR",
  "niche": "infoprodutos",
  "platform": "meta-ads",
  "creative_versions": [
    {
      "version_number": 1,
      "headline": "CURSO COMPLETO DE MARKETING DIGITAL - 50% DE DESCONTO + BÔNUS EXCLUSIVOS",
      "copy": "Empreendedor, você já se sentiu perdido tentando fazer seu negócio crescer online? O Curso Completo de Marketing Digital foi criado para você que quer resultados reais, não teoria. Aprenda estratégias comprovadas que já geraram milhões em vendas. Com 50% de desconto + bônus exclusivos, esta é sua chance de transformar seu negócio. Não perca esta oportunidade única.",
      "image_prompt": "Produto principal: Curso Completo de Marketing Digital. Oferta: 50% de desconto + Bônus Exclusivos. Estilo visual: Layout limpo, tipografia clara, elementos informativos, cores profissionais, foco em clareza. Direção técnica: Formato vertical (9:16), otimizado para feed mobile, composição centralizada, atenção nos primeiros 3 segundos. Foco: conversão e ação imediata. Elementos visuais: alto contraste, cores vibrantes, composição impactante. Safe area: Topo 20% e inferior 30% reservados para overlay de texto/CTA. Negativos: sem aparência 3D, sem renderização CG, sem elementos genéricos.",
      "cta": "GARANTIR MINHA VAGA",
      "style_applied": "educacional",
      "tone_applied": "friendly",
      "notes": "Versão educacional com tom friendly, otimizada para conversão"
    },
    {
      "version_number": 2,
      "headline": "Transforme seu negócio com Marketing Digital",
      "copy": "Imagine ter todas as ferramentas e estratégias para fazer seu negócio decolar online. O Curso Completo de Marketing Digital traz tudo que você precisa em um só lugar. De tráfego pago a copywriting, de funil de vendas a automação. Com 50% de desconto + bônus exclusivos, você investe uma vez e colhe resultados para sempre. Não deixe esta oportunidade passar.",
      "image_prompt": "Produto principal: Curso Completo de Marketing Digital. Oferta: 50% de desconto + Bônus Exclusivos. Estilo visual: Espaço em branco generoso, elementos essenciais, cores neutras, composição equilibrada, foco em elegância. Direção técnica: Formato vertical (9:16), otimizado para feed mobile, composição centralizada, atenção nos primeiros 3 segundos. Foco: conversão e ação imediata. Elementos visuais: alto contraste, cores vibrantes, composição impactante. Safe area: Topo 20% e inferior 30% reservados para overlay de texto/CTA. Negativos: sem aparência 3D, sem renderização CG, sem elementos genéricos.",
      "cta": "Garantir Minha Vaga",
      "style_applied": "minimalista",
      "tone_applied": "friendly",
      "notes": "Versão minimalista com tom friendly, otimizada para conversão"
    },
    {
      "version_number": 3,
      "headline": "O Segredo dos Empreendedores de Sucesso",
      "copy": "Você já se perguntou como alguns empreendedores conseguem resultados incríveis online enquanto outros ficam estagnados? A diferença está no conhecimento estratégico. O Curso Completo de Marketing Digital revela os segredos que os profissionais de sucesso usam todos os dias. Com 50% de desconto + bônus exclusivos, você tem acesso a tudo isso por um investimento único. Sua transformação começa agora.",
      "image_prompt": "Produto principal: Curso Completo de Marketing Digital. Oferta: 50% de desconto + Bônus Exclusivos. Estilo visual: Sequência visual, elementos narrativos, composição dinâmica, cores expressivas, foco em história. Direção técnica: Formato vertical (9:16), otimizado para feed mobile, composição centralizada, atenção nos primeiros 3 segundos. Foco: conversão e ação imediata. Elementos visuais: alto contraste, cores vibrantes, composição impactante. Safe area: Topo 20% e inferior 30% reservados para overlay de texto/CTA. Negativos: sem aparência 3D, sem renderização CG, sem elementos genéricos.",
      "cta": "Garantir Minha Vaga",
      "style_applied": "storytelling curto",
      "tone_applied": "friendly",
      "notes": "Versão storytelling curto com tom friendly, otimizada para conversão"
    }
  ],
  "cta": "Garantir Minha Vaga",
  "notes": "Criativos gerados para infoprodutos na plataforma meta-ads\nObjetivo: conversão\nIdioma: pt-BR\nTotal de variações: 3\n\nRecomendações:\n- Teste todas as variações em campanhas A/B\n- Monitore CTR e conversão por versão\n- Otimize baseado em performance real",
  "metadata": {
    "generated_at": "2025-01-XX...",
    "variations_count": 3,
    "style_engine_version": "1.0.0"
  }
}
```

---

## 🔍 Análise das Variações

### Versão 1: Educacional
- **Estilo:** Layout limpo, informativo
- **Tom:** Friendly, acessível
- **Foco:** Clareza e educação
- **Ideal para:** Público que precisa entender o produto

### Versão 2: Minimalista
- **Estilo:** Elegante, espaçado
- **Tom:** Friendly, sofisticado
- **Foco:** Elegância e simplicidade
- **Ideal para:** Público que valoriza qualidade

### Versão 3: Storytelling
- **Estilo:** Narrativo, dinâmico
- **Tom:** Friendly, envolvente
- **Foco:** História e conexão
- **Ideal para:** Público que responde a narrativas

---

## 📊 Como Usar os Resultados

### 1. **Teste A/B**
- Crie 3 campanhas no Meta Ads
- Use cada versão em uma campanha
- Monitore por 7-14 dias

### 2. **Métricas a Observar**
- **CTR:** Qual versão tem maior taxa de clique?
- **Conversão:** Qual versão converte mais?
- **Custo por Conversão:** Qual é mais eficiente?

### 3. **Otimização**
- Escale a versão com melhor performance
- Use elementos da versão vencedora em novos criativos
- Teste novas variações baseadas nos insights

---

## 🎨 Geração de Imagens

Use o `image_prompt` de cada versão com o sistema de geração de imagens:

```typescript
// Exemplo: Gerar imagem para versão 1
const imageResponse = await fetch('/api/creative/generate-image', {
  method: 'POST',
  body: JSON.stringify({
    mainPrompt: creativeVersions[0].image_prompt,
    imageRatio: '9:16',
    variations: 1,
    qualityTier: 'production',
    imageModel: 'pro'
  })
})
```

---

## 💡 Dicas de Uso

1. **Sempre teste múltiplas variações**
   - Não assuma qual vai performar melhor
   - Dados > Intuição

2. **Use o contexto completo**
   - Quanto mais informações, melhor o resultado
   - Inclua pain_point e target_audience sempre que possível

3. **Adapte por plataforma**
   - Meta Ads: 9:16 funciona bem
   - Google Ads: 16:9 é melhor
   - TikTok: 9:16 é obrigatório

4. **Monitore e itere**
   - Performance muda com o tempo
   - Teste novas variações regularmente

---

## 🚀 Próximos Passos

1. Integrar com sistema de geração de imagens
2. Adicionar métricas de performance automáticas
3. Criar dashboard de comparação A/B
4. Implementar aprendizado contínuo baseado em resultados

---

**Exemplo criado em:** Janeiro 2025  
**Versão do Engine:** 1.0.0




