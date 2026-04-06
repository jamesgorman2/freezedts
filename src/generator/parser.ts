import { SourceFile, Type, Symbol as MorphSymbol, Node, SyntaxKind, Decorator } from 'ts-morph';

export interface ParsedProperty {
  name: string;
  type: string;
  optional: boolean;
  hasDefault: boolean;
}

export interface ParsedFreezedClass {
  className: string;
  generatedClassName: string;
  properties: ParsedProperty[];
  hasFieldConfig: boolean;
}

export function parseFreezedClasses(sourceFile: SourceFile): ParsedFreezedClass[] {
  const classes = sourceFile.getClasses();
  const results: ParsedFreezedClass[] = [];

  for (const cls of classes) {
    const decorator = cls.getDecorators().find(
      (d) => d.getName() === 'freezed',
    );
    if (!decorator) continue;

    const className = cls.getName();
    if (!className) continue;

    const constructor = cls.getConstructors()[0];
    if (!constructor) continue;

    const paramsParam = constructor.getParameters()[0];
    if (!paramsParam) continue;

    const { hasFieldConfig, defaultFields } = extractFieldConfig(decorator);
    const paramType = paramsParam.getType();
    const properties = extractProperties(paramType, defaultFields);

    results.push({
      className,
      generatedClassName: `$${className}`,
      properties,
      hasFieldConfig,
    });
  }

  return results;
}

function extractFieldConfig(decorator: Decorator): { hasFieldConfig: boolean; defaultFields: Set<string> } {
  const args = decorator.getArguments();
  if (args.length === 0) return { hasFieldConfig: false, defaultFields: new Set() };

  const optionsArg = args[0];
  if (!Node.isObjectLiteralExpression(optionsArg))
    return { hasFieldConfig: false, defaultFields: new Set() };

  const fieldsProp = optionsArg.getProperty('fields');
  if (!fieldsProp || !Node.isPropertyAssignment(fieldsProp))
    return { hasFieldConfig: false, defaultFields: new Set() };

  const fieldsInit = fieldsProp.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
  if (!fieldsInit) return { hasFieldConfig: true, defaultFields: new Set() };

  const defaultFields = new Set<string>();
  for (const prop of fieldsInit.getProperties()) {
    if (Node.isPropertyAssignment(prop)) {
      const fieldInit = prop.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
      if (fieldInit && fieldInit.getProperty('default')) {
        defaultFields.add(prop.getName());
      }
    }
  }

  return { hasFieldConfig: true, defaultFields };
}

function extractProperties(type: Type, defaultFields: Set<string>): ParsedProperty[] {
  return type.getProperties().map((prop: MorphSymbol) => {
    const propType = prop.getValueDeclaration()?.getType();
    const isOptional = prop.isOptional();

    let typeText = propType?.getText() ?? 'unknown';
    typeText = typeText.replace(/^import\(.*?\)\./g, '');

    return {
      name: prop.getName(),
      type: typeText,
      optional: isOptional,
      hasDefault: defaultFields.has(prop.getName()),
    };
  });
}
