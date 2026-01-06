# 📊 MAPEAMENTO DO ESTADO ATUAL - CMS MODERNO

**Data:** Janeiro 2025  
**Objetivo:** Análise completa do estado atual antes de transformação IA-native  
**Arquiteta:** IA Sênior - Especialista em PostgreSQL, Prisma, Next.js, RAG

---

## 🎯 RESUMO EXECUTIVO

Este documento mapeia **TUDO** que já existe no projeto CMS Moderno, servindo como base para a transformação em plataforma IA-native sem quebrar funcionalidades existentes.

---

## 1️⃣ STACK TECNOLÓGICA ATUAL

### **Framework e Linguagem**
- ✅ **Next.js 14.0.4** (App Router)
- ✅ **TypeScript 5.3.3** (Strict Mode com 13 flags)
- ✅ **React 18.2.0**
- ✅ **Node.js >=18.0.0** (testado em 20.14.0)

### **Banco de Dados**
- ✅ **PostgreSQL** (produção) - via `schema.prisma`
- ✅ **SQLite** (desenvolvimento) - via `schema-dev.prisma`
- ✅ **Prisma 5.7.1** (ORM)
- ❌ **pgvector** - NÃO INSTALADO (será necessário)

### **Autenticação**
- ✅ **NextAuth.js 4.24.5**
- ✅ **Prisma Adapter** para NextAuth

### **UI e Componentes**
- ✅ **Radix UI** (15 componentes)
- ✅ **Tailwind CSS**
- ✅ **Lucide React** (ícones)
- ✅ **TipTap** (editor WYSIWYG)

---

## 2️⃣ SCHEMA PRISMA ATUAL

### **Tabelas Existentes (11 modelos)**

#### **1. Organization**
```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  logo        String?
  settings    String   @default("{}")  // JSON
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  users User[]
  sites Site[]
}
```
**Observações:**
- Multi-tenancy implementado
- Settings em JSON (flexível)
- Relacionamentos: Users (1:N), Sites (1:N)

---

#### **2. User**
```prisma
model User {
  id             String   @id @default(cuid())
  email          String   @unique
  name           String?
  password       String?
  role           String   @default("viewer") // admin, editor, author, viewer
  avatar         String?
  isActive       Boolean  @default(true)
  lastLoginAt    DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  organizationId String
  organization   Organization @relation(...)
  pages          Page[]
  aiContents     AIContent[]  // ✅ Relacionamento com conteúdo IA
}
```
**Observações:**
- Sistema de roles implementado
- Relacionamento com AIContent já existe
- Rastreamento de último login

---

#### **3. Site**
```prisma
model Site {
  id          String   @id @default(cuid())
  name        String
  url         String
  description String?
  logo        String?
  settings    String   @default("{}")  // JSON
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  organizationId String
  organization   Organization @relation(...)
  
  pages          Page[]
  categories     Category[]
  media          Media[]
  aiContents     AIContent[]  // ✅ Relacionamento com conteúdo IA
  aiPluginConfig AIPluginConfig?  // ✅ Configuração de plugin IA
}
```
**Observações:**
- Multi-site por organização
- Relacionamento com AIContent já existe
- Configuração de plugin IA já existe

---

#### **4. Page**
```prisma
model Page {
  id          String   @id @default(cuid())
  title       String
  slug        String
  content     String?  // ✅ Conteúdo HTML/texto
  excerpt     String?
  status      String   @default("draft") // draft, published, archived
  featuredImage String?
  seoTitle    String?
  seoDescription String?
  seoKeywords String?
  customFields String  @default("{}")  // ✅ JSON - campos customizados
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  siteId     String
  site       Site @relation(...)
  authorId   String
  author     User @relation(...)
  categoryId String?
  category   Category? @relation(...)
  templateId String?
  template   Template? @relation(...)
  
  @@unique([siteId, slug])
}
```
**Observações:**
- ✅ Conteúdo armazenado em `content` (String)
- ✅ CustomFields em JSON (pode conter metadados)
- ✅ SEO fields já existem
- ❌ **NÃO tem relacionamento direto com embeddings** (será necessário)

