import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/complex-generics/fixtures/complex.ts'),
  ]);
});

describe('complex types in generics', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/complex-generics/fixtures/complex.freezed.ts'),
      'utf-8',
    );
  }

  // --- A<B | C> ---

  it('imports Wrapper for A<B | C>', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Wrapper } from './wrapper.js';");
  });

  it('imports Alpha for A<B | C>', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Alpha } from './alpha.js';");
  });

  it('imports Beta for A<B | C>', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Beta } from './beta.js';");
  });

  it('preserves Wrapper<Alpha | Beta> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('unionGeneric: Wrapper<Alpha | Beta>');
  });

  // --- A<B | null> ---

  it('preserves Wrapper<Alpha | null> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('nullableGeneric: Wrapper<Alpha | null>');
  });

  it('does not import null as a type', () => {
    const generated = readGenerated();
    const importLines = generated.split('\n').filter(l =>
      l.startsWith('import') && l.includes('from'),
    );
    for (const line of importLines) {
      const braceContent = line.match(/\{([^}]+)\}/)?.[1] ?? '';
      expect(braceContent).not.toMatch(/\bnull\b/);
    }
  });

  // --- A<B[]> ---

  it('preserves Wrapper<Alpha[]> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('arrayGeneric: Wrapper<Alpha[]>');
  });

  it('does not put [] in import symbols', () => {
    const generated = readGenerated();
    const importLines = generated.split('\n').filter(l =>
      l.startsWith('import') && l.includes('from'),
    );
    for (const line of importLines) {
      const braceContent = line.match(/\{([^}]+)\}/)?.[1] ?? '';
      expect(braceContent).not.toContain('[]');
    }
  });

  // --- runtime behaviour ---

  it('constructs with Wrapper<Alpha | Beta>', async () => {
    const { Complex } = await import('./fixtures/complex.ts');
    const c = new Complex({
      unionGeneric: { value: { kind: 'alpha', value: 'x' }, label: 'ug' },
      nullableGeneric: { value: { kind: 'alpha', value: 'y' }, label: 'ng' },
      arrayGeneric: { value: [{ kind: 'alpha', value: 'z' }], label: 'ag' },
    });
    expect(c.unionGeneric.value).toEqual({ kind: 'alpha', value: 'x' });
    expect(Object.isFrozen(c)).toBe(true);
  });

  it('constructs with Wrapper<null>', async () => {
    const { Complex } = await import('./fixtures/complex.ts');
    const c = new Complex({
      unionGeneric: { value: { kind: 'beta', count: 1 }, label: 'ug' },
      nullableGeneric: { value: null, label: 'ng' },
      arrayGeneric: { value: [], label: 'ag' },
    });
    expect(c.nullableGeneric.value).toBeNull();
  });

  it('equals works with complex generic types', async () => {
    const { Complex } = await import('./fixtures/complex.ts');
    const params = {
      unionGeneric: { value: { kind: 'alpha' as const, value: 'x' }, label: 'ug' },
      nullableGeneric: { value: null, label: 'ng' },
      arrayGeneric: { value: [{ kind: 'alpha' as const, value: 'z' }], label: 'ag' },
    };
    const a = new Complex(params);
    const b = new Complex(params);
    expect(a.equals(b)).toBe(true);
  });
});
