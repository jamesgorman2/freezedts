import { describe, it, expect, beforeAll } from 'bun:test';
import * as path from 'node:path';
import { generate } from '../../src/generator/generator.js';

const fixturesDir = path.resolve(import.meta.dirname, 'fixtures');

beforeAll(() => {
  generate([
    path.join(fixturesDir, 'same-file.ts'),
    path.join(fixturesDir, 'imported.ts'),
  ]);
});

describe('interface params', () => {
  it('works with a same-file interface as constructor params type', async () => {
    const { Person } = await import('./fixtures/same-file.ts');
    const p = new Person({ name: 'Alice', age: 30 });
    expect(p.name).toBe('Alice');
    expect(p.age).toBe(30);
    expect(Object.isFrozen(p)).toBe(true);
  });

  it('with() works with same-file interface params', async () => {
    const { Person } = await import('./fixtures/same-file.ts');
    const p1 = new Person({ name: 'Alice', age: 30 });
    const p2 = p1.with({ name: 'Bob' });
    expect(p2.name).toBe('Bob');
    expect(p2.age).toBe(30);
    expect(p2).not.toBe(p1);
  });

  it('equals() works with same-file interface params', async () => {
    const { Person } = await import('./fixtures/same-file.ts');
    const a = new Person({ name: 'Alice', age: 30 });
    const b = new Person({ name: 'Alice', age: 30 });
    expect(a.equals(b)).toBe(true);
    expect(a.equals(new Person({ name: 'Bob', age: 30 }))).toBe(false);
  });

  it('works with an interface imported from another file', async () => {
    const { Address } = await import('./fixtures/imported.ts');
    const a = new Address({ street: '123 Main', city: 'Springfield' });
    expect(a.street).toBe('123 Main');
    expect(a.city).toBe('Springfield');
    expect(a.zip).toBeUndefined();
    expect(Object.isFrozen(a)).toBe(true);
  });

  it('with() works with imported interface params', async () => {
    const { Address } = await import('./fixtures/imported.ts');
    const a1 = new Address({ street: '123 Main', city: 'Springfield' });
    const a2 = a1.with({ zip: '62701' });
    expect(a2.zip).toBe('62701');
    expect(a2.street).toBe('123 Main');
    expect(a2).not.toBe(a1);
  });

  it('equals() works with imported interface params', async () => {
    const { Address } = await import('./fixtures/imported.ts');
    const a = new Address({ street: '123 Main', city: 'Springfield' });
    const b = new Address({ street: '123 Main', city: 'Springfield' });
    expect(a.equals(b)).toBe(true);
  });
});
