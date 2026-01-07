# 📋 PLANO DE IMPLEMENTAÇÃO — Meta Creative Intelligence
## Tickets Executáveis para Desenvolvimento

**Data:** Janeiro 2025  
**Versão:** 3.0  
**Escopo:** MVP (Fase 1)

---

## 🎯 ÉPICOS

### **Épico 1: Meta OAuth + Conexão da Conta**
### **Épico 2: Sync/Insights Worker + Cache**
### **Épico 3: Ranking Winners + Guardrails**
### **Épico 4: Persistência MetaCreative + Patterns**
### **Épico 5: Pattern→Prompt + Integração com Gerador**
### **Épico 6: UI Mínima**
### **Épico 7: Compliance + Retenção + Revoke**
### **Épico 8: Observabilidade**

---

## 📝 TICKETS DETALHADOS

### **ÉPICO 1: Meta OAuth + Conexão da Conta**

#### **TICKET 1.1: Instalar SDK Meta e Configurar OAuth**
**Objetivo:** Configurar dependências e variáveis de ambiente para Meta OAuth

**Dependências:** Nenhuma

**Critérios de Aceite:**
- [ ] `facebook-nodejs-business-sdk` instalado
- [ ] Variáveis de ambiente configuradas (META_APP_ID, META_APP_SECRET, etc.)
- [ ] App criado no Meta Developers Console
- [ ] Redirect URI configurado

**Estimativa:** S (2-4h)

---

#### **TICKET 1.2: Criar Schema Prisma (MetaConnection + MetaAdAccount)**
**Objetivo:** Criar tabelas para armazenar conexões OAuth e contas de anúncios

**Dependências:** TICKET 1.1

**Critérios de Aceite:**
- [ ] Model `MetaConnection` criado com campos: accessTokenEncrypted, expiresAt, scopes, renewalStrategy
- [ ] Model `MetaAdAccount` criado
- [ ] Model `MetaCreativeConfig` criado (guardrails)
- [ ] Relações com Organization e User configuradas
- [ ] Migration executada com sucesso

**Estimativa:** S (2-3h)

---

#### **TICKET 1.3: Implementar Criptografia de Tokens**
**Objetivo:** Criar utilitário para criptografar/descriptografar tokens Meta

**Dependências:** TICKET 1.2

**Critérios de Aceite:**
- [ ] `lib/meta-token-encryption.ts` criado
- [ ] Funções `encryptToken()` e `decryptToken()` implementadas (AES-256-CBC)
- [ ] Testes unitários passando
- [ ] IV gerado e armazenado corretamente

**Estimativa:** S (3-4h)

---

#### **TICKET 1.4: POST /api/meta/connect**
**Objetivo:** Endpoint para iniciar fluxo OAuth Meta

**Dependências:** TICKET 1.1, TICKET 1.3

**Critérios de Aceite:**
- [ ] Endpoint retorna OAuth URL válida
- [ ] State token gerado (CSRF protection)
- [ ] State armazenado em sessão/Redis
- [ ] Redirect URI correto configurado

**Estimativa:** S (2-3h)

---

#### **TICKET 1.5: GET /api/meta/oauth/callback**
**Objetivo:** Callback OAuth que salva tokens

**Dependências:** TICKET 1.4

**Critérios de Aceite:**
- [ ] Valida state token (CSRF)
- [ ] Troca código por access token (Meta API)
- [ ] Criptografa e salva token em MetaConnection
- [ ] Busca e salva Ad Accounts autorizadas
- [ ] Retorna sucesso com lista de contas

**Estimativa:** M (4-6h)

---

#### **TICKET 1.6: GET /api/meta/ad-accounts**
**Objetivo:** Listar contas de anúncios autorizadas

**Dependências:** TICKET 1.5

**Critérios de Aceite:**
- [ ] Retorna lista de Ad Accounts da conexão
- [ ] Filtra por connectionId (opcional)
- [ ] Trata token expirado (retorna 401)
- [ ] Cache de 5 minutos (opcional)

**Estimativa:** S (2-3h)

---

### **ÉPICO 2: Sync/Insights Worker + Cache**

#### **TICKET 2.1: Criar MetaInsightCache Schema**
**Objetivo:** Tabela para cache de insights com TTL

**Dependências:** TICKET 1.2

