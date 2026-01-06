@echo off
echo 🚀 Configurando CMS Moderno...

REM Verificar se Docker está rodando
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker não está rodando. Por favor, inicie o Docker Desktop.
    pause
    exit /b 1
)

REM Parar containers existentes
echo 🛑 Parando containers existentes...
docker-compose -f docker-compose.dev.yml down

REM Perguntar sobre remover dados antigos
set /p remove_data="🗑️  Deseja remover dados antigos? (y/N): "
if /i "%remove_data%"=="y" (
    echo 🗑️  Removendo volumes antigos...
    docker volume prune -f
)

REM Iniciar banco de dados e Redis
echo 🐘 Iniciando PostgreSQL e Redis...
docker-compose -f docker-compose.dev.yml up -d postgres redis pgadmin

REM Aguardar banco estar pronto
echo ⏳ Aguardando banco de dados...
timeout /t 10 /nobreak >nul

REM Verificar se banco está rodando
docker exec cms_postgres_dev pg_isready -U cms_user -d cms_modern >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Banco de dados não está respondendo. Verifique os logs:
    docker logs cms_postgres_dev
    pause
    exit /b 1
)

echo ✅ Banco de dados está rodando!

REM Instalar dependências
echo 📦 Instalando dependências...
npm install

REM Configurar variáveis de ambiente
echo ⚙️  Configurando variáveis de ambiente...
if not exist .env.local (
    copy env.example .env.local
    echo 📝 Arquivo .env.local criado. Configure as variáveis necessárias.
)

REM Gerar cliente Prisma
echo 🔧 Gerando cliente Prisma...
npm run db:generate

REM Executar migrações
echo 🗄️  Executando migrações do banco...
npm run db:push

REM Popular dados iniciais
echo 🌱 Populando dados iniciais...
npm run db:seed

echo.
echo 🎉 Configuração concluída!
echo.
echo 📊 Acessos disponíveis:
echo    • CMS: http://localhost:3000
echo    • PgAdmin: http://localhost:5050 (admin@cms.com / admin123)
echo.
echo 🚀 Para iniciar o desenvolvimento:
echo    npm run dev
echo.
echo 🛑 Para parar os serviços:
echo    docker-compose -f docker-compose.dev.yml down
pause

