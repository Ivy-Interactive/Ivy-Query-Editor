# TODO List

## URGENT - React Component Issues (Fix First!)

### 0. Fix Critical React Component Bugs
**Priority:** BLOCKING - These bugs will break the QueryEditor component

#### A. Fix Formatting Extension Bug
**File:** `src/components/extensions/formatting.ts:27`
**Status:** 🔴 BROKEN - Will crash on format

**Problem:** `formatQuery()` returns a `FormatResult` object, not a string
```typescript
const formatted = formatQuery(text, columns);
if (formatted !== text) {  // ❌ Comparing object to string!
```

**Fix:**
```typescript
const result = formatQuery(text, columns);
// Don't format if there are errors
if (result.errors && result.errors.length > 0) {
  return false;
}
// Only update if the text actually changed
if (result.formatted !== text) {
  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: result.formatted,  // ✅ Use result.formatted
    },
  });
}
```

**Tasks:**
- [ ] Fix line 27 in `formatting.ts` to use `result.formatted`
- [ ] Add error checking before formatting
- [ ] Test format-on-blur functionality
- [ ] Test Cmd+Shift+F keyboard shortcut
- [ ] Verify formatter doesn't break on invalid queries

#### B. Export React Component from Main Index
**File:** `src/index.ts`
**Status:** 🔴 MISSING - Component not exported

**Problem:** React component exists but isn't exported from main entry point

**Fix:** Add to `src/index.ts`:
```typescript
// React Component exports
export { QueryEditor } from './components/QueryEditor';
export type {
  QueryEditorProps,
  QueryEditorChangeEvent,
  ThemeColors
} from './components/types';
```

**Tasks:**
- [ ] Add QueryEditor export to `src/index.ts`
- [ ] Add type exports (QueryEditorProps, QueryEditorChangeEvent, ThemeColors)
- [ ] Verify imports work: `import { QueryEditor } from 'filter-query-editor'`
- [ ] Update package.json description to mention React component
- [ ] Consider adding CSS export path

#### C. Fix Column Dependency Issue (Performance Bug)
**File:** `src/components/useCodeMirror.ts:136`
**Status:** 🟡 PERFORMANCE ISSUE - Causes unnecessary editor recreation

**Problem:** Editor is destroyed and recreated whenever `columns` array reference changes
```typescript
}, [container, theme, readOnly, placeholder, autoFocus, columns]);
// ❌ columns array reference causes full recreation even if contents same
```

**Impact:**
- Loss of focus when columns update
- Loss of undo/redo history
- Poor UX if parent re-renders frequently
- Performance degradation

**Fix Option 1 - Memoize extensions:**
```typescript
const extensionsMemo = useMemo(() => {
  return [
    createValidationExtension(columns),
    createFormattingExtension(columns),
  ];
}, [JSON.stringify(columns.map(c => c.id + c.type))]);
```

**Fix Option 2 - Use ref and reconfigure:**
```typescript
const columnsRef = useRef(columns);

useEffect(() => {
  if (view && columnsRef.current !== columns) {
    // Reconfigure extensions without destroying editor
    view.dispatch({
      effects: StateEffect.reconfigure.of(extensions)
    });
    columnsRef.current = columns;
  }
}, [columns, view]);
```

**Tasks:**
- [ ] Implement extension memoization or reconfiguration approach
- [ ] Test that validation updates when columns change
- [ ] Test that editor doesn't lose focus on column updates
- [ ] Test that undo history is preserved
- [ ] Add tests for dynamic column updates

#### D. Add Cursor Position Preservation
**File:** `src/components/useCodeMirror.ts:139-149`
**Status:** 🟡 UX ISSUE - Cursor jumps when external value changes

**Problem:** External value sync doesn't preserve cursor position
```typescript
useEffect(() => {
  if (view && view.state.doc.toString() !== value) {
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: value,  // ❌ Replaces everything, cursor goes to end
      },
    });
  }
}, [value, view]);
```

