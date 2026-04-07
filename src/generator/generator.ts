import { Project } from 'ts-morph';
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
      if (classes.length > 0) {
        parsed.set(filePath, { absolutePath, classes });
      }
    } catch (e) {
      errors.push(`${filePath}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Phase 2: Resolve isFreezed — within each file, mark properties whose type
  // matches another @freezed class name in the same file
  for (const { classes } of parsed.values()) {
    const classNames = new Set(classes.map(c => c.className));
    for (const cls of classes) {
      for (const prop of cls.properties) {
        prop.isFreezed = classNames.has(prop.type);
      }
    }
  }

  // Phase 3: Resolve generation options — merge per-class with config defaults
  for (const { classes } of parsed.values()) {
    for (const cls of classes) {
      const resolved = resolveClassOptions(cls, resolvedConfig);
      cls.copyWith = resolved.copyWith;
      cls.equal = resolved.equal;
    }
  }

  // Phase 4: Emit and write
  for (const [filePath, { absolutePath, classes }] of parsed) {
    try {
      let output = emitFreezedFile(classes);

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

function formatOutput(code: string): string {
  const formatProject = new Project({ useInMemoryFileSystem: true });
  const file = formatProject.createSourceFile('format.ts', code);
  file.formatText();
  return file.getFullText();
}
