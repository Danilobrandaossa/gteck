#!/bin/bash

echo "🔍 DIAGNÓSTICO DO SERVIDOR - crm.gteck.com.br"
echo "================================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd /var/www/crm.gteck.com.br

echo "1️⃣ Verificando status do PM2..."
echo "-----------------------------------"
pm2 status
echo ""

echo "2️⃣ Verificando se BUILD_ID existe..."
echo "-----------------------------------"
if [ -f .next/BUILD_ID ]; then
    echo -e "${GREEN}✅ BUILD_ID encontrado:$(cat .next/BUILD_ID)${NC}"
else
    echo -e "${RED}❌ BUILD_ID NÃO encontrado - Build não foi concluído!${NC}"
fi
echo ""

echo "3️⃣ Verificando se aplicação responde na porta 3000..."
echo "-----------------------------------"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ Aplicação está respondendo na porta 3000${NC}"
    curl -s http://localhost:3000 | head -20
else
    echo -e "${RED}❌ Aplicação NÃO está respondendo na porta 3000${NC}"
fi
echo ""

echo "4️⃣ Verificando status do Nginx..."
echo "-----------------------------------"
systemctl status nginx --no-pager | head -10
echo ""

echo "5️⃣ Verificando se Nginx está escutando na porta 80..."
echo "-----------------------------------"
if netstat -tlnp | grep -q ":80.*nginx"; then
    echo -e "${GREEN}✅ Nginx está escutando na porta 80${NC}"
else
    echo -e "${RED}❌ Nginx NÃO está escutando na porta 80${NC}"
fi
echo ""

echo "6️⃣ Testando configuração do Nginx..."
echo "-----------------------------------"
nginx -t
echo ""

echo "7️⃣ Últimas linhas do log de erro do PM2..."
echo "-----------------------------------"
pm2 logs crm-gteck --err --lines 10 --nostream
echo ""

echo "8️⃣ Verificando se o diretório .next existe..."
echo "-----------------------------------"
if [ -d .next ]; then
    echo -e "${GREEN}✅ Diretório .next existe${NC}"
    ls -la .next/ | head -10
else
    echo -e "${RED}❌ Diretório .next NÃO existe${NC}"
fi
echo ""

echo "9️⃣ Verificando últimas linhas do log do Nginx..."
echo "-----------------------------------"
if [ -f logs/error.log ]; then
    tail -20 logs/error.log
else
    echo -e "${YELLOW}⚠️ Arquivo de log do Nginx não encontrado${NC}"
fi
echo ""

echo "🔟 Verificando se variável DATABASE_URL está configurada..."
echo "-----------------------------------"
if grep -q "DATABASE_URL" .env.local 2>/dev/null; then
    echo -e "${GREEN}✅ DATABASE_URL encontrada em .env.local${NC}"
else
    echo -e "${YELLOW}⚠️ DATABASE_URL não encontrada em .env.local${NC}"
fi
echo ""

echo "================================================"
echo "📋 RESUMO:"
echo "================================================"

# Verificar se tudo está OK
ISSUES=0

if [ ! -f .next/BUILD_ID ]; then
    echo -e "${RED}❌ PROBLEMA: Build não foi concluído${NC}"
    ISSUES=$((ISSUES + 1))
fi

if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo -e "${RED}❌ PROBLEMA: Aplicação não está respondendo na porta 3000${NC}"
    ISSUES=$((ISSUES + 1))
fi

if ! systemctl is-active --quiet nginx; then
    echo -e "${RED}❌ PROBLEMA: Nginx não está rodando${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ Tudo parece estar funcionando!${NC}"
else
    echo -e "${YELLOW}⚠️ Encontrados $ISSUES problema(s)${NC}"
fi

echo ""

