# Part 3: CodeMirror Base Integration - Product Requirements Document

## Overview

The CodeMirror base integration establishes the core editor component with syntax highlighting, validation (linting), and **automatic formatting**. It creates a React wrapper around CodeMirror 6 with custom extensions for the filter query language.

**Key Features:**

- React component wrapper for CodeMirror 6
- Custom syntax highlighting extension (ANTLR-powered)
- Validation extension with lint diagnostics
- **Automatic formatting applied on every change**
- Light/dark theme support
- Controlled component API

## Goals

- **Primary Goal:** Create a functional, styled editor component that users can type queries into with real-time syntax highlighting, validation feedback, and auto-formatting.
- Integrate CodeMirror 6 with React lifecycle (mount, update, unmount).
- Provide syntax highlighting using ANTLR lexer.
- Show validation errors as red underlines with hover tooltips.
- Apply formatting automatically as the user types.
- Deliver light and dark themes matching VS Code aesthetics.

## User Stories

1. **As a** user, **I want to** see syntax highlighting as I type **so that** I can visually distinguish keywords, operators, columns, and values.
2. **As a** user, **I want to** see red underlines when I type an invalid query **so that** I know immediately when something is wrong.
3. **As a** user, **I want to** hover over errors to see a tooltip with the error message **so that** I understand what needs to be fixed.
4. **As a** user, **I want my query formatted automatically as I type** **so that** it always stays clean and readable.
5. **As a** developer, **I want to** integrate the editor into my React app with a simple `<QueryEditor>` component **so that** setup is quick and easy.
6. **As a** developer, **I want to** receive `onChange` callbacks with the current text and validation state **so that** I can respond to user input.

## Functional Requirements

### Requirement 1: React Component Wrapper

**Description:**  
Create a `<QueryEditor>` React component that wraps CodeMirror 6 and manages the editor lifecycle. The component should be a controlled component (accepts `value` prop) and emit `onChange` events.

**Acceptance Criteria:**

- [ ] Component accepts props: `value`, `columns`, `onChange`, `theme`, `readOnly`, `height`, `placeholder`
- [ ] Component creates CodeMirror `EditorView` on mount
- [ ] Component updates editor when `value` prop changes
- [ ] Component destroys editor on unmount (no memory leaks)
- [ ] Component emits `onChange` with `{ text, isValid, filters, errors }` on every change
- [ ] Multiple instances can coexist on the same page
- [ ] Component re-renders efficiently (no unnecessary updates)

**Priority:** High

### Requirement 2: Syntax Highlighting Extension

**Description:**  
Implement a CodeMirror 6 extension that provides syntax highlighting using the ANTLR lexer from Part 1. The extension should tokenize the document on every change and apply decorations to ranges based on token types.

**Acceptance Criteria:**

- [ ] Extension uses ANTLR lexer (not Lezer grammar)
- [ ] Keywords (AND, OR, NOT) highlighted in blue and bold
- [ ] Operators (>, <, equals, contains) highlighted as operators
- [ ] Column identifiers (in brackets) highlighted as variable names
- [ ] String literals highlighted
- [ ] Numbers highlighted
- [ ] Booleans highlighted
- [ ] Highlighting updates in real-time (< 10ms for 1000 chars)
- [ ] Light and dark themes supported

**Priority:** High

### Requirement 3: Validation Extension (Linting)

**Description:**  
Implement a CodeMirror 6 lint extension that parses the query with ANTLR on debounce (300ms) and shows syntax/semantic errors as diagnostics. Errors appear as red underlines with hover tooltips.

**Acceptance Criteria:**

- [ ] Extension uses `linter` from `@codemirror/lint`
- [ ] Parsing debounced at 300ms
- [ ] Syntax errors shown as red underlines
- [ ] Semantic errors shown as red underlines
- [ ] Hover over error shows tooltip with error message
- [ ] Multiple errors shown simultaneously
- [ ] Errors cleared when query becomes valid
- [ ] Validation runs on every doc change (debounced)

**Priority:** High

### Requirement 4: Automatic Formatting

**Description:**  
Implement a CodeMirror 6 extension that applies formatting automatically whenever the document changes and the query parses successfully. Formatting should run debounced to avoid jitter (e.g. 300–500 ms after input stops). The entire document is replaced in a single undo operation, and the cursor position should be preserved.

**Acceptance Criteria:**

- [ ] Formatting runs automatically on every valid change (debounced)
- [ ] Formatter calls `formatQuery()` from Part 2
- [ ] Document replaced in a single undo operation
- [ ] Cursor/caret position preserved (or adjusted intelligently)
- [ ] If query is invalid, formatting does nothing until valid again
- [ ] Format completes in < 50 ms for typical inputs

