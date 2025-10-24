# Filter Query Editor

> Build Excel/Airtable-style filter queries with a React editor component.

[![npm version](https://img.shields.io/npm/v/filter-query-editor.svg)](https://www.npmjs.com/package/filter-query-editor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install filter-query-editor
```

## Quick Start

```tsx
import { QueryEditor } from 'filter-query-editor';
import 'filter-query-editor/style.css';

function App() {
  const [query, setQuery] = useState('');

  const columns = [
    { name: 'status', type: 'string' },
    { name: 'price', type: 'number' },
  ];

  return (
    <QueryEditor
      value={query}
      columns={columns}
      onChange={(e) => setQuery(e.text)}
      placeholder="Enter filter query..."
    />
  );
}
```

## Example Queries

```
[price] > 100
[status] = "open" AND [price] < 1000
[name] contains "test" OR [email] ends with "@example.com"
```

## Features

- ✨ React component with syntax highlighting
- 🔍 Real-time validation
- 📝 Auto-complete and formatting
- ⚡ Parser, formatter, and evaluator APIs

## Documentation

Full documentation available at [github.com/Ivy-Interactive/Ivy-Query-Editor](https://github.com/Ivy-Interactive/Ivy-Query-Editor)

## License

MIT © Ivy Interactive AB
