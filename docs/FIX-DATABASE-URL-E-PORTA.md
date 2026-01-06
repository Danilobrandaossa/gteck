# 🔧 Fix: DATABASE_URL e Porta em Uso

## Problema 1: DATABASE_URL Inválida

**Erro:**
```
error: Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`.
```

**Causa:** A variável `DATABASE_URL` no `.env.local` não está no formato correto.

## Solução

### Passo 1: Verificar/Corrigir DATABASE_URL no `.env.local`

Abra o arquivo `.env.local` e verifique se `DATABASE_URL` está assim:

**✅ Formato Correto (PostgreSQL):**
```bash
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco"
```

**✅ Formato Correto (SQLite - para desenvolvimento local):**
```bash
DATABASE_URL="file:./dev.db"
```

**❌ Formato Incorreto:**
```bash
DATABASE_URL="localhost:5432/nome_do_banco"  # FALTA postgresql://
DATABASE_URL="postgres://..."  # Funciona, mas postgresql:// é preferido
```

### Exemplo Completo `.env.local` (Mínimo):

```bash
# Database
DATABASE_URL="file:./dev.db"

# Google AI Studio API Key
GOOGLE_AI_STUDIO_API_KEY="AIzaSyCK9e1ejkgwyyQDOswJ28dA6sLlsUR-Qvo"

# Feature Flags
FEATURE_VIDEO_VEO3="true"
FEATURE_IMAGE_PRO="true"
```

---

## Problema 2: Porta 4000 em Uso

**Erro:**
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:4000
```

**Causa:** O servidor anterior ainda está rodando na porta 4000.

## Solução

### Opção 1: Matar o processo na porta 4000 (Recomendado)

**PowerShell:**
```powershell
# Encontrar o processo usando a porta 4000
Get-NetTCPConnection -LocalPort 4000 | Select-Object -ExpandProperty OwningProcess

# Matar o processo (substitua PID pelo número retornado acima)
Stop-Process -Id PID -Force
```

**Ou use este comando direto:**
```powershell
# Matar todos os processos Node na porta 4000
$process = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($process) { Stop-Process -Id $process -Force }
```

### Opção 2: Usar outra porta

Edite o `package.json` ou use:
```bash
npm run dev -- -p 4001
```

### Opção 3: Reiniciar o computador (último recurso)

---

## Passo a Passo Completo

### 1. Matar processo na porta 4000

```powershell
# PowerShell
$process = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($process) { 
    Write-Host "Matando processo $process..."
    Stop-Process -Id $process -Force
    Write-Host "Processo finalizado!"
} else {
    Write-Host "Nenhum processo encontrado na porta 4000"
}
```

### 2. Verificar/Corrigir `.env.local`

Certifique-se de que o arquivo `.env.local` tem:

```bash
# Database (SQLite para desenvolvimento local)
DATABASE_URL="file:./dev.db"

# OU PostgreSQL (se você tem um banco PostgreSQL rodando)
# DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco"

# Google AI Studio
GOOGLE_AI_STUDIO_API_KEY="AIzaSyCK9e1ejkgwyyQDOswJ28dA6sLlsUR-Qvo"

# Feature Flags
FEATURE_VIDEO_VEO3="true"
FEATURE_IMAGE_PRO="true"
DEFAULT_CREATIVE_TYPE="image"
DEFAULT_IMAGE_MODEL="nano"
DEFAULT_VIDEO_MODEL="veo3"
VIDEO_MAX_VARIATIONS="1"
VIDEO_DEFAULT_DURATION_SECONDS="6"
VIDEO_DEFAULT_ASPECT_RATIO="9:16"
DEBUG_FLAGS="false"

# Video Download Security
VIDEO_DOWNLOAD_ALLOWED_HOSTS="storage.googleapis.com,*.googleapis.com,*.googleusercontent.com"
VIDEO_DOWNLOAD_TIMEOUT_MS="120000"
VIDEO_DOWNLOAD_MAX_BYTES="104857600"

# Veo 3 Configuration
VEO_ENDPOINT="https://generativelanguage.googleapis.com/v1beta"
VEO_MODEL_NAME="veo-3.1-generate-preview"
VEO_MODEL_FALLBACK="veo-3.1-generate-preview"
VEO_TIMEOUT_MS="300000"
VEO_MAX_RETRIES="2"
VEO_BACKOFF_BASE_MS="2000"

# Image Model Configuration
GEMINI_IMAGE_MODEL_NANO="gemini-2.5-flash-image"
GEMINI_IMAGE_MODEL_PRO="gemini-3-pro-image-preview"
```

### 3. Reiniciar o servidor

```bash
npm run dev
```

---

## Verificação Rápida

### Verificar se DATABASE_URL está correta:

```powershell
# PowerShell
Select-String -Path ".env.local" -Pattern "DATABASE_URL"

# Deve retornar algo como:
# DATABASE_URL="file:./dev.db"
# OU
# DATABASE_URL="postgresql://..."
```

### Verificar se porta 4000 está livre:

```powershell
# PowerShell
Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue

# Se não retornar nada, a porta está livre
# Se retornar algo, há um processo usando a porta
```

---

## Troubleshooting

### DATABASE_URL ainda dá erro?

1. **Verifique se está entre aspas:**
   - ✅ Correto: `DATABASE_URL="file:./dev.db"`
   - ❌ Errado: `DATABASE_URL=file:./dev.db` (sem aspas pode causar problemas)

2. **Verifique se não há espaços:**
   - ✅ Correto: `DATABASE_URL="file:./dev.db"`
   - ❌ Errado: `DATABASE_URL = "file:./dev.db"` (espaços ao redor do =)

3. **Para SQLite, certifique-se de que o caminho está correto:**
   - `file:./dev.db` = arquivo na raiz do projeto
   - `file:./prisma/dev.db` = arquivo na pasta prisma

### Porta ainda em uso?

1. **Tente usar outra porta temporariamente:**
   ```bash
   npm run dev -- -p 4001
   ```

2. **Verifique se há múltiplos processos Node:**
   ```powershell
   Get-Process node
   # Mate todos se necessário
   Stop-Process -Name node -Force
   ```

3. **Reinicie o terminal/PowerShell**

---

**Após corrigir ambos os problemas, o servidor deve iniciar normalmente!** 🚀





