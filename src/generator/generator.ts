import { Project } from 'ts-morph';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseFreezedClasses } from './parser.js';
import { emitFreezedFile } from './emitter.js';

export interface GenerateResult {
  filesWritten: number;
  errors: string[];
}

export function generate(filePaths: string[]): GenerateResult {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: { strict: true },
  });

  let filesWritten = 0;
  const errors: string[] = [];

  for (const filePath of filePaths) {
    const absolutePath = path.resolve(filePath);
    const sourceFile = project.addSourceFileAtPath(absolutePath);

    try {
      const classes = parseFreezedClasses(sourceFile);
      if (classes.length === 0) continue;

      const output = emitFreezedFile(classes);
      const outputPath = absolutePath.replace(/\.ts$/, '.freezed.ts');
      fs.writeFileSync(outputPath, output, 'utf-8');
      filesWritten++;
    } catch (e) {
      errors.push(`${filePath}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { filesWritten, errors };
}
