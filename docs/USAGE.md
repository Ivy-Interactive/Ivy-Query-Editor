# Using Filter Query Editor in Your Project

## Installation

```bash
npm install filter-query-editor
```

## Basic Usage

```tsx
import React, { useState } from 'react';
import {
  QueryEditor,
  DataType,
  ColumnDef,
  QueryEditorChangeEvent
} from 'filter-query-editor';

// Import the CSS (required for styling)
import 'filter-query-editor/dist/style.css';

function MyComponent() {
  const [query, setQuery] = useState('');
  const [parsedFilter, setParsedFilter] = useState(null);

  // Define your columns
  const columns: ColumnDef[] = [
    { id: 'name', name: 'name', type: DataType.STRING },
    { id: 'age', name: 'age', type: DataType.NUMBER },
    { id: 'active', name: 'active', type: DataType.BOOLEAN },
    { id: 'created_at', name: 'created_at', type: DataType.DATE },
    {
      id: 'status',
      name: 'status',
      type: DataType.ENUM,
      enumValues: ['pending', 'active', 'completed']
    }
  ];

  const handleQueryChange = (event: QueryEditorChangeEvent) => {
    setQuery(event.text);

    if (event.isValid) {
      // Use the parsed filter object
      setParsedFilter(event.filters);
      console.log('Parsed filter:', event.filters);
    } else {
      // Handle validation errors
      console.error('Query errors:', event.errors);
    }
  };

  return (
    <QueryEditor
      value={query}
      columns={columns}
      onChange={handleQueryChange}
      theme="light" // or "dark"
      height={48}   // Height in pixels
      placeholder="Enter filter query..."
      className="my-custom-class" // Optional custom CSS class
    />
  );
}
```

## Using the Parsed Filter

The parsed filter object can be used with the evaluator functions:

```tsx
import { evaluateFilter } from 'filter-query-editor';

// Your data
const data = [
  { name: 'John', age: 30, active: true },
  { name: 'Jane', age: 25, active: false },
  { name: 'Bob', age: 35, active: true }
];

// Filter the data using the parsed filter
const filteredData = data.filter(row =>
  evaluateFilter(parsedFilter, row)
);
```

## API Reference

### QueryEditor Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | The query string |
| `columns` | `ColumnDef[]` | required | Column definitions |
| `onChange` | `(event: QueryEditorChangeEvent) => void` | - | Change handler |
| `theme` | `'light' \| 'dark'` | `'light'` | Editor theme |
| `height` | `number \| string` | `60` | Height of editor |
| `placeholder` | `string` | - | Placeholder text |
| `className` | `string` | `''` | Additional CSS class |
| `readOnly` | `boolean` | `false` | Read-only mode |
| `autoFocus` | `boolean` | `false` | Auto-focus on mount |

### QueryEditorChangeEvent

```typescript
interface QueryEditorChangeEvent {
  text: string;           // Current query text
  isValid: boolean;       // Whether query is valid
  filters?: FilterGroup;  // Parsed filter object (if valid)
  errors?: ParseError[];  // Validation errors (if any)
}
```

### Column Types

```typescript
enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ENUM = 'enum'
}

interface ColumnDef {
  id: string;
  name: string;
  type: DataType;
  displayName?: string;
  enumValues?: string[];  // Required for ENUM type
}
```

## Query Syntax

### Basic Operators
- Equality: `[column] = "value"`
- Inequality: `[column] != "value"`
- Comparison: `>`, `<`, `>=`, `<=`
- Text operators: `CONTAINS`, `STARTS WITH`, `ENDS WITH`
- Existence: `IS BLANK`, `IS NOT BLANK`

### Logical Operators
- `AND`: Both conditions must be true
- `OR`: Either condition must be true
- `NOT`: Negates the condition
- Parentheses for grouping: `([status] = "open" OR [status] = "pending") AND [priority] = "high"`

### Examples
```
[status] = "active"
[age] >= 18 AND [age] <= 65
[name] CONTAINS "John"
[email] ENDS WITH "@example.com"
NOT [status] = "closed"
[assignee] IS BLANK
([status] = "open" OR [status] = "pending") AND [priority] = "high"
```

## Styling

The component uses CSS modules and can be styled with:
- The `className` prop for custom styling
- CSS variables for theming
- The built-in light/dark themes

Make sure to import the CSS file in your application:
```tsx
import 'filter-query-editor/dist/style.css';
```