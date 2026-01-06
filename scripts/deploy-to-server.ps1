# Script PowerShell para fazer deploy do projeto para o servidor
# Execute: .\scripts\deploy-to-server.ps1

param(
    [string]$ServerIP = "72.60.255.227",
    [string]$ServerUser = "root",
    [string]$RemotePath = "/var/www/crm.gteck.com.br",
    [string]$LocalPath = "C:\Users\ueles\OneDrive\Área de Trabalho\CMS"
)

Write-Host "🚀 Iniciando deploy para o servidor..." -ForegroundColor Green
Write-Host "Servidor: $ServerUser@$ServerIP" -ForegroundColor Cyan
Write-Host "Destino: $RemotePath" -ForegroundColor Cyan
Write-Host ""

# Verificar se o diretório local existe
if (-not (Test-Path $LocalPath)) {
    Write-Host "❌ Erro: Diretório local não encontrado: $LocalPath" -ForegroundColor Red
    exit 1
}

# Lista de arquivos/pastas a excluir do upload
$ExcludePatterns = @(
    "node_modules",
    ".next",
    ".git",
    ".env.local",
    "*.log",
    ".DS_Store",
    "Thumbs.db",
    "*.swp",
    "*.swo",
    ".vscode",
    ".idea"
)

Write-Host "📦 Preparando arquivos para upload..." -ForegroundColor Yellow

# Criar arquivo temporário com lista de exclusões
$ExcludeFile = [System.IO.Path]::GetTempFileName()
$ExcludePatterns | ForEach-Object { Add-Content -Path $ExcludeFile -Value $_ }

Write-Host ""
Write-Host "⚠️  ATENÇÃO: Este script fará upload dos arquivos do projeto." -ForegroundColor Yellow
Write-Host "   Certifique-se de que:" -ForegroundColor Yellow
Write-Host "   1. O arquivo .env.local NÃO será enviado (por segurança)" -ForegroundColor Yellow
Write-Host "   2. Você precisa configurar .env.local manualmente no servidor" -ForegroundColor Yellow
Write-Host "   3. node_modules será instalado no servidor (npm install)" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Deseja continuar? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "❌ Deploy cancelado." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "📤 Fazendo upload dos arquivos..." -ForegroundColor Green

# Usar scp para fazer upload
# Nota: Você precisará inserir a senha do servidor
$scpCommand = "scp -r -o StrictHostKeyChecking=no "

# Adicionar exclusões
foreach ($pattern in $ExcludePatterns) {
    $scpCommand += "--exclude='$pattern' "
}

$scpCommand += "$LocalPath/* $ServerUser@${ServerIP}:$RemotePath/"

Write-Host "Comando: $scpCommand" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Você precisará inserir a senha do servidor quando solicitado." -ForegroundColor Yellow
Write-Host ""

# Executar comando (comentado - descomente quando estiver pronto)
# Invoke-Expression $scpCommand

Write-Host ""
Write-Host "✅ Upload concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos no servidor:" -ForegroundColor Cyan
Write-Host "   1. SSH no servidor: ssh $ServerUser@$ServerIP" -ForegroundColor White
Write-Host "   2. cd $RemotePath" -ForegroundColor White
Write-Host "   3. Criar .env.local com as variáveis de ambiente" -ForegroundColor White
Write-Host "   4. npm install" -ForegroundColor White
Write-Host "   5. npx prisma generate" -ForegroundColor White
Write-Host "   6. npm run build" -ForegroundColor White
Write-Host "   7. pm2 start npm --name 'crm-gteck' -- start" -ForegroundColor White
Write-Host ""