**Impact:** If parent updates value while user is typing, cursor jumps to end

**Fix:**
```typescript
useEffect(() => {
  if (view && view.state.doc.toString() !== value) {
    // Only sync if editor doesn't have focus
    if (!view.hasFocus) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
      });
    }
  }
}, [value, view]);
```

**Tasks:**
- [ ] Check if editor has focus before syncing value
- [ ] Optionally preserve cursor position using `selection` in dispatch
- [ ] Test controlled component behavior
- [ ] Add prop to control sync behavior (always/on-blur/never)

#### E. Add Autocomplete Extension
**File:** `src/components/extensions/autocomplete.ts` (NEW)
**Status:** 🟢 NEW FEATURE - Autocomplete package already added

**Notice:** `@codemirror/autocomplete@^6.19.0` is in dependencies but not used yet

**Tasks:**
- [ ] Create `src/components/extensions/autocomplete.ts`
- [ ] Implement column name autocomplete when typing `[`
- [ ] Implement operator autocomplete after column name
- [ ] Implement value autocomplete for enum columns
- [ ] Add to extension list in `useCodeMirror.ts`
- [ ] Add tests for autocomplete functionality
- [ ] Document autocomplete keyboard shortcuts

**Example:**
```typescript
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';

export function createAutocompleteExtension(columns: ColumnDef[]) {
  return autocompletion({
    override: [
      (context: CompletionContext) => {
        // Detect if we're after '['
        // Return column name completions
        // etc.
      }
    ]
  });
}
```

## Critical Issues (High Priority)

### 1. Implement Missing Comparison Operators
**Status:** Parser supports these in grammar but AST builder and evaluator don't implement them properly

**Files to update:**
- `src/types/filter.ts:13` - Add to Condition['function'] type
- `src/parser/ASTBuilder.ts:259-284` - Fix operator mapping
- `src/evaluator/Comparators.ts` - Add operator implementations
- `src/validator/TypeChecker.ts` - Add operator compatibility checks
- `src/formatter/ASTPrinter.ts:148-171` - Add operator formatting

**Tasks:**
- [ ] Add `greaterThanOrEqual` and `lessThanOrEqual` to Condition['function'] type
- [ ] Fix `!=` operator in ASTBuilder to set `negate: true` on the Filter
- [ ] Implement `>=` operator mapping in ASTBuilder
  - Map to new `greaterThanOrEqual` function
- [ ] Implement `<=` operator mapping in ASTBuilder
  - Map to new `lessThanOrEqual` function
- [ ] Add `greaterThanOrEqual` comparator to Comparators.ts
  - For numbers: `columnValue >= compareValue`
  - For dates: `date1 >= date2`
- [ ] Add `lessThanOrEqual` comparator to Comparators.ts
  - For numbers: `columnValue <= compareValue`
  - For dates: `date1 <= date2`
- [ ] Update TypeChecker.isOperatorCompatible to include new operators
- [ ] Update SemanticValidator operator display names
- [ ] Update ASTPrinter to format new operators correctly
- [ ] Add comprehensive tests for `!=`, `>=`, `<=` operators in:
  - `src/__tests__/parser.test.ts`
  - `src/__tests__/evaluator.test.ts`
  - `src/__tests__/formatter.test.ts`

**Example Test Cases Needed:**
```typescript
// Parser tests
'[price] >= 100'  // should parse to greaterThanOrEqual
'[price] <= 50'   // should parse to lessThanOrEqual
'[status] != "open"'  // should parse to equals with negate: true

// Evaluator tests
evaluateFilter({op: 'AND', filters: [{condition: {column: 'price', function: 'greaterThanOrEqual', args: [100]}}]},
  {price: 100}, columns) // should be true
evaluateFilter({op: 'AND', filters: [{condition: {column: 'price', function: 'lessThanOrEqual', args: [100]}}]},
  {price: 100}, columns) // should be true
```

