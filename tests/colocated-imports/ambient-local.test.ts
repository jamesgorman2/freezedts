import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as path from 'node:path';

let result: ReturnType<typeof generate>;

beforeAll(() => {
  result = generate([
    path.resolve('tests/colocated-imports/fixtures/ambient-local.ts'),
  ]);
});

describe('freezed property referencing a same-file ambient (declare) type', () => {
  it('still writes the generated file without errors', () => {
    expect(result.filesWritten).toBe(1);
    expect(result.errors).toEqual([]);
  });

  it('does NOT warn to export an ambient declare type', () => {
    const matching = result.warnings.filter(w => w.includes("'Ambient'"));
    expect(matching).toEqual([]);
  });
});
