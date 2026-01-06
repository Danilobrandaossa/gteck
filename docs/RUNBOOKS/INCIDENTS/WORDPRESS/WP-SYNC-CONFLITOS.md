# 🚨 WP-SYNC-CONFLITOS — WordPress Sync Conflitos em Alta

**Severidade:** MEDIUM  
**Tempo Estimado de Resolução:** 30-60 minutos

---

## 🔍 SYMPTOMS

- Muitos conflitos sendo registrados (`SyncConflict`)
- Conteúdo divergindo entre WordPress e CMS
- Usuários reportando conteúdo inconsistente
- Taxa de conflitos > 5%

---

## ✅ HOW TO CONFIRM

### **1. Verificar Conflitos Abertos**
```sql
-- Contar conflitos abertos
SELECT 
  COUNT(*) as conflitos_abertos,
  COUNT(*) FILTER (WHERE "resolutionStatus" = 'open') as abertos,
  COUNT(*) FILTER (WHERE "resolutionStatus" = 'resolved') as resolvidos,
  COUNT(*) FILTER (WHERE "resolutionStatus" = 'ignored') as ignorados
FROM sync_conflicts
WHERE "detectedAt" >= NOW() - INTERVAL '24 hours';
```

**Confirmar se:** `conflitos_abertos > 10` ou taxa > 5%

---

### **2. Verificar Taxa de Conflitos**
```sql
-- Taxa de conflitos por tipo
SELECT 
  "entityType",
  "conflictType",
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM sync_conflicts
WHERE "detectedAt" >= NOW() - INTERVAL '24 hours'
GROUP BY "entityType", "conflictType"
ORDER BY count DESC;
```

**Confirmar se:** Taxa de conflitos > 5% do total de syncs

---

### **3. Verificar Conflitos por Site**
```sql
-- Conflitos por site
SELECT 
  s.id as site_id,
  s.name as site_name,
  COUNT(*) as conflitos_count
FROM sync_conflicts sc
JOIN sites s ON s.id = sc."siteId"
WHERE sc."detectedAt" >= NOW() - INTERVAL '24 hours'
  AND sc."resolutionStatus" = 'open'
GROUP BY s.id, s.name
ORDER BY conflitos_count DESC;
```

**Confirmar se:** Algum site tem muitos conflitos

---

### **4. Verificar Padrão de Conflitos**
```sql
-- Verificar se conflitos são de um tipo específico
SELECT 
  "conflictType",
  COUNT(*) as count
FROM sync_conflicts
WHERE "detectedAt" >= NOW() - INTERVAL '24 hours'
GROUP BY "conflictType";
```

**Confirmar se:** Maioria dos conflitos é `wp_newer` ou `local_newer`

---

## 🚨 IMMEDIATE MITIGATION (0-15 MIN)

### **1. Identificar Site com Mais Conflitos**
```sql
-- Site com mais conflitos
SELECT 
  s.id,
  s.name,
  COUNT(*) as conflitos
FROM sync_conflicts sc
JOIN sites s ON s.id = sc."siteId"
WHERE sc."resolutionStatus" = 'open'
GROUP BY s.id, s.name
ORDER BY conflitos DESC
LIMIT 1;
```

**Ação:** Investigar site específico

---

### **2. Pausar Sync para Site Problemático (Temporário)**
```sql
-- Desabilitar sync para site específico
UPDATE sites 
SET "wpConfigured" = false 
WHERE id = 'site-id-com-problemas';
```

**Rollback:** Reativar após correção

---

### **3. Resolver Conflitos em Lote (Se Apropriado)**
```sql
-- Resolver conflitos "wp_newer" automaticamente (Last Write Wins)
UPDATE sync_conflicts
SET 
  "resolutionStatus" = 'resolved',
  "resolvedAt" = NOW(),
  "resolvedBy" = 'system-auto',
  "resolutionNote" = 'Auto-resolved: WP is newer (LWW)'
WHERE "conflictType" = 'wp_newer'
  AND "resolutionStatus" = 'open'
  AND "detectedAt" >= NOW() - INTERVAL '24 hours';
```

**Cuidado:** Apenas se política LWW for aceitável

---

## 🔧 SAFE CONFIG CHANGES (COM ROLLBACK)

### **1. Aumentar Threshold de Conflito (Temporário)**
```typescript
// Em lib/wordpress/wordpress-conflict-detector.ts
// Aumentar janela de tempo para considerar conflito
const CONFLICT_TIME_WINDOW_MS = 60000; // 1 minuto (aumentar para 5 minutos)
```