### 2. Fix Test Timeout Issue
**Current State:** Tests hang after 2 minutes

- [ ] Investigate why `npm test` times out
- [ ] Check if Vitest is running in watch mode when it shouldn't
- [ ] Verify no infinite loops in test cases
- [ ] Add timeout configuration to `vitest.config.ts` if needed

### 3. Add README.md
**File:** Create `/README.md`
**Priority:** CRITICAL - Now includes React component with CodeMirror

**Sections to include:**
- [ ] Project overview and description
  - Explain it's an ANTLR4-based filter query parser with formatter, evaluator, AND React component
  - Mention use case: building Excel/Airtable-style advanced filters
  - Highlight: Syntax highlighting, validation, auto-formatting, autocomplete
- [ ] Installation instructions
  - `npm install filter-query-editor react react-dom` (when published)
  - Peer dependencies: React 18+
- [ ] Quick start with React component
  ```tsx
  import { QueryEditor } from 'filter-query-editor';
  import 'filter-query-editor/dist/QueryEditor.css';

  function App() {
    const [query, setQuery] = useState('');
    const columns = [
      { id: 'status', type: 'string' },
      { id: 'price', type: 'number' }
    ];

    return (
      <QueryEditor
        value={query}
        columns={columns}
        onChange={(event) => {
          setQuery(event.text);
          if (event.isValid) {
            console.log('Parsed:', event.filters);
          }
        }}
        theme="light"
        placeholder="Enter a filter query..."
      />
    );
  }
  ```
- [ ] Quick start example showing parser, formatter, and evaluator (headless usage)
  ```typescript
  import { parseQuery, formatQuery, evaluateFilter } from 'filter-query-editor';

  // Define your columns
  const columns = [
    { id: 'status', type: 'string' },
    { id: 'price', type: 'number' }
  ];

  // Parse a query
  const result = parseQuery('[price] > 100 and [status] equals "open"', columns);

  // Format to canonical form
  const formatted = formatQuery('[price]>100 and [status]="open"', columns);
  // Returns: '[price] > 100 AND [status] equals "open"'

  // Evaluate against data
  const matches = evaluateFilter(result.filters, {price: 150, status: 'open'}, columns);
  // Returns: true
  ```
- [ ] Document all supported operators with examples
  - Comparison: `=`, `==`, `equals`, `>`, `<`, `>=`, `<=`, `!=`
  - Text: `contains`, `starts with`, `ends with`
  - Existence: `IS BLANK`, `IS NOT BLANK`
  - Logical: `AND`, `OR`, `NOT`
- [ ] Document supported data types
  - string, number, boolean, date, enum
- [ ] API Reference sections:
  - Parser API (`parseQuery`, `parseQueryOrThrow`)
  - Formatter API (`formatQuery`, `isCanonical`, `isIdempotent`)
  - Evaluator API (`evaluateFilter`, `evaluateFilterBatch`, `countMatches`, `findFirstMatch`)
  - Type exports
- [ ] Link to grammar file for syntax reference
- [ ] Add usage examples:
  - Basic filtering: `[status] equals "open"`
  - Complex queries: `([price] > 100 OR [price] < 10) AND [status] equals "open"`
  - Text operations: `[name] contains "test"`
  - Existence checks: `[description] IS NOT BLANK`
  - Using with React/Vue components
- [ ] Add badges (build status, coverage, npm version when published)
- [ ] Add license and contributing sections

### 4. Implement Token Position Tracking for Semantic Errors
**File:** `src/parser/QueryParser.ts:74-79`

- [ ] Extend AST nodes to include source position metadata
- [ ] Track token positions during AST building in `ASTBuilder.ts`
- [ ] Update `Condition`, `Filter`, `FilterGroup` types to include optional position info
- [ ] Use tracked positions in semantic validator errors (instead of 0,0)
- [ ] Add tests to verify error positions are accurate

