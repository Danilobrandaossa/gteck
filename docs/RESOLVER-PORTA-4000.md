# 🔧 Resolver Problema: Porta 4000 em Uso

## ✅ Status Atual
- ✅ `OPENAI_API_KEY` configurada no `.env.local`
- ⚠️ Porta 4000 está em uso pelo processo PID 1036

---

## 🎯 SOLUÇÃO RÁPIDA

### Opção 1: Testar se Servidor Já Está Rodando (Recomendado)

O servidor pode já estar rodando! Teste primeiro:

```powershell
# Testar se o endpoint está respondendo
Invoke-WebRequest -Uri "http://localhost:4000/api/health" -Method GET
```

**Se funcionar:** O servidor já está rodando! Pode testar o gerador de criativos diretamente.

**Se não funcionar:** Continue com Opção 2.

---

### Opção 2: Matar Processo e Reiniciar

**Passo 1: Encontrar e matar o processo**
```powershell
# Ver processos na porta 4000
netstat -ano | findstr :4000

# Matar processo específico (substitua PID pelo número encontrado)
taskkill /PID 1036 /F

# Ou matar todos os processos Node na porta 4000
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

**Passo 2: Reiniciar servidor**
```powershell
npm run dev
```

---

### Opção 3: Usar Outra Porta (Alternativa)

Se não conseguir matar o processo, use outra porta:

**1. Editar `package.json`:**
```json
"scripts": {
  "dev": "next dev -p 3000 -H 0.0.0.0"
}
```

**2. Reiniciar:**
```powershell
npm run dev
```

**3. Testar em:**
```
http://localhost:3000/api/creative/generate
```

---

## 🧪 TESTE RÁPIDO DO GERADOR

Depois que o servidor estiver rodando, teste:

```powershell
$body = @{
    productName = "Curso de Marketing Digital"
    tone = "professional"
    platform = "facebook"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/creative/generate" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

---

## 📝 COMANDOS ÚTEIS (PowerShell)

```powershell
# Verificar se porta está em uso
netstat -ano | findstr :4000

# Ver processos Node rodando
Get-Process -Name node

# Matar todos processos Node
Get-Process -Name node | Stop-Process -Force

# Verificar variável de ambiente
Get-Content .env.local | Select-String "OPENAI_API_KEY"

# Testar endpoint
Invoke-WebRequest -Uri "http://localhost:4000/api/health" -Method GET
```

---

## ✅ PRÓXIMO PASSO

1. Testar se servidor já está rodando (Opção 1)
2. Se não estiver, matar processo e reiniciar (Opção 2)
3. Testar gerador de criativos






