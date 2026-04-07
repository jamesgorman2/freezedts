import { describe, it, expect, beforeAll } from 'bun:test';
import * as path from 'node:path';
import { generate } from '../../src/generator/generator.js';

const fixturesDir = path.resolve(import.meta.dirname, 'fixtures');

beforeAll(() => {
  generate([
    path.join(fixturesDir, 'equality.ts'),
    path.join(fixturesDir, 'nested.ts'),
  ]);
});

describe('equals() — deep mode (default)', () => {
  it('returns true for instances with identical values', async () => {
    const { DeepPerson } = await import('./fixtures/equality.ts');
    const meta = { role: 'admin' };
    const a = new DeepPerson({ name: 'Alice', metadata: meta });
    const b = new DeepPerson({ name: 'Alice', metadata: meta });
    expect(a.equals(b)).toBe(true);
  });

  it('returns false for instances with different primitive values', async () => {
    const { DeepPerson } = await import('./fixtures/equality.ts');
    const meta = { role: 'admin' };
    const a = new DeepPerson({ name: 'Alice', metadata: meta });
    const b = new DeepPerson({ name: 'Bob', metadata: meta });
    expect(a.equals(b)).toBe(false);
  });

  it('returns true for same reference', async () => {
    const { DeepPerson } = await import('./fixtures/equality.ts');
    const a = new DeepPerson({ name: 'Alice', metadata: { role: 'admin' } });
    expect(a.equals(a)).toBe(true);
  });

  it('returns false when compared with non-instance', async () => {
    const { DeepPerson } = await import('./fixtures/equality.ts');
    const a = new DeepPerson({ name: 'Alice', metadata: { role: 'admin' } });
    expect(a.equals({ name: 'Alice', metadata: { role: 'admin' } })).toBe(false);
    expect(a.equals(null)).toBe(false);
    expect(a.equals(undefined)).toBe(false);
    expect(a.equals(42)).toBe(false);
  });

  it('performs deep comparison on non-freezed objects', async () => {
    const { DeepPerson } = await import('./fixtures/equality.ts');
    const a = new DeepPerson({ name: 'Alice', metadata: { role: 'admin' } });
    const b = new DeepPerson({ name: 'Alice', metadata: { role: 'admin' } });
    expect(a.equals(b)).toBe(true);
  });

  it('detects differences in nested non-freezed objects', async () => {
    const { DeepPerson } = await import('./fixtures/equality.ts');
    const a = new DeepPerson({ name: 'Alice', metadata: { role: 'admin' } });
    const b = new DeepPerson({ name: 'Alice', metadata: { role: 'user' } });
    expect(a.equals(b)).toBe(false);
  });
});

describe('equals() — shallow mode', () => {
  it('returns true when all properties are === equal', async () => {
    const { ShallowPerson } = await import('./fixtures/equality.ts');
    const meta = { role: 'admin' };
    const a = new ShallowPerson({ name: 'Alice', metadata: meta });
    const b = new ShallowPerson({ name: 'Alice', metadata: meta });
    expect(a.equals(b)).toBe(true);
  });

  it('returns false for different object references with same structure', async () => {
    const { ShallowPerson } = await import('./fixtures/equality.ts');
    const a = new ShallowPerson({ name: 'Alice', metadata: { role: 'admin' } });
    const b = new ShallowPerson({ name: 'Alice', metadata: { role: 'admin' } });
    expect(a.equals(b)).toBe(false);
  });

  it('returns false when compared with non-instance', async () => {
    const { ShallowPerson } = await import('./fixtures/equality.ts');
    const a = new ShallowPerson({ name: 'Alice', metadata: { role: 'admin' } });
    expect(a.equals(null)).toBe(false);
  });
});

describe('equals() — nested @freezed types', () => {
  it('deep-compares nested @freezed instances', async () => {
    const { Address, Employee } = await import('./fixtures/nested.ts');
    const a = new Employee({
      name: 'Alice',
      address: new Address({ street: '1st', city: 'NYC' }),
    });
    const b = new Employee({
      name: 'Alice',
      address: new Address({ street: '1st', city: 'NYC' }),
    });
    expect(a.equals(b)).toBe(true);
  });

  it('detects differences in nested @freezed instances', async () => {
    const { Address, Employee } = await import('./fixtures/nested.ts');
    const a = new Employee({
      name: 'Alice',
      address: new Address({ street: '1st', city: 'NYC' }),
    });
    const b = new Employee({
      name: 'Alice',
      address: new Address({ street: '2nd', city: 'NYC' }),
    });
    expect(a.equals(b)).toBe(false);
  });

  it('returns true when nested instances are same reference', async () => {
    const { Address, Employee } = await import('./fixtures/nested.ts');
    const addr = new Address({ street: '1st', city: 'NYC' });
    const a = new Employee({ name: 'Alice', address: addr });
    const b = new Employee({ name: 'Alice', address: addr });
    expect(a.equals(b)).toBe(true);
  });
});