## High Priority (New Features)

### 5. Fix Formatter Over-Parenthesization
**File:** `src/formatter/ASTPrinter.ts:87-88`
**Issue:** Formatter adds extra parentheses to NOT expressions that are already parenthesized

**Current behavior:**
```typescript
'NOT ([active] equals true)'  // Already has parens
// After formatting becomes:
'NOT (([active] equals true))'  // Double parens!
```

**Tasks:**
- [ ] Update normalizeParens logic to check if expression already starts with `(`
- [ ] Add tests to verify no double-parenthesization
- [ ] Consider only adding parens when the negated expression is a bare condition

**Fix suggestion:**
```typescript
if (filter.negate) {
  const notKeyword = this.options.uppercaseLogicalOps ? 'NOT' : 'not';
  // Only add parens if not already present AND it's a bare condition
  if (this.options.normalizeParens && filter.condition && !result.startsWith('(')) {
    result = `(${result})`;
  }
  result = `${notKeyword} ${result}`;
}
```

### 6. Document Case Sensitivity in String Operations
**Files:** `src/evaluator/Comparators.ts:130-203`
**Issue:** String operations are case-sensitive but not documented

**Tasks:**
- [ ] Add JSDoc note to `contains` function about case sensitivity
- [ ] Add JSDoc note to `startsWith` function about case sensitivity
- [ ] Add JSDoc note to `endsWith` function about case sensitivity
- [ ] Update README to mention case sensitivity
- [ ] Consider adding future operators: `containsIgnoreCase`, `startsWithIgnoreCase`, `endsWithIgnoreCase`

**Example JSDoc:**
```typescript
/**
 * Contains operator - case-sensitive substring match for strings
 * Note: This operator is case-sensitive. "Test" !== "test"
 * @see Use containsIgnoreCase for case-insensitive matching (future feature)
 */
export const contains: OperatorFunction = ...
```

## Medium Priority

### 7. Improve Date Validation in TypeChecker
**File:** `src/validator/TypeChecker.ts:91-98`
**Status:** Evaluator already uses `new Date()` with validation - TypeChecker should too

**Current issue:** Regex allows invalid dates like `"2024-02-30"` or `"2024-13-01"`

**Tasks:**
- [ ] Replace regex-only validation with actual date parsing (like evaluator does)
- [ ] Use same validation logic as `src/evaluator/Comparators.ts:67-76`
- [ ] Reject invalid dates that regex misses
- [ ] Add tests for invalid date edge cases
- [ ] Document supported date format(s) in type definitions (ISO 8601)
- [ ] Document timezone behavior (assumes UTC)

### 8. Add Modern Package Export Fields
**File:** `package.json`

- [ ] Add `"exports"` field for ESM/CJS dual support
  ```json
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  }
  ```
- [ ] Configure TypeScript to output both ESM and CJS formats
- [ ] Update build scripts accordingly
- [ ] Test import from both ESM and CJS projects

### 9. Add CI/CD Workflow
**File:** Create `.github/workflows/ci.yml`

- [ ] Set up GitHub Actions for automated testing
- [ ] Run tests on push/PR
- [ ] Run linting (add ESLint if not present)
- [ ] Generate and upload coverage reports
- [ ] Test on multiple Node.js versions (16, 18, 20)
- [ ] Add build verification step

### 10. Extend Function Types (Future Features)
**Files:** `src/types/filter.ts`, grammar, validators
**Priority:** Nice to have, but not blocking

- [ ] Consider adding `isNull`/`isNotNull` for null checking
  - Different from `isBlank` - only checks null/undefined, not empty string
- [ ] Consider adding `in` operator for list membership
  - Example: `[status] in ("open", "pending", "review")`
  - Update grammar to support value lists
- [ ] Consider adding `between` operator for ranges
  - Example: `[price] between 10 and 100`
  - Update grammar to support range syntax
