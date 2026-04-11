import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/transient-types/fixtures/board.ts'),
  ]);
});

describe('transient type imports', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/transient-types/fixtures/board.freezed.ts'),
      'utf-8',
    );
  }

  it('imports the type alias name, not the underlying type name', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Feature } from './external/types.js'");
    expect(generated).not.toMatch(/import[^;]*BaseModel/);
  });

  it('imports from the alias module path, not the underlying type path', () => {
    const generated = readGenerated();
    expect(generated).toContain("from './external/types.js'");
    expect(generated).not.toContain("from './external/base-model.js'");
  });

  it('uses the alias name in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('feature: Feature');
    expect(generated).toContain('features: Feature[]');
    expect(generated).not.toContain('BaseModel');
  });
});

describe('transient types -- runtime behavior', () => {
  it('constructs with transient type values', async () => {
    const { Board } = await import('./fixtures/board.ts');
    const b = new Board({
      feature: { id: '1', name: 'x' },
      features: [{ id: '2', name: 'y' }],
    });
    expect(b.feature.id).toBe('1');
    expect(b.features[0].name).toBe('y');
  });

  it('instance and feature values are frozen', async () => {
    const { Board } = await import('./fixtures/board.ts');
    const b = new Board({
      feature: { id: '1', name: 'x' },
      features: [{ id: '2', name: 'y' }],
    });
    expect(Object.isFrozen(b)).toBe(true);
    expect(Object.isFrozen(b.feature)).toBe(true);
    expect(Object.isFrozen(b.features)).toBe(true);
  });

  it('features array is frozen', async () => {
    const { Board } = await import('./fixtures/board.ts');
    const b = new Board({
      feature: { id: '1', name: 'x' },
      features: [{ id: '2', name: 'y' }],
    });
    expect(() => (b.features as any[]).push({ id: '3', name: 'z' })).toThrow();
  });

  it('equals works with transient types', async () => {
    const { Board } = await import('./fixtures/board.ts');
    const a = new Board({ feature: { id: '1', name: 'x' }, features: [] });
    const b = new Board({ feature: { id: '1', name: 'x' }, features: [] });
    expect(a.equals(b)).toBe(true);
    const c = new Board({ feature: { id: '2', name: 'y' }, features: [] });
    expect(a.equals(c)).toBe(false);
  });

  it('with() replaces feature field', async () => {
    const { Board } = await import('./fixtures/board.ts');
    const b = new Board({ feature: { id: '1', name: 'x' }, features: [] });
    const b2 = b.with({ feature: { id: '3', name: 'z' } });
    expect(b2.feature.id).toBe('3');
    expect(Object.isFrozen(b2)).toBe(true);
    expect(b.feature.id).toBe('1');
  });

  it('toString includes feature fields', async () => {
    const { Board } = await import('./fixtures/board.ts');
    const b = new Board({ feature: { id: '1', name: 'x' }, features: [] });
    expect(b.toString()).toContain('Board(');
  });
});
