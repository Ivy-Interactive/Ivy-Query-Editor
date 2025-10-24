/**
 * QueryEditor - Main React component for the filter query editor
 * Wraps CodeMirror 6 with custom extensions for syntax highlighting,
 * validation, and formatting.
 */

import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  Filter,
  CircleHelp,
  Sparkles,
  SpellCheck,
  SpellCheck2,
} from "lucide-react";
import { QueryEditorProps, QueryEditorChangeEvent } from "./types";
import { useCodeMirror } from "./useCodeMirror";
import { parseQuery } from "../parser/QueryParser";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

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
  isCollapsed = true,
  onToggle,
  dropdownSide = "right",
  popoverTitle = "Filter Query",
  clearButtonText = "Clear filter",
  showPopoverTitle = true,
  buttonText = "Filters",
  showButtonText = false,
  editorClassName = "",
  queries = [],
  onQuerySelect,
  statusState = "waiting",
  statusTooltip,
  applyButtonText = "Apply filter",
  onApply,
  allowLLMFiltering = true,
  onLLMFilteringChange,
  aiIconColor = "rgb(139, 92, 246)",
  aiToggleLabel = "AI",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [llmFilteringEnabled, setLlmFilteringEnabled] =
    useState<boolean>(allowLLMFiltering);

  // Sync with prop changes
  useEffect(() => {
    setLlmFilteringEnabled(allowLLMFiltering);
  }, [allowLLMFiltering]);

  // Handle toggle change
  const handleToggleLLMFiltering = useCallback(() => {
    const newValue = !llmFilteringEnabled;
    setLlmFilteringEnabled(newValue);
    onLLMFilteringChange?.(newValue);
  }, [llmFilteringEnabled, onLLMFilteringChange]);

  // Get status icon and tooltip based on state
  const getStatusConfig = () => {
    const iconClass = "h-5 w-5";
    switch (statusState) {
      case "ai":
        return {
          icon: (
            <Sparkles className={iconClass} style={{ color: aiIconColor }} />
          ),
          tooltip: statusTooltip || "AI-assisted query",
        };
      case "query":
        return {
          icon: <SpellCheck className={iconClass} />,
          tooltip: statusTooltip || "Query validated",
        };
      case "error":
        return {
          icon: <SpellCheck2 className={cn(iconClass, "text-destructive")} />,
          tooltip: statusTooltip || "Invalid query",
        };
      case "waiting":
      default:
        return {
          icon: <CircleHelp className={iconClass} />,
          tooltip: statusTooltip || "Waiting for input",
        };
    }
  };

  const statusConfig = getStatusConfig();

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
  const { view } = useCodeMirror({
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

  // Handle query selection from list
  const handleQueryClick = useCallback(
    (query: string) => {
      if (onQuerySelect) {
        onQuerySelect(query);
      }
    },
    [onQuerySelect]
  );

  // Update value when prop changes
  // NOTE: This is handled in useCodeMirror hook, but keeping for backward compatibility
  // useEffect(() => {
  //   if (view && view.state.doc.toString() !== value) {
  //     // Save current cursor position
  //     const cursorPos = view.state.selection.main.head;
  //     const oldLength = view.state.doc.length;
  //     const newLength = value.length;

  //     // Calculate new cursor position (proportional mapping as fallback)
  //     let newCursorPos = cursorPos;
  //     if (cursorPos === oldLength) {
  //       newCursorPos = newLength;
  //     } else if (oldLength > 0) {
  //       const ratio = cursorPos / oldLength;
  //       newCursorPos = Math.floor(ratio * newLength);
  //     }

  //     // Ensure cursor is within bounds
  //     newCursorPos = Math.max(0, Math.min(newCursorPos, newLength));

  //     view.dispatch({
  //       changes: {
  //         from: 0,
  //         to: view.state.doc.length,
  //         insert: value,
  //       },
  //       selection: { anchor: newCursorPos, head: newCursorPos },
  //     });
  //   }
  // }, [value, view]);

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
        className="w-[600px] p-4"
        sideOffset={8}
      >
        <div className="flex flex-col gap-2 justify-content-start">
          <div className="flex items-center justify-between min-h-[28px]">
            {showPopoverTitle && (
              <span className="text-sm font-medium">{popoverTitle}</span>
            )}

            {/* AI Filtering Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {aiToggleLabel}
              </span>
              <button
                onClick={handleToggleLLMFiltering}
                className={cn(
                  "relative inline-flex h-4 w-8 items-center rounded-full transition-colors",
                  llmFilteringEnabled ? "bg-primary" : "bg-muted",
                  llmFilteringEnabled && "ai-toggle-glow"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-3 w-3 transform rounded-full bg-background transition-transform shadow-sm",
                    llmFilteringEnabled ? "translate-x-4" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex-1",
                statusState === "ai" && "ai-animated-border"
              )}
            >
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
                  "rounded-md border flex-1",
                  "cm-editor-container", // For targeting CodeMirror styles
                  statusState === "ai" && "ai-animated-border-inner",
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
            </div>

            {/* Status Icon */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    {statusConfig.icon}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{statusConfig.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Action Buttons */}
          {value && value.length > 0 && (
            <div className="flex gap-2 self-start">
              {onApply && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onApply}
                  className="h-7 text-xs"
                >
                  {applyButtonText}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 text-xs text-muted-foreground"
              >
                {clearButtonText}
              </Button>
            </div>
          )}
        </div>

        {/* Queries List */}
        {queries && queries.length > 0 && (
          <div className="mt-3 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Recent Queries
            </span>
            <div className="space-y-1">
              {queries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleQueryClick(query)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-xs rounded-md",
                    "bg-muted/50 hover:bg-muted",
                    "transition-colors duration-150",
                    "truncate cursor-pointer",
                    "border border-transparent hover:border-border",
                    "font-mono text-muted-foreground"
                  )}
                  title={query}
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

// Default export for convenience
export default QueryEditor;
