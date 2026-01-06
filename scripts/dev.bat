@echo off
echo 🚀 Iniciando CMS Moderno em modo desenvolvimento...

REM Verificar se containers estão rodando
docker exec cms_postgres_dev pg_isready -U cms_user -d cms_modern >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Banco de dados não está rodando. Execute: scripts\setup.bat
    pause
    exit /b 1
)

REM Iniciar aplicação em modo desenvolvimento
echo 🔥 Iniciando Next.js em modo desenvolvimento...
npm run dev

