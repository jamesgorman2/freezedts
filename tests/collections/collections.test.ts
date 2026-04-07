import { describe, it, expect, beforeAll } from 'bun:test';
import * as path from 'node:path';
import { generate } from '../../src/generator/generator.js';

const fixturesDir = path.resolve(import.meta.dirname, 'fixtures');

beforeAll(() => {
  generate([
    path.join(fixturesDir, 'arrays.ts'),
    path.join(fixturesDir, 'maps-sets.ts'),
    path.join(fixturesDir, 'nested-collections.ts'),
  ]);
});

describe('collection safety — arrays', () => {
  it('freezes array properties so push throws', async () => {
    const { Team } = await import('./fixtures/arrays.ts');
    const t = new Team({ name: 'A', members: ['Alice', 'Bob'], scores: [10, 20] });
    expect(() => (t.members as string[]).push('Charlie')).toThrow();
  });

  it('freezes array properties so index assignment throws', async () => {
    const { Team } = await import('./fixtures/arrays.ts');
    const t = new Team({ name: 'A', members: ['Alice'], scores: [10] });
    expect(() => { (t.members as any)[0] = 'Zara'; }).toThrow();
  });

  it('preserves array values after freezing', async () => {
    const { Team } = await import('./fixtures/arrays.ts');
    const t = new Team({ name: 'A', members: ['Alice', 'Bob'], scores: [10, 20] });
    expect(t.members).toEqual(['Alice', 'Bob']);
    expect(t.scores).toEqual([10, 20]);
  });

  it('freezes the original array passed in (reference types are frozen in-place)', async () => {
    const { Team } = await import('./fixtures/arrays.ts');
    const members = ['Alice', 'Bob'];
    const t = new Team({ name: 'A', members, scores: [10] });
    // Original array is also frozen because JavaScript arrays are reference types
    // and Object.freeze mutates them in-place — this is the safer behavior for immutable data classes
    expect(() => members.push('Charlie')).toThrow();
    expect(t.members).toEqual(['Alice', 'Bob']);
  });
});

describe('collection safety — Map and Set', () => {
  it('freezes Map so set() throws', async () => {
    const { Registry } = await import('./fixtures/maps-sets.ts');
    const r = new Registry({
      lookup: new Map([['a', 1]]),
      tags: new Set(['x']),
    });
    expect(() => r.lookup.set('b', 2)).toThrow();
  });

  it('freezes Map so delete() throws', async () => {
    const { Registry } = await import('./fixtures/maps-sets.ts');
    const r = new Registry({
      lookup: new Map([['a', 1]]),
      tags: new Set(['x']),
    });
    expect(() => r.lookup.delete('a')).toThrow();
  });

  it('freezes Set so add() throws', async () => {
    const { Registry } = await import('./fixtures/maps-sets.ts');
    const r = new Registry({
      lookup: new Map([['a', 1]]),
      tags: new Set(['x']),
    });
    expect(() => r.tags.add('y')).toThrow();
  });

  it('freezes Set so delete() throws', async () => {
    const { Registry } = await import('./fixtures/maps-sets.ts');
    const r = new Registry({
      lookup: new Map([['a', 1]]),
      tags: new Set(['x']),
    });
    expect(() => r.tags.delete('x')).toThrow();
  });

  it('preserves Map and Set values after freezing', async () => {
    const { Registry } = await import('./fixtures/maps-sets.ts');
    const r = new Registry({
      lookup: new Map([['a', 1], ['b', 2]]),
      tags: new Set(['x', 'y']),
    });
    expect(r.lookup.get('a')).toBe(1);
    expect(r.lookup.get('b')).toBe(2);
    expect(r.lookup.size).toBe(2);
    expect(r.tags.has('x')).toBe(true);
    expect(r.tags.has('y')).toBe(true);
    expect(r.tags.size).toBe(2);
  });
});

describe('collection safety — nested collections', () => {
  it('freezes nested arrays inside arrays', async () => {
    const { Matrix } = await import('./fixtures/nested-collections.ts');
    const m = new Matrix({
      grid: [[1, 2], [3, 4]],
      metadata: { label: 'test', values: [10, 20] },
    });
    // Outer array frozen
    expect(() => (m.grid as number[][]).push([5, 6])).toThrow();
    // Inner arrays frozen
    expect(() => { (m.grid[0] as any)[0] = 99; }).toThrow();
    expect(() => (m.grid[0] as number[]).push(99)).toThrow();
  });

  it('freezes plain objects and their nested collections', async () => {
    const { Matrix } = await import('./fixtures/nested-collections.ts');
    const m = new Matrix({
      grid: [[1]],
      metadata: { label: 'test', values: [10, 20] },
    });
    // Object itself frozen
    expect(() => { (m.metadata as any).label = 'changed'; }).toThrow();
    // Array inside object frozen
    expect(() => (m.metadata.values as number[]).push(30)).toThrow();
  });

  it('preserves nested values after freezing', async () => {
    const { Matrix } = await import('./fixtures/nested-collections.ts');
    const m = new Matrix({
      grid: [[1, 2], [3, 4]],
      metadata: { label: 'test', values: [10, 20] },
    });
    expect(m.grid).toEqual([[1, 2], [3, 4]]);
    expect(m.metadata).toEqual({ label: 'test', values: [10, 20] });
  });
});

describe('collection safety — with() copies', () => {
  it('with() produces a new instance with frozen collections', async () => {
    const { Team } = await import('./fixtures/arrays.ts');
    const t1 = new Team({ name: 'A', members: ['Alice'], scores: [10] });
    const t2 = t1.with({ members: ['Bob', 'Charlie'] });
    expect(t2.members).toEqual(['Bob', 'Charlie']);
    expect(() => (t2.members as string[]).push('Dave')).toThrow();
  });
});
