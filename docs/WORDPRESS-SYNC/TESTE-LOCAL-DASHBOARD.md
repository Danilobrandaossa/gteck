# 🧪 TESTE LOCAL — Dashboard WordPress Sync + IA

**Objetivo:** Testar WordPress Sync + IA localmente usando o dashboard

---

## 🚀 PASSO 1: INICIAR SERVIDOR LOCAL

### **Windows (PowerShell)**
```powershell
# 1. Iniciar Docker (se necessário)
# Certifique-se de que Docker Desktop está rodando

# 2. Iniciar banco de dados e Redis
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 3. Aguardar banco estar pronto (10 segundos)
Start-Sleep -Seconds 10

# 4. Gerar cliente Prisma
npm run db:generate

# 5. Executar migrações
npm run db:push

# 6. Iniciar servidor de desenvolvimento
npm run dev
```

### **Linux/Mac**
```bash
# 1. Iniciar Docker (se necessário)
# Certifique-se de que Docker está rodando

# 2. Iniciar banco de dados e Redis
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 3. Aguardar banco estar pronto
sleep 10

# 4. Gerar cliente Prisma
npm run db:generate

# 5. Executar migrações
npm run db:push

# 6. Iniciar servidor de desenvolvimento
npm run dev
```

**Servidor estará disponível em:** `http://localhost:4000`

---

## 📊 PASSO 2: ACESSAR DASHBOARDS

### **Dashboard Principal**
```
http://localhost:4000/dashboard
```

### **Dashboard Admin AI**
```
http://localhost:4000/admin/ai
```

### **WordPress Diagnostic**
```
http://localhost:4000/wordpress-diagnostic
```

---

## 🔗 PASSO 3: TESTAR ENDPOINTS ADMIN (CURL)

### **1. Health AI (Inclui WP Indexing)**
```bash
curl -X GET "http://localhost:4000/api/admin/ai/health?windowHours=24" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}"
```

**Se não tiver ADMIN_HEALTH_SECRET configurado:**
```bash
# Verificar .env.local
cat .env.local | grep ADMIN_HEALTH_SECRET

# Ou definir temporariamente
export ADMIN_HEALTH_SECRET=test-secret
```

---

### **2. Alerts AI (Inclui WP)**
```bash
curl -X GET "http://localhost:4000/api/admin/ai/alerts?windowHours=24" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}"
```

---

### **3. WordPress Sync Health**
```bash
curl -X GET "http://localhost:4000/api/admin/wordpress/sync-health?organizationId={orgId}&siteId={siteId}" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}"
```

**Substituir:**
- `{orgId}` — ID da organização
- `{siteId}` — ID do site

---

### **4. WordPress Conflicts**
```bash
curl -X GET "http://localhost:4000/api/admin/wordpress/conflicts?organizationId={orgId}&siteId={siteId}" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}"
```

---

### **5. Tenant Cost**
```bash
curl -X GET "http://localhost:4000/api/admin/ai/tenant-cost?organizationId={orgId}&siteId={siteId}" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}"
```

---

## 🧪 PASSO 4: TESTAR VIA NAVEGADOR

### **1. Acessar Dashboard Admin AI**
```
http://localhost:4000/admin/ai
```

**O que você verá:**
- Health snapshot (inclui `wpIndexing`)
- Alertas (inclui WP)
- Métricas de RAG
- Feedback correlations

---

### **2. Acessar WordPress Diagnostic**
```
http://localhost:4000/wordpress-diagnostic
```

**O que você pode fazer:**
- Validar site WordPress
- Configurar credenciais
- Testar conexão
- Ver status de sync

---

### **3. Acessar Dashboard Principal**
```
http://localhost:4000/dashboard
```

**O que você verá:**
- Visão geral do sistema
- Estatísticas gerais
- Links para outras seções

---

## 🔧 PASSO 5: CONFIGURAR SECRETS (SE NECESSÁRIO)

### **Verificar .env.local**
```bash
# Windows
type .env.local

# Linux/Mac
cat .env.local
```

### **Secrets Necessários:**
```env
# Admin Health Secret
ADMIN_HEALTH_SECRET=seu-secret-aqui

# Cron Secret
CRON_SECRET=seu-cron-secret-aqui

# WordPress Encryption Key
WORDPRESS_ENCRYPTION_KEY=sua-chave-32-chars-aqui
# ou
ENCRYPTION_KEY=sua-chave-32-chars-aqui
```

### **Criar/Atualizar .env.local**
```bash
# Windows
notepad .env.local

# Linux/Mac
nano .env.local
```

**Adicionar:**
```env
ADMIN_HEALTH_SECRET=test-admin-secret-2025
CRON_SECRET=test-cron-secret-2025
ENCRYPTION_KEY=test-encryption-key-32-chars-long
```

---

## 🧪 PASSO 6: EXECUTAR SMOKE TESTS

### **Via Script Automatizado**
```bash
npm run smoke:wp -- --siteId=seu-site-id --organizationId=sua-org-id
```

**Nota:** Você precisa ter:
- Um site criado no banco
- Uma organização criada no banco
- WordPress configurado (opcional para alguns testes)

---

## 📊 PASSO 7: VERIFICAR DADOS NO BANCO

### **Via Prisma Studio**
```bash
npm run db:studio
```

**Acessar:** `http://localhost:5555`

**Tabelas relevantes:**
- `sites` — Sites WordPress
- `pages` — Páginas/Posts WordPress
- `embedding_chunks` — Chunks de embeddings WP
- `sync_conflicts` — Conflitos de sync
- `queue_jobs` — Jobs de sync
- `ai_interactions` — Interações RAG

---

## 🔍 PASSO 8: VERIFICAR LOGS

### **Logs do Servidor**
Os logs aparecem no terminal onde você executou `npm run dev`

### **Logs Estruturados**
```bash
# Verificar se há arquivo de log
cat logs/app.log | tail -50
```

---

## ✅ CHECKLIST DE TESTE LOCAL

- [ ] Servidor iniciado (`npm run dev`)
- [ ] Banco de dados rodando (Docker)
- [ ] Migrações executadas (`npm run db:push`)
- [ ] Secrets configurados (`.env.local`)
- [ ] Dashboard acessível (`http://localhost:4000/dashboard`)
- [ ] Admin AI acessível (`http://localhost:4000/admin/ai`)
- [ ] Endpoints admin respondendo (curl)
- [ ] Prisma Studio acessível (`npm run db:studio`)

---

## 🐛 TROUBLESHOOTING

### **Erro: "ADMIN_HEALTH_SECRET não configurado"**
```bash
# Adicionar ao .env.local
echo ADMIN_HEALTH_SECRET=test-secret >> .env.local

# Reiniciar servidor
npm run dev
```

### **Erro: "Banco de dados não conectado"**
```bash
# Verificar Docker
docker ps

# Verificar logs do PostgreSQL
docker logs cms_postgres_dev

# Reiniciar containers
docker-compose -f docker-compose.dev.yml restart postgres
```

### **Erro: "Porta 4000 já em uso"**
```bash
# Windows
netstat -ano | findstr :4000
# Matar processo (substituir PID)
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

---

## 📚 PRÓXIMOS PASSOS

1. ✅ Testar endpoints admin via curl
2. ✅ Verificar dashboard no navegador
3. ✅ Configurar um site WordPress de teste
4. ✅ Executar smoke tests
5. ✅ Verificar dados no Prisma Studio

---

**Status:** ✅ **GUIA DE TESTE LOCAL PRONTO**








