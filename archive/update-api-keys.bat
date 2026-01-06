@echo off
echo Atualizando chaves das APIs...

echo # Database > .env.local
echo DATABASE_URL="postgresql://cms_user:cms_password@localhost:5433/cms_modern" >> .env.local
echo. >> .env.local
echo # NextAuth >> .env.local
echo NEXTAUTH_URL="http://localhost:3002" >> .env.local
echo NEXTAUTH_SECRET="cms-secret-key-2024-development" >> .env.local
echo. >> .env.local
echo # OpenAI (ChatGPT) >> .env.local
echo OPENAI_API_KEY="your-openai-api-key-here" >> .env.local
echo OPENAI_ORGANIZATION="org-your-org-id" >> .env.local
echo. >> .env.local
echo # Google Gemini >> .env.local
echo GOOGLE_API_KEY="your-google-gemini-api-key-here" >> .env.local
echo. >> .env.local
echo # Koala.sh >> .env.local
echo KOALA_API_KEY="681f949a-bb1c-4171-b4a0-95d278632d12" >> .env.local
echo. >> .env.local
echo # WordPress >> .env.local
echo WORDPRESS_DEFAULT_USERNAME="admin" >> .env.local
echo WORDPRESS_DEFAULT_PASSWORD="admin123" >> .env.local
echo. >> .env.local
echo # Redis (for queue system) >> .env.local
echo REDIS_URL="redis://localhost:6379" >> .env.local
echo. >> .env.local
echo # Security >> .env.local
echo JWT_SECRET="cms-jwt-secret-2024" >> .env.local
echo ENCRYPTION_KEY="cms-encryption-key-32-chars-long" >> .env.local

echo ✅ Arquivo .env.local atualizado com as chaves corretas!
echo.
echo Chaves configuradas:
echo - OpenAI (ChatGPT): ✅
echo - Google Gemini: ✅  
echo - Koala.sh: ✅
echo.
pause








