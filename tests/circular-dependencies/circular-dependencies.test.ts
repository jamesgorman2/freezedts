import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/circular-dependencies/fixtures/animal.ts'),
    path.resolve('tests/circular-dependencies/fixtures/person.ts'),
  ]);
});

describe('circular dependencies', () => {
  it('Person imports Animal', () => {
    const generated = fs.readFileSync(
      path.resolve('tests/circular-dependencies/fixtures/person.freezed.ts'),
      'utf-8',
    );
    expect(generated).toContain("import type { Animal } from './animal.js'");
  });

  it('pet is an Animal', () => {
    const generated = fs.readFileSync(
      path.resolve('tests/circular-dependencies/fixtures/person.freezed.ts'),
      'utf-8',
    );
    expect(generated).toContain("pet: Animal | null;");
  });

  it('Animal imports Person', () => {
    const generated = fs.readFileSync(
      path.resolve('tests/circular-dependencies/fixtures/animal.freezed.ts'),
      'utf-8',
    );
    expect(generated).toContain("import type { Person } from './person.js'");
  });

  it('owner is a Person', () => {
    const generated = fs.readFileSync(
      path.resolve('tests/circular-dependencies/fixtures/animal.freezed.ts'),
      'utf-8',
    );
    expect(generated).toContain("owner: Person | null;");
  });
});

describe('circular dependencies -- runtime behavior', () => {
  it('constructs with circular references (chain, not true cycle)', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const { Animal } = await import('./fixtures/animal.ts');
    const owner = new Person({ name: 'Alice', pet: null });
    const pet = new Animal({ species: 'Cat', owner });
    const person = new Person({ name: 'Bob', pet });
    expect(person.name).toBe('Bob');
    expect(person.pet!.species).toBe('Cat');
    expect(person.pet!.owner!.name).toBe('Alice');
  });

  it('frozen circular instances', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const { Animal } = await import('./fixtures/animal.ts');
    const owner = new Person({ name: 'Alice', pet: null });
    const pet = new Animal({ species: 'Dog', owner });
    expect(Object.isFrozen(owner)).toBe(true);
    expect(Object.isFrozen(pet)).toBe(true);
  });

  it('equals on circular instances', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const { Animal } = await import('./fixtures/animal.ts');
    const mkChain = () => {
      const o = new Person({ name: 'Alice', pet: null });
      const a = new Animal({ species: 'Cat', owner: o });
      return new Person({ name: 'Bob', pet: a });
    };
    expect(mkChain().equals(mkChain())).toBe(true);
  });

  it('toString on circular instance does not infinite-loop', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const { Animal } = await import('./fixtures/animal.ts');
    const owner = new Person({ name: 'Alice', pet: null });
    const pet = new Animal({ species: 'Cat', owner });
    const person = new Person({ name: 'Bob', pet });
    expect(person.toString()).toContain('Person(');
  });
});
