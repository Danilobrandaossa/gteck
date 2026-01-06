const fs = require('fs')
const path = require('path')

// Classes CSS disponíveis no globals.css
const CSS_CLASSES = [
  'cms-layout', 'cms-sidebar', 'cms-main', 'cms-header', 'cms-content',
  'cms-card', 'cms-card-header', 'cms-card-content', 'cms-card-title',
  'cms-btn', 'cms-btn-primary', 'cms-btn-secondary', 'cms-btn-icon',
  'cms-grid', 'cms-grid-cols-1', 'cms-grid-cols-2', 'cms-grid-cols-3', 'cms-grid-cols-4',
  'cms-stat-card', 'cms-badge', 'cms-badge-success', 'cms-badge-warning', 'cms-badge-info',
  'cms-nav', 'cms-nav-item', 'cms-search', 'cms-header-actions', 'cms-header-user',
  'cms-page-item', 'cms-quick-actions', 'cms-quick-action', 'cms-media-list',
  'cms-upload-area', 'cms-system-status', 'cms-status-info', 'cms-status-dot'
]

// Padrões problemáticos
const PROBLEMAS = {
  inlineStyles: /style\s*=\s*\{/g,
  styleObject: /style\s*:\s*\{/g,
  hardcodedColors: /#[0-9a-fA-F]{3,6}/g,
  hardcodedSizes: /(px|rem|em)\s*['"]/g,
  missingLayout: /DashboardLayout|ProtectedRoute/g,
  missingCard: /cms-card/g,
  inlineBackground: /background(?:-color)?\s*:\s*['"#]/g,
  inlineColor: /color\s*:\s*['"#]/g,
  inlinePadding: /padding\s*:\s*['"]/g,
  inlineMargin: /margin\s*:\s*['"]/g
}

// Função para analisar um arquivo
function analisarArquivo(caminhoArquivo) {
  const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8')
  const problemas = []
  const estatisticas = {
    totalLinhas: conteudo.split('\n').length,
    usaClassesCSS: 0,
    usaInlineStyles: 0,
    usaDashboardLayout: false,
    usaProtectedRoute: false,
    coresHardcoded: 0,
    tamanhosHardcoded: 0
  }

  // Verificar uso de classes CSS
  CSS_CLASSES.forEach(classe => {
    const regex = new RegExp(classe, 'g')
    const matches = conteudo.match(regex)
    if (matches) {
      estatisticas.usaClassesCSS += matches.length
    }
  })

  // Verificar estilos inline
  if (PROBLEMAS.inlineStyles.test(conteudo)) {
    estatisticas.usaInlineStyles++
    problemas.push({
      tipo: 'estilos_inline',
      severidade: 'alta',
      mensagem: 'Usa estilos inline (style={...}) - deveria usar classes CSS'
    })
  }

  // Verificar cores hardcoded
  const cores = conteudo.match(PROBLEMAS.hardcodedColors)
  if (cores) {
    estatisticas.coresHardcoded = cores.length
    problemas.push({
      tipo: 'cores_hardcoded',
      severidade: 'media',
      mensagem: `Encontradas ${cores.length} cores hardcoded (deveria usar variáveis CSS)`
    })
  }

  // Verificar DashboardLayout
  if (conteudo.includes('DashboardLayout')) {
    estatisticas.usaDashboardLayout = true
  } else {
    problemas.push({
      tipo: 'sem_layout',
      severidade: 'alta',
      mensagem: 'Não usa DashboardLayout - estrutura inconsistente'
    })
  }

  // Verificar ProtectedRoute
  if (conteudo.includes('ProtectedRoute')) {
    estatisticas.usaProtectedRoute = true
  }

  // Verificar uso de cards
  if (!conteudo.includes('cms-card')) {
    problemas.push({
      tipo: 'sem_cards',
      severidade: 'baixa',
      mensagem: 'Não usa classes cms-card - pode estar usando estrutura customizada'
    })
  }

  return {
    caminho: caminhoArquivo,
    problemas,
    estatisticas
  }
}

// Função para encontrar todas as páginas
function encontrarPaginas(diretorio = 'app') {
  const paginas = []
  
  function percorrerDir(dir) {
    const itens = fs.readdirSync(dir)
    
    for (const item of itens) {
      const caminhoCompleto = path.join(dir, item)
      const stat = fs.statSync(caminhoCompleto)
      
      if (stat.isDirectory()) {
        percorrerDir(caminhoCompleto)
      } else if (item === 'page.tsx') {
        paginas.push(caminhoCompleto)
      }
    }
  }
  
  percorrerDir(diretorio)
  return paginas
}

// Executar análise
console.log('🔍 Analisando páginas do CMS...\n')

const paginas = encontrarPaginas()
const resultados = paginas.map(analisarArquivo)

// Agrupar por tipo de problema
const problemasPorTipo = {}
resultados.forEach(resultado => {
  resultado.problemas.forEach(problema => {
    if (!problemasPorTipo[problema.tipo]) {
      problemasPorTipo[problema.tipo] = []
    }
    problemasPorTipo[problema.tipo].push({
      pagina: resultado.caminho,
      mensagem: problema.mensagem,
      severidade: problema.severidade
    })
  })
})

// Gerar relatório
console.log('='.repeat(80))
console.log('📊 RELATÓRIO DE ANÁLISE DE CSS - CMS')
console.log('='.repeat(80))
console.log(`\n📄 Total de páginas analisadas: ${paginas.length}\n`)

// Estatísticas gerais
const totalProblemas = resultados.reduce((acc, r) => acc + r.problemas.length, 0)
const paginasComProblemas = resultados.filter(r => r.problemas.length > 0).length
const paginasSemLayout = resultados.filter(r => !r.estatisticas.usaDashboardLayout).length

console.log('📈 ESTATÍSTICAS GERAIS:')
console.log(`   • Total de problemas encontrados: ${totalProblemas}`)
console.log(`   • Páginas com problemas: ${paginasComProblemas}`)
console.log(`   • Páginas sem DashboardLayout: ${paginasSemLayout}`)
console.log(`   • Páginas usando classes CSS: ${resultados.filter(r => r.estatisticas.usaClassesCSS > 0).length}`)
console.log(`   • Páginas usando estilos inline: ${resultados.filter(r => r.estatisticas.usaInlineStyles > 0).length}`)

// Problemas por severidade
console.log('\n🚨 PROBLEMAS POR SEVERIDADE:')
Object.keys(problemasPorTipo).forEach(tipo => {
  const problemas = problemasPorTipo[tipo]
  const alta = problemas.filter(p => p.severidade === 'alta').length
  const media = problemas.filter(p => p.severidade === 'media').length
  const baixa = problemas.filter(p => p.severidade === 'baixa').length
  
  console.log(`\n   ${tipo.toUpperCase()}:`)
  console.log(`   • Alta: ${alta}`)
  console.log(`   • Média: ${media}`)
  console.log(`   • Baixa: ${baixa}`)
})

// Detalhes por página
console.log('\n📋 DETALHES POR PÁGINA:\n')
resultados.forEach(resultado => {
  if (resultado.problemas.length > 0) {
    console.log(`\n${'─'.repeat(80)}`)
    console.log(`📄 ${resultado.caminho}`)
    console.log(`   Estatísticas:`)
    console.log(`   • Linhas de código: ${resultado.estatisticas.totalLinhas}`)
    console.log(`   • Classes CSS usadas: ${resultado.estatisticas.usaClassesCSS}`)
    console.log(`   • DashboardLayout: ${resultado.estatisticas.usaDashboardLayout ? '✅' : '❌'}`)
    console.log(`   • ProtectedRoute: ${resultado.estatisticas.usaProtectedRoute ? '✅' : '❌'}`)
    console.log(`   Problemas encontrados (${resultado.problemas.length}):`)
    resultado.problemas.forEach((problema, index) => {
      const icone = problema.severidade === 'alta' ? '🔴' : problema.severidade === 'media' ? '🟡' : '🟢'
      console.log(`   ${icone} ${index + 1}. ${problema.mensagem}`)
    })
  }
})

// Páginas sem problemas
const paginasSemProblemas = resultados.filter(r => r.problemas.length === 0)
if (paginasSemProblemas.length > 0) {
  console.log(`\n✅ PÁGINAS SEM PROBLEMAS (${paginasSemProblemas.length}):`)
  paginasSemProblemas.forEach(resultado => {
    console.log(`   ✅ ${resultado.caminho}`)
  })
}

// Recomendações
console.log('\n💡 RECOMENDAÇÕES:')
console.log('   1. Substituir estilos inline por classes CSS do globals.css')
console.log('   2. Usar variáveis CSS (--primary, --gray-50, etc.) em vez de cores hardcoded')
console.log('   3. Garantir que todas as páginas usem DashboardLayout')
console.log('   4. Usar classes cms-card, cms-btn, etc. consistentemente')
console.log('   5. Remover estilos inline e mover para globals.css quando necessário')

console.log('\n' + '='.repeat(80))
console.log('✅ Análise concluída!')
console.log('='.repeat(80) + '\n')



