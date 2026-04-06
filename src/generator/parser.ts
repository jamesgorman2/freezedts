import { SourceFile, Type, Symbol as MorphSymbol } from 'ts-morph';

export interface ParsedProperty {
  name: string;
  type: string;
  optional: boolean;
}

export interface ParsedFreezedClass {
  className: string;
  generatedClassName: string;
  properties: ParsedProperty[];
}

export function parseFreezedClasses(sourceFile: SourceFile): ParsedFreezedClass[] {
  const classes = sourceFile.getClasses();
  const results: ParsedFreezedClass[] = [];

  for (const cls of classes) {
    const hasFreezed = cls.getDecorators().some(
      (d) => d.getName() === 'freezed',
    );
    if (!hasFreezed) continue;

    const className = cls.getName();
    if (!className) continue;

    const constructor = cls.getConstructors()[0];
    if (!constructor) continue;

    const paramsParam = constructor.getParameters()[0];
    if (!paramsParam) continue;

    const paramType = paramsParam.getType();
    const properties = extractProperties(paramType);

    results.push({
      className,
      generatedClassName: `$${className}`,
      properties,
    });
  }

  return results;
}

function extractProperties(type: Type): ParsedProperty[] {
  return type.getProperties().map((prop: MorphSymbol) => {
    const propType = prop.getValueDeclaration()?.getType();
    const isOptional = prop.isOptional();

    let typeText = propType?.getText() ?? 'unknown';
    // ts-morph may return fully qualified types; simplify common cases
    typeText = typeText
      .replace(/^import\(.*?\)\./g, '');

    return {
      name: prop.getName(),
      type: typeText,
      optional: isOptional,
    };
  });
}
