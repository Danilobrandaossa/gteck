@echo off
echo 🛑 Parando CMS Moderno...

REM Parar containers
docker-compose -f docker-compose.dev.yml down

echo ✅ Serviços parados!
echo.
echo 💡 Para remover dados também:
echo    docker-compose -f docker-compose.dev.yml down -v
pause

