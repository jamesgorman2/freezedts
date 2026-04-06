import { describe, it, expect } from 'bun:test';
import { generate } from './generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

function withTempDir(fn: (dir: string) => void | Promise<void>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'freezedts-test-'));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
}

describe('generate', () => {
  it('creates a .freezed.ts file from a source file with @freezed class', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'person.ts');
      fs.writeFileSync(
        sourceFile,
        `
        import { freezed } from 'freezedts';

        @freezed()
        class Person {
          constructor(params: { firstName: string; lastName: string }) {}
        }
        `,
      );

      const result = generate([sourceFile]);
      expect(result.filesWritten).toBe(1);

      const generatedPath = path.join(dir, 'person.freezed.ts');
      expect(fs.existsSync(generatedPath)).toBe(true);

      const content = fs.readFileSync(generatedPath, 'utf-8');
      expect(content).toContain('export abstract class $Person');
      expect(content).toContain('readonly firstName!: string');
      expect(content).toContain('Object.freeze(this)');
    });
  });

  it('skips files with no @freezed classes', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'plain.ts');
      fs.writeFileSync(sourceFile, `class Plain { value = 1; }`);

      const result = generate([sourceFile]);
      expect(result.filesWritten).toBe(0);

      const generatedPath = path.join(dir, 'plain.freezed.ts');
      expect(fs.existsSync(generatedPath)).toBe(false);
    });
  });

  it('handles multiple classes in one file', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'models.ts');
      fs.writeFileSync(
        sourceFile,
        `
        import { freezed } from 'freezedts';

        @freezed()
        class Person {
          constructor(params: { name: string }) {}
        }

        @freezed()
        class Child {
          constructor(params: { name: string; parentName: string }) {}
        }
        `,
      );

      const result = generate([sourceFile]);
      expect(result.filesWritten).toBe(1);

      const content = fs.readFileSync(
        path.join(dir, 'models.freezed.ts'),
        'utf-8',
      );
      expect(content).toContain('export abstract class $Person');
      expect(content).toContain('export abstract class $Child');
    });
  });
});
