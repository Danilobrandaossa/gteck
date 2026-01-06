@echo off
echo 🔧 Configurando variáveis de ambiente para o CMS...

REM Criar arquivo .env.local
(
echo # Database
echo DATABASE_URL="postgresql://cms_user:cms_password@localhost:5433/cms_modern"
echo.
echo # NextAuth
echo NEXTAUTH_URL="http://localhost:3002"
echo NEXTAUTH_SECRET="cms-secret-key-2024-development"
echo.
echo # OpenAI
echo OPENAI_API_KEY="your-openai-api-key-here"
echo.
echo # Google Gemini
echo GOOGLE_API_KEY="your-google-gemini-api-key-here"
echo GOOGLE_AI_STUDIO_API_KEY="your-google-ai-studio-api-key-here"
echo.
echo # Koala.sh
echo KOALA_API_KEY="681f949a-bb1c-4171-b4a0-95d278632d12"
echo.
echo # WordPress
echo WORDPRESS_DEFAULT_USERNAME="admin"
echo WORDPRESS_DEFAULT_PASSWORD="admin123"
echo.
echo # Redis (for queue system)
echo REDIS_URL="redis://localhost:6379"
echo.
echo # Upload
echo UPLOAD_MAX_SIZE="10485760"
echo UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/avi,application/pdf"
echo.
echo # WordPress Integration
echo WP_DEFAULT_AUTH_TYPE="basic"
echo.
echo # Security
echo JWT_SECRET="cms-jwt-secret-2024"
echo ENCRYPTION_KEY="cms-encryption-key-32-chars-long"
echo.
echo # Rate Limiting
echo RATE_LIMIT_REQUESTS_PER_MINUTE="60"
echo RATE_LIMIT_BURST="10"
echo.
echo # Logging
echo LOG_LEVEL="info"
echo LOG_FILE="logs/cms.log"
echo.
echo # Webhooks
echo WEBHOOK_SECRET="cms-webhook-secret-2024"
echo.
echo # WhatsApp (para notificações)
echo WHATSAPP_API_URL="https://api.whatsapp.com/send"
echo WHATSAPP_TOKEN="your-whatsapp-token"
echo.
echo # n8n
echo N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/cms"
echo N8N_API_KEY="your-n8n-api-key"
echo.
echo # Zapier
echo ZAPIER_WEBHOOK_URL="https://hooks.zapier.com/hooks/catch/your-zapier-hook"
echo ZAPIER_API_KEY="your-zapier-api-key"
) > .env.local

echo ✅ Arquivo .env.local criado com sucesso!
echo 📝 Você pode editar as variáveis conforme necessário




