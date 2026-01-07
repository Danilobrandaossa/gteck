#!/bin/bash
# Script para limpar arquivo corrompido no servidor

cd /var/www/crm.gteck.com.br

echo "🔧 Limpando arquivo corrompido no servidor..."
echo ""

# Descartar mudanças locais do arquivo problemático
echo "📦 Descartando mudanças locais de app/api/pressel/process/route.ts..."
git checkout HEAD -- app/api/pressel/process/route.ts

# Fazer pull
echo "⬇️  Fazendo pull..."
git pull

echo ""
echo "✅ Arquivo limpo! Agora execute:"
echo "   rm -rf .next"
echo "   npm run build"
echo "   ls -la .next/BUILD_ID"


