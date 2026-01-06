# ⚡ GUIA RÁPIDO — Teste Local Dashboard

**Status:** ✅ Servidor rodando em `http://localhost:4000`

---

## 🚀 ACESSO RÁPIDO

### **1. Dashboard Principal**
```
http://localhost:4000/dashboard
```

### **2. Dashboard Admin AI**
```
http://localhost:4000/admin/ai
```

### **3. WordPress Diagnostic**
```
http://localhost:4000/wordpress-diagnostic
```

---

## 🔗 TESTAR ENDPOINTS ADMIN (CURL)

### **Configurar Secret (se necessário)**
```powershell
# PowerShell
$env:ADMIN_HEALTH_SECRET = "test-secret"
```

### **1. Health AI (Inclui WP Indexing)**
```powershell
curl -X GET "http://localhost:4000/api/admin/ai/health?windowHours=24" `
  -H "Authorization: Bearer test-secret"
```

### **2. Alerts AI**
```powershell
curl -X GET "http://localhost:4000/api/admin/ai/alerts?windowHours=24" `
  -H "Authorization: Bearer test-secret"
```

### **3. WordPress Sync Health**
```powershell
# Substituir {orgId} e {siteId} pelos IDs reais
curl -X GET "http://localhost:4000/api/admin/wordpress/sync-health?organizationId={orgId}&siteId={siteId}" `
  -H "Authorization: Bearer test-secret"
```

### **4. WordPress Conflicts**
```powershell
curl -X GET "http://localhost:4000/api/admin/wordpress/conflicts?organizationId={orgId}&siteId={siteId}" `
  -H "Authorization: Bearer test-secret"
```

### **5. Tenant Cost**
```powershell
curl -X GET "http://localhost:4000/api/admin/ai/tenant-cost?organizationId={orgId}&siteId={siteId}" `
  -H "Authorization: Bearer test-secret"
```

---

## 📊 VERIFICAR DADOS NO BANCO

### **Prisma Studio**
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

## 🧪 EXECUTAR SMOKE TESTS

```bash
npm run smoke:wp -- --siteId=seu-site-id --organizationId=sua-org-id
```

**Nota:** Você precisa ter um site e organização criados no banco.

---

## ✅ CHECKLIST RÁPIDO

- [x] Servidor rodando (`http://localhost:4000`)
- [ ] Dashboard acessível
- [ ] Admin AI acessível
- [ ] Endpoints admin respondendo
- [ ] Prisma Studio acessível

---

**Pronto para testar!** 🎉






