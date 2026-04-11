import { describe, it, expect, beforeAll } from 'bun:test';
import * as path from 'node:path';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';

const fixturesDir = path.resolve(import.meta.dirname, 'fixtures');

beforeAll(() => {
  const files = [
    path.join(fixturesDir, 'person.ts'),
    path.join(fixturesDir, 'multi.ts'),
    path.join(fixturesDir, 'with-import.ts'),
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

describe('immutability -- imported types', () => {
  it('creates instance with imported type field', async () => {
    const { Locatable } = await import('./fixtures/with-import.ts');
    const l = new Locatable({ label: 'a', position: { x: 1, y: 2 } });
    expect(l.position.x).toBe(1);
    expect(l.position.y).toBe(2);
  });

  it('instance is frozen', async () => {
    const { Locatable } = await import('./fixtures/with-import.ts');
    const l = new Locatable({ label: 'a', position: { x: 1, y: 2 } });
    expect(Object.isFrozen(l)).toBe(true);
  });

  it('imported type field value is deep-frozen', async () => {
    const { Locatable } = await import('./fixtures/with-import.ts');
    const l = new Locatable({ label: 'a', position: { x: 1, y: 2 } });
    expect(Object.isFrozen(l.position)).toBe(true);
  });

  it('mutating imported type field value throws', async () => {
    const { Locatable } = await import('./fixtures/with-import.ts');
    const l = new Locatable({ label: 'a', position: { x: 1, y: 2 } });
    expect(() => { (l.position as any).x = 99; }).toThrow();
  });

  it('reassigning imported type field throws', async () => {
    const { Locatable } = await import('./fixtures/with-import.ts');
    const l = new Locatable({ label: 'a', position: { x: 1, y: 2 } });
    expect(() => { (l as any).position = { x: 9, y: 9 }; }).toThrow();
  });
});
