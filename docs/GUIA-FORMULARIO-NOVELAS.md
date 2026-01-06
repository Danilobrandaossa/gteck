# 📺 Guia: Como Configurar o Formulário para Criar Imagens de Novelas

## 🎯 Objetivo
Gerar imagens publicitárias de alta performance para novelas mexicanas (doramas) usando o Modo Performance do sistema.

---

## 📋 Passo a Passo Completo

### **1. Acesse a Página de Criativos**
```
http://localhost:4000/criativos
```

### **2. Ative o Modo Performance**
- ✅ Marque a checkbox: **"🚀 Modo Performance (Otimizado para Conversão)"**
- Isso ativa os campos específicos para geração otimizada

### **3. Configure os Campos Obrigatórios**

#### **Idioma**
- Selecione: **"Español (ES)"** ou **"Português (BR)"**
- Para novelas mexicanas, recomenda-se: **Español (ES)**

#### **Nicho**
- Selecione: **"Dorama (Novelas Mexicanas)"**
- Este é o nicho específico que você adicionou ao sistema

#### **Plataforma**
- Selecione uma das opções:
  - **Meta Ads** (Instagram/Facebook) - Recomendado para Stories/Reels
  - **TikTok Ads**
  - **YouTube Ads**
  - **Google Ads**
  - **Display**

#### **Objetivo**
- Selecione: **"Retenção Visual"** (ideal para novelas)
- Outras opções: Conversão, CTR, Clareza da Oferta

### **4. Preencha os Campos Opcionais (Recomendados)**

#### **Nome do Produto**
```
Exemplo: La Heredera Contrataca
```
- Nome da novela ou série

#### **Oferta**
```
Exemplo: Episódios completos disponíveis
```
- O que você está oferecendo ao público

#### **Público-Alvo**
```
Exemplo: Fãs de novelas mexicanas, mulheres 25-55 anos
```
- Descrição do público que você quer atingir

#### **Dor do Cliente**
```
Exemplo: Querem assistir todos os episódios sem esperar
```
- Problema ou necessidade que o produto resolve

### **5. Campo Principal: Prompt da Imagem**

No campo **"Descreva a imagem que você quer criar"**, digite o prompt principal:

#### **Exemplo Completo:**
```
Fotografia cinematográfica profissional de novela mexicana "La Heredera Contrataca". 
Cena dramática com protagonista feminina em momento de vingança, expressão intensa e determinada. 
Estilo visual: Sequência visual narrativa, elementos dramáticos, composição dinâmica, 
cores expressivas vibrantes (vermelho, dourado, preto), foco em história emocional, 
estilo cinematográfico de novela mexicana, personagens em cena emocional, 
iluminação dramática cinematográfica.
```

#### **Prompt Simplificado (Alternativa):**
```
Novela mexicana La Heredera Contrataca, cena dramática com protagonista, 
estilo cinematográfico, cores vibrantes, emoção intensa
```

### **6. Configure o Formato da Imagem**

- **Ratio:** Selecione **"9:16"** (vertical - ideal para Stories/Reels)
- Outras opções: 1:1 (quadrado), 4:5 (vertical), 16:9 (horizontal)

### **7. Configurações Avançadas (Opcional)**

Clique em **"⚙️ Configurações Avançadas"** para ajustar:

- **Modelo:** Nano (rápido) ou Pro (qualidade premium)
- **Qualidade:** Draft ou Production
- **Variações:** 1 a 4 imagens
- **Incluir texto na imagem:** Sim/Não

### **8. Clique em "Gerar Criativos"**

O sistema irá:
1. Gerar múltiplas variações A/B de copy e prompts de imagem
2. Otimizar para o nicho "dorama"
3. Adaptar o tom para espanhol (se selecionado)
4. Criar prompts otimizados para conversão

### **9. Use o Prompt Gerado para Criar a Imagem**

Após a geração, você verá:
- **Headlines** (títulos)
- **Copy** (texto publicitário)
- **Prompt de Imagem** (otimizado)

Copie o **Prompt de Imagem** e use no campo principal para gerar a imagem final.

---

## 🎨 Exemplo Completo de Configuração

### **Configuração Recomendada para Novelas:**

```
✅ Modo Performance: ATIVADO

Idioma: Español (ES)
Nicho: Dorama (Novelas Mexicanas)
Plataforma: Meta Ads
Objetivo: Retenção Visual

Nome do Produto: La Heredera Contrataca
Oferta: Episódios completos disponíveis
Público-Alvo: Fãs de novelas mexicanas, mulheres 25-55 anos
Dor do Cliente: Querem assistir todos os episódios sem esperar

Prompt Principal:
"Fotografia cinematográfica profissional de novela mexicana La Heredera Contrataca. 
Cena dramática com protagonista feminina em momento de vingança, expressão intensa. 
Estilo visual: cores expressivas vibrantes (vermelho, dourado, preto), 
iluminação dramática cinematográfica, estilo de novela mexicana."

Ratio: 9:16
Variações: 2-3
Qualidade: Production
```

---

## 💡 Dicas Importantes

### **1. Prompt Principal**
- ✅ Use o campo "Descreva a imagem que você quer criar" como fonte principal
- ✅ Seja específico: mencione elementos visuais, cores, emoções
- ✅ Inclua referências ao estilo de novela mexicana

### **2. Modo Performance**
- ✅ Sempre ative quando quiser gerar criativos otimizados
- ✅ O sistema ajusta automaticamente o tom e estilo para o nicho "dorama"
- ✅ Gera múltiplas variações para teste A/B

### **3. Referências Visuais**
- ✅ Você pode adicionar imagens de referência no campo "Referências de Imagem"
- ✅ Use como inspiração visual, não como prompt principal

### **4. Fluxo Recomendado**
1. **Primeiro:** Use Modo Performance para gerar o prompt otimizado
2. **Depois:** Copie o prompt gerado e use no campo principal
3. **Finalmente:** Gere a imagem com o prompt otimizado

---

## 🚨 Problemas Comuns

### **Erro: "Campos obrigatórios não preenchidos"**
- ✅ Verifique se o Modo Performance está ativado
- ✅ Preencha pelo menos: Idioma, Nicho, Plataforma, Objetivo
- ✅ Adicione um prompt principal ou nome do produto

### **Imagem não gera**
- ✅ Verifique se o servidor está rodando (porta 4000)
- ✅ Confirme que a API key do Gemini está configurada
- ✅ Verifique os logs do servidor para erros

### **Prompt não está otimizado**
- ✅ Certifique-se de que o Modo Performance está ATIVADO
- ✅ Selecione o nicho "Dorama (Novelas Mexicanas)"
- ✅ Use o prompt gerado pelo sistema como base

---

## 📊 Resultado Esperado

Após gerar, você receberá:

1. **Variações A/B** (2-3 versões)
2. **Headlines** otimizadas
3. **Copy** em espanhol (se selecionado)
4. **Prompts de Imagem** prontos para uso
5. **CTAs** (Call-to-Actions) sugeridos

---

## 🎬 Próximos Passos

1. Teste diferentes variações
2. Compare os resultados
3. Use o prompt que gerar melhor resultado
4. Ajuste conforme feedback do público

---

**Criado em:** Janeiro 2025  
**Versão:** 1.0  
**Nicho:** Dorama (Novelas Mexicanas)



