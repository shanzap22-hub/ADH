#!/usr/bin/env node

/**
 * 2026 Code Quality: Client Component Audit Script
 * 
 * Scans the Next.js src directory to identify:
 * 1. Client components missing "use client" directive (using hooks/browser APIs)
 * 2. Server components unnecessarily marked as "use client"
 * 3. Best practice violations for Next.js 14+ App Router
 * 
 * Usage:
 * node scripts/audit-client-components.ts
 * 
 * Or add to package.json:
 * "scripts": {
 *   "audit:components": "tsx scripts/audit-client-components.ts"
 * }
 */

import * as fs from 'fs';
import * as path from 'path';

// Patterns that indicate client-side code
const CLIENT_INDICATORS = [
    /useState/,
    /useEffect/,
    /useContext/,
    /useReducer/,
    /useCallback/,
    /useMemo/,
    /useRef/,
    /useLayoutEffect/,
    /useImperativeHandle/,
    /window\./,
    /document\./,
    /localStorage/,
    /sessionStorage/,
    /addEventListener/,
    /onClick=/,
    /onChange=/,
    /onSubmit=/,
    /usePathname/,
    /useRouter/,
    /useSearchParams/,
];

// Patterns that indicate server-only code
const SERVER_INDICATORS = [
    /cookies\(\)/,
    /headers\(\)/,
    /createClient.*supabase.*server/,
    /import.*from.*"server-only"/,
    /async function.*\(.*\)/,  // Async Server Components
];

interface AuditResult {
    filePath: string;
    hasUseClient: boolean;
    hasClientIndicators: boolean;
    hasServerIndicators: boolean;
    clientPatterns: string[];
    serverPatterns: string[];
    lineNumber: number;
}

const results: {
    missingUseClient: AuditResult[];
    unnecessaryUseClient: AuditResult[];
    mixed: AuditResult[];
} = {
    missingUseClient: [],
    unnecessaryUseClient: [],
    mixed: [],
};

function scanFile(filePath: string): AuditResult | null {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const hasUseClient = /^['"]use client['"];?$/m.test(content);
    const clientPatterns: string[] = [];
    const serverPatterns: string[] = [];

    // Check for client indicators
    CLIENT_INDICATORS.forEach((pattern) => {
        if (pattern.test(content)) {
            clientPatterns.push(pattern.source);
        }
    });

    // Check for server indicators
    SERVER_INDICATORS.forEach((pattern) => {
        if (pattern.test(content)) {
            serverPatterns.push(pattern.source);
        }
    });

    const hasClientIndicators = clientPatterns.length > 0;
    const hasServerIndicators = serverPatterns.length > 0;

    // Find line number of first indicator
    let lineNumber = 1;
    for (let i = 0; i < lines.length; i++) {
        if (hasClientIndicators && CLIENT_INDICATORS.some(p => p.test(lines[i]))) {
            lineNumber = i + 1;
            break;
        }
    }

    return {
        filePath,
        hasUseClient,
        hasClientIndicators,
        hasServerIndicators,
        clientPatterns,
        serverPatterns,
        lineNumber,
    };
}

function scanDirectory(dir: string): void {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Skip node_modules and .next
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                scanDirectory(filePath);
            }
        } else if (
            (file.endsWith('.tsx') || file.endsWith('.ts')) &&
            !file.endsWith('.d.ts')
        ) {
            const result = scanFile(filePath);

            if (result) {
                // Missing "use client" (has client indicators but no directive)
                if (result.hasClientIndicators && !result.hasUseClient) {
                    results.missingUseClient.push(result);
                }

                // Unnecessary "use client" (has directive but no client indicators)
                if (result.hasUseClient && !result.hasClientIndicators) {
                    results.unnecessaryUseClient.push(result);
                }

                // Mixed (has both client and server indicators - needs review)
                if (result.hasClientIndicators && result.hasServerIndicators) {
                    results.mixed.push(result);
                }
            }
        }
    });
}

console.log('🔍 Client Component Audit\n');
console.log('Scanning src directory...\n');

const srcDir = path.join(process.cwd(), 'src');
scanDirectory(srcDir);

console.log('📊 Audit Results\n');
console.log('='.repeat(80));

// Missing "use client"
if (results.missingUseClient.length > 0) {
    console.log(`\n❌ Missing "use client" directive (${results.missingUseClient.length} files)\n`);
    results.missingUseClient.forEach((r) => {
        console.log(`  ${r.filePath}:${r.lineNumber}`);
        console.log(`    Detected patterns: ${r.clientPatterns.join(', ')}`);
        console.log('');
    });
} else {
    console.log('\n✅ No files missing "use client" directive\n');
}

// Unnecessary "use client"
if (results.unnecessaryUseClient.length > 0) {
    console.log(`\n⚠️  Unnecessary "use client" directive (${results.unnecessaryUseClient.length} files)\n`);
    console.log('These files could potentially be Server Components:\n');
    results.unnecessaryUseClient.forEach((r) => {
        console.log(`  ${r.filePath}`);
    });
    console.log('');
} else {
    console.log('\n✅ No unnecessary "use client" directives found\n');
}

// Mixed (needs review)
if (results.mixed.length > 0) {
    console.log(`\n🔄 Mixed client/server patterns (${results.mixed.length} files)\n`);
    console.log('These files have both client and server indicators - needs manual review:\n');
    results.mixed.forEach((r) => {
        console.log(`  ${r.filePath}:${r.lineNumber}`);
        console.log(`    Client patterns: ${r.clientPatterns.slice(0, 3).join(', ')}`);
        console.log(`    Server patterns: ${r.serverPatterns.slice(0, 3).join(', ')}`);
        console.log('    Recommendation: Extract client logic to separate component');
        console.log('');
    });
}

console.log('='.repeat(80));
console.log(`\nSummary:`);
console.log(`  Missing "use client": ${results.missingUseClient.length}`);
console.log(`  Unnecessary "use client": ${results.unnecessaryUseClient.length}`);
console.log(`  Mixed patterns (review needed): ${results.mixed.length}`);

// Exit with error code if issues found
if (results.missingUseClient.length > 0 || results.mixed.length > 0) {
    console.log('\n⚠️  Issues detected. Please review the files above.');
    process.exit(1);
} else {
    console.log('\n✅ All components correctly marked!');
    process.exit(0);
}
