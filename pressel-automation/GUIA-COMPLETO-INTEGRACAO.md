# 🚀 GUIA COMPLETO - PRESSEL AUTOMATION

## 📋 Índice
1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Pré-requisitos e Instalação](#pré-requisitos-e-instalação)
3. [Configuração Inicial](#configuração-inicial)
4. [Funcionalidades Principais](#funcionalidades-principais)
5. [Como Usar o Sistema](#como-usar-o-sistema)
6. [Diagnósticos e Troubleshooting](#diagnósticos-e-troubleshooting)
7. [Integração com ChatGPT](#integração-com-chatgpt)
8. [Templates e Modelos](#templates-e-modelos)
9. [API e Automação](#api-e-automação)
10. [Manutenção e Atualizações](#manutenção-e-atualizações)

---

## 🎯 Visão Geral do Sistema

O **Pressel Automation** é um plugin WordPress completo que automatiza a criação de páginas de pressel (pre-sell pages) através de JSON gerado pelo ChatGPT ou assistentes de IA. O sistema oferece:

- ✅ **Criação automática de páginas** a partir de JSON estruturado
- ✅ **Conversão inteligente de texto** do ChatGPT para JSON
- ✅ **Múltiplos modelos de página** (Brasileiro, Internacional, Minimalista, E-commerce, Afiliado)
- ✅ **Integração completa com ACF** (Advanced Custom Fields)
- ✅ **SEO automático** (Yoast, Rank Math, All in One SEO)
- ✅ **Sistema de diagnósticos** integrado
- ✅ **API REST** para automação externa
- ✅ **Interface administrativa** intuitiva

---

## 🔧 Pré-requisitos e Instalação

### Requisitos do Sistema
- **WordPress 5.0+**
- **PHP 7.4+**
- **Plugin Advanced Custom Fields (ACF)** - OBRIGATÓRIO
- **Tema compatível** com templates personalizados

### Instalação do Plugin

1. **Upload do Plugin:**
   ```bash
   # Via FTP/File Manager
   wp-content/plugins/pressel-automation/
   ```

2. **Ativação:**
   - WordPress Admin → Plugins → Instalar Plugins
   - Ativar "Pressel Automation"

3. **Verificação:**
   - Menu "Pressel Auto" deve aparecer no admin
   - Acesse: `wp-admin/admin.php?page=pressel-automation`

---

## ⚙️ Configuração Inicial

### 1. Instalação do ACF (Advanced Custom Fields)

**CRÍTICO:** O plugin ACF é obrigatório para o funcionamento do sistema.

```bash
# Instalar via WordPress Admin
Plugins → Adicionar Novo → "Advanced Custom Fields" → Instalar e Ativar
```

### 2. Importação dos Campos ACF

1. **Acesse:** ACF → Tools → Import
2. **Selecione:** `docs/schema-pressel-v1.json`
3. **Clique:** Import
4. **Verifique:** ACF → Field Groups → "Campos Pressel V1"

### 3. Configuração do Field Group

1. **Editar Field Group:**
   - ACF → Field Groups → "Campos Pressel V1"
   - Localização: `Page Template is equal to pressel-oficial.php`
   - Salvar

### 4. Template do Tema

**Copie o template para seu tema ativo:**
```bash
# Caminho do template
/wp-content/themes/SEU-TEMA/pressel-oficial.php
```

---

## 🚀 Funcionalidades Principais

### 1. Conversão de Texto para JSON

**Localização:** Admin → Pressel Auto → "Conversão de Texto para JSON"

**Como usar:**
1. Cole o texto gerado pelo ChatGPT
2. Selecione o modelo de página
3. Configure opções personalizadas (opcional)
4. Clique em "Converter Texto e Criar Página"

**Recursos:**
- ✅ Detecção automática de botões e links
- ✅ Extração inteligente de benefícios
- ✅ Geração automática de FAQ
- ✅ Detecção de tipo de botão (normal/rewarded)
- ✅ Detecção automática de cores

### 2. Processamento de JSON

**Localização:** Admin → Pressel Auto → "Processar JSON"

**Métodos:**
- **Upload de arquivo:** Arraste e solte arquivo .json
- **Colar JSON:** Cole diretamente o JSON no campo

**Validação automática:**
- ✅ Verificação de estrutura
- ✅ Validação de campos obrigatórios
- ✅ Detecção de modelo de página
- ✅ Preview antes da criação

### 3. Sistema de Diagnósticos

**Acesso:** Admin → Pressel Auto → "Diagnóstico do Sistema"

**Diagnósticos disponíveis:**
- 🔍 **Diagnóstico Template:** Verifica se o template está no lugar correto
- 🎯 **Diagnóstico ACF:** Verifica se todos os campos estão configurados
- 🧪 **Teste de Campos:** Testa preenchimento específico de campos

---

## 📖 Como Usar o Sistema

### Método 1: Conversão de Texto (Recomendado)

1. **Gere conteúdo no ChatGPT:**
   ```
   Crie uma página de pressel sobre [SEU TEMA]
   Inclua: título, subtítulo, benefícios, FAQ, botões de ação
   ```

2. **Cole no sistema:**
   - Acesse: Pressel Auto → Conversão de Texto
   - Cole o texto completo
   - Selecione modelo (V1, V2, V3, V4, V5)
   - Configure opções personalizadas

3. **Criação automática:**
   - Sistema converte texto para JSON
   - Cria página automaticamente
   - Preenche todos os campos ACF
   - Configura SEO

### Método 2: JSON Estruturado

1. **Use o prompt do ChatGPT:**
   - Baixe: `docs/prompt-chatgpt.txt`
   - Preencha as informações do seu projeto
   - Cole no ChatGPT

2. **Processe o JSON:**
   - Acesse: Pressel Auto → Processar JSON
   - Cole o JSON gerado
   - Clique em "Processar JSON e Criar Página"

### Método 3: API REST

**Endpoint:** `/wp-json/pressel-automation/v1/create-page`

**Exemplo de uso:**
```javascript
fetch('/wp-json/pressel-automation/v1/create-page', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': 'NONCE_AQUI'
    },
    body: JSON.stringify({
        page_title: "Título da Página",
        page_model: "modelo_v1",
        acf_fields: {
            hero_description: "Descrição do hero",
            // ... outros campos
        }
    })
})
```

---

## 🔍 Diagnósticos e Troubleshooting

### Diagnóstico de Template

**Acesso:** `VERIFICAR-TEMPLATE.php`

**Verifica:**
- ✅ Se o template `pressel-oficial.php` existe
- ✅ Se está no diretório correto do tema
- ✅ Permissões do arquivo
- ✅ Páginas criadas com o template
- ✅ Logs de erro

**Soluções:**
- Copiar template para o tema ativo
- Verificar permissões (644)
- Limpar cache do WordPress

### Diagnóstico ACF

**Acesso:** `DIAGNOSTICO-ACF.php`

**Verifica:**
- ✅ Se o plugin ACF está ativo
- ✅ Se os Field Groups existem
- ✅ Se todos os campos estão configurados
- ✅ Localização dos Field Groups

**Soluções:**
- Instalar/ativar plugin ACF
- Importar `schema-pressel-v1.json`
- Configurar localização do Field Group

### Teste de Campos Específicos

**Acesso:** `TESTE-CAMPOS-ESPECIFICOS.php`

**Testa:**
- ✅ Campo `texto_usuario`
- ✅ Campo `botao_tipo_selecao`
- ✅ Valores válidos para cada campo
- ✅ Criação de página de teste

### Campos Problemáticos Comuns

**Campo `texto_usuario`:**
- **Problema:** Não aparece no editor
- **Solução:** Verificar se Field Group está ativo e associado ao template

**Campo `botao_tipo_selecao`:**
- **Problema:** Valores não são salvos
- **Solução:** Verificar se as opções estão configuradas (normal, rewarded)

---

## 🤖 Integração com ChatGPT

### Prompt Personalizado

**Arquivo:** `docs/prompt-chatgpt.txt`

**Como usar:**
1. Abra o arquivo `prompt-chatgpt.txt`
2. Preencha as informações do seu projeto:
   - Nicho
   - Produto/Serviço
   - Público-alvo
   - Links dos botões
3. Cole no ChatGPT
4. Use o JSON gerado no sistema

### Exemplo de Prompt Preenchido

```
**NICHO:** Artesanato e Crochê
**PRODUTO/SERVIÇO:** Curso de Crochê para Iniciantes
**PÚBLICO-ALVO:** Mulheres de 25-55 anos interessadas em artesanato
**IDIOMA:** pt-BR
**PALAVRA-CHAVE PRINCIPAL:** "aprender crochê"
**OBJETIVO DA PÁGINA:** Gerar leads para curso pago
**LINKS DOS BOTÕES:**
- Botão 1: https://exemplo.com/curso-croche
- Botão 2: https://exemplo.com/tutoriais-gratuitos
- Botão 3: https://exemplo.com/comunidade
```

### Schema JSON

**Arquivo:** `docs/schema-pressel-v1.json`

**Contém:**
- Estrutura completa do JSON
- Validação de campos
- Tipos de dados aceitos
- Exemplos de uso

---

## 🎨 Templates e Modelos

### Modelos Disponíveis

| Modelo | Template | Descrição | Idioma |
|--------|----------|-----------|---------|
| `modelo_v1` | `pressel-oficial.php` | Brasileiro (padrão) | pt-BR |
| `modelo_v2` | `presell-enus.php` | Internacional | en-US |
| `modelo_v3` | `presell-minimal.php` | Minimalista | pt-BR |
| `modelo_v4` | `presell-ecommerce.php` | E-commerce | pt-BR |
| `modelo_v5` | `presell-affiliate.php` | Afiliado | pt-BR |

### Detecção Automática de Template

O sistema detecta automaticamente o template baseado em:

1. **Campo `page_model`** no JSON
2. **Campo `page_template`** no JSON
3. **Campos ACF** presentes
4. **Fallback** para `pressel-oficial.php`

### Estrutura dos Templates

**Template padrão:** `pressel-oficial.php`

**Campos ACF utilizados:**
- `hero_description` - Subtítulo principal
- `titulo_da_secao` - Título da seção de botões
- `texto_botao_p1/2/3` - Textos dos botões
- `link_botao_p1/2/3` - Links dos botões
- `titulo_beneficios` - Título da seção de benefícios
- `titulo_faq` - Título da seção FAQ
- E muitos outros...

---

## 🔌 API e Automação

### Endpoint REST

**URL:** `/wp-json/pressel-automation/v1/create-page`
**Método:** POST
**Autenticação:** WordPress Nonce

### Exemplo de Requisição

```javascript
const data = {
    page_title: "Título da Página",
    page_model: "modelo_v1",
    page_slug: "minha-pagina-pressel",
    post_status: "publish",
    acf_fields: {
        hero_description: "Descrição do hero",
        titulo_da_secao: "Acesse Agora",
        texto_botao_p1: "VER MAIS",
        link_botao_p1: "https://exemplo.com",
        // ... outros campos
    },
    seo: {
        meta_title: "Título SEO",
        meta_description: "Descrição SEO",
        focus_keyword: "palavra-chave"
    }
};

fetch('/wp-json/pressel-automation/v1/create-page', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': wpApiSettings.nonce
    },
    body: JSON.stringify(data)
})
.then(response => response.json())
.then(result => {
    console.log('Página criada:', result);
});
```

### Resposta da API

```json
{
    "success": true,
    "data": {
        "post_id": 123,
        "edit_link": "https://site.com/wp-admin/post.php?post=123&action=edit",
        "view_link": "https://site.com/minha-pagina-pressel",
        "message": "Página criada com sucesso!"
    }
}
```

### Automação com Webhooks

**Configuração:**
1. Configure webhook no seu sistema
2. Envie JSON para o endpoint
3. Sistema cria página automaticamente
4. Receba confirmação via callback

---

## 🛠️ Manutenção e Atualizações

### Logs do Sistema

**Localização:** `/wp-content/debug.log`

**Filtrar logs do Pressel:**
```bash
grep "Pressel Auto" /wp-content/debug.log
```

### Limpeza de Dados

**Páginas de teste:**
- Use o diagnóstico para criar páginas de teste
- Delete via WordPress Admin quando não precisar mais

**Cache:**
- Limpe cache do WordPress após mudanças
- Verifique se template está sendo aplicado

### Backup

**Antes de atualizações:**
1. Backup do banco de dados
2. Backup dos arquivos do plugin
3. Backup dos Field Groups ACF
4. Teste em ambiente de desenvolvimento

### Atualizações

**Processo seguro:**
1. Desative o plugin
2. Faça backup completo
3. Atualize arquivos
4. Reative o plugin
5. Execute diagnósticos
6. Teste criação de página

---

## 🚨 Troubleshooting Avançado

### Problema: Campos ACF não aparecem

**Diagnóstico:**
1. Execute `DIAGNOSTICO-ACF.php`
2. Verifique se ACF está ativo
3. Verifique se Field Group foi importado
4. Verifique localização do Field Group

**Solução:**
```bash
# Reimportar Field Group
ACF → Tools → Import → schema-pressel-v1.json
```

### Problema: Template não é aplicado

**Diagnóstico:**
1. Execute `VERIFICAR-TEMPLATE.php`
2. Verifique se arquivo existe
3. Verifique permissões
4. Verifique se está no tema correto

**Solução:**
```bash
# Copiar template para tema ativo
cp pressel-oficial.php /wp-content/themes/SEU-TEMA/
chmod 644 /wp-content/themes/SEU-TEMA/pressel-oficial.php
```

### Problema: JSON inválido

**Verificações:**
1. Use validador JSON online
2. Verifique se todos os campos obrigatórios estão presentes
3. Verifique se os valores estão no formato correto

**Campos obrigatórios:**
- `page_title`
- `acf_fields.hero_description`
- `acf_fields.titulo_da_secao`
- `acf_fields.texto_usuario`
- `acf_fields.titulo_h2_`
- `acf_fields.info_content`
- `acf_fields.titulo_beneficios`
- `acf_fields.titulo_faq`

### Problema: Página criada mas campos vazios

**Possíveis causas:**
1. Field Group não está associado ao template
2. Campos ACF não existem
3. Valores inválidos para campos de seleção
4. Permissões insuficientes

**Solução:**
1. Execute `TESTE-CAMPOS-ESPECIFICOS.php`
2. Verifique logs do WordPress
3. Teste preenchimento manual dos campos

---

## 📞 Suporte e Recursos

### Arquivos de Ajuda

- **`docs/prompt-chatgpt.txt`** - Prompt para ChatGPT
- **`docs/schema-pressel-v1.json`** - Schema JSON
- **`docs/exemplo-pressel.json`** - Exemplo completo
- **`docs/README.txt`** - Documentação básica

### Scripts de Diagnóstico

- **`VERIFICAR-TEMPLATE.php`** - Diagnóstico de template
- **`DIAGNOSTICO-ACF.php`** - Diagnóstico de campos ACF
- **`DIAGNOSTICO-CAMPOS-ESPECIFICOS.php`** - Diagnóstico detalhado
- **`TESTE-CAMPOS-ESPECIFICOS.php`** - Teste de campos

### Logs e Debug

**Ativar debug no WordPress:**
```php
// wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

**Verificar logs:**
```bash
tail -f /wp-content/debug.log | grep "Pressel Auto"
```

---

## 🎯 Próximos Passos

### Após Configuração Inicial

1. **Teste o sistema:**
   - Execute todos os diagnósticos
   - Crie uma página de teste
   - Verifique se todos os campos estão preenchidos

2. **Configure automação:**
   - Configure webhooks se necessário
   - Teste API REST
   - Configure integração com ChatGPT

3. **Otimize para produção:**
   - Configure cache
   - Configure backup automático
   - Monitore logs

### Expansão do Sistema

**Possíveis melhorias:**
- Novos modelos de página
- Integração com mais plugins de SEO
- Sistema de templates personalizados
- API mais robusta
- Dashboard de analytics

---

## 📋 Checklist de Implementação

### ✅ Configuração Básica
- [ ] WordPress 5.0+ instalado
- [ ] Plugin ACF instalado e ativo
- [ ] Plugin Pressel Automation instalado e ativo
- [ ] Template `pressel-oficial.php` copiado para o tema
- [ ] Field Group importado e configurado

### ✅ Testes Iniciais
- [ ] Diagnóstico de template executado
- [ ] Diagnóstico ACF executado
- [ ] Teste de campos específicos executado
- [ ] Página de teste criada com sucesso
- [ ] Todos os campos ACF preenchidos

### ✅ Produção
- [ ] Sistema testado com conteúdo real
- [ ] API REST funcionando
- [ ] Logs configurados
- [ ] Backup configurado
- [ ] Monitoramento ativo

---

**🎉 Parabéns! Seu sistema Pressel Automation está pronto para uso!**

Para dúvidas ou problemas, consulte os scripts de diagnóstico ou verifique os logs do WordPress.
