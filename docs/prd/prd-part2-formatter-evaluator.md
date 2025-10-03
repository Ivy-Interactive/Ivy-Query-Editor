# Part 2: Formatter & Evaluator - Product Requirements Document

## Overview

The formatter and evaluator are **utility functions** that operate on query strings and FilterGroup ASTs. The formatter transforms queries into canonical form (idempotent), while the evaluator executes FilterGroup ASTs against row data. Both are standalone, testable modules that depend only on Part 1 (parser).

**Important:** This part provides the evaluation logic as a utility function. **The query editor itself does not perform any filtering.** It only outputs FilterGroup objects. The consumer (e.g., Ivy Framework datatable) is responsible for calling `evaluateFilter()` to filter their data.

**Key Features:**
- Idempotent query formatter with canonical rules
- Row evaluation utility function (exported for consumer use)
- Type-safe value comparisons
- Support for all operators and column types

## Goals

- **Primary Goal:** Provide a formatter that consistently transforms queries to canonical form, ensuring readability and consistency across all user inputs.
- Implement a fast, reliable evaluator utility that **consumers can use** to filter datatable rows based on FilterGroup ASTs.
- Ensure formatter idempotence (format twice = same result).
- Handle type coercion safely in evaluator (e.g., string "100" vs number 100).
- Achieve < 50ms formatting time and < 1ms per-row evaluation time.

**Scope Clarification:** The evaluator is an **exported utility function** for consumer use. The query editor component itself does not filter data. It only parses, validates, and outputs FilterGroup objects that consumers can use to filter their own datasets.

## User Stories

1. **As a** developer, **I want to** format a query string to canonical form **so that** all queries are displayed consistently to users.

2. **As a** developer, **I want to** ensure formatting is idempotent **so that** repeated formatting doesn't change the query.

3. **As a** developer, **I want to** evaluate a FilterGroup against a row object **so that** I can filter datatable rows client-side.

4. **As a** developer, **I want to** handle type coercion safely (string vs number) **so that** comparisons work correctly without runtime errors.

5. **As a** developer, **I want to** support all operators (equals, greaterThan, lessThan, contains) **so that** all query features work in evaluation.

## Functional Requirements

### Requirement 1: Query Formatter
**Description:**
Implement a `formatQuery(query: string, columns: ColumnDef[]): FormatResult` function that transforms queries to canonical form by applying these rules:
1. **Bracket columns:** `status` → `[status]`
2. **Uppercase logical operators:** `and` → `AND`, `or` → `OR`, `not` → `NOT`
3. **Space binary operators:** `[price]>100` → `[price] > 100`
4. **Double-quote strings:** `'value'` → `"value"`, escape internal quotes: `'o"r'` → `"o\"r"`
5. **Normalize parentheses:** Ensure consistent spacing, e.g., `not [x]` → `NOT ([x])`
6. **Normalize operator synonyms:** `greaterThan` → `>`, `lessThan` → `<`, `==` → `equals`

**Acceptance Criteria:**
- [ ] Function signature: `formatQuery(query: string, columns: ColumnDef[]): { formatted: string; errors?: ParseError[] }`
- [ ] Returns `{ formatted: string }` for valid queries
- [ ] Returns `{ formatted: query, errors: [...] }` for invalid queries (returns original + errors)
- [ ] Rule 1: Unbracketed columns get brackets: `status` → `[status]`
- [ ] Rule 2: Logical operators uppercased: `and` → `AND`
- [ ] Rule 3: Binary operators get spaces: `[price]>100` → `[price] > 100`
- [ ] Rule 4: Strings double-quoted with escaping: `'o"r'` → `"o\"r"`
- [ ] Rule 5: NOT gets parentheses: `not [x] > 1` → `NOT ([x] > 1)`
- [ ] Rule 6: Operator synonyms normalized: `greaterThan` → `>`, `==` → `equals`
- [ ] Idempotence: `formatQuery(formatQuery(q)) === formatQuery(q)`
- [ ] Performance: < 50ms for typical queries

**Priority:** High