**Critérios de Aceite:**
- [ ] Model `MetaInsightCache` criado
- [ ] Campo `cacheKey` único (hash)
- [ ] Campo `expiresAt` para TTL
- [ ] Índices configurados
- [ ] Migration executada

**Estimativa:** S (1-2h)

---

#### **TICKET 2.2: lib/meta-ads-service.ts (Cliente Meta API)**
**Objetivo:** Service para interagir com Meta Marketing API

**Dependências:** TICKET 1.1, TICKET 1.3

**Critérios de Aceite:**
- [ ] Classe `MetaAdsService` criada
- [ ] Método `getAdAccounts()` implementado
- [ ] Método `getInsights()` implementado (com paginação)
- [ ] Método `getAdCreatives()` implementado
- [ ] Tratamento de rate limits (429)
- [ ] Retry com backoff exponencial

**Estimativa:** M (6-8h)

---

#### **TICKET 2.3: POST /api/meta/insights/sync**
**Objetivo:** Endpoint para criar job de sync de insights

**Dependências:** TICKET 2.2

**Critérios de Aceite:**
- [ ] Valida parâmetros (connectionId, adAccountId, timeWindow, etc.)
- [ ] Cria QueueJob tipo `meta_insights_fetch`
- [ ] Retorna jobId
- [ ] Valida token não expirado

**Estimativa:** S (2-3h)

---

#### **TICKET 2.4: lib/meta/meta-insights-worker.ts**
**Objetivo:** Worker para processar jobs de insights em batch

**Dependências:** TICKET 2.3, TICKET 2.2

**Critérios de Aceite:**
- [ ] Worker reutiliza padrão de `wordpress-sync-worker-runner.ts`
- [ ] Claim jobs `meta_insights_fetch` em batch (10 por vez)
- [ ] Busca insights da Meta API (com paginação)
- [ ] Salva em `MetaInsightCache` (TTL 1h)
- [ ] Cria jobs `meta_creative_ingest` para cada criativo top N
- [ ] Tratamento de erros e retry

**Estimativa:** L (8-12h)

---

#### **TICKET 2.5: POST /api/meta/top-creatives**
**Objetivo:** Endpoint para retornar top N criativos (com cache)

**Dependências:** TICKET 2.4

**Critérios de Aceite:**
- [ ] Consulta `MetaInsightCache` primeiro
- [ ] Se expirado ou não existe, cria novo sync
- [ ] Retorna top N criativos com performance
- [ ] Inclui flag `cacheHit`
- [ ] Filtra por guardrails (minSpend, etc.)

**Estimativa:** M (4-6h)

---

### **ÉPICO 3: Ranking Winners + Guardrails**

#### **TICKET 3.1: Implementar Guardrails no Service**
**Objetivo:** Aplicar filtros mínimos (minSpend, minConversions, etc.)

**Dependências:** TICKET 2.2

**Critérios de Aceite:**
- [ ] Função `applyGuardrails()` implementada
- [ ] Filtra por minSpend (default $100)
- [ ] Filtra por minConversions (default 10)
- [ ] Filtra por minImpressions (default 1000)
- [ ] Configurável via `MetaCreativeConfig`

**Estimativa:** S (3-4h)

---

#### **TICKET 3.2: Implementar Ranking por KPI**
**Objetivo:** Rankear criativos por KPI principal + secundário

**Dependências:** TICKET 3.1

**Critérios de Aceite:**
- [ ] Função `rankByKpi()` implementada
- [ ] Suporta objetivos: LEAD, PURCHASE, INSTALL
- [ ] KPI principal tem peso maior (70%)
- [ ] KPI secundário opcional (30%)
- [ ] Desempate por spend (maior = melhor)
- [ ] Retorna top N ordenado

**Estimativa:** M (4-6h)

---

#### **TICKET 3.3: Configurar Guardrails por Organização**
**Objetivo:** Permitir customização de guardrails via UI/API

**Dependências:** TICKET 3.1

**Critérios de Aceite:**
- [ ] Endpoint `PUT /api/meta/config` para atualizar guardrails
- [ ] Valida valores mínimos (não pode ser negativo)
- [ ] Aplica defaults se não configurado
- [ ] Persiste em `MetaCreativeConfig`

**Estimativa:** S (2-3h)

---

### **ÉPICO 4: Persistência MetaCreative + Patterns**

