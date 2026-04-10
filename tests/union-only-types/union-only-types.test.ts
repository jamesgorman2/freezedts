import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/union-only-types/fixtures/holder.ts'),
  ]);
});

describe('union-only types (A | B where A and B only appear in the union)', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/union-only-types/fixtures/holder.freezed.ts'),
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

  it('preserves A | B in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('ab: Alpha | Beta');
  });

  it('does not import the union itself as a single symbol', () => {
    const generated = readGenerated();
    // Should not try to import "Alpha | Beta" as one thing
    expect(generated).not.toMatch(/import[^;]*Alpha \| Beta/);
  });

  it('constructs with Alpha variant', async () => {
    const { Holder } = await import('./fixtures/holder.ts');
    const h = new Holder({ ab: { kind: 'alpha', value: 'hello' } });
    expect(h.ab).toEqual({ kind: 'alpha', value: 'hello' });
    expect(Object.isFrozen(h)).toBe(true);
  });

  it('constructs with Beta variant', async () => {
    const { Holder } = await import('./fixtures/holder.ts');
    const h = new Holder({ ab: { kind: 'beta', count: 42 } });
    expect(h.ab).toEqual({ kind: 'beta', count: 42 });
  });

  it('equals works across union variants', async () => {
    const { Holder } = await import('./fixtures/holder.ts');
    const a = new Holder({ ab: { kind: 'alpha', value: 'x' } });
    const b = new Holder({ ab: { kind: 'alpha', value: 'x' } });
    const c = new Holder({ ab: { kind: 'beta', count: 1 } });
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('with() works for union property', async () => {
    const { Holder } = await import('./fixtures/holder.ts');
    const h1 = new Holder({ ab: { kind: 'alpha', value: 'x' } });
    const h2 = h1.with({ ab: { kind: 'beta', count: 5 } });
    expect(h2.ab).toEqual({ kind: 'beta', count: 5 });
    expect(h2).not.toBe(h1);
  });
});
