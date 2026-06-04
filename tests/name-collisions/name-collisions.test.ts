import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/name-collisions/fixtures/status.ts'),
    path.resolve('tests/name-collisions/fixtures/widget.ts'),
    path.resolve('tests/name-collisions/fixtures/node.ts'),
    path.resolve('tests/name-collisions/fixtures/tree.ts'),
  ]);
});

describe('Defect B — same-file local type shadows a foreign @freezed class of the same name', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/name-collisions/fixtures/widget.freezed.ts'), 'utf-8');
  }
  it('imports the LOCAL Status from its own file, not the foreign @freezed file', () => {
    const g = readGenerated();
    expect(g).toContain("import type { Status } from './widget.js';");
    expect(g).not.toContain("from './status.js'");
  });
  it('does not treat the local union type as a freezed class (no StatusWith)', () => {
    const g = readGenerated();
    expect(g).not.toContain('StatusWith');
    expect(g).not.toContain("from './status.freezed.js'");
  });
  it('property type stays the local union, not a With<> mutator', () => {
    expect(readGenerated()).toContain('status: Status');
  });
});

describe('Defect A — local NodeWith collides with the synthetic ${baseType}With import', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/name-collisions/fixtures/tree.freezed.ts'), 'utf-8');
  }
  it('emits at most one import binding for NodeWith', () => {
    const count = (readGenerated().match(/^import\b.*\bNodeWith\b/gm) ?? []).length;
    expect(count).toBe(1);
  });
  it('the surviving NodeWith binding is the local one (own file)', () => {
    expect(readGenerated()).toMatch(/^import[^\n]*\bNodeWith\b[^\n]*from '\.\/tree\.js';/m);
  });
});