#### **TICKET 4.1: Criar Schema CreativePattern**
**Objetivo:** Tabela para padrões extraídos

**Dependências:** TICKET 1.2

**Critérios de Aceite:**
- [ ] Model `CreativePattern` criado
- [ ] Campos: patternType (visual/message/approach), data (JSON), confidence
- [ ] Relação com MetaCreative
- [ ] Índices configurados
- [ ] Migration executada

**Estimativa:** S (1-2h)

---

#### **TICKET 4.2: Worker meta_creative_ingest**
**Objetivo:** Worker para salvar metadata de criativos (metadata-only)

**Dependências:** TICKET 2.4, TICKET 4.1

**Critérios de Aceite:**
- [ ] Worker processa jobs `meta_creative_ingest`
- [ ] Busca metadata do criativo (não baixa asset)
- [ ] Extrai thumbnail URL (se disponível)
- [ ] Calcula hash da imagem (SHA-256)
- [ ] Salva em `MetaCreative` (metadata-only)
- [ ] Cria job `meta_pattern_extract`

**Estimativa:** M (4-6h)

---

#### **TICKET 4.3: lib/creative-pattern-extractor.ts**
**Objetivo:** Service para extrair padrões via GPT-4 Vision

**Dependências:** TICKET 4.2

**Critérios de Aceite:**
- [ ] Classe `CreativePatternExtractor` criada
- [ ] Método `extractVisualPatterns()` (cores, composição, estilo)
- [ ] Método `extractMessagePatterns()` (OCR + copy)
- [ ] Método `extractApproachPatterns()` (inferência)
- [ ] Retorna confidence score (0-1)
- [ ] Cache de análises (hash da imagem)

**Estimativa:** L (8-10h)

---

#### **TICKET 4.4: Worker meta_pattern_extract**
**Objetivo:** Worker para extrair padrões assincronamente

**Dependências:** TICKET 4.3

**Critérios de Aceite:**
- [ ] Worker processa jobs `meta_pattern_extract`
- [ ] Baixa thumbnail temporariamente (não persiste)
- [ ] Chama `CreativePatternExtractor`
- [ ] Salva 3 padrões em `CreativePattern` (visual, message, approach)
- [ ] Limpa arquivo temporário após análise

**Estimativa:** M (4-6h)

---

#### **TICKET 4.5: POST /api/meta/creatives/:id/extract-patterns**
**Objetivo:** Endpoint para forçar extração de padrões

**Dependências:** TICKET 4.4

**Critérios de Aceite:**
- [ ] Valida creativeId existe
- [ ] Cria job `meta_pattern_extract` se não existir
- [ ] Retorna jobId
- [ ] Retorna erro se já extraído (opcional)

**Estimativa:** S (1-2h)

---

### **ÉPICO 5: Pattern→Prompt + Integração com Gerador**

#### **TICKET 5.1: lib/pattern-to-prompt-generator.ts**
**Objetivo:** Service para gerar CreativeBrief a partir de padrões

**Dependências:** TICKET 4.4

**Critérios de Aceite:**
- [ ] Classe `PatternToPromptGenerator` criada
- [ ] Método `combinePatterns()` (recebe array de CreativePattern)
- [ ] Método `generateCreativeBrief()` (retorna CreativeBrief)
- [ ] Combina padrões visuais, mensagens e abordagem
- [ ] Inclui flags baseadas em padrões (ex: includeTextInImage)
- [ ] Salva prompt gerado em `AIPrompt` (versionamento)

**Estimativa:** M (6-8h)

---

#### **TICKET 5.2: Implementar Anti-Clone Rules**
**Objetivo:** Validação para evitar clonagem

**Dependências:** TICKET 5.1

**Critérios de Aceite:**
- [ ] Função `validateAntiClone()` implementada
- [ ] Proíbe nomes de marcas concorrentes
- [ ] Calcula similaridade de embeddings (cosine)
- [ ] Threshold: < 0.85 (rejeita se > 0.85)
- [ ] Retorna score e violations

**Estimativa:** M (4-6h)

---

#### **TICKET 5.3: POST /api/meta/generate-from-patterns**
**Objetivo:** Endpoint para gerar criativo inspirado

**Dependências:** TICKET 5.1, TICKET 5.2

