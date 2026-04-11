import { describe, it, expect } from 'bun:test';
import { parseFreezedClasses } from './parser.js';
import { Project } from 'ts-morph';

function createTestProject(code: string): Project {
  const project = new Project({ useInMemoryFileSystem: true });
  project.createSourceFile('test.ts', code);
  return project;
}

describe('parseFreezedClasses', () => {
  it('extracts a single @freezed class with constructor params', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed()
      class Person {
        constructor(params: {
          firstName: string;
          lastName: string;
          age: number;
        }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes).toEqual([
      {
        className: 'Person',
        generatedClassName: '$Person',
        hasDefaults: false,
        hasAsserts: false,
        equalityMode: 'deep',
        properties: [
          { name: 'firstName', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
          { name: 'lastName', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
          { name: 'age', type: 'number', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
        ],
      },
    ]);
  });

  it('handles optional properties', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed()
      class Config {
        constructor(params: {
          host: string;
          port?: number;
        }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].properties).toEqual([
      { name: 'host', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
      { name: 'port', type: 'number', optional: true, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
    ]);
  });

  it('extracts multiple @freezed classes from one file', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed()
      class Person {
        constructor(params: { name: string }) {}
      }

      @freezed()
      class Child {
        constructor(params: { name: string; parentName: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes).toHaveLength(2);
    expect(result.classes[0].className).toBe('Person');
    expect(result.classes[1].className).toBe('Child');
  });

  it('ignores classes without @freezed decorator', () => {
    const project = createTestProject(`
      class NotFreezed {
        constructor(params: { value: number }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes).toEqual([]);
  });

  it('handles array and complex types', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed()
      class Team {
        constructor(params: {
          name: string;
          members: string[];
          metadata: Record<string, unknown>;
        }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].properties).toEqual([
      { name: 'name', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
      { name: 'members', type: 'string[]', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
      { name: 'metadata', type: 'Record<string, unknown>', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
    ]);
  });

  it('detects hasDefaults when @freezed has fields option with default', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed({
        fields: {
          age: { default: 0 },
        }
      })
      class Person {
        constructor(params: {
          name: string;
          age?: number;
        }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].hasDefaults).toBe(true);
    expect(result.classes[0].hasAsserts).toBe(false);
  });

  it('sets hasDefault on properties with default config', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed({
        fields: {
          age: { default: 0 },
          email: { assert: (v: string) => v.length > 0 },
        }
      })
      class Person {
        constructor(params: {
          name: string;
          age?: number;
          email: string;
        }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].hasDefaults).toBe(true);
    expect(result.classes[0].hasAsserts).toBe(true);
    expect(result.classes[0].properties).toEqual([
      { name: 'name', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
      { name: 'age', type: 'number', optional: true, hasDefault: true, hasAssert: false, hasMessage: false, isFreezed: false },
      { name: 'email', type: 'string', optional: false, hasDefault: false, hasAssert: true, hasMessage: false, isFreezed: false },
    ]);
  });

  it('sets hasDefaults and hasAsserts false when no fields option', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed()
      class Person {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].hasDefaults).toBe(false);
    expect(result.classes[0].hasAsserts).toBe(false);
    expect(result.classes[0].properties[0].hasDefault).toBe(false);
  });

  it('sets hasAssert and hasMessage on properties with assert config', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed({
        fields: {
          email: {
            assert: (v: string) => v.includes('@'),
            message: 'invalid email',
          },
          name: { assert: (v: string) => v.length > 0 },
        }
      })
      class Contact {
        constructor(params: {
          email: string;
          name: string;
          age: number;
        }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].hasDefaults).toBe(false);
    expect(result.classes[0].hasAsserts).toBe(true);
    expect(result.classes[0].properties).toEqual([
      { name: 'email', type: 'string', optional: false, hasDefault: false, hasAssert: true, hasMessage: true, isFreezed: false },
      { name: 'name', type: 'string', optional: false, hasDefault: false, hasAssert: true, hasMessage: false, isFreezed: false },
      { name: 'age', type: 'number', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
    ]);
  });

  it('extracts equalityMode as shallow from @freezed decorator', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed({ equality: 'shallow' })
      class Person {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].equalityMode).toBe('shallow');
  });

  it('defaults equalityMode to deep when not specified', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed()
      class Person {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].equalityMode).toBe('deep');
  });

  it('returns warning for @freezed class with no constructor', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed()
      class Empty {
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].message).toContain("'Empty'");
    expect(result.warnings[0].message).toContain('no constructor');
    expect(result.warnings[0].line).toBeGreaterThan(0);
  });

  it('returns warning for @freezed class with parameterless constructor', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed()
      class NoParams {
        constructor() {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].message).toContain("'NoParams'");
    expect(result.warnings[0].message).toContain('no parameters');
  });

  it('returns empty warnings for valid classes', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed()
      class Valid {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes).toHaveLength(1);
    expect(result.warnings).toEqual([]);
  });

  it('extracts copyWith: false from @freezed decorator', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed({ copyWith: false })
      class Person {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].copyWith).toBe(false);
  });

  it('extracts equal: false from @freezed decorator', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed({ equal: false })
      class Person {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].equal).toBe(false);
  });

  it('extracts copyWith, equal, and toString when specified together', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed({ copyWith: false, equal: false, toString: false })
      class Person {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].copyWith).toBe(false);
    expect(result.classes[0].equal).toBe(false);
    expect(result.classes[0].toString).toBe(false);
  });

  it('leaves copyWith/equal/toString undefined when not specified in decorator', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed()
      class Person {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].copyWith).toBeUndefined();
    expect(result.classes[0].equal).toBeUndefined();
    expect(Object.hasOwn(result.classes[0], 'toString')).toBe(false);
  });

  it('extracts copyWith: true explicitly', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed({ copyWith: true })
      class Person {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].copyWith).toBe(true);
  });

  it('extracts toString: false from @freezed decorator', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed({ toString: false })
      class Person {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].toString).toBe(false);
  });

  it('extracts toString: true explicitly', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed({ toString: true })
      class Person {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].toString).toBe(true);
  });

  it('leaves toString undefined when not specified in decorator', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed()
      class Person {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(Object.hasOwn(result.classes[0], 'toString')).toBe(false);
  });

  it('strips import() prefix from types referencing other files', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile('inner.ts', 'export class Inner { value = ""; }');
    project.createSourceFile(
      'test.ts',
      `
      import { freezed } from 'freezedts';
      import { Inner } from './inner';

      @freezed()
      class Container {
        constructor(params: { items: Map<string, Inner> }) {}
      }
    `,
    );

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].properties[0].type).not.toContain('import(');
  });

  it('extracts typeParameterDecl and typeParameterNames for simple generic <T>', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed()
      class Box<T> {
        constructor(params: { value: T }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].typeParameterDecl).toBe('T');
    expect(result.classes[0].typeParameterNames).toBe('T');
    expect(Object.hasOwn(result.classes[0], 'typeParameterImports')).toBe(false);
  });

  it('extracts constrained type parameter with import', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile('bound.ts', 'export interface Identifiable { id: string; }');
    project.createSourceFile(
      'test.ts',
      `
      import { freezed } from 'freezedts';
      import type { Identifiable } from './bound';

      @freezed()
      class Box<T extends Identifiable> {
        constructor(params: { item: T }) {}
      }
    `,
    );

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].typeParameterDecl).toBe('T extends Identifiable');
    expect(result.classes[0].typeParameterNames).toBe('T');
    expect(result.classes[0].typeParameterImports).toHaveLength(1);
    expect(result.classes[0].typeParameterImports![0].name).toBe('Identifiable');
    expect(result.classes[0].typeParameterImports![0].absolutePath).toContain('bound.ts');
  });

  it('extracts multiple unconstrained type parameters', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed()
      class Pair<A, B> {
        constructor(params: { first: A; second: B }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].typeParameterDecl).toBe('A, B');
    expect(result.classes[0].typeParameterNames).toBe('A, B');
    expect(Object.hasOwn(result.classes[0], 'typeParameterImports')).toBe(false);
  });

  it('extracts multiple constrained type parameters with imports', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile('bound.ts', 'export interface Identifiable { id: string; }');
    project.createSourceFile(
      'test.ts',
      `
      import { freezed } from 'freezedts';
      import type { Identifiable } from './bound';

      @freezed()
      class Box<T extends Identifiable, Items extends T[]> {
        constructor(params: { items: Items; primary: T }) {}
      }
    `,
    );

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].typeParameterDecl).toBe('T extends Identifiable, Items extends T[]');
    expect(result.classes[0].typeParameterNames).toBe('T, Items');
    expect(result.classes[0].typeParameterImports).toHaveLength(1);
    expect(result.classes[0].typeParameterImports![0].name).toBe('Identifiable');
  });

  it('omits typeParameter fields for non-generic class', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed()
      class Plain {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(Object.hasOwn(result.classes[0], 'typeParameterDecl')).toBe(false);
    expect(Object.hasOwn(result.classes[0], 'typeParameterNames')).toBe(false);
    expect(Object.hasOwn(result.classes[0], 'typeParameterImports')).toBe(false);
  });

  it('extracts keyof constraint without generating imports', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed()
      class Accessor<Type, Key extends keyof Type> {
        constructor(params: { source: Type; key: Key }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].typeParameterDecl).toBe('Type, Key extends keyof Type');
    expect(result.classes[0].typeParameterNames).toBe('Type, Key');
    expect(Object.hasOwn(result.classes[0], 'typeParameterImports')).toBe(false);
  });
});
