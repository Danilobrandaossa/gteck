#!/usr/bin/env tsx
/**
 * 🔧 AUTO-FIX BUILD SCRIPT
 * 
 * Corrige automaticamente erros comuns que quebram `next build`
 * até o build passar ou atingir o limite de tentativas.
 */

import { execSync, spawn } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

interface BuildError {
  file: string
  line: number
  col: number
  message: string
  type: 'unused' | 'possibly-undefined' | 'prisma' | 'other'
}

interface FixResult {
  success: boolean
  message: string
  diff?: string
}

class BuildAutoFixer {
  private dryRun: boolean
  private maxFixes: number
  private fixCount: number = 0
  private fixesApplied: string[] = []

  constructor(dryRun: boolean = false, maxFixes: number = 20) {
    this.dryRun = dryRun
    this.maxFixes = maxFixes
  }

  /**
   * Executa o build e captura o primeiro erro
   */
  private runBuild(): { success: boolean; error?: BuildError; output: string } {
    try {
      const output = execSync('npm run build', {
        encoding: 'utf-8',
        stdio: 'pipe',
        cwd: process.cwd()
      })
      
      // Verificar se realmente passou (pode ter "Failed to compile" no output mesmo com exit 0)
      if (output.includes('Failed to compile') || output.includes('Type error')) {
        const parsedError = this.parseBuildError(output)
        return { success: false, error: parsedError, output }
      }
      
      return { success: true, output }
    } catch (error: any) {
      // Capturar tanto stdout quanto stderr
      const stdout = error.stdout?.toString() || ''
      const stderr = error.stderr?.toString() || ''
      const output = stdout + '\n' + stderr
      
      // Se não houver output útil, usar a mensagem do erro
      const fullOutput = output.trim() || error.message || 'Erro desconhecido no build'
      
      const parsedError = this.parseBuildError(fullOutput)
      return { success: false, error: parsedError, output: fullOutput }
    }
  }

  /**
   * Parseia o primeiro erro do output do build
   */
  private parseBuildError(output: string): BuildError | undefined {
    // Padrão 1: ./path/file.ts:LINE:COL\nType error: ...
    let errorMatch = output.match(/\.\/([^\s]+):(\d+):(\d+)\s*\n\s*Type error: (.+?)(?:\n|$)/s)
    
    if (!errorMatch) {
      // Padrão 2: ./path/file.ts:LINE:COL Type error: ... (mesma linha)
      errorMatch = output.match(/\.\/([^\s]+):(\d+):(\d+)\s+Type error: (.+?)(?:\n|$)/)
    }
    
    if (!errorMatch) {
      // Padrão 3: ./path/file.ts:LINE:COL\n (linha seguinte tem o erro)
      errorMatch = output.match(/\.\/([^\s]+):(\d+):(\d+)\s*\n\s*([^\n]+)/)
    }
    
    if (!errorMatch) {
      // Padrão 4: Failed to compile.\n\n./path/file.ts:LINE:COL
      errorMatch = output.match(/Failed to compile[.\s]*\.\/([^\s]+):(\d+):(\d+)\s*\n\s*(.+?)(?:\n|$)/s)
    }
    
    if (!errorMatch) {
      // Padrão 5: Qualquer linha com ./path/file.ts:LINE:COL seguida de mensagem
      errorMatch = output.match(/\.\/([^\s:]+):(\d+):(\d+)[\s:]+(.+?)(?:\n|$)/)
    }

    if (errorMatch) {
      return {
        file: errorMatch[1],
        line: parseInt(errorMatch[2]),
        col: parseInt(errorMatch[3]),
        message: errorMatch[4].trim(),
        type: this.classifyError(errorMatch[4])
      }
    }

    return undefined
  }

  /**
   * Classifica o tipo de erro
   */
  private classifyError(message: string): BuildError['type'] {
    if (message.includes('is declared but its value is never read') || 
        message.includes('is never read')) {
      return 'unused'
    }
    if (message.includes('possibly undefined') || 
        message.includes('possibly null') ||
        message.includes('Object is possibly')) {
      return 'possibly-undefined'
    }
    if (message.includes('does not exist on PrismaClient') ||
        message.includes('Property') && message.includes('Prisma')) {
      return 'prisma'
    }
    return 'other'
  }

  /**
   * Aplica correção baseada no tipo de erro
   */
  private applyFix(error: BuildError): FixResult {
    const filePath = join(process.cwd(), error.file)
    
    if (!existsSync(filePath)) {
      return { success: false, message: `Arquivo não encontrado: ${error.file}` }
    }

    try {
      const content = readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')

      switch (error.type) {
        case 'unused':
          return this.fixUnusedVariable(lines, error, filePath)
        case 'possibly-undefined':
          return this.fixPossiblyUndefined(lines, error, filePath)
        case 'prisma':
          return this.fixPrismaError(error)
        default:
          return { success: false, message: `Tipo de erro não suportado para auto-correção: ${error.type}` }
      }
    } catch (err: any) {
      return { success: false, message: `Erro ao ler arquivo: ${err.message}` }
    }
  }

