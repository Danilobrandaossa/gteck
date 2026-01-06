@echo off
echo ====================================
echo   MIGRA??O DO BANCO DE DADOS - CMS
echo ====================================
echo.
echo Verificando conex?o com PostgreSQL...
echo.
npx prisma migrate dev --name add_ai_content_models
echo.
echo ====================================
if %ERRORLEVEL% EQU 0 (
    echo ? Migra??o executada com sucesso!
    echo.
    echo Pr?ximos passos:
    echo 1. Execute: npx prisma generate
    echo 2. Reinicie o servidor Next.js
) else (
    echo ? Erro na migra??o
    echo.
    echo Certifique-se de que:
    echo - PostgreSQL est? rodando na porta 5433
    echo - DATABASE_URL est? correta no arquivo .env
)
echo ====================================
pause
