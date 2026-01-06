#!/bin/bash

# Script Bash para fazer deploy do projeto para o servidor
# Execute: bash scripts/deploy-to-server.sh

set -e

SERVER_IP="72.60.255.227"
SERVER_USER="root"
REMOTE_PATH="/var/www/crm.gteck.com.br"
LOCAL_PATH="."

echo "🚀 Iniciando deploy para o servidor..."
echo "Servidor: $SERVER_USER@$SERVER_IP"
echo "Destino: $REMOTE_PATH"
echo ""

# Verificar se rsync está instalado
if ! command -v rsync &> /dev/null; then
    echo "❌ Erro: rsync não está instalado."
    echo "   Instale com: sudo apt install rsync"
    exit 1
fi

# Lista de exclusões
EXCLUDE_PATTERNS=(
    "node_modules"
    ".next"
    ".git"
    ".env.local"
    "*.log"
    ".DS_Store"
    "Thumbs.db"
    "*.swp"
    "*.swo"
    ".vscode"
    ".idea"
    "dist"
    "build"
)

echo "⚠️  ATENÇÃO: Este script fará upload dos arquivos do projeto."
echo "   Certifique-se de que:"
echo "   1. O arquivo .env.local NÃO será enviado (por segurança)"
echo "   2. Você precisa configurar .env.local manualmente no servidor"
echo "   3. node_modules será instalado no servidor (npm install)"
echo ""

read -p "Deseja continuar? (s/N): " confirm
if [[ ! $confirm =~ ^[Ss]$ ]]; then
    echo "❌ Deploy cancelado."
    exit 0
fi

echo ""
echo "📤 Fazendo upload dos arquivos..."

# Construir string de exclusões para rsync
EXCLUDE_ARGS=""
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude='$pattern'"
done

# Fazer upload com rsync
rsync -avz --progress \
    $EXCLUDE_ARGS \
    "$LOCAL_PATH/" \
    "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Upload concluído!"
    echo ""
    echo "📝 Próximos passos no servidor:"
    echo "   1. SSH no servidor: ssh $SERVER_USER@$SERVER_IP"
    echo "   2. cd $REMOTE_PATH"
    echo "   3. Criar .env.local com as variáveis de ambiente"
    echo "   4. npm install"
    echo "   5. npx prisma generate"
    echo "   6. npm run build"
    echo "   7. pm2 start npm --name 'crm-gteck' -- start"
    echo ""
else
    echo ""
    echo "❌ Erro durante o upload. Verifique a conexão e tente novamente."
    exit 1
fi

