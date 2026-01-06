# 📋 REGRAS PARA CRIAR PROMPTS - V2.2

## 🎯 REGRAS OBRIGATÓRIAS

### 1. **Prompt Principal (mainPrompt) é a FONTE DA VERDADE**

✅ **SEMPRE:**
- Use o campo `mainPrompt` como base principal
- Seja claro e direto sobre o que você quer na imagem
- Descreva elementos visuais específicos (cores, objetos, pessoas, ambiente)

❌ **NUNCA:**
- Não invente marcas, selos oficiais, parcerias ou garantias
- Não use afirmações absolutas ("garantido", "100% certo", "o melhor", "oficial")
- Não use urgência falsa ("últimas vagas", "só hoje", "oferta relâmpago")
- Não faça promessas enganosas

---

### 2. **Estrutura Recomendada do Prompt**

```
[O QUE CRIAR] + [ELEMENTOS VISUAIS] + [ESTILO] + [COMPOSIÇÃO] + [NEGATIVOS]
```

**Exemplo:**
```
Crie uma imagem publicitária de alta conversão para anúncio digital promovendo um Walmart Gift Card. 
Elementos visuais obrigatórios: Um Walmart Gift Card claramente visível (design azul com logo Walmart), 
fundo com cores vibrantes (azul e amarelo), pessoa jovem adulta (18–35 anos) com expressão positiva e confiante, 
elementos gráficos de destaque (setas, brilho, luz, destaque visual no cartão). 
Estilo publicitário moderno, semelhante a anúncios de promoções e ofertas. 
Layout limpo e legível, foco no produto (gift card), alta nitidez e contraste. 
Não usar textos longos, não poluir visualmente, não inserir marcas além do Walmart.
```

---

### 3. **Elementos Visuais Obrigatórios**

✅ **SEMPRE inclua:**
- **Produto/Serviço:** Descrição clara do que deve aparecer
- **Cores:** Especifique paleta de cores (ex: "azul e amarelo vibrantes")
- **Pessoas (se aplicável):** Faixa etária, expressão, pose
- **Ambiente:** Fundo, cenário, contexto
- **Elementos gráficos:** Setas, brilhos, destaques visuais (se necessário)

**Exemplo:**
```
Elementos visuais obrigatórios: 
- Produto X claramente visível (cor Y, estilo Z)
- Fundo com cores [especificar]
- Pessoa [faixa etária] com expressão [tipo]
- Elementos gráficos de destaque [especificar]
```

---

### 4. **Estilo e Composição**

✅ **SEMPRE especifique:**
- **Estilo:** Publicitário, profissional, casual, editorial, etc.
- **Composição:** Layout (centralizado, lateral, grid), foco
- **Qualidade:** Alta nitidez, contraste, resolução
- **Proporção:** O sistema já aplica automaticamente, mas você pode mencionar no prompt

**Exemplo:**
```
Estilo publicitário moderno, semelhante a anúncios de promoções e ofertas. 
Layout limpo e legível, foco no produto, alta nitidez e contraste.
```

---

### 5. **Negativos (O que NÃO fazer)**

✅ **SEMPRE inclua no prompt:**
- "Não usar textos longos" (se `includeTextInImage=false`)
- "Não poluir visualmente"
- "Não inserir marcas além de [marca principal]"
- "Não adicionar preços ou promessas irreais"

**Exemplo:**
```
NÃO FAZER:
- Não usar textos longos
- Não poluir visualmente
- Não inserir marcas além do Walmart
- Não adicionar preços ou promessas irreais
```

---

### 6. **Texto na Imagem**

### Opção A: Com Texto na Imagem (`includeTextInImage=true`)

✅ **Se você quer texto na imagem:**
- Especifique no prompt: "Headline: [texto]", "CTA: [texto]"
- Mencione: "Tipografia forte, fácil de ler em mobile"
- Configure `includeTextInImage=true` no sistema

**Exemplo:**
```
TEXTO NA IMAGEM:
- Headline curta: "Walmart Gift Card"
- CTA visível: "Get Yours Now"
- Tipografia forte, fácil de ler em mobile
```

