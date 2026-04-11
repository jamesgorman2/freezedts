import { SourceFile, Type, Symbol as MorphSymbol, Node, SyntaxKind, Decorator, ObjectLiteralExpression } from 'ts-morph';

export interface TypeImport {
  name: string;
  absolutePath: string;
}

export interface ParsedProperty {
  name: string;
  type: string;
  optional: boolean;
  hasDefault: boolean;
  hasAssert: boolean;
  hasMessage: boolean;
  isFreezed: boolean;
  importFrom?: string;
  typeImports?: TypeImport[];
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
  typeParameterDecl?: string;
  typeParameterNames?: string;
  typeParameterImports?: TypeImport[];
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

    // Extract generic type parameters
    const typeParams = cls.getTypeParameters();
    let typeParameterDecl: string | undefined;
    let typeParameterNames: string | undefined;
    let typeParameterImports: TypeImport[] | undefined;
    if (typeParams.length > 0) {
      typeParameterDecl = typeParams.map(tp => tp.getText()).join(', ');
      typeParameterNames = typeParams.map(tp => tp.getName()).join(', ');
      const typeParamNameSet = new Set(typeParams.map(tp => tp.getName()));
      const importMap = buildSourceImportMap(sourceFile);
      const tpImports: TypeImport[] = [];
      for (const tp of typeParams) {
        const constraint = tp.getConstraint();
        if (!constraint) continue;
        const identifiers = extractTypeIdentifiers(constraint.getText());
        for (const id of identifiers) {
          if (typeParamNameSet.has(id)) continue;
          const absolutePath = importMap.get(id);
          if (absolutePath) {
            tpImports.push({ name: id, absolutePath });
          }
        }
      }
      if (tpImports.length > 0) typeParameterImports = tpImports;
    }

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
    const properties = extractProperties(paramType, sourceFile, defaultFields, assertFields, messageFields);

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
      ...(typeParameterDecl && { typeParameterDecl }),
      ...(typeParameterNames && { typeParameterNames }),
      ...(typeParameterImports && { typeParameterImports }),
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

function buildSourceImportMap(sourceFile: SourceFile): Map<string, string> {
  const map = new Map<string, string>();
  for (const importDecl of sourceFile.getImportDeclarations()) {
    const resolved = importDecl.getModuleSpecifierSourceFile();
    if (!resolved) continue;
    const absolutePath = resolved.getFilePath();
    for (const named of importDecl.getNamedImports()) {
      const localName = named.getAliasNode()?.getText() ?? named.getName();
      map.set(localName, absolutePath);
    }
  }
  return map;
}

export function extractTypeIdentifiers(typeText: string): string[] {
  const matches = typeText.match(/\b[A-Z]\w*/g) ?? [];
  return [...new Set(matches)];
}

function extractProperties(
  type: Type,
  sourceFile: SourceFile,
  defaultFields: Set<string>,
  assertFields: Set<string>,
  messageFields: Set<string>,
): ParsedProperty[] {
  const importMap = buildSourceImportMap(sourceFile);

  return type.getProperties().map((prop: MorphSymbol) => {
    const isOptional = prop.isOptional();
    const decl = prop.getValueDeclaration();

    // Prefer literal type text from the source AST (preserves aliases and generics)
    let typeText: string;
    const typeNode = decl && Node.isPropertySignature(decl) ? decl.getTypeNode() : undefined;
    if (typeNode) {
      typeText = typeNode.getText();
    } else {
      // Fallback: use resolved type with import() prefix stripping
      const propType = decl?.getType();
      typeText = propType?.getText() ?? 'unknown';
      typeText = typeText.replace(/import\(.*?\)\./g, '');
    }

    // Build typeImports: cross-reference type identifiers with source file imports
    const identifiers = extractTypeIdentifiers(typeText);
    const typeImports: TypeImport[] = [];
    for (const id of identifiers) {
      const absolutePath = importMap.get(id);
      if (absolutePath) {
        typeImports.push({ name: id, absolutePath });
      }
    }

    const name = prop.getName();
    return {
      name,
      type: typeText,
      optional: isOptional,
      hasDefault: defaultFields.has(name),
      hasAssert: assertFields.has(name),
      hasMessage: messageFields.has(name),
      isFreezed: false,
      ...(typeImports.length > 0 && { typeImports }),
    };
  });
}
