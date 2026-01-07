#!/bin/bash
# Script para limpar arquivo corrompido no servidor antes do auto-fix

cd /var/www/crm.gteck.com.br

echo "🔧 Limpando arquivo corrompido no servidor..."
echo ""

# Fazer stash das mudanças locais
echo "📦 Fazendo stash das mudanças locais..."
git stash

# Fazer pull
echo "⬇️  Fazendo pull..."
git pull

# Verificar se o arquivo ainda tem problema
if grep -q "________________" app/api/pressel/create/route.ts 2>/dev/null; then
    echo "⚠️  Arquivo ainda tem underscores múltiplos, removendo linha problemática..."
    # Remover linha com credentials não utilizada
    sed -i '/const.*credentials.*searchParams.get/d' app/api/pressel/create/route.ts
    echo "✅ Linha removida"
fi

echo ""
echo "✅ Arquivo limpo! Agora execute:"
echo "   npx tsx scripts/auto-fix-build.ts --apply"


