# 🎬 Prompt para Vídeo: Walmart Gift Card

## Prompt Principal (mainPrompt) - RECOMENDADO

```
Crie um vídeo publicitário de 6 segundos de alta conversão promovendo um Walmart Gift Card. Tema: Liberdade de escolha, presente fácil e compras inteligentes. Mensagem principal: O Walmart Gift Card como solução prática para comprar o que quiser. Sensação: Urgência leve, praticidade, benefício imediato. Elementos visuais obrigatórios: Um Walmart Gift Card claramente visível (design azul com logo Walmart) em movimento suave, fundo com cores vibrantes (azul e amarelo) com transições suaves, pessoa jovem adulta (18–35 anos) com expressão positiva e confiante, elementos gráficos de destaque (setas, brilho, luz, destaque visual no cartão) com animação sutil. Estilo publicitário moderno, semelhante a anúncios de promoções e ofertas digitais. Movimento: Cartão aparece com zoom suave, pessoa sorri e segura o cartão, elementos gráficos brilham levemente. Layout limpo e legível, foco no produto (gift card), alta nitidez e contraste. Negative space reservado na parte inferior para overlay de texto/CTA. Não usar textos na imagem, não poluir visualmente, não inserir marcas além do Walmart, não adicionar preços ou promessas irreais.
```

---

## Configurações Recomendadas

### Para Instagram/Facebook Stories (Vertical)
- **Tipo:** Vídeo
- **Modelo:** Veo 3.1 (Experimental)
- **Duração:** 6 segundos
- **Proporção:** 9:16 (Vertical)
- **Variações:** 1

### Para Feed/Reels (Quadrado)
- **Tipo:** Vídeo
- **Modelo:** Veo 3.1 (Experimental)
- **Duração:** 6 segundos
- **Proporção:** 16:9 (Horizontal) ou 9:16 (Vertical)
- **Variações:** 1

---

## Versões Alternativas do Prompt

### Versão 1: Foco em Movimento e Animação

```
Crie um vídeo publicitário de 6 segundos promovendo um Walmart Gift Card. Abertura: Cartão aparece com zoom suave do centro da tela. Meio: Pessoa jovem adulta (18–35 anos) sorri e segura o cartão com movimento natural, fundo azul e amarelo vibrante com transições suaves. Fechamento: Elementos gráficos (setas, brilho) aparecem com animação sutil destacando o cartão. Estilo publicitário moderno, alta nitidez, contraste forte. Negative space inferior para texto. Não usar textos na imagem, não poluir visualmente.
```

### Versão 2: Foco em Emoção e Benefício

```
Crie um vídeo publicitário de 6 segundos promovendo um Walmart Gift Card. Cena: Pessoa jovem adulta (18–35 anos) com expressão de alegria e confiança segurando um Walmart Gift Card (design azul com logo Walmart). Fundo com cores vibrantes (azul e amarelo) que mudam suavemente. O cartão brilha levemente e elementos gráficos (setas, luz) aparecem destacando o produto. Movimento suave e natural, estilo publicitário moderno, alta qualidade visual. Negative space reservado para texto. Não usar textos na imagem, não poluir visualmente, não inserir marcas além do Walmart.
```

### Versão 3: Foco em Produto e Praticidade

```
Crie um vídeo publicitário de 6 segundos promovendo um Walmart Gift Card. Foco principal: Walmart Gift Card (design azul com logo Walmart) em destaque com zoom suave e rotação leve. Contexto: Pessoa jovem adulta (18–35 anos) com expressão positiva aparece ao fundo segurando o cartão. Fundo com cores vibrantes (azul e amarelo) com transições suaves. Elementos gráficos (setas, brilho) animam sutilmente destacando o cartão. Estilo publicitário moderno, profissional, alta nitidez. Negative space inferior para overlay. Não usar textos na imagem, não poluir visualmente.
```

---

## Como Usar na Interface

