import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

let result: ReturnType<typeof generate>;

beforeAll(() => {
  result = generate([
    path.resolve('tests/colocated-imports/fixtures/non-exported-local.ts'),
  ]);
});

describe('freezed property referencing a same-file non-exported local type', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/colocated-imports/fixtures/non-exported-local.freezed.ts'),
      'utf-8',
    );
  }

  it('still writes the generated file', () => {
    expect(result.filesWritten).toBe(1);
    expect(result.errors).toEqual([]);
  });

  it('warns that the referenced local type is not exported', () => {
    const matching = result.warnings.filter(
      w => w.includes("references non-exported local type 'Secret'"),
    );
    expect(matching.length).toBe(1);
    expect(matching[0]).toContain('non-exported-local.ts');
    expect(matching[0]).toContain("property 'secret'");
  });

  it('does NOT warn about exported types or built-ins', () => {
    expect(result.warnings.some(w => w.includes("'label'"))).toBe(false);
    const generated = readGenerated();
    expect(generated).not.toMatch(/^import .*\bSecret\b/m);
  });
});
