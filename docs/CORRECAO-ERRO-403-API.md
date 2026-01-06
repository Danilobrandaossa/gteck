# ✅ CORREÇÃO: Erro 403 (Forbidden) nas APIs

**Data:** 2025-01-27  
**Problema:** `POST /api/creative/analyze-image` e `/api/creative/performance` retornando 403

---

## 🎯 PROBLEMA IDENTIFICADO

O middleware estava configurado para permitir apenas `http://localhost:4000`, mas o servidor está rodando na porta **5000**. Quando o frontend faz requisições de `http://localhost:5000`, o middleware bloqueia porque a origem não está na lista de permitidas.

---

## ✅ CORREÇÕES APLICADAS

### 1. Atualizado `middleware.ts`

**Antes:**
```typescript
const DEFAULT_ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:4000')
```

**Depois:**
```typescript
const DEFAULT_ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:4000,http://localhost:5000')
```

### 2. Melhorada lógica CSRF para localhost

Adicionada verificação especial para requisições same-origin em localhost:

```typescript
// Para localhost, permitir requisições same-origin mesmo sem origin header
if (request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1') {
  const port = request.nextUrl.port || (request.nextUrl.protocol === 'https:' ? '443' : '80')
  const localhostOrigin = `${request.nextUrl.protocol}//${request.nextUrl.hostname}:${port}`
  if (isAllowedOrigin(localhostOrigin)) {
    return true
  }
}
```

### 3. Atualizado `env.example`

Adicionada porta 5000 nas origens permitidas:
```
ALLOWED_ORIGINS="http://localhost:4000,http://localhost:5000"
```

---

## 🔄 PRÓXIMOS PASSOS

**⚠️ IMPORTANTE:** O servidor precisa ser **reiniciado** para aplicar as mudanças!

1. **Parar o servidor:**
   - Pressione `Ctrl+C` no terminal onde está rodando `npm run dev`

2. **Reiniciar o servidor:**
   ```powershell
   npm run dev
   ```

3. **Aguardar compilação:**
   - Aguarde aparecer `✓ Ready in X.Xs`

4. **Testar novamente:**
   - Acesse `http://localhost:5000/criativos`
   - Tente gerar criativos novamente

---

## ✅ RESULTADO ESPERADO

Após reiniciar o servidor:
- ✅ Requisições de `http://localhost:5000` serão permitidas
- ✅ APIs `/api/creative/*` funcionarão corretamente
- ✅ Erro 403 não deve mais aparecer

---

**Última atualização:** 2025-01-27



