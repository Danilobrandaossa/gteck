@echo off
echo 🚀 Iniciando CMS em modo de desenvolvimento...

REM Verificar se Docker Desktop está rodando
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Desktop não está rodando. Por favor, inicie o Docker Desktop primeiro.
    pause
    exit /b 1
)

echo ✅ Docker Desktop está rodando

REM Criar diretórios necessários
if not exist logs mkdir logs
if not exist uploads mkdir uploads
if not exist database mkdir database

REM Configurar variáveis de ambiente se não existir
if not exist .env.local (
    echo 📝 Configurando variáveis de ambiente...
    call scripts\setup-env.bat
)

REM Parar containers existentes
echo 🛑 Parando containers existentes...
docker-compose -f docker-compose.dev.yml down

REM Iniciar banco de dados e Redis
echo 🗄️ Iniciando PostgreSQL e Redis...
docker-compose -f docker-compose.dev.yml up -d postgres redis

REM Aguardar banco estar pronto
echo ⏳ Aguardando banco de dados estar pronto...
timeout /t 10 /nobreak >nul

REM Verificar se banco está acessível
echo 🔍 Verificando conexão com banco de dados...
:wait_for_db
docker exec cms_postgres_dev pg_isready -U cms_user -d cms_modern >nul 2>&1
if %errorlevel% neq 0 (
    echo ⏳ Aguardando PostgreSQL...
    timeout /t 2 /nobreak >nul
    goto wait_for_db
)

echo ✅ Banco de dados está pronto!

REM Instalar dependências
echo 📦 Instalando dependências...
npm install

REM Gerar cliente Prisma
echo 🔧 Gerando cliente Prisma...
npm run db:generate

REM Executar migrações
echo 🗄️ Executando migrações do banco de dados...
npm run db:push

REM Iniciar PgAdmin
echo 🔧 Iniciando PgAdmin...
docker-compose -f docker-compose.dev.yml up -d pgadmin

echo.
echo 🎉 Configuração concluída!
echo.
echo 📊 Serviços disponíveis:
echo    • CMS: http://localhost:3002
echo    • PgAdmin: http://localhost:5050
echo    • PostgreSQL: localhost:5433
echo    • Redis: localhost:6379
echo.
echo 🔑 Credenciais PgAdmin:
echo    • Email: admin@cms.com
echo    • Senha: admin123
echo.
echo 🚀 Para iniciar o CMS, execute:
echo    npm run dev
echo.
pause


