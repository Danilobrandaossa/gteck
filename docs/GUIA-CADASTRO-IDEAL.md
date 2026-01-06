# 🎯 GUIA DE CADASTRO IDEAL - CMS MODERNO

## 📋 **PROCESSO ESTRUTURADO SEM ERROS**

### **🎯 ORDEM CORRETA DE CADASTRO:**

```
1. ORGANIZAÇÃO → 2. SITE → 3. USUÁRIO → 4. TESTES
```

---

## **1️⃣ PRIMEIRO: CADASTRO DA ORGANIZAÇÃO**

### **📍 Acesse:** `http://localhost:3002/settings?tab=organizations`

### **📝 Dados da Organização:**
```
Nome: Gteck
Slug: gteck
Descrição: Organização principal para testes
Logo: (opcional)
Tema: Padrão
Idioma: Português (pt-BR)
```

### **✅ Verificações:**
- [ ] Organização aparece na lista
- [ ] Contadores mostram "0 Sites", "0 Usuários", "0 Páginas"
- [ ] Botões "Sites", "Usuários", "Configurações" funcionam

---

## **2️⃣ SEGUNDO: CADASTRO DO SITE**

### **📍 Acesse:** `http://localhost:3002/sites`

### **📝 Dados do Site ATLZ:**
```
Nome: ATLZ
URL: https://atlz.online
WordPress URL: https://atlz.online
WordPress Usuário: daniillobrandao@gmail.com
WordPress API Key: N1z4 1lLm 1Xd4 lZzQ Xnat gdmh
Organização: Gteck (selecionar)
Descrição: Site principal para testes
```

### **✅ Verificações:**
- [ ] Site aparece na lista
- [ ] Site está vinculado à organização Gteck
- [ ] Filtro por organização funciona
- [ ] Botão "Verificar Sites Não Associados" funciona

---

## **3️⃣ TERCEIRO: CADASTRO DO USUÁRIO**

### **📍 Acesse:** `http://localhost:3002/users`

### **📝 Dados do Usuário:**
```
Nome: Admin Teste
Email: admin@teste.com
Senha: 123456
Função: admin
Organização: Gteck
Sites: ATLZ (selecionar)
```

### **✅ Verificações:**
- [ ] Usuário aparece na lista
- [ ] Usuário está vinculado à organização Gteck
- [ ] Usuário tem acesso ao site ATLZ
- [ ] Permissões funcionam corretamente

---

## **4️⃣ QUARTO: TESTES DE FUNCIONALIDADES**

### **🔍 TESTE 1: SELEÇÃO DE ORGANIZAÇÃO**
- [ ] Acesse: `http://localhost:3002/settings`
- [ ] Selecione organização "Gteck"
- [ ] Verifique se contadores atualizam
- [ ] Teste botão "Sincronizar"

### **🔍 TESTE 2: FILTRO POR SITE**
- [ ] Acesse: `http://localhost:3002/sites`
- [ ] Verifique se apenas sites da Gteck aparecem
- [ ] Teste criação de novo site
- [ ] Verifique vinculação automática

### **🔍 TESTE 3: MÍDIAS WORDPRESS**
- [ ] Acesse: `http://localhost:3002/media`
- [ ] Selecione site ATLZ
- [ ] Clique em "Atualizar" para sincronizar
- [ ] Verifique se mídias do WordPress aparecem

### **🔍 TESTE 4: DIAGNÓSTICO WORDPRESS**
- [ ] Acesse: `http://localhost:3002/wordpress-diagnostic`
- [ ] Selecione site ATLZ
- [ ] Execute diagnóstico completo
- [ ] Verifique relatórios e sugestões

### **🔍 TESTE 5: PRESSEL AUTOMATION**
- [ ] Acesse: `http://localhost:3002/pressel`
- [ ] Selecione site ATLZ
- [ ] Teste criação de página
- [ ] Verifique integração com WordPress

### **🔍 TESTE 6: PÁGINAS**
- [ ] Acesse: `http://localhost:3002/pages`
- [ ] Verifique se páginas do WordPress aparecem
- [ ] Teste criação de nova página
- [ ] Verifique sincronização

---

## **5️⃣ QUINTO: VERIFICAÇÃO FINAL**

### **🎯 CHECKLIST COMPLETO:**

#### **✅ ORGANIZAÇÃO:**
- [ ] Gteck cadastrada e ativa
- [ ] Contadores funcionando
- [ ] Sincronização WordPress OK

#### **✅ SITE:**
- [ ] ATLZ cadastrado e vinculado
- [ ] Credenciais WordPress corretas
- [ ] Filtro por organização funcionando

#### **✅ USUÁRIO:**
- [ ] Admin cadastrado e ativo
- [ ] Permissões corretas
- [ ] Acesso ao site ATLZ

#### **✅ FUNCIONALIDADES:**
- [ ] Mídias sincronizando
- [ ] Diagnóstico funcionando
- [ ] Pressel Automation ativo
- [ ] Páginas sincronizando

---

## **🚨 PONTOS CRÍTICOS DE ATENÇÃO:**

### **⚠️ ANTES DE CADASTRAR:**
1. **Verifique se o sistema está limpo**
2. **Confirme que não há dados antigos**
3. **Teste conectividade WordPress**

### **⚠️ DURANTE O CADASTRO:**
1. **Sempre selecione a organização correta**
2. **Verifique credenciais WordPress**
3. **Teste cada funcionalidade após cadastro**

### **⚠️ APÓS CADASTRO:**
1. **Execute todos os testes**
2. **Verifique sincronização**
3. **Confirme integração completa**

---

## **🔧 SOLUÇÃO DE PROBLEMAS:**

### **❌ PROBLEMA: Site não aparece**
**✅ SOLUÇÃO:** Verificar vinculação à organização

### **❌ PROBLEMA: Mídias não sincronizam**
**✅ SOLUÇÃO:** Verificar credenciais WordPress

### **❌ PROBLEMA: Diagnóstico falha**
**✅ SOLUÇÃO:** Testar conectividade WordPress

### **❌ PROBLEMA: Pressel não funciona**
**✅ SOLUÇÃO:** Verificar configuração do site

---

## **📊 RESULTADO ESPERADO:**

### **🎯 APÓS SEGUIR ESTE GUIA:**
- ✅ Sistema completamente funcional
- ✅ Todas as integrações ativas
- ✅ Dados sincronizando corretamente
- ✅ Funcionalidades testadas e aprovadas

### **🚀 PRÓXIMOS PASSOS:**
1. **Sistema pronto para produção**
2. **Todos os módulos funcionando**
3. **Integração WordPress completa**
4. **CMS estável e confiável**

---

## **💡 DICAS IMPORTANTES:**

1. **SEMPRE** siga a ordem: Organização → Site → Usuário
2. **SEMPRE** teste cada funcionalidade após cadastro
3. **SEMPRE** verifique sincronização WordPress
4. **SEMPRE** confirme vinculações corretas

**Este guia garante um cadastro sem erros e funcionalidades 100% operacionais!** 🎉



