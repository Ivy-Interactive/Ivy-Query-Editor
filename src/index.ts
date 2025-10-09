/**
 * Filter Query Parser, Formatter, and Evaluator
 *
 * Main entry point for the ANTLR4-based filter query parser.
 * Provides parsing, validation, formatting, and evaluation for filter queries.
 */

// Import styles
import './styles.css';

// Component exports
export { QueryEditor } from './components/QueryEditor';
export type { QueryEditorProps, QueryEditorChangeEvent } from './components/types';

// Parser exports
export { parseQuery, parseQueryOrThrow } from './parser/QueryParser';

// Formatter exports
export {
  formatQuery,
  formatQueryString,
  isCanonical,
  isIdempotent
} from './formatter/QueryFormatter';
export type { FormatResult } from './formatter/QueryFormatter';

// Evaluator exports (utility functions for consumer use)
export {
  evaluateFilter,
  evaluateFilterBatch,
  countMatches,
  findFirstMatch
} from './evaluator/FilterEvaluator';

// Type exports
export type {
  FilterGroup,
  Filter,
  Condition
} from './types/filter';
export type {
  ColumnDef,
  ColumnType
} from './types/column';
export { DataType } from './types/column';
export type {
  ParseResult,
  ParseError,
  ErrorSeverity
} from './types/parser';