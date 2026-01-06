# 🔍 Debug: Página /criativos não abre

**Data:** 2025-01-27  
**Problema:** `http://localhost:5000/criativos` não abre

---

## 🎯 DIAGNÓSTICO

A página `/criativos` está protegida por autenticação (`ProtectedRoute`). Se você não estiver autenticado, será redirecionado automaticamente para `/auth/login`.

---

## ✅ SOLUÇÕES

### 1. Verificar se está autenticado

**Passo 1:** Acesse primeiro a página de login:
```
http://localhost:5000/auth/login
```

**Passo 2:** Faça login com suas credenciais

**Passo 3:** Depois acesse `/criativos`

---

### 2. Verificar Console do Navegador

Abra o DevTools (F12) e verifique:
- **Console:** Erros JavaScript?
- **Network:** Requisições falhando?
- **Application > Local Storage:** Existe `cms_auth_token`?

---

### 3. Verificar Redirecionamento

Se você acessar `/criativos` sem estar autenticado:
- ✅ **Comportamento esperado:** Redireciona para `/auth/login`
- ❌ **Se não redireciona:** Problema no `ProtectedRoute`

---

### 4. Testar Autenticação Manual

No console do navegador (F12), execute:
```javascript
// Verificar se há token
localStorage.getItem('cms_auth_token')

// Se não houver, você precisa fazer login
```

---

## 🔧 POSSÍVEIS PROBLEMAS

### Problema 1: AuthContext não carregou
**Sintoma:** Página fica em "Carregando..." infinitamente

**Solução:**
1. Verificar se `contexts/auth-context.tsx` existe
2. Verificar se está sendo importado corretamente
3. Limpar cache do navegador (Ctrl+Shift+Delete)

### Problema 2: Redirecionamento não funciona
**Sintoma:** Página fica em branco

**Solução:**
1. Verificar se `next/navigation` está funcionando
2. Verificar se há erros no console

### Problema 3: Token expirado
**Sintoma:** Redireciona para login mesmo após login

**Solução:**
1. Fazer logout e login novamente
2. Limpar localStorage e tentar novamente

---

## 📝 CHECKLIST DE DEBUG

- [ ] Acessar `http://localhost:5000/auth/login`
- [ ] Fazer login com credenciais válidas
- [ ] Verificar se redireciona para `/dashboard`
- [ ] Acessar `http://localhost:5000/criativos`
- [ ] Verificar console do navegador (F12)
- [ ] Verificar Network tab para requisições
- [ ] Verificar Local Storage para token

---

## 🚀 TESTE RÁPIDO

1. **Abrir navegador em modo anônimo**
2. **Acessar:** `http://localhost:5000/criativos`
3. **Resultado esperado:** Redireciona para `/auth/login`
4. **Fazer login**
5. **Resultado esperado:** Redireciona para `/criativos` ou `/dashboard`

---

**Última atualização:** 2025-01-27



