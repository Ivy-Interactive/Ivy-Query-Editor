/**
 * Type definitions for the QueryEditor component
 */

import { FilterGroup } from '../types/filter';
import { ColumnDef } from '../types/column';
import { ParseError } from '../types/parser';

/**
 * Props for the QueryEditor component
 */
export interface QueryEditorProps {
  /** Current query text (controlled) */
  value?: string;

  /** Column catalog for validation and autocomplete */
  columns: ColumnDef[];

  /** Fires on every change with validation state */
  onChange?: (event: QueryEditorChangeEvent) => void;

  /** Editor theme */
  theme?: 'light' | 'dark';

  /** Read-only mode */
  readOnly?: boolean;

  /** Editor height */
  height?: number | string;

  /** Placeholder text when empty */
  placeholder?: string;

  /** Additional CSS class name */
  className?: string;

  /** Auto-focus on mount */
  autoFocus?: boolean;

  /** Whether the editor is collapsed */
  isCollapsed?: boolean;

  /** Callback when toggle button is clicked */
  onToggle?: (collapsed: boolean) => void;

  /** Side where the dropdown opens relative to the button */
  dropdownSide?: 'left' | 'right' | 'top' | 'bottom';

  /** Title text shown in the popover header */
  popoverTitle?: string;

  /** Text for the clear button */
  clearButtonText?: string;

  /** Show or hide the popover title */
  showPopoverTitle?: boolean;

  /** Text to display next to the filter button icon */
  buttonText?: string;

  /** Show or hide the button text */
  showButtonText?: boolean;

  /** Custom CSS class name for the editor container (CodeMirror) */
  editorClassName?: string;

  /** List of saved/recent queries to display below the editor */
  queries?: string[];

  /** Callback when a query from the list is clicked */
  onQuerySelect?: (query: string) => void;
}

/**
 * Event emitted when the editor content changes
 */
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

/**
 * Theme definition for syntax highlighting
 */
export interface ThemeColors {
  keyword: string;
  operator: string;
  variable: string;
  string: string;
  number: string;
  boolean: string;
  bracket: string;
  error: string;
}