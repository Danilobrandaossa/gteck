# Plano de QA - CMS Moderno

## Objetivo

Garantir que o CMS esteja pronto para produção por meio de uma rodada completa de QA manual e automatizado, cobrindo fluxos críticos, regressões e integrações externas.

## 1. Escopo do QA

### 1.1 Funcionalidades Prioritárias
- Autenticação e controle de acesso (login, logout, permissões por role).
- Painel principal (dashboard) e navegação entre seções.
- Geração e gerenciamento de conteúdo com IA.
- Sincronização com WordPress (criação/atualização de páginas, campos ACF).
- Filas (`queue_jobs`) e status de processamento.
- Configurações organizacionais (sites, APIs, integrações).
- Página de categorias/páginas (CRUD completo).
- Relatórios e diagnósticos (WordPress diagnostic e AI diagnostic).
- API endpoints críticos (`/api/ai-content`, `/api/wordpress`, `/api/health`).

### 1.2 Ambientes
- **Desenvolvimento**: testes exploratórios rápidos.
- **Staging** (recomendado): ambiente espelho com dados seed realistas.
- **Produção**: somente smoke tests pós-deploy.

## 2. Responsabilidades

| Papel | Responsabilidades |
| ----- | ----------------- |
| QA / Tester | Executar cenários manuais, reportar bugs, validar correções. |
| Developer | Corrigir defeitos, automatizar casos priorizados, manter scripts de seed. |
| DevOps | Preparar ambiente de staging, garantir integridade de configs/secrets. |
| Product Owner | Validar critérios de aceite e aprovar release. |

## 3. Preparação

1. Atualizar staging com branch candidata.
2. Executar scripts de seed realistas (`node scripts/seed-local.js` adaptado para staging).
3. Confirmar health-check (`GET /api/health/integrations` → `ready`).
4. Garantir que secrets/token estejam válidos em staging.
5. Limpar filas e bancos (opcional) para iniciar do zero.

## 4. Plano de Testes

### 4.1 Testes Manuais (Alta Prioridade)
- Checklists por funcionalidade (login, dash, IA, WordPress, filas, configurações).
- Testes negativos (ex.: credenciais inválidas, erros de IA, perda de conexão WP).
- Acessibilidade básica (tab, leitor de tela, contraste).
- UI/UX (responsividade, layout quebrado).

### 4.2 Testes Automatizados
- `npm run test` (Vitest) — expandir para incluir rotas críticas gradualmente.
- Planejar suíte E2E (Playwright/Cypress):
  - Login → criar conteúdo → publicar → validar no WordPress mock.
  - Simular jobs de fila.

### 4.3 Testes de Integridade
- Scripts utilitários existentes (`scripts/test-real-*`). Definir quais podem ser executados em staging.
- Health-check contínuo via monitoramento.

## 5. Cronograma Sugerido

| Dia | Atividade |
| --- | --------- |
| D0 | Preparação do ambiente e dados, validação de health-check. |
| D1 | Execução de testes manuais (frontend/backoffice). |
| D2 | Execução de testes de integração/automação, scripts WordPress/IA. |
| D3 | Correção de bugs críticos, reteste. |
| D4 | Reteste final + checklist de release (com Product Owner). |

## 6. Critérios de Aceite

- 0 bugs bloqueadores ou críticos.
- Bugs médios avaliados e com workaround claro.
- Testes automatizados (unit/integration) passando.
- Checklist de segurança (CORS, rate limit, secrets) validado.
- Product Owner aprova release.

## 7. Artefatos de QA

- Planilha/board com casos de teste e status (Notion, Google Sheets, TestRail).
- Relatório final: resumo de execução, bugs abertos/fechados, recomendações.
- Logs de testes automatizados e capturas de tela relevantes.

## 8. Próximos Passos

- [ ] Selecionar ferramenta para rastrear casos (Sheets, Notion ou TestRail).
- [ ] Definir dados seed específicos para staging.
- [ ] Expandir automatização E2E (Playwright/Cypress).
- [ ] Documentar fluxo de smoke test pós-deploy.

> **Dica:** mantenha este plano versionado no repositório e atualize após cada rodada para refletir lições aprendidas.



