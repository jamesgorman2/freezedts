# freezedts-cli

Code generator CLI for [freezedts](https://www.npmjs.com/package/freezedts).

## Installation

```bash
npm install freezedts
npm install -D freezedts-cli
```

## Usage

```bash
# Generate .freezed.ts files for all source files in the current directory
npx freezedts

# Generate for a specific directory
npx freezedts src

# Watch mode
npx freezedts --watch

# Custom config file
npx freezedts --config path/to/freezedts.config.json
```

See the [full documentation](https://github.com/jamesgorman2/freezedts) for details.
