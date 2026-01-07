const fs = require('fs');
const path = require('path');

const logPath = './typecheck_log_4.txt';
if (!fs.existsSync(logPath)) {
    console.error('Log file not found:', logPath);
    process.exit(1);
}

const logContent = fs.readFileSync(logPath, 'utf-8');
const lines = logContent.split('\n');

const mutations = {}; // filepath -> []

function addMutation(file, line) {
    if (!mutations[file]) mutations[file] = [];
    mutations[file].push(line);
}

lines.forEach(logLine => {
    // Error example: app/conteudo/page.tsx(8,3): error TS1003: Identifier expected.
    const match = logLine.match(/(.+)\((\d+),\d+\): error TS1003: Identifier expected/);
    if (match) {
        const [_, file, lineStr] = match;
        addMutation(file, parseInt(lineStr));
    }
});

Object.keys(mutations).forEach(filePath => {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) return;

    console.log(`Fixing syntax in ${filePath}...`);
    let content = fs.readFileSync(absolutePath, 'utf-8').split('\n');
    let modified = false;

    // Process lines. Unique and sorted descending.
    const linesToFix = [...new Set(mutations[filePath])].sort((a, b) => b - a);

    linesToFix.forEach(lineNum => {
        const idx = lineNum - 1;
        if (idx < 0 || idx >= content.length) return;

        const lineContent = content[idx];

        // Strategy: 
        // 1. If line is just comma + whitespace -> remove it.
        // 2. If line has comma at start/end but no identifier -> remove comma.

        if (lineContent.trim() === ',') {
            console.log(`  Removing line ${lineNum}: "${lineContent}"`);
            content.splice(idx, 1);
            modified = true;
        } else if (lineContent.trim().startsWith(',')) {
            // Example: "  , Search" -> "  Search"
            console.log(`  Cleaning leading comma line ${lineNum}: "${lineContent}"`);
            content[idx] = lineContent.replace(',', ' ');
            modified = true;
        }
    });

    // Check for empty import blocks that might be left over
    // import {
    // } from '...'
    // or import { } from '...'
    // This is valid syntax but maybe we want to clean it if it causes issues? 
    // For now, let's just fix the commas.

    if (modified) {
        fs.writeFileSync(absolutePath, content.join('\n'));
    }
});
