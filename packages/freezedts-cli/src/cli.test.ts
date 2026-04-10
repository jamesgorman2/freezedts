import { describe, it, expect } from 'bun:test';
import { resolveSourceFiles, parseArgs, filterChangedFiles } from './cli.js';
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

describe('parseArgs', () => {
  it('defaults to no watch and current directory', () => {
    expect(parseArgs(['node', 'cli.js'])).toEqual({ watch: false, dir: '.', config: undefined });
  });

  it('parses --watch flag', () => {
    expect(parseArgs(['node', 'cli.js', '--watch'])).toEqual({ watch: true, dir: '.', config: undefined });
  });

  it('parses -w shorthand', () => {
    expect(parseArgs(['node', 'cli.js', '-w'])).toEqual({ watch: true, dir: '.', config: undefined });
  });

  it('parses positional directory argument', () => {
    expect(parseArgs(['node', 'cli.js', 'src'])).toEqual({ watch: false, dir: 'src', config: undefined });
  });

  it('parses both --watch and directory in any order', () => {
    expect(parseArgs(['node', 'cli.js', '--watch', 'src'])).toEqual({ watch: true, dir: 'src', config: undefined });
    expect(parseArgs(['node', 'cli.js', 'src', '-w'])).toEqual({ watch: true, dir: 'src', config: undefined });
  });

  it('parses --config flag with path', () => {
    expect(parseArgs(['node', 'cli.js', '--config', 'custom.json'])).toEqual({
      watch: false,
      dir: '.',
      config: 'custom.json',
    });
  });

  it('parses -c shorthand for config', () => {
    expect(parseArgs(['node', 'cli.js', '-c', 'my.json'])).toEqual({
      watch: false,
      dir: '.',
      config: 'my.json',
    });
  });

  it('parses --config with --watch and directory', () => {
    expect(parseArgs(['node', 'cli.js', '--watch', '--config', 'cfg.json', 'src'])).toEqual({
      watch: true,
      dir: 'src',
      config: 'cfg.json',
    });
  });

  it('config is undefined when not specified', () => {
    expect(parseArgs(['node', 'cli.js'])).toEqual({
      watch: false,
      dir: '.',
      config: undefined,
    });
  });
});

describe('filterChangedFiles', () => {
  it('includes files without a .freezed.ts counterpart', () => {
    withTempDir((dir) => {
      const file = path.join(dir, 'person.ts');
      fs.writeFileSync(file, 'class Person {}');

      const { changed, skipped } = filterChangedFiles([file]);
      expect(changed).toEqual([file]);
      expect(skipped).toBe(0);
    });
  });

  it('skips files whose .freezed.ts is newer than source', () => {
    withTempDir((dir) => {
      const file = path.join(dir, 'person.ts');
      const freezed = path.join(dir, 'person.freezed.ts');
      const now = Date.now();
      fs.writeFileSync(file, 'class Person {}');
      fs.utimesSync(file, now / 1000, now / 1000);
      fs.writeFileSync(freezed, '// generated');
      fs.utimesSync(freezed, (now + 2000) / 1000, (now + 2000) / 1000);

      const { changed, skipped } = filterChangedFiles([file]);
      expect(changed).toEqual([]);
      expect(skipped).toBe(1);
    });
  });

  it('includes files whose source is newer than .freezed.ts', () => {
    withTempDir((dir) => {
      const file = path.join(dir, 'person.ts');
      const freezed = path.join(dir, 'person.freezed.ts');
      const now = Date.now();
      fs.writeFileSync(freezed, '// generated');
      fs.utimesSync(freezed, now / 1000, now / 1000);
      fs.writeFileSync(file, 'class Person {}');
      fs.utimesSync(file, (now + 2000) / 1000, (now + 2000) / 1000);

      const { changed, skipped } = filterChangedFiles([file]);
      expect(changed).toEqual([file]);
      expect(skipped).toBe(0);
    });
  });

  it('handles a mix of changed and unchanged files', () => {
    withTempDir((dir) => {
      const now = Date.now();

      const changed1 = path.join(dir, 'changed.ts');
      fs.writeFileSync(changed1, 'class A {}');

      const unchanged = path.join(dir, 'unchanged.ts');
      const unchangedGen = path.join(dir, 'unchanged.freezed.ts');
      fs.writeFileSync(unchanged, 'class B {}');
      fs.utimesSync(unchanged, now / 1000, now / 1000);
      fs.writeFileSync(unchangedGen, '// generated');
      fs.utimesSync(unchangedGen, (now + 2000) / 1000, (now + 2000) / 1000);

      const result = filterChangedFiles([changed1, unchanged]);
      expect(result.changed).toEqual([changed1]);
      expect(result.skipped).toBe(1);
    });
  });
});