### Requirement 2: Formatter Idempotence
**Description:**
Ensure the formatter is idempotent: applying the formatter multiple times produces identical output after the first application.

**Acceptance Criteria:**
- [ ] For all valid queries: `formatQuery(formatQuery(q)).formatted === formatQuery(q).formatted`
- [ ] Unit tests verify idempotence with 50+ diverse query examples
- [ ] Snapshot tests capture formatted output for regression testing
- [ ] Edge cases tested: empty strings, whitespace, complex nested groups

**Priority:** High

### Requirement 3: Filter Evaluator (Utility Export)
**Description:**
Implement an `evaluateFilter(filter: FilterGroup, row: Record<string, unknown>, columns: ColumnDef[]): boolean` function that evaluates a FilterGroup AST against a row object. **This is a utility function exported by the package for consumer use.** The query editor component does not call this function internally. Consumers (like Ivy Framework datatable) import and use this function to filter their own datasets.

The evaluator must:
1. Handle all operators: `equals`, `greaterThan`, `lessThan`, `contains`
2. Handle logical operators: `AND`, `OR`
3. Handle negation: `negate: true`
4. Handle nested groups
5. Perform type-safe comparisons

**Acceptance Criteria:**
- [ ] Function signature: `evaluateFilter(filter: FilterGroup, row: Record<string, unknown>, columns: ColumnDef[]): boolean`
- [ ] Function exported from package (not used internally by editor)
- [ ] Returns `true` if row matches filter, `false` otherwise
- [ ] `equals` operator: strict equality with type coercion (string "100" !== number 100)
- [ ] `greaterThan` operator: numeric/date comparison
- [ ] `lessThan` operator: numeric/date comparison
- [ ] `contains` operator: case-sensitive substring match
- [ ] `AND` logic: all conditions must be true
- [ ] `OR` logic: at least one condition must be true
- [ ] `negate: true`: inverts condition result
- [ ] Nested groups evaluated recursively
- [ ] Unknown columns return `false` (safe default)
- [ ] Type mismatches return `false` (safe default)
- [ ] Performance: < 1ms per row for typical filters
- [ ] Documented with JSDoc comments and usage examples

**Priority:** High

### Requirement 4: Type Coercion & Safety
**Description:**
Implement safe type coercion and comparison logic that handles edge cases like string vs number, null/undefined values, and invalid dates.

**Acceptance Criteria:**
- [ ] String "100" !== number 100 (strict type equality)
- [ ] Null/undefined values handled: `null equals null` → `true`, `null > 1` → `false`
- [ ] Date strings compared as dates: `"2024-01-01" < "2024-12-31"` → `true`
- [ ] Invalid dates return `false` (e.g., `"invalid" > "2024-01-01"` → `false`)
- [ ] Boolean comparisons: `true equals true` → `true`, `true equals "true"` → `false`
- [ ] Case-sensitive string contains: `"Hello" contains "ello"` → `true`, `"Hello" contains "ELLO"` → `false`
- [ ] Enum validation: value must match exactly (case-sensitive)

**Priority:** High

### Requirement 5: Error Handling in Formatter
**Description:**
If the input query is unparseable, the formatter should return the original query unchanged along with parse errors. It should not throw exceptions.

**Acceptance Criteria:**
- [ ] Invalid syntax: returns `{ formatted: originalQuery, errors: [...] }`
- [ ] Unknown columns: returns `{ formatted: originalQuery, errors: [...] }`
- [ ] Function does not throw exceptions
- [ ] Errors include character positions and messages

**Priority:** Medium

### Requirement 6: Operator Implementation
**Description:**
Implement each operator with correct semantics for all applicable column types.

**Acceptance Criteria:**
- [ ] `equals`: Works for string, number, boolean, date, enum (strict equality)
- [ ] `greaterThan`: Works for number (numeric comparison), date (chronological comparison)
- [ ] `lessThan`: Works for number (numeric comparison), date (chronological comparison)
- [ ] `contains`: Works for string (case-sensitive substring match)
- [ ] Invalid operator/type combinations return `false` (e.g., `contains` on number)

**Priority:** High

## Technical Requirements

