# Script de Setup para Windows - CMS Moderno
Write-Host "🚀 Configurando CMS Moderno no Windows..." -ForegroundColor Cyan
Write-Host ""

# Verificar se Docker está rodando
Write-Host "🔍 Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerCheck = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker Desktop não está rodando!" -ForegroundColor Red
        Write-Host "📝 Por favor, inicie o Docker Desktop e execute este script novamente." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Docker está rodando!" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não encontrado. Instale o Docker Desktop." -ForegroundColor Red
    exit 1
}

# Parar containers existentes
Write-Host ""
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down 2>&1 | Out-Null

# Iniciar serviços Docker
Write-Host ""
Write-Host "🐘 Iniciando PostgreSQL, Redis e PgAdmin..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up -d postgres redis pgadmin

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao iniciar containers Docker!" -ForegroundColor Red
    exit 1
}

# Aguardar banco estar pronto
Write-Host ""
Write-Host "⏳ Aguardando banco de dados inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar se banco está respondendo
Write-Host ""
Write-Host "🔍 Verificando conexão com o banco..." -ForegroundColor Yellow
$maxRetries = 10
$retryCount = 0
$dbReady = $false

while ($retryCount -lt $maxRetries) {
    try {
        $pgCheck = docker exec cms_postgres_dev pg_isready -U cms_user -d cms_modern 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dbReady = $true
            break
        }
    } catch {
        # Continuar tentando
    }
    $retryCount++
    Start-Sleep -Seconds 2
}

if (-not $dbReady) {
    Write-Host "❌ Banco de dados não está respondendo!" -ForegroundColor Red
    Write-Host "📋 Logs do PostgreSQL:" -ForegroundColor Yellow
    docker logs cms_postgres_dev --tail 20
    exit 1
}

Write-Host "✅ Banco de dados está pronto!" -ForegroundColor Green

# Verificar arquivo .env.local
Write-Host ""
Write-Host "📝 Verificando variáveis de ambiente..." -ForegroundColor Yellow
if (-not (Test-Path ".env.local")) {
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env.local"
        Write-Host "✅ Arquivo .env.local criado a partir de env.example" -ForegroundColor Green
        Write-Host "⚠️  Configure as variáveis em .env.local antes de continuar!" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Arquivo env.example não encontrado!" -ForegroundColor Red
    }
} else {
    Write-Host "✅ Arquivo .env.local encontrado" -ForegroundColor Green
}

# Instalar dependências
Write-Host ""
Write-Host "📦 Instalando dependências npm..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependências instaladas!" -ForegroundColor Green

# Gerar cliente Prisma
Write-Host ""
Write-Host "🔧 Gerando cliente Prisma..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Aviso: Erro ao gerar cliente Prisma" -ForegroundColor Yellow
}

# Executar push do schema
Write-Host ""
Write-Host "🗄️  Sincronizando schema do banco..." -ForegroundColor Yellow
npm run db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Aviso: Erro ao sincronizar schema" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Configuração concluída com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Acessos disponíveis:" -ForegroundColor Cyan
Write-Host "   • CMS: http://localhost:3002" -ForegroundColor White
Write-Host "   • PgAdmin: http://localhost:5050" -ForegroundColor White
Write-Host "     - Email: admin@cms.com" -ForegroundColor Gray
Write-Host "     - Senha: admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Para iniciar o desenvolvimento:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Para parar os serviços Docker:" -ForegroundColor Cyan
Write-Host "   docker-compose -f docker-compose.dev.yml down" -ForegroundColor White
Write-Host ""




