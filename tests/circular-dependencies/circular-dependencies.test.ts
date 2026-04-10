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
    expect(generated).toContain("pet: Animal;");
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
    expect(generated).toContain("owner: Person;");
  });
});
