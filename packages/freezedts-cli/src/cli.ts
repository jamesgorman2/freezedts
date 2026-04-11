#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from './generator/generator.js';
import { createWatcher } from './generator/watcher.js';
import { loadConfig } from './generator/config.js';

import { EXCLUDED_DIRS } from './excluded-dirs.js';

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
  force: boolean;
  dir: string;
  config?: string;
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
  let force = false;
  let dir = '.';
  let config: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--watch' || arg === '-w') {
      watch = true;
    } else if (arg === '--force') {
      force = true;
    } else if ((arg === '--config' || arg === '-c') && i + 1 < args.length) {
      config = args[++i];
    } else if (!arg.startsWith('-')) {
      dir = arg;
    }
  }

  return { watch, force, dir, config };
}

function main() {
  const args = parseArgs(process.argv);
  const resolvedDir = path.resolve(args.dir);
  const configPath = args.config ?? path.join(resolvedDir, 'freezedts.config.json');
  const config = loadConfig(configPath);

  console.log(`freezedts: scanning ${resolvedDir}`);
  const allFiles = resolveSourceFiles(resolvedDir);
  console.log(`freezedts: found ${allFiles.length} source file(s)`);

  const { changed, skipped } = filterChangedFiles(allFiles);
  const result = generate(changed, config);

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
        const watchResult = generate(changedFiles, config);
        if (watchResult.filesWritten > 0) {
          for (const f of changedFiles) {
            const rel = path.relative(resolvedDir, f);
            console.log(`[${timestamp}] ${rel} → regenerated`);
          }
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
if (import.meta.main) {
  main();
}
