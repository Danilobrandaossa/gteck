#!/bin/bash

# Script de Diagnóstico para Erro 502 Bad Gateway
# Execute no servidor: bash scripts/diagnostico-502.sh

echo "🔍 DIAGNÓSTICO: Erro 502 Bad Gateway"
echo "===================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar status
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# 1. Verificar se nginx está rodando
echo "1. Verificando Nginx..."
if systemctl is-active --quiet nginx; then
    check_status 0 "Nginx está rodando"
else
    check_status 1 "Nginx NÃO está rodando"
    echo "   Execute: systemctl start nginx"
fi
echo ""

# 2. Verificar se há processo na porta 3000
echo "2. Verificando porta 3000..."
if lsof -i :3000 > /dev/null 2>&1 || netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    check_status 0 "Porta 3000 está em uso"
    echo "   Processos na porta 3000:"
    lsof -i :3000 2>/dev/null || netstat -tlnp 2>/dev/null | grep ":3000"
else
    check_status 1 "Porta 3000 NÃO está em uso - Aplicação não está rodando!"
    echo "   Execute: pm2 start npm --name 'crm-gteck' -- start"
fi
echo ""

# 3. Verificar se PM2 está instalado e rodando
echo "3. Verificando PM2..."
if command -v pm2 &> /dev/null; then
    check_status 0 "PM2 está instalado"
    echo "   Processos PM2:"
    pm2 list 2>/dev/null || echo "   Nenhum processo PM2 rodando"
else
    check_status 1 "PM2 NÃO está instalado"
    echo "   Execute: npm install -g pm2"
fi
echo ""

# 4. Verificar se o diretório do projeto existe
echo "4. Verificando diretório do projeto..."
PROJECT_DIR="/var/www/crm.gteck.com.br"
if [ -d "$PROJECT_DIR" ]; then
    check_status 0 "Diretório do projeto existe: $PROJECT_DIR"
    cd "$PROJECT_DIR" || exit 1
else
    check_status 1 "Diretório do projeto NÃO existe: $PROJECT_DIR"
    exit 1
fi
echo ""

# 5. Verificar se o build foi feito
echo "5. Verificando build..."
if [ -d ".next" ]; then
    check_status 0 "Build existe (pasta .next encontrada)"
else
    check_status 1 "Build NÃO existe - Execute: npm run build"
fi
echo ""

# 6. Verificar se node_modules existe
echo "6. Verificando dependências..."
if [ -d "node_modules" ]; then
    check_status 0 "Dependências instaladas (node_modules existe)"
else
    check_status 1 "Dependências NÃO instaladas - Execute: npm install"
fi
echo ""

# 7. Verificar arquivo .env.local
echo "7. Verificando variáveis de ambiente..."
if [ -f ".env.local" ]; then
    check_status 0 "Arquivo .env.local existe"
    if grep -q "NODE_ENV=production" .env.local 2>/dev/null; then
        check_status 0 "NODE_ENV configurado"
    else
        check_status 1 "NODE_ENV não configurado em .env.local"
    fi
    if grep -q "PORT=3000" .env.local 2>/dev/null; then
        check_status 0 "PORT configurado"
    else
        check_status 1 "PORT não configurado em .env.local"
    fi
else
    check_status 1 "Arquivo .env.local NÃO existe - Crie e configure as variáveis"
fi
echo ""

# 8. Verificar Prisma Client
echo "8. Verificando Prisma..."
if [ -d "node_modules/.prisma" ] || [ -f "node_modules/@prisma/client" ]; then
    check_status 0 "Prisma Client parece estar instalado"
else
    check_status 1 "Prisma Client pode não estar gerado - Execute: npx prisma generate"
fi
echo ""

# 9. Verificar configuração do nginx
echo "9. Verificando configuração do Nginx..."
NGINX_CONFIG="/etc/nginx/sites-available/crm.gteck.com.br"
if [ -f "$NGINX_CONFIG" ]; then
    check_status 0 "Configuração do Nginx existe"
    if grep -q "proxy_pass http://localhost:3000" "$NGINX_CONFIG"; then
        check_status 0 "Nginx configurado para porta 3000"
    else
        check_status 1 "Nginx NÃO está configurado para porta 3000"
    fi
    # Verificar se está habilitado
    if [ -L "/etc/nginx/sites-enabled/crm.gteck.com.br" ]; then
        check_status 0 "Site habilitado no Nginx"
    else
        check_status 1 "Site NÃO está habilitado - Execute: ln -s $NGINX_CONFIG /etc/nginx/sites-enabled/"
    fi
else
    check_status 1 "Configuração do Nginx NÃO existe: $NGINX_CONFIG"
fi
echo ""

# 10. Verificar logs do nginx
echo "10. Últimas linhas do log de erro do Nginx:"
if [ -f "/var/www/crm.gteck.com.br/logs/error.log" ]; then
    echo "   Últimas 5 linhas:"
    tail -n 5 /var/www/crm.gteck.com.br/logs/error.log 2>/dev/null | sed 's/^/   /'
elif [ -f "/var/log/nginx/error.log" ]; then
    echo "   Últimas 5 linhas:"
    tail -n 5 /var/log/nginx/error.log 2>/dev/null | grep -i "crm\|502" | sed 's/^/   /' || echo "   Nenhum erro relacionado encontrado"
else
    echo "   Log de erro não encontrado"
fi
echo ""

# 11. Testar conexão local
echo "11. Testando conexão local na porta 3000..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    check_status 0 "Aplicação responde na porta 3000"
else
    check_status 1 "Aplicação NÃO responde na porta 3000"
    echo "   Resposta do curl:"
    curl -s http://localhost:3000 | head -n 3 | sed 's/^/   /' || echo "   Sem resposta"
fi
echo ""

# 12. Verificar Node.js
echo "12. Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_status 0 "Node.js instalado: $NODE_VERSION"
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        check_status 0 "NPM instalado: $NPM_VERSION"
    else
        check_status 1 "NPM NÃO está instalado"
    fi
else
    check_status 1 "Node.js NÃO está instalado"
fi
echo ""

# Resumo
echo "===================================="
echo "📋 RESUMO DO DIAGNÓSTICO"
echo "===================================="
echo ""
echo "Se a aplicação não está rodando, execute:"
echo ""
echo "  cd /var/www/crm.gteck.com.br"
echo "  npm install"
echo "  npm run build"
echo "  pm2 start npm --name 'crm-gteck' -- start"
echo "  pm2 save"
echo ""
echo "Para ver logs em tempo real:"
echo "  pm2 logs crm-gteck"
echo ""
echo "Para reiniciar tudo:"
echo "  pm2 restart crm-gteck"
echo "  systemctl reload nginx"
echo ""


