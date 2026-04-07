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
        hasFieldConfig: false,
        equalityMode: 'deep',
        properties: [
          { name: 'firstName', type: 'string', optional: false, hasDefault: false, isFreezed: false },
          { name: 'lastName', type: 'string', optional: false, hasDefault: false, isFreezed: false },
          { name: 'age', type: 'number', optional: false, hasDefault: false, isFreezed: false },
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
      { name: 'host', type: 'string', optional: false, hasDefault: false, isFreezed: false },
      { name: 'port', type: 'number', optional: true, hasDefault: false, isFreezed: false },
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
      { name: 'name', type: 'string', optional: false, hasDefault: false, isFreezed: false },
      { name: 'members', type: 'string[]', optional: false, hasDefault: false, isFreezed: false },
      { name: 'metadata', type: 'Record<string, unknown>', optional: false, hasDefault: false, isFreezed: false },
    ]);
  });

  it('detects hasFieldConfig when @freezed has fields option', () => {
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
    expect(result.classes[0].hasFieldConfig).toBe(true);
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
    expect(result.classes[0].properties).toEqual([
      { name: 'name', type: 'string', optional: false, hasDefault: false, isFreezed: false },
      { name: 'age', type: 'number', optional: true, hasDefault: true, isFreezed: false },
      { name: 'email', type: 'string', optional: false, hasDefault: false, isFreezed: false },
    ]);
  });

  it('sets hasFieldConfig false when no fields option', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed()
      class Person {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].hasFieldConfig).toBe(false);
    expect(result.classes[0].properties[0].hasDefault).toBe(false);
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

  it('extracts both copyWith and equal when specified together', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed({ copyWith: false, equal: false })
      class Person {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].copyWith).toBe(false);
    expect(result.classes[0].equal).toBe(false);
  });

  it('leaves copyWith/equal undefined when not specified in decorator', () => {
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
});
