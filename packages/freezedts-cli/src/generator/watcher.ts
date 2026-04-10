import * as fs from 'node:fs';
import * as path from 'node:path';

import { EXCLUDED_DIRS } from '../excluded-dirs.js';

export function shouldProcess(filePath: string): boolean {
  const base = path.basename(filePath);
  if (!base.endsWith('.ts')) return false;
  if (base.endsWith('.freezed.ts')) return false;
  if (base.endsWith('.test.ts')) return false;
  if (base.endsWith('.d.ts')) return false;
  const parts = filePath.split(/[\\/]/);
  return !parts.some((p) => EXCLUDED_DIRS.has(p));
}

export interface WatcherOptions {
  dir: string;
  onChange: (changedFiles: string[]) => void;
  debounceMs?: number;
}

export interface Watcher {
  close: () => void;
}

export function createWatcher(options: WatcherOptions): Watcher {
  const { dir, onChange, debounceMs = 100 } = options;
  let pending = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const fsWatcher = fs.watch(dir, { recursive: true }, (_eventType, filename) => {
    if (!filename) return;
    const fullPath = path.resolve(dir, filename);
    if (!shouldProcess(fullPath)) return;

    pending.add(fullPath);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const files = [...pending];
      pending = new Set();
      timer = null;
      onChange(files);
    }, debounceMs);
  });

  return {
    close: () => {
      if (timer) clearTimeout(timer);
      fsWatcher.close();
    },
  };
}
