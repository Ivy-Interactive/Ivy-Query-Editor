/**
 * Operator compatibility mapping for different column types
 * Maps column types to their compatible operators with symbols and function names
 */

import { ColumnType, DataType } from '../../types/column';

/**
 * Operator definition with symbol and function name
 */
export interface OperatorDef {
  /** Operator symbol or keyword (e.g., '>', 'equals', 'contains') */
  symbol: string;
  /** Function name for the operator (e.g., 'greaterThan', 'equals') */
  functionName: string;
  /** Display label for autocomplete (defaults to symbol) */
  label?: string;
}

/**
 * Operator compatibility map by column type
 */
const OPERATOR_MAP: Record<ColumnType, OperatorDef[]> = {
  string: [
    { symbol: 'equals', functionName: 'equals' },
    { symbol: 'contains', functionName: 'contains' },
  ],
  number: [
    { symbol: 'equals', functionName: 'equals' },
    { symbol: '>', functionName: 'greaterThan', label: '> (greater than)' },
    { symbol: '<', functionName: 'lessThan', label: '< (less than)' },
  ],
  date: [
    { symbol: 'equals', functionName: 'equals' },
    { symbol: '>', functionName: 'greaterThan', label: '> (after)' },
    { symbol: '<', functionName: 'lessThan', label: '< (before)' },
  ],
  boolean: [
    { symbol: 'equals', functionName: 'equals' },
  ],
  enum: [
    { symbol: 'equals', functionName: 'equals' },
  ],
};

/**
 * Get compatible operators for a given column type
 *
 * @param type - Column type (string, number, boolean, date, enum)
 * @returns Array of compatible operators
 *
 * @example
 * ```ts
 * const operators = getOperatorsForType('string');
 * // Returns: [
 * //   { symbol: 'equals', functionName: 'equals' },
 * //   { symbol: 'contains', functionName: 'contains' }
 * // ]
 * ```
 */
export function getOperatorsForType(type: ColumnType | DataType): OperatorDef[] {
  // Normalize to ColumnType string
  let normalizedType: ColumnType;

  if (typeof type === 'string') {
    normalizedType = type as ColumnType;
  } else {
    // DataType enum value - convert to lowercase string
    normalizedType = String(type).toLowerCase() as ColumnType;
  }

  // Return operators for type, or default to equals only for unknown types
  return OPERATOR_MAP[normalizedType] || [
    { symbol: 'equals', functionName: 'equals' }
  ];
}

/**
 * Get all unique operators across all column types
 * Useful for general operator suggestions when context is unclear
 *
 * @returns Array of all unique operators
 */
export function getAllOperators(): OperatorDef[] {
  const operatorSet = new Map<string, OperatorDef>();

  Object.values(OPERATOR_MAP).forEach(operators => {
    operators.forEach(op => {
      if (!operatorSet.has(op.symbol)) {
        operatorSet.set(op.symbol, op);
      }
    });
  });

  return Array.from(operatorSet.values());
}

/**
 * Check if an operator is valid for a given column type
 *
 * @param type - Column type
 * @param operatorSymbol - Operator symbol to check
 * @returns True if operator is valid for the type
 *
 * @example
 * ```ts
 * isOperatorValidForType('string', 'contains'); // true
 * isOperatorValidForType('number', 'contains'); // false
 * ```
 */
export function isOperatorValidForType(
  type: ColumnType | DataType,
  operatorSymbol: string
): boolean {
  const operators = getOperatorsForType(type);
  return operators.some(op => op.symbol === operatorSymbol);
}
