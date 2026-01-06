@echo off
REM Script de configuração para desenvolvimento local no Windows

echo 🚀 Configurando CMS para desenvolvimento local...

REM 1. Copiar arquivo de ambiente
if not exist .env.local (
    echo 📝 Criando arquivo .env.local...
    copy env.local .env.local
    echo ✅ Arquivo .env.local criado
) else (
    echo ✅ Arquivo .env.local já existe
)

REM 2. Instalar dependências
echo 📦 Instalando dependências...
npm install

REM 3. Gerar cliente Prisma
echo 🔧 Gerando cliente Prisma...
npx prisma generate

REM 4. Criar banco de dados SQLite
echo 🗄️ Criando banco de dados SQLite...
npx prisma db push

REM 5. Popular dados iniciais (opcional)
echo 🌱 Populando dados iniciais...
node scripts/seed-local.js

echo ✅ Configuração local concluída!
echo 🚀 Execute 'npm run dev' para iniciar o servidor
pause





