# 📘 Como Criar JSON para Modelo V4 - Guia Completo

## 🎯 Objetivo

Este guia explica **exatamente** como criar um JSON que o Pressel Automation irá processar corretamente para o modelo V4.

## ✅ Status Atual do Sistema

O Pressel Automation está **100% funcional** para o modelo V4. O sistema:
- ✅ Identifica automaticamente o modelo V4 quando `page_model: "modelo_v4"` está no JSON
- ✅ Aplica automaticamente o template `V4.php` 
- ✅ Salva todos os campos ACF corretamente
- ✅ Converte arrays de repeaters (`benefits`, `faqs`) para formato ACF

## 📋 Estrutura do JSON

### 1. Campos Básicos da Página (Obrigatórios)

```json
{
  "page_title": "Título da Sua Página",
  "page_model": "modelo_v4",
  "page_slug": "slug-amigavel",
  "post_status": "publish"
}
```

**⚠️ ATENÇÃO:**
- `page_model` **DEVE** ser exatamente `"modelo_v4"` (minúsculas, com underscore)
- **NÃO use**: `"V4"`, `"v4"`, `"MODELO_V4"`, `"modelo_V4"`

### 2. Campos ACF Obrigatórios (Mínimo)

```json
"acf_fields": {
  "idioma_footer": "en",
  "title_h1": "Seu Título Principal Aqui",
  "download_button_text": "TEXTO DO BOTÃO"
}
```

Estes 3 campos são **obrigatórios** e devem estar presentes.

### 3. Campos ACF Opcionais (Recomendados)

```json
"acf_fields": {
  // ... campos obrigatórios acima ...
  
  "sub_title": "Subtítulo da página",
  "imagem_destaque": "https://exemplo.com/imagem.jpg",
  "tipo_botao": "normal",
  "download_button_url": "https://exemplo.com/download",
  "disclaimer": "You will remain on the same site",
  "description": "<p>Descrição completa em HTML</p>",
  "benefits_title": "Principais Benefícios",
  "title2": "Segundo Título",
  "description1": "<p>Outra descrição em HTML</p>",
  "faq_title": "Perguntas Frequentes"
}
```

### 4. Campos Repeater: Benefits

```json
"benefits": [
  {
    "benefit_text": "Primeiro benefício importante"
  },
  {
    "benefit_text": "Segundo benefício importante"
  },
  {
    "benefit_text": "Terceiro benefício importante"
  }
]
```

**⚠️ FORMATO OBRIGATÓRIO:**
- Deve ser um **array** `[]`
- Cada item deve ser um **objeto** `{}`
- Cada objeto deve ter a propriedade `benefit_text`
- Se não houver benefícios, use array vazio: `"benefits": []`

### 5. Campos Repeater: FAQs

```json
"faqs": [
  {
    "question": "Qual é a primeira pergunta?",
    "answer": "Esta é a primeira resposta completa."
  },
  {
    "question": "Qual é a segunda pergunta?",
    "answer": "Esta é a segunda resposta completa."
  }
]
```

**⚠️ FORMATO OBRIGATÓRIO:**
- Deve ser um **array** `[]`
- Cada item deve ser um **objeto** `{}`
- Cada objeto deve ter `question` E `answer`
- Se não houver FAQs, use array vazio: `"faqs": []`

## 📝 Exemplo Completo e Funcional

```json
{
  "page_title": "YarnPal – Crochet for Beginner",
  "page_model": "modelo_v4",
  "page_slug": "yarnpal-crochet-download",
  "post_status": "publish",
  "acf_fields": {
    "idioma_footer": "en",
    "title_h1": "YarnPal – Crochet for Beginner",
    "sub_title": "Perfect for those starting their crochet journey",
    "imagem_destaque": "",
    "tipo_botao": "normal",
    "download_button_url": "https://www.google.com",
    "download_button_text": "START YOUR CROCHET JOURNEY TODAY",
    "disclaimer": "You will remain on the same site",
    "description": "<p>Descrição completa aqui...</p>",
    "benefits_title": "Main Benefits",
    "benefits": [
      {
        "benefit_text": "Learn crochet basics with interactive tutorials"
      },
      {
        "benefit_text": "Access visual stitch guides and easy pattern instructions"
      }
    ],
    "title2": "Understanding the Experience",
    "description1": "<p>Descrição adicional...</p>",
    "faq_title": "FAQ",
    "faqs": [
      {
        "question": "What is YarnPal?",
        "answer": "YarnPal is a mobile-friendly learning tool..."
      },
      {
        "question": "Do I need special materials?",
        "answer": "You only need basic crochet supplies..."
      }
    ]
  }
}
```

## 🔄 Como o Sistema Processa o JSON

### Passo 1: Leitura do JSON
```javascript
Sistema lê: "page_model": "modelo_v4"
```

