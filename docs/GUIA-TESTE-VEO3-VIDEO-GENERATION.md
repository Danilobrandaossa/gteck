# Guia de Teste - Geração de Vídeo Veo 3.1

## Pré-requisitos

1. **Variáveis de ambiente configuradas** (`.env.local`):
```bash
GOOGLE_AI_STUDIO_API_KEY="AIzaSyCK9e1ejkgwyyQDOswJ28dA6sLlsUR-Qvo"
FEATURE_VIDEO_VEO3="true"
VEO_MODEL_NAME="veo-3.1-generate-preview"
VIDEO_DOWNLOAD_ALLOWED_HOSTS="storage.googleapis.com,*.googleapis.com,*.googleusercontent.com"
VIDEO_DOWNLOAD_TIMEOUT_MS="120000"
VIDEO_DOWNLOAD_MAX_BYTES="104857600"
```

2. **Servidor rodando**:
```bash
npm run dev
```

O servidor deve estar em `http://localhost:4000`

---

## Teste 1: Via Interface Web

### Passo 1: Acessar a página de criativos
1. Abra `http://localhost:4000/criativos`
2. Faça login se necessário

### Passo 2: Gerar um vídeo
1. No campo "Descreva a imagem que você quer criar", digite:
   ```
   Crie um vídeo publicitário de 6 segundos mostrando um produto tecnológico moderno em um ambiente clean e profissional
   ```

2. Selecione **"Tipo de Criativo"** → **"Vídeo"**

3. Configure:
   - **Modelo de Vídeo**: Veo 3.1 (Experimental)
   - **Duração**: 6 segundos
   - **Proporção**: Vertical (9:16) ou Horizontal (16:9)
   - **Variações**: 1

4. Clique em **"Gerar Vídeo"**

### Passo 3: Monitorar status
- O sistema deve mostrar:
  - Job ID
  - Status: "Na fila" → "Em progresso" → "Concluído"
  - Progresso (%)

### Passo 4: Baixar vídeo
- Quando status = "Concluído", deve aparecer:
  - Player de vídeo
  - Botão "Baixar Vídeo"
  - Link funcional para download

---

## Teste 2: Via API REST (cURL)

### Teste 2.1: Iniciar geração de vídeo

```bash
curl -X POST http://localhost:4000/api/creative/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "mainPrompt": "Crie um vídeo publicitário de 6 segundos mostrando um produto tecnológico moderno em um ambiente clean e profissional",
    "videoModel": "veo31",
    "durationSeconds": 6,
    "aspectRatio": "9:16",
    "variations": 1
  }'
```

**Resposta esperada:**
```json
{
  "jobId": "operations/1234567890123456789",
  "status": "queued"
}
```

**Anote o `jobId` para os próximos testes!**

---

### Teste 2.2: Consultar status do vídeo

Substitua `OPERATION_NAME` pelo `jobId` retornado:

```bash
curl "http://localhost:4000/api/creative/video-status?jobId=OPERATION_NAME"
```

**Resposta esperada (em progresso):**
```json
{
  "jobId": "operations/1234567890123456789",
  "status": "running",
  "progress": 45,
  "metadata": {
    "model": "veo-3.1-generate-preview",
    "durationSeconds": 6,
    "aspectRatio": "9:16",
    "prompt": "..."
  }
}
```

**Resposta esperada (concluído):**
```json
{
  "jobId": "operations/1234567890123456789",
  "status": "done",
  "progress": 100,
  "downloadUrl": "/api/creative/video-download?uri=gs://...",
  "previewUrl": "/api/creative/video-download?uri=gs://...",
  "metadata": {
    "model": "veo-3.1-generate-preview",
    "durationSeconds": 6,
    "aspectRatio": "9:16",
    "prompt": "..."
  }
}
```

**⚠️ IMPORTANTE**: O `downloadUrl` deve ser um endpoint interno (`/api/creative/video-download?uri=...`), NÃO um URI bruto (`gs://` ou `https://` externo).

---

### Teste 2.3: Baixar vídeo

Substitua `VIDEO_URI` pelo URI retornado em `downloadUrl` (após `?uri=`):

```bash
curl "http://localhost:4000/api/creative/video-download?uri=VIDEO_URI" \
  --output video-test.mp4
```

**Resposta esperada:**
- Arquivo `video-test.mp4` baixado com sucesso
- Tamanho > 0 bytes
- Content-Type: `video/mp4`

---

## Teste 3: Validações de Segurança

### Teste 3.1: SSRF - Bloquear IPs privados

