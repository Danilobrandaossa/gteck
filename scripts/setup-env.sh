#!/bin/bash

echo "🔧 Configurando variáveis de ambiente para o CMS..."

# Criar arquivo .env.local
cat > .env.local << 'EOF'
# Database
DATABASE_URL="postgresql://cms_user:cms_password@localhost:5433/cms_modern"

# NextAuth
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="cms-secret-key-2024-development"

# OpenAI
OPENAI_API_KEY="your-openai-api-key-here"

# Google Gemini
GOOGLE_API_KEY="your-google-gemini-api-key-here"
GOOGLE_AI_STUDIO_API_KEY="your-google-ai-studio-api-key-here"

# Koala.sh
KOALA_API_KEY="681f949a-bb1c-4171-b4a0-95d278632d12"

# WordPress
WORDPRESS_DEFAULT_USERNAME="admin"
WORDPRESS_DEFAULT_PASSWORD="admin123"

# Redis (for queue system)
REDIS_URL="redis://localhost:6379"

# Upload
UPLOAD_MAX_SIZE="10485760"
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/avi,application/pdf"

# WordPress Integration
WP_DEFAULT_AUTH_TYPE="basic"

# Security
JWT_SECRET="cms-jwt-secret-2024"
ENCRYPTION_KEY="cms-encryption-key-32-chars-long"

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE="60"
RATE_LIMIT_BURST="10"

# Logging
LOG_LEVEL="info"
LOG_FILE="logs/cms.log"

# Webhooks
WEBHOOK_SECRET="cms-webhook-secret-2024"

# WhatsApp (para notificações)
WHATSAPP_API_URL="https://api.whatsapp.com/send"
WHATSAPP_TOKEN="your-whatsapp-token"

# n8n
N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/cms"
N8N_API_KEY="your-n8n-api-key"

# Zapier
ZAPIER_WEBHOOK_URL="https://hooks.zapier.com/hooks/catch/your-zapier-hook"
ZAPIER_API_KEY="your-zapier-api-key"
EOF

echo "✅ Arquivo .env.local criado com sucesso!"
echo "📝 Você pode editar as variáveis conforme necessário"