1. Acesse: `http://localhost:4000/criativos`
2. Cole o **Prompt Principal** no campo "Descreva a imagem que você quer criar"
3. Selecione:
   - **Tipo de Criativo:** Vídeo
   - **Modelo de Vídeo:** Veo 3.1 (Experimental)
   - **Duração:** 6 segundos
   - **Proporção:** 9:16 (Vertical) ou 16:9 (Horizontal)
   - **Variações:** 1
4. Clique em **"Gerar Vídeo"**
5. Aguarde o processamento (pode levar alguns minutos)
6. Baixe o vídeo quando concluído

---

## Como Usar via API (cURL)

```bash
curl -X POST http://localhost:4000/api/creative/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "mainPrompt": "Crie um vídeo publicitário de 6 segundos de alta conversão promovendo um Walmart Gift Card. Tema: Liberdade de escolha, presente fácil e compras inteligentes. Mensagem principal: O Walmart Gift Card como solução prática para comprar o que quiser. Sensação: Urgência leve, praticidade, benefício imediato. Elementos visuais obrigatórios: Um Walmart Gift Card claramente visível (design azul com logo Walmart) em movimento suave, fundo com cores vibrantes (azul e amarelo) com transições suaves, pessoa jovem adulta (18–35 anos) com expressão positiva e confiante, elementos gráficos de destaque (setas, brilho, luz, destaque visual no cartão) com animação sutil. Estilo publicitário moderno, semelhante a anúncios de promoções e ofertas digitais. Movimento: Cartão aparece com zoom suave, pessoa sorri e segura o cartão, elementos gráficos brilham levemente. Layout limpo e legível, foco no produto (gift card), alta nitidez e contraste. Negative space reservado na parte inferior para overlay de texto/CTA. Não usar textos na imagem, não poluir visualmente, não inserir marcas além do Walmart, não adicionar preços ou promessas irreais.",
    "videoModel": "veo31",
    "durationSeconds": 6,
    "aspectRatio": "9:16",
    "variations": 1
  }'
```

---

## Texto para Overlay (Adicionar Depois)

Após gerar o vídeo, adicione texto/CTA no frontend:

### Headline (Superior):
- "Walmart Gift Card"
- "Get Your Walmart Gift Card"
- "Presenteie com Walmart Gift Card"

### CTA (Inferior):
- "Get Yours Now"
- "Garanta o Seu"
- "Compre Agora"

### Descrição (Opcional):
- "Liberdade de escolha"
- "Presente perfeito"
- "Compre o que quiser"

---

## Dicas para Melhor Resultado

### ✅ Faça:
- Use o prompt completo (quanto mais detalhes, melhor)
- Especifique movimento e animação
- Mencione "negative space" para área de texto
- Use "transições suaves" para movimento natural
- Especifique duração e proporção corretas

### ❌ Evite:
- Textos longos no prompt (o vídeo não renderiza texto bem)
- Muitos elementos em movimento simultâneos
- Promessas irreais ou urgência falsa
- Marcas além do Walmart
- Preços ou valores específicos

---

## Resultado Esperado

Com este prompt, você deve obter:

1. **Vídeo de 6 segundos** com movimento suave
2. **Walmart Gift Card** claramente visível
3. **Cores vibrantes** (azul e amarelo)
4. **Pessoa jovem** com expressão positiva
5. **Elementos gráficos** com animação sutil
6. **Alta qualidade visual** e nitidez
7. **Negative space** para adicionar texto depois

---

## Troubleshooting

### Vídeo muito estático?
- Adicione mais detalhes sobre movimento: "zoom suave", "rotação leve", "transições suaves"
- Mencione animação: "elementos gráficos brilham", "cartão aparece com movimento"

### Vídeo não mostra o cartão claramente?
- Reforce no prompt: "Walmart Gift Card claramente visível", "foco no produto"
- Adicione: "Cartão em primeiro plano", "zoom no cartão"

### Cores não estão vibrantes?
- Especifique: "cores vibrantes (azul e amarelo)", "alto contraste"
- Adicione: "fundo com cores intensas"

---

**Pronto para gerar seu vídeo!** 🚀







