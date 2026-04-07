import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from './generator/generator.js';
import { createWatcher } from './generator/watcher.js';

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

export interface CliArgs {
  watch: boolean;
  dir: string;
}

export function filterChangedFiles(files: string[]): { changed: string[]; skipped: number } {
  const changed: string[] = [];
  let skipped = 0;
  for (const file of files) {
    const outputPath = file.replace(/\.ts$/, '.freezed.ts');
    try {
      const sourceMtime = fs.statSync(file).mtimeMs;
      const outputMtime = fs.statSync(outputPath).mtimeMs;
      if (outputMtime >= sourceMtime) {
        skipped++;
        continue;
      }
    } catch {
      // Output file doesn't exist — needs generation
    }
    changed.push(file);
  }
  return { changed, skipped };
}

export function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  let watch = false;
  let dir = '.';

  for (const arg of args) {
    if (arg === '--watch' || arg === '-w') {
      watch = true;
    } else if (!arg.startsWith('-')) {
      dir = arg;
    }
  }

  return { watch, dir };
}

function main() {
  const args = parseArgs(process.argv);
  const resolvedDir = path.resolve(args.dir);

  console.log(`freezedts: scanning ${resolvedDir}`);
  const allFiles = resolveSourceFiles(resolvedDir);
  console.log(`freezedts: found ${allFiles.length} source file(s)`);

  const { changed, skipped } = filterChangedFiles(allFiles);
  const result = generate(changed);

  if (skipped > 0) {
    console.log(`freezedts: generated ${result.filesWritten} .freezed.ts file(s), ${skipped} unchanged`);
  } else {
    console.log(`freezedts: generated ${result.filesWritten} .freezed.ts file(s)`);
  }

  if (result.warnings.length > 0) {
    result.warnings.forEach((w) => console.warn(`  warning: ${w}`));
  }

  if (result.errors.length > 0) {
    console.error('freezedts: errors:');
    result.errors.forEach((e) => console.error(`  ${e}`));
    if (!args.watch) process.exit(1);
  }

  if (args.watch) {
    console.log('freezedts: watching for changes... (press Ctrl+C to stop)');
    createWatcher({
      dir: resolvedDir,
      onChange: (changedFiles) => {
        const timestamp = new Date().toLocaleTimeString();
        const watchResult = generate(changedFiles);
        for (const f of changedFiles) {
          const rel = path.relative(resolvedDir, f);
          console.log(`[${timestamp}] ${rel} → regenerated`);
        }
        if (watchResult.warnings.length > 0) {
          watchResult.warnings.forEach((w) => console.warn(`  warning: ${w}`));
        }
        if (watchResult.errors.length > 0) {
          watchResult.errors.forEach((e) => console.error(`  error: ${e}`));
        }
      },
    });
  }
}

// Only run when executed directly, not when imported
const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]).replace(/\.[^.]+$/, '') ===
    fileURLToPath(import.meta.url).replace(/\.[^.]+$/, '');

if (isMainModule) {
  main();
}