- [ ] Consider case-insensitive text operators
  - `containsIgnoreCase`, `startsWithIgnoreCase`, `endsWithIgnoreCase`
- [ ] Update grammar to support new operators
- [ ] Update AST builder and validators
- [ ] Add comprehensive tests
- [ ] Update formatter to handle new operators

## Low Priority

### 11. Enhance Performance Testing
**File:** `src/__tests__/evaluator.test.ts:383-409`
**Current state:** Basic performance test exists for 10k rows

**Additional benchmarks needed:**
- [ ] Benchmark simple queries (single condition)
- [ ] Benchmark deeply nested expressions (10+ levels)
- [ ] Benchmark queries with many conditions (50+ AND/OR filters)
- [ ] Benchmark queries with large column schemas (1000+ columns)
- [ ] Benchmark parser performance on complex queries
- [ ] Benchmark formatter performance on large ASTs
- [ ] Document performance characteristics in README
- [ ] Set up regression testing to catch performance degradation
- [ ] Create separate `benchmarks.test.ts` file for comprehensive benchmarks

### 12. Create API Documentation Site
**Tools:** TypeDoc, Docusaurus, or similar

- [ ] Generate API docs from JSDoc comments
- [ ] Host on GitHub Pages or similar
- [ ] Add interactive examples (live query editor demo)
- [ ] Add grammar railroad diagrams (using ANTLR tools)
- [ ] Document all supported operators with examples
- [ ] Add troubleshooting guide
- [ ] Add "Recipes" section with common patterns
- [ ] Add performance tips

### 13. Add Fuzzing Tests
**File:** Create `src/__tests__/fuzz.test.ts`

- [ ] Test grammar with randomly generated inputs
- [ ] Test edge cases: deeply nested parens, long field names, etc.
- [ ] Test Unicode in field names and strings
- [ ] Test very long queries (10KB+)
- [ ] Ensure no crashes or infinite loops
- [ ] Use property-based testing library (fast-check)

## Code Quality Improvements

### 14. Remove TODOs from Code Comments
- [ ] Review all inline TODO comments
- [ ] Convert to GitHub issues or entries in this file
- [ ] Remove or implement inline TODOs
- [ ] Search for: `// TODO`, `// FIXME`, `// HACK`, `// XXX`

### 15. Add ESLint Configuration
**File:** Create `.eslintrc.json`

- [ ] Set up ESLint with TypeScript support
- [ ] Configure recommended rules
- [ ] Add pre-commit hook with lint-staged
- [ ] Fix any linting issues
- [ ] Add `npm run lint` script

### 16. Add Prettier Configuration
**File:** Create `.prettierrc`

- [ ] Configure Prettier for consistent formatting
- [ ] Add `npm run format` script
- [ ] Add pre-commit hook
- [ ] Format all existing code

### 17. Improve Error Messages
- [ ] Make semantic validation errors more user-friendly
- [ ] Add suggestions for common mistakes
  - Example: "Did you mean 'equals' instead of 'equal'?"
- [ ] Add error codes for programmatic error handling
- [ ] Document all possible error types

## Publishing & Distribution

### 18. Prepare for NPM Publication
**When ready to publish:**

- [ ] Choose appropriate package name (check availability)
- [ ] Add `"repository"` field to package.json
- [ ] Add `"homepage"` field
- [ ] Add `"bugs"` field
- [ ] Create LICENSE file (currently says MIT but no file)
- [ ] Add `"files"` field to control what gets published
- [ ] Set up npm publish workflow
- [ ] Add `prepublishOnly` script for safety checks

### 19. Add Examples Directory
**File:** Create `/examples` directory

**Examples to create:**
- [ ] Basic usage example (`examples/basic/`)
  - Simple query parsing
  - Formatting example
  - Evaluation example
- [ ] React integration example (`examples/react-filter-builder/`)
  - Filter builder UI component
  - Query input with syntax highlighting
  - Live preview of filtered results
