# 🔍 Diagnóstico e Solução: Erro 502 Bad Gateway

## ❌ Problema Identificado

O site `https://crm.gteck.com.br/` está retornando **502 Bad Gateway**, o que significa:
- ✅ O **nginx está funcionando** (por isso você vê a página de erro)
- ❌ A **aplicação Next.js não está rodando** na porta 3000 no servidor

---

## 🔍 Passo 1: Verificar se a Aplicação está Rodando

Conecte-se ao servidor via SSH e execute:

```bash
# Verificar se há algum processo Node.js rodando na porta 3000
netstat -tlnp | grep 3000
# ou
ss -tlnp | grep 3000
# ou
lsof -i :3000
```

**Se não houver nenhum processo na porta 3000**, a aplicação não está rodando.

---

## 🔍 Passo 2: Verificar Logs do Nginx

```bash
# Ver logs de erro do nginx
tail -f /var/www/crm.gteck.com.br/logs/error.log
# ou
tail -f /var/log/nginx/error.log

# Ver logs de acesso
tail -f /var/www/crm.gteck.com.br/logs/access.log
```

Os logs devem mostrar algo como:
```
connect() failed (111: Connection refused) while connecting to upstream, client: ...
```

Isso confirma que o nginx não consegue conectar ao servidor na porta 3000.

---

## ✅ Solução: Iniciar a Aplicação Next.js

### Opção 1: Usando PM2 (Recomendado para Produção)

```bash
# Conectar ao servidor
ssh root@72.60.255.227

# Navegar para o diretório do projeto
cd /var/www/crm.gteck.com.br

# Verificar se PM2 está instalado
pm2 --version

# Se não estiver instalado:
npm install -g pm2

# Verificar se a aplicação já está rodando
pm2 list

# Se não estiver rodando, iniciar:
pm2 start npm --name "crm-gteck" -- start

# Verificar status
pm2 status

# Ver logs em tempo real
pm2 logs crm-gteck

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot (se ainda não foi feito)
pm2 startup
# Execute o comando que aparecer na tela
```

### Opção 2: Usando systemd Service

```bash
# Verificar se o serviço existe
systemctl status crm-gteck

# Se não existir, criar o serviço
nano /etc/systemd/system/crm-gteck.service
```

**Conteúdo do arquivo:**
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
StandardOutput=append:/var/www/crm.gteck.com.br/logs/app.log
StandardError=append:/var/www/crm.gteck.com.br/logs/app.error.log

[Install]
WantedBy=multi-user.target
```

**Ativar e iniciar o serviço:**
```bash
systemctl daemon-reload
systemctl enable crm-gteck
systemctl start crm-gteck
systemctl status crm-gteck
```

### Opção 3: Executar Manualmente (Apenas para Teste)

```bash
cd /var/www/crm.gteck.com.br
npm start
```

**⚠️ Atenção:** Esta opção não é recomendada para produção, pois o processo será encerrado quando você desconectar do SSH.

---

## 🔍 Passo 3: Verificar se o Build foi Feito

Antes de iniciar a aplicação, certifique-se de que o build foi feito:

```bash
cd /var/www/crm.gteck.com.br

# Verificar se existe a pasta .next
ls -la .next

# Se não existir, fazer o build:
npm run build
```

---

## 🔍 Passo 4: Verificar Variáveis de Ambiente

```bash
cd /var/www/crm.gteck.com.br

# Verificar se o arquivo .env.local existe
ls -la .env.local

# Se não existir, criar:
nano .env.local
```

**Variáveis mínimas necessárias:**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://usuario:senha@localhost:5432/cms_modern"
NEXTAUTH_URL="https://crm.gteck.com.br"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
```

---

## 🔍 Passo 5: Verificar Dependências

```bash
cd /var/www/crm.gteck.com.br

# Verificar se node_modules existe
ls -la node_modules

# Se não existir, instalar:
npm install

# Gerar Prisma Client
npx prisma generate
```

---

## 🔍 Passo 6: Verificar Banco de Dados

```bash
# Verificar se o PostgreSQL está rodando
systemctl status postgresql

# Testar conexão
psql -U usuario -d cms_modern -h localhost -c "SELECT 1;"
```

---

## ✅ Verificação Final

Após iniciar a aplicação, verifique:

```bash
# 1. Verificar se a aplicação está rodando na porta 3000
curl http://localhost:3000

# 2. Verificar logs do nginx
tail -f /var/www/crm.gteck.com.br/logs/error.log

# 3. Testar o domínio
curl http://crm.gteck.com.br
```

---

## 🐛 Troubleshooting Adicional

### Problema: Aplicação inicia mas para logo depois

```bash
# Ver logs detalhados
pm2 logs crm-gteck --lines 100
# ou
journalctl -u crm-gteck -f
```

### Problema: Erro de permissões

```bash
# Corrigir permissões
chown -R www-data:www-data /var/www/crm.gteck.com.br
chmod -R 755 /var/www/crm.gteck.com.br
```

### Problema: Porta 3000 já está em uso

```bash
# Verificar qual processo está usando a porta 3000
lsof -i :3000

# Matar o processo (substitua PID pelo número do processo)
kill -9 PID
```

### Problema: Erro de memória

```bash
# Verificar uso de memória
free -h

# Se necessário, aumentar limite de memória do Node.js
# Editar o arquivo do serviço e adicionar:
Environment=NODE_OPTIONS="--max-old-space-size=2048"
```

---

## 📋 Checklist Rápido

- [ ] Aplicação Next.js está rodando na porta 3000?
- [ ] Build foi feito (pasta `.next` existe)?
- [ ] Arquivo `.env.local` existe e está configurado?
- [ ] Dependências instaladas (`node_modules` existe)?
- [ ] Prisma Client gerado?
- [ ] Banco de dados está acessível?
- [ ] Nginx está configurado corretamente?
- [ ] Logs não mostram erros críticos?

---

## 🚀 Comandos Rápidos de Recuperação

```bash
# Reiniciar tudo
cd /var/www/crm.gteck.com.br
pm2 restart crm-gteck
systemctl reload nginx

# Ou se usar systemd:
systemctl restart crm-gteck
systemctl reload nginx
```

---

**Última atualização:** 2026-01-06


