const fs = require('fs');
const path = require('path');

const logPath = './typecheck_log_3.txt';
if (!fs.existsSync(logPath)) {
    console.error('Log file not found:', logPath);
    process.exit(1);
}

const logContent = fs.readFileSync(logPath, 'utf-8');
const lines = logContent.split('\n');

const mutations = {}; // filepath -> []

function addMutation(file, line, search, replace) {
    if (!mutations[file]) mutations[file] = [];
    mutations[file].push({ line, search, replace });
}

lines.forEach(logLine => {
    // 1. Imports quebrados (TS2724)
    // Error: '"lucide-react"' has no exported member named '_AlertCircle'. Did you mean 'AlertCircle'?
    let match = logLine.match(/(.+)\((\d+),\d+\): error TS2724: '.+' has no exported member named '(_\w+)'. Did you mean '(\w+)'?/);
    if (match) {
        const [_, file, lineStr, wrongName, rightName] = match;
        // Na linha do import, remover `_AlertCircle`.
        // Mas se tiver vírgulas? `_AlertCircle,` ou `, _AlertCircle`.
        // Vamos tentar remover a string `_AlertCircle` e sanear vírgulas depois? 
        // Ou melhor: se foi um erro causado pelo script anterior em import, era pra ser removido.
        addMutation(file, parseInt(lineStr), wrongName, '');
        return;
    }

    // 2. Destructuring quebrado (TS2339)
    // Error: Property '_isLoading' does not exist on type '...'.
    // Geralmente acompanhado de TS6133 '_isLoading' unused.
    match = logLine.match(/(.+)\((\d+),\d+\): error TS2339: Property '(_\w+)' does not exist on type/);
    if (match) {
        const [_, file, lineStr, varName] = match;
        // Recuperar o nome original removendo o underscore
        const originalName = varName.substring(1);
        // Transformar `_isLoading` em `isLoading: _isLoading`
        // Isso conserta o destructuring `const { _isLoading } = ...` -> `const { isLoading: _isLoading } = ...`
        // MAS CUIDADO: Se for acesso direto `obj._isLoading`, vai virar `obj.isLoading: _isLoading` (invalido).
        // Vamos checar se a linha tem `{` e `}` no processamento.
        addMutation(file, parseInt(lineStr), varName, `${originalName}: ${varName}`);
        return;
    }

    // 3. Prisma Casing (TS2551)
    // Error: Property 'aiContent' does not exist... Did you mean 'aIContent'?
    match = logLine.match(/(.+)\((\d+),\d+\): error TS2551: Property '(\w+)' does not exist.+Did you mean '(\w+)'?/);
    if (match) {
        const [_, file, lineStr, wrongName, rightName] = match;
        // Substituir wrongName por rightName
        addMutation(file, parseInt(lineStr), wrongName, rightName);
        return;
    }

    // 4. Class property access (TS2551)
    // Error: Property 'primaryModel' does not exist... Did you mean '_primaryModel'?
    // (Mesmo regex acima pega isso)

    // 5. Cannot find name (TS2552)
    // Error: Cannot find name 'sourceFields'. Did you mean '_sourceFields'?
    // Isso acontece quando renomeei a definição `_sourceFields` mas o uso continua `sourceFields`.
    match = logLine.match(/(.+)\((\d+),\d+\): error TS2552: Cannot find name '(\w+)'. Did you mean '(\w+)'?/);
    if (match) {
        const [_, file, lineStr, wrongName, rightName] = match;
        addMutation(file, parseInt(lineStr), wrongName, rightName);
        return;
    }
});

Object.keys(mutations).forEach(filePath => {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) return;

    console.log(`Fixing ${filePath}...`);
    let content = fs.readFileSync(absolutePath, 'utf-8').split('\n');
    let modified = false;

    // Sort mutations descending line
    const fileOps = mutations[filePath].sort((a, b) => b.line - a.line);

    // Deduplicate operators per line
    const processedLines = new Set();

    fileOps.forEach(op => {
        const idx = op.line - 1;
        if (idx < 0 || idx >= content.length) return;

        let line = content[idx];

        // Evitar aplicar múltiplas correções conflitantes na mesma linha sem reavaliar
        // Mas podemos aplicar varias replaces.

        // Caso 1: Remover import (substituir por vazio)
        if (op.replace === '') {
            // Remover `_Name` e possiveis virgulas
            // Regex: \b_Name\b
            // E limpar virgulas orfãs: `, ,` ou `{ ,` ou `, }`
            let newLine = line.replace(new RegExp(`\\b${op.search}\\b`, 'g'), '');
            // Limpeza basica de virgulas
            newLine = newLine.replace(/,\s*,/g, ',').replace(/{\s*,/g, '{').replace(/,\s*}/g, ' }');
            // Se import ficar vazio `import { } from ...` ou `import {   } from ...`
            if (newLine.match(/import\s*{\s*}\s*from/)) {
                newLine = '// ' + newLine.trim(); // Comenta a linha inteira
            }
            content[idx] = newLine;
            modified = true;
        }

        // Caso 2: Destructuring fix `_Name` -> `Name: _Name`
        else if (op.replace.includes(':')) {
            // Só aplicar se parecer um destructuring ou object literal
            if (line.includes('{') || line.includes('}')) {
                // Substituir `_Name` por `Name: _Name`
                // Cuidado para não substituir `import { _Name }` aqui (mas o erro TS2339 não dá em import)
                const regex = new RegExp(`(?<!:)\\b${op.search}\\b`, 'g'); // Negative lookbehind para não duplicar se já estiver arrumado
                content[idx] = line.replace(regex, op.replace);
                modified = true;
            }
        }

        // Caso 3: Simple rename
        else {
            const regex = new RegExp(`\\b${op.search}\\b`, 'g');
            content[idx] = line.replace(regex, op.replace);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(absolutePath, content.join('\n'));
    }
});