**Critérios de Aceite:**
- [ ] Valida creativeIds existem e têm padrões
- [ ] Chama `PatternToPromptGenerator`
- [ ] Aplica anti-clone rules
- [ ] Chama `/api/creative/generate` (existente)
- [ ] Retorna CreativeOutput com metadata `inspiredBy`
- [ ] Inclui `antiCloneScore` no metadata

**Estimativa:** M (4-6h)

---

### **ÉPICO 6: UI Mínima**

#### **TICKET 6.1: Tela "Conectar Conta Meta"**
**Objetivo:** UI para iniciar OAuth flow

**Dependências:** TICKET 1.4

**Critérios de Aceite:**
- [ ] Página `/meta/connect` criada
- [ ] Botão "Conectar conta Meta"
- [ ] Redireciona para OAuth URL
- [ ] Loading state durante redirect
- [ ] Tratamento de erro (se houver)

**Estimativa:** S (2-3h)

---

#### **TICKET 6.2: Tela "Selecionar Ad Account"**
**Objetivo:** UI para escolher conta de anúncios

**Dependências:** TICKET 1.6, TICKET 6.1

**Critérios de Aceite:**
- [ ] Página `/meta/select-account` criada
- [ ] Lista Ad Accounts da conexão
- [ ] Seleção única (radio buttons)
- [ ] Botão "Continuar" salva seleção
- [ ] Tratamento de "nenhuma conta disponível"

**Estimativa:** S (2-3h)

---

#### **TICKET 6.3: Formulário de Parâmetros**
**Objetivo:** UI para configurar busca de top performers

**Dependências:** TICKET 6.2

**Critérios de Aceite:**
- [ ] Página `/meta/configure-search` criada
- [ ] Campo "Período" (date picker, default: últimos 30 dias)
- [ ] Campo "Objetivo" (select: Lead/Purchase/Install)
- [ ] Campo "KPI Principal" (select baseado em objetivo)
- [ ] Campo "KPI Secundário" (opcional)
- [ ] Campo "Top N" (number input, default: 10)
- [ ] Botão "Buscar Top Performers"

**Estimativa:** M (4-6h)

---

#### **TICKET 6.4: Lista de Top Criativos**
**Objetivo:** UI para exibir criativos encontrados

**Dependências:** TICKET 2.5, TICKET 6.3

**Critérios de Aceite:**
- [ ] Página `/meta/top-creatives` criada
- [ ] Grid de thumbnails (se disponível)
- [ ] Exibe performance (spend, CTR, conversions)
- [ ] Exibe padrões extraídos (visual, message)
- [ ] Checkbox para selecionar criativos
- [ ] Botão "Gerar Inspirado" (desabilitado se nenhum selecionado)
- [ ] Loading state durante busca
- [ ] Tratamento de "nenhum criativo encontrado"

**Estimativa:** M (6-8h)

---

#### **TICKET 6.5: Integração com Geração de Criativos**
**Objetivo:** Conectar UI com endpoint de geração

**Dependências:** TICKET 5.3, TICKET 6.4

**Critérios de Aceite:**
- [ ] Botão "Gerar Inspirado" chama `/api/meta/generate-from-patterns`
- [ ] Exibe loading durante geração
- [ ] Redireciona para `/criativos` com resultado
- [ ] Exibe mensagem "Inspirado em X criativos"
- [ ] Tratamento de erros

**Estimativa:** S (2-3h)

---

### **ÉPICO 7: Compliance + Retenção + Revoke**

#### **TICKET 7.1: Worker meta_retention_cleanup**
**Objetivo:** Worker para deletar criativos expirados

**Dependências:** TICKET 4.2

**Critérios de Aceite:**
- [ ] Worker cron (diário)
- [ ] Busca `MetaCreative` com `expiresAt < NOW()`
- [ ] Deleta criativo + padrões relacionados
- [ ] Log de exclusão (opcional: MetaAuditLog)
- [ ] Notifica usuário (opcional)

**Estimativa:** S (2-3h)

---

#### **TICKET 7.2: DELETE /api/meta/connections/:id**
**Objetivo:** Endpoint para desconectar conta Meta

**Dependências:** TICKET 1.5

**Critérios de Aceite:**
- [ ] Revoga token na Meta (se possível)
- [ ] Marca `MetaConnection.revokedAt = NOW()`
- [ ] Agenda exclusão de dados (30 dias grace period)
- [ ] Notifica usuário (email/in-app)
- [ ] Retorna sucesso

