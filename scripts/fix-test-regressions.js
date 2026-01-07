const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find files containing _vi, _crypto, _join improperly
// We can use a recursive walk or just use the list from logs
// Let's walk the tests directory

function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walk(filePath, fileList);
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

const testsDir = path.join(process.cwd(), 'tests');
const files = walk(testsDir);

// Also verify scripts/test-creative-generator.ts
files.push(path.join(process.cwd(), 'scripts', 'test-creative-generator.ts'));
// And app/dashboard/page.tsx
files.push(path.join(process.cwd(), 'app', 'dashboard', 'page.tsx'));

files.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Fix _vi -> vi
    if (content.includes('_vi')) {
        // Safe check: replace `_vi` with `vi` if it looks like usage from vitest
        // Or import replacement
        // import { ..., _vi, ... } from 'vitest' -> vi
        // import { ..., vi as _vi } -> this would be valid but we probably just have `_vi`

        // Fix imports
        if (content.match(/import\s+.*_vi.*\s+from\s+['"]vitest['"]/)) {
            content = content.replace(/_vi/g, 'vi');
            modified = true;
        } else if (content.includes(' _vi.') || content.includes('_vi.')) {
            // usage
            content = content.replace(/_vi\./g, 'vi.');
            modified = true;
        }
    }

    // Fix _crypto -> crypto
    // import { ..., _crypto, ... }
    if (content.includes('_crypto')) {
        content = content.replace(/_crypto/g, 'crypto');
        modified = true;
    }

    // Fix _join -> join (path)
    if (content.includes('_join') && content.includes('path')) {
        content = content.replace(/_join/g, 'join');
        modified = true;
    }

    // Fix usePermissions unused
    if (filePath.includes('dashboard\\page.tsx') || filePath.includes('dashboard/page.tsx')) {
        if (content.includes('usePermissions') && content.includes('error TS6133')) {
            // Already caught by previous mechanism? No.
            // Just remove the import if unused?
            // checking manually first
        }
        // Fix parameter implicit any
        // (page, index) -> (page: any, index: number)
        if (content.includes('map((page, index) =>')) {
            content = content.replace('map((page, index) =>', 'map((page: any, index: number) =>');
            modified = true;
        }
    }

    // Fix scripts/test-creative-generator.ts missing properties
    if (filePath.includes('test-creative-generator.ts')) {
        // Add mainPrompt: '' to objects that need it
        // Search for objects missing it? Hard to parse safely with regex.
        // We know the pattern from logs:
        // '{ productName: string; productDescription: string; }'

        // Just add mainPrompt: "Auto-generated prompt" to the object literals in the file if checking specifically
        // The file likely calls a function with an object literal.

        // This is a bit risky with regex, might skip this and do manually or via suppressing (this is a script, not app code).
        // Let's add @ts-ignore
        // But better to fix.
        // We can just add `mainPrompt: 'Generated prompt',` to the object
    }

    if (modified) {
        console.log(`Fixing ${filePath}`);
        fs.writeFileSync(filePath, content);
    }
});