```bash
# Deve retornar 403
curl "http://localhost:4000/api/creative/video-download?uri=https://127.0.0.1/video.mp4"

# Deve retornar 403
curl "http://localhost:4000/api/creative/video-download?uri=https://192.168.1.1/video.mp4"

# Deve retornar 403
curl "http://localhost:4000/api/creative/video-download?uri=https://169.254.1.1/video.mp4"

# Deve retornar 403
curl "http://localhost:4000/api/creative/video-download?uri=https://0.0.0.0/video.mp4"
```

**Resposta esperada:**
```json
{
  "error": "Host não permitido (IP literal bloqueado)"
}
```

---

### Teste 3.2: SSRF - Bloquear hosts não permitidos

```bash
# Deve retornar 403
curl "http://localhost:4000/api/creative/video-download?uri=https://evil.com/video.mp4"
```

**Resposta esperada:**
```json
{
  "error": "Host não permitido"
}
```

---

### Teste 3.3: Validar esquema (apenas https:// ou gs://)

```bash
# Deve retornar 400
curl "http://localhost:4000/api/creative/video-download?uri=http://storage.googleapis.com/video.mp4"

# Deve retornar 400
curl "http://localhost:4000/api/creative/video-download?uri=file:///etc/passwd"
```

**Resposta esperada:**
```json
{
  "error": "URI deve começar com https:// ou gs://"
}
```

---

## Teste 4: Conversão gs://

### Teste 4.1: Converter gs:// para https://

```bash
# Teste com URI gs:// (deve converter corretamente)
curl "http://localhost:4000/api/creative/video-download?uri=gs://bucket-name/path/to/video.mp4" \
  --output video-gs-test.mp4
```

**Comportamento esperado:**
- Converter `gs://bucket-name/path/to/video.mp4` para `https://storage.googleapis.com/bucket-name/path/to/video.mp4`
- Encode cada segmento do path separadamente
- Fazer fetch com `x-goog-api-key` header

---

## Teste 5: Timeout e Limite de Bytes

### Teste 5.1: Verificar timeout

Se o vídeo demorar mais de 2 minutos (120000ms), deve retornar:
```json
{
  "error": "Timeout ao baixar vídeo"
}
```

### Teste 5.2: Verificar limite de 100MB

Se o vídeo for maior que 100MB, deve retornar:
```json
{
  "error": "Vídeo muito grande (XXX MB). Limite: 100 MB"
}
```

---

## Checklist de Validação

- [ ] **Geração de vídeo inicia** (retorna jobId)
- [ ] **Status polling funciona** (queued → running → done)
- [ ] **downloadUrl é interno** (não expõe gs:// ou https:// bruto)
- [ ] **previewUrl está presente** (para <video src>)
- [ ] **Download funciona** (arquivo MP4 válido)
- [ ] **SSRF bloqueia IPs privados** (127.x, 10.x, 192.168.x, 169.254.x, 0.x)
- [ ] **SSRF bloqueia hosts não permitidos**
- [ ] **Esquema validado** (apenas https:// ou gs://)
- [ ] **Conversão gs:// funciona** (paths com múltiplos segmentos)
- [ ] **Timeout funciona** (2 minutos)
- [ ] **Limite de bytes funciona** (100MB)

---

## Troubleshooting

### Erro: "API key não configurada"
- Verifique se `GOOGLE_AI_STUDIO_API_KEY` está em `.env.local`
- Reinicie o servidor após adicionar a variável

### Erro: "Geração de vídeo não está habilitada"
- Verifique se `FEATURE_VIDEO_VEO3="true"` está em `.env.local`

### Erro: "Job não encontrado"
- Verifique se o `jobId` está correto
- Aguarde alguns segundos e tente novamente (pode estar ainda processando)

### Erro: "Host não permitido"
- Verifique se o URI é de um host permitido (storage.googleapis.com, etc)
- Verifique se não está tentando acessar IPs privados

### Vídeo não aparece no frontend
- Verifique se `downloadUrl` ou `previewUrl` está presente no response
- Verifique o console do navegador para erros
- Verifique se o endpoint `/api/creative/video-download` está acessível

---

## Comandos Rápidos

```bash
# 1. Iniciar servidor
npm run dev

# 2. Typecheck (verificar erros)
npm run typecheck

# 3. Teste rápido - Gerar vídeo
curl -X POST http://localhost:4000/api/creative/generate-video \
  -H "Content-Type: application/json" \
  -d '{"mainPrompt":"Vídeo teste","videoModel":"veo31","durationSeconds":6,"aspectRatio":"9:16"}'

# 4. Teste rápido - Status (substitua JOB_ID)
curl "http://localhost:4000/api/creative/video-status?jobId=JOB_ID"

# 5. Teste rápido - Download (substitua URI)
curl "http://localhost:4000/api/creative/video-download?uri=URI" --output test.mp4
```

---

**Pronto para testar!** 🚀





