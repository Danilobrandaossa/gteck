# Script para testar API key OpenAI diretamente
# Uso: .\scripts\test-openai-key.ps1

Write-Host "🔑 Testando API Key OpenAI..." -ForegroundColor Cyan
Write-Host ""

# Ler API key do .env.local
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Arquivo .env.local não encontrado!" -ForegroundColor Red
    exit 1
}

$apiKeyLine = Get-Content $envFile | Select-String "OPENAI_API_KEY"
if (-not $apiKeyLine) {
    Write-Host "❌ OPENAI_API_KEY não encontrada no .env.local!" -ForegroundColor Red
    exit 1
}

# Extrair a key (remover OPENAI_API_KEY=" e ")
$apiKey = ($apiKeyLine -replace 'OPENAI_API_KEY="', '') -replace '"', ''
$apiKey = $apiKey.Trim()

if ($apiKey -match '^sk-') {
    Write-Host "✅ API Key encontrada (começa com sk-)" -ForegroundColor Green
    Write-Host "   Key: $($apiKey.Substring(0, 20))..." -ForegroundColor Gray
} else {
    Write-Host "⚠️  API Key não parece válida (deve começar com sk-)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🧪 Testando com gpt-3.5-turbo..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

$body = @{
    model = "gpt-3.5-turbo"
    messages = @(
        @{
            role = "user"
            content = "Diga apenas: OK"
        }
    )
    max_tokens = 10
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.openai.com/v1/chat/completions" `
        -Method POST `
        -Headers $headers `
        -Body $body
    
    Write-Host "✅ SUCESSO! API Key está funcionando!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resposta:" -ForegroundColor Cyan
    Write-Host $response.choices[0].message.content
    Write-Host ""
    Write-Host "Modelo usado: $($response.model)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ ERRO na requisição!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    Write-Host ""
    
    # Tentar extrair mensagem de erro
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $errorData = $responseBody | ConvertFrom-Json
        
        Write-Host "Mensagem de erro:" -ForegroundColor Yellow
        if ($errorData.error) {
            Write-Host "  Tipo: $($errorData.error.type)" -ForegroundColor Red
            Write-Host "  Código: $($errorData.error.code)" -ForegroundColor Red
            Write-Host "  Mensagem: $($errorData.error.message)" -ForegroundColor Red
        } else {
            Write-Host $responseBody
        }
    } catch {
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Possíveis causas:" -ForegroundColor Yellow
    Write-Host "  1. API Key inválida ou expirada" -ForegroundColor Gray
    Write-Host "  2. Conta sem créditos" -ForegroundColor Gray
    Write-Host "  3. Modelo não disponível para a conta" -ForegroundColor Gray
    Write-Host "  4. Permissões insuficientes" -ForegroundColor Gray
}








