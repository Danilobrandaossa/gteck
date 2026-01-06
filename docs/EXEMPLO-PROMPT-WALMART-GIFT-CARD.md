# 🎯 EXEMPLO: Prompt Walmart Gift Card

## Prompt Original (Detalhado)

```
Crie uma imagem publicitária de alta conversão para anúncio digital promovendo um Walmart Gift Card. OBJETIVO: Gerar um criativo chamativo, moderno e persuasivo, focado em cliques e conversão, ideal para anúncios em redes sociais (Instagram e Facebook). CONCEITO DO CRIATIVO: - Tema: Liberdade de escolha, presente fácil e compras inteligentes - Mensagem principal: O Walmart Gift Card como solução prática para comprar o que quiser - Sensação: Urgência leve, praticidade, benefício imediato ELEMENTOS VISUAIS OBRIGATÓRIOS: - Um Walmart Gift Card claramente visível (design azul com logo Walmart) - Fundo com cores vibrantes, preferencialmente azul e amarelo - Pessoa jovem adulta (18–35 anos), expressão positiva e confiante - Elementos gráficos de destaque (setas, brilho, luz, destaque visual no cartão) - Estilo publicitário moderno, semelhante a anúncios de promoções e ofertas TEXTO NA IMAGEM (EM INGLÊS OU PORTUGUÊS, CURTO E IMPACTANTE): - Headline curta, como: "Walmart Gift Card" ou "Get Your Walmart Gift Card" - CTA visível: "Get Yours Now" ou "Garanta o Seu" REGRAS DE COMPOSIÇÃO: - Layout limpo e legível - Foco no produto (gift card) - Tipografia forte, fácil de ler em mobile - Alta nitidez e contraste - Proporção 1:1 (quadrado), otimizado para feed ESTILO: - Publicitário - Profissional - Alto impacto visual - Inspirado em anúncios de gift cards, promoções e ofertas digitais NÃO FAZER: - Não usar textos longos - Não poluir visualmente - Não inserir marcas além do Walmart - Não adicionar preços ou promessas irreais RESULTADO ESPERADO: Uma imagem pronta para anúncio, clara, persuasiva e visualmente forte, destacando o Walmart Gift Card como a melhor opção de presente ou compra.
```

---

## ✅ Adaptação para V2.2

### Opção 1: Com Texto na Imagem (includeTextInImage=true)

**Prompt Principal (mainPrompt):**
```
Crie uma imagem publicitária de alta conversão para anúncio digital promovendo um Walmart Gift Card. Tema: Liberdade de escolha, presente fácil e compras inteligentes. Mensagem principal: O Walmart Gift Card como solução prática para comprar o que quiser. Sensação: Urgência leve, praticidade, benefício imediato. Elementos visuais obrigatórios: Um Walmart Gift Card claramente visível (design azul com logo Walmart), fundo com cores vibrantes (azul e amarelo), pessoa jovem adulta (18–35 anos) com expressão positiva e confiante, elementos gráficos de destaque (setas, brilho, luz, destaque visual no cartão). Estilo publicitário moderno, semelhante a anúncios de promoções e ofertas. Layout limpo e legível, foco no produto (gift card), tipografia forte e fácil de ler em mobile, alta nitidez e contraste. Headline curta: "Walmart Gift Card" ou "Get Your Walmart Gift Card". CTA visível: "Get Yours Now" ou "Garanta o Seu". Não usar textos longos, não poluir visualmente, não inserir marcas além do Walmart, não adicionar preços ou promessas irreais.
```

**Configurações:**
- `qualityTier`: `"production"` (para melhor qualidade)
- `includeTextInImage`: `true` (texto será renderizado na imagem)
- `imageRatio`: `"1:1"` (quadrado)
- `variations`: `2` ou `4`
- `tone`: `"urgent"` (urgência leve)
- `objective`: `"cliques"` ou `"vendas"`

---

### Opção 2: Sem Texto na Imagem (includeTextInImage=false) - RECOMENDADO

**Prompt Principal (mainPrompt):**
```
Crie uma imagem publicitária de alta conversão para anúncio digital promovendo um Walmart Gift Card. Tema: Liberdade de escolha, presente fácil e compras inteligentes. Mensagem principal: O Walmart Gift Card como solução prática para comprar o que quiser. Sensação: Urgência leve, praticidade, benefício imediato. Elementos visuais obrigatórios: Um Walmart Gift Card claramente visível (design azul com logo Walmart), fundo com cores vibrantes (azul e amarelo), pessoa jovem adulta (18–35 anos) com expressão positiva e confiante, elementos gráficos de destaque (setas, brilho, luz, destaque visual no cartão). Estilo publicitário moderno, semelhante a anúncios de promoções e ofertas. Layout limpo e legível, foco no produto (gift card), alta nitidez e contraste. Negative space reservado na parte inferior para overlay de texto/CTA. Não usar textos na imagem, não poluir visualmente, não inserir marcas além do Walmart, não adicionar preços ou promessas irreais.
```

**Configurações:**
- `qualityTier`: `"production"`
- `includeTextInImage`: `false` (texto será adicionado via overlay no frontend)
- `imageRatio`: `"1:1"` ou `"4:5"` (melhor para Instagram)
- `variations`: `4` (para ter mais opções)
- `tone`: `"urgent"`
- `objective`: `"cliques"`

**Texto para Overlay (adicionar no frontend):**
- **Headline:** "Walmart Gift Card"
- **CTA:** "Get Yours Now" ou "Garanta o Seu"

