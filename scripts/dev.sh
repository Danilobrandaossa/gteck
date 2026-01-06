#!/bin/bash

echo "🚀 Iniciando CMS Moderno em modo desenvolvimento..."

# Verificar se containers estão rodando
if ! docker exec cms_postgres_dev pg_isready -U cms_user -d cms_modern > /dev/null 2>&1; then
    echo "❌ Banco de dados não está rodando. Execute: ./scripts/setup.sh"
    exit 1
fi

# Iniciar aplicação em modo desenvolvimento
echo "🔥 Iniciando Next.js em modo desenvolvimento..."
npm run dev

