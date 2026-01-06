# 🔍 Debug: Performance Creative API - Erro 500

## Problema
Erro 500 ao chamar `/api/creative/performance`

## Possíveis Causas

### 1. **Formato da Resposta do AIService**
O AIService retorna `data.content`, mas pode haver variações no formato.

**Solução aplicada:**
- Parser tolerante que verifica múltiplos formatos
- Logs detalhados para identificar o problema

### 2. **Validação de Campos**
Campos obrigatórios podem estar faltando ou em formato incorreto.

**Verificar:**
- `language`: deve ser 'pt-BR', 'en-US' ou 'es-ES'
- `niche`: deve incluir 'dorama' agora
- `platform`: deve ser um dos valores válidos
- `creative_type`: deve ser 'variações A/B' (com acento)
- `objective`: deve ser um dos valores válidos

### 3. **Erro no AIService**
O AIService pode estar retornando erro ou formato inesperado.

## Como Debuggar

### 1. Verificar Logs do Servidor
```bash
# No terminal onde o servidor está rodando, procurar por:
[Performance Creative API] Erro completo:
[PerformanceCreativeEngine] Erro ao gerar criativos:
[CopyGenerator] Erro ao gerar copy:
```

### 2. Testar API Diretamente
```bash
curl -X POST http://localhost:4000/api/creative/performance \
  -H "Content-Type: application/json" \
  -d '{
    "language": "pt-BR",
    "niche": "dorama",
    "platform": "meta-ads",
    "creative_type": "variações A/B",
    "objective": "retenção visual",
    "product_name": "La Heredera Contrataca"
  }'
```

### 3. Verificar Console do Navegador
- Abrir DevTools (F12)
- Verificar Network tab
- Ver resposta completa do erro

## Correções Aplicadas

1. ✅ Parser tolerante para resposta do AIService
2. ✅ Logs detalhados em cada etapa
3. ✅ Tratamento de erro melhorado
4. ✅ Validação de campos obrigatórios

## Próximos Passos

1. Verificar logs do servidor para identificar erro exato
2. Testar com request mínimo
3. Verificar se AIService está funcionando corretamente




