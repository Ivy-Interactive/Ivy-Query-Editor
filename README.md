# Filter Query Editor

> ANTLR4-based filter query parser with formatter, evaluator, and React CodeMirror component for building Excel/Airtable-style advanced filters.

[![npm version](https://img.shields.io/npm/v/filter-query-editor.svg)](https://www.npmjs.com/package/filter-query-editor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎯 **Full-featured query parser** - ANTLR4-based grammar with comprehensive operator support
- ✨ **React Component** - CodeMirror-based editor with syntax highlighting, validation, and autocomplete
- 🔍 **Semantic validation** - Type-aware validation with helpful error messages
- 📝 **Auto-formatting** - Canonical query formatting with customizable options
- ⚡ **Fast evaluation** - Efficient filter evaluation engine for runtime data filtering
- 🎨 **Customizable theming** - Light/dark themes with full styling control
- 📦 **Zero dependencies** - Except CodeMirror for the React component

## Installation

```bash
npm install filter-query-editor react react-dom
```

## Quick Start

### React Component (Recommended)

```tsx
import { QueryEditor } from 'filter-query-editor';
import 'filter-query-editor/style.css';

function App() {
  const [query, setQuery] = useState('');
  const columns = [
    { id: 'status', type: 'string' as const },
    { id: 'price', type: 'number' as const },
    { id: 'active', type: 'boolean' as const },
  ];

  return (
    <QueryEditor
      value={query}
      columns={columns}
      onChange={(event) => {
        setQuery(event.text);
        if (event.isValid) {
          console.log('Parsed filters:', event.filters);
        } else {
          console.log('Errors:', event.errors);
        }
      }}
      theme="light"
      placeholder="Enter a filter query..."
      height={48}
    />
  );
}
```

### Headless Usage (Parser, Formatter, Evaluator)

```typescript
import {
  parseQuery,
  formatQuery,
  evaluateFilter,
  type ColumnDef
} from 'filter-query-editor';

// Define your columns
const columns: ColumnDef[] = [
  { id: 'status', type: 'string' },
  { id: 'price', type: 'number' },
  { id: 'createdAt', type: 'date' },
];

// Parse a query
const result = parseQuery('[price] > 100 and [status] equals "open"', columns);
if (result.errors.length === 0) {
  console.log('Parsed AST:', result.filters);
}

// Format to canonical form
const formatted = formatQuery('[price]>100 and [status]="open"', columns);
console.log(formatted.formatted);
// Output: '[price] > 100 AND [status] equals "open"'

// Evaluate against data
const matches = evaluateFilter(
  result.filters!,
  { price: 150, status: 'open', createdAt: '2024-01-01' },
  columns
);
console.log(matches); // true
```

## Supported Syntax

### Comparison Operators

- **Equality**: `=`, `==`, `equals`
- **Inequality**: `!=`, `not equals`
- **Numeric/Date**: `>`, `<`, `>=`, `<=`, `greater than`, `less than`, `greater than or equal`, `less than or equal`

### Text Operators

- `contains` - Case-sensitive substring match
- `starts with` - Case-sensitive prefix match
- `ends with` - Case-sensitive suffix match

### Existence Operators

- `IS BLANK` - Checks for null, undefined, or empty string
- `IS NOT BLANK` - Inverse of IS BLANK

### Logical Operators

- `AND` - Logical conjunction (all conditions must match)
- `OR` - Logical disjunction (at least one condition must match)
- `NOT` - Logical negation

### Examples

```
# Simple comparison
[price] > 100

# Text operations
[name] contains "test"
[email] ends with "@example.com"

# Complex queries with parentheses
([price] > 100 OR [price] < 10) AND [status] equals "open"

# Negation
NOT [active] equals true
[description] IS NOT BLANK

# Date comparisons
[createdAt] >= "2024-01-01"
```

## Data Types

The library supports the following column types:

- `string` - Text values
- `number` - Numeric values (integers and floats)
- `boolean` - Boolean values (true/false)
- `date` - ISO 8601 date strings (e.g., "2024-01-01")
- `enum` - Predefined set of string values

### Column Definition

```typescript
import { ColumnDef, DataType } from 'filter-query-editor';

const columns: ColumnDef[] = [
  { id: 'status', type: 'string' },
  { id: 'price', type: 'number' },
  { id: 'active', type: 'boolean' },
  { id: 'createdAt', type: 'date' },
  {
    id: 'category',
    type: 'enum',
    enumValues: ['electronics', 'clothing', 'food']
  },
];
```

## API Reference

### Parser API

#### `parseQuery(query: string, columns: ColumnDef[]): ParseResult`

Parses a query string and returns an AST with validation errors.

```typescript
const result = parseQuery('[price] > 100', columns);
if (result.errors.length === 0) {
  // Query is valid
  console.log(result.filters);
}
```

#### `parseQueryOrThrow(query: string, columns: ColumnDef[]): FilterGroup`

Parses a query and throws an error if invalid.

```typescript
try {
  const filters = parseQueryOrThrow('[price] > 100', columns);
} catch (error) {
  console.error('Parse error:', error);
}
```

### Formatter API

#### `formatQuery(query: string, columns: ColumnDef[], options?): FormatResult`

Formats a query to canonical form.

```typescript
const result = formatQuery('[price]>100 and [status]="open"', columns);
console.log(result.formatted);
// '[price] > 100 AND [status] equals "open"'
```

**Options:**
- `uppercaseLogicalOps` (default: `true`) - Use uppercase AND/OR/NOT
- `normalizeOperatorSynonyms` (default: `true`) - Normalize operators to canonical form
- `normalizeParens` (default: `true`) - Add parentheses for clarity
- `spaceAroundOperators` (default: `true`) - Add spacing around operators

#### `formatQueryString(query: string, columns: ColumnDef[]): string`

Shorthand that returns only the formatted string.

#### `isCanonical(query: string, columns: ColumnDef[]): boolean`

Check if a query is already in canonical form.

#### `isIdempotent(query: string, columns: ColumnDef[]): boolean`

Check if formatting the query multiple times produces the same result.

### Evaluator API

#### `evaluateFilter(filters: FilterGroup, row: Record<string, unknown>, columns: ColumnDef[]): boolean`

Evaluates a filter against a data row.

```typescript
const matches = evaluateFilter(
  parsedFilters,
  { price: 150, status: 'open' },
  columns
);
```

#### `evaluateFilterBatch(filters: FilterGroup, rows: Record<string, unknown>[], columns: ColumnDef[]): boolean[]`

Evaluates a filter against multiple rows (optimized).

```typescript
const results = evaluateFilterBatch(parsedFilters, dataRows, columns);
```

#### `countMatches(filters: FilterGroup, rows: Record<string, unknown>[], columns: ColumnDef[]): number`

Counts the number of matching rows.

```typescript
const count = countMatches(parsedFilters, dataRows, columns);
```

#### `findFirstMatch(filters: FilterGroup, rows: Record<string, unknown>[], columns: ColumnDef[]): Record<string, unknown> | null`

Finds the first matching row.

```typescript
const firstMatch = findFirstMatch(parsedFilters, dataRows, columns);
```

### React Component API

#### `QueryEditor` Props

```typescript
interface QueryEditorProps {
  value: string;
  columns: ColumnDef[];
  onChange?: (event: QueryEditorChangeEvent) => void;
  theme?: 'light' | 'dark';
  readOnly?: boolean;
  placeholder?: string;
  height?: number | string;
  autoFocus?: boolean;
  className?: string;
}

interface QueryEditorChangeEvent {
  text: string;
  isValid: boolean;
  errors: ParseError[];
  filters?: FilterGroup;
}
```

### Type Exports

```typescript
import type {
  FilterGroup,
  Filter,
  Condition,
  ColumnDef,
  ColumnType,
  ParseResult,
  ParseError,
  ErrorSeverity,
  FormatResult,
} from 'filter-query-editor';
```

## Features in Detail

### Syntax Highlighting

The CodeMirror component includes syntax highlighting for:
- Column references (e.g., `[columnName]`)
- Operators (e.g., `equals`, `>`, `contains`)
- String literals (e.g., `"value"`)
- Numbers and booleans
- Logical operators (AND, OR, NOT)
- Error highlighting for invalid syntax

### Autocomplete

The editor provides context-aware autocomplete for:
- **Column names** - After typing `[`
- **Operators** - After completing a column reference
- **Values** - For enum columns and boolean columns
- **Logical operators** - Between expressions

Keyboard shortcuts:
- `Ctrl+Space` - Trigger autocomplete
- `Enter` - Accept completion
- `Escape` - Dismiss autocomplete

### Auto-formatting

Queries are automatically formatted when:
- The editor loses focus (blur event)
- User presses `Cmd/Ctrl+Shift+F` or `Alt+Shift+F`

Formatting includes:
- Consistent spacing
- Normalized operators
- Uppercase logical operators
- Proper parenthesization

### Validation

Real-time validation checks:
- **Syntax errors** - Grammar violations
- **Semantic errors** - Type mismatches, undefined columns
- **Type compatibility** - Operator/column type validation

## Performance

The library is optimized for:
- ✅ Large schemas (1000+ columns)
- ✅ Complex queries (100+ conditions)
- ✅ Large datasets (10,000+ rows)
- ✅ Real-time validation and formatting

## Grammar

The query language is defined by an ANTLR4 grammar. For detailed syntax rules, see [`docs/grammar/Filters.g4`](docs/grammar/Filters.g4).

## Examples

See the [`examples/`](examples/) directory for complete usage examples:
- Basic parser usage
- React integration
- Advanced filtering patterns
- Custom column types

## Development

```bash
# Install dependencies
npm install

# Generate parser from grammar
npm run generate:parser

# Build library
npm run build

# Run tests
npm test

# Run unit tests only
npm run test:unit

# Run component tests
npm run test:component

# Start demo dev server
npm run dev
```

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT © [Your Name]

## Support

- 📚 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/yourusername/filter-query-editor/issues)
- 💬 [Discussions](https://github.com/yourusername/filter-query-editor/discussions)
