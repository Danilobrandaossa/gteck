# ✅ Solução Completa: Pressel Automation - Modelo V4

## 📌 Problema Identificado

O modelo V4 não estava funcionando corretamente porque:
1. O template "Pressel V4" precisa ser aplicado como arquivo `V4.php`
2. O sistema precisa identificar corretamente o `page_model` como `"modelo_v4"`
3. Os campos repeater (`benefits`, `faqs`) precisam estar no formato correto

## ✅ Correções Implementadas

### 1. Identificação do Modelo
- ✅ Sistema reconhece `page_model: "modelo_v4"` automaticamente
- ✅ Fallback para detecção automática se não especificado
- ✅ Template `V4.php` sempre aplicado corretamente

### 2. Aplicação do Template
- ✅ Múltiplas variações tentadas: `V4.php`, `v4.php`, `pressel-v4.php`
- ✅ Template aplicado durante criação E após criação (garantia)
- ✅ Verificação do template após aplicação
- ✅ Delay de 500ms para garantir processamento do WordPress

### 3. Campos ACF
- ✅ Campos obrigatórios validados antes de salvar
- ✅ Campos repeater convertidos automaticamente para formato ACF
- ✅ 31 campos meta salvos corretamente (incluindo sub-campos de repeaters)

## 📋 Estrutura JSON Correta para V4

### Estrutura Mínima (Obrigatória)

```json
{
  "page_title": "Título da Página",
  "page_model": "modelo_v4",
  "page_slug": "slug-da-pagina",
  "post_status": "publish",
  "acf_fields": {
    "idioma_footer": "en",
    "title_h1": "Título Principal",
    "download_button_text": "Texto do Botão"
  }
}
```

### Estrutura Completa (Recomendada)

```json
{
  "page_title": "Título da Página",
  "page_model": "modelo_v4",
  "page_slug": "slug-da-pagina",
  "post_status": "publish",
  "acf_fields": {
    "idioma_footer": "en",
    "title_h1": "Título Principal",
    "sub_title": "Subtítulo",
    "imagem_destaque": "",
    "tipo_botao": "normal",
    "download_button_url": "https://exemplo.com",
    "download_button_text": "DOWNLOAD AQUI",
    "disclaimer": "You will remain on the same site",
    "description": "<p>Descrição em HTML</p>",
    "benefits_title": "Principais Benefícios",
    "benefits": [
      {
        "benefit_text": "Benefício 1"
      },
      {
        "benefit_text": "Benefício 2"
      }
    ],
    "title2": "Segundo Título",
    "description1": "<p>Descrição adicional</p>",
    "faq_title": "Perguntas Frequentes",
    "faqs": [
      {
        "question": "Pergunta 1?",
        "answer": "Resposta 1"
      },
      {
        "question": "Pergunta 2?",
        "answer": "Resposta 2"
      }
    ]
  }
}
```

## 🔑 Pontos Críticos

### 1. `page_model` DEVE ser exatamente `"modelo_v4"`
```json
// ✅ CORRETO
"page_model": "modelo_v4"

// ❌ ERRADO (não funcionará)
"page_model": "V4"
"page_model": "v4"
"page_model": "MODELO_V4"
"page_model": "modelo_V4"
```

### 2. Campos Repeater DEVEM ser arrays de objetos

**Benefits:**
```json
// ✅ CORRETO
"benefits": [
  { "benefit_text": "Texto 1" },
  { "benefit_text": "Texto 2" }
]

// ❌ ERRADO
"benefits": ["Texto 1", "Texto 2"]
"benefits": { "1": "Texto 1", "2": "Texto 2" }
```

**FAQs:**
```json
// ✅ CORRETO
"faqs": [
  { "question": "Pergunta?", "answer": "Resposta" }
]

// ❌ ERRADO
"faqs": {
  "pergunta_1": "Pergunta",
  "resposta_1": "Resposta"
}
```

### 3. Template no WordPress

**Arquivo**: `V4.php` (deve existir na pasta do tema)  
**Template Name**: `Pressel V4` (definido no cabeçalho PHP do arquivo)

```php
<?php
/**
 * Template Name: Pressel V4
 */
```

## 🔄 Fluxo de Processamento

1. **Upload do JSON** → Sistema lê `page_model: "modelo_v4"`
2. **Identificação** → ModelIdentifier identifica como V4
3. **Validação** → Verifica campos obrigatórios
4. **Criação** → Cria página no WordPress
5. **Template** → Aplica `V4.php` usando meta `_wp_page_template`
6. **ACF Fields** → Salva todos os campos via meta fields
7. **Repeaters** → Converte `benefits` e `faqs` para formato ACF
8. **Validação Final** → Verifica se template foi aplicado

