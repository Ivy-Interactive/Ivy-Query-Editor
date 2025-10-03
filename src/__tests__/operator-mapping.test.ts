/**
 * Tests for operator compatibility mapping
 */

import { describe, test, expect } from 'vitest';
import {
  getOperatorsForType,
  getAllOperators,
  isOperatorValidForType,
  type OperatorDef
} from '../components/extensions/operator-mapping';
import { DataType } from '../types/column';

describe('getOperatorsForType', () => {
  test('string columns return equals and contains', () => {
    const operators = getOperatorsForType('string');
    expect(operators).toHaveLength(2);
    expect(operators).toEqual([
      { symbol: 'equals', functionName: 'equals' },
      { symbol: 'contains', functionName: 'contains' },
    ]);
  });

  test('number columns return equals, >, <', () => {
    const operators = getOperatorsForType('number');
    expect(operators).toHaveLength(3);
    expect(operators.map(op => op.symbol)).toEqual(['equals', '>', '<']);
    expect(operators.map(op => op.functionName)).toEqual(['equals', 'greaterThan', 'lessThan']);
  });

  test('date columns return equals, >, <', () => {
    const operators = getOperatorsForType('date');
    expect(operators).toHaveLength(3);
    expect(operators.map(op => op.symbol)).toEqual(['equals', '>', '<']);
    expect(operators.map(op => op.functionName)).toEqual(['equals', 'greaterThan', 'lessThan']);
  });

  test('boolean columns return equals only', () => {
    const operators = getOperatorsForType('boolean');
    expect(operators).toHaveLength(1);
    expect(operators).toEqual([
      { symbol: 'equals', functionName: 'equals' },
    ]);
  });

  test('enum columns return equals only', () => {
    const operators = getOperatorsForType('enum');
    expect(operators).toHaveLength(1);
    expect(operators).toEqual([
      { symbol: 'equals', functionName: 'equals' },
    ]);
  });

  test('handles DataType enum values', () => {
    const operators = getOperatorsForType(DataType.STRING);
    expect(operators).toHaveLength(2);
    expect(operators.map(op => op.symbol)).toEqual(['equals', 'contains']);
  });

  test('unknown column type returns equals only as safe default', () => {
    const operators = getOperatorsForType('unknown' as any);
    expect(operators).toHaveLength(1);
    expect(operators).toEqual([
      { symbol: 'equals', functionName: 'equals' },
    ]);
  });

  test('operators have optional labels', () => {
    const numberOps = getOperatorsForType('number');
    const greaterThan = numberOps.find(op => op.symbol === '>');
    expect(greaterThan?.label).toBe('> (greater than)');
  });
});

describe('getAllOperators', () => {
  test('returns all unique operators', () => {
    const operators = getAllOperators();
    expect(operators.length).toBeGreaterThan(0);

    const symbols = operators.map(op => op.symbol);
    expect(symbols).toContain('equals');
    expect(symbols).toContain('contains');
    expect(symbols).toContain('>');
    expect(symbols).toContain('<');
  });

  test('returns unique operators only (no duplicates)', () => {
    const operators = getAllOperators();
    const symbols = operators.map(op => op.symbol);
    const uniqueSymbols = [...new Set(symbols)];
    expect(symbols.length).toBe(uniqueSymbols.length);
  });
});

describe('isOperatorValidForType', () => {
  test('returns true for valid string operators', () => {
    expect(isOperatorValidForType('string', 'equals')).toBe(true);
    expect(isOperatorValidForType('string', 'contains')).toBe(true);
  });

  test('returns false for invalid string operators', () => {
    expect(isOperatorValidForType('string', '>')).toBe(false);
    expect(isOperatorValidForType('string', '<')).toBe(false);
  });

  test('returns true for valid number operators', () => {
    expect(isOperatorValidForType('number', 'equals')).toBe(true);
    expect(isOperatorValidForType('number', '>')).toBe(true);
    expect(isOperatorValidForType('number', '<')).toBe(true);
  });

  test('returns false for invalid number operators', () => {
    expect(isOperatorValidForType('number', 'contains')).toBe(false);
  });

  test('returns true for valid boolean operators', () => {
    expect(isOperatorValidForType('boolean', 'equals')).toBe(true);
  });

  test('returns false for invalid boolean operators', () => {
    expect(isOperatorValidForType('boolean', 'contains')).toBe(false);
    expect(isOperatorValidForType('boolean', '>')).toBe(false);
  });

  test('handles DataType enum values', () => {
    expect(isOperatorValidForType(DataType.STRING, 'contains')).toBe(true);
    expect(isOperatorValidForType(DataType.NUMBER, '>')).toBe(true);
  });

  test('unknown types default to equals only', () => {
    expect(isOperatorValidForType('unknown' as any, 'equals')).toBe(true);
    expect(isOperatorValidForType('unknown' as any, 'contains')).toBe(false);
    expect(isOperatorValidForType('unknown' as any, '>')).toBe(false);
  });
});
