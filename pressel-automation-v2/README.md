Pressel Automation v2 (WordPress plugin)

Endpoints (requerem autenticação e permissão para editar páginas):
- POST /wp-json/pressel-automation-v2/v1/preview
- POST /wp-json/pressel-automation-v2/v1/publish
- GET /wp-json/pressel-automation-v2/v1/verify?post_id=123

JSON esperado (exemplo mínimo V1):
{
  "pressel": { "model": "V1", "template_name": "Pressel V1" },
  "page": { "title": "Exemplo V1", "slug": "exemplo-v1", "status": "publish" },
  "acf": { "cor_botao": "#2352AE" }
}

Template mapping:
- V1 -> pressel-oficial.php
- V4 -> V4.php

Instalação:
1. Copie a pasta pressel-automation-v2 para wp-content/plugins/
2. Ative o plugin no painel do WordPress
3. Garanta que o arquivo de template exista no tema ativo (pressel-oficial.php ou V4.php)
4. Chame os endpoints com Basic Auth (Application Password)

Observações:
- Se ACF estiver ativo, os campos são salvos via update_field
- Sem ACF, usa update_post_meta como fallback
- Upsert de página por slug ou título


