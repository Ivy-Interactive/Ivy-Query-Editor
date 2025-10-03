# Part 4: Autocomplete & Positioned Dropdowns - Product Requirements Document

## Overview

Autocomplete and positioned dropdowns enhance the editor with intelligent suggestions and click-triggered discovery. Autocomplete appears when typing, while dropdowns appear on click. Both are context-aware, showing only relevant options (columns, operators, values) based on cursor position. This part builds on Part 3 (base editor).

**Key Features:**
- Context-aware autocomplete (triggers on typing and Ctrl+Space)
- Positioned dropdowns (triggers on click)
- Column, operator, value, and logical operator suggestions
- Enum value support
- Keyboard navigation (arrow keys, Enter)
- Single undo operation for insertions

## Goals

- **Primary Goal:** Provide intelligent autocomplete and click-triggered dropdowns that help users discover available columns, operators, and values without memorizing syntax.
- Determine context (column, operator, value, logical) using ANTLR parser state.
- Show only compatible operators for each column type.
- Show enum values for enum-type columns.
- Ensure autocomplete and dropdowns coexist without conflicts.
- Deliver fast response times (< 100ms).

## User Stories

1. **As a** user, **I want to** see column suggestions when I start typing **so that** I don't have to remember exact column names.

2. **As a** user, **I want to** see operator suggestions after typing a column **so that** I know which operators are valid for that column type.

3. **As a** user, **I want to** see enum values after typing an equals operator on an enum column **so that** I can select from valid options.

4. **As a** user, **I want to** press Ctrl+Space to manually trigger autocomplete **so that** I can see suggestions even if autocomplete didn't trigger automatically.

5. **As a** user, **I want to** click between a column and value to see an operator dropdown **so that** I can discover valid operators.

6. **As a** user, **I want to** navigate autocomplete suggestions with arrow keys and select with Enter **so that** I can quickly pick an option without using the mouse.

7. **As a** developer, **I want to** autocomplete to insert text in a single undo operation **so that** users can undo the insertion cleanly.

## Functional Requirements

### Requirement 1: Context Detection
**Description:**
Implement a `getCompletionContext(text: string, pos: number, columns: ColumnDef[]): CompletionContext | null` function that determines what kind of suggestion to show based on cursor position. Use ANTLR parser state to detect whether the cursor is at a column, operator, value, or logical operator position.

**Acceptance Criteria:**
- [ ] Function signature: `getCompletionContext(text: string, pos: number, columns: ColumnDef[]): CompletionContext | null`
- [ ] Context types: `'column' | 'operator' | 'value' | 'logical'`
- [ ] Returns `{ type: 'column', from: number }` when cursor is at column position
- [ ] Returns `{ type: 'operator', columnId: string, from: number }` when cursor is after a column
- [ ] Returns `{ type: 'value', columnId: string, from: number }` when cursor is after an operator
- [ ] Returns `{ type: 'logical', from: number }` when cursor is between conditions
- [ ] Returns `null` when context is ambiguous or no suggestions available
- [ ] Performance: < 50ms for typical queries

**Priority:** High

### Requirement 2: Autocomplete Extension
**Description:**
Implement a CodeMirror 6 autocomplete extension using `CompletionSource` that provides context-aware suggestions. Autocomplete should activate on typing and on manual trigger (Ctrl+Space).

**Acceptance Criteria:**
- [ ] Extension uses `autocompletion` from `@codemirror/autocomplete`
- [ ] Autocomplete activates on typing (automatic)
- [ ] Autocomplete activates on Ctrl+Space (manual)
- [ ] Column suggestions: Show all columns as `[columnId]` with type as detail
- [ ] Operator suggestions: Show operators compatible with column type
- [ ] Value suggestions: Show enum values (if enum) or `""` snippet
- [ ] Logical suggestions: Show `AND` and `OR`
- [ ] Keyboard navigation: Arrow keys to navigate, Enter to select, Esc to dismiss
- [ ] Selection inserts text in single undo operation
- [ ] Caret positioned after insertion
- [ ] Max 20 options rendered at once
- [ ] Performance: < 100ms to show suggestions

**Priority:** High

### Requirement 3: Column Suggestions
**Description:**
When the cursor is at a column position, show all available columns from the schema. Each suggestion should include the column ID (bracketed) and type.

**Acceptance Criteria:**
- [ ] Suggestions formatted as `[columnId]`
- [ ] Detail shows column type (e.g., "string", "number")
- [ ] If `displayName` provided, show as detail instead of type
- [ ] Suggestions sorted alphabetically by column ID
- [ ] Selecting a suggestion inserts `[columnId]` with cursor after `]`
- [ ] Suggestion icon: variable icon (if supported by CM6 theme)

