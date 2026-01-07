# 👥 Lista de Usuários do Sistema

## 📋 Usuários Conhecidos

### **1. Usuário Admin Padrão**

- **Email:** `admin@cms.local`
- **Senha:** `password`
- **Nome:** Administrador
- **Role:** `admin`
- **Status:** Ativo
- **Criado por:** Script `seed-local.js`

**Hash da senha (bcrypt):**
```
$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
```

---

### **2. Usuário Solicitado (em criação)**

- **Email:** `contato@danilobrandao.com.br`
- **Senha:** `Zy598859D@n2`
- **Nome:** Danilo Brandão
- **Role:** `admin` (planejado)
- **Status:** Não criado ainda (erro 500)

**Hash da senha (bcrypt) - pré-gerado:**
```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

---

## 🔍 Como Listar Usuários

### **Método 1: Via API (quando funcionar)**

```bash
powershell -ExecutionPolicy Bypass -File scripts/list-users-api.ps1
```

Ou manualmente:
```bash
curl http://localhost:5000/api/admin/list-users
```

### **Método 2: Via Prisma Studio (Recomendado)**

1. Abrir Prisma Studio:
   ```bash
   # Para SQLite local
   npm run db:local:studio
   
   # Para PostgreSQL
   npx prisma studio
   ```

2. Navegar até a tabela `User`
3. Ver todos os usuários cadastrados

### **Método 3: Via Script Node.js**

```bash
node scripts/list-users.js
```

**Nota:** Requer configuração correta do banco de dados.

---

## 🔐 Sobre Senhas

### **Importante:**
- As senhas são armazenadas como **hash bcrypt** no banco de dados
- **Não é possível** recuperar a senha original do hash
- Apenas senhas conhecidas (como a padrão do seed) podem ser informadas

### **Senhas Conhecidas:**
- `admin@cms.local` → `password` (padrão do seed)
- `contato@danilobrandao.com.br` → `Zy598859D@n2` (solicitada, mas não criada ainda)

---

## 📊 Estrutura do Usuário

Cada usuário no banco tem:
- `id`: ID único (CUID)
- `email`: Email do usuário (único)
- `name`: Nome completo
- `password`: Hash bcrypt da senha
- `role`: `admin`, `editor`, ou `viewer`
- `isActive`: `true` ou `false`
- `organizationId`: ID da organização
- `createdAt`: Data de criação
- `updatedAt`: Data de atualização

---

## 🚨 Segurança

⚠️ **ATENÇÃO:**
- As senhas são armazenadas como hash e **não podem ser recuperadas**
- Para resetar uma senha, é necessário gerar um novo hash
- Use o Prisma Studio ou uma rota API protegida para gerenciar usuários

---

## 🔄 Próximos Passos

1. **Verificar conexão do banco de dados**
2. **Criar o usuário `contato@danilobrandao.com.br` via Prisma Studio**
3. **Listar usuários via Prisma Studio** para ver todos os cadastrados

---

**Criado em:** Janeiro 2025  
**Última atualização:** Janeiro 2025