---

#### **5. Template**
```prisma
model Template {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  content     String   // ✅ Template HTML
  fields      String   @default("[]")  // JSON array
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  pages Page[]
}
```
**Observações:**
- Templates dinâmicos com campos customizáveis
- Fields em JSON array

---

#### **6. Category**
```prisma
model Category {
  id          String   @id @default(cuid())
  name        String
  slug        String
  description String?
  parentId    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  siteId   String
  site     Site @relation(...)
  parent   Category? @relation("CategoryHierarchy", ...)
  children Category[] @relation("CategoryHierarchy")
  pages    Page[]
  
  @@unique([siteId, slug])
}
```
**Observações:**
- Hierarquia de categorias implementada
- Relacionamento recursivo (parent/children)

---

#### **7. Media**
```prisma
model Media {
  id          String   @id @default(cuid())
  filename    String
  originalName String
  mimeType    String
  size        Int
  url         String
  alt         String?
  caption     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  siteId String
  site   Site @relation(...)
}
```
**Observações:**
- Upload de mídia implementado
- Metadados básicos (alt, caption)

---

#### **8. QueueJob**
```prisma
model QueueJob {
  id          String   @id @default(cuid())
  type        String
  status      String   @default("pending") // pending, processing, completed, failed
  data        String   // JSON
  result      String?  // JSON
  error       String?
  attempts    Int      @default(0)
  maxAttempts Int     @default(3)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  processedAt DateTime?
  
  @@index([status])
  @@index([createdAt])
}
```
**Observações:**
- ✅ Sistema de filas já existe
- ✅ Pode ser usado para processamento assíncrono de embeddings
- Data e result em JSON (flexível)

---

#### **9. WordPressDiagnostic**
```prisma
model WordPressDiagnostic {
  id              String   @id @default(cuid())
  dataExecucao    DateTime
  resultado       String   // ✅ JSON - resultado completo do diagnóstico
  acoesCorrigidas Boolean  @default(false)
  feedbackUsuario String?
  siteUrl         String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```
**Observações:**
- ✅ Resultado em JSON (pode conter análises de IA)
- ❌ **NÃO tem relacionamento com User/Site** (pode ser melhorado)
- ❌ **NÃO tem campos de métricas de IA** (tokens, custo, modelo)

---

#### **10. AIContent** ⭐ **TABELA PRINCIPAL DE IA**
```prisma
model AIContent {
  id              String   @id @default(cuid())
  title           String
  slug            String?
  excerpt         String?
  content         String?  // ✅ Conteúdo gerado pela IA
  status          String   @default("draft") // draft, published, error, generating
  language        String   @default("pt-BR")
  category        String?
  tags            String?
  keywords        String?
  secondaryKeywords String?  // JSON array
  aiModel         String?  // ✅ Modelo usado (gpt-4, claude, etc)
  prompt          String?  // ✅ Prompt original
  additionalInstructions String?
  generationConfig String?  @default("{}")  // ✅ JSON - configurações
  wordCount       Int?
  errorMessage    String?
  wordpressPostId Int?
  wordpressUrl    String?
  metaDescription String?
  featuredImage   String?
  featuredImageAlt String?
  
  siteId   String
  site     Site @relation(...)
  authorId String?
  author   User? @relation(...)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  publishedAt DateTime?
  scheduledAt DateTime?
  
  history AIContentHistory[]  // ✅ Histórico de ações
  
  @@index([siteId])
  @@index([status])
  @@index([siteId, status])
  @@index([authorId])
}
```
**Observações:**
- ✅ **Tabela principal para conteúdo gerado por IA**
- ✅ Armazena prompt, modelo, configurações
- ✅ Relacionamento com Site e User
- ✅ Histórico de ações
- ❌ **NÃO tem campo de embedding** (será necessário)
- ❌ **NÃO tem métricas de tokens/custo** (será necessário)
- ❌ **NÃO tem relacionamento com interações de IA** (será necessário)

