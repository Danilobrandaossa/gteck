# 📝 Guia Completo: Como Gerar Prompts para Criativos de Alta Performance

Este guia explica como usar o sistema de geração de criativos para obter os melhores resultados.

---

## 🎯 Conceito Fundamental: Prompt Principal (Fonte da Verdade)

O **Prompt Principal** é a base de tudo. Ele nunca é sobrescrito e serve como a "fonte da verdade" para a intenção do usuário.

### ✅ O que fazer:
- **Seja específico e descritivo**: Quanto mais detalhes, melhor
- **Mencione elementos visuais**: cores, estilo, composição, iluminação
- **Descreva o produto/serviço**: o que é, como aparece, contexto de uso
- **Inclua o objetivo**: o que você quer comunicar

### ❌ O que evitar:
- Prompts muito genéricos ("um produto")
- Informações contraditórias
- Muito texto sem estrutura

---

## 📊 Campos Estruturados: Enriquecem o Prompt Principal

Os campos estruturados **complementam** o Prompt Principal, não o substituem. Eles ajudam a IA a entender melhor o contexto.

### 1. **Objetivo do Anúncio**
- `cliques`: Foco em CTR e engajamento
- `whatsapp`: Foco em conversão para WhatsApp
- `vendas`: Foco em venda direta
- `leads`: Foco em captura de leads
- `visualizacoes`: Foco em alcance e awareness

**Dica**: O objetivo influencia o estilo das imagens comerciais (Gemini).

### 2. **Proporção da Imagem**
- `1:1` (Quadrado): Instagram feed, LinkedIn
- `4:5` (Vertical): Instagram feed otimizado
- `9:16` (Story/Reel): Instagram Stories, Facebook Stories
- `16:9` (Horizontal): Google Ads, LinkedIn carousel

**Dica**: Escolha baseado na plataforma onde o anúncio será veiculado.

### 3. **Idioma**
- `pt-BR`: Português (Brasil)
- `en-US`: English (US)
- `es-ES`: Español (España)

**Dica**: O idioma influencia a copy gerada, não as imagens.

### 4. **Quantidade de Variações**
- Máximo: **4 variações** (2 conceituais + 2 comerciais)
- Recomendado: **2 variações** (1 conceitual + 1 comercial) para testes iniciais

**Dica**: Use 4 variações para testes A/B mais robustos.

---

## 🎨 Como Funcionam as Variações

### Variações Conceituais (DALL-E 3)
Cada variação tem um estilo ligeiramente diferente:

**Variação 1:**
- Estilo: conceitual, limpo, moderno, profissional
- Composição: produto em destaque, perspectiva central
- Iluminação: suave e difusa

**Variação 2:**
- Estilo: minimalista, elegante, sofisticado, premium
- Composição: produto em destaque, perspectiva dinâmica
- Iluminação: lateral suave

### Variações Comerciais (Gemini)
Cada variação tem um foco diferente:

**Variação 1:**
- Estilo: agressivo, comercial, alto contraste
- Composição: produto + elementos de CTA visual
- Foco: conversão imediata

**Variação 2:**
- Estilo: impactante, direto, cores saturadas
- Composição: produto centralizado + elementos de urgência
- Foco: ação imediata

---

## 📝 Exemplos Práticos de Prompts

### Exemplo 1: Produto Físico (E-commerce)

**Prompt Principal:**
```
Uma mulher sorrindo segurando um cartão presente Walmart, fundo azul e amarelo vibrante, estilo publicitário moderno, iluminação natural, composição centralizada, cores da marca Walmart (azul #004C9F e amarelo #FFC72C)
```

**Campos Estruturados:**
- Objetivo: `vendas`
- Proporção: `9:16` (Story)
- Idioma: `pt-BR`
- Variações: `2`

**Resultado Esperado:**
- 2 imagens conceituais: mulher com cartão presente, estilos diferentes
- 2 imagens comerciais: foco em CTA e conversão, estilos diferentes

---

### Exemplo 2: Serviço Digital (Curso Online)

**Prompt Principal:**
```
Um laptop aberto mostrando uma tela de curso online de marketing digital, ambiente moderno e profissional, iluminação suave, elementos visuais de aprendizado (gráficos, ícones), cores vibrantes mas profissionais
```

**Campos Estruturados:**
- Objetivo: `leads`
- Proporção: `4:5` (Instagram feed)
- Idioma: `pt-BR`
- Variações: `2`

**Resultado Esperado:**
- 2 imagens conceituais: foco em educação e profissionalismo
- 2 imagens comerciais: foco em captura de leads e CTA

---

### Exemplo 3: Produto Alimentício

**Prompt Principal:**
```
Prato de comida vegana colorida e apetitosa, ingredientes frescos em destaque, iluminação natural, estilo food photography profissional, fundo neutro, composição que evoca saúde e bem-estar
```

**Campos Estruturados:**
- Objetivo: `cliques`
- Proporção: `1:1` (Instagram feed)
- Idioma: `pt-BR`
- Variações: `4`

