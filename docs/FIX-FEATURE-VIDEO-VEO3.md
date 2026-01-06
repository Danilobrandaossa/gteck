# 🔧 Fix: Habilitar Geração de Vídeo (FEATURE_VIDEO_VEO3)

## Problema

Erro ao tentar gerar vídeo:
```
403 Forbidden
Geração de vídeo não está habilitada (FEATURE_VIDEO_VEO3=false)
```

## Solução

### Passo 1: Adicionar variável no `.env.local`

Abra o arquivo `.env.local` na raiz do projeto e adicione:

```bash
FEATURE_VIDEO_VEO3="true"
```

**Arquivo completo `.env.local` deve ter (mínimo para vídeo):**

```bash
# Google AI Studio API Key (obrigatório)
GOOGLE_AI_STUDIO_API_KEY="AIzaSyCK9e1ejkgwyyQDOswJ28dA6sLlsUR-Qvo"

# Feature Flags - Video Generation (Veo 3)
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

### Passo 2: Reiniciar o servidor

**IMPORTANTE:** Após adicionar/alterar variáveis no `.env.local`, você DEVE reiniciar o servidor Next.js.

1. **Parar o servidor** (Ctrl+C no terminal onde está rodando)
2. **Iniciar novamente:**
   ```bash
   npm run dev
   ```

### Passo 3: Verificar se funcionou

1. Acesse: `http://localhost:4000/criativos`
2. Selecione **"Tipo de Criativo"** → **"Vídeo"**
3. Tente gerar um vídeo

Se ainda der erro, verifique:
- ✅ Arquivo `.env.local` existe na raiz do projeto
- ✅ `FEATURE_VIDEO_VEO3="true"` está presente (com aspas)
- ✅ Servidor foi reiniciado após adicionar a variável
- ✅ Não há espaços extras ou caracteres especiais

---

## Verificação Rápida (PowerShell)

```powershell
# Verificar se a variável está no .env.local
Select-String -Path ".env.local" -Pattern "FEATURE_VIDEO_VEO3"

# Deve retornar:
# FEATURE_VIDEO_VEO3="true"
```

---

## Troubleshooting

### Erro persiste após reiniciar?

1. **Verifique o formato:**
   - ✅ Correto: `FEATURE_VIDEO_VEO3="true"`
   - ❌ Errado: `FEATURE_VIDEO_VEO3=true` (sem aspas)
   - ❌ Errado: `FEATURE_VIDEO_VEO3 = "true"` (com espaços)

2. **Verifique se o arquivo está na raiz:**
   - O arquivo deve estar em: `C:\Users\ueles\OneDrive\Área de Trabalho\CMS\.env.local`
   - Não em: `C:\Users\ueles\OneDrive\Área de Trabalho\CMS\app\.env.local`

3. **Limpe o cache do Next.js:**
   ```bash
   rm -rf .next
   npm run dev
   ```

4. **Verifique se há múltiplas definições:**
   - Certifique-se de que `FEATURE_VIDEO_VEO3` aparece apenas UMA vez no arquivo
   - A última definição é a que vale

---

## Teste Rápido via API

Após configurar, teste via cURL:

```bash
curl -X POST http://localhost:4000/api/creative/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "mainPrompt": "Teste de vídeo",
    "videoModel": "veo31",
    "durationSeconds": 6,
    "aspectRatio": "9:16"
  }'
```

**Resposta esperada (sucesso):**
```json
{
  "jobId": "operations/1234567890123456789",
  "status": "queued"
}
```

**Resposta de erro (se ainda não funcionar):**
```json
{
  "status": "failed",
  "failureReason": "Geração de vídeo não está habilitada (FEATURE_VIDEO_VEO3=false)"
}
```

---

**Pronto!** Após adicionar `FEATURE_VIDEO_VEO3="true"` e reiniciar o servidor, a geração de vídeo deve funcionar. 🚀





