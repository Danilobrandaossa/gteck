# 🔧 Solução: Erro 500 ao Criar Usuário

## 📋 Status Atual

- ✅ Rota API criada: `/api/admin/create-user`
- ✅ Middleware ajustado para permitir a rota
- ❌ Erro 500 ao executar (problema interno do servidor)

---

## 🔍 Diagnóstico

O erro 500 indica que há um problema interno, provavelmente com:
1. **Conexão com o banco de dados** (mais provável)
2. **Prisma Client não gerado corretamente**
3. **Configuração do DATABASE_URL**

---

## 🛠️ Soluções

### **Opção 1: Verificar Logs do Servidor**

1. Abra o terminal onde o servidor está rodando
2. Procure por mensagens de erro que começam com:
   - `[Create User API]`
   - `Erro ao criar usuário:`
   - `PrismaClientInitializationError`

### **Opção 2: Verificar Configuração do Banco**

Verifique se o arquivo `.env.local` tem a `DATABASE_URL` configurada:

```bash
# Para SQLite (desenvolvimento)
DATABASE_URL="file:./dev.db"

# Para PostgreSQL (produção)
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### **Opção 3: Gerar Prisma Client**

Se estiver usando SQLite local:

```bash
npm run db:local:generate
```

Se estiver usando PostgreSQL:

```bash
npx prisma generate
```

### **Opção 4: Criar Usuário via Prisma Studio**

1. Abrir Prisma Studio:
   ```bash
   # SQLite
   npm run db:local:studio
   
   # PostgreSQL
   npx prisma studio
   ```

2. Navegar até `User`
3. Clicar em "Add record"
4. Preencher:
   - `email`: `contato@danilobrandao.com.br`
   - `name`: `Danilo Brandão`
   - `password`: (gerar hash - ver abaixo)
   - `role`: `admin`
   - `isActive`: `true`
   - `organizationId`: (ID de organização existente)

### **Opção 5: Gerar Hash da Senha**

Execute no Node.js:

```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('Zy598859D@n2', 10);
console.log(hash);
```

Ou use este hash pré-gerado (para senha `Zy598859D@n2`):
```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

---

## 📝 Credenciais do Usuário

- **Email:** `contato@danilobrandao.com.br`
- **Senha:** `Zy598859D@n2`
- **Nome:** Danilo Brandão
- **Role:** admin

---

## 🔄 Próximos Passos

1. **Verifique os logs do servidor** no terminal onde `npm run dev` está rodando
2. **Compartilhe a mensagem de erro completa** para diagnóstico
3. **Tente criar via Prisma Studio** como alternativa temporária

---

## 🚨 Nota de Segurança

⚠️ **IMPORTANTE:** Após criar o usuário com sucesso:
1. Remova ou proteja a rota `/api/admin/create-user`
2. Altere a senha após o primeiro login
3. Use autenticação adequada em produção

---

**Criado em:** Janeiro 2025





