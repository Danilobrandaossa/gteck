# Script para iniciar desenvolvimento no Windows
Write-Host "🚀 Iniciando CMS Moderno em modo desenvolvimento..." -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
Write-Host "🔍 Verificando Docker..." -ForegroundColor Yellow
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker Desktop não está rodando!" -ForegroundColor Red
        Write-Host "📝 Por favor, inicie o Docker Desktop primeiro." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Docker não encontrado!" -ForegroundColor Red
    exit 1
}

# Verificar se containers estão rodando
Write-Host "🔍 Verificando serviços Docker..." -ForegroundColor Yellow
$postgresRunning = $false
try {
    docker exec cms_postgres_dev pg_isready -U cms_user -d cms_modern 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $postgresRunning = $true
    }
} catch {
    # Container não existe ou não está rodando
}

if (-not $postgresRunning) {
    Write-Host "❌ Banco de dados não está rodando!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Execute primeiro:" -ForegroundColor Yellow
    Write-Host "   .\scripts\setup-windows.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou manualmente:" -ForegroundColor Yellow
    Write-Host "   docker-compose -f docker-compose.dev.yml up -d postgres redis pgadmin" -ForegroundColor White
    exit 1
}

Write-Host "✅ Serviços Docker estão rodando!" -ForegroundColor Green

# Verificar arquivo .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host ""
    Write-Host "⚠️  Arquivo .env.local não encontrado!" -ForegroundColor Yellow
    Write-Host "📝 Execute primeiro:" -ForegroundColor Yellow
    Write-Host "   .\scripts\setup-windows.ps1" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🔥 Iniciando Next.js em modo desenvolvimento..." -ForegroundColor Cyan
Write-Host "📡 Servidor será acessível em: http://localhost:3002" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Para parar, pressione Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Iniciar aplicação
npm run dev




