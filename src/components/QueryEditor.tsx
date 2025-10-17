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

  // Handle container click to focus editor
  const handleContainerClick = useCallback(() => {
    if (view && !readOnly) {
      view.focus();
    }
  }, [view, readOnly]);

  // Handle clear button click
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering container click
    if (view && !readOnly) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: "",
        },
      });
      view.focus();
    }
  }, [view, readOnly]);

  // Update value when prop changes
  // NOTE: This is handled in useCodeMirror hook, but keeping for backward compatibility
  useEffect(() => {
    if (view && view.state.doc.toString() !== value) {
      // Save current cursor position
      const cursorPos = view.state.selection.main.head;
      const oldLength = view.state.doc.length;
      const newLength = value.length;

      // Calculate new cursor position (proportional mapping as fallback)
      let newCursorPos = cursorPos;
      if (cursorPos === oldLength) {
        newCursorPos = newLength;
      } else if (oldLength > 0) {
        const ratio = cursorPos / oldLength;
        newCursorPos = Math.floor(ratio * newLength);
      }

      // Ensure cursor is within bounds
      newCursorPos = Math.max(0, Math.min(newCursorPos, newLength));

      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
        selection: { anchor: newCursorPos, head: newCursorPos },
      });
    }
  }, [value, view]);

  // Insert clear button into CodeMirror scroller
  useEffect(() => {
    if (!containerRef.current || readOnly) return;

    // Find the .cm-scroller element
    const cmScroller = containerRef.current.querySelector('.cm-scroller');
    if (!cmScroller) return;

    // Check if button already exists
    let clearBtn = cmScroller.querySelector('.clear-button') as HTMLButtonElement;

    if (value && value.length > 0) {
      if (!clearBtn) {
        // Create button
        clearBtn = document.createElement('button');
        clearBtn.className = 'clear-button';
        clearBtn.setAttribute('aria-label', 'Clear query');
        clearBtn.setAttribute('type', 'button');
        clearBtn.style.cssText = 'position: absolute; right: 12px; top: 0; bottom: 0; margin: auto; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; padding: 4px; background: transparent; border: none; border-radius: 4px; color: #64748b; cursor: pointer; z-index: 10; pointer-events: auto;';
        clearBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; width: 20px; height: 20px; flex-shrink: 0;"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';
        clearBtn.onclick = (e) => {
          e.stopPropagation();
          handleClear(e as any);
        };
        cmScroller.appendChild(clearBtn);
      }
    } else if (clearBtn) {
      // Remove button when value is empty
      clearBtn.remove();
    }
  }, [value, readOnly, handleClear, view]);

  // Compute height style
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      ref={(el) => {
        // Use type assertion to handle ref callback
        (
          containerRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = el;
        if (el) {
          setContainer(el);
        }
      }}
      className={cn(
        "rounded-lg border bg-background text-foreground relative",
        "transition-all duration-200 cursor-text",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        "cm-editor-container", // For targeting CodeMirror styles
        className
      )}
      style={{ height: heightStyle }}
      data-theme={theme}
      data-gramm="false"
      onClick={handleContainerClick}
      tabIndex={readOnly ? undefined : 0}
    />
  );
};

// Default export for convenience
export default QueryEditor;