---

#### **11. AIPluginConfig**
```prisma
model AIPluginConfig {
  id          String   @id @default(cuid())
  siteId      String   @unique
  site        Site     @relation(...)
  apiKey      String?
  webhookUrl  String?
  webhookSecret String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```
**Observações:**
- Configuração de plugin WordPress para IA
- Um por site

---

#### **12. AIContentHistory**
```prisma
model AIContentHistory {
  id        String   @id @default(cuid())
  contentId String
  content   AIContent @relation(...)
  action    String   // generate, edit, publish, unpublish, delete, regenerate
  prompt    String?  // ✅ Prompt usado
  metadata  String?  // ✅ JSON - metadados adicionais
  createdAt DateTime @default(now())
}
```
**Observações:**
- ✅ Histórico de ações em conteúdo IA
- ✅ Armazena prompt e metadados
- ❌ **NÃO tem métricas detalhadas** (tokens, custo, tempo)

---

### **Resumo do Schema**
- ✅ **12 modelos** já existentes
- ✅ **Multi-tenancy** (Organization → Sites → Content)
- ✅ **Rastreamento básico de IA** (AIContent, AIContentHistory)
- ❌ **Nenhuma tabela de embeddings**
- ❌ **Nenhuma tabela de interações de IA**
- ❌ **Nenhuma tabela de prompts versionados**
- ❌ **Nenhuma tabela de métricas de IA**

---

## 3️⃣ INTEGRAÇÕES DE IA EXISTENTES

### **3.1. Serviços de IA Implementados**

#### **AIService (`lib/ai-services.ts`)**
```typescript
export class AIService {
  // Suporta múltiplos provedores:
  - OpenAI (GPT-4, GPT-3.5, DALL-E)
  - Google Gemini (gemini-pro, gemini-2.0-flash)
  - Claude (claude-3-sonnet)
  - Stable Diffusion
  - DALL-E (geração de imagens)
  
  // Métodos principais:
  - generateContent(request: AIGenerationRequest)
  - generateWithOpenAI()
  - generateWithGemini()
  - generateWithClaude()
  - generateWithDALLE()
  - generateWithStableDiffusion()
  
  // Cálculo de custos:
  - calculateCost(tokens, model)
}
```
**Observações:**
- ✅ Suporte a múltiplos provedores
- ✅ Cálculo de custos implementado
- ✅ Tratamento de erros
- ❌ **NÃO persiste métricas no banco**
- ❌ **NÃO tem sistema de fallback automático**

---

#### **AIOrchestrator (`lib/ai-orchestrator.ts`)**
```typescript
class AIOrchestrator {
  // Escolhe modelo baseado em:
  - Tipo de tarefa (content_generation, multimodal, wordpress_diagnostic)
  - Prioridade (low, medium, high)
  - Multimodalidade
  
  // Lógica de seleção:
  - Gemini → tarefas complexas, multimodais, diagnósticos
  - OpenAI → tarefas rápidas, baixo custo
  
  // Memória em runtime:
  - Map<string, any> memory (NÃO persiste)
  - WordPressDiagnostic[] diagnosticHistory (NÃO persiste)
  
  // Métodos:
  - processRequest(request: AIRequest)
  - selectModel(request: AIRequest)
  - buildPrompt(request: AIRequest)
  - calculateCost(model, tokens)
  - saveDiagnosticResult() // Salva via API, não direto no banco
}
```
**Observações:**
- ✅ Lógica de seleção de modelo
- ✅ Construção de prompts otimizados
- ❌ **Memória não persiste** (apenas em runtime)
- ❌ **Histórico não persiste** (apenas em runtime)
- ❌ **NÃO tem aprendizado de padrões**

---

### **3.2. Endpoints de IA**

#### **`/api/ai/generate`**
- Geração genérica de conteúdo
- Suporta OpenAI e Gemini
- Retorna tokens e custo (mas não persiste)

#### **`/api/ai/test`**
- Teste de conexão com APIs
- Validação de chaves
- Suporte a múltiplos modelos