**Resultado Esperado:**
- 2 imagens conceituais: foco em estética e qualidade
- 2 imagens comerciais: foco em apetite e ação

---

## 🎯 Melhores Práticas

### 1. **Seja Específico no Prompt Principal**
❌ Ruim: "Um produto"
✅ Bom: "Um smartphone moderno em destaque, fundo minimalista branco, iluminação suave lateral, estilo Apple, composição centralizada"

### 2. **Use Referências Visuais**
- Faça upload de imagens de referência
- Use o botão "Analisar Imagem com IA" para extrair características
- A IA usará essas características nos prompts

### 3. **Combine Prompt Principal + Campos Estruturados**
- Prompt Principal: descreve a imagem desejada
- Campos Estruturados: definem contexto e objetivo
- Resultado: prompts mais precisos e eficazes

### 4. **Teste Diferentes Variações**
- Comece com 2 variações (1 conceitual + 1 comercial)
- Se os resultados forem bons, teste 4 variações
- Compare performance entre variações

### 5. **Ajuste Baseado na Plataforma**
- Instagram: use proporções 4:5 ou 9:16
- Facebook: use 9:16 ou 1:1
- Google Ads: use 16:9
- LinkedIn: use 16:9 ou 1:1

---

## 🔄 Fluxo de Geração

1. **Preencha o Prompt Principal** (obrigatório se não houver nome do produto)
2. **Preencha os Campos Estruturados** (opcional, mas recomendado)
3. **Adicione Referências Visuais** (opcional, mas muito útil)
4. **Marque "Gerar 4 imagens"** (se quiser todas as variações)
5. **Clique em "Gerar Criativo"**
6. **Aguarde a geração** (pode levar alguns minutos para 4 imagens)
7. **Analise os resultados** e escolha as melhores variações

---

## 💡 Dicas Avançadas

### Para Imagens Conceituais (DALL-E):
- Foque em estética e storytelling
- Mencione iluminação, cores, composição
- Use termos como "profissional", "premium", "elegante"

### Para Imagens Comerciais (Gemini):
- Foque em conversão e ação
- Mencione elementos de CTA visual
- Use termos como "impactante", "chamativo", "urgente"

### Para Melhor Qualidade:
- Use referências visuais sempre que possível
- Seja específico sobre cores e estilo
- Mencione a plataforma de destino
- Defina o objetivo claramente

---

## ⚠️ Limitações e Considerações

1. **Tempo de Geração**: 4 imagens podem levar 2-5 minutos
2. **Custos**: Cada imagem DALL-E custa ~$0.08, Gemini pode variar
3. **Qualidade**: Depende da qualidade do Prompt Principal
4. **Variações**: As variações são geradas automaticamente, mas podem ser similares se o prompt for muito específico

---

## 📚 Recursos Adicionais

- [Documentação do Sistema de Geração Dupla](./SISTEMA-GERACAO-DUPLA.md)
- [Verificação da API Gemini](./VERIFICACAO-GEMINI-API.md)
- [Prompt para ChatGPT Gerar Briefings](./PROMPT-CHATGPT-SIMPLES.txt)

---

## 🎓 Exemplo Completo de Uso

### Cenário: Anúncio de Curso de Marketing Digital no Instagram

**1. Prompt Principal:**
```
Um profissional jovem usando laptop em ambiente moderno, tela mostrando gráficos de crescimento, elementos visuais de sucesso (gráficos, setas para cima), iluminação natural, cores vibrantes (azul e verde), estilo inspirador e motivador
```

**2. Campos Estruturados:**
- Nome do Produto: "Curso de Marketing Digital Completo"
- Descrição: "Aprenda marketing digital do zero ao avançado"
- Público-Alvo: "Empreendedores iniciantes de 25-40 anos"
- Benefícios: ["Certificado válido", "Acesso vitalício", "Suporte exclusivo"]
- CTA: "Comece Agora"
- Tom: `inspiring`
- Plataforma: `instagram`
- Objetivo: `leads`
- Proporção: `4:5`
- Idioma: `pt-BR`
- Variações: `4`

**3. Referências Visuais:**
- Upload de imagem de estilo desejado
- Analisar com IA para extrair características

**4. Resultado:**
- Copy otimizada para leads
- 2 imagens conceituais (DALL-E): foco em inspiração e sucesso
- 2 imagens comerciais (Gemini): foco em CTA e conversão
- Explicação das diferenças entre os criativos

---

## ✅ Checklist de Qualidade

Antes de gerar, verifique:

- [ ] Prompt Principal está claro e específico?
- [ ] Campos estruturados estão preenchidos?
- [ ] Proporção corresponde à plataforma?
- [ ] Objetivo está alinhado com a estratégia?
- [ ] Referências visuais foram adicionadas (se disponíveis)?
- [ ] Quantidade de variações está adequada?

---

**Dúvidas?** Consulte a documentação ou teste diferentes abordagens para encontrar o que funciona melhor para seu caso!






