# 🚀 RESUMO RÁPIDO - TESTE V2.2

## COMANDOS ESSENCIAIS

### 1. Verificar Ambiente
```bash
# Windows PowerShell
cat .env.local | Select-String "GOOGLE_AI_STUDIO_API_KEY|OPENAI_API_KEY"

# Linux/Mac
cat .env.local | grep -E "GOOGLE_AI_STUDIO_API_KEY|OPENAI_API_KEY"
```

### 2. Compilação
```bash
npm run typecheck
```

### 3. Testes
```bash
npm run test tests/image-generation/
```

### 4. Iniciar Servidor
```bash
npm run dev
```

### 5. Testar via Script
```bash
# Windows PowerShell
.\scripts\test-v2.2-generation.ps1

# Linux/Mac
bash scripts/test-v2.2-generation.sh
```

### 6. Testar via Interface
1. Acesse: `http://localhost:4000/criativos`
2. Preencha o prompt principal
3. Selecione **Draft** ou **Production**
4. Clique em **"Gerar Imagens"**

### 7. Testar via API (cURL)
```bash
curl -X POST http://localhost:4000/api/creative/generate \
  -H "Content-Type: application/json" \
  -d '{
    "mainPrompt": "Crie uma imagem publicitária de alta conversão para anúncio digital promovendo um Walmart Gift Card.",
    "generateImage": true,
    "qualityTier": "draft",
    "variations": 2,
    "imageRatio": "9:16"
  }'
```

---

## ✅ CHECKLIST RÁPIDO

- [ ] Variáveis de ambiente configuradas (`.env.local`)
- [ ] `npm run typecheck` sem erros
- [ ] `npm run test` passando
- [ ] `npm run dev` iniciado
- [ ] Teste Draft: 2 imagens geradas
- [ ] Teste Production: 4 imagens + bestImage

---

## 📚 DOCUMENTAÇÃO COMPLETA

Ver: `docs/COMO-RODAR-E-TESTAR-V2.2.md`







