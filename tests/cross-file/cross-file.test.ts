import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as path from 'node:path';
import * as fs from 'node:fs';

beforeAll(() => {
  generate([
    path.resolve('tests/cross-file/fixtures/inner.ts'),
    path.resolve('tests/cross-file/fixtures/outer.ts'),
    path.resolve('tests/cross-file/fixtures/place.ts'),
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

describe('cross-file -- non-freezed imported type', () => {
  it('constructs with cross-file imported interface field', async () => {
    const { Place } = await import('./fixtures/place.ts');
    const p = new Place({ name: 'park', location: { x: 1, y: 2 } });
    expect(p.name).toBe('park');
    expect(p.location).toEqual({ x: 1, y: 2 });
  });

  it('imported interface field is frozen', async () => {
    const { Place } = await import('./fixtures/place.ts');
    const p = new Place({ name: 'park', location: { x: 1, y: 2 } });
    expect(Object.isFrozen(p.location)).toBe(true);
  });

  it('with() replaces imported interface field', async () => {
    const { Place } = await import('./fixtures/place.ts');
    const p = new Place({ name: 'park', location: { x: 1, y: 2 } });
    const p2 = p.with({ location: { x: 9, y: 9 } });
    expect(p2.location).toEqual({ x: 9, y: 9 });
    expect(p2).not.toBe(p);
  });

  it('equals works with imported interface field', async () => {
    const { Place } = await import('./fixtures/place.ts');
    const a = new Place({ name: 'park', location: { x: 1, y: 2 } });
    const b = new Place({ name: 'park', location: { x: 1, y: 2 } });
    expect(a.equals(b)).toBe(true);
    const c = new Place({ name: 'park', location: { x: 9, y: 9 } });
    expect(a.equals(c)).toBe(false);
  });

  it('generated file imports non-freezed type', () => {
    const content = fs.readFileSync(
      path.resolve('tests/cross-file/fixtures/place.freezed.ts'), 'utf-8',
    );
    expect(content).toContain("import type { Coord } from './coord.js'");
  });

  it('generated file does NOT produce a CoordWith type', () => {
    const content = fs.readFileSync(
      path.resolve('tests/cross-file/fixtures/place.freezed.ts'), 'utf-8',
    );
    expect(content).not.toContain('CoordWith');
  });
});