**Priority:** High

### Requirement 5: Theme Support

**Description:**  
Provide light and dark themes with appropriate color schemes for syntax highlighting and UI elements.

**Acceptance Criteria:**

- [ ] Light theme: white background, black text, blue keywords, red strings, green numbers
- [ ] Dark theme: dark gray background, light gray text, light blue keywords, orange strings, light green numbers
- [ ] Theme controlled via `theme` prop
- [ ] Diagnostics respect theme
- [ ] Editor border and focus state respect theme

**Priority:** Medium

### Requirement 6: Controlled Component Behavior

**Description:**  
The component should behave as a controlled component: the `value` prop is the source of truth, and changes are emitted via `onChange`.

**Acceptance Criteria:**

- [ ] `value` prop updates the editor document
- [ ] `onChange` emits current text on every change
- [ ] Component does not maintain internal state for text
- [ ] Rapid `value` prop changes handled gracefully
- [ ] Cursor position preserved when `value` prop changes externally

**Priority:** High

### Requirement 7: Basic Editor Features

**Description:**  
Provide basic editor features like placeholder text, read-only mode, and configurable height.

**Acceptance Criteria:**

- [ ] `placeholder` prop shows italic gray text when empty
- [ ] `readOnly` prop disables editing
- [ ] `height` prop accepts number or string
- [ ] Editor uses monospace font
- [ ] Editor has subtle border
- [ ] Editor shows blue border on focus

**Priority:** Medium

**Description:**
Provide basic editor features like placeholder text, read-only mode, and configurable height.

**Acceptance Criteria:**

- [ ] `placeholder` prop shows italic gray text when editor is empty
- [ ] `readOnly` prop disables editing (editor is view-only)
- [ ] `height` prop accepts number (px) or string (e.g., "100%", "10rem")
- [ ] Editor uses monospace font
- [ ] Editor has subtle border (1px solid gray)
- [ ] Editor shows blue border on focus

**Priority:** Medium

## Technical Requirements

### Performance

- **Syntax highlighting:** < 10ms for 1000 character input (main thread OK)
- **Validation (debounced):** < 50ms parse time after 300ms debounce
- **Format command:** < 50ms to replace document
- **Initial render:** < 100ms

### Security

- **XSS prevention:** No innerHTML usage; all DOM created via React/CM6 APIs
- **Sanitization:** String values properly escaped by parser/formatter

### Scalability

- **Multiple instances:** 5+ editors on same page without performance degradation
- **Memory:** No memory leaks on mount/unmount

### Browser Support

- Chrome, Firefox, Safari, Edge (latest 2 versions)

### Bundle Size

- **Component + CM6:** < 80KB gzipped (CM6 ~50KB + custom extensions ~30KB)

## User Interface

### Editor Appearance

- **Height:** 60px default (configurable)
- **Font:** Monospace (e.g., Monaco, Consolas, Courier New)
- **Border:** 1px solid #d0d0d0 (light) or #3c3c3c (dark)
- **Focus border:** 2px solid #007acc (blue)
- **Background:** #ffffff (light) or #1e1e1e (dark)
- **Text color:** #000000 (light) or #d4d4d4 (dark)
- **Placeholder:** Italic, #999999

### Syntax Highlighting (Light Theme)

- **Keywords:** #0000ff (blue), bold
- **Operators:** #000000 (black)
- **Variables (columns):** #001080 (dark blue)
- **Strings:** #a31515 (red)
- **Numbers:** #098658 (green)
- **Booleans:** #0000ff (blue)

### Syntax Highlighting (Dark Theme)

- **Keywords:** #569cd6 (light blue), bold
- **Operators:** #d4d4d4 (light gray)
- **Variables (columns):** #9cdcfe (cyan)
- **Strings:** #ce9178 (orange)
- **Numbers:** #b5cea8 (light green)
- **Booleans:** #569cd6 (light blue)

### Lint Diagnostics

- **Underline:** Red squiggly (wave style)
- **Tooltip:** White background (light) or #252526 (dark), drop shadow, small padding
- **Tooltip text:** Error message, 12px font

## API Specifications

### Component Props

