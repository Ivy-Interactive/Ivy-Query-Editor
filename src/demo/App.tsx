import React, { useState, useEffect, useRef } from "react";
import { QueryEditor } from "../components/QueryEditor";
import { parseQuery } from "../parser/QueryParser";
import { ColumnDef, DataType } from "../types/column";
import "./globals.css";

// Sample column definitions
const columns: ColumnDef[] = [
  { name: "age", type: DataType.NUMBER, width: 100 },
  { name: "name", type: DataType.STRING, width: 150 },
  { name: "email", type: DataType.STRING, width: 200 },
  { name: "status", type: DataType.STRING, width: 100 },
  { name: "priority", type: DataType.STRING, width: 100 },
  { name: "assignee", type: DataType.STRING, width: 150 },
  { name: "created_at", type: DataType.DATE, width: 120 },
  { name: "updated_at", type: DataType.DATE, width: 120 },
  { name: "count", type: DataType.NUMBER, width: 80 },
  { name: "score", type: DataType.NUMBER, width: 80 },
  { name: "price", type: DataType.NUMBER, width: 100 },
  { name: "quantity", type: DataType.NUMBER, width: 80 },
  { name: "active", type: DataType.BOOLEAN, width: 80 },
  { name: "completed", type: DataType.BOOLEAN, width: 100 },
  { name: "verified", type: DataType.BOOLEAN, width: 100 },
  { name: "category", type: DataType.ENUM, width: 120 },
  { name: "type", type: DataType.ENUM, width: 100 },
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
