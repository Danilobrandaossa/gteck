# Script de Teste - Gerador de Criativos (PowerShell)
# Uso: .\scripts\test-creative-api.ps1

Write-Host "🧪 Testando Gerador de Criativos..." -ForegroundColor Cyan
Write-Host ""

# Configurar body
$body = @{
    productName = "Curso de Marketing Digital"
    productDescription = "Aprenda marketing digital do zero"
    targetAudience = "Empreendedores iniciantes"
    keyBenefits = @("Certificado válido", "Acesso vitalício")
    tone = "professional"
    platform = "facebook"
    maxLength = 200
} | ConvertTo-Json

# Configurar headers (incluindo Origin para passar CSRF)
$headers = @{
    "Content-Type" = "application/json"
    "Origin" = "http://localhost:4000"
}

Write-Host "📤 Enviando requisição..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/creative/generate" `
        -Method POST `
        -Headers $headers `
        -Body $body
    
    Write-Host "✅ SUCESSO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Status: $($response.status)" -ForegroundColor Green
    
    if ($response.status -eq "success") {
        Write-Host ""
        Write-Host "📝 COPY:" -ForegroundColor Cyan
        Write-Host $response.copy
        Write-Host ""
        Write-Host "🖼️  IMAGE PROMPT:" -ForegroundColor Cyan
        Write-Host $response.imagePrompt
        Write-Host ""
        Write-Host "📊 METADATA:" -ForegroundColor Cyan
        $response.metadata | ConvertTo-Json
    } else {
        Write-Host ""
        Write-Host "❌ FALHA:" -ForegroundColor Red
        Write-Host $response.failureReason
    }
} catch {
    Write-Host "❌ ERRO:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "Detalhes:" -ForegroundColor Yellow
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}