```typescript
export interface QueryEditorProps {
  /** Current query text (controlled) */
  value?: string;

  /** Column catalog for validation and autocomplete */
  columns: ColumnDef[];

  /** Fires on every change with validation state */
  onChange?: (event: QueryEditorChangeEvent) => void;

  /** Editor theme */
  theme?: "light" | "dark"; // default: "light"

  /** Read-only mode */
  readOnly?: boolean; // default: false

  /** Editor height */
  height?: number | string; // default: 60

  /** Placeholder text when empty */
  placeholder?: string;
}

export interface QueryEditorChangeEvent {
  /** Raw text value */
  text: string;

  /** True if syntax and semantics are valid */
  isValid: boolean;

  /** Parsed filter model (only if isValid) */
  filters?: FilterGroup;

  /** List of errors (only if !isValid) */
  errors?: ParseError[];
}
```

### Component Usage

```typescript
import { QueryEditor } from '@ivy-framework/query-editor';
import '@ivy-framework/query-editor/dist/styles.css';

function MyComponent() {
  const [query, setQuery] = useState('');

  const handleChange = (event: QueryEditorChangeEvent) => {
    setQuery(event.text);
    if (event.isValid) {
      console.log('Valid filter:', event.filters);
    } else {
      console.log('Errors:', event.errors);
    }
  };

  return (
    <QueryEditor
      value={query}
      columns={columns}
      onChange={handleChange}
      theme="light"
      height={60}
      placeholder="e.g. [status] equals \"active\""
    />
  );
}
```

## Data Model

### CodeMirror Extension Architecture

```typescript
// Main extensions array
const extensions = [
  basicSetup, // CM6 basic features (line numbers, etc.)
  syntaxHighlightExtension(theme), // Custom ANTLR-based highlighting
  validationExtension(columns), // Custom lint extension
  formattingExtension(columns), // Custom format command
  EditorView.editable.of(!readOnly),
  EditorView.theme({
    /* custom styles */
  }),
  EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      // Emit onChange
    }
  }),
  placeholder ? placeholderExtension(placeholder) : [],
];
```

### Syntax Highlighting Implementation

```typescript
import { StateField, Decoration, DecorationSet } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

const syntaxHighlightField = StateField.define<DecorationSet>({
  create(state) {
    return decorateWithANTLR(state.doc);
  },
  update(decorations, tr) {
    if (tr.docChanged) {
      return decorateWithANTLR(tr.state.doc);
    }
    return decorations;
  },
  provide: (f) => EditorView.decorations.from(f),
});

function decorateWithANTLR(doc: Text): DecorationSet {
  const tokens = lexWithANTLR(doc.toString());
  const decorations = tokens.map((token) =>
    Decoration.mark({
      class: `cm-${tokenTypeToClass[token.type]}`,
    }).range(token.start, token.end)
  );
  return Decoration.set(decorations);
}
```

### Validation Extension Implementation

```typescript
import { linter, Diagnostic } from "@codemirror/lint";

export function validationExtension(columns: ColumnDef[]) {
  return linter(
    (view) => {
      const text = view.state.doc.toString();
      const { errors } = parseQuery(text, columns); // From Part 1

      if (!errors || errors.length === 0) return [];

      return errors.map(
        (err) =>
          ({
            from: err.start,
            to: err.end,
            severity: "error",
            message: err.message,
          } as Diagnostic)
      );
    },
    {
      delay: 300, // debounce 300ms
    }
  );
}
```

## Edge Cases & Error Handling

### Edge Cases

- **Empty value prop:** Editor shows placeholder
- **Null/undefined value prop:** Treated as empty string
- **Rapid value changes:** Debounced to avoid excessive updates
- **Value prop === editor text:** No update (avoid cursor jump)
- **Unmount during parse:** Parse cancelled, no memory leak
- **Multiple editors with same columns:** Each editor maintains independent state

### Error Handling

- **Parse errors during highlighting:** Gracefully degrade to no highlighting
- **Parse errors during validation:** Show errors, don't crash
- **Format errors:** Command does nothing, optionally show toast
- **CM6 initialization errors:** Log error, show fallback message

## Dependencies

### Internal Dependencies

- **Part 1:** Parser (`parseQuery`, types)
- **Part 2:** Formatter (`formatQuery`)

### External Libraries

- **CodeMirror 6:**
  - `@codemirror/state`: State management
  - `@codemirror/view`: Editor view and decorations
  - `@codemirror/language`: Syntax highlighting utilities
  - `@codemirror/lint`: Lint diagnostics
  - `@codemirror/commands`: Basic commands (undo, redo, etc.)
  - `codemirror`: Main package with `basicSetup`
- **React:** `^18.0.0` (peer dependency)

## Out of Scope

### Explicitly NOT Included in Part 3

