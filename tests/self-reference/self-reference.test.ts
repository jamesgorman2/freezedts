import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/self-reference/fixtures/person.ts'),
  ]);
});

describe('circular dependencies', () => {
  it('Person imports Animal', () => {
    const generated = fs.readFileSync(
      path.resolve('tests/self-reference/fixtures/person.freezed.ts'),
      'utf-8',
    );
    expect(generated).toContain("import type { Person } from './person.js'");
  });

  it('child is an person', () => {
    const generated = fs.readFileSync(
      path.resolve('tests/self-reference/fixtures/person.freezed.ts'),
      'utf-8',
    );
    expect(generated).toContain("child: Person | null;");
  });
});

describe('circular dependencies -- runtime behavior', () => {
  it('constructs with references (chain, not true cycle)', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const child = new Person({ name: 'Alice', child: null });
    const parent = new Person({ name: 'Bob', child: child });
    const grandParent = new Person({ name: 'Charlie', child: parent });
    expect(grandParent.name).toBe('Charlie');
    expect(grandParent.child!.name).toBe('Bob');
    expect(grandParent.child!.child!.name).toBe('Alice');
  });

  it('frozen circular instances', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const child = new Person({ name: 'Alice', child: null });
    const parent = new Person({ name: 'Bob', child: child });
    expect(Object.isFrozen(child)).toBe(true);
    expect(Object.isFrozen(parent)).toBe(true);
  });

  it('equals on circular instances', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const mkChain = () => {
      const child = new Person({ name: 'Alice', child: null });
      const parent = new Person({ name: 'Bob', child: child });
      return new Person({ name: 'Charlie', child: parent });
    };
    expect(mkChain().equals(mkChain())).toBe(true);
  });

  it('toString on circular instance does not infinite-loop', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const child = new Person({ name: 'Alice', child: null });
    const parent = new Person({ name: 'Bob', child: child });
    const grandParent = new Person({ name: 'Charlie', child: parent });
    expect(grandParent.toString()).toContain('Person(');
  });
});
