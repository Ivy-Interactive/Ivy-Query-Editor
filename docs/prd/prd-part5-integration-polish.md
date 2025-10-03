# Part 5: Integration & Polish - Product Requirements Document

## Overview

Part 5 completes the query editor by adding final features: submit handler (Cmd+Enter), AI fallback banner (optional), package exports, comprehensive documentation, and integration with the Ivy Framework datatable. This part ensures the editor is production-ready and easy to consume.

**Key Features:**
- Submit handler (Cmd+Enter fires `onSubmit`)
- AI fallback banner (optional, for unparseable queries)
- Clean package exports (component + utilities)
- TypeScript definitions
- Integration example for Ivy Framework datatable
- Comprehensive documentation

## Goals

- **Primary Goal:** Finalize the query editor package with polish, documentation, and integration support for production use.
- Add submit handler to enable "apply filter" workflow.
- Provide optional AI fallback for users who prefer natural language.
- Export clean, well-documented APIs for consumers.
- Create integration examples for Ivy Framework datatable.
- Ensure package is npm-ready with proper build artifacts.

## User Stories

1. **As a** user, **I want to** press Cmd+Enter to apply my filter **so that** I can quickly submit without clicking a button.

2. **As a** user, **I want to** see an AI fallback option when my query fails to parse **so that** I can describe my filter in natural language.

3. **As a** developer, **I want to** install the package via npm and import it easily **so that** setup is quick.

4. **As a** developer, **I want to** see clear integration examples **so that** I know how to connect the editor to my datatable.

5. **As a** developer, **I want to** have TypeScript types for all exports **so that** I get autocomplete and type safety.

6. **As a** package maintainer, **I want to** comprehensive tests and CI/CD **so that** releases are reliable.

## Functional Requirements

### Requirement 1: Submit Handler (Cmd+Enter)
**Description:**
Add a keyboard shortcut (Cmd+Enter on Mac, Ctrl+Enter on Windows) that fires the `onSubmit` callback with the current FilterGroup if the query is valid. This enables a "press Enter to apply" workflow.

**Acceptance Criteria:**
- [ ] Cmd+Enter (Mac) and Ctrl+Enter (Windows) trigger submit
- [ ] `onSubmit` callback receives `FilterGroup` if query is valid
- [ ] If query is invalid, submit does nothing (no callback fired)
- [ ] Visual feedback: brief highlight or flash on submit (optional)
- [ ] Submit shortcut documented in placeholder (e.g., "Press Cmd+Enter to apply")
- [ ] Component prop: `onSubmit?: (filters: FilterGroup) => void`

**Priority:** High

### Requirement 2: AI Fallback Banner (Optional)
**Description:**
If `enableAIFallback` prop is `true` and the query fails to parse, show a non-blocking banner below the editor: "Could not parse query. Interpret with AI?". Clicking the button calls a consumer-provided AI service to interpret the query. A preview modal shows the proposed FilterGroup, and the user can apply or cancel.

**Acceptance Criteria:**
- [ ] Banner only shown if `enableAIFallback: true` and parse fails
- [ ] Banner is non-blocking (does not prevent editing)
- [ ] Banner shows message: "Could not parse query. Interpret with AI?"
- [ ] "Interpret" button calls consumer-provided `onAIInterpret` callback
- [ ] `onAIInterpret` receives query text, returns `Promise<FilterGroup>`
- [ ] Preview modal shows proposed FilterGroup in readable format
- [ ] User can "Apply" (fires `onSubmit` with FilterGroup) or "Cancel"
- [ ] If applied, editor text is NOT replaced (query stays as-is, but FilterGroup is used)
- [ ] Component props: `enableAIFallback?: boolean`, `onAIInterpret?: (query: string) => Promise<FilterGroup>`

**Priority:** Low

### Requirement 3: Package Exports
**Description:**
Export all necessary components and utilities with clean, well-documented APIs. Package should include TypeScript definitions and support both ESM and CJS.

