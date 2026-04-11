import { describe, it, expect, beforeAll } from 'bun:test';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';

const fixturesDir = path.resolve(import.meta.dirname, 'fixtures');

beforeAll(() => {
  generate([
    path.join(fixturesDir, 'no-copy-with.ts'),
    path.join(fixturesDir, 'no-equal.ts'),
    path.join(fixturesDir, 'all-disabled.ts'),
    path.join(fixturesDir, 'no-to-string.ts'),
    path.join(fixturesDir, 'no-equal-imported.ts'),
    path.join(fixturesDir, 'no-copy-with-imported.ts'),
  ]);
});

describe('per-class opt-out — copyWith: false', () => {
  it('does not generate with getter', async () => {
    const { NoCopy } = await import('./fixtures/no-copy-with.ts');
    const instance = new NoCopy({ name: 'Alice', age: 30 });
    expect((instance as any).with).toBeUndefined();
  });

  it('still generates equals()', async () => {
    const { NoCopy } = await import('./fixtures/no-copy-with.ts');
    const a = new NoCopy({ name: 'Alice', age: 30 });
    const b = new NoCopy({ name: 'Alice', age: 30 });
    expect(a.equals(b)).toBe(true);
  });

  it('still generates toString()', async () => {
    const { NoCopy } = await import('./fixtures/no-copy-with.ts');
    const instance = new NoCopy({ name: 'Alice', age: 30 });
    expect(instance.toString()).toContain('NoCopy');
    expect(instance.toString()).toContain('Alice');
  });

  it('is still frozen', async () => {
    const { NoCopy } = await import('./fixtures/no-copy-with.ts');
    const instance = new NoCopy({ name: 'Alice', age: 30 });
    expect(Object.isFrozen(instance)).toBe(true);
    expect(() => { (instance as any).name = 'Bob'; }).toThrow();
  });
});

describe('per-class opt-out — equal: false', () => {
  it('does not generate equals()', async () => {
    const { NoEqual } = await import('./fixtures/no-equal.ts');
    const instance = new NoEqual({ name: 'Alice', age: 30 });
    expect((instance as any).equals).toBeUndefined();
  });

  it('still generates with()', async () => {
    const { NoEqual } = await import('./fixtures/no-equal.ts');
    const instance = new NoEqual({ name: 'Alice', age: 30 });
    const updated = instance.with({ name: 'Bob' });
    expect(updated.name).toBe('Bob');
    expect(updated.age).toBe(30);
  });

  it('still generates toString()', async () => {
    const { NoEqual } = await import('./fixtures/no-equal.ts');
    const instance = new NoEqual({ name: 'Alice', age: 30 });
    expect(instance.toString()).toContain('NoEqual');
  });

  it('is still frozen', async () => {
    const { NoEqual } = await import('./fixtures/no-equal.ts');
    const instance = new NoEqual({ name: 'Alice', age: 30 });
    expect(Object.isFrozen(instance)).toBe(true);
  });
});

describe('per-class opt-out — toString: false', () => {
  it('does not generate toString()', async () => {
    const { NoToString } = await import('./fixtures/no-to-string.ts');
    const instance = new NoToString({ name: 'Alice', age: 30 });
    // toString() falls back to default Object.prototype.toString
    expect(instance.toString()).not.toContain('Alice');
  });

  it('still generates with()', async () => {
    const { NoToString } = await import('./fixtures/no-to-string.ts');
    const instance = new NoToString({ name: 'Alice', age: 30 });
    const updated = instance.with({ name: 'Bob' });
    expect(updated.name).toBe('Bob');
    expect(updated.age).toBe(30);
  });

  it('still generates equals()', async () => {
    const { NoToString } = await import('./fixtures/no-to-string.ts');
    const a = new NoToString({ name: 'Alice', age: 30 });
    const b = new NoToString({ name: 'Alice', age: 30 });
    expect(a.equals(b)).toBe(true);
  });

  it('is still frozen', async () => {
    const { NoToString } = await import('./fixtures/no-to-string.ts');
    const instance = new NoToString({ name: 'Alice', age: 30 });
    expect(Object.isFrozen(instance)).toBe(true);
  });
});

describe('per-class opt-out — all disabled', () => {
  it('does not generate with, equals, or toString', async () => {
    const { Minimal } = await import('./fixtures/all-disabled.ts');
    const instance = new Minimal({ name: 'Alice', value: 42 });
    expect((instance as any).with).toBeUndefined();
    expect((instance as any).equals).toBeUndefined();
    expect(instance.toString()).not.toContain('Alice');
  });

  it('is still frozen with readonly properties', async () => {
    const { Minimal } = await import('./fixtures/all-disabled.ts');
    const instance = new Minimal({ name: 'Alice', value: 42 });
    expect(Object.isFrozen(instance)).toBe(true);
    expect(instance.name).toBe('Alice');
    expect(instance.value).toBe(42);
  });
});