### Performance
- **Formatting:** < 50ms for typical queries
- **Evaluation:** < 1ms per row for typical filters
- **Evaluation (complex):** < 5ms per row for deeply nested filters (10+ conditions)

### Security
- **No code execution:** Evaluator uses direct comparisons; no eval or Function()
- **Safe defaults:** Unknown columns/types return `false` instead of throwing

### Scalability
- **Large datasets:** Evaluator should handle 10,000+ rows without memory leaks
- **Complex filters:** Evaluator should handle 50+ conditions without stack overflow

### Dependencies
- **Part 1:** Parser module (for `parseQuery`, `FilterGroup`, `ColumnDef` types)

## User Interface

N/A - These are utility functions with no UI.

## API Specifications

### Formatter API
```typescript
/**
 * Format a query string to canonical form.
 * Returns original query + errors if unparseable.
 *
 * @param query - The query string to format
 * @param columns - Schema of available columns for validation
 * @returns FormatResult with formatted string or errors
 */
export function formatQuery(
  query: string,
  columns: ColumnDef[]
): FormatResult;

export interface FormatResult {
  formatted: string;
  errors?: ParseError[];
}
```

### Evaluator API
```typescript
/**
 * Evaluate a FilterGroup against a row object.
 * Returns true if row matches filter, false otherwise.
 *
 * **Usage Note:** This is a utility function exported for consumer use.
 * The query editor does not perform filtering itself. Consumers import
 * this function to filter their own datasets.
 *
 * @example
 * ```typescript
 * import { evaluateFilter } from '@ivy-framework/query-editor';
 *
 * const filteredRows = rows.filter(row =>
 *   evaluateFilter(filterGroup, row, columns)
 * );
 * ```
 *
 * @param filter - The FilterGroup AST to evaluate
 * @param row - The row data to test
 * @param columns - Schema of columns for type information
 * @returns boolean indicating match
 */
export function evaluateFilter(
  filter: FilterGroup,
  row: Record<string, unknown>,
  columns: ColumnDef[]
): boolean;
```

## Data Model

### Formatting Rules (Implementation)
```typescript
interface FormattingOptions {
  bracketColumns: boolean;           // true: status → [status]
  uppercaseLogicalOps: boolean;      // true: and → AND
  spaceBinaryOps: boolean;           // true: a>1 → a > 1
  doubleQuoteStrings: boolean;       // true: 'x' → "x"
  normalizeParens: boolean;          // true: not [x] → NOT ([x])
  normalizeOperatorSynonyms: boolean; // true: greaterThan → >
}

// All options should be true for canonical formatting
const canonicalOptions: FormattingOptions = {
  bracketColumns: true,
  uppercaseLogicalOps: true,
  spaceBinaryOps: true,
  doubleQuoteStrings: true,
  normalizeParens: true,
  normalizeOperatorSynonyms: true,
};
```

### Operator Implementation
```typescript
type OperatorFunction = (
  columnValue: unknown,
  args: unknown[],
  columnType: ColumnType
) => boolean;

const operators: Record<string, OperatorFunction> = {
  equals: (value, args, type) => value === args[0],
  greaterThan: (value, args, type) => {
    if (type === 'number') return (value as number) > (args[0] as number);
    if (type === 'date') return new Date(value as string) > new Date(args[0] as string);
    return false;
  },
  lessThan: (value, args, type) => {
    if (type === 'number') return (value as number) < (args[0] as number);
    if (type === 'date') return new Date(value as string) < new Date(args[0] as string);
    return false;
  },
  contains: (value, args, type) => {
    if (type === 'string') return (value as string).includes(args[0] as string);
    return false;
  },
};
```

## Edge Cases & Error Handling

### Edge Cases (Formatter)
- **Empty input:** Returns `""`
- **Whitespace-only input:** Returns `""`
- **Already formatted:** Returns identical string (idempotence)
- **Unparseable:** Returns original + errors
- **Multiple spaces:** Normalized to single space

