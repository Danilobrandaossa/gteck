# 🔧 **GUIA COMPLETO DE CONFIGURAÇÃO WORDPRESS** 🔧

## **📋 INFORMAÇÕES NECESSÁRIAS PARA INTEGRAÇÃO**

Para que o CMS funcione corretamente com seu site WordPress, você precisa fornecer **TODAS** as informações abaixo:

### **🌐 1. INFORMAÇÕES BÁSICAS DO SITE**
- **Nome do Site**: Ex: "Meu Blog"
- **URL do Site**: Ex: "https://meusite.com.br"
- **URL do WordPress**: Ex: "https://meusite.com.br" (geralmente a mesma URL)

### **🔐 2. CREDENCIAIS DE ACESSO**
- **Usuário WordPress**: Seu nome de usuário no WordPress
- **Senha do Usuário**: Sua senha de login no WordPress
- **Senha de Aplicação** (Opcional): Para maior segurança

### **⚙️ 3. CONFIGURAÇÕES ADICIONAIS NECESSÁRIAS**

#### **A. REST API HABILITADA**
- ✅ **Verificar**: WordPress Admin → Configurações → Permalinks
- ✅ **Permalinks**: Deve estar em "Nome do post" ou "Estrutura personalizada"
- ✅ **URL de teste**: `https://seusite.com/wp-json/wp/v2/`

#### **B. AUTENTICAÇÃO BÁSICA**
- ✅ **Plugin recomendado**: "Application Passwords" (WordPress 5.6+)
- ✅ **Ou**: "Basic Auth" plugin para versões antigas
- ✅ **Ou**: Configuração manual no `.htaccess`

#### **C. PERMISSÕES DE USUÁRIO**
- ✅ **Role**: Editor ou Administrador
- ✅ **Capabilities**: `edit_posts`, `edit_pages`, `upload_files`

---

## **🚀 COMO CONFIGURAR PASSO A PASSO**

### **PASSO 1: VERIFICAR REST API**
1. Acesse: `https://seusite.com/wp-json/wp/v2/`
2. Deve retornar JSON com informações da API
3. Se não funcionar, ative permalinks no WordPress

### **PASSO 2: CONFIGURAR AUTENTICAÇÃO**

#### **Opção A: Application Passwords (Recomendado)**
1. WordPress Admin → Usuários → Seu Perfil
2. Role até "Application Passwords"
3. Nome: "CMS Integration"
4. Clique "Add New Application Password"
5. **COPIE A SENHA GERADA** (aparece apenas uma vez)

#### **Opção B: Plugin Basic Auth**
1. Instale plugin "Application Passwords" ou "Basic Auth"
2. Configure conforme instruções do plugin
3. Teste com suas credenciais

### **PASSO 3: TESTAR CONEXÃO**
1. No CMS, vá em "Configurações" → "Sites"
2. Adicione seu site com todas as informações
3. Clique "Testar Conexão"
4. Deve retornar "✅ Conexão bem-sucedida"

### **PASSO 4: SINCRONIZAR DADOS REAIS**
1. Clique "Sincronizar" no site configurado
2. O CMS irá buscar dados reais do WordPress
3. Verifique se os números correspondem ao seu site

---

## **🔍 DIAGNÓSTICO DE PROBLEMAS**

### **❌ ERRO: "HTTP 401: Unauthorized"**
**Causa**: Credenciais incorretas ou autenticação não configurada
**Solução**:
- Verifique usuário e senha
- Configure Application Passwords
- Teste login manual no WordPress

### **❌ ERRO: "HTTP 404: Not Found"**
**Causa**: REST API não habilitada ou URL incorreta
**Solução**:
- Verifique se a URL está correta
- Ative permalinks no WordPress
- Teste: `https://seusite.com/wp-json/wp/v2/`

### **❌ ERRO: "CORS" ou "Blocked"**
**Causa**: Políticas de segurança do servidor
**Solução**:
- Configure CORS no servidor
- Use plugin "CORS" no WordPress
- Verifique configurações do servidor

### **❌ ERRO: "Connection Refused"**
**Causa**: Site inacessível ou URL incorreta
**Solução**:
- Verifique se o site está online
- Teste a URL no navegador
- Verifique firewall/proxy

---

## **✅ CHECKLIST DE CONFIGURAÇÃO**

### **ANTES DE COMEÇAR:**
- [ ] Site WordPress está online e acessível
- [ ] Você tem acesso de administrador
- [ ] Permalinks estão configurados
- [ ] REST API está funcionando

### **CONFIGURAÇÃO NO CMS:**
- [ ] Nome do site preenchido
- [ ] URL do site correta (com https://)
- [ ] URL do WordPress correta
- [ ] Usuário WordPress correto
- [ ] Senha/Application Password correta
- [ ] Teste de conexão bem-sucedido
- [ ] Sincronização executada
- [ ] Dados reais exibidos

### **VERIFICAÇÃO FINAL:**
- [ ] Números de posts/páginas/mídia correspondem ao site real
- [ ] Data de sincronização atualizada
- [ ] Status "Conectado" exibido
- [ ] Diagnóstico WordPress sem erros

---

## **🆘 SUPORTE TÉCNICO**

### **SE AINDA NÃO FUNCIONAR:**

1. **Acesse**: `/wordpress-diagnostic` no CMS
2. **Execute** o diagnóstico completo
3. **Verifique** todos os testes
4. **Copie** os erros exibidos
5. **Entre em contato** com o suporte técnico

### **INFORMAÇÕES PARA SUPORTE:**
- URL do site WordPress
- Versão do WordPress
- Plugins instalados
- Erros exibidos no diagnóstico
- Screenshots dos problemas

---

## **🎯 RESULTADO ESPERADO**

Após configuração correta, você deve ver:
- ✅ **Status**: "Conectado" (verde)
- ✅ **Dados reais**: Números corretos de posts/páginas/mídia
- ✅ **Sincronização**: Data atualizada
- ✅ **Diagnóstico**: Todos os testes passando

**🚀 Agora seu CMS está integrado com dados reais do WordPress!** 🚀

