import { describe, it, expect } from 'bun:test';
import { shouldProcess, createWatcher } from './watcher.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('shouldProcess', () => {
  it('accepts regular .ts files', () => {
    expect(shouldProcess('models/person.ts')).toBe(true);
  });

  it('accepts .ts files in nested directories', () => {
    expect(shouldProcess('src/models/person.ts')).toBe(true);
  });

  it('rejects .freezed.ts files', () => {
    expect(shouldProcess('models/person.freezed.ts')).toBe(false);
  });

  it('rejects .test.ts files', () => {
    expect(shouldProcess('models/person.test.ts')).toBe(false);
  });

  it('rejects .d.ts files', () => {
    expect(shouldProcess('models/person.d.ts')).toBe(false);
  });

  it('rejects files in node_modules', () => {
    expect(shouldProcess('node_modules/pkg/index.ts')).toBe(false);
  });

  it('rejects files in dist', () => {
    expect(shouldProcess('dist/cli.ts')).toBe(false);
  });

  it('rejects files in .git', () => {
    expect(shouldProcess('.git/hooks/pre-commit.ts')).toBe(false);
  });

  it('rejects non-.ts files', () => {
    expect(shouldProcess('readme.md')).toBe(false);
    expect(shouldProcess('config.json')).toBe(false);
  });
});

function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'freezedts-watch-'));
  return fn(dir).finally(() => fs.rmSync(dir, { recursive: true }));
}

describe('createWatcher', () => {
  it('calls onChange when a .ts file is modified', async () => {
    await withTempDir(async (dir) => {
      const sourceFile = path.join(dir, 'test.ts');
      fs.writeFileSync(sourceFile, 'class A {}');

      const changed: string[][] = [];
      const watcher = createWatcher({
        dir,
        onChange: (files) => changed.push(files),
        debounceMs: 50,
      });

      await new Promise((r) => setTimeout(r, 100));
      fs.writeFileSync(sourceFile, 'class B {}');
      await new Promise((r) => setTimeout(r, 300));

      watcher.close();
      expect(changed.length).toBeGreaterThanOrEqual(1);
      expect(changed[0].some((f) => f.endsWith('test.ts'))).toBe(true);
    });
  });

  it('ignores .freezed.ts file changes', async () => {
    await withTempDir(async (dir) => {
      const genFile = path.join(dir, 'test.freezed.ts');
      fs.writeFileSync(genFile, '// generated');

      const changed: string[][] = [];
      const watcher = createWatcher({
        dir,
        onChange: (files) => changed.push(files),
        debounceMs: 50,
      });

      await new Promise((r) => setTimeout(r, 100));
      fs.writeFileSync(genFile, '// updated');
      await new Promise((r) => setTimeout(r, 300));

      watcher.close();
      expect(changed).toHaveLength(0);
    });
  });

  it('debounces rapid changes into a single callback', async () => {
    await withTempDir(async (dir) => {
      const file1 = path.join(dir, 'a.ts');
      const file2 = path.join(dir, 'b.ts');
      fs.writeFileSync(file1, '');
      fs.writeFileSync(file2, '');

      const batches: string[][] = [];
      const watcher = createWatcher({
        dir,
        onChange: (files) => batches.push(files),
        debounceMs: 100,
      });

      await new Promise((r) => setTimeout(r, 200));
      fs.writeFileSync(file1, 'class A {}');
      await new Promise((r) => setTimeout(r, 20));
      fs.writeFileSync(file2, 'class B {}');
      await new Promise((r) => setTimeout(r, 500));

      watcher.close();
      // Both changes should be batched into a single (or few) callback(s)
      expect(batches.length).toBeGreaterThanOrEqual(1);
      const allFiles = batches.flat();
      expect(allFiles.some((f) => f.endsWith('a.ts'))).toBe(true);
      expect(allFiles.some((f) => f.endsWith('b.ts'))).toBe(true);
    });
  });
});
