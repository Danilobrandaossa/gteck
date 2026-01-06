# Auditoria Contínua e Rotação de Secrets

Este documento define o plano para gerenciamento seguro de credenciais, tokens e chaves de API usados pelo CMS Moderno.

## 1. Inventário de Secrets

| Variável/Item | Descrição | Local Atual | Observações |
| ------------- | --------- | ----------- | ----------- |
| `NEXTAUTH_SECRET` | Assinatura de tokens de sessão | `.env` / Secrets | Único por ambiente |
| `DATABASE_URL` | Credenciais do banco (PostgreSQL) | `.env` | Preferir usuário exclusivo por ambiente |
| `OPENAI_API_KEY` | Acesso às APIs de IA | `.env` | Rotação automática suportada pela OpenAI |
| `WORDPRESS_DEFAULT_*` | Credenciais de integração WordPress | `.env` | Recomendar uso de senha de aplicação WP |
| `N8N_WEBHOOK_URL` / `N8N_API_KEY` | Automação n8n | `.env` | Validar assinatura/verificação |
| `ZAPIER_WEBHOOK_URL` | Webhook Zapier | `.env` | Regenerar se vazado |
| `WHATSAPP_TOKEN` | Token de API WhatsApp | `.env` | Depende do provedor |
| `JWT_SECRET`, `ENCRYPTION_KEY` | Criptografia/assinatura adicional | `.env` | Deve ter 32 chars mínimo |
| Secrets de produção (Docker, CI/CD) | Credenciais adicionais | Secrets do provedor | Armazenar apenas em vault/Secrets manager |

## 2. Cofre de Secrets

1. **Ambiente Local**: manter apenas chaves mock ou restritas (ex.: `sk-mock`, bancos SQLite).  
2. **Staging / Produção**:
   - Armazenar secrets em um cofre: *AWS Secrets Manager*, *Azure Key Vault*, *GCP Secret Manager* ou *Hashicorp Vault*.  
   - A aplicação deve ler secrets via variáveis de ambiente injetadas pelo orquestrador (Docker/Kubernetes).  
   - Registre quem tem permissão de leitura/escrita.

## 3. Processo de Rotação

| Frequência | Atividades | Responsável |
| ---------- | ---------- | ------------ |
| Trimestral | - Revisar inventário<br>- Regenerar `NEXTAUTH_SECRET`, `JWT_SECRET`, `ENCRYPTION_KEY`<br>- Rodar scripts de rotação em `OPENAI_API_KEY`, tokens WhatsApp/n8n quando suportado | Time de segurança/devops |
| Semestral | - Alterar senhas/usuários no banco (`DATABASE_URL`)<br>- Atualizar credenciais WordPress | Time responsável pela integração |
| Emergencial | - Vazamento ou acesso indevido detectado | Time de resposta a incidentes |

Checklist de rotação:
1. Regenerar o secret/chave/token no provedor.
2. Atualizar o valor no cofre.
3. Atualizar `.env` local apenas se necessário (nunca commitar).
4. Reiniciar serviços dependentes.
5. Registrar data e responsável no documento de controle (ex.: planilha compartilhada).

## 4. Auditoria Contínua

### 4.1 Alertas
- Configurar monitoramento de access logs do cofre/secret manager.
- Integrar com ferramenta de SIEM ou notificações (Slack/Email) para acessos incomuns.

### 4.2 Revisão de Código
- Habilitar `npm run lint` + `git secrets` para prevenir commits contendo chaves.
- Revisar Pull Requests para garantir que secrets não sejam expostos (URLs com tokens, logs etc.).

### 4.3 CI/CD
- Usar **GitHub Secrets** (CI) e evitar imprimir secrets em logs.
- Pipeline deve falhar se variáveis obrigatórias estiverem ausentes.

## 5. Resposta a Incidentes

1. **Identificação**: detectar vazamento (logs, alertas, report de terceiros).
2. **Contenção**: revogar imediatamente os tokens comprometidos.
3. **Erradicação**: rastrear origem (commit, log, servidor) e removê-la.
4. **Recuperação**: gerar novos secrets e redeploy.
5. **Lições aprendidas**: atualizar este plano e adicionar controles preventivos.

## 6. Próximos Passos

- [ ] Definir cofre oficial (Vault/Secrets Manager) e automatizar injeção no deploy.
- [ ] Criar planilha/registro compartilhado com datas de rotação.
- [ ] Automatizar verificação de expiração (scripts ou jobs).
- [ ] Treinar equipe sobre boas práticas (sem envio via chat/email sem criptografia).

> **Importante:** nunca commitar arquivos `.env` ou secrets em plain text. Use `.env.local` para dev e verifique `.gitignore`.



