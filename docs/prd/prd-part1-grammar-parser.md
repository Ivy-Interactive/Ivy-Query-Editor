# Part 1: ANTLR4 Grammar & Parser - Product Requirements Document

## Overview

The ANTLR4 grammar and parser form the foundation of the query editor. This component defines the filter query language syntax, lexes/parses input text, performs semantic validation, and outputs a FilterGroup AST. It is a standalone, framework-agnostic module that can be tested independently without any UI components.

**Key Features:**
- ANTLR4 grammar definition (`.g4` file)
- Lexer and parser generation
- Semantic validation (column existence, type compatibility)
- FilterGroup AST output
- Error collection with position information

## Goals

- **Primary Goal:** Define and implement a robust, unambiguous grammar for the filter query language that supports conditions, logical operators (AND/OR), negation (NOT), and grouping with parentheses.
- Provide clean TypeScript APIs for parsing queries into FilterGroup AST.
- Deliver comprehensive error messages with precise character positions for syntax and semantic errors.
- Ensure parser performance is acceptable (< 50ms for typical queries).
- Create a testable, reusable module that can be consumed by the editor UI layer.

## User Stories

1. **As a** developer, **I want to** parse a valid query string into a FilterGroup AST **so that** I can evaluate filters or serialize them.

2. **As a** developer, **I want to** receive detailed error messages with character positions when parsing fails **so that** I can show precise feedback to users.

3. **As a** developer, **I want to** validate that column names exist in the provided schema **so that** I can prevent runtime errors from unknown columns.

4. **As a** developer, **I want to** validate that operators are compatible with column types **so that** I can prevent type errors (e.g., `[stringCol] > 100`).

5. **As a** developer, **I want to** support operator synonyms (e.g., `>` and `greaterThan`) **so that** users have flexibility in query syntax.

## Functional Requirements

### Requirement 1: Grammar Definition
**Description:**
Define an ANTLR4 grammar (`FilterQuery.g4`) that specifies the syntax for filter queries. The grammar must support:
- Column references: `[columnId]`
- Operators: `equals`, `=`, `==`, `>`, `greaterThan`, `<`, `lessThan`, `contains`
- Values: strings (`"value"` or `'value'`), numbers (`123`, `45.67`), booleans (`true`, `false`), dates (`"2024-01-01"`)
- Logical operators: `AND`, `OR`, `and`, `or`
- Negation: `NOT`, `not`
- Grouping: `(expression)`

**Acceptance Criteria:**
- [ ] Grammar file `FilterQuery.g4` exists in `src/grammar/`
- [ ] Grammar compiles successfully with `antlr4ts-cli`
- [ ] Parser rules defined: `query`, `expression`, `condition`, `column`, `operator`, `value`
- [ ] Lexer rules defined: `AND`, `OR`, `NOT`, `EQUALS`, `GT`, `LT`, `CONTAINS`, `LBRACK`, `RBRACK`, `LPAREN`, `RPAREN`, `STRING`, `NUMBER`, `BOOLEAN`, `DATE`, `IDENTIFIER`, `WS`
- [ ] Operator synonyms supported: `=`/`==`/`equals`, `>`/`greaterThan`, `<`/`lessThan`
- [ ] Logical operators case-insensitive: `AND`/`and`, `OR`/`or`, `NOT`/`not`
- [ ] String literals support both single and double quotes
- [ ] Whitespace is skipped appropriately

**Priority:** High

### Requirement 2: Parse Function
**Description:**
Implement a `parseQuery(query: string, columns: ColumnDef[]): ParseResult` function that:
1. Tokenizes the input using ANTLR lexer
2. Parses tokens into AST using ANTLR parser
3. Performs semantic validation (column existence, type compatibility)
4. Returns either a FilterGroup AST or a list of errors

