import { Project, Node, SyntaxKind } from 'ts-morph';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseFreezedClasses } from './parser.js';
import { emitFreezedFile } from './emitter.js';
import { resolveClassOptions, DEFAULTS as DEFAULT_CONFIG } from './config.js';
import type { ResolvedConfig } from './config.js';

export interface GenerateResult {
  filesWritten: number;
  errors: string[];
  warnings: string[];
}

function validateDefaults(
  cls: { className: string; properties: Array<{ name: string; hasDefault: boolean; hasAssert: boolean }> },
  sourceFile: import('ts-morph').SourceFile,
  project: Project,
): string[] {
  const errors: string[] = [];

  for (const prop of cls.properties) {
    if (!prop.hasDefault || !prop.hasAssert) continue;

    // Find the field config in the AST to extract default and assert text
    const classDecl = sourceFile.getClasses().find(c => c.getName() === cls.className);
    if (!classDecl) continue;

    const decorator = classDecl.getDecorators().find(d => d.getName() === 'freezed');
    if (!decorator) continue;

    const args = decorator.getArguments();
    if (args.length === 0) continue;

    const optionsArg = args[0];
    if (!Node.isObjectLiteralExpression(optionsArg)) continue;

    const fieldsProp = optionsArg.getProperty('fields');
    if (!fieldsProp || !Node.isPropertyAssignment(fieldsProp)) continue;

    const fieldsInit = fieldsProp.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
    if (!fieldsInit) continue;

    const fieldProp = fieldsInit.getProperty(prop.name);
    if (!fieldProp || !Node.isPropertyAssignment(fieldProp)) continue;

    const fieldInit = fieldProp.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
    if (!fieldInit) continue;

    const defaultProp = fieldInit.getProperty('default');
    const assertProp = fieldInit.getProperty('assert');
    if (!defaultProp || !assertProp) continue;
    if (!Node.isPropertyAssignment(defaultProp) || !Node.isPropertyAssignment(assertProp)) continue;

    const defaultInit = defaultProp.getInitializer();
    const assertInit = assertProp.getInitializer();
    if (!defaultInit || !assertInit) continue;

    const defaultText = defaultInit.getText();
    const assertText = assertInit.getText();

    // Transpile TypeScript to JavaScript and eval
    const testExpr = `(${assertText})(${defaultText})`;
    try {
      const tmpFile = project.createSourceFile('__validate_default.ts', `export default ${testExpr};\n`);
      const emitOutput = tmpFile.getEmitOutput();
      project.removeSourceFile(tmpFile);
      const jsFiles = emitOutput.getOutputFiles();
      if (jsFiles.length === 0) continue;
      const js = jsFiles[0].getText();
      // Extract the default export value from the compiled JS
      // CommonJS: exports.default = expr;  ESM: export default expr;
      const match = js.match(/exports\.default\s*=\s*(.+);/s) ?? js.match(/export default (.+);/s);
      if (!match) continue;
      const result = eval(match[1]);
      if (result === false) {
        errors.push(`Default value for '${cls.className}.${prop.name}' fails its assertion`);
      }
    } catch {
      // Can't evaluate (external references, complex expressions) — skip silently
    }
  }

  return errors;
}

