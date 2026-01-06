#!/bin/bash

echo "🛑 Parando CMS Moderno..."

# Parar containers
docker-compose -f docker-compose.dev.yml down

echo "✅ Serviços parados!"
echo ""
echo "💡 Para remover dados também:"
echo "   docker-compose -f docker-compose.dev.yml down -v"