### Edge Cases (Evaluator)
- **Empty FilterGroup:** `{ op: "AND", filters: [] }` → Returns `true` (vacuous truth)
- **Null/undefined column value:** Comparisons return `false` except `null equals null` → `true`
- **Unknown column in row:** Returns `false`
- **Type mismatch:** Returns `false` (e.g., string column, numeric comparison)
- **Invalid date strings:** Date comparisons return `false`
- **Deeply nested groups:** Recursion depth limited to 100 levels (throws error if exceeded)

### Error Handling
- **Formatter:** Never throws; returns original + errors for invalid input
- **Evaluator:** Returns `false` for any error condition (safe default)
- **Evaluator (excessive nesting):** Throws error if recursion depth > 100

## Dependencies

### Internal Dependencies
- **Part 1 Parser:** `parseQuery`, `FilterGroup`, `Filter`, `Condition`, `ColumnDef`, `ParseError` types

### External Libraries
- None (pure TypeScript utilities)

## Out of Scope

### Explicitly NOT Included
- **Automatic filtering by the editor:** The query editor does not filter data. It only outputs FilterGroup objects. Consumers use `evaluateFilter()` to filter their own data.
- **Data fetching:** The evaluator works on in-memory data only. No server-side or API integration.
- **Server-side filtering:** The evaluator is client-side only. Consumers may need to convert FilterGroup to server query format separately.
- **Case-insensitive contains:** `contains` is case-sensitive for v1
- **Regex matching:** No regex operator in v1
- **Type coercion for comparisons:** Strict type equality (string "100" !== number 100)
- **Fuzzy matching:** No fuzzy/approximate string matching
- **Custom operator functions:** Fixed operator set for v1
- **Localized formatting:** English only (AND/OR/NOT keywords)

## Success Metrics

### Formatter Idempotence
- **Target:** 100% of valid queries are idempotent (format twice = same result)

### Formatter Correctness
- **Target:** 100% of formatting rules applied correctly (verified by unit tests)

### Evaluator Correctness
- **Target:** 100% of test cases pass (50+ test cases covering all operators and edge cases)

### Performance
- **Formatter:** 95th percentile < 50ms
- **Evaluator:** 95th percentile < 1ms per row
- **Evaluator (complex):** 99th percentile < 5ms per row

### Test Coverage
- **Target:** 100% line coverage for formatter and evaluator

## Timeline

**Estimated Completion:** 1 week

### Tasks
1. **Formatter Implementation (2-3 days)**
   - Implement AST-to-string reconstruction
   - Apply all 6 formatting rules
   - Test idempotence

2. **Evaluator Implementation (2-3 days)**
   - Implement operator functions
   - Implement recursive evaluation logic
   - Handle edge cases (null, type mismatches)

3. **Testing (2 days)**
   - Unit tests for formatter (50+ cases)
   - Unit tests for evaluator (50+ cases)
   - Snapshot tests for formatting
   - Performance benchmarks

## Open Questions

1. **Should `contains` be case-insensitive or case-sensitive?**
   → Decision: Case-sensitive for v1. Case-insensitive variant is future enhancement.

2. **Should `equals` perform type coercion (e.g., "100" == 100)?**
   → Decision: No, strict equality. String "100" !== number 100.

3. **Should date comparisons handle timezones?**
   → Decision: No timezone handling for v1. Dates are ISO strings compared lexicographically.

4. **Should empty FilterGroup return true or false?**
   → Decision: `true` (vacuous truth: no conditions to fail).

5. **Should we throw errors for malformed FilterGroups, or return false?**
   → Decision: Return `false` (safe default). Malformed ASTs should not occur if parser is used correctly.

6. **Should we support custom comparison functions?**
   → Decision: No custom functions in v1. Fixed operator set.

---

## Test Plan