#### **`/api/ai-content/generate`**
- Geração de conteúdo completo
- Cria registro em `AIContent`
- Processamento assíncrono
- Registra histórico em `AIContentHistory`

#### **`/api/ai-content/[id]/regenerate`**
- Regeneração de conteúdo existente
- Mantém histórico

#### **`/api/ai-content/[id]/publish`**
- Publicação no WordPress
- Atualiza `wordpressPostId` e `wordpressUrl`

#### **`/api/ai-content/suggest-topic`**
- Sugestão de tópicos via IA

#### **`/api/ai-content/generate-keywords`**
- Geração de palavras-chave via IA

#### **`/api/ai-content/[id]/generate-image`**
- Geração de imagens (DALL-E)

---

### **3.3. Integração WordPress com IA**

#### **WordPressDiagnostic com IA**
- Endpoint: `/api/wordpress/diagnostic/save`
- Salva diagnósticos em `WordPressDiagnostic`
- Usa IA para análise (OpenAI/Gemini)
- Resultado em JSON na coluna `resultado`

#### **Pressel Automation**
- Processamento de JSON para WordPress
- Integração com ACF (Advanced Custom Fields)
- Publicação automática

---

## 4️⃣ ARMAZENAMENTO DE DADOS DE CONTEÚDO

### **4.1. Onde o Conteúdo Está Armazenado**

#### **Tabela `Page`**
- Campo `content`: String (HTML/texto)
- Campo `excerpt`: String (resumo)
- Campo `customFields`: JSON (metadados)
- **Volume estimado:** Depende do uso, mas pode ser grande

#### **Tabela `AIContent`**
- Campo `content`: String (conteúdo gerado por IA)
- Campo `excerpt`: String
- Campo `title`: String
- Campo `prompt`: String (prompt original)
- **Volume estimado:** Crescendo conforme uso de IA

#### **Tabela `Template`**
- Campo `content`: String (template HTML)
- Campo `fields`: JSON array

#### **Tabela `Media`**
- Campo `url`: String (URL da mídia)
- Campo `alt`: String (texto alternativo)
- Campo `caption`: String

---

### **4.2. Estrutura de Dados JSON**

#### **`Organization.settings`**
```json
{
  "theme": "...",
  "features": {...},
  "ai": {...}  // Pode conter configurações de IA
}
```

#### **`Site.settings`**
```json
{
  "wordpress": {...},
  "seo": {...},
  "ai": {...}  // Pode conter configurações de IA por site
}
```

#### **`Page.customFields`**
```json
{
  "custom_field_1": "...",
  "acf_fields": {...},
  "metadata": {...}
}
```

#### **`AIContent.generationConfig`**
```json
{
  "aiModel": "gpt-4",
  "prompt": "...",
  "temperature": 0.7,
  "maxTokens": 4000
}
```

#### **`AIContent.secondaryKeywords`**
```json
["keyword1", "keyword2", "keyword3"]
```

#### **`AIContentHistory.metadata`**
```json
{
  "title": "...",
  "keywords": "...",
  "language": "pt-BR",
  "category": "...",
  "aiModel": "gpt-4",
  "wordCount": 1500
}
```

---

## 5️⃣ LOGS E MÉTRICAS DE IA

### **5.1. Rastreamento Atual**

#### **APIUsageTracker (`lib/api-usage-tracker.ts`)**
```typescript
class APIUsageTracker {
  // Rastreia em MEMÓRIA (não persiste):
  - requests: number
  - tokens: number
  - cost: number
  - lastUsed: Date
  
  // Armazena em localStorage (cliente):
  - saveToStorage() // localStorage do navegador
  - loadFromStorage()
  
  // Tipos suportados:
  - openai
  - gemini
  - koala
}
```
**Observações:**
- ❌ **NÃO persiste no banco de dados**
- ❌ **Apenas no cliente (localStorage)**
- ❌ **Não tem histórico temporal**
- ❌ **Não tem relacionamento com usuários/conteúdo**

---

