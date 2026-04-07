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

  it('generates deep copy proxy for nested @freezed types', async () => {
    await withTempDir((dir) => {
      const filePath = path.join(dir, 'company.ts');
      fs.writeFileSync(filePath, `
      import { freezed } from 'freezedts';

      @freezed()
      class Inner {
        constructor(params: { value: string }) { }
      }

      @freezed()
      class Outer {
        constructor(params: { name: string; inner: Inner }) { }
      }
    `);

      const result = generate([filePath]);
      expect(result.filesWritten).toBe(1);

      const output = fs.readFileSync(
        path.join(dir, 'company.freezed.ts'),
        'utf-8',
      );

      // Should contain the deep copy helper
      expect(output).toContain('__freezedWith');
      // Should contain getter, not method
      expect(output).toContain('get with()');
      expect(output).not.toContain('with(overrides:');
      // inner property should use $Inner type (base class reference)
      expect(output).toContain('inner: $Inner;');
    });
  });

  it('collects warnings for malformed @freezed classes', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'bad.ts');
      fs.writeFileSync(
        sourceFile,
        `
        import { freezed } from 'freezedts';

        @freezed()
        class NoConstructor {
        }
        `,
      );

      const result = generate([sourceFile]);
      expect(result.filesWritten).toBe(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('NoConstructor');
      expect(result.warnings[0]).toContain('no constructor');
    });
  });

  it('generates valid classes and warns about invalid ones in the same file', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'mixed.ts');
      fs.writeFileSync(
        sourceFile,
        `
        import { freezed } from 'freezedts';

        @freezed()
        class Valid {
          constructor(params: { name: string }) {}
        }

        @freezed()
        class Invalid {
        }
        `,
      );

      const result = generate([sourceFile]);
      expect(result.filesWritten).toBe(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Invalid');
    });
  });
});