### Passo 2: Identificação do Modelo
```javascript
modelName = "modelo_v4".replace('modelo_', '').toUpperCase()
// Resultado: "V4"

modelSignature = ModelIdentifier.getModel("V4")
// Retorna: { templateFile: "V4.php", uniqueFields: [...] }
```

### Passo 3: Criação da Página
```javascript
Cria página no WordPress com:
- Título: "YarnPal – Crochet for Beginner"
- Slug: "yarnpal-crochet-download"
- Status: "publish"
```

### Passo 4: Aplicação do Template
```javascript
Aplica template via meta field:
meta: { _wp_page_template: "V4.php" }
```

### Passo 5: Salvamento dos Campos ACF
```javascript
Converte repeaters:
benefits[0].benefit_text → benefits_0_benefit_text
faqs[0].question → faqs_0_question
faqs[0].answer → faqs_0_answer

Salva todos os campos via WordPress REST API
```

## ❌ Erros Comuns e Como Evitá-los

### Erro 1: page_model Incorreto
```json
// ❌ ERRADO (não funcionará)
"page_model": "V4"
"page_model": "v4"
"page_model": "MODELO_V4"

// ✅ CORRETO
"page_model": "modelo_v4"
```

### Erro 2: Benefits em Formato Errado
```json
// ❌ ERRADO
"benefits": ["Benefício 1", "Benefício 2"]
"benefits": { "1": "Benefício 1" }

// ✅ CORRETO
"benefits": [
  { "benefit_text": "Benefício 1" },
  { "benefit_text": "Benefício 2" }
]
```

### Erro 3: FAQs em Formato Errado
```json
// ❌ ERRADO
"faqs": {
  "pergunta_1": "Pergunta",
  "resposta_1": "Resposta"
}

// ✅ CORRETO
"faqs": [
  { "question": "Pergunta", "answer": "Resposta" }
]
```

### Erro 4: Campos Obrigatórios Faltando
```json
// ❌ ERRADO (falta download_button_text)
"acf_fields": {
  "idioma_footer": "en",
  "title_h1": "Título"
}

// ✅ CORRETO
"acf_fields": {
  "idioma_footer": "en",
  "title_h1": "Título",
  "download_button_text": "DOWNLOAD"
}
```

## 🔍 Validação no Preview

Antes de publicar, o sistema de Preview valida:

1. ✅ Modelo identificado como V4?
2. ✅ Template `V4.php` encontrado?
3. ✅ Campos obrigatórios preenchidos?
4. ✅ Arrays de repeaters no formato correto?

Use o Preview para verificar tudo antes de publicar!

## 📊 Mapeamento de Campos

| Campo JSON | Campo ACF WordPress | Tipo | Obrigatório |
|------------|---------------------|------|-------------|
| `page_model` | - | meta | ✅ Sim |
| `idioma_footer` | `idioma_footer` | select | ✅ Sim |
| `title_h1` | `title_h1` | text | ✅ Sim |
| `download_button_text` | `download_button_text` | text | ✅ Sim |
| `sub_title` | `sub_title` | text | ❌ Não |
| `benefits` | `benefits` (repeater) | repeater | ❌ Não |
| `benefits[].benefit_text` | `benefits_X_benefit_text` | text | ❌ Não |
| `faqs` | `faqs` (repeater) | repeater | ❌ Não |
| `faqs[].question` | `faqs_X_question` | text | ❌ Não |
| `faqs[].answer` | `faqs_X_answer` | textarea | ❌ Não |

## ✅ Checklist Final

Antes de enviar o JSON para o Pressel Automation:

- [ ] `page_model` = `"modelo_v4"` (exatamente assim)
- [ ] `page_title` preenchido
- [ ] `page_slug` preenchido (sem caracteres especiais)
- [ ] `idioma_footer` preenchido (`"en"` ou `"pt"`)
- [ ] `title_h1` preenchido
- [ ] `download_button_text` preenchido
- [ ] `benefits` é um array (pode ser `[]`)
- [ ] Cada item de `benefits` tem `benefit_text`
- [ ] `faqs` é um array (pode ser `[]`)
- [ ] Cada item de `faqs` tem `question` e `answer`
- [ ] JSON está válido (use um validador JSON online)

## 🎯 Resumo Executivo

**Para criar um JSON que funciona no V4:**

1. Use `"page_model": "modelo_v4"` (obrigatório, minúsculas)
2. Preencha os 3 campos obrigatórios mínimos
3. Use arrays de objetos para `benefits` e `faqs`
4. O sistema faz TODO o resto automaticamente:
   - Identifica o modelo
   - Aplica o template `V4.php`
   - Converte repeaters para formato ACF
   - Salva todos os campos
   - Verifica se tudo está correto

**O sistema está pronto e funcionando!** Basta criar o JSON seguindo este guia.