export function generate(filePaths: string[], config?: ResolvedConfig): GenerateResult {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: { strict: true },
  });

  const resolvedConfig = config ?? DEFAULT_CONFIG;

  let filesWritten = 0;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Phase 1: Parse all files
  const parsed = new Map<string, { absolutePath: string; classes: ReturnType<typeof parseFreezedClasses>['classes'] }>();

  for (const filePath of filePaths) {
    const absolutePath = path.resolve(filePath);
    const sourceFile = project.addSourceFileAtPath(absolutePath);
    try {
      const { classes, warnings: parseWarnings } = parseFreezedClasses(sourceFile);
      for (const w of parseWarnings) {
        warnings.push(`${filePath}:${w.line}: ${w.message}`);
      }
      for (const cls of classes) {
        const validationErrors = validateDefaults(cls, sourceFile, project);
        errors.push(...validationErrors.map(e => `${filePath}: ${e}`));
      }
      if (classes.length > 0) {
        parsed.set(filePath, { absolutePath, classes });
      }
    } catch (e) {
      errors.push(`${filePath}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Phase 2: Resolve isFreezed — mark properties whose type matches any
  // @freezed class name across all parsed files
  const classToFile = new Map<string, string>();
  for (const [filePath, { classes }] of parsed) {
    for (const cls of classes) {
      classToFile.set(cls.className, filePath);
    }
  }
  for (const [filePath, { absolutePath, classes }] of parsed) {
    for (const cls of classes) {
      for (const prop of cls.properties) {
        const baseType = prop.type.replace(/\s*\|\s*undefined$/, '').trim();
        const sourceFilePath = classToFile.get(baseType);
        if (sourceFilePath) {
          prop.isFreezed = true;
          if (sourceFilePath !== filePath) {
            const fromAbsolute = parsed.get(sourceFilePath)!.absolutePath;
            const relativePath = path.relative(
              path.dirname(absolutePath),
              fromAbsolute.replace(/\.ts$/, '.js'),
            );
            prop.importFrom = relativePath.startsWith('.')
              ? relativePath.replace(/\\/g, '/')
              : './' + relativePath.replace(/\\/g, '/');
          }
        } else if (prop.importSource && !prop.importFrom) {
          // Non-freezed type from another file — compute relative import path
          const relativePath = path.relative(
            path.dirname(absolutePath),
            prop.importSource + '.js',
          );
          prop.importFrom = relativePath.startsWith('.')
            ? relativePath.replace(/\\/g, '/')
            : './' + relativePath.replace(/\\/g, '/');
        }
      }
    }
  }

  // Phase 3: Resolve generation options — merge per-class with config defaults
  for (const { classes } of parsed.values()) {
    for (const cls of classes) {
      const resolved = resolveClassOptions(cls, resolvedConfig);
      cls.copyWith = resolved.copyWith;
      cls.equal = resolved.equal;
      cls.toString = resolved.toString;
    }
  }

  // Phase 4: Emit and write
  for (const [filePath, { absolutePath, classes }] of parsed) {
    try {
      let output = emitFreezedFile(classes);

      // Collect cross-file imports
      const valueImports = new Map<string, Set<string>>();
      const typeImports = new Map<string, Set<string>>();
      for (const cls of classes) {
        for (const prop of cls.properties) {
          if (prop.importFrom) {
            const baseType = prop.type.replace(/\s*\|\s*undefined$/, '').trim();
            // Import the type itself from the source .js file
            const targetMap = prop.isTypeOnly ? typeImports : valueImports;
            if (!targetMap.has(prop.importFrom)) targetMap.set(prop.importFrom, new Set());
            targetMap.get(prop.importFrom)!.add(baseType);

            // For freezed cross-file types, also import the With type from .freezed.js
            if (prop.isFreezed && cls.copyWith !== false) {
              const freezedImportPath = prop.importFrom.replace(/\.js$/, '.freezed.js');
              if (!valueImports.has(freezedImportPath)) valueImports.set(freezedImportPath, new Set());
              valueImports.get(freezedImportPath)!.add(`${baseType}With`);
            }
          }
        }
      }
      if (valueImports.size > 0 || typeImports.size > 0) {
        const lines: string[] = [];
        for (const [importPath, symbols] of valueImports.entries()) {
          lines.push(`import { ${[...symbols].join(', ')} } from '${importPath}';`);
        }
        for (const [importPath, symbols] of typeImports.entries()) {
          lines.push(`import type { ${[...symbols].join(', ')} } from '${importPath}';`);
        }
        const importLines = lines.join('\n');
        output = output.replace(
          '// generated by freezedts, do not edit\n',
          `// generated by freezedts, do not edit\n\n${importLines}\n`,
        );
      }

      if (resolvedConfig.format) {
        output = formatOutput(output);
      }
      const outputPath = absolutePath.replace(/\.ts$/, '.freezed.ts');
      fs.writeFileSync(outputPath, output, 'utf-8');
      filesWritten++;
    } catch (e) {
      errors.push(`${filePath}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { filesWritten, errors, warnings };
}

const formatProject = new Project({ useInMemoryFileSystem: true });

function formatOutput(code: string): string {
  const existing = formatProject.getSourceFile('format.ts');
  if (existing) formatProject.removeSourceFile(existing);
  const file = formatProject.createSourceFile('format.ts', code);
  file.formatText();
  return file.getFullText();
}