**Acceptance Criteria:**
- [ ] Main exports: `QueryEditor`, `parseQuery`, `formatQuery`, `evaluateFilter`
- [ ] Type exports: `ColumnDef`, `FilterGroup`, `Filter`, `Condition`, `ParseError`, `QueryEditorProps`, `QueryEditorChangeEvent`
- [ ] Styles: `dist/styles.css`
- [ ] ESM build: `dist/index.js`
- [ ] CJS build: `dist/index.cjs`
- [ ] TypeScript definitions: `dist/index.d.ts`
- [ ] Source maps: `dist/index.js.map`
- [ ] Package.json exports field configured correctly

**Priority:** High

### Requirement 4: Integration Documentation
**Description:**
Provide comprehensive documentation with installation instructions, API reference, integration examples, and troubleshooting guide.

**Acceptance Criteria:**
- [ ] README.md with quick start, installation, and usage
- [ ] API.md with full API reference (all props, methods, types)
- [ ] INTEGRATION.md with Ivy Framework datatable example
- [ ] CHANGELOG.md with version history
- [ ] Examples directory with runnable demos
- [ ] JSDoc comments on all public APIs
- [ ] TypeDoc-generated API docs (optional)

**Priority:** High

### Requirement 5: Ivy Framework Integration
**Description:**
Create integration code and examples for using the query editor with Ivy Framework datatable (Table.tsx, TableOptions.tsx). This includes wiring the editor to filter state and using `evaluateFilter()` to filter rows.

**Acceptance Criteria:**
- [ ] Example: Add `QueryEditor` to Table.tsx toolbar
- [ ] Example: Wire `onChange` to update filter state
- [ ] Example: Use `evaluateFilter()` to filter rows in `useMemo`
- [ ] Example: Add "Clear Filter" button
- [ ] Example: Persist filter query in table state
- [ ] Example: Show filter indicator (e.g., "Filtered: 150 / 1000 rows")
- [ ] Integration guide in docs/INTEGRATION.md

**Priority:** High

### Requirement 6: Build & Package Configuration
**Description:**
Configure build tooling (Vite, Rollup, or similar) to produce optimized bundles for ESM and CJS. Ensure package.json is configured correctly for npm publishing.

**Acceptance Criteria:**
- [ ] Build script: `npm run build` produces `dist/` artifacts
- [ ] ANTLR grammar compilation integrated into build
- [ ] TypeScript compilation with declaration files
- [ ] Bundle size optimized (< 100KB gzipped)
- [ ] Tree-shakeable exports (ESM)
- [ ] Package.json fields: `main`, `module`, `types`, `exports`, `files`
- [ ] Peer dependencies: `react`, `react-dom`
- [ ] Dependencies: `@codemirror/*`, `antlr4ts`

**Priority:** High

### Requirement 7: Testing & CI/CD
**Description:**
Ensure comprehensive test coverage and set up CI/CD pipeline for automated testing, linting, and publishing.

**Acceptance Criteria:**
- [ ] Unit tests: 90%+ coverage
- [ ] Integration tests: Full editor workflow tested
- [ ] E2E tests: Visual regression tests (optional)
- [ ] CI/CD: GitHub Actions or similar
- [ ] CI runs tests on PR
- [ ] CI checks linting (ESLint, Prettier)
- [ ] CI checks TypeScript compilation
- [ ] CI publishes to npm on tag push (optional)

**Priority:** Medium

## Technical Requirements

### Performance
- **Package size:** < 100KB gzipped (total)
- **Initial render:** < 100ms
- **Submit handler:** < 10ms to fire callback

### Security
- **No secrets in package:** No API keys or credentials
- **Safe defaults:** AI fallback disabled by default

### Scalability
- **Multiple instances:** Support 5+ editors on same page

### Browser Support
- Chrome, Firefox, Safari, Edge (latest 2 versions)

## User Interface