#### **AIContentHistory**
- ✅ Armazena ações (generate, edit, publish, etc)
- ✅ Armazena prompt usado
- ✅ Armazena metadados em JSON
- ❌ **NÃO armazena tokens/custo**
- ❌ **NÃO armazena tempo de resposta**
- ❌ **NÃO armazena modelo usado explicitamente**

---

### **5.2. O Que NÃO Existe**

- ❌ Tabela de métricas de IA
- ❌ Rastreamento de tokens por requisição
- ❌ Rastreamento de custo por requisição
- ❌ Rastreamento de tempo de resposta
- ❌ Histórico de interações de IA
- ❌ Dashboard de métricas de IA
- ❌ Alertas de custo/limite

---

## 6️⃣ INTEGRAÇÕES WORDPRESS

### **6.1. Sincronização WordPress**

#### **WordPressSync (`lib/wordpress-sync.ts`)**
- Sincronização bidirecional
- Páginas, mídia, categorias, usuários
- Suporte a ACF (Advanced Custom Fields)

#### **WordPressDataManager (`lib/wordpress-data-manager.ts`)**
- Gerenciamento de dados WordPress
- Cache e otimização

#### **Endpoints WordPress**
- `/api/wordpress/sync` - Sincronização completa
- `/api/wordpress/sync-all` - Sincronização de tudo
- `/api/wordpress/create-post` - Criar post
- `/api/wordpress/create-page` - Criar página
- `/api/wordpress/credentials` - Gerenciar credenciais
- `/api/wordpress/validate-site` - Validar site
- `/api/wordpress/diagnostic` - Diagnóstico
- `/api/wordpress/diagnostic/save` - Salvar diagnóstico

---

### **6.2. Dados WordPress no Banco**

#### **Campos em `AIContent`**
- `wordpressPostId`: Int (ID do post no WordPress)
- `wordpressUrl`: String (URL do post)

#### **Campos em `Page`**
- `customFields`: JSON (pode conter dados do WordPress)

---

## 7️⃣ ONDE A IA É USADA ATUALMENTE

### **7.1. Geração de Conteúdo**
- ✅ Criação de páginas via IA
- ✅ Regeneração de conteúdo
- ✅ Sugestão de tópicos
- ✅ Geração de palavras-chave
- ✅ Geração de imagens (DALL-E)

### **7.2. Diagnóstico WordPress**
- ✅ Análise de SEO
- ✅ Análise de compliance
- ✅ Análise de segurança
- ✅ Detecção de links quebrados
- ✅ Análise de usabilidade

### **7.3. Pressel Automation**
- ✅ Processamento de JSON
- ✅ Validação de campos ACF
- ✅ Publicação automática

---

## 8️⃣ PONTOS DE EXTENSÃO IDENTIFICADOS

### **8.1. Onde Adicionar Embeddings**

#### **Tabela `Page`**
- Adicionar campo `embedding` (vector)
- Gerar embedding ao criar/editar página
- Indexar para busca semântica

#### **Tabela `AIContent`**
- Adicionar campo `embedding` (vector)
- Gerar embedding ao gerar conteúdo
- Indexar para busca semântica

#### **Tabela `Template`**
- Adicionar campo `embedding` (vector)
- Gerar embedding do template
- Buscar templates similares

---

### **8.2. Onde Adicionar Rastreamento de IA**

#### **Nova Tabela: `AIInteraction`**
- Rastrear todas as interações com IA
- Tokens, custo, tempo, modelo
- Relacionamento com User, Site, Content

#### **Nova Tabela: `AIMetric`**
- Métricas agregadas
- Por dia, semana, mês
- Por usuário, site, modelo

---

### **8.3. Onde Adicionar Versionamento de Prompts**

#### **Nova Tabela: `AIPrompt`**
- Prompts versionados
- Por funcionalidade
- Auditável e reutilizável

---

## 9️⃣ LIMITAÇÕES ATUAIS