---

## 🚀 Como Usar

### Via Interface Web

1. Acesse: `http://localhost:4000/criativos`
2. Cole o **Prompt Principal** (Opção 1 ou 2) no campo "Prompt Principal"
3. Configure:
   - **Qualidade:** Production (Alta Qualidade)
   - **Incluir texto na imagem:** 
     - ✅ Marque se usar Opção 1
     - ❌ Desmarque se usar Opção 2 (recomendado)
   - **Configurações Avançadas:**
     - Proporção: **1:1** (quadrado)
     - Variações: **4**
4. Clique em **"Gerar Imagens"**

### Via API (cURL/PowerShell)

**Opção 1 (com texto na imagem):**
```powershell
$body = @{
    mainPrompt = "Crie uma imagem publicitária de alta conversão para anúncio digital promovendo um Walmart Gift Card. Tema: Liberdade de escolha, presente fácil e compras inteligentes. Mensagem principal: O Walmart Gift Card como solução prática para comprar o que quiser. Sensação: Urgência leve, praticidade, benefício imediato. Elementos visuais obrigatórios: Um Walmart Gift Card claramente visível (design azul com logo Walmart), fundo com cores vibrantes (azul e amarelo), pessoa jovem adulta (18–35 anos) com expressão positiva e confiante, elementos gráficos de destaque (setas, brilho, luz, destaque visual no cartão). Estilo publicitário moderno, semelhante a anúncios de promoções e ofertas. Layout limpo e legível, foco no produto (gift card), tipografia forte e fácil de ler em mobile, alta nitidez e contraste. Headline curta: 'Walmart Gift Card'. CTA visível: 'Get Yours Now'. Não usar textos longos, não poluir visualmente, não inserir marcas além do Walmart, não adicionar preços ou promessas irreais."
    generateImage = $true
    qualityTier = "production"
    includeTextInImage = $true
    imageRatio = "1:1"
    variations = 4
    tone = "urgent"
    objective = "cliques"
    platform = "instagram"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/creative/generate" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Opção 2 (sem texto na imagem - RECOMENDADO):**
```powershell
$body = @{
    mainPrompt = "Crie uma imagem publicitária de alta conversão para anúncio digital promovendo um Walmart Gift Card. Tema: Liberdade de escolha, presente fácil e compras inteligentes. Mensagem principal: O Walmart Gift Card como solução prática para comprar o que quiser. Sensação: Urgência leve, praticidade, benefício imediato. Elementos visuais obrigatórios: Um Walmart Gift Card claramente visível (design azul com logo Walmart), fundo com cores vibrantes (azul e amarelo), pessoa jovem adulta (18–35 anos) com expressão positiva e confiante, elementos gráficos de destaque (setas, brilho, luz, destaque visual no cartão). Estilo publicitário moderno, semelhante a anúncios de promoções e ofertas. Layout limpo e legível, foco no produto (gift card), alta nitidez e contraste. Negative space reservado na parte inferior para overlay de texto/CTA. Não usar textos na imagem, não poluir visualmente, não inserir marcas além do Walmart, não adicionar preços ou promessas irreais."
    generateImage = $true
    qualityTier = "production"
    includeTextInImage = $false
    imageRatio = "1:1"
    variations = 4
    tone = "urgent"
    objective = "cliques"
    platform = "instagram"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/creative/generate" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

## 📝 Recomendações

### ✅ RECOMENDADO: Opção 2 (sem texto na imagem)

**Vantagens:**
- ✅ Texto renderizado no frontend (mais legível e editável)
- ✅ Imagem pode ser reutilizada com diferentes textos
- ✅ Melhor controle de tipografia e contraste
- ✅ A/B testing mais fácil (mesma imagem, textos diferentes)

**Como adicionar texto depois:**
- Use o serviço `image-overlay-service.ts` no frontend
- Ou adicione manualmente usando HTML/CSS overlay

### ⚠️ Opção 1 (com texto na imagem)

**Quando usar:**
- Quando o texto é parte essencial da composição visual
- Quando você precisa de um resultado final imediato
- Quando não há necessidade de reutilizar a imagem

**Desvantagens:**
- Texto pode ficar ilegível ou com erros
- Menos flexível para A/B testing
- Pode precisar regenerar para mudar o texto

---

## 🎨 Resultado Esperado

Com o prompt adaptado, você deve obter:

1. **4 imagens** (2 conceituais + 2 comerciais) se `variations=4`
2. **Best Image** destacada (se `qualityTier=production` e scoring ativo)
3. **Metadata completo** (timing, custo, modelo usado)
4. **Imagens prontas** para uso em anúncios

**Características das imagens:**
- Walmart Gift Card visível
- Cores vibrantes (azul e amarelo)
- Pessoa jovem com expressão positiva
- Elementos gráficos de destaque
- Estilo publicitário moderno
- Alta nitidez e contraste

---

## 🔧 Ajustes Finais

Se as imagens não ficarem como esperado, você pode:

1. **Refinar o prompt:**
   - Adicionar mais detalhes sobre a composição
   - Especificar ângulo da câmera
   - Detalhar iluminação

2. **Ajustar configurações:**
   - Tentar `qualityTier="draft"` primeiro (mais rápido)
   - Depois testar `qualityTier="production"` (melhor qualidade)

3. **Usar referências visuais:**
   - Adicionar imagens de referência no campo "Referências Visuais"
   - Especificar role: `style`, `produto`, ou `inspiração`

---

**Pronto para usar!** 🚀





