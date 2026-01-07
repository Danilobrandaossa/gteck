# 💾 COMO SALVAR E REUTILIZAR PROMPTS

## 🎯 Funcionalidade

Agora você pode salvar prompts de geração de imagens para reutilizar depois, editando apenas os pontos que quiser mudar.

---

## ✅ Como Salvar um Prompt

1. **Preencha o formulário:**
   - Digite o prompt principal
   - Configure qualidade, proporção, variações, etc.

2. **Clique em "Salvar Prompt":**
   - Botão localizado acima do botão "Gerar Imagens"
   - Um modal será aberto

3. **Digite um nome:**
   - Ex: "Walmart Gift Card - Comercial"
   - Ex: "Produto X - Instagram Story"
   - Ex: "Promoção Black Friday - Horizontal"

4. **Clique em "Salvar":**
   - O prompt será salvo com todas as configurações:
     - Prompt principal
     - Proporção (1:1, 4:5, 9:16, 16:9)
     - Variações (1-4)
     - Qualidade (draft/production)
     - Incluir texto na imagem (sim/não)

---

## 📂 Como Carregar um Prompt Salvo

1. **Clique em "Carregar Prompt":**
   - Botão localizado ao lado de "Salvar Prompt"
   - Um modal será aberto com todos os prompts salvos

2. **Visualize os prompts:**
   - Nome do prompt
   - Preview do prompt (primeiros 100 caracteres)
   - Configurações salvas (ratio, variações, qualidade, texto)

3. **Clique em "Carregar":**
   - O prompt será carregado com todas as configurações
   - Você pode editar qualquer campo antes de gerar

---

## ✏️ Como Editar um Prompt Carregado

1. **Carregue o prompt** (veja acima)

2. **Edite o que quiser:**
   - Modifique o texto do prompt
   - Altere a proporção
   - Mude o número de variações
   - Ajuste a qualidade
   - Ative/desative texto na imagem

3. **Gere as imagens:**
   - Clique em "Gerar Imagens"
   - Ou salve como um novo prompt com outro nome

---

## 🗑️ Como Deletar um Prompt

1. **Abra "Carregar Prompt"**

2. **Clique em "Deletar"** no prompt que deseja remover

3. **Confirme a exclusão**

---

## 💡 Dicas de Uso

### 1. **Nomes Descritivos**
Use nomes que facilitem a identificação:
- ✅ "Walmart Gift Card - Comercial 1:1"
- ✅ "Produto X - Instagram Story 9:16"
- ❌ "Prompt 1", "Teste", "Novo"

### 2. **Salve Variações**
Salve diferentes versões do mesmo prompt:
- "Walmart Gift Card - Com Texto"
- "Walmart Gift Card - Sem Texto"
- "Walmart Gift Card - Production"
- "Walmart Gift Card - Draft"

### 3. **Reutilize e Adapte**
Carregue um prompt salvo e adapte para novos produtos:
- Carregue: "Walmart Gift Card - Comercial"
- Edite: Troque "Walmart Gift Card" por "Amazon Gift Card"
- Salve: "Amazon Gift Card - Comercial"

### 4. **Organize por Plataforma**
Salve prompts específicos para cada plataforma:
- "Template - Instagram Feed (1:1)"
- "Template - Instagram Story (9:16)"
- "Template - Facebook Post (4:5)"
- "Template - Google Display (16:9)"

---

## 📊 O Que É Salvo

Quando você salva um prompt, o sistema armazena:

- ✅ **Prompt principal** (texto completo)
- ✅ **Proporção** (1:1, 4:5, 9:16, 16:9)
- ✅ **Variações** (1-4)
- ✅ **Qualidade** (draft/production)
- ✅ **Incluir texto na imagem** (sim/não)
- ✅ **Nome do prompt**
- ✅ **Data de criação**

**NÃO é salvo:**
- ❌ Referências de imagem (precisa adicionar novamente)
- ❌ Resultados de geração anteriores

---

## 🔧 Onde os Prompts São Salvos

Os prompts são salvos no **localStorage** do navegador:
- Chave: `cms-creative-prompts`
- Formato: JSON
- Persistência: Local (não sincroniza entre dispositivos)

**Nota:** Se você limpar os dados do navegador, os prompts salvos serão perdidos.

---

## 🚀 Exemplo Prático

### Cenário: Criar variações do mesmo produto

1. **Primeira vez:**
   - Crie o prompt completo para "Walmart Gift Card"
   - Configure: 1:1, 4 variações, production, sem texto
   - Salve como: "Walmart Gift Card - Base"

2. **Segunda vez:**
   - Carregue "Walmart Gift Card - Base"
   - Mude apenas: incluir texto na imagem = true
   - Salve como: "Walmart Gift Card - Com Texto"

3. **Terceira vez:**
   - Carregue "Walmart Gift Card - Base"
   - Mude: proporção para 9:16
   - Salve como: "Walmart Gift Card - Story"

4. **Quarta vez:**
   - Carregue "Walmart Gift Card - Base"
   - Mude: produto para "Amazon Gift Card"
   - Salve como: "Amazon Gift Card - Base"

---

## ⚠️ Limitações

- **LocalStorage:** Prompts salvos apenas no navegador atual
- **Sem sincronização:** Não sincroniza entre dispositivos
- **Sem backup automático:** Faça backup manual se necessário
- **Sem compartilhamento:** Prompts são privados por navegador

---

**Pronto para salvar e reutilizar seus prompts!** 🎉







