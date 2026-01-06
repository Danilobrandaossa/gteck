# Script para listar usuários via API

Write-Host "Listando usuarios do sistema..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/list-users" -Method GET -Headers @{"Origin"="http://localhost:5000"} -ErrorAction Stop

    if ($response.success) {
        Write-Host "Encontrados $($response.count) usuario(s):" -ForegroundColor Green
        Write-Host ""
        
        $index = 1
        foreach ($user in $response.users) {
            Write-Host "----------------------------------------" -ForegroundColor Gray
            Write-Host "Usuario $index :" -ForegroundColor Cyan
            Write-Host "   Email: $($user.email)" -ForegroundColor White
            Write-Host "   Nome: $($user.name)" -ForegroundColor White
            Write-Host "   Role: $($user.role)" -ForegroundColor White
            Write-Host "   Ativo: $(if ($user.isActive) { 'Sim' } else { 'Nao' })" -ForegroundColor White
            if ($user.organization) {
                Write-Host "   Organizacao: $($user.organization.name)" -ForegroundColor White
            }
            Write-Host "   Criado em: $($user.createdAt)" -ForegroundColor White
            
            if ($user.knownPassword) {
                Write-Host "   Senha conhecida: $($user.knownPassword)" -ForegroundColor Yellow
            } else {
                Write-Host "   Senha: [Hash bcrypt - nao pode ser exibida]" -ForegroundColor DarkGray
            }
            
            Write-Host ""
            $index++
        }
        
        Write-Host "----------------------------------------" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Resumo:" -ForegroundColor Cyan
        Write-Host "   - Total: $($response.summary.total)" -ForegroundColor White
        Write-Host "   - Ativos: $($response.summary.active)" -ForegroundColor White
        Write-Host "   - Admins: $($response.summary.admins)" -ForegroundColor White
        Write-Host "   - Editores: $($response.summary.editors)" -ForegroundColor White
        Write-Host "   - Visualizadores: $($response.summary.viewers)" -ForegroundColor White
    } else {
        Write-Host "Erro: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "Erro na requisicao:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Detalhes:" -ForegroundColor Yellow
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorDetails) {
            Write-Host "   Erro: $($errorDetails.error)" -ForegroundColor Red
            Write-Host "   Detalhes: $($errorDetails.details)" -ForegroundColor Gray
        } else {
            Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
        }
    }
}