**Estimativa:** M (4-6h)

---

#### **TICKET 7.3: Worker de Exclusão com Grace Period**
**Objetivo:** Worker para deletar dados após grace period

**Dependências:** TICKET 7.2

**Critérios de Aceite:**
- [ ] Worker cron (diário)
- [ ] Busca conexões com `revokedAt + 30 dias < NOW()`
- [ ] Deleta `MetaConnection` + `MetaCreative` + `CreativePattern` + `MetaInsightCache`
- [ ] Log de exclusão final

**Estimativa:** S (2-3h)

---

### **ÉPICO 8: Observabilidade**

#### **TICKET 8.1: Logs Estruturados**
**Objetivo:** Implementar logging estruturado em todas as operações

**Dependências:** Todos os épicos anteriores

**Critérios de Aceite:**
- [ ] Logs em formato JSON
- [ ] Campos obrigatórios: timestamp, level, service, organizationId, userId, action
- [ ] Logs em todas as operações críticas
- [ ] Níveis: INFO, WARN, ERROR

**Estimativa:** M (4-6h)

---

#### **TICKET 8.2: GET /api/meta/jobs/:jobId/status**
**Objetivo:** Endpoint para consultar status de jobs assíncronos

**Dependências:** TICKET 2.3

**Critérios de Aceite:**
- [ ] Retorna status do job (pending/processing/completed/failed)
- [ ] Retorna progress (0-1) se disponível
- [ ] Retorna mensagem de status
- [ ] Retorna result se completed
- [ ] Retorna error se failed

**Estimativa:** S (2-3h)

---

#### **TICKET 8.3: Métricas em AIMetric**
**Objetivo:** Registrar métricas de operações Meta

**Dependências:** TICKET 8.1

**Critérios de Aceite:**
- [ ] Registra métricas tipo `meta_insights_fetch`
- [ ] Registra métricas tipo `meta_pattern_extract`
- [ ] Registra métricas tipo `meta_creative_generate`
- [ ] Inclui custos GPT-4 Vision
- [ ] Agregação por período (hora/dia)

**Estimativa:** M (4-6h)

---

## 📊 RESUMO DE ESTIMATIVAS

| Épico | Tickets | Total Estimado |
|-------|---------|----------------|
| Épico 1: OAuth + Conexão | 6 | 15-22h (2-3 dias) |
| Épico 2: Insights + Cache | 5 | 21-29h (3-4 dias) |
| Épico 3: Ranking + Guardrails | 3 | 9-13h (1-2 dias) |
| Épico 4: Persistência + Patterns | 5 | 17-24h (2-3 dias) |
| Épico 5: Pattern→Prompt | 3 | 14-20h (2-3 dias) |
| Épico 6: UI Mínima | 5 | 16-23h (2-3 dias) |
| Épico 7: Compliance | 3 | 8-12h (1-2 dias) |
| Épico 8: Observabilidade | 3 | 10-15h (1-2 dias) |
| **TOTAL** | **33 tickets** | **110-158h (15-22 dias)** |

**Nota:** Estimativas assumem 1 desenvolvedor full-time. Com paralelização e App Review em paralelo, MVP pode ser entregue em **12-18 dias**.

---

## 🚦 PRIORIZAÇÃO

### **Sprint 1 (BLOCKERS)**
- TICKET 1.1, 1.2, 1.3, 1.4, 1.5 (OAuth completo)
- TICKET 2.1, 2.2 (Service Meta API)
- **Iniciar App Review Meta (paralelo)**

### **Sprint 2 (CORE)**
- TICKET 2.3, 2.4, 2.5 (Insights sync)
- TICKET 3.1, 3.2 (Ranking)
- TICKET 4.1, 4.2 (Persistência)

### **Sprint 3 (EXTRAÇÃO)**
- TICKET 4.3, 4.4, 4.5 (Pattern extraction)
- TICKET 5.1, 5.2, 5.3 (Pattern→Prompt)

### **Sprint 4 (UI + POLISH)**
- TICKET 6.1, 6.2, 6.3, 6.4, 6.5 (UI completa)
- TICKET 7.1, 7.2, 7.3 (Compliance)
- TICKET 8.1, 8.2, 8.3 (Observabilidade)

---

**FIM DO PLANO DE TICKETS**