- [ ] Vue integration example (`examples/vue-filter-builder/`)
- [ ] Node.js backend example (`examples/backend-api/`)
  - Express API endpoint for query validation
  - Database query generation from FilterGroup
- [ ] Advanced filtering example (`examples/advanced/`)
  - Complex nested queries
  - Custom column types
  - Performance optimization tips
- [ ] Schema definition example (`examples/schema/`)
  - Different column type examples
  - Enum validation
  - Date handling

## Documentation Improvements

### 20. Expand Type Documentation
- [ ] Add examples to JSDoc comments for all public types
- [ ] Document all valid operator combinations
- [ ] Add usage examples to interface definitions

### 21. Add Migration Guide (Future)
**File:** `docs/guides/MIGRATION.md`

- [ ] Document breaking changes (if any in future)
- [ ] Provide upgrade path between versions
- [ ] Include code examples for migrations
- [ ] Create when first major version upgrade happens

### 22. Add Contributing Guide
**File:** `CONTRIBUTING.md`

- [ ] Document development setup
  - Prerequisites (Node.js version, Java for ANTLR)
  - Installation steps
  - Running the project locally
- [ ] Explain how to modify the grammar
  - ANTLR grammar editing workflow
  - Running grammar generation
  - Testing grammar changes
- [ ] Explain how to run tests
  - Unit tests
  - Integration tests
  - Coverage reports
- [ ] Add code style guidelines
  - TypeScript conventions
  - Naming patterns
  - Comment standards
- [ ] Add PR template
  - Description format
  - Testing checklist
  - Breaking change notice

---

---

## Summary

**Total TODOs:** 23 major items (0-22), ~180+ individual tasks

**⚠️ BREAKING CHANGES DETECTED:**
- React component added with new dependencies
- TypeScript config changed to support JSX (`"jsx": "react-jsx"`)
- Module system changed from CommonJS to ESNext
- Vite build tool added (`@vitejs/plugin-react`, `vite`)
- DataType enum added for backward compatibility

**📦 New Package Dependencies:**
- `@codemirror/autocomplete` - Added but not yet implemented
- `@vitejs/plugin-react` - Build tool for React components
- `vite` - Fast build tool (replacing or augmenting tsc?)

**Priority Breakdown:**

### **🔴 URGENT (Fix Immediately):** Item 0
React component has critical bugs that will break functionality:
  - **0.A** Formatting extension crashes (comparing object to string)
  - **0.B** Component not exported from main index
  - **0.C** Performance issue with column dependency
  - **0.D** Cursor position not preserved on external updates
  - **0.E** Autocomplete package added but not implemented

### **Critical (Do Next):** Items 1-4
  - Missing operators (`>=`, `<=`, `!=`) - blocking full evaluation
  - Test timeout - blocking CI/CD
  - README - essential documentation (now must include React examples)
  - Position tracking - better DX

### **High Priority:** Items 5-10
  - Formatter improvements
  - Documentation gaps
  - Date validation consistency
  - Package modernization
  - Component UX improvements

### **Medium/Low Priority:** Items 11-22
  - Performance enhancements
  - Code quality tools
  - Publishing preparation
  - Extended features

---

## Build System Changes Needed

**Notice:** Package now has both `tsc` and `vite` in dependencies

**Questions to resolve:**
- [ ] Is Vite replacing TypeScript compiler?
- [ ] Update build scripts to use Vite for bundling
- [ ] Configure Vite to build both library and React component
- [ ] Ensure CSS is bundled/exported correctly
- [ ] Update `package.json` main/module/exports fields for Vite output
- [ ] Test that both headless (parser/formatter/evaluator) and React component work when imported

**Recommended Build Setup:**
```json
"scripts": {
  "generate:parser": "...",
  "build:lib": "tsc",
  "build:components": "vite build",
  "build": "npm run generate:parser && npm run build:lib && npm run build:components",
  "dev": "vite",
  "test": "vitest"
}
```
