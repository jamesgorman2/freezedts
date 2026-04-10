import { SourceFile, Type, Symbol as MorphSymbol, Node, SyntaxKind, Decorator, ObjectLiteralExpression } from 'ts-morph';

export interface ParsedProperty {
  name: string;
  type: string;
  optional: boolean;
  hasDefault: boolean;
  hasAssert: boolean;
  hasMessage: boolean;
  isFreezed: boolean;
  importFrom?: string;
  importSource?: string;
  isTypeOnly?: boolean;
}

export interface ParsedFreezedClass {
  className: string;
  generatedClassName: string;
  properties: ParsedProperty[];
  hasDefaults: boolean;
  hasAsserts: boolean;
  equalityMode: 'deep' | 'shallow';
  copyWith?: boolean;
  equal?: boolean;
  toString?: boolean;
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

    const { hasDefaults, hasAsserts, defaultFields, assertFields, messageFields } = extractFieldConfig(decorator);
    const equalityMode = extractEqualityMode(decorator);
    const { copyWith, equal, toString: toStringOpt } = extractGenerationOptions(decorator);
    const paramType = paramsParam.getType();
    const properties = extractProperties(paramType, defaultFields, assertFields, messageFields);

    results.push({
      className,
      generatedClassName: `$${className}`,
      properties,
      hasDefaults,
      hasAsserts,
      equalityMode,
      ...(copyWith !== undefined && { copyWith }),
      ...(equal !== undefined && { equal }),
      ...(toStringOpt !== undefined && { toString: toStringOpt }),
    });
  }

  return { classes: results, warnings };
}

interface FieldConfigResult {
  hasDefaults: boolean;
  hasAsserts: boolean;
  defaultFields: Set<string>;
  assertFields: Set<string>;
  messageFields: Set<string>;
}

const NO_FIELD_CONFIG: FieldConfigResult = {
  hasDefaults: false,
  hasAsserts: false,
  defaultFields: new Set(),
  assertFields: new Set(),
  messageFields: new Set(),
};

function extractFieldConfig(decorator: Decorator): FieldConfigResult {
  const args = decorator.getArguments();
  if (args.length === 0) return NO_FIELD_CONFIG;

  const optionsArg = args[0];
  if (!Node.isObjectLiteralExpression(optionsArg)) return NO_FIELD_CONFIG;

  const fieldsProp = optionsArg.getProperty('fields');
  if (!fieldsProp || !Node.isPropertyAssignment(fieldsProp)) return NO_FIELD_CONFIG;

  const fieldsInit = fieldsProp.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
  if (!fieldsInit) return { hasDefaults: false, hasAsserts: false, defaultFields: new Set(), assertFields: new Set(), messageFields: new Set() };

  const defaultFields = new Set<string>();
  const assertFields = new Set<string>();
  const messageFields = new Set<string>();

  for (const prop of fieldsInit.getProperties()) {
    if (Node.isPropertyAssignment(prop)) {
      const fieldInit = prop.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
      if (fieldInit) {
        const name = prop.getName();
        if (fieldInit.getProperty('default')) defaultFields.add(name);
        if (fieldInit.getProperty('assert')) assertFields.add(name);
        if (fieldInit.getProperty('message')) messageFields.add(name);
      }
    }
  }

  return {
    hasDefaults: defaultFields.size > 0,
    hasAsserts: assertFields.size > 0,
    defaultFields,
    assertFields,
    messageFields,
  };
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

function extractGenerationOptions(decorator: Decorator): { copyWith?: boolean; equal?: boolean; toString?: boolean } {
  const args = decorator.getArguments();
  if (args.length === 0) return { copyWith: undefined, equal: undefined, toString: undefined };

  const optionsArg = args[0];
  if (!Node.isObjectLiteralExpression(optionsArg)) return { copyWith: undefined, equal: undefined, toString: undefined };

  return {
    copyWith: extractBooleanOption(optionsArg, 'copyWith'),
    equal: extractBooleanOption(optionsArg, 'equal'),
    toString: extractBooleanOption(optionsArg, 'toString'),
  };
}

function extractProperties(
  type: Type,
  defaultFields: Set<string>,
  assertFields: Set<string>,
  messageFields: Set<string>,
): ParsedProperty[] {
  return type.getProperties().map((prop: MorphSymbol) => {
    const propType = prop.getValueDeclaration()?.getType();
    const isOptional = prop.isOptional();

    let typeText = propType?.getText() ?? 'unknown';

    // Extract import source path before stripping import(...) prefixes
    let importSource: string | undefined;
    const importMatch = typeText.match(/import\("([^"]+)"\)\./);
    if (importMatch) {
      importSource = importMatch[1];
    }

    typeText = typeText.replace(/import\(.*?\)\./g, '');

    // Type-only if the resolved type is not a class or enum (i.e. type alias or interface)
    const isTypeOnly = importSource && propType
      ? !propType.isClass() && !propType.isEnum()
      : undefined;

    const name = prop.getName();
    return {
      name,
      type: typeText,
      optional: isOptional,
      hasDefault: defaultFields.has(name),
      hasAssert: assertFields.has(name),
      hasMessage: messageFields.has(name),
      isFreezed: false,
      ...(importSource !== undefined && { importSource }),
      ...(isTypeOnly !== undefined && { isTypeOnly }),
    };
  });
}