**Priority:** High

### Requirement 4: Operator Suggestions
**Description:**
When the cursor is after a column (e.g., `[status] `), show operators compatible with that column's type. String columns support `equals` and `contains`, number/date columns support `equals`, `>`, `<`, etc.

**Acceptance Criteria:**
- [ ] String columns: `equals`, `contains`
- [ ] Number columns: `equals`, `>`, `<`
- [ ] Date columns: `equals`, `>`, `<`
- [ ] Boolean columns: `equals` only
- [ ] Enum columns: `equals` only
- [ ] Suggestions show operator symbol (e.g., `>`) with function name as detail (e.g., "greaterThan")
- [ ] Selecting an operator inserts ` operator ` (with spaces)
- [ ] Cursor positioned after trailing space

**Priority:** High

### Requirement 5: Value Suggestions
**Description:**
When the cursor is after an operator (e.g., `[status] equals `), show value suggestions. For enum columns, show all enum values. For other types, show a `""` snippet or placeholder.

**Acceptance Criteria:**
- [ ] Enum columns: Show all `enumValues` as `"value"`
- [ ] String columns: Show `""` snippet with cursor inside quotes
- [ ] Number columns: Show placeholder text "number" (no actual suggestion)
- [ ] Boolean columns: Show `true` and `false`
- [ ] Date columns: Show `"YYYY-MM-DD"` placeholder
- [ ] Selecting an enum value inserts `"value"` with cursor after closing quote
- [ ] Selecting `""` snippet inserts `""` with cursor between quotes

**Priority:** High

### Requirement 6: Logical Operator Suggestions
**Description:**
When the cursor is between conditions (e.g., `[a] > 1 `), show `AND` and `OR` suggestions.

**Acceptance Criteria:**
- [ ] Suggestions: `AND`, `OR`
- [ ] Selecting inserts ` operator ` (with spaces)
- [ ] Cursor positioned after trailing space

**Priority:** Medium

### Requirement 7: Positioned Dropdown Extension
**Description:**
Implement a CodeMirror 6 extension that shows a positioned dropdown on click. The dropdown should appear at the exact click location and show the same context-aware options as autocomplete.

**Acceptance Criteria:**
- [ ] Click on token or expected slot triggers dropdown
- [ ] Dropdown uses CM6 tooltip system for positioning
- [ ] Dropdown anchored to click position (caret)
- [ ] Dropdown shows same options as autocomplete (based on context)
- [ ] Dropdown follows scroll and resize events
- [ ] Selection inserts/replaces text in single undo operation
- [ ] Caret positioned after insertion
- [ ] Dropdown dismisses on blur or selection
- [ ] Dropdown styled with custom CSS class `cm-dropdown`

**Priority:** Medium

### Requirement 8: Keyboard Navigation
**Description:**
Support full keyboard navigation for autocomplete: arrow keys to move selection, Enter to accept, Esc to dismiss, Tab to accept or move to next suggestion.

**Acceptance Criteria:**
- [ ] Arrow Up/Down: Navigate suggestions
- [ ] Enter: Accept selected suggestion
- [ ] Esc: Dismiss autocomplete
- [ ] Tab: Accept selected suggestion (or move to next if no selection)
- [ ] Home: Jump to first suggestion
- [ ] End: Jump to last suggestion
- [ ] Page Up/Down: Scroll suggestions (if many)

**Priority:** Medium

## Technical Requirements

### Performance
- **Context detection:** < 50ms
- **Autocomplete response:** < 100ms to show suggestions
- **Dropdown positioning:** < 50ms to render

### Security
- **XSS prevention:** All suggestions rendered via React/CM6 APIs (no innerHTML)

### Scalability
- **Large schema:** Handle 100+ columns without lag
- **Many suggestions:** Render max 20 at once (pagination/scroll)

### Dependencies
- **Part 1:** Parser (for context detection)
- **Part 3:** Base editor (for integration)

## User Interface

