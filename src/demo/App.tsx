import React, { useState, useEffect, useRef } from "react";
import { QueryEditor } from "../components/QueryEditor";
import { parseQuery } from "../parser/QueryParser";
import { ColumnDef, DataType } from "../types/column";
import "./globals.css";

// Sample column definitions
const columns: ColumnDef[] = [
  { id: "age", name: "age", type: DataType.NUMBER },
  { id: "name", name: "name", type: DataType.STRING },
  { id: "email", name: "email", type: DataType.STRING },
  { id: "status", name: "status", type: DataType.STRING },
  { id: "priority", name: "priority", type: DataType.STRING },
  { id: "assignee", name: "assignee", type: DataType.STRING },
  { id: "created_at", name: "created_at", type: DataType.DATE },
  { id: "updated_at", name: "updated_at", type: DataType.DATE },
  { id: "count", name: "count", type: DataType.NUMBER },
  { id: "score", name: "score", type: DataType.NUMBER },
  { id: "price", name: "price", type: DataType.NUMBER },
  { id: "quantity", name: "quantity", type: DataType.NUMBER },
  { id: "active", name: "active", type: DataType.BOOLEAN },
  { id: "completed", name: "completed", type: DataType.BOOLEAN },
  { id: "verified", name: "verified", type: DataType.BOOLEAN },
  {
    id: "category",
    name: "category",
    type: DataType.ENUM,
    enumValues: ["bug", "feature", "improvement", "documentation"],
  },
  {
    id: "type",
    name: "type",
    type: DataType.ENUM,
    enumValues: ["personal", "business", "other"],
  },
];

function App() {
  const [query, setQuery] = useState<string>(
    '[status] = "open" AND [priority] = "high"'
  );
  const [errors, setErrors] = useState<any[]>([]);
  const [parsedFilter, setParsedFilter] = useState<any>(null);
  const queryEditorRef = useRef<HTMLDivElement>(null);

  const handleQueryChange = (event: any) => {
    setQuery(event.text);
    setErrors(event.errors || []);

    // Parse on every change if valid
    if (event.isValid && event.filters) {
      setParsedFilter(event.filters);
    } else if (!event.isValid) {
      setParsedFilter(null);
    }
  };

  // Parse initial query on mount
  useEffect(() => {
    const result = parseQuery(query, columns);
    if (result.filters && !result.errors?.length) {
      setParsedFilter(result.filters);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-4">
        {/* Query Editor */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Query Input
          </label>
          <QueryEditor
            value={query}
            columns={columns}
            onChange={handleQueryChange}
            theme="light"
            height={48}
            placeholder='Enter a filter query (e.g., [status] = "open")'
            className="font-mono rounded-lg border"
          />
        </div>

        {/* Error messages */}
        {errors.length > 0 && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <ul className="text-sm text-destructive space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Parsed Filter Output */}
        {parsedFilter && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Abstract Syntax Tree
            </label>
            <div className="rounded-lg border bg-muted/50 p-4">
              <pre className="text-xs font-mono overflow-x-auto">
                {JSON.stringify(parsedFilter, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
