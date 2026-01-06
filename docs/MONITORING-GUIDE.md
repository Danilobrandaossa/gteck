# Monitoramento Básico do CMS

Este guia descreve como habilitar o monitoramento essencial do CMS Moderno.

## 1. Logs Estruturados

- As rotas de API utilizam `lib/logger.ts` com níveis `debug`, `info`, `warn`, `error`.
- Configure as variáveis ambientais para direcionar os logs:
  - `LOG_LEVEL` – ajuste o nível mínimo (ex.: `info` em produção, `debug` em desenvolvimento).
  - `LOG_FILE` – caminho para arquivo de log se desejar persistência.
- Recomenda-se enviar os logs para um agregador (Sentry, Datadog, Loki). Para isso:
  1. Utilize um agente ou sidecar para coletar `stdout` do servidor.
  2. Utilize o `requestId` (header `x-request-id`) para correlacionar eventos.

## 2. Health-checks

- Endpoint `GET /api/health/integrations` fornece status das integrações (WordPress, OpenAI, n8n, Zapier e WhatsApp).
- Configure as variáveis correspondentes (`WORDPRESS_DEFAULT_URL`, `OPENAI_API_KEY`, etc.) e monitore:
  - `summary.ready`
  - `summary.error`
- Integre esse endpoint ao sistema de monitoramento (por exemplo, ping a cada 5 minutos).

## 3. Observabilidade Adicional (Recomendada)

- **Sentry/Datadog**: defina `SENTRY_DSN` ou outro provedor. Capture erros enviando `logger.error` junto de `Sentry.captureException`.
- **Metrics (Prometheus/Grafana)**: exponha métricas a partir das filas (`queue_jobs`) e consumo de IA. Uma abordagem simples é expor endpoint `/api/health/metrics` com contadores.
- **Alertas**: configure alertas automáticos para:
  - Falhas repetidas nas filas (`queue_jobs.status = failed`).
  - Aumento do tempo de resposta das integrações (`latencyMs` acima de limite).

## 4. Pipeline CI/CD

- A pipeline GitHub Actions (`.github/workflows/ci.yml`) garante:
  - Instalação (`npm ci`).
  - `prisma generate` (valida schema).
  - `npm run lint` e `npm run build`.
- Expanda com etapas adicionais conforme necessário:
  - Testes automatizados (quando implementados).
  - Deploy automatizado (utilizando ações específicas do provedor de hospedagem).

## 5. Checklist Rápido Antes do Deploy

1. `npm run lint` e `npm run build` passam localmente.
2. `GET /api/health/integrations` retorna `summary.error = 0`.
3. Logs estão sendo coletados e armazenados.
4. Variáveis sensíveis definidas (`NEXTAUTH_SECRET`, `OPENAI_API_KEY`, `WORDPRESS_DEFAULT_*`, etc.).
5. Backups de banco configurados/validados.