**Acceptance Criteria:**
- [ ] Function signature: `parseQuery(query: string, columns: ColumnDef[]): { filters?: FilterGroup; errors?: ParseError[] }`
- [ ] Returns `{ filters: FilterGroup }` for valid queries
- [ ] Returns `{ errors: ParseError[] }` for invalid queries
- [ ] Syntax errors include character position (`start`, `end`)
- [ ] Semantic errors include character position and descriptive message
- [ ] Parser handles empty input (returns empty FilterGroup)
- [ ] Parser handles whitespace-only input (returns empty FilterGroup)
- [ ] Performance: < 50ms for queries up to 1000 characters

**Priority:** High

### Requirement 3: Semantic Validation
**Description:**
Implement semantic validation that checks:
1. **Column existence:** All referenced columns exist in the provided `ColumnDef[]` array
2. **Operator compatibility:** Operators are compatible with column types:
   - `equals`: all types
   - `greaterThan`, `lessThan`: number, date only
   - `contains`: string only
3. **Argument type validation:** Values match expected column types (e.g., `[numberCol] > 100` is valid, `[numberCol] > "text"` is invalid)

**Acceptance Criteria:**
- [ ] Unknown column error: `"Column 'X' does not exist"`
- [ ] Incompatible operator error: `"Operator 'Y' is not compatible with type 'Z'"`
- [ ] Invalid argument type error: `"Expected number for column 'X', got string"`
- [ ] Errors include precise character positions
- [ ] Validation runs after successful parse (not during parse)
- [ ] Multiple errors are collected and returned together

**Priority:** High

### Requirement 4: FilterGroup AST Output
**Description:**
The parser must output a FilterGroup AST that represents the logical structure of the query. The AST should be a tree of FilterGroup nodes, Filter nodes, and Condition leaves.

**Acceptance Criteria:**
- [ ] Simple equality: `[status] equals "open"` → `{ op: "AND", filters: [{ condition: { column: "status", function: "equals", args: ["open"] } }] }`
- [ ] Multiple conditions: `[a] > 1 AND [b] equals "x"` → `{ op: "AND", filters: [{ condition: ... }, { condition: ... }] }`
- [ ] OR operator: `[a] > 1 OR [b] > 2` → `{ op: "OR", filters: [...] }`
- [ ] Negation: `NOT ([a] > 1)` → `{ op: "AND", filters: [{ negate: true, condition: ... }] }`
- [ ] Nested groups: `([a] > 1 OR [b] > 2) AND [c] equals "x"` → `{ op: "AND", filters: [{ group: { op: "OR", ... } }, { condition: ... }] }`
- [ ] Operator synonyms normalized: `>` → `greaterThan`, `=` → `equals`, `<` → `lessThan`
- [ ] Logical operators normalized: top-level operator is `AND` or `OR` (case-normalized)

**Priority:** High

### Requirement 5: Error Collection
**Description:**
Implement error collection that captures all syntax and semantic errors with precise character positions. Errors should include a human-readable message, start position, end position, and severity.

**Acceptance Criteria:**
- [ ] Error structure: `{ message: string, start: number, end: number, severity: "error" | "warning" }`
- [ ] Syntax errors captured from ANTLR parser
- [ ] Semantic errors captured from validation pass
- [ ] Errors sorted by position (ascending)
- [ ] Multiple errors returned together (not just first error)
- [ ] Position is 0-indexed character offset
- [ ] End position is exclusive (start=5, end=10 means chars 5-9)

**Priority:** High

### Requirement 6: Column Type Support
**Description:**
Support all column types defined in the schema: `string`, `number`, `boolean`, `date`, `enum`. Enum types should have a list of valid values that can be validated.

**Acceptance Criteria:**
- [ ] String columns support: `equals`, `contains`
- [ ] Number columns support: `equals`, `greaterThan`, `lessThan`
- [ ] Boolean columns support: `equals` only
- [ ] Date columns support: `equals`, `greaterThan`, `lessThan` (ISO date format `"YYYY-MM-DD"`)
- [ ] Enum columns support: `equals` only
- [ ] Enum value validation: error if value not in `enumValues` array
- [ ] Type coercion for literals: `"123"` as string, `123` as number, `true`/`false` as boolean