- **Autocomplete:** Handled in Part 4
- **Positioned dropdowns:** Handled in Part 4
- **Submit handler (Cmd+Enter):** Will be added in Part 5
- **AI fallback banner:** Will be added in Part 5
- **Custom error rendering:** Will be added in Part 5
- **Query history:** Not in v1
- **Saved queries:** Not in v1

## Success Metrics

### Functionality

- **Target:** 100% of component features work as specified

### Performance

- **Target:** Syntax highlighting < 10ms for 1000 chars
- **Target:** Validation < 50ms after debounce
- **Target:** Format command < 50ms

### Correctness

- **Target:** 100% of syntax highlighting rules applied correctly
- **Target:** 100% of validation errors shown correctly

### Test Coverage

- **Target:** 90%+ line coverage for component and extensions

## Timeline

**Estimated Completion:** 1-2 weeks

### Tasks

1. **React Component Wrapper (2-3 days)**

   - Create QueryEditor component
   - Manage CM6 lifecycle (mount, update, unmount)
   - Implement controlled component behavior

2. **Syntax Highlighting Extension (2-3 days)**

   - Implement ANTLR lexer integration
   - Map token types to CM6 decoration classes
   - Define light and dark theme styles

3. **Validation Extension (1-2 days)**

   - Implement linter with debounced parsing
   - Map parse errors to CM6 diagnostics

4. **Formatting Extension (1 day)**

   - Implement format command keymap
   - Integrate with formatQuery() from Part 2

5. **Testing & Polish (2-3 days)**
   - Unit tests for component
   - Visual regression tests for themes
   - Performance benchmarks
   - Documentation

## Open Questions

1. **Should syntax highlighting run on main thread or in a worker?**
   → Decision: Main thread for v1 (acceptable for < 1000 chars). Worker is future enhancement.

2. **Should we show a loading indicator during validation?**
   → Decision: No, debounce is short enough (300ms) that it's not needed.

3. **Should cursor position be preserved after formatting?**
   → Decision: Move cursor to end after format (simpler implementation).

4. **Should we expose format command as a public method (ref API)?**
   → Decision: No, keyboard shortcut is sufficient for v1.

5. **Should we support custom themes (beyond light/dark)?**
   → Decision: No, fixed light/dark themes for v1. Custom themes are future enhancement.

---

## Test Plan

### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryEditor } from './QueryEditor';

describe('QueryEditor Component', () => {
  const columns: ColumnDef[] = [
    { id: 'status', type: 'string' },
    { id: 'price', type: 'number' },
  ];

  test('renders editor', () => {
    render(<QueryEditor columns={columns} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('shows placeholder', () => {
    render(<QueryEditor columns={columns} placeholder="Enter query..." />);
    expect(screen.getByText('Enter query...')).toBeInTheDocument();
  });

  test('controlled component behavior', () => {
    const { rerender } = render(<QueryEditor value="[status] equals \"open\"" columns={columns} />);
    expect(screen.getByRole('textbox')).toHaveValue('[status] equals "open"');

    rerender(<QueryEditor value="[price] > 100" columns={columns} />);
    expect(screen.getByRole('textbox')).toHaveValue('[price] > 100');
  });

  test('emits onChange on typing', () => {
    const handleChange = vi.fn();
    render(<QueryEditor columns={columns} onChange={handleChange} />);

    const editor = screen.getByRole('textbox');
    fireEvent.input(editor, { target: { value: '[status] equals "open"' } });

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        text: '[status] equals "open"',
        isValid: true,
      })
    );
  });

  test('read-only mode', () => {
    render(<QueryEditor columns={columns} readOnly />);
    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('contenteditable', 'false');
  });

  test('custom height', () => {
    render(<QueryEditor columns={columns} height={100} />);
    const editor = screen.getByRole('textbox').closest('.cm-editor');
    expect(editor).toHaveStyle({ height: '100px' });
  });

  test('light theme', () => {
    render(<QueryEditor columns={columns} theme="light" />);
    const editor = screen.getByRole('textbox').closest('.cm-editor');
    expect(editor).toHaveClass('cm-theme-light');
  });

  test('dark theme', () => {
    render(<QueryEditor columns={columns} theme="dark" />);
    const editor = screen.getByRole('textbox').closest('.cm-editor');
    expect(editor).toHaveClass('cm-theme-dark');
  });
});
```

### Extension Tests

```typescript
describe("Syntax Highlighting Extension", () => {
  test("highlights keywords", () => {
    const view = createEditorView('[status] equals "open" AND [price] > 100');
    const decorations = view.state.field(syntaxHighlightField);

    // Check that AND is highlighted as keyword
    const keywordDeco = Array.from(decorations).find(
      (d) => d.value.class === "cm-keyword"
    );
    expect(keywordDeco).toBeDefined();
  });

  test("highlights strings", () => {
    const view = createEditorView('[status] equals "open"');
    const decorations = view.state.field(syntaxHighlightField);

    const stringDeco = Array.from(decorations).find(
      (d) => d.value.class === "cm-string"
    );
    expect(stringDeco).toBeDefined();
  });
});

