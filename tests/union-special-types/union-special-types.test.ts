import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/union-special-types/fixtures/loose.ts'),
  ]);
});

describe('union with undefined and any', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/union-special-types/fixtures/loose.freezed.ts'),
      'utf-8',
    );
  }

  it('preserves string | undefined in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('maybe: string | undefined');
  });

  it('preserves any in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('anything: any');
  });

  it('preserves Alpha | undefined in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('unionUndef: Alpha | undefined');
  });

  it('imports Alpha for the union with undefined', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Alpha } from './alpha.js';");
  });

  it('does not import undefined or any', () => {
    const generated = readGenerated();
    const importLines = generated.split('\n').filter(l =>
      l.startsWith('import') && l.includes('from'),
    );
    for (const line of importLines) {
      const braceContent = line.match(/\{([^}]+)\}/)?.[1] ?? '';
      expect(braceContent).not.toContain('undefined');
      expect(braceContent).not.toContain('any');
    }
  });

  it('constructs with undefined values', async () => {
    const { Loose } = await import('./fixtures/loose.ts');
    const l = new Loose({ maybe: undefined, anything: null, unionUndef: undefined });
    expect(l.maybe).toBeUndefined();
    expect(l.anything).toBeNull();
    expect(l.unionUndef).toBeUndefined();
    expect(Object.isFrozen(l)).toBe(true);
  });

  it('constructs with populated values', async () => {
    const { Loose } = await import('./fixtures/loose.ts');
    const l = new Loose({
      maybe: 'hello',
      anything: { nested: [1, 2] },
      unionUndef: { kind: 'alpha', value: 'test' },
    });
    expect(l.maybe).toBe('hello');
    expect(l.anything).toEqual({ nested: [1, 2] });
    expect(l.unionUndef).toEqual({ kind: 'alpha', value: 'test' });
  });

  it('equals works with undefined fields', async () => {
    const { Loose } = await import('./fixtures/loose.ts');
    const a = new Loose({ maybe: undefined, anything: 42, unionUndef: undefined });
    const b = new Loose({ maybe: undefined, anything: 42, unionUndef: undefined });
    expect(a.equals(b)).toBe(true);
  });

  it('equals detects difference in any-typed field', async () => {
    const { Loose } = await import('./fixtures/loose.ts');
    const a = new Loose({ maybe: 'x', anything: 'a', unionUndef: undefined });
    const b = new Loose({ maybe: 'x', anything: 'b', unionUndef: undefined });
    expect(a.equals(b)).toBe(false);
  });

  it('equals detects difference in Alpha union values', async () => {
    const { Loose } = await import('./fixtures/loose.ts');
    const a = new Loose({
      maybe: 'x', anything: 42,
      unionUndef: { kind: 'alpha', value: 'x' },
    });
    const b = new Loose({
      maybe: 'x', anything: 42,
      unionUndef: { kind: 'alpha', value: 'y' },
    });
    expect(a.equals(b)).toBe(false);
  });

  it('equals returns true for identical Alpha values', async () => {
    const { Loose } = await import('./fixtures/loose.ts');
    const a = new Loose({
      maybe: 'x', anything: 42,
      unionUndef: { kind: 'alpha', value: 'same' },
    });
    const b = new Loose({
      maybe: 'x', anything: 42,
      unionUndef: { kind: 'alpha', value: 'same' },
    });
    expect(a.equals(b)).toBe(true);
  });
});
