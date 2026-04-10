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
  it('Person imports only Cat and Dog', () => {
    const generated = fs.readFileSync(
      path.resolve('tests/multi-import/fixtures/person.freezed.ts'),
      'utf-8',
    );
    expect(generated).toContain("import { Cat, Dog } from './animal.js'");
  });
  it('Person imports type PreferredSize', () => {
    const generated = fs.readFileSync(
      path.resolve('tests/multi-import/fixtures/person.freezed.ts'),
      'utf-8',
    );
    expect(generated).toContain("import type { PreferredSize } from './animal.js'");
  });
});
