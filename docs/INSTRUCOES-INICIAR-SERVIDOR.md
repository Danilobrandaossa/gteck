# 🚀 Instruções: Iniciar Servidor na Porta 5000

**Data:** 2025-01-27

---

## ⚠️ PROBLEMA: ERR_CONNECTION_REFUSED

O erro `ERR_CONNECTION_REFUSED` significa que o servidor **não está rodando** ou **não está respondendo** na porta 5000.

---

## ✅ SOLUÇÃO: Iniciar o Servidor Manualmente

### Passo 1: Abrir Terminal PowerShell

1. Abra o PowerShell ou Terminal
2. Navegue até a pasta do projeto:
   ```powershell
   cd "C:\Users\ueles\OneDrive\Área de Trabalho\CMS"
   ```

### Passo 2: Parar Processos Node.js (se houver)

```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Passo 3: Iniciar o Servidor

```powershell
npm run dev
```

### Passo 4: Aguardar Compilação

Você deve ver no terminal:
```
▲ Next.js 14.2.33
- Local:        http://localhost:5000
- Network:      http://0.0.0.0:5000

✓ Starting...
✓ Ready in X.Xs
```

**⚠️ IMPORTANTE:** Aguarde até aparecer `✓ Ready` antes de tentar acessar no navegador!

---

## 🔍 VERIFICAÇÃO

### 1. Verificar se o servidor está rodando

No terminal, você deve ver:
- `✓ Ready in X.Xs`
- Sem erros em vermelho

### 2. Testar no navegador

1. Abra o navegador
2. Acesse: `http://localhost:5000`
3. Deve redirecionar para `/dashboard` ou mostrar a página inicial

### 3. Acessar página de criativos

Depois que o servidor estiver rodando:
1. Acesse: `http://localhost:5000/criativos`
2. Se não estiver autenticado, será redirecionado para `/auth/login`
3. Faça login e tente novamente

---

## 🐛 PROBLEMAS COMUNS

### Problema 1: Porta 5000 já em uso

**Erro:** `Port 5000 is already in use`

**Solução:**
```powershell
# Encontrar processo usando a porta 5000
netstat -ano | findstr ":5000"

# Parar o processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F
```

### Problema 2: Erro de compilação

**Sintoma:** Terminal mostra erros em vermelho

**Solução:**
1. Verifique os erros no terminal
2. Corrija os erros mostrados
3. Reinicie o servidor

### Problema 3: Servidor não inicia

**Sintoma:** Nada acontece ao executar `npm run dev`

**Solução:**
```powershell
# Verificar se Node.js está instalado
node --version

# Verificar se npm está funcionando
npm --version

# Limpar cache e reinstalar dependências (se necessário)
npm cache clean --force
npm install
```

---

## 📝 CHECKLIST

- [ ] Terminal aberto na pasta correta
- [ ] Processos Node.js anteriores parados
- [ ] Executou `npm run dev`
- [ ] Aguardou aparecer `✓ Ready`
- [ ] Testou `http://localhost:5000` no navegador
- [ ] Servidor está respondendo

---

## 🆘 SE AINDA NÃO FUNCIONAR

1. **Copie os erros do terminal** e me envie
2. **Verifique se a porta 5000 está livre:**
   ```powershell
   netstat -ano | findstr ":5000"
   ```
3. **Tente uma porta diferente** (edite `package.json`):
   ```json
   "dev": "next dev -p 5001 -H 0.0.0.0"
   ```

---

**Última atualização:** 2025-01-27



