#!/usr/bin/env node

/**
 * Script para organizar arquivos legados
 * Move arquivos para pastas apropriadas
 */

const fs = require('fs');
const path = require('path');

const moves = [];

// Relatórios MD para docs/relatorios/
const reportFiles = [
  'RELATORIO-AUDITORIA-V4.md',
  'RELATORIO-CENTRALIZACAO-SINCRONIZACAO.md',
  'RELATORIO-CONFIGURACAO-APIS.md',
  'RELATORIO-CONSOLIDADO-FINAL.md',
  'RELATORIO-CORRECAO-SINCRONIZACAO.md',
  'RELATORIO-CORRECOES-REVISAO.md',
  'RELATORIO-DADOS-SINCRONIZACAO-MONETIZACAO.md',
  'RELATORIO-DOCKER-STATUS.md',
  'RELATORIO-FINAL-IMPLEMENTACOES.md',
  'RELATORIO-IMPLEMENTACAO-COMPLETA.md',
  'RELATORIO-INTEGRACAO-APIS-SETTINGS.md',
  'RELATORIO-LABORATORIO-IA.md',
  'RELATORIO-MELHORIAS-SINCRONIZACAO.md',
  'RELATORIO-MONITORAMENTO-DOCKER.md',
  'RELATORIO-PRESSEL-AUTOMATION.md',
  'RELATORIO-QA-COMPLETO.md',
  'RELATORIO-SINCRONIZACAO-INTELIGENTE.md',
  'RELATORIO-SOLUCAO-STATUS-400.md',
  'RELATORIO-STATUS-APIS-IA.md',
  'RELATORIO-VERIFICACAO-FINAL.md'
];

// Arquivos para docs/
const docFiles = [
  'ATIVAR-DEBUG-LOG.md',
  'CHECKLIST-COMPLETO-CMS-WORDPRESS.md',
  'COMO-CRIAR-JSON-V4.md',
  'CORRECAO-TEMPLATE-V4.md',
  'GUIA-CADASTRO-IDEAL.md',
  'GUIA-CONFIGURACAO-WORDPRESS-SIMPLIFICADO.md',
  'GUIA-CONFIGURACAO-WORDPRESS.md',
  'GUIA-CONFIGURACAO.md',
  'MELHORIAS-ESTRUTURA-CMS.md',
  'RESUMO-SOLUCAO-V4.md',
  'SOLUCAO-PROBLEMA-V4.md',
  'TESTE-UPLOAD-JSON.md'
];

// Arquivos para archive/
const archiveFiles = [
  'wp-config-fix.txt',
  'update-api-keys.bat'
];

// Arquivos de teste para tmp/ ou deletar
const testFiles = [
  'test-ai-openai.json',
  'test-openai-integration.json',
  'test-retry-system.json',
  'test-sync-categories.json',
  'test-sync-media.json',
  'test-sync-pages.json',
  'test-sync-posts.json',
  'test-sync-tags.json',
  'test-sync-users.json'
];

function moveFile(source, dest) {
  try {
    if (fs.existsSync(source)) {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // Se destino existe, adicionar timestamp
      if (fs.existsSync(dest)) {
        const ext = path.extname(dest);
        const name = path.basename(dest, ext);
        dest = path.join(path.dirname(dest), `${name}-${Date.now()}${ext}`);
      }
      
      fs.renameSync(source, dest);
      moves.push({ from: source, to: dest, status: 'moved' });
      return true;
    }
    return false;
  } catch (error) {
    moves.push({ from: source, to: dest, status: 'error', error: error.message });
    return false;
  }
}

console.log('📁 Organizando arquivos legados...\n');

// Mover relatórios
console.log('📊 Movendo relatórios...');
reportFiles.forEach(file => {
  moveFile(file, `docs/relatorios/${file}`);
});

// Mover documentos
console.log('📚 Movendo documentos...');
docFiles.forEach(file => {
  moveFile(file, `docs/${file}`);
});

// Mover arquivos para archive
console.log('📦 Movendo arquivos para archive...');
archiveFiles.forEach(file => {
  moveFile(file, `archive/${file}`);
});

// Mover arquivos de teste (manter em tmp mas documentar)
console.log('🧪 Arquivos de teste encontrados (manter em tmp ou deletar):');
testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   - ${file}`);
  }
});

console.log('\n✅ Organização concluída!');
console.log(`📊 Total de arquivos movidos: ${moves.filter(m => m.status === 'moved').length}`);
console.log(`❌ Erros: ${moves.filter(m => m.status === 'error').length}`);

if (moves.some(m => m.status === 'error')) {
  console.log('\n⚠️  Erros:');
  moves.filter(m => m.status === 'error').forEach(m => {
    console.log(`   ${m.from}: ${m.error}`);
  });
}

// Salvar log
fs.writeFileSync('organization-log.json', JSON.stringify(moves, null, 2));
console.log('\n📝 Log salvo em: organization-log.json');

