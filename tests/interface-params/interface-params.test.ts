import { describe, it, expect, beforeAll } from 'bun:test';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';

const fixturesDir = path.resolve(import.meta.dirname, 'fixtures');

beforeAll(() => {
  generate([
    path.join(fixturesDir, 'same-file.ts'),
    path.join(fixturesDir, 'imported.ts'),
    path.join(fixturesDir, 'type-alias.ts'),
    path.join(fixturesDir, 'with-complex-fields.ts'),
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

  it('works with a type alias as constructor params type', async () => {
    const { Employee } = await import('./fixtures/type-alias.ts');
    const e = new Employee({ name: 'Alice', department: 'Eng', level: 3 });
    expect(e.name).toBe('Alice');
    expect(e.department).toBe('Eng');
    expect(e.level).toBe(3);
    expect(Object.isFrozen(e)).toBe(true);
  });

  it('with() works with type alias params', async () => {
    const { Employee } = await import('./fixtures/type-alias.ts');
    const e1 = new Employee({ name: 'Alice', department: 'Eng', level: 3 });
    const e2 = e1.with({ level: 4 });
    expect(e2.level).toBe(4);
    expect(e2.name).toBe('Alice');
    expect(e2).not.toBe(e1);
  });

  it('equals() works with type alias params', async () => {
    const { Employee } = await import('./fixtures/type-alias.ts');
    const a = new Employee({ name: 'Alice', department: 'Eng', level: 3 });
    const b = new Employee({ name: 'Alice', department: 'Eng', level: 3 });
    expect(a.equals(b)).toBe(true);
    expect(a.equals(new Employee({ name: 'Alice', department: 'Eng', level: 4 }))).toBe(false);
  });
});

describe('interface params -- imported type fields', () => {
  it('works with interface containing imported type field', async () => {
    const { Marker } = await import('./fixtures/with-complex-fields.ts');
    const m = new Marker({ label: 'a', position: { x: 1, y: 2 } });
    expect(m.position.x).toBe(1);
  });

  it('imported type field is frozen', async () => {
    const { Marker } = await import('./fixtures/with-complex-fields.ts');
    const m = new Marker({ label: 'a', position: { x: 1, y: 2 } });
    expect(Object.isFrozen(m.position)).toBe(true);
  });

  it('with() replaces imported type field', async () => {
    const { Marker } = await import('./fixtures/with-complex-fields.ts');
    const m = new Marker({ label: 'a', position: { x: 1, y: 2 } });
    const m2 = m.with({ position: { x: 9, y: 9 } });
    expect(m2.position).toEqual({ x: 9, y: 9 });
    expect(m2).not.toBe(m);
  });

  it('equals() compares imported type fields deeply', async () => {
    const { Marker } = await import('./fixtures/with-complex-fields.ts');
    const a = new Marker({ label: 'a', position: { x: 1, y: 2 } });
    const b = new Marker({ label: 'a', position: { x: 1, y: 2 } });
    expect(a.equals(b)).toBe(true);
    const c = new Marker({ label: 'a', position: { x: 9, y: 9 } });
    expect(a.equals(c)).toBe(false);
  });

  it('generated file imports Coord', () => {
    const content = fs.readFileSync(
      path.join(fixturesDir, 'with-complex-fields.freezed.ts'), 'utf-8',
    );
    expect(content).toContain("import type { Coord }");
  });
});