**Priority:** High

## Technical Requirements

### Performance
- **Parsing:** < 50ms for typical queries (< 200 characters)
- **Parsing (large):** < 100ms for queries up to 1000 characters
- **Memory:** Parser should not leak memory (ANTLR streams/contexts properly disposed)

### Security
- **No code execution:** Parser only produces AST; no eval or code execution
- **Injection protection:** String literals properly escaped; no SQL/code injection risk

### Scalability
- **Main thread:** Acceptable for queries < 1000 characters
- **Worker support (future):** Architecture should allow moving to web worker later

### Dependencies
- `antlr4ts`: ^0.5.0-alpha.4 (ANTLR runtime)
- `antlr4ts-cli`: (dev dependency for grammar compilation)

## User Interface

N/A - This is a headless parser module with no UI.

## API Specifications

### Input: Column Definitions
```typescript
type ColumnType = "string" | "number" | "boolean" | "date" | "enum";

interface ColumnDef {
  id: string;
  type: ColumnType;
  enumValues?: string[]; // required if type === "enum"
}
```

### Output: Filter Model
```typescript
export interface Condition {
  column: string; // column id
  function: "equals" | "greaterThan" | "lessThan" | "contains";
  args: unknown[]; // typed based on column type
}

export interface FilterGroup {
  op: "AND" | "OR";
  filters: Filter[];
}

export interface Filter {
  condition?: Condition;
  group?: FilterGroup;
  negate?: boolean; // true = NOT modifier
}

export interface ParseError {
  message: string;
  start: number; // 0-indexed character offset
  end: number; // exclusive
  severity?: "error" | "warning";
}

export interface ParseResult {
  filters?: FilterGroup;
  errors?: ParseError[];
}
```

### Main Function
```typescript
/**
 * Parse a query string into a FilterGroup AST.
 * Performs syntax and semantic validation.
 *
 * @param query - The query string to parse
 * @param columns - Schema of available columns for validation
 * @returns ParseResult with either filters or errors
 */
export function parseQuery(
  query: string,
  columns: ColumnDef[]
): ParseResult;
```

## Data Model

### ANTLR4 Grammar
```antlr
grammar FilterQuery;

query: expression EOF;

expression
  : expression (AND | OR) expression    # LogicalExpr
  | NOT expression                      # NotExpr
  | '(' expression ')'                  # ParenExpr
  | condition                           # ConditionExpr
  ;

condition
  : column operator value
  ;

column: LBRACK IDENTIFIER RBRACK;

operator
  : EQUALS | GT | LT | CONTAINS
  ;

value
  : STRING | NUMBER | BOOLEAN | DATE
  ;

// Lexer rules
AND: 'AND' | 'and';
OR: 'OR' | 'or';
NOT: 'NOT' | 'not';
EQUALS: 'equals' | '=' | '==';
GT: 'greaterThan' | '>';
LT: 'lessThan' | '<';
CONTAINS: 'contains';
LBRACK: '[';
RBRACK: ']';
LPAREN: '(';
RPAREN: ')';
STRING: '"' (~["\\] | '\\' .)* '"' | '\'' (~['\\] | '\\' .)* '\'';
NUMBER: '-'? [0-9]+ ('.' [0-9]+)?;
BOOLEAN: 'true' | 'false';
DATE: '"' [0-9]{4} '-' [0-9]{2} '-' [0-9]{2} '"'; // ISO date
IDENTIFIER: [a-zA-Z_][a-zA-Z0-9_]*;
WS: [ \t\r\n]+ -> skip;
```

