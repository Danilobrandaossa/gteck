#!/bin/bash

echo "🚀 Iniciando CMS em modo de desenvolvimento..."

# Verificar se Docker Desktop está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker Desktop não está rodando. Por favor, inicie o Docker Desktop primeiro."
    exit 1
fi

echo "✅ Docker Desktop está rodando"

# Criar diretórios necessários
mkdir -p logs uploads database

# Configurar variáveis de ambiente se não existir
if [ ! -f .env.local ]; then
    echo "📝 Configurando variáveis de ambiente..."
    ./scripts/setup-env.sh
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose -f docker-compose.dev.yml down

# Iniciar banco de dados e Redis
echo "🗄️ Iniciando PostgreSQL e Redis..."
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Aguardar banco estar pronto
echo "⏳ Aguardando banco de dados estar pronto..."
sleep 10

# Verificar se banco está acessível
echo "🔍 Verificando conexão com banco de dados..."
until docker exec cms_postgres_dev pg_isready -U cms_user -d cms_modern; do
    echo "⏳ Aguardando PostgreSQL..."
    sleep 2
done

echo "✅ Banco de dados está pronto!"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npm run db:generate

# Executar migrações
echo "🗄️ Executando migrações do banco de dados..."
npm run db:push

# Iniciar PgAdmin
echo "🔧 Iniciando PgAdmin..."
docker-compose -f docker-compose.dev.yml up -d pgadmin

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📊 Serviços disponíveis:"
echo "   • CMS: http://localhost:3002"
echo "   • PgAdmin: http://localhost:5050"
echo "   • PostgreSQL: localhost:5433"
echo "   • Redis: localhost:6379"
echo ""
echo "🔑 Credenciais PgAdmin:"
echo "   • Email: admin@cms.com"
echo "   • Senha: admin123"
echo ""
echo "🚀 Para iniciar o CMS, execute:"
echo "   npm run dev"
echo ""