  /**
   * Corrige variável não utilizada
   */
  private fixUnusedVariable(lines: string[], error: BuildError, filePath: string): FixResult {
    const targetLine = lines[error.line - 1]
    if (!targetLine) {
      return { success: false, message: `Linha ${error.line} não encontrada` }
    }

    // Extrair nome da variável do erro
    const varMatch = error.message.match(/'([^']+)' is declared but its value is never read/)
    if (!varMatch) {
      return { success: false, message: 'Não foi possível extrair nome da variável' }
    }

    const varName = varMatch[1]
    let newContent = lines.join('\n')
    let diff = ''

    // Caso 1: Desestruturação de objeto
    const destructureMatch = targetLine.match(/(const|let|var)\s*\{([^}]+)\}\s*=/)
    if (destructureMatch) {
      const vars = destructureMatch[2].split(',').map(v => v.trim())
      const filteredVars = vars.filter(v => {
        const cleanVar = v.split(':')[0].trim()
        return cleanVar !== varName
      })
      
      if (filteredVars.length < vars.length) {
        const newLine = targetLine.replace(
          /\{([^}]+)\}/,
          `{${filteredVars.join(', ')}}`
        )
        newContent = newContent.replace(targetLine, newLine)
        diff = `- ${targetLine}\n+ ${newLine}`
      }
    } else {
      // Caso 2: Variável simples - prefixar com _
      const varRegex = new RegExp(`\\b${varName}\\b`, 'g')
      if (targetLine.includes(`const ${varName}`) || targetLine.includes(`let ${varName}`)) {
        const newLine = targetLine.replace(
          new RegExp(`(const|let|var)\\s+${varName}\\b`),
          `$1 _${varName}`
        )
        newContent = newContent.replace(targetLine, newLine)
        diff = `- ${targetLine}\n+ ${newLine}`
      } else {
        // Tentar prefixar todas as ocorrências
        const newLine = targetLine.replace(varRegex, `_${varName}`)
        if (newLine !== targetLine) {
          newContent = newContent.replace(targetLine, newLine)
          diff = `- ${targetLine}\n+ ${newLine}`
        }
      }
    }

    if (diff) {
      if (!this.dryRun) {
        writeFileSync(filePath, newContent, 'utf-8')
      }
      return {
        success: true,
        message: `Variável '${varName}' prefixada com _ ou removida`,
        diff
      }
    }

    return { success: false, message: 'Não foi possível aplicar correção automática' }
  }

  /**
   * Corrige "possibly undefined"
   */
  private fixPossiblyUndefined(lines: string[], error: BuildError, filePath: string): FixResult {
    const targetLine = lines[error.line - 1]
    if (!targetLine) {
      return { success: false, message: `Linha ${error.line} não encontrada` }
    }

    // Extrair expressão problemática (ex: obj.data.id)
    const exprMatch = error.message.match(/'([^']+)' is possibly 'undefined'/)
    if (!exprMatch) {
      // Tentar padrão alternativo
      const altMatch = targetLine.match(/(\w+(?:\.\w+)+)/)
      if (!altMatch) {
        return { success: false, message: 'Não foi possível identificar expressão problemática' }
      }
    }

    // Procurar padrão obj.data.id ou obj.data?.id
    const propertyAccessMatch = targetLine.match(/(\w+(?:\.\w+)+)/)
    if (!propertyAccessMatch) {
      return { success: false, message: 'Padrão de acesso a propriedade não encontrado' }
    }

    const fullPath = propertyAccessMatch[1]
    const parts = fullPath.split('.')
    const rootObj = parts[0]
    const lastProp = parts[parts.length - 1]

    // Gerar guard clause
    const guardClause = `if (!${rootObj}${parts.slice(1, -1).map(p => `?.${p}`).join('')}?.${lastProp}) {
      return NextResponse.json(
        { error: '${fullPath} é obrigatório' },
        { status: 502 }
      )
    }`

    // Inserir guard clause antes da linha problemática
    const insertIndex = error.line - 1
    const newLines = [...lines]
    newLines.splice(insertIndex, 0, guardClause)

    // Usar optional chaining na linha original
    const safeLine = targetLine.replace(
      new RegExp(`\\b${fullPath.replace(/\./g, '\\.')}\\b`),
      `${fullPath.replace(/\./g, '?.')}`
    )
    newLines[insertIndex + 1] = safeLine

    const newContent = newLines.join('\n')
    const diff = `+ ${guardClause}\n- ${targetLine}\n+ ${safeLine}`

    if (!this.dryRun) {
      writeFileSync(filePath, newContent, 'utf-8')
    }

    return {
      success: true,
      message: `Adicionada guard clause para ${fullPath}`,
      diff
    }
  }

  /**
   * Corrige erro do Prisma
   */
  private fixPrismaError(error: BuildError): FixResult {
    console.log('🔍 Erro do Prisma detectado. Executando prisma generate...')
    
    if (!this.dryRun) {
      try {
        execSync('npx prisma generate', {
          encoding: 'utf-8',
          stdio: 'inherit',
          cwd: process.cwd()
        })
        return {
          success: true,
          message: 'Prisma Client regenerado com sucesso',
          diff: 'npx prisma generate executado'
        }
      } catch (err: any) {
        return {
          success: false,
          message: `Erro ao executar prisma generate: ${err.message}`
        }
      }
    }

    return {
      success: true,
      message: '[DRY-RUN] Prisma generate seria executado',
      diff: 'npx prisma generate'
    }
  }

  /**
   * Verifica se BUILD_ID existe
   */
  private checkBuildId(): boolean {
    const buildIdPath = join(process.cwd(), '.next', 'BUILD_ID')
    return existsSync(buildIdPath)
  }

  /**
   * Loop principal de correção
   */
  async run(): Promise<void> {
    console.log('🚀 Iniciando auto-fix de build...\n')
    console.log(`Modo: ${this.dryRun ? 'DRY-RUN (não aplica mudanças)' : 'APPLY (aplica mudanças)'}`)
    console.log(`Limite máximo de correções: ${this.maxFixes}\n`)

    // Primeiro, tentar gerar Prisma Client
    console.log('📦 Verificando Prisma Client...')
    try {
      execSync('npx prisma generate', { stdio: 'pipe', encoding: 'utf-8' })
      console.log('✅ Prisma Client OK\n')
    } catch {
      console.log('⚠️  Prisma generate falhou (continuando...)\n')
    }

    while (this.fixCount < this.maxFixes) {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`Tentativa ${this.fixCount + 1}/${this.maxFixes}`)
      console.log('='.repeat(60))

      const buildResult = this.runBuild()

      if (buildResult.success) {
        console.log('\n✅ BUILD PASSOU!')
        
        // Verificar BUILD_ID
        if (this.checkBuildId()) {
          console.log('✅ .next/BUILD_ID existe')
          console.log('\n📋 CHECKLIST FINAL:')
          console.log('  ✅ npm run build passou')
          console.log('  ✅ .next/BUILD_ID existe')
          console.log('\n🚀 Pronto para produção!')
          console.log('\nComandos PM2 (execute manualmente):')
          console.log('  pm2 delete crm-gteck')
          console.log('  pm2 start npm --name "crm-gteck" -- start')
          console.log('  pm2 save')
        } else {
          console.log('❌ .next/BUILD_ID NÃO existe - build pode ter falhado silenciosamente')
        }

        if (this.fixesApplied.length > 0) {
          console.log('\n📝 Correções aplicadas:')
          this.fixesApplied.forEach((fix, i) => {
            console.log(`  ${i + 1}. ${fix}`)
          })
        }

        return
      }

      if (!buildResult.error) {
        console.log('❌ Erro não pôde ser parseado automaticamente')
        console.log('\n📄 Output completo do build:')
        console.log('─'.repeat(60))
        console.log(buildResult.output)
        console.log('─'.repeat(60))
        console.log('\n💡 Dica: Procure por linhas com padrão:')
        console.log('   ./caminho/arquivo.ts:linha:coluna')
        console.log('   Type error: ...')
        console.log('\n⚠️  Correção manual necessária')
        console.log('\n📝 Para ajudar na correção, envie o output acima')
        return
      }

      console.log(`\n❌ Erro encontrado:`)
      console.log(`   Arquivo: ${buildResult.error.file}`)
      console.log(`   Linha: ${buildResult.error.line}:${buildResult.error.col}`)
      console.log(`   Tipo: ${buildResult.error.type}`)
      console.log(`   Mensagem: ${buildResult.error.message}`)

      const fixResult = this.applyFix(buildResult.error)

      if (fixResult.success) {
        this.fixCount++
        this.fixesApplied.push(`${buildResult.error.file}:${buildResult.error.line} - ${fixResult.message}`)
        
        console.log(`\n✅ Correção aplicada: ${fixResult.message}`)
        if (fixResult.diff) {
          console.log('\n📝 Diff:')
          console.log(fixResult.diff)
        }

        if (this.dryRun) {
          console.log('\n⚠️  MODO DRY-RUN: Nenhuma mudança foi aplicada')
          console.log('Execute com --apply para aplicar as correções')
          return
        }
      } else {
        console.log(`\n❌ Não foi possível corrigir automaticamente: ${fixResult.message}`)
        console.log('\n📄 Output completo do build:')
        console.log(buildResult.output)
        console.log('\n⚠️  Correção manual necessária')
        return
      }
    }

    console.log(`\n⚠️  Limite de ${this.maxFixes} correções atingido`)
    console.log('Alguns erros podem precisar de correção manual')
  }
}

// CLI
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const apply = args.includes('--apply')
const maxFixesArg = args.find(arg => arg.startsWith('--max-fixes='))
const maxFixes = maxFixesArg ? parseInt(maxFixesArg.split('=')[1]) : 20

if (!dryRun && !apply) {
  console.log('⚠️  Modo não especificado!')
  console.log('Use --dry-run para simular ou --apply para aplicar correções')
  process.exit(1)
}

const fixer = new BuildAutoFixer(dryRun, maxFixes)
fixer.run().catch(err => {
  console.error('❌ Erro fatal:', err)
  process.exit(1)
})