### AST Visitor Pattern
```typescript
class FilterQueryVisitor extends AbstractParseTreeVisitor<FilterGroup | Filter | Condition> {
  constructor(private columns: ColumnDef[]) {}

  visitQuery(ctx: QueryContext): FilterGroup { /* ... */ }
  visitLogicalExpr(ctx: LogicalExprContext): FilterGroup { /* ... */ }
  visitNotExpr(ctx: NotExprContext): Filter { /* ... */ }
  visitParenExpr(ctx: ParenExprContext): Filter { /* ... */ }
  visitConditionExpr(ctx: ConditionExprContext): Filter { /* ... */ }
  visitCondition(ctx: ConditionContext): Condition { /* ... */ }
}
```

## Edge Cases & Error Handling

### Edge Cases
- **Empty input:** Returns `{ filters: { op: "AND", filters: [] } }`
- **Whitespace-only input:** Same as empty
- **Unbalanced quotes:** Syntax error: `Mismatched input, expected closing quote`
- **Unbalanced parentheses:** Syntax error: `Mismatched input ')' expecting ...`
- **Incomplete expression:** Syntax error: `[price] >` → `Expected value after operator`
- **Unknown column:** Semantic error: `Column 'foo' does not exist`
- **Type mismatch:** Semantic error: `Operator '>' is not compatible with type 'string'`
- **Invalid enum value:** Semantic error: `Value 'foo' is not valid for enum column 'status'. Valid values: ['open', 'closed']`
- **Mixed operators without parentheses:** `a AND b OR c` → Valid, left-to-right precedence
- **Double negation:** `NOT (NOT ([a] > 1))` → Valid, two negate flags
- **Case sensitivity:** Column IDs are case-sensitive, operators/keywords are case-insensitive

### Error Handling
- **Syntax errors:** Captured from ANTLR error listener
- **Semantic errors:** Collected during AST visitor pass
- **Multiple errors:** All errors returned together (fail fast disabled)
- **Error recovery:** Parser attempts to recover and find multiple errors
- **Position accuracy:** Errors point to exact token/character that caused the issue

## Dependencies

### External Libraries
- **ANTLR4 Runtime:** `antlr4ts` (for lexer, parser, visitor pattern)

### Dev Dependencies
- **ANTLR4 CLI:** `antlr4ts-cli` (for compiling `.g4` grammar to TypeScript)
- **TypeScript:** ^5.0.0
- **Vitest:** For unit testing

### Build Process
1. `antlr4ts -visitor FilterQuery.g4` → Generates lexer, parser, visitor classes
2. `tsc` → Compile TypeScript to JavaScript
3. Output: `dist/parser/`, `dist/grammar/`

## Out of Scope

### Explicitly NOT Included
- **Formatting:** Canonical form formatting is handled in Part 2
- **Editor integration:** CodeMirror integration is handled in Part 3-5
- **Row evaluation:** Filter execution is handled in Part 2
- **Advanced operators:** No `in`, `between`, `isNull`, `matches` (v1)
- **Multi-line support:** Single-line queries only
- **Custom operators:** Fixed operator set for v1
- **Operator precedence configuration:** Fixed precedence (AND/OR left-to-right)

## Success Metrics

### Parse Success Rate
- **Target:** 100% of valid queries parse successfully (no false negatives)

### Error Detection Rate
- **Target:** 100% of invalid queries produce at least one error (no false positives)

### Error Precision
- **Target:** 95%+ of errors point to the exact token causing the issue (± 5 characters)

### Performance
- **Target:** 95th percentile parse time < 50ms for typical queries
- **Target:** 99th percentile parse time < 100ms for large queries (< 1000 chars)

### Test Coverage
- **Target:** 100% line coverage for parser logic
- **Target:** 100% branch coverage for semantic validation

## Timeline

**Estimated Completion:** 1-2 weeks

### Tasks
1. **Grammar Design (2-3 days)**
   - Write `FilterQuery.g4`
   - Test grammar with ANTLR4 tools
   - Iterate on syntax design