### Unit Tests (Formatter)
```typescript
describe('Formatter', () => {
  test('brackets unbracketed columns', () => {
    const result = formatQuery('status equals "open"', columns);
    expect(result.formatted).toBe('[status] equals "open"');
  });

  test('uppercases logical operators', () => {
    const result = formatQuery('[a] > 1 and [b] > 2', columns);
    expect(result.formatted).toContain(' AND ');
  });

  test('spaces binary operators', () => {
    const result = formatQuery('[price]>100', columns);
    expect(result.formatted).toBe('[price] > 100');
  });

  test('double-quotes strings with escaping', () => {
    const result = formatQuery("[name] contains 'o\"r'", columns);
    expect(result.formatted).toBe('[name] contains "o\\"r"');
  });

  test('normalizes NOT with parentheses', () => {
    const result = formatQuery('not [active]', columns);
    expect(result.formatted).toBe('NOT ([active])');
  });

  test('normalizes operator synonyms', () => {
    const result = formatQuery('[price] greaterThan 100', columns);
    expect(result.formatted).toBe('[price] > 100');
  });

  test('is idempotent', () => {
    const query = 'price>100 and status equals open';
    const first = formatQuery(query, columns).formatted;
    const second = formatQuery(first, columns).formatted;
    expect(first).toBe(second);
  });

  test('returns errors for invalid query', () => {
    const result = formatQuery('[unknownCol] > 1', columns);
    expect(result.errors).toBeDefined();
    expect(result.formatted).toBe('[unknownCol] > 1'); // original returned
  });
});
```

### Unit Tests (Evaluator)
```typescript
describe('Evaluator', () => {
  const columns: ColumnDef[] = [
    { id: 'status', type: 'string' },
    { id: 'price', type: 'number' },
    { id: 'active', type: 'boolean' },
    { id: 'createdAt', type: 'date' },
  ];

  test('equals operator', () => {
    const filter: FilterGroup = {
      op: 'AND',
      filters: [{ condition: { column: 'status', function: 'equals', args: ['open'] } }]
    };
    expect(evaluateFilter(filter, { status: 'open' }, columns)).toBe(true);
    expect(evaluateFilter(filter, { status: 'closed' }, columns)).toBe(false);
  });

  test('greaterThan operator', () => {
    const filter: FilterGroup = {
      op: 'AND',
      filters: [{ condition: { column: 'price', function: 'greaterThan', args: [100] } }]
    };
    expect(evaluateFilter(filter, { price: 150 }, columns)).toBe(true);
    expect(evaluateFilter(filter, { price: 50 }, columns)).toBe(false);
  });

  test('lessThan operator', () => {
    const filter: FilterGroup = {
      op: 'AND',
      filters: [{ condition: { column: 'price', function: 'lessThan', args: [100] } }]
    };
    expect(evaluateFilter(filter, { price: 50 }, columns)).toBe(true);
    expect(evaluateFilter(filter, { price: 150 }, columns)).toBe(false);
  });

  test('contains operator', () => {
    const filter: FilterGroup = {
      op: 'AND',
      filters: [{ condition: { column: 'status', function: 'contains', args: ['pen'] } }]
    };
    expect(evaluateFilter(filter, { status: 'open' }, columns)).toBe(true);
    expect(evaluateFilter(filter, { status: 'closed' }, columns)).toBe(false);
  });

  test('AND logic', () => {
    const filter: FilterGroup = {
      op: 'AND',
      filters: [
        { condition: { column: 'price', function: 'greaterThan', args: [100] } },
        { condition: { column: 'active', function: 'equals', args: [true] } }
      ]
    };
    expect(evaluateFilter(filter, { price: 150, active: true }, columns)).toBe(true);
    expect(evaluateFilter(filter, { price: 150, active: false }, columns)).toBe(false);
    expect(evaluateFilter(filter, { price: 50, active: true }, columns)).toBe(false);
  });

  test('OR logic', () => {
    const filter: FilterGroup = {
      op: 'OR',
      filters: [
        { condition: { column: 'price', function: 'greaterThan', args: [100] } },
        { condition: { column: 'active', function: 'equals', args: [true] } }
      ]
    };
    expect(evaluateFilter(filter, { price: 150, active: false }, columns)).toBe(true);
    expect(evaluateFilter(filter, { price: 50, active: true }, columns)).toBe(true);
    expect(evaluateFilter(filter, { price: 50, active: false }, columns)).toBe(false);
  });

  test('negation', () => {
    const filter: FilterGroup = {
      op: 'AND',
      filters: [
        { negate: true, condition: { column: 'active', function: 'equals', args: [true] } }
      ]
    };
    expect(evaluateFilter(filter, { active: false }, columns)).toBe(true);
    expect(evaluateFilter(filter, { active: true }, columns)).toBe(false);
  });

  test('nested groups', () => {
    const filter: FilterGroup = {
      op: 'AND',
      filters: [
        {
          group: {
            op: 'OR',
            filters: [
              { condition: { column: 'price', function: 'greaterThan', args: [100] } },
              { condition: { column: 'active', function: 'equals', args: [true] } }
            ]
          }
        },
        { condition: { column: 'status', function: 'equals', args: ['open'] } }
      ]
    };
    expect(evaluateFilter(filter, { price: 150, status: 'open' }, columns)).toBe(true);
    expect(evaluateFilter(filter, { price: 50, active: true, status: 'open' }, columns)).toBe(true);
    expect(evaluateFilter(filter, { price: 50, active: false, status: 'open' }, columns)).toBe(false);
  });

  test('handles null values', () => {
    const filter: FilterGroup = {
      op: 'AND',
      filters: [{ condition: { column: 'status', function: 'equals', args: [null] } }]
    };
    expect(evaluateFilter(filter, { status: null }, columns)).toBe(true);
    expect(evaluateFilter(filter, { status: 'open' }, columns)).toBe(false);
  });

  test('handles unknown columns', () => {
    const filter: FilterGroup = {
      op: 'AND',
      filters: [{ condition: { column: 'unknownCol', function: 'equals', args: ['x'] } }]
    };
    expect(evaluateFilter(filter, { status: 'open' }, columns)).toBe(false);
  });

  test('handles type mismatches', () => {
    const filter: FilterGroup = {
      op: 'AND',
      filters: [{ condition: { column: 'status', function: 'greaterThan', args: [100] } }]
    };
    expect(evaluateFilter(filter, { status: 'open' }, columns)).toBe(false);
  });

  test('empty FilterGroup returns true', () => {
    const filter: FilterGroup = { op: 'AND', filters: [] };
    expect(evaluateFilter(filter, {}, columns)).toBe(true);
  });
});

describe('Performance', () => {
  test('evaluates 10,000 rows in reasonable time', () => {
    const filter: FilterGroup = {
      op: 'AND',
      filters: [
        { condition: { column: 'price', function: 'greaterThan', args: [100] } },
        { condition: { column: 'active', function: 'equals', args: [true] } }
      ]
    };
    const rows = Array.from({ length: 10000 }, (_, i) => ({
      price: Math.random() * 200,
      active: Math.random() > 0.5
    }));

    const start = performance.now();
    rows.filter(row => evaluateFilter(filter, row, columns));
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100); // < 100ms for 10k rows = < 0.01ms/row
  });
});
```

