#!/bin/bash
# Wrapper shell script para auto-fix-build.ts

set -e

echo "🔧 Auto-Fix Build Script"
echo "========================"
echo ""

# Usar npx tsx (não requer instalação global)
# Se tsx não estiver instalado localmente, npx vai baixar automaticamente

# Executar script
if [ "$1" == "--apply" ]; then
    echo "🚀 Modo: APPLY (aplicando correções)"
    npx tsx scripts/auto-fix-build.ts --apply
elif [ "$1" == "--dry-run" ]; then
    echo "👀 Modo: DRY-RUN (simulando correções)"
    npx tsx scripts/auto-fix-build.ts --dry-run
else
    echo "Uso: $0 [--dry-run|--apply] [--max-fixes=N]"
    echo ""
    echo "Opções:"
    echo "  --dry-run      Simula correções sem aplicar"
    echo "  --apply        Aplica correções automaticamente"
    echo "  --max-fixes=N  Limite de correções (padrão: 20)"
    echo ""
    echo "Exemplos:"
    echo "  $0 --dry-run"
    echo "  $0 --apply"
    echo "  $0 --apply --max-fixes=10"
    exit 1
fi