### Opção B: Sem Texto na Imagem (`includeTextInImage=false`) - **RECOMENDADO**

✅ **Se você NÃO quer texto na imagem:**
- Mencione: "Negative space reservado na parte inferior para overlay de texto/CTA"
- Mencione: "Não usar textos na imagem"
- Configure `includeTextInImage=false` no sistema
- Adicione texto depois via overlay no frontend

**Exemplo:**
```
Negative space reservado na parte inferior para overlay de texto/CTA. 
Não usar textos na imagem, não poluir visualmente.
```

---

## 🎨 MELHORES PRÁTICAS

### 1. **Seja Específico, Não Vago**

❌ **Ruim:**
```
Crie uma imagem bonita de um produto
```

✅ **Bom:**
```
Crie uma imagem publicitária de alta conversão para anúncio digital promovendo um Walmart Gift Card. 
Elementos visuais obrigatórios: Um Walmart Gift Card claramente visível (design azul com logo Walmart), 
fundo com cores vibrantes (azul e amarelo), pessoa jovem adulta (18–35 anos) com expressão positiva e confiante.
```

---

### 2. **Use Direção Fotográfica**

✅ **Inclua detalhes técnicos:**
- Lente, ambiente, iluminação (o sistema adiciona automaticamente, mas você pode especificar)
- Profundidade de campo, composição
- Estilo visual (lifestyle, studio, editorial, UGC)

**Exemplo:**
```
Estilo lifestyle, ambiente natural, iluminação suave, composição centralizada, 
foco no produto em destaque.
```

---

### 3. **Mencione Aspect Ratio no Prompt (Opcional)**

✅ **Você pode mencionar, mas o sistema já aplica automaticamente:**
- "Proporção 1:1 (quadrado), otimizado para feed"
- "Proporção 9:16 (vertical), otimizado para stories/reels"
- "Proporção 16:9 (horizontal), otimizado para display ads"

---

### 4. **Use Tom e Objetivo**

✅ **Configure no sistema:**
- **Tom:** `professional`, `casual`, `friendly`, `urgent`, `inspiring`
- **Objetivo:** `cliques`, `whatsapp`, `vendas`, `leads`, `visualizacoes`

**Exemplo no prompt:**
```
Tom: Urgência leve, praticidade, benefício imediato.
Objetivo: Gerar cliques e conversão.
```

---

## ⚠️ REGRAS DE COMPLIANCE

### 1. **Conteúdo Proibido**

❌ **NUNCA inclua no prompt:**
- Ódio, violência, sexual explícito
- Drogas, armas
- Autoagressão, fraude, suicídio, homicídio

---

### 2. **Afirmações Absolutas**

❌ **NUNCA use (a menos que explicitamente autorizado):**
- "Garantido", "100% certo", "o melhor"
- "Oficial", "único", "exclusivo"
- "Número 1", "líder"

✅ **Use alternativas:**
- "Uma das melhores opções"
- "Recomendado por especialistas"
- "Escolha popular"

---

### 3. **Urgência Falsa**

❌ **NUNCA use (a menos que explicitamente autorizado):**
- "Últimas vagas", "só hoje"
- "Oferta relâmpago", "acabe de vez"
- "Não perca", "última chance"

✅ **Use urgência genuína:**
- "Oferta por tempo limitado" (se verdadeiro)
- "Promoção válida até [data]"
- "Quantidade limitada" (se verdadeiro)

---

## 📝 TEMPLATE DE PROMPT COMPLETO

