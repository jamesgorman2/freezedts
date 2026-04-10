import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/anonymous-objects/fixtures/with-objects.ts'),
  ]);
});

describe('anonymous object types', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/anonymous-objects/fixtures/with-objects.freezed.ts'),
      'utf-8',
    );
  }

  // --- shallow anonymous object ---

  it('preserves shallow anonymous object type in generated output', () => {
    const generated = readGenerated();
    expect(generated).toContain('shallow: { x: number; y: number }');
  });

  // --- deep anonymous object ---

  it('preserves deep anonymous object type in generated output', () => {
    const generated = readGenerated();
    expect(generated).toContain('deep: { outer: { inner: string; count: number } }');
  });

  // --- anonymous object with imported types ---

  it('preserves anonymous object with imported type in generated output', () => {
    const generated = readGenerated();
    expect(generated).toContain('withImported: { position: Coord; label: string }');
  });

  it('imports Coord for anonymous object containing imported type', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Coord } from './coord.js';");
  });

  it('preserves anonymous object with imported array type in generated output', () => {
    const generated = readGenerated();
    expect(generated).toContain('withExternal: { tags: Tag[]; active: boolean }');
  });

  it('imports Tag for anonymous object containing imported array type', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Tag } from './tag.js';");
  });

  // --- Params type matches property types ---

  it('Params type contains the same anonymous object types as properties', () => {
    const generated = readGenerated();
    // Extract the Params type block (lines between the type declaration and its closing };)
    const lines = generated.split('\n');
    const startIdx = lines.findIndex(l => l.includes('export type WithObjectsParams'));
    const paramsLines = lines.slice(startIdx, startIdx + 6).join('\n');
    expect(paramsLines).toContain('shallow: { x: number; y: number }');
    expect(paramsLines).toContain('deep: { outer: { inner: string; count: number } }');
    expect(paramsLines).toContain('withImported: { position: Coord; label: string }');
  });

  // --- runtime behaviour ---

  it('constructs with shallow anonymous object', async () => {
    const { WithObjects } = await import('./fixtures/with-objects.ts');
    const wo = new WithObjects({
      shallow: { x: 1, y: 2 },
      deep: { outer: { inner: 'hello', count: 3 } },
      withImported: { position: { x: 10, y: 20 }, label: 'origin' },
      withExternal: { tags: [{ key: 'a', value: 'b' }], active: true },
    });
    expect(wo.shallow).toEqual({ x: 1, y: 2 });
    expect(Object.isFrozen(wo)).toBe(true);
  });

  it('freezes nested anonymous objects deeply', async () => {
    const { WithObjects } = await import('./fixtures/with-objects.ts');
    const wo = new WithObjects({
      shallow: { x: 1, y: 2 },
      deep: { outer: { inner: 'hello', count: 3 } },
      withImported: { position: { x: 10, y: 20 }, label: 'origin' },
      withExternal: { tags: [{ key: 'a', value: 'b' }], active: true },
    });
    expect(() => { (wo.shallow as any).x = 99; }).toThrow();
    expect(() => { (wo.deep.outer as any).inner = 'changed'; }).toThrow();
  });

  it('equals works with anonymous object types', async () => {
    const { WithObjects } = await import('./fixtures/with-objects.ts');
    const params = {
      shallow: { x: 1, y: 2 },
      deep: { outer: { inner: 'hello', count: 3 } },
      withImported: { position: { x: 10, y: 20 }, label: 'origin' },
      withExternal: { tags: [{ key: 'a', value: 'b' }], active: true },
    };
    const a = new WithObjects(params);
    const b = new WithObjects(params);
    expect(a.equals(b)).toBe(true);
  });

  it('equals detects differences in nested anonymous object', async () => {
    const { WithObjects } = await import('./fixtures/with-objects.ts');
    const base = {
      shallow: { x: 1, y: 2 },
      deep: { outer: { inner: 'hello', count: 3 } },
      withImported: { position: { x: 10, y: 20 }, label: 'origin' },
      withExternal: { tags: [{ key: 'a', value: 'b' }], active: true },
    };
    const a = new WithObjects(base);
    const b = new WithObjects({ ...base, deep: { outer: { inner: 'world', count: 3 } } });
    expect(a.equals(b)).toBe(false);
  });

  it('with() works for anonymous object properties', async () => {
    const { WithObjects } = await import('./fixtures/with-objects.ts');
    const wo = new WithObjects({
      shallow: { x: 1, y: 2 },
      deep: { outer: { inner: 'hello', count: 3 } },
      withImported: { position: { x: 10, y: 20 }, label: 'origin' },
      withExternal: { tags: [], active: false },
    });
    const updated = wo.with({ shallow: { x: 99, y: 100 } });
    expect(updated.shallow).toEqual({ x: 99, y: 100 });
    expect(updated.deep).toEqual(wo.deep);
    expect(updated).not.toBe(wo);
  });
});
