#!/bin/bash

# Script de teste rápido para V2.2
# Uso: bash scripts/test-v2.2-generation.sh

set -e

echo "🧪 TESTE V2.2 - GERAÇÃO DE IMAGENS"
echo "=================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar variáveis de ambiente
echo "1️⃣ Verificando variáveis de ambiente..."
if [ -f .env.local ]; then
    if grep -q "GOOGLE_AI_STUDIO_API_KEY" .env.local; then
        echo -e "${GREEN}✓ GOOGLE_AI_STUDIO_API_KEY configurada${NC}"
    else
        echo -e "${RED}✗ GOOGLE_AI_STUDIO_API_KEY não encontrada${NC}"
        exit 1
    fi
    
    if grep -q "OPENAI_API_KEY" .env.local; then
        echo -e "${GREEN}✓ OPENAI_API_KEY configurada${NC}"
    else
        echo -e "${YELLOW}⚠ OPENAI_API_KEY não encontrada (necessária para copy e scoring)${NC}"
    fi
else
    echo -e "${RED}✗ .env.local não encontrado${NC}"
    exit 1
fi

echo ""

# Typecheck
echo "2️⃣ Verificando compilação TypeScript..."
if npm run typecheck 2>&1 | grep -q "error"; then
    echo -e "${RED}✗ Erros de compilação encontrados${NC}"
    npm run typecheck
    exit 1
else
    echo -e "${GREEN}✓ TypeScript OK${NC}"
fi

echo ""

# Testes unitários
echo "3️⃣ Rodando testes unitários..."
if npm run test tests/image-generation/ 2>&1 | grep -q "FAIL"; then
    echo -e "${RED}✗ Alguns testes falharam${NC}"
    npm run test tests/image-generation/
    exit 1
else
    echo -e "${GREEN}✓ Todos os testes passaram${NC}"
fi

echo ""

# Verificar se servidor está rodando
echo "4️⃣ Verificando se servidor está rodando..."
if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Servidor rodando em http://localhost:4000${NC}"
    SERVER_RUNNING=true
else
    echo -e "${YELLOW}⚠ Servidor não está rodando${NC}"
    echo "   Execute: npm run dev"
    SERVER_RUNNING=false
fi

echo ""

# Teste de API (se servidor estiver rodando)
if [ "$SERVER_RUNNING" = true ]; then
    echo "5️⃣ Testando API (Draft)..."
    
    RESPONSE=$(curl -s -X POST http://localhost:4000/api/creative/generate \
        -H "Content-Type: application/json" \
        -d '{
            "mainPrompt": "Crie uma imagem publicitária de alta conversão para anúncio digital promovendo um Walmart Gift Card. Uma mulher sorrindo segurando um cartão presente Walmart, fundo azul e amarelo vibrante, estilo publicitário comercial, alto contraste, cores vibrantes, design impactante, foco em conversão.",
            "generateImage": true,
            "qualityTier": "draft",
            "includeTextInImage": false,
            "variations": 2,
            "imageRatio": "9:16"
        }')
    
    if echo "$RESPONSE" | grep -q '"status":"success"'; then
        echo -e "${GREEN}✓ API respondeu com sucesso${NC}"
        
        # Verificar se imagens foram geradas
        if echo "$RESPONSE" | grep -q '"conceptualImages"'; then
            echo -e "${GREEN}✓ Imagens conceituais geradas${NC}"
        fi
        
        if echo "$RESPONSE" | grep -q '"commercialImages"'; then
            echo -e "${GREEN}✓ Imagens comerciais geradas${NC}"
        fi
        
        # Mostrar metadata
        echo ""
        echo "📊 Metadata:"
        echo "$RESPONSE" | grep -o '"metadata":{[^}]*}' | head -1
    else
        echo -e "${RED}✗ API retornou erro${NC}"
        echo "$RESPONSE" | head -20
        exit 1
    fi
else
    echo "5️⃣ ⏭ Pulando teste de API (servidor não está rodando)"
fi

echo ""
echo -e "${GREEN}✅ TESTE V2.2 CONCLUÍDO${NC}"
echo ""
echo "Próximos passos:"
echo "1. Acesse http://localhost:4000/criativos"
echo "2. Teste geração Draft e Production"
echo "3. Verifique logs no terminal do servidor"





