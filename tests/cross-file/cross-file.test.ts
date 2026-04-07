import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../src/generator/generator.js';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/cross-file/fixtures/inner.ts'),
    path.resolve('tests/cross-file/fixtures/outer.ts'),
  ]);
});

describe('cross-file @freezed references', () => {
  it('creates instances with cross-file nested @freezed properties', async () => {
    const { Inner } = await import('./fixtures/inner.ts');
    const { Outer } = await import('./fixtures/outer.ts');
    const inner = new Inner({ value: 'hello' });
    const outer = new Outer({ name: 'test', inner });
    expect(outer.name).toBe('test');
    expect(outer.inner.value).toBe('hello');
    expect(Object.isFrozen(outer)).toBe(true);
  });

  it('deep copy works across files via with()', async () => {
    const { Inner } = await import('./fixtures/inner.ts');
    const { Outer } = await import('./fixtures/outer.ts');
    const inner = new Inner({ value: 'hello' });
    const outer = new Outer({ name: 'test', inner });
    const updated = outer.with.inner({ value: 'world' });
    expect(updated.inner.value).toBe('world');
    expect(updated.name).toBe('test');
    expect(updated).not.toBe(outer);
    expect(Object.isFrozen(updated)).toBe(true);
  });

  it('equals works across files', async () => {
    const { Inner } = await import('./fixtures/inner.ts');
    const { Outer } = await import('./fixtures/outer.ts');
    const a = new Outer({ name: 'x', inner: new Inner({ value: 'y' }) });
    const b = new Outer({ name: 'x', inner: new Inner({ value: 'y' }) });
    expect(a.equals(b)).toBe(true);
  });

  it('equals detects cross-file nested differences', async () => {
    const { Inner } = await import('./fixtures/inner.ts');
    const { Outer } = await import('./fixtures/outer.ts');
    const a = new Outer({ name: 'x', inner: new Inner({ value: 'y' }) });
    const b = new Outer({ name: 'x', inner: new Inner({ value: 'z' }) });
    expect(a.equals(b)).toBe(false);
  });
});
