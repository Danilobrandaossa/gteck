# Script para criar usuário via API

$body = @{
    email = "contato@danilobrandao.com.br"
    password = "Zy598859D@n2"
    name = "Danilo Brandão"
} | ConvertTo-Json

Write-Host "👤 Criando usuário via API..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/create-user" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -Headers @{"Origin"="http://localhost:5000"} `
        -ErrorAction Stop

    if ($response.success) {
        Write-Host "✅ Usuário criado/atualizado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Detalhes:" -ForegroundColor Cyan
        Write-Host "   - Email: $($response.user.email)" -ForegroundColor White
        Write-Host "   - Nome: $($response.user.name)" -ForegroundColor White
        Write-Host "   - Role: $($response.user.role)" -ForegroundColor White
        Write-Host ""
        Write-Host "🔑 Credenciais de login:" -ForegroundColor Yellow
        Write-Host "   - Email: contato@danilobrandao.com.br" -ForegroundColor White
        Write-Host "   - Senha: Zy598859D@n2" -ForegroundColor White
    } else {
        Write-Host "❌ Erro: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro na requisição:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Detalhes:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
    }
}

