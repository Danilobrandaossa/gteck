# 🔧 Resolver Erro 403 Forbidden - OpenAI API

## ❌ Erro Encontrado
```
Erro ao gerar copy via IA: Erro na API OpenAI: OpenAI API error: 403 Forbidden
```

## 🔍 Possíveis Causas

### 1. API Key Inválida ou Expirada
- API key foi revogada
- API key expirou
- API key está incorreta

### 2. Modelo Não Disponível
- Conta não tem acesso ao modelo `gpt-4o-mini`
- Modelo requer plano pago
- Modelo foi descontinuado

### 3. Conta Sem Créditos
- Saldo da conta OpenAI esgotado
- Limite de uso atingido
- Conta suspensa

### 4. Permissões Insuficientes
- API key não tem permissão para usar o modelo
- Organização bloqueou o acesso

---

## ✅ SOLUÇÕES

### Solução 1: Verificar API Key

**1. Verificar se a key está correta:**
```powershell
# Ver conteúdo do .env.local
Get-Content .env.local | Select-String "OPENAI_API_KEY"
```

**2. Testar API key diretamente:**
```powershell
$headers = @{
    "Authorization" = "Bearer sua-api-key-aqui"
    "Content-Type" = "application/json"
}

$body = @{
    model = "gpt-3.5-turbo"
    messages = @(
        @{
            role = "user"
            content = "Teste"
        }
    )
    max_tokens = 10
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.openai.com/v1/chat/completions" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

**3. Gerar nova API key:**
- Acessar: https://platform.openai.com/api-keys
- Criar nova key
- Atualizar no `.env.local`

### Solução 2: Usar Modelo Alternativo

O código já tem fallback automático para `gpt-3.5-turbo`, mas você pode forçar:

**Editar `lib/creative-generator.ts`:**
```typescript
// Linha ~217, mudar de:
model: 'gpt-4o-mini',

// Para:
model: 'gpt-3.5-turbo',
```

### Solução 3: Verificar Créditos da Conta

1. Acessar: https://platform.openai.com/usage
2. Verificar saldo disponível
3. Adicionar créditos se necessário

### Solução 4: Verificar Permissões da Organização

1. Acessar: https://platform.openai.com/org-settings
2. Verificar se há restrições de modelo
3. Verificar se API keys estão habilitadas

---

## 🧪 TESTE RÁPIDO

**Teste 1: Verificar se API key funciona:**
```powershell
# Substituir SUA_API_KEY pela key do .env.local
$apiKey = "sk-proj-..."
$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

$body = '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"teste"}],"max_tokens":10}'

Invoke-RestMethod -Uri "https://api.openai.com/v1/chat/completions" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

**Se funcionar:** API key está OK, problema pode ser com o modelo específico.

**Se não funcionar:** API key está inválida ou sem créditos.

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Verificar API key no `.env.local`
2. ✅ Testar API key diretamente
3. ✅ Verificar créditos na conta OpenAI
4. ✅ Tentar modelo alternativo (`gpt-3.5-turbo`)
5. ✅ Gerar nova API key se necessário

---

## 🔄 Após Corrigir

**Reiniciar servidor:**
```powershell
# Parar servidor (Ctrl+C)
# Reiniciar
npm run dev
```

**Testar novamente:**
```powershell
.\scripts\test-creative-api.ps1
```






