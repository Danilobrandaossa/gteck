# TECHNICAL DEBT - CMS MODERNO

**Data de Criação:** 2025-10-31  
**Última Atualização:** 2025-10-31  
**Status:** Em Auditoria

---

## 🔴 CRÍTICO (Alto Risco)

### 1. Console.log em Produção
**Problema:** 568+ chamadas `console.log/debug/warn/error` espalhadas pelo código  
**Impacto:** 
- Performance degradada em produção
- Exposição de informações sensíveis
- Logs desnecessários
- Bundle size aumentado

**Localização:**
- `app/`: 189 ocorrências
- `lib/`: 379 ocorrências

**Solução:**
- Implementar logger estruturado
- Remover todos os console.* exceto console.error (com guard de produção)
- Criar wrapper de logger com níveis (debug, info, warn, error)
- Usar variável de ambiente para controlar verbosidade

**Esforço:** Médio (2-3 dias)  
**Prazo Proposto:** 2025-11-05

---

### 2. Uso Excessivo de `any` em TypeScript
**Problema:** 32+ ocorrências de `any` tipo no código  
**Impacto:**
- Perda de type safety
- Bugs potenciais não detectados em compile-time
- Dificulta manutenção e refatoração

**Localização:**
- `app/pressel/page.tsx`: 3 ocorrências
- `app/settings/page.tsx`: 8 ocorrências
- `app/pages/page.tsx`: 4 ocorrências
- Outros arquivos

**Solução:**
- Criar interfaces/tipos apropriados
- Habilitar `noImplicitAny` no tsconfig
- Habilitar `strictNullChecks`
- Habilitar `noUncheckedIndexedAccess`

**Esforço:** Alto (4-5 dias)  
**Prazo Proposto:** 2025-11-10

---

### 3. Arquivos Legados e Duplicados
**Problema:** 
- `/pressel-automation` (versão antiga) ainda presente
- Múltiplos arquivos ZIP de plugins
- 30+ arquivos MD de relatórios na raiz
- 163 scripts (possivelmente muitos obsoletos)

**Impacto:**
- Confusão sobre qual versão usar
- Repositório inchado
- Dificuldade de navegação

**Solução:**
- Mover `/pressel-automation` para `/archive`
- Organizar relatórios em `/docs/relatorios/`
- Auditar e remover scripts não utilizados
- Adicionar arquivos ZIP ao .gitignore

**Esforço:** Baixo (1 dia)  
**Prazo Proposto:** 2025-11-01

---

## 🟡 IMPORTANTE (Médio Risco)

### 4. TypeScript Strict Mode Não Completo
**Problema:** `tsconfig.json` tem `strict: true` mas falta configurações adicionais  
**Impacto:** Type safety incompleto

**Faltando:**
- `noImplicitAny` (deveria estar em strict)
- `strictNullChecks` (deveria estar em strict)
- `noUncheckedIndexedAccess`
- `exactOptionalPropertyTypes`

**Solução:** Atualizar tsconfig.json com todas as flags strict  
**Esforço:** Baixo (2 horas)  
**Prazo Proposto:** 2025-11-01

---

### 5. Falta de Logger Estruturado
**Problema:** Sem sistema centralizado de logging  
**Impacto:**
- Difícil rastrear problemas em produção
- Logs inconsistentes
- Não há correlação de requisições

**Solução:**
- Implementar logger baseado em níveis
- Integrar com OpenTelemetry (opcional)
- Suportar múltiplos outputs (console, file, cloud)

**Esforço:** Médio (2-3 dias)  
**Prazo Proposto:** 2025-11-08

---

### 6. Cobertura de Testes Insuficiente
**Problema:** Não há testes automatizados configurados  
**Impacto:**
- Risco de regressões
- Difícil refatorar com segurança
- Bugs podem passar despercebidos

**Solução:**
- Configurar Jest/Vitest
- Adicionar testes unitários para lib/
- Adicionar testes de integração para API routes
- Adicionar testes E2E para fluxos críticos

**Esforço:** Alto (1-2 semanas)  
**Prazo Proposto:** 2025-11-20

---

### 7. Logs Acumulados
**Problema:** 54+ arquivos de log em `/logs/pressel-automation`  
**Impacto:**
- Espaço em disco desperdiçado
- Dificuldade de encontrar logs recentes

**Solução:**
- Implementar rotação de logs
- Adicionar limpeza automática (logs > 30 dias)
- Mover logs para .gitignore se não forem versionados

**Esforço:** Baixo (4 horas)  
**Prazo Proposto:** 2025-11-02

---

## 🟢 MELHORIAS (Baixo Risco)

### 8. Dependências Não Auditadas
**Problema:** Não há auditoria regular de vulnerabilidades  
**Impacto:** Possíveis vulnerabilidades de segurança

**Solução:**
- Executar `npm audit` regularmente
- Configurar Dependabot/GitHub Dependencies
- Documentar processo de atualização

**Esforço:** Baixo (2 horas)  
**Prazo Proposto:** 2025-11-01

---

### 9. Documentação Espalhada
**Problema:** 30+ arquivos MD na raiz do projeto  
**Impacto:** Dificuldade de encontrar documentação

**Solução:**
- Organizar em `/docs`
- Criar índice de documentação
- Mover relatórios para subpasta

**Esforço:** Baixo (3 horas)  
**Prazo Proposto:** 2025-11-01

---

### 10. Falta de ESLint/Prettier Configurado
**Problema:** Não há configuração explícita de formatação  
**Impacto:** Inconsistência de código

**Solução:**
- Configurar ESLint com regras apropriadas
- Configurar Prettier
- Adicionar pre-commit hooks

**Esforço:** Baixo (4 horas)  
**Prazo Proposto:** 2025-11-02

---

## 📋 TODOs Encontrados

### app/api/wordpress/diagnostic/save/route.ts
- **Linha 15:** `// TODO: Implementar salvamento no banco quando necessário`
- **Linha 40:** `// TODO: Implementar busca no banco quando necessário`

**Ação:** Implementar ou documentar em TECH_DEBT.md  
**Prazo:** 2025-11-05

---

## 🎯 PRIORIZAÇÃO RECOMENDADA

### Fase 1 (Semana 1 - Urgente)
1. ✅ Limpar console.log (Crítico)
2. ✅ Organizar arquivos legados (Crítico)
3. ✅ TypeScript strict completo (Importante)
4. ✅ Auditoria de dependências (Melhoria)

### Fase 2 (Semana 2)
5. ✅ Substituir `any` por tipos apropriados (Crítico)
6. ✅ Logger estruturado (Importante)
7. ✅ Rotação de logs (Melhoria)

### Fase 3 (Semana 3-4)
8. ✅ Testes automatizados (Importante)
9. ✅ ESLint/Prettier (Melhoria)
10. ✅ Documentação organizada (Melhoria)

---

## 📊 MÉTRICAS ATUAIS

- **Console.log encontrados:** 568+
- **Tipos `any`:** 32+
- **Arquivos legados:** ~5+
- **Scripts:** 163 (precisa auditoria)
- **Documentos MD na raiz:** 30+
- **Logs acumulados:** 54+ arquivos
- **Cobertura de testes:** 0%

---

**Nota:** Este documento será atualizado conforme a auditoria avança e novos problemas são identificados.

