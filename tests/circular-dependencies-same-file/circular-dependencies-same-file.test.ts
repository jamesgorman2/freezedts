import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/circular-dependencies-same-file/fixtures/animal-person.ts'),
  ]);
});

describe('circular dependencies', () => {
  it('Person imports Animal', () => {
    const generated = fs.readFileSync(
      path.resolve('tests/circular-dependencies-same-file/fixtures/animal-person.freezed.ts'),
      'utf-8',
    );
    expect(generated).toContain("import type { Animal, Person } from './animal-person.js'");
  });

  it('pet is an Animal', () => {
    const generated = fs.readFileSync(
      path.resolve('tests/circular-dependencies-same-file/fixtures/animal-person.freezed.ts'),
      'utf-8',
    );
    expect(generated).toContain("pet: Animal | null;");
  });

  it('owner is a Person', () => {
    const generated = fs.readFileSync(
      path.resolve('tests/circular-dependencies-same-file/fixtures/animal-person.freezed.ts'),
      'utf-8',
    );
    expect(generated).toContain("owner: Person | null;");
  });
});

describe('circular dependencies -- runtime behavior', () => {
  it('constructs with circular references (chain, not true cycle)', async () => {
    const { Animal, Person } = await import('./fixtures/animal-person.ts');
    const owner = new Person({ name: 'Alice', pet: null });
    const pet = new Animal({ species: 'Cat', owner });
    const person = new Person({ name: 'Bob', pet });
    expect(person.name).toBe('Bob');
    expect(person.pet!.species).toBe('Cat');
    expect(person.pet!.owner!.name).toBe('Alice');
  });

  it('frozen circular instances', async () => {
    const { Animal, Person } = await import('./fixtures/animal-person.ts');
    const owner = new Person({ name: 'Alice', pet: null });
    const pet = new Animal({ species: 'Dog', owner });
    expect(Object.isFrozen(owner)).toBe(true);
    expect(Object.isFrozen(pet)).toBe(true);
  });

  it('equals on circular instances', async () => {
    const { Animal, Person } = await import('./fixtures/animal-person.ts');
    const mkChain = () => {
      const o = new Person({ name: 'Alice', pet: null });
      const a = new Animal({ species: 'Cat', owner: o });
      return new Person({ name: 'Bob', pet: a });
    };
    expect(mkChain().equals(mkChain())).toBe(true);
  });

  it('toString on circular instance does not infinite-loop', async () => {
    const { Animal, Person } = await import('./fixtures/animal-person.ts');
    const owner = new Person({ name: 'Alice', pet: null });
    const pet = new Animal({ species: 'Cat', owner });
    const person = new Person({ name: 'Bob', pet });
    expect(person.toString()).toContain('Person(');
  });
});
