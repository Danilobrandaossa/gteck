# 🔧 Auto-Fix Build Script

Script automatizado que corrige erros comuns que quebram `next build` até o build passar.

## 🚀 Comando Único

### No servidor Linux:
```bash
cd /var/www/crm.gteck.com.br
npx tsx scripts/auto-fix-build.ts --apply
```

### Ou usando o wrapper:
```bash
cd /var/www/crm.gteck.com.br
bash scripts/auto-fix-build.sh --apply
```

## 📋 Como Usar

### 1. Modo Dry-Run (Simular)
```bash
tsx scripts/auto-fix-build.ts --dry-run
```
- Mostra quais correções seriam aplicadas
- **NÃO modifica arquivos**
- Útil para ver o que será corrigido antes

### 2. Modo Apply (Aplicar)
```bash
tsx scripts/auto-fix-build.ts --apply
```
- Aplica correções automaticamente
- Modifica arquivos
- Repete até build passar ou atingir limite

### 3. Com Limite de Correções
```bash
tsx scripts/auto-fix-build.ts --apply --max-fixes=10
```
- Limita número de correções (padrão: 20)
- Evita loops infinitos

## 🔍 Tipos de Erros Corrigidos Automaticamente

### A) Variáveis Não Utilizadas
**Erro:**
```
'request' is declared but its value is never read.
```

**Correção:**
- Se for desestruturação: remove a variável
- Se for `const x = ...`: prefixa com `_` (ex: `_request`)

### B) Possibly Undefined/Null
**Erro:**
```
'wordpressResponse.data' is possibly 'undefined'.
```

**Correção:**
- Adiciona guard clause antes do uso
- Retorna erro HTTP adequado (400/502)

### C) Prisma Client
**Erro:**
```
Property 'modelName' does not exist on PrismaClient
```

**Correção:**
- Executa `npx prisma generate` automaticamente

## 📊 Exemplo de Saída

```
🚀 Iniciando auto-fix de build...

Modo: APPLY (aplica mudanças)
Limite máximo de correções: 20

📦 Verificando Prisma Client...
✅ Prisma Client OK

============================================================
Tentativa 1/20
============================================================

❌ Erro encontrado:
   Arquivo: app/api/pressel/create/route.ts
   Linha: 96:19
   Tipo: possibly-undefined
   Mensagem: 'wordpressResponse.data' is possibly 'undefined'.

✅ Correção aplicada: Adicionada guard clause para wordpressResponse.data

📝 Diff:
+ if (!wordpressResponse.data) {
+   return NextResponse.json(
+     { error: 'wordpressResponse.data é obrigatório' },
+     { status: 502 }
+   )
+ }
- pageId: wordpressResponse.data.id,
+ pageId: wordpressResponse.data?.id,

============================================================
Tentativa 2/20
============================================================

✅ BUILD PASSOU!
✅ .next/BUILD_ID existe

📋 CHECKLIST FINAL:
  ✅ npm run build passou
  ✅ .next/BUILD_ID existe

🚀 Pronto para produção!

Comandos PM2 (execute manualmente):
  pm2 delete crm-gteck
  pm2 start npm --name "crm-gteck" -- start
  pm2 save
```

## ⚠️ Regras Importantes

1. **Nunca reinicia PM2 automaticamente** - apenas mostra comandos
2. **Sempre verifica BUILD_ID** - build só é válido se `.next/BUILD_ID` existe
3. **Limite de correções** - para após 20 correções (configurável)
4. **Correções mínimas** - apenas o necessário para build passar
5. **Preserva comportamento** - não altera lógica do sistema

## 🛠️ Instalação de Dependências

Se `tsx` não estiver instalado:
```bash
npm install -g tsx
```

Ou localmente no projeto:
```bash
npm install --save-dev tsx
npx tsx scripts/auto-fix-build.ts --apply
```

## 📝 Checklist Pós-Execução

Após o script executar com sucesso:

- [ ] `npm run build` passou sem erros
- [ ] `.next/BUILD_ID` existe
- [ ] Nenhum erro de TypeScript/ESLint
- [ ] Aplicação pode ser iniciada com `npm start`

**SOMENTE então:**
- [ ] Executar comandos PM2 para produção

## 🐛 Erros Não Suportados

Se o script não conseguir corrigir automaticamente:

1. **Erros de sintaxe complexos** - correção manual necessária
2. **Erros de lógica** - não são detectados pelo TypeScript
3. **Dependências faltando** - `npm install` necessário
4. **Configurações incorretas** - revisar `.env.local`

Nesses casos, o script para e mostra:
- Arquivo e linha do erro
- Output completo do build
- Instruções para correção manual

## 🔄 Fluxo Completo no Servidor

```bash
# 1. Conectar ao servidor
ssh root@72.60.255.227

# 2. Navegar para o projeto
cd /var/www/crm.gteck.com.br

# 3. Atualizar código
git pull

# 4. Executar auto-fix
tsx scripts/auto-fix-build.ts --apply

# 5. Se build passar, iniciar PM2
pm2 delete crm-gteck
pm2 start npm --name "crm-gteck" -- start
pm2 save

# 6. Verificar logs
pm2 logs crm-gteck --lines 50

# 7. Testar aplicação
curl http://localhost:3000
```

## 📚 Referências

- [Next.js Build Errors](https://nextjs.org/docs/messages)
- [TypeScript Error Messages](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Prisma Client Generation](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/generating-prisma-client)

