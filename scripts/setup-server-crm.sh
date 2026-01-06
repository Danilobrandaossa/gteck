#!/bin/bash

# Script de configuração do servidor para crm.gteck.com.br
# Execute como root no servidor

set -e

echo "🚀 Configurando servidor para crm.gteck.com.br..."

# 1. Criar estrutura de diretórios
echo "📁 Criando estrutura de diretórios..."
mkdir -p /var/www/crm.gteck.com.br
mkdir -p /var/www/crm.gteck.com.br/logs
mkdir -p /var/www/crm.gteck.com.br/backups
cd /var/www/crm.gteck.com.br

# 2. Definir permissões
echo "🔐 Configurando permissões..."
chown -R www-data:www-data /var/www/crm.gteck.com.br
chmod -R 755 /var/www/crm.gteck.com.br

# 3. Criar configuração do Nginx para Next.js
echo "⚙️ Criando configuração do Nginx..."
cat > /etc/nginx/sites-available/crm.gteck.com.br << 'EOF'
# Configuração para crm.gteck.com.br - Next.js Application
server {
    listen 80;
    server_name crm.gteck.com.br;

    # Logs
    access_log /var/www/crm.gteck.com.br/logs/access.log;
    error_log /var/www/crm.gteck.com.br/logs/error.log;

    # Tamanho máximo de upload (para imagens/vídeos)
    client_max_body_size 100M;

    # Proxy para aplicação Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache para assets estáticos
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Cache para imagens
    location /images {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1h;
        add_header Cache-Control "public";
    }
}
EOF

# 4. Ativar site
echo "🔗 Ativando site..."
ln -sf /etc/nginx/sites-available/crm.gteck.com.br /etc/nginx/sites-enabled/

# 5. Testar configuração
echo "🧪 Testando configuração do Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração do Nginx válida!"
    echo "🔄 Recarregando Nginx..."
    systemctl reload nginx
    echo "✅ Nginx recarregado com sucesso!"
else
    echo "❌ Erro na configuração do Nginx. Verifique os logs."
    exit 1
fi

# 6. Verificar status
echo ""
echo "📊 Status do Nginx:"
systemctl status nginx --no-pager -l | head -10

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure o domínio crm.gteck.com.br para apontar para o IP: 72.60.255.227"
echo "2. Faça upload do projeto para /var/www/crm.gteck.com.br"
echo "3. Instale as dependências: npm install"
echo "4. Configure as variáveis de ambiente em .env.local"
echo "5. Faça o build: npm run build"
echo "6. Inicie o servidor: npm start (ou use PM2 para produção)"
echo ""
echo "💡 Para usar PM2 (recomendado para produção):"
echo "   npm install -g pm2"
echo "   pm2 start npm --name 'crm-gteck' -- start"
echo "   pm2 save"
echo "   pm2 startup"

