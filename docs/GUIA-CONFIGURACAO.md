# 🚀 **GUIA COMPLETO DE CONFIGURAÇÃO - CMS MODERNO**

## 📋 **ÍNDICE**
1. [Visão Geral](#visão-geral)
2. [Configuração no CMS](#configuração-no-cms)
3. [Configuração no WordPress](#configuração-no-wordpress)
4. [Fluxo de Cadastro](#fluxo-de-cadastro)
5. [Sistema de Permissões](#sistema-de-permissões)
6. [Isolamento por Site](#isolamento-por-site)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 **VISÃO GERAL**

O CMS Moderno funciona com uma hierarquia específica:
- **ADMIN** → Cria organizações e sites
- **ORGANIZAÇÕES** → Contêm sites WordPress
- **SITES** → Cada site é isolado e independente
- **USUÁRIOS** → Acesso apenas aos sites de sua organização

---

## 🏢 **CONFIGURAÇÃO NO CMS**

### **1. PRIMEIRO: CRIAR ORGANIZAÇÃO**

#### **Quem pode fazer:**
- ✅ Apenas usuários com role **ADMIN**

#### **Como fazer:**
1. Acesse: `http://localhost:3002`
2. Faça login como ADMIN
3. Navegue para **"Organizações"** no menu
4. Clique em **"Nova Organização"**

#### **Campos obrigatórios:**
- **Nome da Organização**: Ex: "Minha Empresa"
- **Slug**: Gerado automaticamente (ex: "minha-empresa")

#### **Campos opcionais:**
- **URL do Logo**: Link para imagem do logo
- **Tema**: Azul, Verde, Roxo, Laranja, Vermelho
- **Idioma**: Português, Inglês, Espanhol

#### **Exemplo de preenchimento:**
```
Nome: Empresa ABC Ltda
Slug: empresa-abc-ltda (automático)
Logo: https://exemplo.com/logo.png
Tema: Azul
Idioma: Português (Brasil)
```

---

### **2. SEGUNDO: CRIAR SITES**

#### **Quem pode fazer:**
- ✅ Apenas usuários com role **ADMIN**

#### **Pré-requisitos:**
- ✅ Organização deve existir
- ✅ Site WordPress deve estar configurado

#### **Como fazer:**
1. Navegue para **"Sites"** no menu
2. Clique em **"Novo Site"**
3. Preencha os dados do site

#### **Campos obrigatórios:**
- **Nome do Site**: Ex: "Site Principal"
- **URL do Site**: Ex: "https://meusite.com"

#### **Campos opcionais (WordPress):**
- **URL da API WordPress**: Ex: "https://meusite.com/wp-json"
- **Usuário WordPress**: Ex: "admin"
- **Senha/Token WordPress**: Token de aplicação

#### **Exemplo de preenchimento:**
```
Nome: Site Principal
URL: https://meusite.com
WordPress API: https://meusite.com/wp-json
Usuário: admin
Senha: [token de aplicação]
Status: Ativo
```

---

### **3. TERCEIRO: CRIAR USUÁRIOS**

#### **Quem pode fazer:**
- ✅ **ADMIN**: Pode criar qualquer usuário
- ✅ **EDITOR**: Pode criar usuários em sua organização

#### **Como fazer:**
1. Navegue para **"Usuários"** no menu
2. Clique em **"Novo Usuário"**
3. Preencha os dados do usuário

#### **Campos obrigatórios:**
- **Nome**: Nome completo do usuário
- **Email**: Email para login
- **Senha**: Senha temporária
- **Role**: Admin, Editor, Viewer
- **Organização**: Organização vinculada

#### **Campos opcionais:**
- **Sites de Acesso**: Quais sites o usuário pode acessar
- **Permissões Específicas**: Permissões customizadas

---

## 🌐 **CONFIGURAÇÃO NO WORDPRESS**

### **1. INSTALAÇÃO DO PLUGIN PRESSEL AUTOMATION**

#### **Download:**
- O plugin está em: `pressel-automation/`
- Faça upload para: `/wp-content/plugins/`

#### **Ativação:**
1. Acesse **Plugins** no WordPress
2. Ative **"Pressel Automation"**
3. Vá para **"Pressel"** no menu admin

### **2. CONFIGURAÇÃO DA API REST**

#### **Permalinks:**
1. Acesse **Configurações > Permalinks**
2. Selecione **"Nome do post"** ou **"Estrutura personalizada"**
3. Salve as alterações

#### **Verificação:**
- Teste: `https://seusite.com/wp-json`
- Deve retornar JSON com informações da API

### **3. CONFIGURAÇÃO DE AUTENTICAÇÃO**

#### **Método 1: Application Passwords (Recomendado)**
1. Acesse **Usuários > Perfil**
2. Role até **"Application Passwords"**
3. Digite um nome: "CMS Moderno"
4. Clique **"Adicionar Nova Senha"**
5. Copie o token gerado

#### **Método 2: Plugin de Autenticação**
1. Instale plugin **"Application Passwords"**
2. Configure permissões específicas
3. Gere token de acesso

### **4. CONFIGURAÇÃO DE CORS (SE NECESSÁRIO)**

#### **Adicionar ao functions.php:**
```php
// Permitir CORS para CMS
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: http://localhost:3002');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        return $value;
    });
});
```

### **5. CONFIGURAÇÃO DE SEGURANÇA**

#### **HTTPS Obrigatório:**
- Configure SSL no servidor
- Force HTTPS no WordPress
- Atualize URLs no banco de dados

#### **Firewall:**
- Libere IP do servidor CMS
- Configure rate limiting
- Monitore logs de acesso

---

## 🔄 **FLUXO DE CADASTRO RECOMENDADO**

### **PASSO 1: PREPARAÇÃO**
```
1. Configure WordPress (SSL, API, Plugin)
2. Teste conectividade: https://site.com/wp-json
3. Gere token de autenticação
4. Anote credenciais para uso no CMS
```

### **PASSO 2: CMS - ORGANIZAÇÃO**
```
1. Login como ADMIN no CMS
2. Criar organização
3. Configurar tema e idioma
4. Salvar e verificar criação
```

### **PASSO 3: CMS - SITE**
```
1. Selecionar organização criada
2. Criar site com dados do WordPress
3. Configurar API e credenciais
4. Testar conexão
5. Ativar site
```

### **PASSO 4: CMS - USUÁRIOS**
```
1. Criar usuários para a organização
2. Definir roles (Admin/Editor/Viewer)
3. Vincular sites de acesso
4. Testar login dos usuários
```

### **PASSO 5: TESTE COMPLETO**
```
1. Login com diferentes usuários
2. Verificar isolamento por site
3. Testar funcionalidades
4. Validar permissões
```

---

## 🔐 **SISTEMA DE PERMISSÕES**

### **NÍVEIS DE USUÁRIO:**

#### **ADMIN:**
- ✅ Criar/editar/deletar organizações
- ✅ Criar/editar/deletar sites
- ✅ Gerenciar todos os usuários
- ✅ Acesso a todos os sites
- ✅ Configurações do sistema

#### **EDITOR:**
- ❌ Não pode criar organizações
- ❌ Não pode criar sites
- ✅ Pode criar usuários em sua organização
- ✅ Acesso aos sites de sua organização
- ✅ Gerenciar conteúdo dos sites

#### **VIEWER:**
- ❌ Não pode criar nada
- ✅ Apenas visualizar sites de sua organização
- ✅ Acesso limitado a funcionalidades

### **ISOLAMENTO POR ORGANIZAÇÃO:**
- Usuários só veem dados de sua organização
- Sites são filtrados por organização
- Conteúdo é isolado por organização

---

## 🏝️ **ISOLAMENTO POR SITE**

### **COMPORTAMENTO PADRÃO:**
- ✅ **Dados isolados**: Cada site mostra apenas seus dados
- ✅ **Conteúdo separado**: Páginas, posts, mídia por site
- ✅ **Configurações independentes**: Cada site tem suas configurações
- ✅ **Usuários específicos**: Acesso apenas aos sites permitidos

### **IMPLEMENTAÇÃO:**
```typescript
// Exemplo de como o sistema funciona
const currentSite = useSite() // Site selecionado
const siteData = await getSiteData(currentSite.id) // Dados apenas deste site
const siteContent = await getSiteContent(currentSite.id) // Conteúdo apenas deste site
```

### **FILTROS AUTOMÁTICOS:**
- **Páginas**: Apenas páginas do site selecionado
- **Posts**: Apenas posts do site selecionado
- **Mídia**: Apenas mídia do site selecionado
- **Usuários**: Apenas usuários com acesso ao site
- **Configurações**: Apenas configurações do site

---

## 🛠️ **TROUBLESHOOTING**

### **PROBLEMAS COMUNS:**

#### **1. Erro de Conexão WordPress:**
```
Sintoma: "Erro ao conectar com WordPress"
Solução:
- Verificar URL da API: https://site.com/wp-json
- Verificar credenciais (usuário/senha)
- Verificar CORS no WordPress
- Testar conectividade manual
```

#### **2. Erro de Permissão:**
```
Sintoma: "Acesso negado" ou botões desabilitados
Solução:
- Verificar role do usuário (Admin/Editor/Viewer)
- Verificar se usuário tem acesso ao site
- Verificar organização do usuário
```

#### **3. Dados Misturados:**
```
Sintoma: Dados de sites diferentes aparecem juntos
Solução:
- Verificar se site está selecionado
- Verificar filtros por site
- Verificar contexto de organização
```

#### **4. Plugin WordPress não funciona:**
```
Sintoma: Plugin Pressel não responde
Solução:
- Verificar se plugin está ativo
- Verificar logs do WordPress
- Verificar permissões do plugin
- Testar API manualmente
```

### **COMANDOS DE DIAGNÓSTICO:**

#### **Testar API WordPress:**
```bash
curl -X GET "https://seusite.com/wp-json" \
  -H "Authorization: Basic [base64(user:password)]"
```

#### **Verificar CORS:**
```bash
curl -X OPTIONS "https://seusite.com/wp-json" \
  -H "Origin: http://localhost:3002"
```

#### **Testar Autenticação:**
```bash
curl -X GET "https://seusite.com/wp-json/wp/v2/posts" \
  -H "Authorization: Basic [base64(user:password)]"
```

---

## 📞 **SUPORTE**

### **Para problemas técnicos:**
1. Verificar logs do sistema
2. Testar conectividade
3. Verificar configurações
4. Consultar este guia

### **Para novos sites:**
1. Seguir fluxo de cadastro
2. Configurar WordPress primeiro
3. Testar conexão
4. Cadastrar no CMS

### **Para usuários:**
1. Verificar permissões
2. Verificar organização
3. Verificar sites de acesso
4. Contatar administrador

---

## 🎯 **RESUMO EXECUTIVO**

### **FLUXO IDEAL:**
1. **WordPress** → Configurar API, Plugin, Autenticação
2. **CMS** → Criar Organização (ADMIN)
3. **CMS** → Criar Sites (ADMIN)
4. **CMS** → Criar Usuários (ADMIN/EDITOR)
5. **Teste** → Verificar isolamento e permissões

### **PONTOS CRÍTICOS:**
- ✅ **Isolamento**: Cada site é independente
- ✅ **Permissões**: Apenas ADMIN cria organizações/sites
- ✅ **Hierarquia**: Organização → Sites → Usuários
- ✅ **Segurança**: Autenticação e CORS configurados

### **RESULTADO FINAL:**
- 🏢 **Organizações** estruturadas
- 🌐 **Sites** conectados e isolados
- 👥 **Usuários** com permissões específicas
- 🔒 **Sistema** seguro e escalável

---

**🎉 Sistema CMS Moderno - Configuração Completa e Funcional!** 🚀