### Autocomplete Panel
- **Appearance:** Floating panel below cursor, white background (light) or #252526 (dark)
- **Border:** 1px solid #ccc (light) or #454545 (dark)
- **Shadow:** Drop shadow (0 2px 8px rgba(0,0,0,0.15))
- **Width:** Auto (min 150px, max 300px)
- **Max height:** 300px (scrollable if more)
- **Item height:** 24px
- **Item padding:** 4px 8px
- **Selected item:** Blue background (#007acc) with white text
- **Item structure:** Label (left), detail (right, gray)

### Positioned Dropdown
- **Appearance:** Same as autocomplete panel
- **Positioning:** Anchored to click position (or caret if no click position available)
- **Behavior:** Dismisses on click outside, Esc, or selection

### Icons (Optional)
- **Column:** Variable icon (e.g., `{x}`)
- **Operator:** Operator icon (e.g., `>`)
- **Value:** String icon (e.g., `"abc"`)
- **Logical:** Keyword icon (e.g., `AND`)

## API Specifications

### Context Detection API
```typescript
type CompletionContextType = 'column' | 'operator' | 'value' | 'logical';

interface CompletionContext {
  type: CompletionContextType;
  from: number; // start position for replacement
  columnId?: string; // for operator/value contexts
}

/**
 * Determine completion context at a given position.
 * Uses ANTLR parser to analyze cursor position.
 *
 * @param text - The query text
 * @param pos - Cursor position (0-indexed)
 * @param columns - Schema of available columns
 * @returns CompletionContext or null if no context
 */
export function getCompletionContext(
  text: string,
  pos: number,
  columns: ColumnDef[]
): CompletionContext | null;
```

### Autocomplete Extension API
```typescript
/**
 * CodeMirror 6 autocomplete extension.
 * Provides context-aware suggestions for columns, operators, and values.
 *
 * @param columns - Schema of available columns
 * @returns CM6 extension
 */
export function autocompleteExtension(columns: ColumnDef[]): Extension;
```

### Dropdown Extension API
```typescript
/**
 * CodeMirror 6 positioned dropdown extension.
 * Shows context-aware dropdown on click.
 *
 * @param columns - Schema of available columns
 * @returns CM6 extension
 */
export function dropdownExtension(columns: ColumnDef[]): Extension;
```

## Data Model

### Completion Item Structure
```typescript
interface CompletionItem {
  label: string;       // Displayed text (e.g., "[status]", ">", "AND")
  type: string;        // CM6 completion type ("variable", "keyword", "text")
  detail?: string;     // Additional info (e.g., "string", "greaterThan")
  apply: string;       // Text to insert (e.g., "[status]", " > ", " AND ")
  boost?: number;      // Sort priority (higher = shown first)
}
```

### Operator Compatibility
```typescript
const operatorsByType: Record<ColumnType, Array<{ symbol: string; function: string }>> = {
  string: [
    { symbol: 'equals', function: 'equals' },
    { symbol: 'contains', function: 'contains' },
  ],
  number: [
    { symbol: 'equals', function: 'equals' },
    { symbol: '>', function: 'greaterThan' },
    { symbol: '<', function: 'lessThan' },
  ],
  date: [
    { symbol: 'equals', function: 'equals' },
    { symbol: '>', function: 'greaterThan' },
    { symbol: '<', function: 'lessThan' },
  ],
  boolean: [
    { symbol: 'equals', function: 'equals' },
  ],
  enum: [
    { symbol: 'equals', function: 'equals' },
  ],
};
```

## Edge Cases & Error Handling

### Edge Cases
- **Ambiguous context:** Return `null` (no suggestions)
- **Unknown column in incomplete query:** Show all columns
- **Cursor inside string literal:** No autocomplete (literal is user input)
- **Cursor inside column brackets:** Show column suggestions (replace partial)
- **Multiple spaces:** Detect context ignoring extra whitespace
- **Incomplete operator (e.g., `>`typing `great`):** Autocomplete filters to matching operators
- **Enum with 100+ values:** Paginate or scroll (max 20 visible)

### Error Handling
- **Context detection fails:** Return `null`, no autocomplete
- **Unknown column type:** Show `equals` only (safe default)
- **Missing enumValues for enum column:** Show `""` snippet (fallback)

## Dependencies

### Internal Dependencies
- **Part 1:** Parser (`parseQuery`, types)
- **Part 3:** Base editor (for integration)

### External Libraries
- **CodeMirror 6:**
  - `@codemirror/autocomplete`: Autocomplete APIs
  - `@codemirror/view`: Tooltip system for dropdowns

## Out of Scope

### Explicitly NOT Included
- **Fuzzy matching:** Autocomplete uses exact prefix matching (e.g., `st` matches `status`, not `system`)
- **Multi-cursor autocomplete:** Single cursor only
- **Autocomplete for nested functions:** No functions beyond operators
- **Smart quotes:** Autocomplete inserts straight quotes (`"`) only
- **Custom completion sources:** Fixed to columns/operators/values

## Success Metrics

### Functionality
- **Target:** 100% of completion contexts detected correctly

### Autocomplete CTR (Click-Through Rate)
- **Target:** 70%+ of autocomplete suggestions are accepted (not dismissed)

### Dropdown Usage
- **Target:** 50%+ of users trigger positioned dropdowns at least once

### Performance
- **Target:** Context detection < 50ms
- **Target:** Autocomplete response < 100ms

### Test Coverage
- **Target:** 90%+ line coverage for context detection and completion logic

## Timeline

**Estimated Completion:** 1-2 weeks

### Tasks
1. **Context Detection (2-3 days)**
   - Implement `getCompletionContext()` using ANTLR parser
   - Test with diverse query examples

2. **Autocomplete Extension (2-3 days)**
   - Implement `CompletionSource`
   - Generate column, operator, value, logical suggestions
   - Test keyboard navigation

3. **Positioned Dropdown Extension (1-2 days)**
   - Implement tooltip-based dropdown
   - Integrate with context detection
   - Test positioning and dismiss behavior

4. **Testing & Polish (2 days)**
   - Unit tests for context detection
   - Integration tests for autocomplete
   - Visual regression tests for dropdowns
   - Performance benchmarks

## Open Questions

1. **Should autocomplete filter suggestions based on partial input (e.g., `st` → `status`)?**
   → Decision: Yes, use prefix matching. `st` shows `status`, `state`, etc.

2. **Should autocomplete trigger immediately on typing, or after a delay?**
   → Decision: Immediately (no delay). CM6 handles performance.

3. **Should dropdowns show the same options as autocomplete, or a subset?**
   → Decision: Same options (consistent behavior).

4. **Should we support snippet placeholders (e.g., `"${1:value}"`)?**
   → Decision: No snippets for v1. Plain text insertion only.

5. **Should we show documentation/hints on hover for completion items?**
   → Decision: No hover hints for v1. Detail text is sufficient.

6. **Should we support custom completion item rendering (icons, colors)?**
   → Decision: No custom rendering for v1. Use CM6 default styles.

---

## Test Plan

### Context Detection Tests
```typescript
describe('getCompletionContext', () => {
  const columns: ColumnDef[] = [
    { id: 'status', type: 'string' },
    { id: 'price', type: 'number' },
  ];

  test('detects column context', () => {
    const context = getCompletionContext('[', 1, columns);
    expect(context).toEqual({ type: 'column', from: 0 });
  });

  test('detects operator context', () => {
    const context = getCompletionContext('[status] ', 9, columns);
    expect(context).toEqual({ type: 'operator', columnId: 'status', from: 9 });
  });

  test('detects value context', () => {
    const context = getCompletionContext('[status] equals ', 16, columns);
    expect(context).toEqual({ type: 'value', columnId: 'status', from: 16 });
  });

  test('detects logical context', () => {
    const context = getCompletionContext('[status] equals "open" ', 23, columns);
    expect(context).toEqual({ type: 'logical', from: 23 });
  });

  test('returns null for ambiguous context', () => {
    const context = getCompletionContext('[status] equals "open"', 15, columns); // inside "open"
    expect(context).toBeNull();
  });
});
```

### Autocomplete Tests
```typescript
describe('Autocomplete Extension', () => {
  test('shows column suggestions', async () => {
    const view = createEditorWithAutocomplete('[');
    await triggerAutocomplete(view);

    const suggestions = getAutocompleteSuggestions(view);
    expect(suggestions).toContainEqual(
      expect.objectContaining({ label: '[status]', type: 'variable' })
    );
    expect(suggestions).toContainEqual(
      expect.objectContaining({ label: '[price]', type: 'variable' })
    );
  });

  test('shows operator suggestions', async () => {
    const view = createEditorWithAutocomplete('[status] ');
    await triggerAutocomplete(view);

    const suggestions = getAutocompleteSuggestions(view);
    expect(suggestions).toContainEqual(
      expect.objectContaining({ label: 'equals', detail: 'equals' })
    );
    expect(suggestions).toContainEqual(
      expect.objectContaining({ label: 'contains', detail: 'contains' })
    );
  });

  test('shows value suggestions for enum', async () => {
    const columns: ColumnDef[] = [
      { id: 'status', type: 'enum', enumValues: ['open', 'closed'] },
    ];
    const view = createEditorWithAutocomplete('[status] equals ', columns);
    await triggerAutocomplete(view);

    const suggestions = getAutocompleteSuggestions(view);
    expect(suggestions).toContainEqual(
      expect.objectContaining({ label: '"open"' })
    );
    expect(suggestions).toContainEqual(
      expect.objectContaining({ label: '"closed"' })
    );
  });

  test('inserts suggestion in single undo operation', async () => {
    const view = createEditorWithAutocomplete('[');
    await triggerAutocomplete(view);
    await acceptSuggestion(view, '[status]');

    expect(view.state.doc.toString()).toBe('[status]');

    undo(view);
    expect(view.state.doc.toString()).toBe('['); // Entire insertion undone
  });

  test('keyboard navigation', async () => {
    const view = createEditorWithAutocomplete('[');
    await triggerAutocomplete(view);

    const initialSelection = getSelectedSuggestion(view);

    // Press arrow down
    pressKey(view, 'ArrowDown');
    const newSelection = getSelectedSuggestion(view);

    expect(newSelection).not.toBe(initialSelection);

    // Press Enter to accept
    pressKey(view, 'Enter');
    expect(view.state.doc.toString()).toContain('['); // Suggestion inserted
  });
});
```

### Dropdown Tests
```typescript
describe('Positioned Dropdown Extension', () => {
  test('shows dropdown on click', () => {
    const view = createEditorWithDropdown('[status] ');
    clickAtPosition(view, 9); // After [status]

    const dropdown = getVisibleDropdown(view);
    expect(dropdown).toBeDefined();
    expect(dropdown.options).toContainEqual(
      expect.objectContaining({ label: 'equals' })
    );
  });

  test('dropdown positioned at click location', () => {
    const view = createEditorWithDropdown('[status] ');
    const clickPos = { x: 100, y: 50 };
    clickAt(view, clickPos);

    const dropdown = getVisibleDropdown(view);
    const dropdownPos = getDropdownPosition(dropdown);

    expect(dropdownPos.x).toBeCloseTo(clickPos.x, 10);
    expect(dropdownPos.y).toBeCloseTo(clickPos.y, 10);
  });

  test('dropdown dismisses on blur', () => {
    const view = createEditorWithDropdown('[status] ');
    clickAtPosition(view, 9);

    expect(getVisibleDropdown(view)).toBeDefined();

    clickOutside(view);
    expect(getVisibleDropdown(view)).toBeUndefined();
  });

  test('dropdown dismisses on selection', () => {
    const view = createEditorWithDropdown('[status] ');
    clickAtPosition(view, 9);

    const dropdown = getVisibleDropdown(view);
    selectDropdownOption(dropdown, 'equals');

    expect(getVisibleDropdown(view)).toBeUndefined();
    expect(view.state.doc.toString()).toContain('equals');
  });
});
```

## Appendix

### Context Detection Examples

| Query | Cursor Position | Context |
|-------|----------------|---------|
| `[` | After `[` | `{ type: 'column', from: 0 }` |
| `[status] ` | After space | `{ type: 'operator', columnId: 'status', from: 9 }` |
| `[status] equals ` | After space | `{ type: 'value', columnId: 'status', from: 16 }` |
| `[status] equals "open" ` | After space | `{ type: 'logical', from: 23 }` |
| `[status] equals "open"` | Inside `"open"` | `null` (no suggestions) |

### Operator Compatibility Table

| Column Type | Operators |
|-------------|-----------|
| `string` | `equals`, `contains` |
| `number` | `equals`, `>`, `<` |
| `boolean` | `equals` |
| `date` | `equals`, `>`, `<` |
| `enum` | `equals` |

### CSS Styles for Autocomplete
```css
/* Autocomplete panel */
.cm-tooltip-autocomplete {
  background-color: #ffffff;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  max-height: 300px;
  overflow-y: auto;
}

.cm-theme-dark .cm-tooltip-autocomplete {
  background-color: #252526;
  border-color: #454545;
}

/* Autocomplete item */
.cm-completionItem {
  padding: 4px 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
}

.cm-completionItem[aria-selected="true"] {
  background-color: #007acc;
  color: #ffffff;
}

.cm-completionLabel {
  flex: 1;
}

.cm-completionDetail {
  color: #888;
  margin-left: 16px;
  font-size: 0.9em;
}

.cm-completionItem[aria-selected="true"] .cm-completionDetail {
  color: #cccccc;
}

/* Positioned dropdown */
.cm-dropdown {
  /* Same styles as autocomplete panel */
}

.cm-dropdown-item {
  /* Same styles as autocomplete item */
}
```