describe("Validation Extension", () => {
  test("shows error for unknown column", async () => {
    const view = createEditorView("[unknownCol] > 100");

    await waitFor(() => {
      const diagnostics = view.state.field(lintState);
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].message).toContain(
        "Column 'unknownCol' does not exist"
      );
    });
  });

  test("clears errors when query becomes valid", async () => {
    const view = createEditorView("[unknownCol] > 100");
    await waitFor(() => expect(view.state.field(lintState)).toHaveLength(1));

    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: '[status] equals "open"',
      },
    });

    await waitFor(() => {
      const diagnostics = view.state.field(lintState);
      expect(diagnostics).toHaveLength(0);
    });
  });
});

describe("Formatting Extension", () => {
  test("formats on Cmd+Shift+F", () => {
    const view = createEditorView("status equals open");

    // Simulate Cmd+Shift+F
    view.dispatch({
      effects: StateEffect.appendConfig.of(keymap.of([formatCommand(columns)])),
    });
    runCommand(view, "Mod-Shift-f");

    expect(view.state.doc.toString()).toBe('[status] equals "open"');
  });

  test("format is single undo operation", () => {
    const view = createEditorView("status equals open");
    runCommand(view, "Mod-Shift-f");

    // Undo should revert entire format
    undo(view);
    expect(view.state.doc.toString()).toBe("status equals open");
  });
});
```

## Appendix

### Example Usage (Complete)

```typescript
import React, { useState } from "react";
import {
  QueryEditor,
  QueryEditorChangeEvent,
  ColumnDef,
} from "@ivy-framework/query-editor";
import "@ivy-framework/query-editor/dist/styles.css";

const columns: ColumnDef[] = [
  { id: "status", type: "string" },
  { id: "price", type: "number" },
  { id: "active", type: "boolean" },
];

export function App() {
  const [query, setQuery] = useState("");
  const [isValid, setIsValid] = useState(true);

  const handleChange = (event: QueryEditorChangeEvent) => {
    setQuery(event.text);
    setIsValid(event.isValid);
  };

  return (
    <div>
      <h1>Filter Editor</h1>
      <QueryEditor
        value={query}
        columns={columns}
        onChange={handleChange}
        theme="light"
        height={60}
        placeholder='e.g. [status] equals "active"'
      />
      <p>Valid: {isValid ? "Yes" : "No"}</p>
    </div>
  );
}
```

### CSS Styles (styles.css)

```css
/* Base editor styles */
.cm-editor {
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-family: "Monaco", "Consolas", "Courier New", monospace;
  font-size: 14px;
}

.cm-editor.cm-focused {
  outline: none;
  border: 2px solid #007acc;
}

/* Light theme */
.cm-theme-light {
  background-color: #ffffff;
  color: #000000;
}

.cm-theme-light .cm-keyword {
  color: #0000ff;
  font-weight: bold;
}
.cm-theme-light .cm-operator {
  color: #000000;
}
.cm-theme-light .cm-variableName {
  color: #001080;
}
.cm-theme-light .cm-string {
  color: #a31515;
}
.cm-theme-light .cm-number {
  color: #098658;
}

/* Dark theme */
.cm-theme-dark {
  background-color: #1e1e1e;
  color: #d4d4d4;
  border-color: #3c3c3c;
}

.cm-theme-dark .cm-keyword {
  color: #569cd6;
  font-weight: bold;
}
.cm-theme-dark .cm-operator {
  color: #d4d4d4;
}
.cm-theme-dark .cm-variableName {
  color: #9cdcfe;
}
.cm-theme-dark .cm-string {
  color: #ce9178;
}
.cm-theme-dark .cm-number {
  color: #b5cea8;
}

/* Lint diagnostics */
.cm-diagnostic-error {
  text-decoration: underline wavy red;
}

.cm-tooltip-lint {
  background-color: #ffffff;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.cm-theme-dark .cm-tooltip-lint {
  background-color: #252526;
  border-color: #454545;
  color: #cccccc;
}
```
