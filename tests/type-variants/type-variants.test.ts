import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/type-variants/fixtures/canvas.ts'),
  ]);
});

describe('arrays, unions, and transitive types in imports', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/type-variants/fixtures/canvas.freezed.ts'),
      'utf-8',
    );
  }

  it('imports array element types without [] suffix', () => {
    const generated = readGenerated();
    // Pigment[] should import Pigment, not "Pigment[]"
    expect(generated).not.toMatch(/import[^;]*Pigment\[\]/);
  });

  it('imports union types without | null suffix', () => {
    const generated = readGenerated();
    // Stroke | null should import Stroke, not "Stroke | null"
    expect(generated).not.toMatch(/import[^;]*Stroke \| null/);
  });

  it('deduplicates imported symbols', () => {
    const generated = readGenerated();
    // Pigment appears in two properties (pigments: Pigment[], layers: Pigment[])
    // but should only appear once in the import
    const pigmentImportMatches = generated.match(/\bPigment\b/g) ?? [];
    const importSection = generated.split('freezedts/runtime')[0];
    const pigmentInImports = (importSection.match(/\bPigment\b/g) ?? []).length;
    expect(pigmentInImports).toBe(1);
  });

  it('sorts symbols alphabetically within each import', () => {
    const generated = readGenerated();
    // Finish and Shade are from the same module — should appear as { Finish, Shade }
    expect(generated).toContain('Finish, Shade');
  });

  it('sorts import statements by path', () => {
    const generated = readGenerated();
    const importLines = generated.split('\n').filter(l => l.startsWith('import ') && l.includes('from'));
    // Verify imports are sorted by their module path
    const paths = importLines.map(l => {
      const match = l.match(/from\s+'([^']+)'/);
      return match ? match[1] : '';
    });
    const sorted = [...paths].sort();
    expect(paths).toEqual(sorted);
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

  it('imports same-file freezed types from the source file', () => {
    const generated = readGenerated();
    // Canvas references Stroke (same-file @freezed) — must import from source
    expect(generated).toMatch(/import type \{[^}]*Stroke[^}]*\} from '\.\/canvas\.js'/);
  });

  it('preserves array and union types in property declarations', () => {
    const generated = readGenerated();
    // The actual property types should keep [] and | null
    expect(generated).toContain('strokes: Stroke[];');
    expect(generated).toContain('layers: Pigment[];');
    expect(generated).toContain('highlight: Stroke | null;');
    expect(generated).toContain('pigments: Pigment[];');
  });

  it('does not import With types from the same generated file', () => {
    const generated = readGenerated();
    // StrokeWith is defined in canvas.freezed.ts itself — should NOT be imported
    expect(generated).not.toMatch(/import[^;]*StrokeWith[^;]*from '\.\/canvas\.freezed\.js'/);
  });
});
