/**
 * Type checking utilities for filter validation
 */

import { ColumnType, ColumnDef } from '../types/column';
import { Condition } from '../types/filter';

/**
 * Check if an operator is compatible with a column type
 */
export function isOperatorCompatible(
  columnType: ColumnType,
  operator: Condition['function']
): boolean {
  switch (columnType) {
    case 'string':
      return ['equals', 'contains', 'startsWith', 'endsWith'].includes(operator);

    case 'number':
      return ['equals', 'greaterThan', 'lessThan'].includes(operator);

    case 'boolean':
      return operator === 'equals';

    case 'date':
      return ['equals', 'greaterThan', 'lessThan'].includes(operator);

    case 'enum':
      return operator === 'equals';

    default:
      return false;
  }
}

/**
 * Check if blank operators are compatible with a column type
 */
export function isBlankOperatorCompatible(
  columnType: ColumnType,
  operator: 'isBlank' | 'isNotBlank'
): boolean {
  // Blank operators can be used with string, date, and potentially other nullable types
  return ['string', 'date', 'enum'].includes(columnType);
}

/**
 * Validate value type against column type
 */
export function validateValueType(
  value: unknown,
  column: ColumnDef
): { valid: boolean; error?: string } {
  const { type, enumValues } = column;

  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return {
          valid: false,
          error: `Expected string for column '${column.id}', got ${typeof value}`
        };
      }
      break;

    case 'number':
      if (typeof value !== 'number') {
        return {
          valid: false,
          error: `Expected number for column '${column.id}', got ${typeof value}`
        };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return {
          valid: false,
          error: `Expected boolean for column '${column.id}', got ${typeof value}`
        };
      }
      break;

    case 'date':
      if (typeof value !== 'string') {
        return {
          valid: false,
          error: `Expected date string for column '${column.id}', got ${typeof value}`
        };
      }
      // Basic ISO date format check
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(value)) {
        return {
          valid: false,
          error: `Invalid date format for column '${column.id}'. Expected YYYY-MM-DD`
        };
      }
      break;

    case 'enum':
      if (typeof value !== 'string') {
        return {
          valid: false,
          error: `Expected string for enum column '${column.id}', got ${typeof value}`
        };
      }
      if (enumValues && !enumValues.includes(value)) {
        return {
          valid: false,
          error: `Value '${value}' is not valid for enum column '${column.id}'. Valid values: ${enumValues.join(', ')}`
        };
      }
      break;
  }

  return { valid: true };
}

/**
 * Get human-readable operator name
 */
export function getOperatorDisplayName(operator: Condition['function']): string {
  const displayNames: Record<Condition['function'], string> = {
    equals: 'equals',
    greaterThan: 'greater than',
    lessThan: 'less than',
    contains: 'contains',
    startsWith: 'starts with',
    endsWith: 'ends with',
    isBlank: 'is blank',
    isNotBlank: 'is not blank'
  };

  return displayNames[operator] || operator;
}