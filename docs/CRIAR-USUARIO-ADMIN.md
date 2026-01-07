# 👤 Como Criar Usuário Admin

## 📋 Informações do Usuário

- **Email:** `contato@danilobrandao.com.br`
- **Senha:** `Zy598859D@n2`
- **Nome:** Danilo Brandão
- **Role:** admin

---

## 🚀 Método 1: Via API (Recomendado)

### Passo 1: Iniciar o servidor
```bash
npm run dev
```

### Passo 2: Executar o script
```bash
powershell -ExecutionPolicy Bypass -File scripts/create-user-api.ps1
```

Ou manualmente via curl:
```bash
curl -X POST http://localhost:4000/api/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contato@danilobrandao.com.br",
    "password": "Zy598859D@n2",
    "name": "Danilo Brandão"
  }'
```

---

## 🛠️ Método 2: Via Script Node.js (Se o banco estiver configurado)

### Para SQLite (desenvolvimento local):
```bash
# 1. Gerar Prisma Client com schema SQLite
npm run db:local:generate

# 2. Executar script
node scripts/create-user-local.js
```

### Para PostgreSQL (produção):
```bash
# 1. Certifique-se de que DATABASE_URL está configurado no .env.local
# 2. Executar script
node scripts/create-user.js
```

---

## 📝 Método 3: Via Prisma Studio (Interface Visual)

1. Abrir Prisma Studio:
   ```bash
   # Para SQLite local
   npm run db:local:studio
   
   # Para PostgreSQL
   npx prisma studio
   ```

2. Navegar até a tabela `User`
3. Clicar em "Add record"
4. Preencher os campos:
   - `email`: `contato@danilobrandao.com.br`
   - `name`: `Danilo Brandão`
   - `password`: (hash bcrypt - ver abaixo)
   - `role`: `admin`
   - `isActive`: `true`
   - `organizationId`: (ID de uma organização existente)

### Gerar hash da senha:
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('Zy598859D@n2', 10);
console.log(hash);
```

---

## 🔐 Gerar Hash da Senha Manualmente

Se precisar gerar o hash da senha manualmente:

```javascript
// Node.js
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('Zy598859D@n2', 10);
console.log(hash);
```

Ou via API online:
- https://bcrypt-generator.com/
- Use 10 rounds
- Senha: `Zy598859D@n2`

---

## ✅ Verificar se o Usuário foi Criado

### Via API:
```bash
curl http://localhost:4000/api/users
```

### Via Prisma Studio:
1. Abrir Prisma Studio
2. Verificar tabela `User`
3. Procurar por `contato@danilobrandao.com.br`

---

## 🚨 Solução de Problemas

### Erro: "Authentication failed"
- Verifique se o banco de dados está configurado corretamente
- Verifique a `DATABASE_URL` no `.env.local`
- Para SQLite: `DATABASE_URL="file:./dev.db"`

### Erro: "Email já está em uso"
- O usuário já existe
- O script atualizará a senha automaticamente

### Erro: "Cannot connect to server"
- Certifique-se de que o servidor está rodando (`npm run dev`)
- Verifique se a porta 4000 está livre

---

## 🔒 Segurança

⚠️ **IMPORTANTE:** Após criar o usuário, considere:
1. Remover a rota `/api/admin/create-user` em produção
2. Alterar a senha padrão após o primeiro login
3. Usar autenticação adequada para criar usuários em produção

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do servidor
2. Verifique a configuração do banco de dados
3. Certifique-se de que todas as dependências estão instaladas (`npm install`)

---

**Criado em:** Janeiro 2025  
**Usuário:** contato@danilobrandao.com.br





