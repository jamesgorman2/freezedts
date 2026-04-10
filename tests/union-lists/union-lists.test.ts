import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/union-lists/fixtures/collection.ts'),
  ]);
});

describe('union lists (A | B)[]', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/union-lists/fixtures/collection.freezed.ts'),
      'utf-8',
    );
  }

  it('imports Alpha from its source module', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Alpha } from './alpha.js';");
  });

  it('imports Beta from its source module', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Beta } from './beta.js';");
  });

  it('preserves (Alpha | Beta)[] in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('items: (Alpha | Beta)[]');
  });

  it('preserves (Alpha | null)[] in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('nullables: (Alpha | null)[]');
  });

  it('constructs with mixed union array', async () => {
    const { Collection } = await import('./fixtures/collection.ts');
    const c = new Collection({
      items: [
        { kind: 'alpha', value: 'x' },
        { kind: 'beta', count: 1 },
      ],
      nullables: [{ kind: 'alpha', value: 'y' }, null],
    });
    expect(c.items).toHaveLength(2);
    expect(c.nullables).toHaveLength(2);
    expect(Object.isFrozen(c)).toBe(true);
  });

  it('freezes union array elements', async () => {
    const { Collection } = await import('./fixtures/collection.ts');
    const c = new Collection({
      items: [{ kind: 'alpha', value: 'x' }],
      nullables: [],
    });
    expect(() => (c.items as any[]).push({ kind: 'beta', count: 2 })).toThrow();
  });

  it('equals works for union arrays', async () => {
    const { Collection } = await import('./fixtures/collection.ts');
    const a = new Collection({
      items: [{ kind: 'alpha', value: 'x' }],
      nullables: [null],
    });
    const b = new Collection({
      items: [{ kind: 'alpha', value: 'x' }],
      nullables: [null],
    });
    expect(a.equals(b)).toBe(true);
  });

  it('equals detects differences in union arrays', async () => {
    const { Collection } = await import('./fixtures/collection.ts');
    const a = new Collection({
      items: [{ kind: 'alpha', value: 'x' }],
      nullables: [],
    });
    const b = new Collection({
      items: [{ kind: 'beta', count: 1 }],
      nullables: [],
    });
    expect(a.equals(b)).toBe(false);
  });
});
