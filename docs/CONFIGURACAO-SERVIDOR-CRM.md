# 🚀 Configuração do Servidor - crm.gteck.com.br

**Servidor:** 72.60.255.227  
**Domínio:** crm.gteck.com.br  
**Sistema:** Ubuntu 24.04.3 LTS

---

## ✅ Status Atual

- ✅ Pasta criada: `/var/www/crm.gteck.com.br`
- ✅ Nginx instalado (versão 1.24.0)
- ✅ Configuração básica criada
- ⚠️ **Ainda falta:** Configurar reverse proxy para Next.js

---

## 🔧 Passo 1: Atualizar Configuração do Nginx

Você já criou o arquivo de configuração, mas precisa atualizá-lo para funcionar com Next.js. Execute no servidor:

```bash
# Editar configuração
nano /etc/nginx/sites-available/crm.gteck.com.br
```

**Substitua o conteúdo por:**

```nginx
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
```

**Salvar e sair:** `Ctrl+X`, depois `Y`, depois `Enter`

---

## 🔄 Passo 2: Recarregar Nginx

```bash
# Testar configuração
nginx -t

# Se tudo estiver OK, recarregar
systemctl reload nginx
```

---

## 📦 Passo 3: Instalar Node.js e NPM (se necessário)

```bash
# Verificar se Node.js está instalado
node -v
npm -v

# Se não estiver instalado:
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar instalação
node -v  # Deve mostrar v20.x.x
npm -v   # Deve mostrar 10.x.x
```

---

## 📥 Passo 4: Fazer Upload do Projeto

### Opção 1: Via Git (Recomendado)

```bash
cd /var/www/crm.gteck.com.br

# Instalar Git (se necessário)
apt install -y git

# Clonar repositório (substitua pela URL do seu repositório)
git clone https://github.com/Danilobrandaossa/gteck.git .

# Ou se já tiver o repositório local, fazer push e depois pull no servidor
```

### Opção 2: Via SCP (do seu computador local)

```powershell
# No PowerShell do Windows
scp -r "C:\Users\ueles\OneDrive\Área de Trabalho\CMS\*" root@72.60.255.227:/var/www/crm.gteck.com.br/
```

### Opção 3: Via FTP/SFTP

Use um cliente FTP como FileZilla ou WinSCP para fazer upload dos arquivos.

---

## ⚙️ Passo 5: Configurar Variáveis de Ambiente

```bash
cd /var/www/crm.gteck.com.br

# Criar arquivo .env.local
nano .env.local
```

**Adicione as variáveis necessárias:**

```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/cms_modern"

# NextAuth
NEXTAUTH_URL="http://crm.gteck.com.br"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"

# API Keys
OPENAI_API_KEY="sua-chave-openai"
GOOGLE_AI_STUDIO_API_KEY="sua-chave-gemini"
GEMINI_API_KEY="sua-chave-gemini"

# Node Environment
NODE_ENV=production
PORT=3000
```

**Salvar:** `Ctrl+X`, `Y`, `Enter`

---

## 📦 Passo 6: Instalar Dependências e Build

```bash
cd /var/www/crm.gteck.com.br

# Instalar dependências
npm install

# Gerar Prisma Client
npx prisma generate

# Fazer build do projeto
npm run build
```

---

## 🚀 Passo 7: Iniciar Aplicação

### Opção 1: PM2 (Recomendado para Produção)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start npm --name "crm-gteck" -- start

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
# Execute o comando que aparecer na tela
```

### Opção 2: Systemd Service

```bash
# Criar serviço systemd
nano /etc/systemd/system/crm-gteck.service
```

**Conteúdo:**

```ini
[Unit]
Description=CRM Gteck Next.js Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/crm.gteck.com.br
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Ativar serviço:**

```bash
systemctl daemon-reload
systemctl enable crm-gteck
systemctl start crm-gteck
systemctl status crm-gteck
```

---

## 🔒 Passo 8: Configurar SSL/HTTPS (Let's Encrypt)

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
certbot --nginx -d crm.gteck.com.br

# Renovação automática
certbot renew --dry-run
```

---

## ✅ Verificação Final

1. **Verificar se aplicação está rodando:**
   ```bash
   # Com PM2
   pm2 status
   
   # Com systemd
   systemctl status crm-gteck
   ```

2. **Verificar se Nginx está funcionando:**
   ```bash
   systemctl status nginx
   curl http://localhost:3000
   ```

3. **Testar domínio:**
   - Configure o DNS para apontar `crm.gteck.com.br` para `72.60.255.227`
   - Acesse `http://crm.gteck.com.br` no navegador

---

## 🐛 Troubleshooting

### Problema: Aplicação não inicia

```bash
# Ver logs
pm2 logs crm-gteck
# ou
journalctl -u crm-gteck -f
```

### Problema: Erro 502 Bad Gateway

- Verifique se a aplicação está rodando na porta 3000:
  ```bash
  netstat -tlnp | grep 3000
  ```

- Verifique os logs do Nginx:
  ```bash
  tail -f /var/www/crm.gteck.com.br/logs/error.log
  ```

### Problema: Erro de permissões

```bash
chown -R www-data:www-data /var/www/crm.gteck.com.br
chmod -R 755 /var/www/crm.gteck.com.br
```

---

## 📝 Comandos Úteis

```bash
# Reiniciar aplicação (PM2)
pm2 restart crm-gteck

# Reiniciar aplicação (systemd)
systemctl restart crm-gteck

# Ver logs em tempo real
pm2 logs crm-gteck --lines 50

# Recarregar Nginx
systemctl reload nginx

# Ver processos Node
ps aux | grep node
```

---

## 🎯 Próximos Passos

1. ✅ Configurar DNS para apontar para o servidor
2. ✅ Configurar SSL/HTTPS
3. ✅ Configurar backup automático
4. ✅ Configurar monitoramento
5. ✅ Otimizar performance (cache, CDN, etc.)

---

**Última atualização:** 2026-01-06