describe('config file — project-wide defaults', () => {
  function withTempDir(fn: (dir: string) => void | Promise<void>) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'freezedts-behavior-'));
    try {
      return fn(dir);
    } finally {
      fs.rmSync(dir, { recursive: true });
    }
  }

  it('config copyWith: false disables with() for all classes', () => {
    withTempDir((dir) => {
      const sourceFile = path.join(dir, 'person.ts');
      fs.writeFileSync(sourceFile, `
        import { freezed } from 'freezedts';

        @freezed()
        class Person {
          constructor(params: { name: string }) {}
        }
      `);

      generate([sourceFile], { format: false, copyWith: false, equal: true, toString: true });

      const content = fs.readFileSync(path.join(dir, 'person.freezed.ts'), 'utf-8');
      expect(content).not.toContain('get with()');
      expect(content).toContain('equals(other: unknown)');
    });
  });

  it('per-class copyWith: true overrides config copyWith: false', () => {
    withTempDir((dir) => {
      const sourceFile = path.join(dir, 'person.ts');
      fs.writeFileSync(sourceFile, `
        import { freezed } from 'freezedts';

        @freezed({ copyWith: true })
        class Person {
          constructor(params: { name: string }) {}
        }
      `);

      generate([sourceFile], { format: false, copyWith: false, equal: true, toString: true });

      const content = fs.readFileSync(path.join(dir, 'person.freezed.ts'), 'utf-8');
      expect(content).toContain('get with()');
      expect(content).toContain('PersonWith<');
    });
  });

  it('config equal: false disables equals() for all classes', () => {
    withTempDir((dir) => {
      const sourceFile = path.join(dir, 'person.ts');
      fs.writeFileSync(sourceFile, `
        import { freezed } from 'freezedts';

        @freezed()
        class Person {
          constructor(params: { name: string }) {}
        }
      `);

      generate([sourceFile], { format: false, copyWith: true, equal: false, toString: true });

      const content = fs.readFileSync(path.join(dir, 'person.freezed.ts'), 'utf-8');
      expect(content).toContain('get with()');
      expect(content).not.toContain('equals(other: unknown)');
    });
  });

  it('config toString: false disables toString() for all classes', () => {
    withTempDir((dir) => {
      const sourceFile = path.join(dir, 'person.ts');
      fs.writeFileSync(sourceFile, `
        import { freezed } from 'freezedts';

        @freezed()
        class Person {
          constructor(params: { name: string }) {}
        }
      `);

      generate([sourceFile], { format: false, copyWith: true, equal: true, toString: false });

      const content = fs.readFileSync(path.join(dir, 'person.freezed.ts'), 'utf-8');
      expect(content).not.toContain('toString(): string');
      expect(content).toContain('equals(other: unknown)');
      expect(content).toContain('get with()');
    });
  });

  it('format: true produces formatted output', () => {
    withTempDir((dir) => {
      const sourceFile = path.join(dir, 'person.ts');
      fs.writeFileSync(sourceFile, `
        import { freezed } from 'freezedts';

        @freezed()
        class Person {
          constructor(params: { name: string }) {}
        }
      `);

      generate([sourceFile], { format: true, copyWith: true, equal: true, toString: true });

      const content = fs.readFileSync(path.join(dir, 'person.freezed.ts'), 'utf-8');
      // Formatted output uses standard TypeScript formatting
      expect(content).toContain('export abstract class $Person');
      // Should be valid — no broken syntax from formatting
      expect(content).toContain('Object.freeze(this)');
    });
  });
});

describe('config -- imported type interaction', () => {
  it('equal:false still freezes imported-type fields', async () => {
    const { Pin } = await import('./fixtures/no-equal-imported.ts');
    const pin = new Pin({ label: 'a', position: { x: 1, y: 2 } });
    expect(Object.isFrozen(pin.position)).toBe(true);
  });

  it('equal:false -- no equals method with imported type', async () => {
    const { Pin } = await import('./fixtures/no-equal-imported.ts');
    const pin = new Pin({ label: 'a', position: { x: 1, y: 2 } });
    expect((pin as any).equals).toBeUndefined();
  });

  it('copyWith:false still freezes imported-type fields', async () => {
    const { Marker } = await import('./fixtures/no-copy-with-imported.ts');
    const marker = new Marker({ label: 'a', position: { x: 1, y: 2 } });
    expect(Object.isFrozen(marker.position)).toBe(true);
  });

  it('copyWith:false -- no with method with imported type', async () => {
    const { Marker } = await import('./fixtures/no-copy-with-imported.ts');
    const marker = new Marker({ label: 'a', position: { x: 1, y: 2 } });
    expect((marker as any).with).toBeUndefined();
  });

  it('generated file for imported type with equal:false omits equals but retains import', () => {
    const content = fs.readFileSync(
      path.join(fixturesDir, 'no-equal-imported.freezed.ts'), 'utf-8',
    );
    expect(content).toContain("import type { Coord }");
    expect(content).not.toContain('equals(other');
  });

  it('generated file for imported type with copyWith:false omits with but retains import', () => {
    const content = fs.readFileSync(
      path.join(fixturesDir, 'no-copy-with-imported.freezed.ts'), 'utf-8',
    );
    expect(content).toContain("import type { Coord }");
    expect(content).not.toContain('get with()');
  });
});
