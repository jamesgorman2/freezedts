# freezedts

Immutable class generation for TypeScript — deep copying, value equality, and runtime immutability via decorators and code generation.

A TypeScript port of Dart's [freezed](https://github.com/rrousselGit/freezed) package by Remi Rousselet.

## Table of Contents

- [Motivation](#motivation)
- [Installation](#installation)
- [Running the Generator](#running-the-generator)
- [Creating Classes](#creating-classes)
  - [Basic Usage](#basic-usage)
  - [Field Configuration](#field-configuration)
  - [Nested Freezed Types](#nested-freezed-types)
  - [Collections](#collections)
- [Deep Copy](#deep-copy)
- [Deep Equality](#deep-equality)
- [Configuration](#configuration)
  - [Per-Class Configuration](#per-class-configuration)
  - [Project-Wide Configuration](#project-wide-configuration)
  - [Resolution Order](#resolution-order)
- [Building the Library](#building-the-library)

## Motivation

TypeScript has no native support for immutable classes with named parameters. Achieving truly immutable data classes requires significant boilerplate:

- `readonly` on every property
- `Object.freeze()` in every constructor
- Manual `copyWith` methods for creating modified copies
- Manual `equals` methods for structural comparison
- Recursive freezing of nested collections

freezedts eliminates this boilerplate. You write a class with a decorator, and the generator produces an abstract base class that handles immutability, deep copying, value equality, `toString()`, and collection freezing.

```ts
// You write this:
@freezed()
class Person extends $Person {
  constructor(params: { firstName: string; lastName: string; age: number }) {
    super(params);
  }
}
```
The generator produces `$Person` with:
- readonly properties
- `Object.freeze(this)` in the constructor
- `person.with({ age: 31 })` for copying
- `person.equals(other)` for deep structural comparison
- `person.toString()` → `"Person(firstName: John, lastName: Smith, age: 30)"`
- Recursive freezing of arrays, Maps, and Sets


## Installation

```bash
npm install freezedts
```

`freezedts` must be a runtime dependency. It has a small runtime footprint and
no transient runtime dependencies.

**Requirements:** TypeScript 6, ESM, TC39 stage 3 decorators.

## Running the Generator

```bash
# Generate .freezed.ts files for all source files in the current directory
npx freezedts

# Generate for a specific directory
npx freezedts src

# Watch mode — regenerate on file changes
npx freezedts --watch
npx freezedts -w src

# Use a custom config file
npx freezedts --config path/to/freezedts.config.yaml
npx freezedts -c custom.yaml -w src
```

The generator scans for `.ts` files containing `@freezed()` classes and produces `.freezed.ts` files alongside them. 

Only changed files are regenerated (mtime-based).

## Creating Classes

### Basic Usage

1. Create your source file (e.g., `person.ts`):

```ts
import { freezed } from 'freezedts';
import { $Person } from './person.freezed.ts';

@freezed()
class Person extends $Person {
  constructor(params: { firstName: string; lastName: string; age: number }) {
    super(params);
  }
}
```

2. Run the generator:

```bash
npx freezedts
```

3. The generated `person.freezed.ts` provides an abstract base class `$Person` with `readonly` properties, `Object.freeze(this)`, `with()`, `equals()`, and `toString()`.

### Field Configuration

Configure defaults and validation in the `@freezed()` decorator's `fields` option:

```ts
@freezed({
  fields: {
    port: {
      default: 3000,
      assert: (v: number) => v > 0 && v < 65536,
      message: 'port out of range',
    },
    host: { default: 'localhost' },
  },
})
class ServerConfig extends $ServerConfig {
  constructor(params: { name: string; host?: string; port?: number }) {
    super(params);
  }
}

const config = new ServerConfig({ name: 'api' });
config.host; // 'localhost'
config.port; // 3000

new ServerConfig({ name: 'api', port: -1 }); // throws: "port out of range"
```

Field config options:

| Option | Type | Description |
|--------|------|-------------|
| `default` | `unknown` | Default value when the parameter is `undefined` |
| `assert` | `(value) => boolean` | Validation function run at construction time |
| `message` | `string` | Error message when the assertion fails |

### Collections

Arrays, Maps, and Sets are recursively frozen at construction time. Mutation attempts throw at runtime:

```ts
@freezed()
class Team extends $Team {
  constructor(params: { name: string; members: string[]; scores: number[] }) {
    super(params);
  }
}

const team = new Team({ name: 'Alpha', members: ['Alice', 'Bob'], scores: [10, 20] });
team.members.push('Charlie'); // throws TypeError
team.members[0] = 'Zara';    // throws TypeError
```

## Deep Copy

The `with()` method creates a new frozen instance with selective property overrides:

```ts
const alice = new Person({ firstName: 'Alice', lastName: 'Smith', age: 30 });
const bob = alice.with({ firstName: 'Bob' });
// bob → Person(firstName: Bob, lastName: Smith, age: 30)
// alice is unchanged
```

For nested `@freezed` types, `with` supports proxy-chained deep copies:

```ts
@freezed()
class Assistant extends $Assistant {
  constructor(params: { name: string }) { super(params); }
}

@freezed()
class Director extends $Director {
  constructor(params: { name: string; assistant: Assistant }) { super(params); }
}

@freezed()
class Company extends $Company {
  constructor(params: { name: string; director: Director }) { super(params); }
}

const co = new Company({
  name: 'Acme',
  director: new Director({
    name: 'Jane',
    assistant: new Assistant({ name: 'John' }),
  }),
});

// Shallow copy
co.with({ name: 'NewCo' });

// Deep copy — update a nested freezed property
co.with.director({ name: 'Larry' });
co.with.director.assistant({ name: 'Sue' });
```


## Deep Equality

The `equals()` method performs structural comparison:

```ts
const a = new Person({ firstName: 'Alice', lastName: 'Smith', age: 30 });
const b = new Person({ firstName: 'Alice', lastName: 'Smith', age: 30 });

a === b;       // false (different instances)
a.equals(b);   // true (same structure)
```

Configure equality mode per class:

```ts
@freezed({ equality: 'deep' })    // default — recursive structural comparison
class DeepPerson extends $DeepPerson { ... }

@freezed({ equality: 'shallow' }) // === for primitives, .equals() for nested freezed types
class ShallowPerson extends $ShallowPerson { ... }
```

## Configuration

### Per-Class Configuration

Disable generation of specific methods via the `@freezed()` decorator:

```ts
@freezed({ copyWith: false })   // skip with() generation
@freezed({ equal: false })      // skip equals() generation
@freezed({ toString: false })   // skip toString() generation
@freezed({ copyWith: false, equal: false, toString: false })  // only immutability
```

### Project-Wide Configuration

Create a `freezedts.config.yaml` in your project root:

```yaml
freezed:
  options:
    # Format generated .freezed.ts files (can slow down generation)
    format: true

    # Disable with() generation for the entire project
    copyWith: false

    # Disable equals() generation for the entire project
    equal: false

    # Disable toString() generation for the entire project
    toString: false
```

All options default to `true` (enabled) except `format` which defaults to `false`.

### Resolution Order

Per-class `@freezed()` options override project-wide `freezedts.config.yaml` defaults. If neither specifies a value, the built-in default applies (all features enabled).

```
per-class @freezed()  →  freezedts.config.yaml  →  built-in defaults
    (highest priority)                              (lowest priority)
```

## Building the Library

```bash
# Install dependencies
npm install

# Build TypeScript to dist/
npm run build

# Run tests
npm test

# Run the generator on this project's source files
npm run generate

# Watch mode for tests
npm run test:watch
```

The project uses:
- **TypeScript 6** with ES2022 target and Node16 module resolution
- **bun:test** for testing
- **ts-morph** for AST parsing and code generation
