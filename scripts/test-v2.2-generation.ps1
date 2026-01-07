# Script de teste rápido para V2.2 (PowerShell)
# Uso: .\scripts\test-v2.2-generation.ps1

$ErrorActionPreference = "Stop"

Write-Host "🧪 TESTE V2.2 - GERAÇÃO DE IMAGENS" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Verificar variáveis de ambiente
Write-Host "1️⃣ Verificando variáveis de ambiente..." -ForegroundColor Yellow
if (Test-Path .env.local) {
    $envContent = Get-Content .env.local -Raw
    if ($envContent -match "GOOGLE_AI_STUDIO_API_KEY") {
        Write-Host "✓ GOOGLE_AI_STUDIO_API_KEY configurada" -ForegroundColor Green
    } else {
        Write-Host "✗ GOOGLE_AI_STUDIO_API_KEY não encontrada" -ForegroundColor Red
        exit 1
    }
    
    if ($envContent -match "OPENAI_API_KEY") {
        Write-Host "✓ OPENAI_API_KEY configurada" -ForegroundColor Green
    } else {
        Write-Host "⚠ OPENAI_API_KEY não encontrada (necessária para copy e scoring)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ .env.local não encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Typecheck
Write-Host "2️⃣ Verificando compilação TypeScript..." -ForegroundColor Yellow
$typecheckOutput = npm run typecheck 2>&1 | Out-String
if ($typecheckOutput -match "error") {
    Write-Host "✗ Erros de compilação encontrados" -ForegroundColor Red
    Write-Host $typecheckOutput
    exit 1
} else {
    Write-Host "✓ TypeScript OK" -ForegroundColor Green
}

Write-Host ""

# Testes unitários
Write-Host "3️⃣ Rodando testes unitários..." -ForegroundColor Yellow
$testOutput = npm run test tests/image-generation/ 2>&1 | Out-String
if ($testOutput -match "FAIL") {
    Write-Host "✗ Alguns testes falharam" -ForegroundColor Red
    Write-Host $testOutput
    exit 1
} else {
    Write-Host "✓ Todos os testes passaram" -ForegroundColor Green
}

Write-Host ""

# Verificar se servidor está rodando
Write-Host "4️⃣ Verificando se servidor está rodando..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($healthCheck.StatusCode -eq 200) {
        Write-Host "✓ Servidor rodando em http://localhost:4000" -ForegroundColor Green
        $serverRunning = $true
    } else {
        $serverRunning = $false
    }
} catch {
    Write-Host "⚠ Servidor não está rodando" -ForegroundColor Yellow
    Write-Host "   Execute: npm run dev" -ForegroundColor Yellow
    $serverRunning = $false
}

Write-Host ""

# Teste de API (se servidor estiver rodando)
if ($serverRunning) {
    Write-Host "5️⃣ Testando API (Draft)..." -ForegroundColor Yellow
    
    $body = @{
        mainPrompt = "Crie uma imagem publicitária de alta conversão para anúncio digital promovendo um Walmart Gift Card. Uma mulher sorrindo segurando um cartão presente Walmart, fundo azul e amarelo vibrante, estilo publicitário comercial, alto contraste, cores vibrantes, design impactante, foco em conversão."
        generateImage = $true
        qualityTier = "draft"
        includeTextInImage = $false
        variations = 2
        imageRatio = "9:16"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4000/api/creative/generate" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 60
        
        if ($response.status -eq "success") {
            Write-Host "✓ API respondeu com sucesso" -ForegroundColor Green
            
            if ($response.conceptualImages) {
                Write-Host "✓ Imagens conceituais geradas" -ForegroundColor Green
            }
            
            if ($response.commercialImages) {
                Write-Host "✓ Imagens comerciais geradas" -ForegroundColor Green
            }
            
            Write-Host ""
            Write-Host "📊 Metadata:" -ForegroundColor Cyan
            $response.metadata | ConvertTo-Json -Depth 3
        } else {
            Write-Host "✗ API retornou erro: $($response.failureReason)" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "✗ Erro ao chamar API: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "5️⃣ ⏭ Pulando teste de API (servidor não está rodando)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ TESTE V2.2 CONCLUÍDO" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:"
Write-Host "1. Acesse http://localhost:4000/criativos"
Write-Host "2. Teste geração Draft e Production"
Write-Host "3. Verifique logs no terminal do servidor"