```
Crie uma imagem publicitária de alta conversão para anúncio digital promovendo [PRODUTO/SERVIÇO].

OBJETIVO: [cliques, vendas, leads, etc.]

CONCEITO DO CRIATIVO:
- Tema: [tema principal]
- Mensagem principal: [mensagem]
- Sensação: [urgência leve, praticidade, benefício imediato, etc.]

ELEMENTOS VISUAIS OBRIGATÓRIOS:
- [Produto/Serviço] claramente visível ([descrição detalhada])
- Fundo com cores [especificar]
- Pessoa [faixa etária] com expressão [tipo]
- Elementos gráficos de destaque [especificar]

ESTILO:
- [Publicitário, profissional, casual, etc.]
- [Alto impacto visual, moderno, etc.]

COMPOSIÇÃO:
- Layout limpo e legível
- Foco no produto
- Alta nitidez e contraste
- Proporção [1:1, 4:5, 9:16, 16:9] (opcional - sistema aplica automaticamente)

TEXTO NA IMAGEM (se includeTextInImage=true):
- Headline: "[texto]"
- CTA: "[texto]"
- Tipografia forte, fácil de ler em mobile

OU

NEGATIVE SPACE (se includeTextInImage=false):
- Negative space reservado na parte inferior para overlay de texto/CTA
- Não usar textos na imagem

NÃO FAZER:
- Não usar textos longos
- Não poluir visualmente
- Não inserir marcas além de [marca principal]
- Não adicionar preços ou promessas irreais
```

---

## 🚀 EXEMPLO PRÁTICO COMPLETO

### Prompt Completo (Walmart Gift Card)

```
Crie uma imagem publicitária de alta conversão para anúncio digital promovendo um Walmart Gift Card. 

OBJETIVO: Gerar cliques e conversão, ideal para anúncios em redes sociais (Instagram e Facebook).

CONCEITO DO CRIATIVO:
- Tema: Liberdade de escolha, presente fácil e compras inteligentes
- Mensagem principal: O Walmart Gift Card como solução prática para comprar o que quiser
- Sensação: Urgência leve, praticidade, benefício imediato

ELEMENTOS VISUAIS OBRIGATÓRIOS:
- Um Walmart Gift Card claramente visível (design azul com logo Walmart)
- Fundo com cores vibrantes, preferencialmente azul e amarelo
- Pessoa jovem adulta (18–35 anos), expressão positiva e confiante
- Elementos gráficos de destaque (setas, brilho, luz, destaque visual no cartão)

ESTILO:
- Publicitário moderno, semelhante a anúncios de promoções e ofertas
- Profissional, alto impacto visual

COMPOSIÇÃO:
- Layout limpo e legível
- Foco no produto (gift card)
- Alta nitidez e contraste
- Proporção 1:1 (quadrado), otimizado para feed

NEGATIVE SPACE:
- Negative space reservado na parte inferior para overlay de texto/CTA
- Não usar textos na imagem

NÃO FAZER:
- Não usar textos longos
- Não poluir visualmente
- Não inserir marcas além do Walmart
- Não adicionar preços ou promessas irreais
```

---

## ✅ CHECKLIST ANTES DE ENVIAR

Antes de criar um prompt, verifique:

- [ ] Prompt principal (`mainPrompt`) está claro e específico
- [ ] Elementos visuais obrigatórios estão descritos
- [ ] Estilo e composição estão especificados
- [ ] Negativos estão incluídos
- [ ] Não há conteúdo proibido
- [ ] Não há afirmações absolutas não autorizadas
- [ ] Não há urgência falsa
- [ ] Texto na imagem está definido (sim ou não)
- [ ] Aspect ratio está configurado no sistema (não precisa no prompt, mas pode mencionar)

---

## 🔧 CONFIGURAÇÕES DO SISTEMA

Ao usar o prompt, configure também:

1. **Qualidade:** `draft` (rápido) ou `production` (alta qualidade)
2. **Incluir texto na imagem:** `true` ou `false` (recomendado: `false`)
3. **Proporção:** `1:1`, `4:5`, `9:16`, `16:9`
4. **Variações:** `2` ou `4`
5. **Tom:** `professional`, `casual`, `friendly`, `urgent`, `inspiring`
6. **Objetivo:** `cliques`, `whatsapp`, `vendas`, `leads`, `visualizacoes`
7. **Plataforma:** `instagram`, `facebook`, `google`, etc.

---

## 📚 RECURSOS ADICIONAIS

- **Exemplo completo:** `docs/EXEMPLO-PROMPT-WALMART-GIFT-CARD.md`
- **Como rodar e testar:** `docs/COMO-RODAR-E-TESTAR-V2.2.md`
- **Overview do sistema:** `docs/OVERVIEW-GERACAO-IMAGENS.md`

---

**Pronto para criar prompts profissionais!** 🚀





