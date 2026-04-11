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
    expect(generated).toContain("import type { Stroke } from './canvas.js';");
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

describe('type variants -- runtime behavior', () => {
  it('constructs Stroke with plain class and const-enum', async () => {
    const { Stroke } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const s = new Stroke({
      width: 2,
      pigments: [new Pigment({ name: 'red', opacity: 0.8 })],
      shade: 'DARK',
    });
    expect(s.width).toBe(2);
    expect(s.pigments[0].name).toBe('red');
    expect(s.shade).toBe('DARK');
  });

  it('constructs Canvas with all type variants', async () => {
    const { Stroke, Canvas } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const stroke = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'blue', opacity: 1.0 })],
      shade: 'LIGHT',
    });
    const canvas = new Canvas({
      title: 'art',
      finish: 'MATTE',
      strokes: [stroke],
      layers: [new Pigment({ name: 'white', opacity: 0.5 })],
      highlight: null,
    });
    expect(canvas.title).toBe('art');
    expect(canvas.finish).toBe('MATTE');
    expect(canvas.highlight).toBeNull();
  });

  it('constructs Canvas with non-null highlight', async () => {
    const { Stroke, Canvas } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const stroke = new Stroke({
      width: 3,
      pigments: [new Pigment({ name: 'gold', opacity: 1.0 })],
      shade: 'MEDIUM',
    });
    const canvas = new Canvas({
      title: 'highlight test',
      finish: 'GLOSSY',
      strokes: [],
      layers: [],
      highlight: stroke,
    });
    expect(canvas.highlight).not.toBeNull();
    expect(canvas.highlight!.width).toBe(3);
  });

  it('Pigment instances inside arrays are frozen', async () => {
    const { Stroke } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const s = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'red', opacity: 0.5 })],
      shade: 'DARK',
    });
    expect(Object.isFrozen(s.pigments[0])).toBe(true);
  });

  it('Stroke array inside Canvas is frozen', async () => {
    const { Stroke, Canvas } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const stroke = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'blue', opacity: 1.0 })],
      shade: 'LIGHT',
    });
    const canvas = new Canvas({
      title: 'test',
      finish: 'MATTE',
      strokes: [stroke],
      layers: [],
      highlight: null,
    });
    expect(Object.isFrozen(canvas.strokes)).toBe(true);
    expect(Object.isFrozen(canvas.strokes[0])).toBe(true);
  });

  it('equals works with plain class array elements', async () => {
    const { Stroke } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const a = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'red', opacity: 0.5 })],
      shade: 'DARK',
    });
    const b = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'red', opacity: 0.5 })],
      shade: 'DARK',
    });
    expect(a.equals(b)).toBe(true);
  });

  it('equals detects Pigment differences', async () => {
    const { Stroke } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const a = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'red', opacity: 0.5 })],
      shade: 'DARK',
    });
    const b = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'red', opacity: 0.9 })],
      shade: 'DARK',
    });
    expect(a.equals(b)).toBe(false);
  });

  it('equals handles nullable Stroke (highlight)', async () => {
    const { Stroke, Canvas } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const stroke = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'blue', opacity: 1.0 })],
      shade: 'LIGHT',
    });
    const a = new Canvas({
      title: 'test', finish: 'MATTE', strokes: [], layers: [], highlight: null,
    });
    const b = new Canvas({
      title: 'test', finish: 'MATTE', strokes: [], layers: [], highlight: stroke,
    });
    expect(a.equals(b)).toBe(false);
  });

  it('with() on Canvas replaces title', async () => {
    const { Stroke, Canvas } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const stroke = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'blue', opacity: 1.0 })],
      shade: 'LIGHT',
    });
    const canvas = new Canvas({
      title: 'old', finish: 'MATTE', strokes: [stroke], layers: [], highlight: null,
    });
    const c2 = canvas.with({ title: 'new' });
    expect(c2.title).toBe('new');
    expect(c2.finish).toBe('MATTE');
    expect(c2.strokes).toEqual(canvas.strokes);
  });

  it('with() on Canvas replaces strokes', async () => {
    const { Stroke, Canvas } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const canvas = new Canvas({
      title: 'test', finish: 'SATIN', strokes: [], layers: [], highlight: null,
    });
    const newStroke = new Stroke({
      width: 5,
      pigments: [new Pigment({ name: 'green', opacity: 0.7 })],
      shade: 'MEDIUM',
    });
    const c2 = canvas.with({ strokes: [newStroke] });
    expect(c2.strokes).toHaveLength(1);
    expect(c2.strokes[0].width).toBe(5);
  });

  it('toString includes enum and class values', async () => {
    const { Stroke } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const s = new Stroke({
      width: 2,
      pigments: [new Pigment({ name: 'red', opacity: 0.8 })],
      shade: 'DARK',
    });
    expect(s.toString()).toContain('Stroke(');
  });
});
