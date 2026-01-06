# 🧪 GUIA DE TESTE LOCAL - GERADOR DE CRIATIVOS

**Ambiente:** Desenvolvimento Local  
**Servidor:** `http://localhost:4000`

---

## 📋 PRÉ-REQUISITOS

### 1. Verificar Variáveis de Ambiente

**Arquivo:** `.env.local` (na raiz do projeto)

```bash
# Verificar se o arquivo existe
ls -la .env.local

# Ou no Windows PowerShell
Test-Path .env.local
```

**Se não existir, criar:**
```bash
# Copiar do exemplo
cp env.example .env.local

# Ou criar manualmente
touch .env.local
```

**Conteúdo mínimo necessário:**
```env
OPENAI_API_KEY="sk-sua-chave-openai-aqui"
DATABASE_URL="postgresql://cms_user:cms_password@localhost:5433/cms_modern"
NEXTAUTH_URL="http://localhost:4000"
NEXTAUTH_SECRET="seu-secret-aqui"
```

### 2. Verificar se Servidor Está Rodando

```bash
# Iniciar servidor (se não estiver rodando)
npm run dev

# Deve aparecer:
# ▲ Next.js 14.0.4
# - Local:        http://localhost:4000
```

---

## 🧪 TESTE 1: Script de Teste Local

### Executar Script
```bash
# No terminal, na raiz do projeto
npx tsx scripts/test-creative-generator.ts
```

**O que vai acontecer:**
1. ✅ Verifica se `OPENAI_API_KEY` está configurada
2. ✅ Testa validação de briefing inválido
3. ✅ Testa geração de imagePrompt
4. ✅ Testa integração completa (se API key válida)

**Saída esperada:**
```
🧪 Iniciando testes do Creative Generator...

✅ OPENAI_API_KEY configurada

📋 Teste 1: Validação de Briefing
✅ Validação funcionando - conteúdo proibido detectado
   Motivo: Briefing contém conteúdo proibido: violência

🖼️  Teste 2: Geração de ImagePrompt
✅ ImagePrompt gerado:
   Curso de Marketing Digital, estilo minimalista, cores vibrantes, iluminação clara, formato vertical, otimizado para feed, alta qualidade, sem texto sobreposto, foco no produto

🤖 Teste 3: Integração com AIService
   Gerando criativo...
✅ Criativo gerado com sucesso!
```

---

## 🧪 TESTE 2: Teste via API HTTP Local

### Passo 1: Iniciar Servidor
```bash
npm run dev
```

**Aguardar mensagem:**
```
✓ Ready in 2.3s
○ Local:        http://localhost:4000
```

### Passo 2: Fazer Requisição

**Opção A: Usando curl (Terminal/PowerShell)**
```bash
curl -X POST http://localhost:4000/api/creative/generate \
  -H "Content-Type: application/json" \
  -d "{\"productName\": \"Curso de Marketing Digital\", \"tone\": \"professional\", \"platform\": \"facebook\"}"
```

**Opção B: Usando PowerShell (Windows)**
```powershell
$body = @{
    productName = "Curso de Marketing Digital"
    productDescription = "Aprenda marketing digital do zero"
    targetAudience = "Empreendedores iniciantes"
    keyBenefits = @("Certificado válido", "Acesso vitalício")
    tone = "professional"
    platform = "facebook"
    maxLength = 200
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/creative/generate" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Opção C: Usando Postman/Insomnia**
- **Method:** POST
- **URL:** `http://localhost:4000/api/creative/generate`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "productName": "Curso de Marketing Digital",
  "productDescription": "Aprenda marketing digital do zero",
  "targetAudience": "Empreendedores iniciantes",
  "keyBenefits": ["Certificado válido", "Acesso vitalício"],
  "tone": "professional",
  "platform": "facebook",
  "maxLength": 200
}
```

### Resposta Esperada (Sucesso)
```json
{
  "status": "success",
  "copy": "Transforme sua carreira com nosso Curso de Marketing Digital. Aprenda estratégias comprovadas e ganhe um certificado reconhecido. Acesso vitalício para você estudar no seu ritmo. Comece agora!",
  "imagePrompt": "Curso de Marketing Digital, estilo clean e profissional, formato vertical, otimizado para feed, alta qualidade, sem texto sobreposto, foco no produto",
  "metadata": {
    "characterCount": 180,
    "tone": "professional",
    "platform": "facebook"
  }
}
```

### Resposta Esperada (Erro - API Key não configurada)
```json
{
  "status": "failed",
  "failureReason": "OpenAI API key não configurada"
}
```

---

## 🧪 TESTE 3: Teste com Referências Visuais

**Request:**
```json
{
  "productName": "Curso de Programação",
  "productDescription": "Aprenda programação do zero",
  "platform": "instagram",
  "imageReferences": [
    {
      "url": "https://example.com/style.jpg",
      "role": "style",
      "description": "estilo minimalista, cores vibrantes, iluminação clara"
    },
    {
      "url": "https://example.com/product.jpg",
      "role": "produto",
      "description": "notebook com código na tela"
    }
  ]
}
```

**O imagePrompt gerado deve incluir as características das referências.**

---

## 🔍 VERIFICAÇÃO DE PROBLEMAS COMUNS

### Problema: "OpenAI API key não configurada"

**Verificar:**
```bash
# Ver conteúdo do .env.local
cat .env.local

# Ou no Windows
type .env.local
```

**Solução:**
1. Adicionar `OPENAI_API_KEY` no `.env.local`
2. **Reiniciar o servidor** (importante!)
3. Testar novamente

### Problema: "Cannot find module" ao executar script

**Solução:**
```bash
# Instalar dependências
npm install

# Executar novamente
npx tsx scripts/test-creative-generator.ts
```

### Problema: Servidor não inicia na porta 4000

**Verificar:**
```bash
# Ver se porta está em uso
netstat -ano | findstr :4000

# Ou mudar porta no package.json
# "dev": "next dev -p 3000"
```

### Problema: Erro de CORS ou conexão

**Solução:** Isso não deve acontecer em ambiente local, mas se acontecer:
- Verificar se está usando `http://localhost:4000` (não `127.0.0.1`)
- Verificar se servidor está realmente rodando

---

## 📝 CHECKLIST RÁPIDO

Antes de testar, confirme:

- [ ] `.env.local` existe na raiz do projeto
- [ ] `OPENAI_API_KEY` está configurada no `.env.local`
- [ ] Servidor está rodando (`npm run dev`)
- [ ] Servidor responde em `http://localhost:4000`
- [ ] Request tem `productName` no body
- [ ] Content-Type é `application/json`

---

## 🎯 TESTE RÁPIDO (1 minuto)

```bash
# 1. Verificar API key
cat .env.local | grep OPENAI_API_KEY

# 2. Iniciar servidor (se não estiver)
npm run dev

# 3. Em outro terminal, testar
curl -X POST http://localhost:4000/api/creative/generate \
  -H "Content-Type: application/json" \
  -d '{"productName":"Teste","tone":"professional"}'
```

**Se retornar JSON com `status: "success"`, está funcionando! ✅**

---

## 📊 PRÓXIMOS PASSOS

1. ✅ Testar com diferentes briefings
2. ✅ Validar qualidade das copies
3. ✅ Ajustar prompts se necessário
4. ✅ Integrar com frontend (quando necessário)

---

**Status:** Pronto para testar localmente! 🚀