### **9.1. Banco de Dados**
- ❌ **NÃO tem pgvector instalado**
- ❌ **NÃO tem suporte a vetores**
- ❌ **NÃO tem índices semânticos**
- ❌ **NÃO tem tabela de embeddings**
- ❌ **NÃO tem tabela de interações de IA**
- ❌ **NÃO tem tabela de métricas**

### **9.2. Funcionalidades de IA**
- ❌ **NÃO tem busca semântica**
- ❌ **NÃO tem RAG implementado**
- ❌ **NÃO tem memória persistente**
- ❌ **NÃO tem aprendizado de padrões**
- ❌ **NÃO tem versionamento de prompts**
- ❌ **NÃO tem métricas detalhadas**

### **9.3. Integrações**
- ❌ **NÃO indexa conteúdo do WordPress automaticamente**
- ❌ **NÃO tem reindexação automática**
- ❌ **NÃO tem cache de embeddings**

---

## 🔟 DADOS ESTIMADOS

### **10.1. Volume de Dados**

#### **Conteúdo**
- `Page`: ~100-1000 páginas por site (estimativa)
- `AIContent`: ~50-500 conteúdos gerados por site (estimativa)
- `Template`: ~10-50 templates (estimativa)

#### **Histórico**
- `AIContentHistory`: ~5-10 entradas por conteúdo (estimativa)

#### **WordPress**
- Sincronização: ~100-1000 posts/páginas por site (estimativa)

---

### **10.2. Tamanho de Embeddings**

#### **Estimativa por Embedding**
- OpenAI `text-embedding-ada-002`: 1536 dimensões
- OpenAI `text-embedding-3-small`: 1536 dimensões
- OpenAI `text-embedding-3-large`: 3072 dimensões
- Google Gemini: 768 dimensões (estimativa)

#### **Tamanho em Bytes**
- 1536 dimensões × 4 bytes (float) = **6.144 KB por embedding**
- 3072 dimensões × 4 bytes (float) = **12.288 KB por embedding**

#### **Volume Total Estimado**
- 1000 páginas × 6 KB = **6 MB** (apenas embeddings)
- 500 conteúdos IA × 6 KB = **3 MB**
- **Total: ~10-20 MB** de embeddings (inicial)

---

## 1️⃣1️⃣ PRÓXIMOS PASSOS

Com base neste mapeamento, os próximos passos serão:

1. ✅ **Definir Arquitetura IA-native** (documento 2)
2. ✅ **Modelagem do Banco com pgvector** (documento 3)
3. ✅ **Pipeline de Embeddings** (documento 4)
4. ✅ **Fluxo RAG** (documento 5)
5. ✅ **Orquestração de IA** (documento 6)
6. ✅ **Versionamento de Prompts** (documento 7)
7. ✅ **Métricas e Auditoria** (documento 8)
8. ✅ **Checklist Executável** (documento 9)

---

## 📋 CONCLUSÃO

### **O Que Já Existe:**
- ✅ Stack moderna (Next.js, Prisma, PostgreSQL)
- ✅ Multi-tenancy (Organization → Sites → Content)
- ✅ Integração com OpenAI e Gemini
- ✅ Tabela de conteúdo IA (AIContent)
- ✅ Histórico básico (AIContentHistory)
- ✅ Sistema de filas (QueueJob)
- ✅ Integração WordPress

### **O Que Falta:**
- ❌ pgvector (extensão PostgreSQL)
- ❌ Tabelas de embeddings
- ❌ Tabelas de interações de IA
- ❌ Tabelas de métricas
- ❌ Sistema RAG
- ❌ Busca semântica
- ❌ Versionamento de prompts
- ❌ Métricas detalhadas

### **Compatibilidade:**
- ✅ **Todas as mudanças serão ADITIVAS**
- ✅ **Nenhuma tabela existente será removida**
- ✅ **Nenhum campo existente será alterado** (apenas adicionados)
- ✅ **Backward compatible 100%**

---

**Próximo Documento:** `2-ARQUITETURA-IA-NATIVE.md`

---

**Data de Criação:** Janeiro 2025  
**Status:** ✅ Completo e Validado









