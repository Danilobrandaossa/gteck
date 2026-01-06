# Script para reiniciar o servidor Next.js
# Mata processos Node na porta 4000 e reinicia

Write-Host "🔄 Reiniciando servidor..." -ForegroundColor Cyan
Write-Host ""

# Matar processos Node
Write-Host "⏹️  Parando processos Node..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Verificar se porta está livre
$portInUse = netstat -ano | findstr :4000
if ($portInUse) {
    Write-Host "⚠️  Porta 4000 ainda em uso. Tentando matar processo específico..." -ForegroundColor Yellow
    $lines = $portInUse | Select-String "LISTENING"
    foreach ($line in $lines) {
        $pid = ($line -split '\s+')[-1]
        if ($pid) {
            Write-Host "   Matando processo PID: $pid" -ForegroundColor Yellow
            taskkill /PID $pid /F 2>$null
        }
    }
    Start-Sleep -Seconds 2
}

# Verificar novamente
$stillInUse = netstat -ano | findstr :4000
if ($stillInUse) {
    Write-Host "❌ Não foi possível liberar a porta 4000" -ForegroundColor Red
    Write-Host "   Tente fechar manualmente ou usar outra porta" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Porta 4000 liberada!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Cyan
Write-Host "   Execute: npm run dev" -ForegroundColor Yellow
Write-Host ""






