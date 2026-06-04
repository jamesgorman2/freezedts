import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/colocated-imports/fixtures/enum-colo.ts'),
    path.resolve('tests/colocated-imports/fixtures/composite-colo.ts'),
    path.resolve('tests/colocated-imports/fixtures/mixed-colo.ts'),
  ]);
});

describe('Scenario A — local enum (value) + local type alias (type-only)', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/colocated-imports/fixtures/enum-colo.freezed.ts'),
      'utf-8',
    );
  }

  it('imports the local enum as value and type alias as type-only', () => {
    const generated = readGenerated();
    expect(generated).toContain("import { type Label, Color } from './enum-colo.js';");
  });
});

describe('Scenario B — local types nested in composite types (array + union), all type-only', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/colocated-imports/fixtures/composite-colo.freezed.ts'),
      'utf-8',
    );
  }

  it('imports the local nested types as type-only', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Meta, Tag } from './composite-colo.js';");
  });
});

describe('Scenario C — same-file @freezed class + same-file non-freezed class + external type', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/colocated-imports/fixtures/mixed-colo.freezed.ts'),
      'utf-8',
    );
  }

  it('imports same-file freezed class (type) and non-freezed class (value) together', () => {
    const generated = readGenerated();
    expect(generated).toContain("import { type Node2, Plain } from './mixed-colo.js';");
  });

  it('imports the external type as type-only with .js extension', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Coord2 } from './coord2.js';");
  });
});