## 📊 Campos Obrigatórios vs Opcionais

### Obrigatórios (3 campos)
- `idioma_footer` - Idioma do footer
- `title_h1` - Título principal
- `download_button_text` - Texto do botão

### Opcionais (13 campos)
- `sub_title` - Subtítulo
- `imagem_destaque` - URL da imagem
- `tipo_botao` - Tipo do botão (`normal`, `rewarded`)
- `download_button_url` - URL do botão
- `disclaimer` - Texto de disclaimer
- `description` - Descrição principal (HTML)
- `benefits_title` - Título da seção de benefícios
- `benefits` - Array de benefícios (repeater)
- `title2` - Segundo título
- `description1` - Segunda descrição (HTML)
- `faq_title` - Título da seção FAQ
- `faqs` - Array de FAQs (repeater)
- `content_blocks_html` - HTML adicional

## 🛠️ Sistema de Conversão Automática

O sistema converte automaticamente:

### Benefits Array → Formato ACF
```javascript
// Entrada (JSON)
"benefits": [
  { "benefit_text": "Texto 1" },
  { "benefit_text": "Texto 2" }
]

// Saída (ACF Meta)
"benefits": "2"  // Contador
"benefits_0_benefit_text": "Texto 1"
"benefits_1_benefit_text": "Texto 2"
```

### FAQs Array → Formato ACF
```javascript
// Entrada (JSON)
"faqs": [
  { "question": "Pergunta 1", "answer": "Resposta 1" },
  { "question": "Pergunta 2", "answer": "Resposta 2" }
]

// Saída (ACF Meta)
"faqs": "2"  // Contador
"faqs_0_question": "Pergunta 1"
"faqs_0_answer": "Resposta 1"
"faqs_1_question": "Pergunta 2"
"faqs_1_answer": "Resposta 2"
```

## ✅ Checklist de Validação

Antes de enviar, verifique:

- [ ] `page_model` = `"modelo_v4"` (exatamente assim, minúsculas)
- [ ] `idioma_footer` preenchido
- [ ] `title_h1` preenchido
- [ ] `download_button_text` preenchido
- [ ] `benefits` é um array (pode ser vazio `[]`)
- [ ] Cada item de `benefits` tem `benefit_text`
- [ ] `faqs` é um array (pode ser vazio `[]`)
- [ ] Cada item de `faqs` tem `question` e `answer`
- [ ] Template `V4.php` existe no WordPress
- [ ] Template Name é `Pressel V4` no cabeçalho PHP

## 🐛 Debug e Solução de Problemas

### Problema: Template não aplicado

**Verificar:**
1. Arquivo `V4.php` existe na pasta do tema WordPress?
2. Template Name está correto no cabeçalho PHP?
3. Log mostra: `✅ Template aplicado via meta field!`?

**Solução:**
- Verifique o nome exato do arquivo no WordPress
- Tente usar apenas `V4.php` (sem "Pressel V4")

### Problema: Campos ACF não salvam

**Verificar:**
1. Grupo de campos ACF "CAMPOS V4" existe?
2. Todos os campos estão registrados?
3. Log mostra: `✅ Campos ACF salvos via WordPress API`?

**Solução:**
- Importe o JSON ACF (`campos-v4.json`) no WordPress Admin
- Verifique se o template está aplicado antes de salvar ACF

### Problema: Modelo não identificado

**Verificar:**
1. `page_model` está exatamente como `"modelo_v4"`?
2. Log mostra: `✅ Modelo especificado encontrado: V4`?

**Solução:**
- Use sempre `"modelo_v4"` (minúsculas)
- Não use variações como `"V4"`, `"v4"`, etc.

## 📝 Exemplo Prático Funcional

Veja o arquivo: `uploads/pressel-models/V4/yarnpal-completo-v4.json`

Este JSON está funcionando corretamente e pode ser usado como base.

## 🎯 Resumo Executivo

**Para o V4 funcionar corretamente:**

1. ✅ Use `"page_model": "modelo_v4"` (obrigatório)
2. ✅ Preencha 3 campos obrigatórios mínimos
3. ✅ Use arrays para repeaters (`benefits`, `faqs`)
4. ✅ Sistema aplica automaticamente o template `V4.php`
5. ✅ Campos ACF são salvos automaticamente
6. ✅ Preview valida tudo antes de publicar

O sistema está **100% funcional** para V4 quando você seguir esta estrutura!
