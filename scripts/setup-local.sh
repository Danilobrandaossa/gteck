#!/bin/bash

# Script de configuração para desenvolvimento local
echo "🚀 Configurando CMS para desenvolvimento local..."

# 1. Copiar arquivo de ambiente
if [ ! -f .env.local ]; then
    echo "📝 Criando arquivo .env.local..."
    cp env.local .env.local
    echo "✅ Arquivo .env.local criado"
else
    echo "✅ Arquivo .env.local já existe"
fi

# 2. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 3. Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# 4. Criar banco de dados SQLite
echo "🗄️ Criando banco de dados SQLite..."
npx prisma db push

# 5. Popular dados iniciais (opcional)
echo "🌱 Populando dados iniciais..."
node scripts/seed-local.js

echo "✅ Configuração local concluída!"
echo "🚀 Execute 'npm run dev' para iniciar o servidor"