**Rollback:** Reverter após correção

---

### **2. Desabilitar Detecção de Conflito (Temporário)**
```typescript
// Em lib/wordpress/wordpress-incremental-sync.ts
// Comentar detecção de conflito temporariamente
// const conflict = WordPressConflictDetector.detectConflict(...)
```

**Rollback:** Reativar após correção

---

## 🔍 DEEP DIAGNOSIS

### **1. Verificar Timestamps**
```sql
-- Verificar diferença de timestamps
SELECT 
  sc."entityType",
  sc."conflictType",
  sc."detectedAt",
  sc."localSnapshotJson"->>'updatedAt' as local_updated,
  sc."wpSnapshotJson"->>'modified' as wp_modified
FROM sync_conflicts sc
WHERE sc."resolutionStatus" = 'open'
ORDER BY sc."detectedAt" DESC
LIMIT 10;
```

**Problema:** Timestamps podem estar desincronizados (timezone, clock drift)

---

### **2. Verificar Edições Simultâneas**
```sql
-- Verificar se há edições simultâneas frequentes
SELECT 
  s.id as site_id,
  COUNT(*) as edicoes_simultaneas
FROM sync_conflicts sc
JOIN sites s ON s.id = sc."siteId"
WHERE sc."conflictType" = 'diverged'
  AND sc."detectedAt" >= NOW() - INTERVAL '24 hours'
GROUP BY s.id;
```

**Problema:** Usuários editando no CMS enquanto WP também é editado

---

### **3. Verificar Push CMS → WP**
```sql
-- Verificar se push CMS → WP está causando loops
SELECT 
  COUNT(*) as pushes_recentes
FROM queue_jobs
WHERE type = 'wordpress_push'
  AND created_at >= NOW() - INTERVAL '1 hour';
```

**Problema:** Push CMS → WP pode estar causando webhooks de volta

---

### **4. Verificar Anti-Loop**
```typescript
// Em lib/wordpress/wordpress-push.ts
// Verificar se isCmsOriginated está funcionando
```

**Problema:** Anti-loop pode não estar funcionando corretamente

---

## 🛠️ PERMANENT FIX

### **1. Melhorar Detecção de Conflito**
```typescript
// Adicionar threshold de tempo maior
// Considerar conflito apenas se diferença > 5 minutos
const CONFLICT_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutos
```

### **2. Implementar Resolução Automática (LWW)**
```typescript
// Auto-resolver conflitos "wp_newer" se política LWW
if (conflict.conflictType === 'wp_newer') {
  await WordPressConflictDetector.resolveConflict(conflictId, 'system-auto', 'LWW: WP is newer');
}
```

### **3. Melhorar Anti-Loop**
```typescript
// Melhorar detecção de origem CMS
// Usar idempotency key mais robusto
```

### **4. Adicionar Notificações**
```typescript
// Notificar usuários quando conflito é detectado
// Permitir resolução manual via UI
```

---

## ✅ VERIFICATION

### **1. Verificar Conflitos Reduzidos**
```sql
-- Verificar conflitos após correção
SELECT COUNT(*) as conflitos_abertos
FROM sync_conflicts
WHERE "resolutionStatus" = 'open'
  AND "detectedAt" >= NOW() - INTERVAL '1 hour';
```

**Esperado:** `conflitos_abertos < 5`

---

### **2. Verificar Taxa de Conflitos**
```sql
-- Taxa de conflitos após correção
SELECT 
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM sync_conflicts sc 
    WHERE sc."siteId" = s.id 
      AND sc."detectedAt" >= NOW() - INTERVAL '1 hour'
  )) * 100.0 / COUNT(*) as conflito_rate
FROM sites s
WHERE s."wpConfigured" = true;
```

**Esperado:** `conflito_rate < 2%`

---

### **3. Monitorar Novos Conflitos**
```sql
-- Monitorar novos conflitos
SELECT COUNT(*) as novos_conflitos
FROM sync_conflicts
WHERE "detectedAt" >= NOW() - INTERVAL '30 minutes';
```

**Esperado:** `novos_conflitos < 3`

---

## 📋 CHECKLIST

- [ ] Conflitos confirmados > 10 ou taxa > 5%
- [ ] Site problemático identificado
- [ ] Causa raiz identificada
- [ ] Correção aplicada
- [ ] Conflitos reduzidos < 5
- [ ] Taxa de conflitos < 2%

---

**Status:** ✅ **RUNBOOK PRONTO**






