# ⚠️ AVISO DE SEGURANÇA - CHAVES DE API

## 🔒 IMPORTANTE: NUNCA COMPARTILHE SUAS CHAVES DE API

### ✅ O que foi feito:

1. **Todas as chaves antigas foram removidas** dos arquivos de código e documentação
2. **Sua chave atual está apenas no arquivo `.env.local`** (que está no `.gitignore`)
3. **Todos os scripts e documentação agora usam placeholders** genéricos

### 📋 Checklist de Segurança:

- [x] `.env.local` está no `.gitignore` ✅
- [x] Chaves removidas de scripts ✅
- [x] Chaves removidas de documentação ✅
- [x] Chaves removidas de arquivos de teste ✅

### 🚨 REGRAS IMPORTANTES:

1. **NUNCA** commite arquivos `.env` ou `.env.local` no Git
2. **NUNCA** compartilhe suas chaves de API em:
   - Mensagens de chat
   - Emails
   - Issues do GitHub
   - Pull Requests
   - Documentação pública
   - Screenshots

3. **SEMPRE** use variáveis de ambiente para chaves de API
4. **SEMPRE** use placeholders (`your-api-key-here`) em código público

### 🔑 Sua chave está configurada em:

```
.env.local (NÃO versionado - seguro)
```

### 🛡️ Se sua chave vazar:

1. **Revogue imediatamente** a chave no Google AI Studio
2. **Gere uma nova chave**
3. **Atualize o arquivo `.env.local`**
4. **Verifique logs** para uso não autorizado

### 📝 Como adicionar sua chave:

1. Crie ou edite o arquivo `.env.local` na raiz do projeto
2. Adicione:
   ```
   GOOGLE_AI_STUDIO_API_KEY="sua-chave-aqui"
   ```
3. **NUNCA** commite este arquivo!

---

**Última atualização:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

