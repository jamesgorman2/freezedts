import { describe, it, expect } from 'vitest';
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
    expect(result).toEqual([
      {
        className: 'Person',
        generatedClassName: '$Person',
        properties: [
          { name: 'firstName', type: 'string', optional: false },
          { name: 'lastName', type: 'string', optional: false },
          { name: 'age', type: 'number', optional: false },
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
    expect(result[0].properties).toEqual([
      { name: 'host', type: 'string', optional: false },
      { name: 'port', type: 'number', optional: true },
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
    expect(result).toHaveLength(2);
    expect(result[0].className).toBe('Person');
    expect(result[1].className).toBe('Child');
  });

  it('ignores classes without @freezed decorator', () => {
    const project = createTestProject(`
      class NotFreezed {
        constructor(params: { value: number }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result).toEqual([]);
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
    expect(result[0].properties).toEqual([
      { name: 'name', type: 'string', optional: false },
      { name: 'members', type: 'string[]', optional: false },
      { name: 'metadata', type: 'Record<string, unknown>', optional: false },
    ]);
  });
});
