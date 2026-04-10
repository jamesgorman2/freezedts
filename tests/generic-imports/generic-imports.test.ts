import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/generic-imports/fixtures/container.ts'),
  ]);
});

describe('importing generic types', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/generic-imports/fixtures/container.freezed.ts'),
      'utf-8',
    );
  }

  // --- A<B> ---

  it('imports the outer generic type', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Wrapper } from './wrapper.js';");
  });

  it('imports the generic type parameter', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Item } from './item.js';");
  });

  it('preserves A<B> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('wrapped: Wrapper<Item>');
  });

  it('preserves A<B>[] in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('items: Wrapper<Item>[]');
  });

  // --- A<B, C> ---

  it('imports the multi-param generic type', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Pair } from './pair.js';");
  });

  it('imports both type parameters of A<B, C>', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Item } from './item.js';");
    expect(generated).toContain("import type { Tag } from './tag.js';");
  });

  it('preserves A<B, C> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('pair: Pair<Item, Tag>');
  });

  // --- A<B<C>> ---

  it('imports all types from nested generics A<B<C>>', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Wrapper } from './wrapper.js';");
    expect(generated).toContain("import type { Box } from './box.js';");
    expect(generated).toContain("import type { Item } from './item.js';");
  });

  it('preserves A<B<C>> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('nested: Wrapper<Box<Item>>');
  });

  // --- A<B<C>, D> ---

  it('imports all types from A<B<C>, D>', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Pair } from './pair.js';");
    expect(generated).toContain("import type { Box } from './box.js';");
    expect(generated).toContain("import type { Item } from './item.js';");
    expect(generated).toContain("import type { Tag } from './tag.js';");
  });

  it('preserves A<B<C>, D> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('complex: Pair<Box<Item>, Tag>');
  });

  // --- import hygiene ---

  it('never puts angle brackets in import symbols', () => {
    const generated = readGenerated();
    const importLines = generated.split('\n').filter(l =>
      l.startsWith('import type') && l.includes('from'),
    );
    for (const line of importLines) {
      const braceContent = line.match(/\{([^}]+)\}/)?.[1] ?? '';
      expect(braceContent).not.toContain('<');
      expect(braceContent).not.toContain('>');
    }
  });
});
