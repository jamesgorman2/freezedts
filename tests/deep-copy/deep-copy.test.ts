import { describe, it, expect, beforeAll } from 'bun:test';
import * as path from 'node:path';
import { generate } from '../../src/generator/generator.js';

const fixturesDir = path.resolve(import.meta.dirname, 'fixtures');

beforeAll(() => {
  generate([path.join(fixturesDir, 'company.ts')]);
});

describe('deep with() — shallow still works', () => {
  it('with() called directly returns a new instance with overrides', async () => {
    const { Assistant, Director, Company } = await import('./fixtures/company.ts');
    const a = new Assistant({ name: 'Alice' });
    const d = new Director({ name: 'Bob', assistant: a });
    const c = new Company({ name: 'Acme', director: d });
    const c2 = c.with({ name: 'NewCo' });
    expect(c2.name).toBe('NewCo');
    expect(c2.director).toBe(d);
    expect(c2).not.toBe(c);
    expect(Object.isFrozen(c2)).toBe(true);
  });

  it('with() on a leaf class still works', async () => {
    const { Assistant } = await import('./fixtures/company.ts');
    const a = new Assistant({ name: 'Alice' });
    const a2 = a.with({ name: 'Bob' });
    expect(a2.name).toBe('Bob');
    expect(a2).not.toBe(a);
  });
});

describe('deep with() — one level deep', () => {
  it('updates a nested @freezed property', async () => {
    const { Assistant, Director, Company } = await import('./fixtures/company.ts');
    const a = new Assistant({ name: 'Alice' });
    const d = new Director({ name: 'Bob', assistant: a });
    const c = new Company({ name: 'Acme', director: d });
    const c2 = c.with.director({ name: 'Carol' });
    expect(c2.name).toBe('Acme');
    expect(c2.director.name).toBe('Carol');
    expect(c2.director.assistant).toBe(a);
  });

  it('returns a new root instance', async () => {
    const { Assistant, Director, Company } = await import('./fixtures/company.ts');
    const a = new Assistant({ name: 'Alice' });
    const d = new Director({ name: 'Bob', assistant: a });
    const c = new Company({ name: 'Acme', director: d });
    const c2 = c.with.director({ name: 'Carol' });
    expect(c2).not.toBe(c);
    expect(c2).toBeInstanceOf(Company);
    expect(Object.isFrozen(c2)).toBe(true);
  });

  it('creates a new nested instance', async () => {
    const { Assistant, Director, Company } = await import('./fixtures/company.ts');
    const a = new Assistant({ name: 'Alice' });
    const d = new Director({ name: 'Bob', assistant: a });
    const c = new Company({ name: 'Acme', director: d });
    const c2 = c.with.director({ name: 'Carol' });
    expect(c2.director).not.toBe(d);
    expect(c2.director).toBeInstanceOf(Director);
    expect(Object.isFrozen(c2.director)).toBe(true);
  });

  it('does not modify the original', async () => {
    const { Assistant, Director, Company } = await import('./fixtures/company.ts');
    const a = new Assistant({ name: 'Alice' });
    const d = new Director({ name: 'Bob', assistant: a });
    const c = new Company({ name: 'Acme', director: d });
    c.with.director({ name: 'Carol' });
    expect(c.director.name).toBe('Bob');
  });
});

describe('deep with() — two levels deep', () => {
  it('updates a deeply nested @freezed property', async () => {
    const { Assistant, Director, Company } = await import('./fixtures/company.ts');
    const a = new Assistant({ name: 'Alice' });
    const d = new Director({ name: 'Bob', assistant: a });
    const c = new Company({ name: 'Acme', director: d });
    const c2 = c.with.director.assistant({ name: 'Eve' });
    expect(c2.name).toBe('Acme');
    expect(c2.director.name).toBe('Bob');
    expect(c2.director.assistant.name).toBe('Eve');
  });

  it('returns a new root instance with all intermediates rebuilt', async () => {
    const { Assistant, Director, Company } = await import('./fixtures/company.ts');
    const a = new Assistant({ name: 'Alice' });
    const d = new Director({ name: 'Bob', assistant: a });
    const c = new Company({ name: 'Acme', director: d });
    const c2 = c.with.director.assistant({ name: 'Eve' });
    expect(c2).not.toBe(c);
    expect(c2.director).not.toBe(d);
    expect(c2.director.assistant).not.toBe(a);
    expect(c2).toBeInstanceOf(Company);
    expect(c2.director).toBeInstanceOf(Director);
    expect(c2.director.assistant).toBeInstanceOf(Assistant);
  });
});

describe('deep with() — mixed overrides', () => {
  it('deep with() accepts nested object replacement alongside primitives', async () => {
    const { Assistant, Director, Company } = await import('./fixtures/company.ts');
    const a = new Assistant({ name: 'Alice' });
    const d = new Director({ name: 'Bob', assistant: a });
    const c = new Company({ name: 'Acme', director: d });
    const newA = new Assistant({ name: 'Zoe' });
    const c2 = c.with.director({ name: 'Carol', assistant: newA });
    expect(c2.director.name).toBe('Carol');
    expect(c2.director.assistant.name).toBe('Zoe');
    expect(c2.director.assistant).toBe(newA);
  });

  it('shallow with() can replace a nested @freezed property wholesale', async () => {
    const { Assistant, Director, Company } = await import('./fixtures/company.ts');
    const a = new Assistant({ name: 'Alice' });
    const d = new Director({ name: 'Bob', assistant: a });
    const c = new Company({ name: 'Acme', director: d });
    const newD = new Director({ name: 'Dan', assistant: a });
    const c2 = c.with({ director: newD });
    expect(c2.director).toBe(newD);
    expect(c2.director.name).toBe('Dan');
  });
});

describe('deep with() — proxy edge cases', () => {
  it('accessing a non-freezed property on the proxy returns undefined', async () => {
    const { Assistant, Director, Company } = await import('./fixtures/company.ts');
    const a = new Assistant({ name: 'Alice' });
    const d = new Director({ name: 'Bob', assistant: a });
    const c = new Company({ name: 'Acme', director: d });
    expect((c.with as any).name).toBeUndefined();
  });

  it('typeof with is function', async () => {
    const { Assistant, Director, Company } = await import('./fixtures/company.ts');
    const a = new Assistant({ name: 'Alice' });
    const d = new Director({ name: 'Bob', assistant: a });
    const c = new Company({ name: 'Acme', director: d });
    expect(typeof c.with).toBe('function');
  });
});
