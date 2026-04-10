import { describe, it, expect, beforeAll } from 'bun:test';
import * as path from 'node:path';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';

const fixturesDir = path.resolve(import.meta.dirname, 'fixtures');

beforeAll(() => {
  generate([
    path.join(fixturesDir, 'person.ts'),
    path.join(fixturesDir, 'nested.ts'),
  ]);
});

describe('toString() — simple class', () => {
  it('returns ClassName(prop: value, ...) format', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const p = new Person({ firstName: 'John', lastName: 'Smith', age: 42 });
    expect(p.toString()).toBe('Person(firstName: John, lastName: Smith, age: 42)');
  });

  it('uses the concrete class name, not the generated base class name', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const p = new Person({ firstName: 'Alice', lastName: 'Jones', age: 30 });
    expect(p.toString()).toStartWith('Person(');
    expect(p.toString()).not.toStartWith('$Person(');
  });

  it('works with template literal interpolation via string context', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const p = new Person({ firstName: 'Bob', lastName: 'Lee', age: 25 });
    expect(`${p}`).toBe('Person(firstName: Bob, lastName: Lee, age: 25)');
  });
});

describe('toString() — nested @freezed types', () => {
  it('recursively calls toString on nested @freezed instances', async () => {
    const { Address, Employee } = await import('./fixtures/nested.ts');
    const e = new Employee({
      name: 'Alice',
      address: new Address({ street: '1st Ave', city: 'NYC' }),
    });
    expect(e.toString()).toBe(
      'Employee(name: Alice, address: Address(street: 1st Ave, city: NYC))',
    );
  });

  it('formats nested @freezed in toString output', async () => {
    const { Address, Employee } = await import('./fixtures/nested.ts');
    const addr = new Address({ street: 'Main St', city: 'LA' });
    expect(addr.toString()).toBe('Address(street: Main St, city: LA)');
    const e = new Employee({ name: 'Bob', address: addr });
    expect(e.toString()).toContain('Address(street: Main St, city: LA)');
  });
});
