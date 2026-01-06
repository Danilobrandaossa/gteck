#!/bin/bash

# Script de Deploy para Produção
# Uso: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="cms-moderno"

echo "🚀 Iniciando deploy para $ENVIRONMENT..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker e tente novamente."
    exit 1
fi

# Verificar se arquivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado. Copie o env.example para .env e configure as variáveis."
    exit 1
fi

# Carregar variáveis de ambiente
export $(cat .env | grep -v '^#' | xargs)

echo "📦 Construindo imagens Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🛑 Parando containers existentes..."
docker-compose -f docker-compose.prod.yml down

echo "🗄️ Fazendo backup do banco de dados..."
if [ -d "backups" ]; then
    BACKUP_FILE="backups/backup-$(date +%Y%m%d-%H%M%S).sql"
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > $BACKUP_FILE
    echo "✅ Backup salvo em $BACKUP_FILE"
fi

echo "🚀 Iniciando containers..."
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

echo "🔍 Verificando saúde dos serviços..."

# Verificar CMS
if curl -f http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ CMS está rodando"
else
    echo "❌ CMS não está respondendo"
    docker-compose -f docker-compose.prod.yml logs cms
    exit 1
fi

# Verificar PostgreSQL
if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U $POSTGRES_USER > /dev/null 2>&1; then
    echo "✅ PostgreSQL está rodando"
else
    echo "❌ PostgreSQL não está respondendo"
    docker-compose -f docker-compose.prod.yml logs postgres
    exit 1
fi

# Verificar Redis
if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis está rodando"
else
    echo "❌ Redis não está respondendo"
    docker-compose -f docker-compose.prod.yml logs redis
    exit 1
fi

echo "🔧 Executando migrações do banco de dados..."
docker-compose -f docker-compose.prod.yml exec cms npx prisma migrate deploy

echo "🌱 Executando seed do banco de dados..."
docker-compose -f docker-compose.prod.yml exec cms npx prisma db seed

echo "📊 Verificando status dos containers..."
docker-compose -f docker-compose.prod.yml ps

echo "🎉 Deploy concluído com sucesso!"
echo ""
echo "📋 Informações do deploy:"
echo "   Environment: $ENVIRONMENT"
echo "   CMS URL: http://localhost:3002"
echo "   n8n URL: http://localhost:5678"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "📝 Logs dos serviços:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🛑 Para parar os serviços:"
echo "   docker-compose -f docker-compose.prod.yml down"
echo ""
echo "🔄 Para atualizar:"
echo "   ./scripts/deploy.sh $ENVIRONMENT"