2. **Parser Implementation (3-4 days)**
   - Generate lexer/parser from grammar
   - Implement AST visitor
   - Implement `parseQuery()` function

3. **Semantic Validation (2-3 days)**
   - Implement column existence checks
   - Implement type compatibility checks
   - Implement enum value validation

4. **Error Handling (1-2 days)**
   - Implement error collection
   - Add precise position tracking
   - Test error messages

5. **Testing (2-3 days)**
   - Unit tests for all grammar rules
   - Unit tests for semantic validation
   - Edge case testing
   - Performance benchmarking

## Open Questions

1. **Should operator precedence be configurable, or fixed (AND/OR left-to-right)?**
   → Decision: Fixed precedence for v1. Use parentheses for explicit precedence.

2. **Should we support implicit AND (e.g., `[a] > 1 [b] equals "x"` without AND keyword)?**
   → Decision: No, explicit AND/OR required for clarity.

3. **Should column IDs be case-sensitive or case-insensitive?**
   → Decision: Case-sensitive (matches typical database behavior).

4. **Should we allow trailing/leading whitespace in string literals (e.g., `"  hello  "`)?**
   → Decision: Yes, preserve whitespace in literals (user can format if needed).

5. **Should dates support time components (e.g., `"2024-01-01T12:00:00"`)?**
   → Decision: No, ISO date only (`YYYY-MM-DD`) for v1. Time support is future enhancement.

6. **Should we validate date values (e.g., reject `"2024-02-30"`)?**
   → Decision: No strict validation in parser. Evaluation layer will handle invalid dates.

7. **Should we support escaped identifiers (e.g., `[column with spaces]`)?**
   → Decision: Yes, brackets allow any identifier (validated against schema).

---

## Test Plan

### Unit Tests (Grammar)
```typescript
describe('Grammar - Lexer', () => {
  test('tokenizes simple query', () => {
    const query = '[status] equals "open"';
    const tokens = lex(query);
    expect(tokens).toEqual([
      { type: 'LBRACK', text: '[' },
      { type: 'IDENTIFIER', text: 'status' },
      { type: 'RBRACK', text: ']' },
      { type: 'EQUALS', text: 'equals' },
      { type: 'STRING', text: '"open"' },
    ]);
  });

  test('tokenizes operators', () => {
    expect(lex('>')).toContainEqual({ type: 'GT' });
    expect(lex('greaterThan')).toContainEqual({ type: 'GT' });
    expect(lex('<')).toContainEqual({ type: 'LT' });
    expect(lex('contains')).toContainEqual({ type: 'CONTAINS' });
  });

  test('handles case-insensitive keywords', () => {
    expect(lex('AND')).toContainEqual({ type: 'AND' });
    expect(lex('and')).toContainEqual({ type: 'AND' });
    expect(lex('Or')).toContainEqual({ type: 'OR' });
  });
});

describe('Grammar - Parser', () => {
  test('parses simple equality', () => {
    const ast = parseQuery('[status] equals "open"', columns);
    expect(ast.filters).toEqual({
      op: 'AND',
      filters: [{
        condition: {
          column: 'status',
          function: 'equals',
          args: ['open']
        }
      }]
    });
  });

  test('parses AND expression', () => {
    const ast = parseQuery('[a] > 1 AND [b] equals "x"', columns);
    expect(ast.filters.op).toBe('AND');
    expect(ast.filters.filters).toHaveLength(2);
  });

  test('parses OR expression', () => {
    const ast = parseQuery('[a] > 1 OR [b] > 2', columns);
    expect(ast.filters.op).toBe('OR');
  });

  test('parses NOT expression', () => {
    const ast = parseQuery('NOT ([a] > 1)', columns);
    expect(ast.filters.filters[0].negate).toBe(true);
  });

  test('parses nested groups', () => {
    const ast = parseQuery('([a] > 1 OR [b] > 2) AND [c] equals "x"', columns);
    expect(ast.filters.op).toBe('AND');
    expect(ast.filters.filters[0].group).toBeDefined();
    expect(ast.filters.filters[0].group.op).toBe('OR');
  });
});

describe('Semantic Validation', () => {
  test('detects unknown column', () => {
    const result = parseQuery('[unknownCol] > 1', columns);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: "Column 'unknownCol' does not exist"
      })
    );
  });

  test('detects incompatible operator', () => {
    const result = parseQuery('[stringCol] > 100', columns);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: "Operator '>' is not compatible with type 'string'"
      })
    );
  });

  test('detects invalid enum value', () => {
    const result = parseQuery('[status] equals "invalid"', columns);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining("not valid for enum")
      })
    );
  });
});

describe('Edge Cases', () => {
  test('handles empty input', () => {
    const result = parseQuery('', columns);
    expect(result.filters).toEqual({ op: 'AND', filters: [] });
  });

  test('handles unbalanced quotes', () => {
    const result = parseQuery('[a] equals "unclosed', columns);
    expect(result.errors).toBeDefined();
    expect(result.errors[0].message).toContain('quote');
  });

  test('handles unbalanced parentheses', () => {
    const result = parseQuery('([a] > 1', columns);
    expect(result.errors).toBeDefined();
  });
});

describe('Performance', () => {
  test('parses typical query in < 50ms', () => {
    const query = '[a] > 1 AND [b] equals "x" OR [c] contains "test"';
    const start = performance.now();
    parseQuery(query, columns);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });
});
```

