import * as fs from 'node:fs';
import * as path from 'node:path';
import { generate } from './generator/generator.js';

const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.git']);

export function resolveSourceFiles(dir: string): string[] {
  const results: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) {
          walk(path.join(currentDir, entry.name));
        }
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.ts') &&
        !entry.name.endsWith('.freezed.ts') &&
        !entry.name.endsWith('.test.ts') &&
        !entry.name.endsWith('.d.ts')
      ) {
        results.push(path.join(currentDir, entry.name));
      }
    }
  }

  walk(dir);
  return results;
}

function main() {
  const targetDir = process.argv[2] || '.';
  const resolvedDir = path.resolve(targetDir);

  console.log(`freezedts: scanning ${resolvedDir}`);
  const files = resolveSourceFiles(resolvedDir);
  console.log(`freezedts: found ${files.length} source file(s)`);

  const result = generate(files);
  console.log(`freezedts: generated ${result.filesWritten} .freezed.ts file(s)`);

  if (result.errors.length > 0) {
    console.error('freezedts: errors:');
    result.errors.forEach((e) => console.error(`  ${e}`));
    process.exit(1);
  }
}

// Only run when executed directly, not when imported
const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]).replace(/\.[^.]+$/, '') ===
    path.resolve(new URL(import.meta.url).pathname).replace(/\.[^.]+$/, '');

if (isMainModule) {
  main();
}
