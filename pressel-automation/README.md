
# Pressel Automation - Plugin WordPress

Automação para criação de páginas Pressel através de JSON gerado pelo ChatGPT.

## 📦 Instalação

1. Faça upload desta pasta completa (`pressel-automation`) para `/wp-content/plugins/`
2. Ative o plugin no WordPress
3. Instale e ative o plugin **Advanced Custom Fields (ACF)**
4. Importe os campos ACF do arquivo `../json-v1.json`

## ✅ Requisitos

- WordPress 5.0+
- PHP 7.4+
- Plugin Advanced Custom Fields (OBRIGATÓRIO)
- Plugin de SEO (opcional): Yoast, Rank Math ou All in One SEO

## 🎯 Como Usar

1. Acesse **Pressel Auto** no menu do WordPress
2. Faça upload de um arquivo JSON
3. Clique em "Processar e Criar Página"
4. Página criada automaticamente!

## 📚 Documentação Completa

Ver arquivo `../README.md` na raiz do projeto.

## 🔌 API REST

Endpoint: `/wp-json/pressel-automation/v1/create-page`

Exemplo:
```bash
curl -X POST https://seu-site.com/wp-json/pressel-automation/v1/create-page \
  -u usuario:senha_aplicacao \
  -H "Content-Type: application/json" \
  -d @exemplo.json
```

## 📄 Estrutura da Pasta

```
pressel-automation/
├── pressel-automation-plugin.php    # Plugin principal
├── assets/
│   ├── admin-style.css             # Estilos do painel
│   └── admin-script.js             # JavaScript do painel
├── docs/                            # Documentação e recursos
└── README.md                       # Este arquivo
```

## 🔐 Segurança

- Validação de dados completa
- Verificação ACF automática
- Sanitização de inputs
- Nonce verification
- Capability checks

## 📞 Suporte

Ver documentação completa no diretório raiz do projeto.



