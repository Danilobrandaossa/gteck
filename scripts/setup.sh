#!/bin/bash

echo "🚀 Configurando CMS Moderno..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker Desktop."
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose -f docker-compose.dev.yml down

# Remover volumes antigos (opcional)
read -p "🗑️  Deseja remover dados antigos? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removendo volumes antigos..."
    docker volume prune -f
fi

# Iniciar banco de dados e Redis
echo "🐘 Iniciando PostgreSQL e Redis..."
docker-compose -f docker-compose.dev.yml up -d postgres redis pgadmin

# Aguardar banco estar pronto
echo "⏳ Aguardando banco de dados..."
sleep 10

# Verificar se banco está rodando
if ! docker exec cms_postgres_dev pg_isready -U cms_user -d cms_modern > /dev/null 2>&1; then
    echo "❌ Banco de dados não está respondendo. Verifique os logs:"
    docker logs cms_postgres_dev
    exit 1
fi

echo "✅ Banco de dados está rodando!"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Configurar variáveis de ambiente
echo "⚙️  Configurando variáveis de ambiente..."
if [ ! -f .env.local ]; then
    cp env.example .env.local
    echo "📝 Arquivo .env.local criado. Configure as variáveis necessárias."
fi

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npm run db:generate

# Executar migrações
echo "🗄️  Executando migrações do banco..."
npm run db:push

# Popular dados iniciais
echo "🌱 Populando dados iniciais..."
npm run db:seed

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📊 Acessos disponíveis:"
echo "   • CMS: http://localhost:3000"
echo "   • PgAdmin: http://localhost:5050 (admin@cms.com / admin123)"
echo ""
echo "🚀 Para iniciar o desenvolvimento:"
echo "   npm run dev"
echo ""
echo "🛑 Para parar os serviços:"
echo "   docker-compose -f docker-compose.dev.yml down"