## Appendix

### Formatting Examples

| Input | Output |
|-------|--------|
| `status equals "open"` | `[status] equals "open"` |
| `price>100` | `[price] > 100` |
| `a and b or c` | `[a] AND [b] OR [c]` |
| `name contains 'o"r'` | `[name] contains "o\"r"` |
| `not [active]` | `NOT ([active])` |
| `[price] greaterThan 100` | `[price] > 100` |
| `[a]==1` | `[a] equals 1` |
| `  a  >  1  ` | `[a] > 1` |

### Evaluation Examples

| Filter | Row | Result |
|--------|-----|--------|
| `[status] equals "open"` | `{ status: "open" }` | `true` |
| `[status] equals "open"` | `{ status: "closed" }` | `false` |
| `[price] > 100` | `{ price: 150 }` | `true` |
| `[price] > 100` | `{ price: 50 }` | `false` |
| `[price] > 100 AND [active]` | `{ price: 150, active: true }` | `true` |
| `[price] > 100 AND [active]` | `{ price: 150, active: false }` | `false` |
| `[price] > 100 OR [active]` | `{ price: 50, active: true }` | `true` |
| `NOT ([active])` | `{ active: false }` | `true` |
| `([price] > 100 OR [active]) AND [status] equals "open"` | `{ price: 150, status: "open" }` | `true` |
