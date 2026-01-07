# 🔐 FASE D — CREDENCIAIS + CONEXÃO (SECURE CONNECT)

**Data:** 24 de Dezembro de 2025  
**Fase:** D/9 — Credenciais + Conexão  
**Status:** ✅ **COMPLETA**

---

## 📋 ÍNDICE

1. [Objetivo da FASE D](#1-objetivo-da-fase-d)
2. [Criptografia de Senhas](#2-criptografia-de-senhas)
3. [Service de Credenciais](#3-service-de-credenciais)
4. [Endpoints Criados](#4-endpoints-criados)
5. [Validação de Ownership](#5-validação-de-ownership)
6. [Garantias de Segurança](#6-garantias-de-segurança)

---

## 1️⃣ OBJETIVO DA FASE D

Implementar gerenciamento seguro de credenciais WordPress por site:
- Criptografia AES-256-CBC para senhas
- Service para gerenciar credenciais (get, save, remove)
- Endpoint de configuração por site
- Validação de ownership antes de salvar
- Endpoint de validação atualizado

---

## 2️⃣ CRIPTOGRAFIA DE SENHAS

### **2.1. Arquivo Criado**

**Localização**: `lib/wordpress/wordpress-encryption.ts`

**Funções**:
- `encryptWordPressPassword(password: string): string`
- `decryptWordPressPassword(encryptedPassword: string): string`
- `isEncryptedPassword(value: string): boolean`

**Algoritmo**: AES-256-CBC  
**Formato**: `IV_HEX:ENCRYPTED_HEX`  
**Chave**: `WORDPRESS_ENCRYPTION_KEY` ou `ENCRYPTION_KEY` (env var, 32 bytes)

---

## 3️⃣ SERVICE DE CREDENCIAIS

### **3.1. Arquivo Criado**

**Localização**: `lib/wordpress/wordpress-credentials-service.ts`

**Funções**:
- `getWordPressCredentials(siteId, organizationId)`: Obter credenciais (descriptografadas)
- `saveWordPressCredentials(siteId, organizationId, credentials)`: Salvar credenciais (valida e criptografa)
- `removeWordPressCredentials(siteId, organizationId)`: Remover credenciais
- `hasWordPressCredentials(siteId, organizationId)`: Verificar se configurado

**Garantias**:
- ✅ Valida ownership antes de qualquer operação
- ✅ Valida credenciais WordPress antes de salvar
- ✅ Criptografa senha automaticamente
- ✅ Não expõe senha em logs

---

## 4️⃣ ENDPOINTS CRIADOS

### **4.1. POST /api/sites/[siteId]/wordpress/configure**

**Propósito**: Configurar credenciais WordPress para um site

**Request Body**:
```json
{
  "organizationId": "c...",
  "wpBaseUrl": "https://site.com",
  "wpAuthType": "basic",
  "wpUsername": "admin",
  "wpPassword": "password",
  "wpToken": "optional"
}
```

**Response**:
```json
{
  "success": true,
  "message": "WordPress credentials configured successfully",
  "credentials": {
    "wpBaseUrl": "https://site.com",
    "wpAuthType": "basic",
    "wpUsername": "admin",
    "wpConfigured": true
  },
  "validationResult": { ... }
}
```

**Validações**:
- ✅ Valida ownership (site pertence à organization)
- ✅ Valida credenciais WordPress (testa conexão)
- ✅ Criptografa senha antes de salvar

---

### **4.2. GET /api/sites/[siteId]/wordpress/configure**

**Propósito**: Obter credenciais configuradas (sem senha)

**Query Params**: `?organizationId=...`

**Response**:
```json
{
  "success": true,
  "configured": true,
  "credentials": {
    "wpBaseUrl": "https://site.com",
    "wpAuthType": "basic",
    "wpUsername": "admin",
    "wpConfigured": true,
    "wpLastSyncAt": "2025-12-24T..."
  }
}
```

---

### **4.3. DELETE /api/sites/[siteId]/wordpress/configure**

**Propósito**: Remover credenciais WordPress

**Query Params**: `?organizationId=...`

**Response**:
```json
{
  "success": true,
  "message": "WordPress credentials removed successfully"
}
```

---

### **4.4. POST /api/wordpress/validate-site** (Atualizado)

**Propósito**: Validar site WordPress (usa credenciais do banco se configuradas)

**Request Body**:
```json
{
  "siteId": "c...",
  "organizationId": "c...",
  "siteUrl": "optional",
  "wpUsername": "optional",
  "wpPassword": "optional"
}
```

**Comportamento**:
- Se `siteId` e `organizationId` fornecidos, busca credenciais do banco
- Se credenciais não configuradas, usa credenciais do request
- Valida conexão, autenticação e permissões
- Detecta capacidades (ACF, REST API, etc.)

---

## 5️⃣ VALIDAÇÃO DE OWNERSHIP

**Função**: `validateSiteBelongsToOrganization(siteId, organizationId)`

**Localização**: `lib/tenant-security.ts` (já existia)

**Uso**: Todos os endpoints validam ownership antes de operar

**Garantia**: Site só pode ser configurado pela organização dona

---

## 6️⃣ GARANTIAS DE SEGURANÇA

### **6.1. Criptografia**
- ✅ Senhas nunca armazenadas em texto plano
- ✅ AES-256-CBC (padrão da indústria)
- ✅ IV único por senha
- ✅ Chave via env var (não no código)

### **6.2. Multi-Tenant**
- ✅ Credenciais isoladas por site
- ✅ Ownership validado em todas as operações
- ✅ Nenhum vazamento entre tenants

### **6.3. Validação**
- ✅ Credenciais validadas antes de salvar
- ✅ Testa conexão, autenticação e permissões
- ✅ Não salva credenciais inválidas

### **6.4. Observabilidade**
- ✅ CorrelationId em todos os logs
- ✅ Logs estruturados (sem senhas)
- ✅ Auditoria de operações

---

## 📊 RESUMO DAS ALTERAÇÕES

| Categoria | Quantidade |
|-----------|------------|
| **Arquivos Criados** | 3 |
| **Endpoints Criados/Atualizados** | 4 |
| **Funções de Criptografia** | 3 |
| **Funções de Service** | 4 |
| **Breaking Changes** | 0 |

---

## 🚀 PRÓXIMOS PASSOS

### **FASE E — FULL SYNC (WP → CMS) + JOBS** (3-4 dias)
1. ⏳ Criar endpoint `/api/wordpress/sync-all`
2. ⏳ Implementar QueueJobs por lote
3. ⏳ Worker processa em batches
4. ⏳ Retry/backoff + DLQ
5. ⏳ Relatório final (contagens, falhas)

---

## ✅ FASE D — CONCLUSÃO

### **Entregas Completas**

- [x] ✅ Helpers de criptografia (AES-256-CBC)
- [x] ✅ Service de credenciais (get, save, remove)
- [x] ✅ Endpoint de configuração (POST/GET/DELETE)
- [x] ✅ Endpoint de validação atualizado
- [x] ✅ Validação de ownership em todas as operações
- [x] ✅ Documentação completa

---

**Status Final**: ✅ **FASE D COMPLETA**

**Próximo Marco**: **FASE E — Full Sync (WP → CMS) + Jobs**

---

**Assinatura Digital**:  
🤖 IA Arquiteta/Dev Sênior  
📅 24 de Dezembro de 2025  
🔖 WordPress Sync Integration — FASE D v1.0








