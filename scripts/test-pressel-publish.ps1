# Script para testar publicação via Pressel Automation v2
# Uso: .\scripts\test-pressel-publish.ps1

$siteUrl = "https://atlz.online"
$username = "pressel-bot"
$password = "pCMO 1Y8U WfR2 aQM2 DrmE XdDz"

# Base64 encode para Basic Auth
$bytes = [System.Text.Encoding]::UTF8.GetBytes("${username}:${password}")
$base64Auth = [System.Convert]::ToBase64String($bytes)

$headers = @{
    "Authorization" = "Basic $base64Auth"
    "Content-Type" = "application/json"
}

Write-Host "🔍 Testando PREVIEW..." -ForegroundColor Cyan
$previewBody = @{
    pressel = @{
        model = "V1"
    }
    page = @{
        title = "Exemplo V1"
        slug = "exemplo-v1"
        status = "draft"
    }
    acf = @{
        cor_botao = "#2352AE"
    }
} | ConvertTo-Json -Depth 10

try {
    $previewResponse = Invoke-RestMethod -Method POST `
        -Uri "$siteUrl/wp-json/pressel-automation-v2/v1/preview" `
        -Headers $headers `
        -Body $previewBody
    
    Write-Host "✅ Preview OK:" -ForegroundColor Green
    $previewResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erro no Preview:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n📝 Testando PUBLISH..." -ForegroundColor Cyan
$publishBody = @{
    pressel = @{
        model = "V1"
    }
    page = @{
        title = "Exemplo V1"
        slug = "exemplo-v1"
        status = "publish"
    }
    acf = @{
        cor_botao = "#2352AE"
    }
} | ConvertTo-Json -Depth 10

try {
    $publishResponse = Invoke-RestMethod -Method POST `
        -Uri "$siteUrl/wp-json/pressel-automation-v2/v1/publish" `
        -Headers $headers `
        -Body $publishBody
    
    Write-Host "✅ Publish OK:" -ForegroundColor Green
    $publishResponse | ConvertTo-Json -Depth 10
    
    if ($publishResponse.data.post_id) {
        $postId = $publishResponse.data.post_id
        Write-Host "`n🔍 Verificando página (ID: $postId)..." -ForegroundColor Cyan
        
        try {
            $verifyResponse = Invoke-RestMethod -Method GET `
                -Uri "$siteUrl/wp-json/pressel-automation-v2/v1/verify?post_id=$postId" `
                -Headers @{ "Authorization" = "Basic $base64Auth" }
            
            Write-Host "✅ Verificação OK:" -ForegroundColor Green
            $verifyResponse | ConvertTo-Json -Depth 10
        } catch {
            Write-Host "❌ Erro na Verificação:" -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Erro no Publish:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalhes:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
    }
}

