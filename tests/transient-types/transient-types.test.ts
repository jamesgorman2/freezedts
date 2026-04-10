import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/transient-types/fixtures/board.ts'),
  ]);
});

describe('transient type imports', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/transient-types/fixtures/board.freezed.ts'),
      'utf-8',
    );
  }

  it('imports the type alias name, not the underlying type name', () => {
    const generated = readGenerated();
    expect(generated).toMatch(/import[^;]*Feature/);
    expect(generated).not.toMatch(/import[^;]*BaseModel/);
  });

  it('imports from the alias module path, not the underlying type path', () => {
    const generated = readGenerated();
    expect(generated).toContain("from './external/types.js'");
    expect(generated).not.toContain("from './external/base-model.js'");
  });

  it('uses the alias name in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('feature: Feature');
    expect(generated).toContain('features: Feature[]');
    expect(generated).not.toContain('BaseModel');
  });
});
