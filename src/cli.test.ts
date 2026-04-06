import { describe, it, expect } from 'bun:test';
import { resolveSourceFiles } from './cli.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

function withTempDir(fn: (dir: string) => void | Promise<void>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'freezedts-cli-'));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
}

describe('resolveSourceFiles', () => {
  it('finds .ts files in a directory, excluding .freezed.ts and .test.ts', () => {
    withTempDir((dir) => {
      fs.writeFileSync(path.join(dir, 'person.ts'), 'class Person {}');
      fs.writeFileSync(path.join(dir, 'person.freezed.ts'), '// generated');
      fs.writeFileSync(path.join(dir, 'person.test.ts'), '// test');
      fs.writeFileSync(path.join(dir, 'utils.ts'), 'export {}');

      const files = resolveSourceFiles(dir);
      const names = files.map((f) => path.basename(f)).sort();
      expect(names).toEqual(['person.ts', 'utils.ts']);
    });
  });

  it('recursively finds .ts files in subdirectories', () => {
    withTempDir((dir) => {
      const sub = path.join(dir, 'models');
      fs.mkdirSync(sub);
      fs.writeFileSync(path.join(dir, 'root.ts'), '');
      fs.writeFileSync(path.join(sub, 'user.ts'), '');
      fs.writeFileSync(path.join(sub, 'user.freezed.ts'), '');

      const files = resolveSourceFiles(dir);
      const names = files.map((f) => path.basename(f)).sort();
      expect(names).toEqual(['root.ts', 'user.ts']);
    });
  });

  it('excludes node_modules and dist directories', () => {
    withTempDir((dir) => {
      fs.mkdirSync(path.join(dir, 'node_modules', 'pkg'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'node_modules', 'pkg', 'index.ts'), '');
      fs.writeFileSync(path.join(dir, 'dist', 'index.ts'), '');
      fs.writeFileSync(path.join(dir, 'src.ts'), '');

      const files = resolveSourceFiles(dir);
      const names = files.map((f) => path.basename(f));
      expect(names).toEqual(['src.ts']);
    });
  });
});
