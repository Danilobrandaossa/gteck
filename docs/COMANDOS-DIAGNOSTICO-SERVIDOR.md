# 🔍 Comandos de Diagnóstico para o Servidor

Execute estes comandos no servidor para diagnosticar o problema:

## 1. Ver Logs do PM2 (MUITO IMPORTANTE)

```bash
# Ver os últimos logs
pm2 logs crm-gteck --lines 50

# Ver logs em tempo real
pm2 logs crm-gteck
```

## 2. Verificar se o Build foi Feito

```bash
cd /var/www/crm.gteck.com.br
ls -la .next
```

Se não existir a pasta `.next`, execute:
```bash
npm run build
```

## 3. Verificar Variáveis de Ambiente

```bash
cd /var/www/crm.gteck.com.br
cat .env.local
```

Verifique se contém pelo menos:
- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL=...`
- `NEXTAUTH_URL=...`
- `NEXTAUTH_SECRET=...`

## 4. Verificar Dependências

```bash
cd /var/www/crm.gteck.com.br
ls -la node_modules
```

Se não existir, execute:
```bash
npm install
npx prisma generate
```

## 5. Verificar Erros de Compilação

```bash
cd /var/www/crm.gteck.com.br
npm run build
```

## 6. Limpar Processos PM2 e Reiniciar

```bash
# Parar todos os processos
pm2 delete all

# Limpar logs
pm2 flush

# Iniciar novamente
cd /var/www/crm.gteck.com.br
pm2 start npm --name "crm-gteck" -- start

# Ver logs imediatamente
pm2 logs crm-gteck --lines 100
```

## 7. Verificar Porta 3000

```bash
# Ver o que está usando a porta 3000
lsof -i :3000
# ou
netstat -tlnp | grep 3000
```

## 8. Testar Aplicação Manualmente

```bash
cd /var/www/crm.gteck.com.br
npm start
```

Isso vai mostrar os erros diretamente no terminal.


