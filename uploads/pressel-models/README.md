# 📁 PASTA PARA UPLOAD DE MODELOS PRESSEL

Esta pasta é destinada ao upload de arquivos para configuração do Pressel Automation.

## 🎯 MODELOS DISPONÍVEIS:

- **V1** - Modelo versão 1
- **V3** - Modelo versão 3  
- **V4** - Modelo versão 4
- **V5** - Modelo versão 5
- **B1** - Modelo B1

## 📋 ESTRUTURA ESPERADA:

```
uploads/pressel-models/
├── V1/
│   ├── template.php          # Arquivo PHP do template V1
│   └── acf-fields.json       # JSON com campos ACF V1
├── V3/
│   ├── template.php          # Arquivo PHP do template V3
│   └── acf-fields.json       # JSON com campos ACF V3
├── V4/
│   ├── template.php          # Arquivo PHP do template V4
│   └── acf-fields.json       # JSON com campos ACF V4
├── V5/
│   ├── template.php          # Arquivo PHP do template V5
│   └── acf-fields.json       # JSON com campos ACF V5
└── B1/
    ├── template.php          # Arquivo PHP do template B1
    └── acf-fields.json       # JSON com campos ACF B1
```

## 📝 INSTRUÇÕES:

Para cada modelo (V1, V3, V4, V5, B1):
1. **template.php**: Arquivo PHP completo do template
2. **acf-fields.json**: JSON com estrutura dos campos ACF

## 🔧 PROCESSAMENTO:

Após o upload, os arquivos serão processados automaticamente para:
- Extrair informações de cada template PHP
- Processar campos ACF de cada modelo
- Gerar estrutura JSON para cada modelo
- Criar modelos no sistema
- Configurar validações por modelo
- Detectar modelos disponíveis por site

## 📊 EXEMPLO DE ESTRUTURA:

### template.php (qualquer modelo)
```php
<?php
/**
 * Template Name: Modelo V3
 * Template Slug: modelo-v3
 * Description: Template modelo V3
 */
get_header(); ?>

<div class="container">
    <h1><?php the_title(); ?></h1>
    <div class="content">
        <?php the_content(); ?>
    </div>
</div>

<?php get_footer(); ?>
```

### acf-fields.json (qualquer modelo)
```json
[
  {
    "title": "Campos Principais",
    "fields": [
      {
        "name": "hero_title",
        "label": "Título Principal",
        "type": "text",
        "required": true
      },
      {
        "name": "hero_description",
        "label": "Descrição",
        "type": "textarea",
        "required": false
      }
    ]
  }
]
```

## 🚀 PRÓXIMOS PASSOS:

1. Faça upload dos arquivos de cada modelo em suas respectivas pastas
2. Execute o script de processamento: `node scripts/process-pressel-model.js`
3. Configure os modelos no sistema
4. Teste a funcionalidade com todos os sites
5. Valide que todos os sites têm os modelos necessários
