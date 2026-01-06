# Script de Teste - Gerador de Criativos COM GERAÇÃO DE IMAGEM
# Uso: .\scripts\test-creative-with-image.ps1

Write-Host "🧪 Testando Gerador de Criativos COM Imagem..." -ForegroundColor Cyan
Write-Host ""

# Configurar body (com generateImage = true)
$body = @{
    productName = "Curso de Marketing Digital"
    productDescription = "Aprenda marketing digital do zero"
    targetAudience = "Empreendedores iniciantes"
    keyBenefits = @("Certificado válido", "Acesso vitalício")
    tone = "professional"
    platform = "facebook"
    maxLength = 200
    generateImage = $true  # ← Gerar imagem automaticamente
} | ConvertTo-Json

# Configurar headers
$headers = @{
    "Content-Type" = "application/json"
    "Origin" = "http://localhost:4000"
}

Write-Host "📤 Enviando requisição (com geração de imagem)..." -ForegroundColor Yellow
Write-Host "⚠️  Nota: Geração de imagem aumenta o custo (DALL-E 3)" -ForegroundColor Yellow
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
        
        if ($response.imageUrl) {
            Write-Host "🖼️  IMAGEM GERADA:" -ForegroundColor Green
            Write-Host "   URL: $($response.imageUrl)" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "   Para visualizar, abra no navegador:" -ForegroundColor Gray
            Write-Host "   $($response.imageUrl)" -ForegroundColor Cyan
            Write-Host ""
            
            if ($response.revisedPrompt) {
                Write-Host "   Prompt revisado pelo DALL-E:" -ForegroundColor Gray
                Write-Host "   $($response.revisedPrompt)" -ForegroundColor Gray
            }
        } else {
            Write-Host "⚠️  Imagem não foi gerada (pode ter falhado silenciosamente)" -ForegroundColor Yellow
        }
        
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






