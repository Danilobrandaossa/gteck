const fs = require('fs');
const path = require('path');

const logPath = './typecheck_log_2.txt';
if (!fs.existsSync(logPath)) {
    console.error('Log file not found:', logPath);
    process.exit(1);
}

const logContent = fs.readFileSync(logPath, 'utf-8');
const lines = logContent.split('\n');

const fileMutations = {}; // { filepath: [ { line, type: 'remove'|'prefix', varName? } ] }

// Parse errors
lines.forEach(line => {
    // TS6133: 'X' is declared but its value is never read.
    let match = line.match(/(.+)\((\d+),\d+\): error TS6133: '(.+)' is declared but its value is never read./);
    if (match) {
        const [_, file, lineStr, varName] = match;
        const lineNum = parseInt(lineStr);
        if (!fileMutations[file]) fileMutations[file] = [];
        fileMutations[file].push({ line: lineNum, type: 'prefix', varName });
        return;
    }

    // TS6192: All imports in import declaration are unused.
    match = line.match(/(.+)\((\d+),\d+\): error TS6192: All imports in import declaration are unused./);
    if (match) {
        const [_, file, lineStr] = match;
        const lineNum = parseInt(lineStr);
        if (!fileMutations[file]) fileMutations[file] = [];
        fileMutations[file].push({ line: lineNum, type: 'remove' });
        return;
    }
    
     // TS6198: All destructured elements are unused.
    match = line.match(/(.+)\((\d+),\d+\): error TS6198: All destructured elements are unused./);
    if (match) {
        const [_, file, lineStr] = match;
        const lineNum = parseInt(lineStr);
        if (!fileMutations[file]) fileMutations[file] = [];
        fileMutations[file].push({ line: lineNum, type: 'remove' }); // Or maybe just prefix? Remove is safer for "All"
        return;
    }
});

// Process files
Object.keys(fileMutations).forEach(filePath => {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
    }

    console.log(`Processing ${filePath}...`);
    let content = fs.readFileSync(absolutePath, 'utf-8').split('\n');
    const mutations = fileMutations[filePath].sort((a, b) => b.line - a.line); // Sort descending to handle line removals

    // Remove duplicates (same line multiple errors)
    const uniqueMutations = [];
    const seen = new Set();
    mutations.forEach(m => {
        const key = `${m.line}-${m.type}-${m.varName}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueMutations.push(m);
        }
    });

    let modified = false;

    uniqueMutations.forEach(mutation => {
        const index = mutation.line - 1;
        if (index < 0 || index >= content.length) return;

        const lineContent = content[index];

        if (mutation.type === 'remove') {
            // Comment out the line instead of removing to preserve line numbers for other errors in the same batch? 
            // No, removing is better, but since we sort descending, removing lines later in file won't affect earlier indices.
            // Wait, if we have multiple errors in same file, removing line 100 will shift line 101.
            // BUT we sorted descending! So we process line 100 before line 10. Perfect.
            // content.splice(index, 1); // This shifts array.
            // Actually, commenting is safer to avoid breaking multi-line structures unexpectedly, 
            // BUT TS6192 (unused imports) usually safe to remove.
            // Let's just comment it out to be safe and easily reversible.
            content[index] = `// ${lineContent}`; 
            modified = true;
        } else if (mutation.type === 'prefix') {
            // Replace varName with _varName
            // We need to be careful not to replace substrings.
            // Use word boundary \b
            // But if it is destructured { AlertCircle } -> { AlertCircle: _AlertCircle } ? No, unused means we don't use it.
            // If it is "import { AlertCircle }", change to "import { AlertCircle as _AlertCircle }" ? No unused imports usually TS6192/TS6133.
            
            // Regex replacement:
            // Look for varName used as declaration. 
            // Naive replace:
            const regex = new RegExp(`\\b${mutation.varName}\\b`, 'g');
            // Check if it is already prefixed
            if (!mutation.varName.startsWith('_')) {
                // Heuristic: If it looks like an import "{ Foo }" -> "{ Foo as _Foo }" could work but only if Foo is NOT used but _Foo IS used (which is not the case here).
                // Dealing with unused variables:
                // 1. `const foo = 1` -> `const _foo = 1`
                // 2. `function(foo)` -> `function(_foo)`
                // 3. `import { foo }` -> typecheck usually complains about import being unused.
                
                // For simplicity: Replace matching word with _word. 
                // RISKY: might replace property names in objects.
                // e.g. { foo: 1 } -> { _foo: 1 } if keys match variable name.
                
                // Let's try to be slightly smarter.
                // If the line contains "import ", try to remove the specifier? Too hard regex.
                // Let's just do prefix generic replace.
                
                const newLine = lineContent.replace(regex, `_${mutation.varName}`);
                if (newLine !== lineContent) {
                    content[index] = newLine;
                    modified = true;
                }
            }
        }
    });

    if (modified) {
        fs.writeFileSync(absolutePath, content.join('\n'));
    }
});

console.log('Finished fixing unused variables.');
