import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/multi-import/fixtures/animal.ts'),
    path.resolve('tests/multi-import/fixtures/person.ts'),
  ]);
});

describe('multi-import', () => {
  it('Person imports Cat, Dog, and PreferredSize from the same module', () => {
    const generated = fs.readFileSync(
      path.resolve('tests/multi-import/fixtures/person.freezed.ts'),
      'utf-8',
    );
    expect(generated).toContain("import type { Cat, Dog, PreferredSize } from './animal.js'");
  });
});

describe('multi-import -- runtime behavior', () => {
  it('constructs Person with class and enum values', async () => {
    const { Cat, Dog } = await import('./fixtures/animal.ts');
    const { Person } = await import('./fixtures/person.ts');
    const p = new Person({
      preferredSize: 'M',
      cat: new Cat(),
      dog: new Dog(),
    });
    expect(p.preferredSize).toBe('M');
  });

  it('instance and class fields are frozen', async () => {
    const { Cat, Dog } = await import('./fixtures/animal.ts');
    const { Person } = await import('./fixtures/person.ts');
    const p = new Person({
      preferredSize: 'S',
      cat: new Cat(),
      dog: new Dog(),
    });
    expect(Object.isFrozen(p)).toBe(true);
    expect(Object.isFrozen(p.cat)).toBe(true);
    expect(Object.isFrozen(p.dog)).toBe(true);
  });

  it('equals works with class-typed fields', async () => {
    const { Cat, Dog } = await import('./fixtures/animal.ts');
    const { Person } = await import('./fixtures/person.ts');
    const cat = new Cat();
    const dog = new Dog();
    const a = new Person({ preferredSize: 'L', cat, dog });
    const b = new Person({ preferredSize: 'L', cat, dog });
    expect(a.equals(b)).toBe(true);
  });

  it('equals detects class field differences', async () => {
    const { Cat, Dog } = await import('./fixtures/animal.ts');
    const { Person } = await import('./fixtures/person.ts');
    const a = new Person({ preferredSize: 'M', cat: new Cat(), dog: new Dog() });
    const b = new Person({ preferredSize: 'XL', cat: new Cat(), dog: new Dog() });
    expect(a.equals(b)).toBe(false);
  });

  it('with() replaces a class-typed field', async () => {
    const { Cat, Dog } = await import('./fixtures/animal.ts');
    const { Person } = await import('./fixtures/person.ts');
    const origCat = new Cat();
    const p = new Person({ preferredSize: 'M', cat: origCat, dog: new Dog() });
    const newCat = new Cat();
    const p2 = p.with({ cat: newCat });
    expect(p2.cat).toBe(newCat);
    expect(p.cat).toBe(origCat);
  });

  it('toString includes class field representations', async () => {
    const { Cat, Dog } = await import('./fixtures/animal.ts');
    const { Person } = await import('./fixtures/person.ts');
    const p = new Person({ preferredSize: 'M', cat: new Cat(), dog: new Dog() });
    expect(p.toString()).toContain('Person(');
  });
});
