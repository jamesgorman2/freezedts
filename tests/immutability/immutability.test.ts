import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'node:path';
import { generate } from '../../src/generator/generator.js';

const fixturesDir = path.resolve(import.meta.dirname, 'fixtures');

beforeAll(() => {
  const files = [
    path.join(fixturesDir, 'person.ts'),
    path.join(fixturesDir, 'multi.ts'),
  ];
  generate(files);
});

describe('immutability behavior', () => {
  it('creates an instance with all properties set', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const p = new Person({ firstName: 'John', lastName: 'Smith', age: 30 });
    expect(p.firstName).toBe('John');
    expect(p.lastName).toBe('Smith');
    expect(p.age).toBe(30);
  });

  it('instance is frozen — property assignment throws in strict mode', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const p = new Person({ firstName: 'John', lastName: 'Smith', age: 30 });
    expect(Object.isFrozen(p)).toBe(true);
    expect(() => {
      (p as any).firstName = 'Jane';
    }).toThrow();
  });

  it('instance is frozen — cannot add new properties', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const p = new Person({ firstName: 'John', lastName: 'Smith', age: 30 });
    expect(() => {
      (p as any).newProp = 'value';
    }).toThrow();
  });

  it('instance is frozen — cannot delete properties', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const p = new Person({ firstName: 'John', lastName: 'Smith', age: 30 });
    expect(() => {
      delete (p as any).firstName;
    }).toThrow();
  });

  it('is an instance of the user class', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const p = new Person({ firstName: 'John', lastName: 'Smith', age: 30 });
    expect(p).toBeInstanceOf(Person);
  });

  it('handles optional properties (undefined when not provided)', async () => {
    const { Address } = await import('./fixtures/multi.ts');
    const a = new Address({ street: '123 Main', city: 'Springfield' });
    expect(a.street).toBe('123 Main');
    expect(a.city).toBe('Springfield');
    expect(a.zip).toBeUndefined();
    expect(Object.isFrozen(a)).toBe(true);
  });

  it('handles multiple classes from one file', async () => {
    const { Address, Contact } = await import('./fixtures/multi.ts');
    const a = new Address({ street: '1st', city: 'NYC' });
    const c = new Contact({ name: 'Alice', email: 'alice@test.com' });
    expect(a).toBeInstanceOf(Address);
    expect(c).toBeInstanceOf(Contact);
    expect(Object.isFrozen(a)).toBe(true);
    expect(Object.isFrozen(c)).toBe(true);
  });
});