### Submit Feedback (Optional)
- **Flash animation:** Brief green border flash on submit
- **Duration:** 300ms
- **Color:** Green (#28a745)

### AI Fallback Banner
- **Position:** Below editor
- **Background:** Light yellow (#fff9e6) for info
- **Border:** 1px solid #f0e68c
- **Padding:** 8px 12px
- **Text:** "Could not parse query. Interpret with AI?"
- **Button:** Blue button "Interpret" (primary action)
- **Dismiss:** Small X button in top-right corner

### AI Preview Modal
- **Overlay:** Semi-transparent black (#00000080)
- **Modal:** White card, centered, 500px width
- **Title:** "AI Interpretation"
- **Content:** Formatted FilterGroup (JSON or human-readable)
- **Actions:** "Apply" (blue button) and "Cancel" (gray button)

## API Specifications

### Component Props (Complete)
```typescript
export interface QueryEditorProps {
  /** Current query text (controlled) */
  value?: string;

  /** Column catalog for validation and autocomplete */
  columns: ColumnDef[];

  /** Fires on every change with validation state */
  onChange?: (event: QueryEditorChangeEvent) => void;

  /** Fires on explicit submit (Cmd/Ctrl+Enter) */
  onSubmit?: (filters: FilterGroup) => void;

  /** Enable AI fallback banner for unparseable queries */
  enableAIFallback?: boolean; // default: false

  /** AI interpretation handler (required if enableAIFallback is true) */
  onAIInterpret?: (query: string) => Promise<FilterGroup>;

  /** Editor theme */
  theme?: "light" | "dark"; // default: "light"

  /** Read-only mode */
  readOnly?: boolean; // default: false

  /** Editor height */
  height?: number | string; // default: 60

  /** Placeholder text when empty */
  placeholder?: string;

  /** Custom error renderer (advanced) */
  renderError?: (error: ParseError) => React.ReactNode;
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

### Package Exports
```typescript
// Main component
export { QueryEditor } from './components/QueryEditor';
export type { QueryEditorProps, QueryEditorChangeEvent } from './components/QueryEditor';

// Utility functions
export { parseQuery } from './parser/parseQuery';
export { formatQuery } from './formatter/formatQuery';
export { evaluateFilter } from './evaluator/evaluateFilter';

// Types
export type { ColumnDef, ColumnType } from './types/column';
export type { FilterGroup, Filter, Condition } from './types/filter';
export type { ParseError, ParseResult, FormatResult } from './types/parser';
```

### Package.json
```json
{
  "name": "@ivy-framework/query-editor",
  "version": "1.0.0",
  "description": "CodeMirror-based query editor for table filters",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./styles.css": "./dist/styles.css"
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "npm run build:grammar && npm run build:lib",
    "build:grammar": "antlr4ts -visitor src/grammar/FilterQuery.g4",
    "build:lib": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "dependencies": {
    "@codemirror/state": "^6.0.0",
    "@codemirror/view": "^6.0.0",
    "@codemirror/language": "^6.0.0",
    "@codemirror/autocomplete": "^6.0.0",
    "@codemirror/lint": "^6.0.0",
    "@codemirror/commands": "^6.0.0",
    "codemirror": "^6.0.0",
    "antlr4ts": "^0.5.0-alpha.4"
  },
  "devDependencies": {
    "antlr4ts-cli": "^0.5.0-alpha.4",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

## Data Model

### AI Interpretation Flow
```typescript
// 1. User types unparseable query
const query = "show me open tickets with price over 100";

// 2. Editor detects parse failure, shows banner
<AIFallbackBanner query={query} onInterpret={handleAIInterpret} />

// 3. User clicks "Interpret"
async function handleAIInterpret(query: string): Promise<FilterGroup> {
  const response = await fetch('/api/interpret', {
    method: 'POST',
    body: JSON.stringify({ query, columns }),
  });
  const { filters } = await response.json();
  return filters;
}

// 4. Preview modal shows proposed FilterGroup
<AIPreviewModal filters={filters} onApply={handleApply} onCancel={handleCancel} />

// 5. User clicks "Apply"
function handleApply(filters: FilterGroup) {
  onSubmit(filters); // Fire submit with AI-generated FilterGroup
}
```

## Edge Cases & Error Handling

### Edge Cases
- **Submit with invalid query:** Does nothing (no callback fired)
- **Submit with valid query:** Fires `onSubmit` with FilterGroup
- **AI fallback when disabled:** Banner not shown
- **AI service fails:** Show error toast, don't crash
- **AI service returns invalid FilterGroup:** Show error, don't apply
- **User edits while AI is loading:** Cancel AI request

### Error Handling
- **Submit handler:** Catch errors, log to console
- **AI service errors:** Show user-friendly error message
- **Package import errors:** Provide clear error messages

## Dependencies

### Internal Dependencies
- **Parts 1-4:** All previous parts integrated

### External Libraries
- **React:** ^18.0.0 (peer dependency)
- **CodeMirror 6:** (from Part 3)

## Out of Scope

### Explicitly NOT Included
- **AI service implementation:** Consumer provides AI endpoint
- **Query history UI:** Not in v1
- **Saved queries UI:** Not in v1
- **Export to SQL:** Not in v1
- **Multi-user collaboration:** Not in v1

## Success Metrics

### Functionality
- **Target:** 100% of features work as specified

### Integration Success
- **Target:** Ivy Framework datatable integration working in < 1 hour

### Documentation Quality
- **Target:** 90%+ of developers can integrate without support

### Package Quality
- **Target:** No critical issues reported in first month

## Timeline

**Estimated Completion:** 1 week

### Tasks
1. **Submit Handler (1 day)**
   - Implement Cmd+Enter keymap
   - Add visual feedback (optional)

2. **AI Fallback (2 days)**
   - Implement banner component
   - Implement preview modal
   - Test AI flow

3. **Package Configuration (1 day)**
   - Configure build tooling
   - Set up package.json
   - Test ESM/CJS exports

4. **Documentation (2 days)**
   - Write README, API docs, integration guide
   - Create examples
   - Add JSDoc comments

5. **Integration & Testing (1 day)**
   - Create Ivy Framework example
   - E2E testing
   - Final polish

## Open Questions

1. **Should submit handler show visual feedback (flash animation)?**
   → Decision: Optional for v1. Can add later based on user feedback.

2. **Should AI fallback be enabled by default?**
   → Decision: No, disabled by default (requires consumer-provided service).

3. **Should we provide a default AI service implementation?**
   → Decision: No, consumer provides endpoint. We may provide example in docs.

4. **Should we support multiple AI providers (OpenAI, Anthropic, etc.)?**
   → Decision: No, consumer abstracts AI service. Package is AI-agnostic.

5. **Should we publish to npm under `@ivy-framework` or a different scope?**
   → Decision: `@ivy-framework/query-editor` (matches project namespace).

---

## Test Plan

### Submit Handler Tests
```typescript
describe('Submit Handler', () => {
  test('fires onSubmit with valid query', () => {
    const handleSubmit = vi.fn();
    const { container } = render(
      <QueryEditor
        value='[status] equals "open"'
        columns={columns}
        onSubmit={handleSubmit}
      />
    );

    // Simulate Cmd+Enter
    const editor = container.querySelector('.cm-editor');
    fireEvent.keyDown(editor, { key: 'Enter', metaKey: true });

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        op: 'AND',
        filters: expect.any(Array),
      })
    );
  });

  test('does not fire onSubmit with invalid query', () => {
    const handleSubmit = vi.fn();
    const { container } = render(
      <QueryEditor
        value="[unknownCol] > 1"
        columns={columns}
        onSubmit={handleSubmit}
      />
    );

    const editor = container.querySelector('.cm-editor');
    fireEvent.keyDown(editor, { key: 'Enter', metaKey: true });

    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
```

### AI Fallback Tests
```typescript
describe('AI Fallback', () => {
  test('shows banner when parse fails', () => {
    render(
      <QueryEditor
        value="invalid query"
        columns={columns}
        enableAIFallback
        onAIInterpret={mockAIService}
      />
    );

    expect(screen.getByText(/Could not parse query/i)).toBeInTheDocument();
    expect(screen.getByText(/Interpret with AI/i)).toBeInTheDocument();
  });

  test('does not show banner when enableAIFallback is false', () => {
    render(
      <QueryEditor
        value="invalid query"
        columns={columns}
        enableAIFallback={false}
      />
    );

    expect(screen.queryByText(/Interpret with AI/i)).not.toBeInTheDocument();
  });

  test('calls onAIInterpret when button clicked', async () => {
    const mockAI = vi.fn().mockResolvedValue({
      op: 'AND',
      filters: [],
    });

    render(
      <QueryEditor
        value="invalid query"
        columns={columns}
        enableAIFallback
        onAIInterpret={mockAI}
      />
    );

    fireEvent.click(screen.getByText(/Interpret with AI/i));

    await waitFor(() => {
      expect(mockAI).toHaveBeenCalledWith('invalid query');
    });
  });

  test('shows preview modal after AI interprets', async () => {
    const mockAI = vi.fn().mockResolvedValue({
      op: 'AND',
      filters: [
        { condition: { column: 'status', function: 'equals', args: ['open'] } }
      ],
    });

    render(
      <QueryEditor
        value="show open items"
        columns={columns}
        enableAIFallback
        onAIInterpret={mockAI}
      />
    );

    fireEvent.click(screen.getByText(/Interpret with AI/i));

    await waitFor(() => {
      expect(screen.getByText(/AI Interpretation/i)).toBeInTheDocument();
      expect(screen.getByText(/Apply/i)).toBeInTheDocument();
      expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
    });
  });

  test('applies AI-generated filter on apply', async () => {
    const mockAI = vi.fn().mockResolvedValue({
      op: 'AND',
      filters: [
        { condition: { column: 'status', function: 'equals', args: ['open'] } }
      ],
    });
    const handleSubmit = vi.fn();

    render(
      <QueryEditor
        value="show open items"
        columns={columns}
        enableAIFallback
        onAIInterpret={mockAI}
        onSubmit={handleSubmit}
      />
    );

    fireEvent.click(screen.getByText(/Interpret with AI/i));

    await waitFor(() => screen.getByText(/Apply/i));
    fireEvent.click(screen.getByText(/Apply/i));

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        op: 'AND',
        filters: expect.any(Array),
      })
    );
  });
});
```

### Package Export Tests
```typescript
describe('Package Exports', () => {
  test('exports QueryEditor component', () => {
    expect(QueryEditor).toBeDefined();
    expect(typeof QueryEditor).toBe('function');
  });

  test('exports parseQuery utility', () => {
    expect(parseQuery).toBeDefined();
    expect(typeof parseQuery).toBe('function');
  });

  test('exports formatQuery utility', () => {
    expect(formatQuery).toBeDefined();
    expect(typeof formatQuery).toBe('function');
  });

  test('exports evaluateFilter utility', () => {
    expect(evaluateFilter).toBeDefined();
    expect(typeof evaluateFilter).toBe('function');
  });

  test('exports types', () => {
    // TypeScript compilation test
    const column: ColumnDef = { id: 'test', type: 'string' };
    const filter: FilterGroup = { op: 'AND', filters: [] };
    expect(column).toBeDefined();
    expect(filter).toBeDefined();
  });
});
```

## Appendix

### Integration Example (Complete)
```typescript
// Table.tsx
import React, { useState, useMemo } from 'react';
import { QueryEditor, FilterGroup, evaluateFilter, ColumnDef } from '@ivy-framework/query-editor';
import '@ivy-framework/query-editor/dist/styles.css';
import { DataGrid } from '@glideapps/glide-data-grid';

interface TableProps {
  rows: Record<string, unknown>[];
  columns: ColumnDef[];
}

export function Table({ rows, columns }: TableProps) {
  const [filterQuery, setFilterQuery] = useState<FilterGroup | undefined>();
  const [queryText, setQueryText] = useState('');

  const handleQueryChange = (event: QueryEditorChangeEvent) => {
    setQueryText(event.text);
    if (event.isValid && event.filters) {
      setFilterQuery(event.filters);
    } else {
      setFilterQuery(undefined); // Clear filter if invalid
    }
  };

  const handleSubmit = (filters: FilterGroup) => {
    console.log('Filter applied:', filters);
    setFilterQuery(filters);
  };

  const handleClearFilter = () => {
    setQueryText('');
    setFilterQuery(undefined);
  };

  const filteredRows = useMemo(() => {
    if (!filterQuery) return rows;
    return rows.filter(row => evaluateFilter(filterQuery, row, columns));
  }, [rows, filterQuery, columns]);

  return (
    <div className="table-container">
      <div className="table-toolbar">
        <QueryEditor
          value={queryText}
          columns={columns}
          onChange={handleQueryChange}
          onSubmit={handleSubmit}
          theme="light"
          height={60}
          placeholder='e.g. [status] equals "active" (Press Cmd+Enter to apply)'
        />
        {filterQuery && (
          <button onClick={handleClearFilter} className="clear-filter-btn">
            Clear Filter
          </button>
        )}
      </div>

      {filterQuery && (
        <div className="filter-indicator">
          Showing {filteredRows.length} of {rows.length} rows
        </div>
      )}

      <DataGrid
        data={filteredRows}
        columns={columns}
        // ... other DataGrid props
      />
    </div>
  );
}
```

### README.md (Template)
````markdown
# @ivy-framework/query-editor

A CodeMirror 6-based query editor for building table filters with ANTLR4-powered syntax highlighting, validation, and formatting.

## Features

- 🎨 Syntax highlighting (light/dark themes)
- ✅ Real-time validation with error messages
- 🔧 Idempotent formatting (Cmd+Shift+F)
- 💡 Context-aware autocomplete
- 🎯 Positioned dropdowns
- ⚡ Fast row evaluation (<1ms per row)
- 📦 Tree-shakeable ESM/CJS builds
- 🔒 Type-safe TypeScript APIs

## Installation

```bash
npm install @ivy-framework/query-editor
```

## Quick Start

```tsx
import { QueryEditor } from '@ivy-framework/query-editor';
import '@ivy-framework/query-editor/dist/styles.css';

const columns = [
  { id: 'status', type: 'string' },
  { id: 'price', type: 'number' },
];

function MyComponent() {
  const [query, setQuery] = useState('');

  return (
    <QueryEditor
      value={query}
      columns={columns}
      onChange={(e) => setQuery(e.text)}
      theme="light"
      placeholder='e.g. [status] equals "active"'
    />
  );
}
```

## Documentation

- [API Reference](./docs/API.md)
- [Integration Guide](./docs/INTEGRATION.md)
- [Examples](./examples/)

## License

MIT
````

### AI Fallback Banner Component
```typescript
import React, { useState } from 'react';
import { FilterGroup } from '../types';

interface AIFallbackBannerProps {
  query: string;
  onInterpret: (query: string) => Promise<FilterGroup>;
  onApply: (filters: FilterGroup) => void;
}

export function AIFallbackBanner({ query, onInterpret, onApply }: AIFallbackBannerProps) {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [filters, setFilters] = useState<FilterGroup | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInterpret = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await onInterpret(query);
      setFilters(result);
      setShowPreview(true);
    } catch (err) {
      setError('Failed to interpret query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (filters) {
      onApply(filters);
      setShowPreview(false);
    }
  };

  return (
    <>
      <div className="ai-fallback-banner">
        <span>Could not parse query. Interpret with AI?</span>
        <button onClick={handleInterpret} disabled={loading}>
          {loading ? 'Interpreting...' : 'Interpret'}
        </button>
        {error && <span className="error">{error}</span>}
      </div>

      {showPreview && filters && (
        <AIPreviewModal
          filters={filters}
          onApply={handleApply}
          onCancel={() => setShowPreview(false)}
        />
      )}
    </>
  );
}

interface AIPreviewModalProps {
  filters: FilterGroup;
  onApply: () => void;
  onCancel: () => void;
}

function AIPreviewModal({ filters, onApply, onCancel }: AIPreviewModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>AI Interpretation</h3>
        <pre>{JSON.stringify(filters, null, 2)}</pre>
        <div className="modal-actions">
          <button onClick={onApply} className="btn-primary">Apply</button>
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}
```

### CSS for AI Components
```css
/* AI Fallback Banner */
.ai-fallback-banner {
  background-color: #fff9e6;
  border: 1px solid #f0e68c;
  border-radius: 4px;
  padding: 8px 12px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-fallback-banner button {
  background-color: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
}

.ai-fallback-banner button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-fallback-banner .error {
  color: #d32f2f;
  font-size: 0.9em;
}

/* AI Preview Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin-top: 0;
}

.modal-content pre {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 400px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}

.btn-primary {
  background-color: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
}

.btn-secondary {
  background-color: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
}
```
