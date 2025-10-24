/**
 * QueryEditor - Main React component for the filter query editor
 * Wraps CodeMirror 6 with custom extensions for syntax highlighting,
 * validation, and formatting.
 */

import React, { useEffect, useRef, useCallback, useState } from "react";
import { Filter } from "lucide-react";
import { QueryEditorProps, QueryEditorChangeEvent } from "./types";
import { useCodeMirror } from "./useCodeMirror";
import { parseQuery } from "../parser/QueryParser";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

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
 *   isCollapsed={false}
 *   onToggle={(collapsed) => setCollapsed(collapsed)}
 *   slideDirection="right"
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
  isCollapsed = false,
  onToggle,
  dropdownSide = "left",
  popoverTitle = "Filter Query",
  clearButtonText = "Clear",
  showPopoverTitle = true,
  buttonText = "Filters",
  showButtonText = false,
  editorClassName = "",
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
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [view, readOnly]
  );

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

  return (
    <Popover open={!isCollapsed} onOpenChange={(open) => onToggle?.(!open)}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={showButtonText ? "default" : "icon"}
          className={cn("shrink-0", showButtonText && "gap-2", className)}
          aria-label="Open filter editor"
        >
          <Filter className="h-4 w-4" />
          {showButtonText && <span>{buttonText}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side={dropdownSide}
        align="start"
        className="w-[600px] p-3"
        sideOffset={8}
      >
        {(showPopoverTitle || (value && value.length > 0)) && (
          <div className="flex items-center justify-between mb-2">
            {showPopoverTitle && (
              <span className="text-sm font-medium">{popoverTitle}</span>
            )}
            {value && value.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 text-xs ml-auto"
              >
                {clearButtonText}
              </Button>
            )}
          </div>
        )}
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
            "rounded-md border",
            "cm-editor-container", // For targeting CodeMirror styles
            editorClassName // Custom styles from user
          )}
          style={{
            height: typeof height === "number" ? `${height}px` : height,
          }}
          data-theme={theme}
          data-gramm="false"
          onClick={handleContainerClick}
          tabIndex={readOnly ? undefined : 0}
        />
      </PopoverContent>
    </Popover>
  );
};

// Default export for convenience
export default QueryEditor;
