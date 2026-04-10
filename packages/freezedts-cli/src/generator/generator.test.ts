import { describe, it, expect } from 'bun:test';
import { generate } from './generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

function withTempDir(fn: (dir: string) => void | Promise<void>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'freezedts-test-'));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
}

describe('generate', () => {
  it('creates a .freezed.ts file from a source file with @freezed class', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'person.ts');
      fs.writeFileSync(
        sourceFile,
        `
        import { freezed } from 'freezedts';

        @freezed()
        class Person {
          constructor(params: { firstName: string; lastName: string }) {}
        }
        `,
      );

      const result = generate([sourceFile]);
      expect(result.filesWritten).toBe(1);

      const generatedPath = path.join(dir, 'person.freezed.ts');
      expect(fs.existsSync(generatedPath)).toBe(true);

      const content = fs.readFileSync(generatedPath, 'utf-8');
      expect(content).toContain('export abstract class $Person');
      expect(content).toContain('readonly firstName!: string');
      expect(content).toContain('Object.freeze(this)');
    });
  });

  it('skips files with no @freezed classes', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'plain.ts');
      fs.writeFileSync(sourceFile, `class Plain { value = 1; }`);

      const result = generate([sourceFile]);
      expect(result.filesWritten).toBe(0);

      const generatedPath = path.join(dir, 'plain.freezed.ts');
      expect(fs.existsSync(generatedPath)).toBe(false);
    });
  });

  it('handles multiple classes in one file', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'models.ts');
      fs.writeFileSync(
        sourceFile,
        `
        import { freezed } from 'freezedts';

        @freezed()
        class Person {
          constructor(params: { name: string }) {}
        }

        @freezed()
        class Child {
          constructor(params: { name: string; parentName: string }) {}
        }
        `,
      );

      const result = generate([sourceFile]);
      expect(result.filesWritten).toBe(1);

      const content = fs.readFileSync(
        path.join(dir, 'models.freezed.ts'),
        'utf-8',
      );
      expect(content).toContain('export abstract class $Person');
      expect(content).toContain('export abstract class $Child');
    });
  });

  it('generates deep copy proxy for nested @freezed types', async () => {
    await withTempDir((dir) => {
      const filePath = path.join(dir, 'company.ts');
      fs.writeFileSync(filePath, `
      import { freezed } from 'freezedts';

      @freezed()
      class Inner {
        constructor(params: { value: string }) { }
      }

      @freezed()
      class Outer {
        constructor(params: { name: string; inner: Inner }) { }
      }
    `);

      const result = generate([filePath]);
      expect(result.filesWritten).toBe(1);

      const output = fs.readFileSync(
        path.join(dir, 'company.freezed.ts'),
        'utf-8',
      );

      // Should contain the deep copy helper
      expect(output).toContain('createWithProxy');
      // Should contain getter, not method
      expect(output).toContain('get with()');
      expect(output).not.toContain('with(overrides:');
      // inner property should use Inner type (concrete class reference)
      expect(output).toContain('inner: Inner;');
    });
  });

  it('collects warnings for malformed @freezed classes', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'bad.ts');
      fs.writeFileSync(
        sourceFile,
        `
        import { freezed } from 'freezedts';

        @freezed()
        class NoConstructor {
        }
        `,
      );

      const result = generate([sourceFile]);
      expect(result.filesWritten).toBe(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('NoConstructor');
      expect(result.warnings[0]).toContain('no constructor');
    });
  });

  it('generates valid classes and warns about invalid ones in the same file', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'mixed.ts');
      fs.writeFileSync(
        sourceFile,
        `
        import { freezed } from 'freezedts';

        @freezed()
        class Valid {
          constructor(params: { name: string }) {}
        }

        @freezed()
        class Invalid {
        }
        `,
      );

      const result = generate([sourceFile]);
      expect(result.filesWritten).toBe(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Invalid');
    });
  });

  it('omits with() when config has copyWith: false', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'person.ts');
      fs.writeFileSync(
        sourceFile,
        `
        import { freezed } from 'freezedts';

        @freezed()
        class Person {
          constructor(params: { name: string }) {}
        }
        `,
      );

      const result = generate([sourceFile], { format: false, copyWith: false, equal: true });
      expect(result.filesWritten).toBe(1);

      const content = fs.readFileSync(path.join(dir, 'person.freezed.ts'), 'utf-8');
      expect(content).not.toContain('get with()');
      expect(content).not.toContain('PersonWith<');
      expect(content).toContain('equals(other: unknown)');
    });
  });

  it('omits equals() when config has equal: false', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'person.ts');
      fs.writeFileSync(
        sourceFile,
        `
        import { freezed } from 'freezedts';

        @freezed()
        class Person {
          constructor(params: { name: string }) {}
        }
        `,
      );

      const result = generate([sourceFile], { format: false, copyWith: true, equal: false });
      expect(result.filesWritten).toBe(1);

      const content = fs.readFileSync(path.join(dir, 'person.freezed.ts'), 'utf-8');
      expect(content).toContain('get with()');
      expect(content).not.toContain('equals(other: unknown)');
    });
  });

  it('per-class copyWith: true overrides config copyWith: false', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'person.ts');
      fs.writeFileSync(
        sourceFile,
        `
        import { freezed } from 'freezedts';

        @freezed({ copyWith: true })
        class Person {
          constructor(params: { name: string }) {}
        }
        `,
      );

      const result = generate([sourceFile], { format: false, copyWith: false, equal: true });
      expect(result.filesWritten).toBe(1);

      const content = fs.readFileSync(path.join(dir, 'person.freezed.ts'), 'utf-8');
      expect(content).toContain('get with()');
      expect(content).toContain('PersonWith<Self>');
    });
  });

  it('per-class equal: false overrides config equal: true', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'person.ts');
      fs.writeFileSync(
        sourceFile,
        `
        import { freezed } from 'freezedts';

        @freezed({ equal: false })
        class Person {
          constructor(params: { name: string }) {}
        }
        `,
      );

      const result = generate([sourceFile], { format: false, copyWith: true, equal: true });
      expect(result.filesWritten).toBe(1);

      const content = fs.readFileSync(path.join(dir, 'person.freezed.ts'), 'utf-8');
      expect(content).not.toContain('equals(other: unknown)');
    });
  });

  it('formats output when format is true', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'person.ts');
      fs.writeFileSync(
        sourceFile,
        `
        import { freezed } from 'freezedts';

        @freezed()
        class Person {
          constructor(params: { name: string }) {}
        }
        `,
      );

      const unformatted = generate([sourceFile], { format: false, copyWith: true, equal: true });
      const unformattedContent = fs.readFileSync(path.join(dir, 'person.freezed.ts'), 'utf-8');

      const formatted = generate([sourceFile], { format: true, copyWith: true, equal: true });
      const formattedContent = fs.readFileSync(path.join(dir, 'person.freezed.ts'), 'utf-8');

      // Formatted output should differ from unformatted (indentation/spacing changes)
      expect(formattedContent).not.toEqual(unformattedContent);
      // But should contain the same logical content
      expect(formattedContent).toContain('export abstract class $Person');
      expect(formattedContent).toContain('readonly name!: string');
    });
  });

  it('uses default config (all enabled, no format) when config is omitted', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'person.ts');
      fs.writeFileSync(
        sourceFile,
        `
        import { freezed } from 'freezedts';

        @freezed()
        class Person {
          constructor(params: { name: string }) {}
        }
        `,
      );

      const result = generate([sourceFile]);
      expect(result.filesWritten).toBe(1);

      const content = fs.readFileSync(path.join(dir, 'person.freezed.ts'), 'utf-8');
      expect(content).toContain('get with()');
      expect(content).toContain('equals(other: unknown)');
    });
  });

  it('reports error when default value fails its assertion', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'bad-default.ts');
      fs.writeFileSync(
        sourceFile,
        `
      import { freezed } from 'freezedts';

      @freezed({
        fields: {
          port: {
            default: -1,
            assert: (v: number) => v > 0 && v < 65536,
            message: 'port out of range',
          },
        },
      })
      class Config {
        constructor(params: { name: string; port?: number }) {}
      }
    `,
      );

      const result = generate([sourceFile]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Config');
      expect(result.errors[0]).toContain('port');
      expect(result.errors[0]).toContain('default');
    });
  });

  it('passes when default value satisfies assertion', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'good-default.ts');
      fs.writeFileSync(
        sourceFile,
        `
      import { freezed } from 'freezedts';

      @freezed({
        fields: {
          port: {
            default: 3000,
            assert: (v: number) => v > 0 && v < 65536,
            message: 'port out of range',
          },
        },
      })
      class Config {
        constructor(params: { name: string; port?: number }) {}
      }
    `,
      );

      const result = generate([sourceFile]);
      expect(result.errors).toEqual([]);
    });
  });

  it('skips validation when default or assert uses external references', async () => {
    await withTempDir((dir) => {
      const sourceFile = path.join(dir, 'complex-default.ts');
      fs.writeFileSync(
        sourceFile,
        `
      import { freezed } from 'freezedts';

      const DEFAULT_PORT = 3000;

      @freezed({
        fields: {
          port: {
            default: DEFAULT_PORT,
            assert: (v: number) => v > 0,
          },
        },
      })
      class Config {
        constructor(params: { name: string; port?: number }) {}
      }
    `,
      );

      const result = generate([sourceFile]);
      // Should not error — validation skipped for non-literal references
      expect(result.errors).toEqual([]);
      expect(result.filesWritten).toBe(1);
    });
  });

  it('resolves isFreezed across files and generates imports', async () => {
    await withTempDir((dir) => {
      const innerFile = path.join(dir, 'inner.ts');
      fs.writeFileSync(
        innerFile,
        `
        import { freezed } from 'freezedts';

        @freezed()
        class Inner {
          constructor(params: { value: string }) {}
        }
      `,
      );

      const outerFile = path.join(dir, 'outer.ts');
      fs.writeFileSync(
        outerFile,
        `
        import { freezed } from 'freezedts';
        import { Inner } from './inner.js';

        @freezed()
        class Outer {
          constructor(params: { name: string; inner: Inner }) {}
        }
      `,
      );

      const result = generate([innerFile, outerFile]);
      expect(result.filesWritten).toBe(2);

      const outerContent = fs.readFileSync(
        path.join(dir, 'outer.freezed.ts'),
        'utf-8',
      );

      // inner property should use Inner type (cross-file resolution)
      expect(outerContent).toContain('inner: Inner;');
      expect(outerContent).toContain('readonly inner!: Inner;');

      // With type should include nested inner member
      expect(outerContent).toContain('inner: InnerWith<Self>;');

      // Must import Inner from the source file
      expect(outerContent).toContain("import type { Inner } from './inner.js'");
      // Must import InnerWith from the generated file
      expect(outerContent).toContain("from './inner.freezed.js'");
      expect(outerContent).toContain('InnerWith');
    });
  });
});
