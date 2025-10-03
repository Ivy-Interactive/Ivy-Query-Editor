/**
 * QueryEditor - Main React component for the filter query editor
 * Wraps CodeMirror 6 with custom extensions for syntax highlighting,
 * validation, and formatting.
 */

import React, { useEffect, useRef, useCallback, useState } from "react";
import { QueryEditorProps, QueryEditorChangeEvent } from "./types";
import { useCodeMirror } from "./useCodeMirror";
import { parseQuery } from "../parser/QueryParser";
import { cn } from "../lib/utils";

/**
 * QueryEditor component - A CodeMirror-based editor for filter queries
 *
 * @example
 * ```tsx
 * <QueryEditor
 *   value={query}
 *   columns={columns}
 *   onChange={(event) => console.log(event.text, event.isValid)}
 *   theme="light"
 *   height={80}
 *   placeholder="Enter a filter query..."
 * />
 * ```
 */
export const QueryEditor: React.FC<QueryEditorProps> = ({
  value = "",
  columns,
  onChange,
  theme = "light",
  readOnly = false,
  height = 60,
  placeholder,
  className = "",
  autoFocus = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  // Update container when ref is set
  useEffect(() => {
    if (containerRef.current) {
      setContainer(containerRef.current);
    }
  }, []);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Handle change events from CodeMirror
  const handleChange = useCallback(
    (text: string) => {
      if (!onChangeRef.current) return;

      // Parse the query to get validation state
      const parseResult = parseQuery(text, columns);

      const event: QueryEditorChangeEvent = {
        text,
        isValid: !parseResult.errors || parseResult.errors.length === 0,
        filters: parseResult.filters,
        errors: parseResult.errors,
      };

      onChangeRef.current(event);
    },
    [columns]
  );

  // Initialize CodeMirror
  const { view, containerEl } = useCodeMirror({
    container: container,
    value,
    columns,
    onChange: handleChange,
    theme,
    readOnly,
    placeholder,
    autoFocus,
  });

  // Update value when prop changes
  useEffect(() => {
    if (view && view.state.doc.toString() !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
      });
    }
  }, [value, view]);

  // Handle container click to focus editor
  const handleContainerClick = useCallback(() => {
    if (view && !readOnly) {
      view.focus();
    }
  }, [view, readOnly]);

  // Compute height style
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      ref={(el) => {
        if (containerRef.current !== el) {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }
        if (el) {
          setContainer(el);
        }
      }}
      className={cn(
        "rounded-lg border bg-background text-foreground",
        "transition-all duration-200 cursor-text",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        "cm-editor-container", // For targeting CodeMirror styles
        className
      )}
      style={{ height: heightStyle }}
      data-theme={theme}
      onClick={handleContainerClick}
      tabIndex={readOnly ? undefined : 0}
    />
  );
};

// Default export for convenience
export default QueryEditor;
