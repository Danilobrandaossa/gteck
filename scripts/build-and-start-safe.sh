#!/bin/bash
# Script para build seguro e start do PM2
# NUNCA inicia PM2 se o build falhar

set -e  # Exit on error

cd /var/www/crm.gteck.com.br

echo "🔧 Build e Start Seguro"
echo "======================"
echo ""

# 1. Parar tudo do PM2 (evita duplicado)
echo "1️⃣ Parando todos os processos PM2..."
pm2 delete all || true
pm2 flush || true

# 2. Atualizar código
echo ""
echo "2️⃣ Atualizando código..."
git pull

# 3. Limpar build anterior
echo ""
echo "3️⃣ Limpando build anterior..."
rm -rf .next

# 4. Build fail-fast (NÃO continua se falhar)
echo ""
echo "4️⃣ Executando build..."
npm run build || {
  echo ""
  echo "❌ BUILD FALHOU!"
  echo "⚠️  PM2 NÃO será iniciado"
  echo ""
  echo "Execute os comandos de correção:"
  echo "  npx tsx scripts/auto-fix-build-v2.ts --apply"
  exit 1
}

# 5. Verificar BUILD_ID
echo ""
echo "5️⃣ Verificando BUILD_ID..."
if [ ! -f .next/BUILD_ID ]; then
  echo ""
  echo "❌ BUILD_ID não encontrado!"
  echo "⚠️  PM2 NÃO será iniciado"
  exit 1
fi

echo "✅ BUILD_ID encontrado: $(cat .next/BUILD_ID)"

# 6. Iniciar PM2 (só se build passou)
echo ""
echo "6️⃣ Iniciando PM2..."
pm2 start npm --name "crm-gteck" -- start
pm2 save

# 7. Verificar status
echo ""
echo "7️⃣ Status do PM2:"
pm2 list

# 8. Mostrar logs
echo ""
echo "8️⃣ Últimas 50 linhas de log:"
pm2 logs crm-gteck --lines 50 --nostream

# 9. Testar aplicação
echo ""
echo "9️⃣ Testando aplicação..."
sleep 2
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
  echo "✅ Aplicação respondendo na porta 3000"
else
  echo "⚠️  Aplicação não está respondendo na porta 3000"
  echo "Verifique os logs: pm2 logs crm-gteck"
fi

echo ""
echo "✅ Processo concluído!"
echo ""
echo "📋 Comandos úteis:"
echo "  pm2 logs crm-gteck --lines 100"
echo "  pm2 restart crm-gteck"
echo "  pm2 status"