### Integration Tests
```typescript
describe('Integration - Parser', () => {
  test('full parse pipeline', () => {
    const query = '([price] > 100 OR [onSale] equals true) AND [inStock] equals true';
    const result = parseQuery(query, columns);

    expect(result.errors).toBeUndefined();
    expect(result.filters).toBeDefined();
    expect(result.filters.op).toBe('AND');
    expect(result.filters.filters).toHaveLength(2);
    expect(result.filters.filters[0].group).toBeDefined();
  });
});
```

## Appendix

### Example Inputs & Expected Outputs

| Input | Expected Output |
|-------|----------------|
| `[status] equals "open"` | `{ op: "AND", filters: [{ condition: { column: "status", function: "equals", args: ["open"] } }] }` |
| `[price] > 100` | `{ op: "AND", filters: [{ condition: { column: "price", function: "greaterThan", args: [100] } }] }` |
| `[a] > 1 AND [b] equals "x"` | `{ op: "AND", filters: [{ condition: ... }, { condition: ... }] }` |
| `[a] > 1 OR [b] > 2` | `{ op: "OR", filters: [...] }` |
| `NOT ([a] > 1)` | `{ op: "AND", filters: [{ negate: true, condition: ... }] }` |
| `([a] > 1 OR [b] > 2) AND [c] equals "x"` | `{ op: "AND", filters: [{ group: { op: "OR", ... } }, { condition: ... }] }` |
| `[unknownCol] > 1` | `{ errors: [{ message: "Column 'unknownCol' does not exist", start: 1, end: 11 }] }` |
| `[stringCol] > 100` | `{ errors: [{ message: "Operator '>' is not compatible with type 'string'", ... }] }` |

### Operator Mapping

| Syntax | Function Name |
|--------|---------------|
| `equals`, `=`, `==` | `equals` |
| `>`, `greaterThan` | `greaterThan` |
| `<`, `lessThan` | `lessThan` |
| `contains` | `contains` |

### Column Type Compatibility

| Column Type | Supported Operators |
|-------------|---------------------|
| `string` | `equals`, `contains` |
| `number` | `equals`, `greaterThan`, `lessThan` |
| `boolean` | `equals` |
| `date` | `equals`, `greaterThan`, `lessThan` |
| `enum` | `equals` |
