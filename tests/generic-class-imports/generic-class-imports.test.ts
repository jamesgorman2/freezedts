import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/generic-class-imports/fixtures/container.ts'),
  ]);
});

describe('importing generic class types (not just interfaces)', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/generic-class-imports/fixtures/container.freezed.ts'),
      'utf-8',
    );
  }

  it('imports the outer generic class type', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Wrapper } from './wrapper.js';");
  });

  it('imports the generic type parameter class', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Item } from './item.js';");
  });

  it('imports multi-param generic class', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Pair } from './pair.js';");
  });

  it('imports nested generic class Box<T>', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Box } from './box.js';");
  });

  it('preserves Wrapper<Item> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('wrapped: Wrapper<Item>');
  });

  it('preserves Wrapper<Item>[] in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('items: Wrapper<Item>[]');
  });

  it('preserves Pair<Item, string> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('pair: Pair<Item, string>');
  });

  it('preserves Wrapper<Box<Item>> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('nested: Wrapper<Box<Item>>');
  });

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

  it('uses import type for all generated imports', () => {
    const generated = readGenerated();
    const importLines = generated.split('\n').filter(l =>
      l.startsWith('import ') && l.includes('from') && !l.includes('freezedts/runtime'),
    );
    for (const line of importLines) {
      expect(line).toMatch(/^import type \{/);
    }
  });
});
