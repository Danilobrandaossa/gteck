# 🚀 INICIAR SERVIDOR LOCAL — Guia Rápido

**Problema:** `ERR_CONNECTION_REFUSED` ao acessar `localhost:4000`

---

## ✅ SOLUÇÃO RÁPIDA

### **1. Verificar se Servidor Está Rodando**
```powershell
# Verificar porta 4000
netstat -ano | findstr :4000

# Ver processos Node
tasklist | findstr node
```

### **2. Iniciar Servidor**
```powershell
# Navegar para o diretório do projeto
cd "C:\Users\ueles\OneDrive\Área de Trabalho\CMS"

# Iniciar servidor de desenvolvimento
npm run dev
```

**O servidor iniciará em:** `http://localhost:4000`

---

## 🔧 SE A PORTA 4000 ESTIVER EM USO

### **Opção 1: Matar Processo na Porta 4000**
```powershell
# Encontrar PID do processo
netstat -ano | findstr :4000

# Matar processo (substituir PID)
taskkill /PID <PID> /F

# Reiniciar servidor
npm run dev
```

### **Opção 2: Matar Todos os Processos Node**
```powershell
Get-Process -Name node | Stop-Process -Force
npm run dev
```

### **Opção 3: Usar Outra Porta**
Editar `package.json`:
```json
"scripts": {
  "dev": "next dev -p 3000 -H 0.0.0.0"
}
```

Depois: `npm run dev` → Acessar `http://localhost:3000`

---

## ✅ VERIFICAR SE SERVIDOR ESTÁ RODANDO

### **Teste Rápido (PowerShell)**
```powershell
# Testar endpoint de health
Invoke-WebRequest -Uri "http://localhost:4000/api/health" -Method GET
```

### **Teste no Navegador**
```
http://localhost:4000/dashboard
```

---

## 📊 DASHBOARDS DISPONÍVEIS

Após iniciar o servidor:

1. **Dashboard Principal**
   ```
   http://localhost:4000/dashboard
   ```

2. **Admin AI**
   ```
   http://localhost:4000/admin/ai
   ```

3. **WordPress Diagnostic**
   ```
   http://localhost:4000/wordpress-diagnostic
   ```

---

## 🐛 TROUBLESHOOTING

### **Erro: "Porta já em uso"**
```powershell
# Matar processo
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### **Erro: "Banco de dados não conectado"**
```powershell
# Verificar Docker
docker ps

# Iniciar banco se necessário
docker-compose -f docker-compose.dev.yml up -d postgres redis
```

### **Erro: "Módulos não encontrados"**
```powershell
# Instalar dependências
npm install
```

---

## ✅ CHECKLIST

- [ ] Servidor iniciado (`npm run dev`)
- [ ] Porta 4000 livre
- [ ] Banco de dados rodando (Docker)
- [ ] Dashboard acessível (`http://localhost:4000/dashboard`)

---

**Status:** ✅ **GUIA PRONTO**






