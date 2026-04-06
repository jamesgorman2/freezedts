import { describe, it, expect, beforeAll } from 'bun:test';
import * as path from 'node:path';
import { generate } from '../../src/generator/generator.js';

const fixturesDir = path.resolve(import.meta.dirname, 'fixtures');

beforeAll(() => {
  generate([
    path.join(fixturesDir, 'person.ts'),
    path.join(fixturesDir, 'multi.ts'),
  ]);
});

describe('shallow with() behavior', () => {
  it('returns a new instance with overridden properties', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const p1 = new Person({ firstName: 'John', lastName: 'Smith', age: 30 });
    const p2 = p1.with({ firstName: 'Jane' });
    expect(p2.firstName).toBe('Jane');
    expect(p2.lastName).toBe('Smith');
    expect(p2.age).toBe(30);
  });

  it('returns a different instance', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const p1 = new Person({ firstName: 'John', lastName: 'Smith', age: 30 });
    const p2 = p1.with({ firstName: 'Jane' });
    expect(p2).not.toBe(p1);
  });

  it('does not modify the original instance', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const p1 = new Person({ firstName: 'John', lastName: 'Smith', age: 30 });
    p1.with({ firstName: 'Jane' });
    expect(p1.firstName).toBe('John');
  });

  it('returned instance is frozen', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const p1 = new Person({ firstName: 'John', lastName: 'Smith', age: 30 });
    const p2 = p1.with({ age: 31 });
    expect(Object.isFrozen(p2)).toBe(true);
  });

  it('returned instance is instanceof the user class', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const p1 = new Person({ firstName: 'John', lastName: 'Smith', age: 30 });
    const p2 = p1.with({ age: 31 });
    expect(p2).toBeInstanceOf(Person);
  });

  it('with empty overrides returns a copy with identical values', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const p1 = new Person({ firstName: 'John', lastName: 'Smith', age: 30 });
    const p2 = p1.with({});
    expect(p2).not.toBe(p1);
    expect(p2.firstName).toBe('John');
    expect(p2.lastName).toBe('Smith');
    expect(p2.age).toBe(30);
  });

  it('supports multiple overrides at once', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const p1 = new Person({ firstName: 'John', lastName: 'Smith', age: 30 });
    const p2 = p1.with({ firstName: 'Jane', age: 25 });
    expect(p2.firstName).toBe('Jane');
    expect(p2.lastName).toBe('Smith');
    expect(p2.age).toBe(25);
  });

  it('supports chained with() calls', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const p1 = new Person({ firstName: 'John', lastName: 'Smith', age: 30 });
    const p2 = p1.with({ firstName: 'Jane' }).with({ age: 25 });
    expect(p2.firstName).toBe('Jane');
    expect(p2.lastName).toBe('Smith');
    expect(p2.age).toBe(25);
  });

  it('handles optional properties', async () => {
    const { Address } = await import('./fixtures/multi.ts');
    const a1 = new Address({ street: '123 Main', city: 'Springfield' });
    const a2 = a1.with({ zip: '62704' });
    expect(a2.street).toBe('123 Main');
    expect(a2.city).toBe('Springfield');
    expect(a2.zip).toBe('62704');
    expect(Object.isFrozen(a2)).toBe(true);
  });

  it('works with multiple classes from one file', async () => {
    const { Contact } = await import('./fixtures/multi.ts');
    const c1 = new Contact({ name: 'Alice', email: 'alice@test.com' });
    const c2 = c1.with({ email: 'alice@new.com' });
    expect(c2.name).toBe('Alice');
    expect(c2.email).toBe('alice@new.com');
    expect(c2).toBeInstanceOf(Contact);
  });
});
