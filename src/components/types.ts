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