import { SourceFile, Type, Symbol as MorphSymbol, Node, SyntaxKind, Decorator, ObjectLiteralExpression } from 'ts-morph';

export interface ParsedProperty {
  name: string;
  type: string;
  optional: boolean;
  hasDefault: boolean;
  isFreezed: boolean;
}

export interface ParsedFreezedClass {
  className: string;
  generatedClassName: string;
  properties: ParsedProperty[];
  hasFieldConfig: boolean;
  equalityMode: 'deep' | 'shallow';
  copyWith?: boolean;
  equal?: boolean;
}

export interface ParseWarning {
  message: string;
  line: number;
}

export interface ParseResult {
  classes: ParsedFreezedClass[];
  warnings: ParseWarning[];
}

export function parseFreezedClasses(sourceFile: SourceFile): ParseResult {
  const classes = sourceFile.getClasses();
  const results: ParsedFreezedClass[] = [];
  const warnings: ParseWarning[] = [];

  for (const cls of classes) {
    const decorator = cls.getDecorators().find(
      (d) => d.getName() === 'freezed',
    );
    if (!decorator) continue;

    const className = cls.getName();
    if (!className) continue;

    const constructor = cls.getConstructors()[0];
    if (!constructor) {
      warnings.push({
        message: `@freezed class '${className}' has no constructor`,
        line: cls.getStartLineNumber(),
      });
      continue;
    }

    const paramsParam = constructor.getParameters()[0];
    if (!paramsParam) {
      warnings.push({
        message: `@freezed class '${className}' constructor has no parameters`,
        line: cls.getStartLineNumber(),
      });
      continue;
    }

    const { hasFieldConfig, defaultFields } = extractFieldConfig(decorator);
    const equalityMode = extractEqualityMode(decorator);
    const { copyWith, equal } = extractGenerationOptions(decorator);
    const paramType = paramsParam.getType();
    const properties = extractProperties(paramType, defaultFields);

    results.push({
      className,
      generatedClassName: `$${className}`,
      properties,
      hasFieldConfig,
      equalityMode,
      ...(copyWith !== undefined && { copyWith }),
      ...(equal !== undefined && { equal }),
    });
  }

  return { classes: results, warnings };
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

function extractEqualityMode(decorator: Decorator): 'deep' | 'shallow' {
  const args = decorator.getArguments();
  if (args.length === 0) return 'deep';

  const optionsArg = args[0];
  if (!Node.isObjectLiteralExpression(optionsArg)) return 'deep';

  const equalityProp = optionsArg.getProperty('equality');
  if (!equalityProp || !Node.isPropertyAssignment(equalityProp)) return 'deep';

  const init = equalityProp.getInitializer();
  if (!init) return 'deep';

  const text = init.getText().replace(/['"]/g, '');
  return text === 'shallow' ? 'shallow' : 'deep';
}

function extractBooleanOption(optionsArg: ObjectLiteralExpression, name: string): boolean | undefined {
  const prop = optionsArg.getProperty(name);
  if (!prop || !Node.isPropertyAssignment(prop)) return undefined;

  const init = prop.getInitializer();
  if (!init) return undefined;

  const text = init.getText();
  if (text === 'true') return true;
  if (text === 'false') return false;
  return undefined;
}

function extractGenerationOptions(decorator: Decorator): { copyWith?: boolean; equal?: boolean } {
  const args = decorator.getArguments();
  if (args.length === 0) return {};

  const optionsArg = args[0];
  if (!Node.isObjectLiteralExpression(optionsArg)) return {};

  return {
    copyWith: extractBooleanOption(optionsArg, 'copyWith'),
    equal: extractBooleanOption(optionsArg, 'equal'),
  };
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
      isFreezed: false,
    };
  });
}
