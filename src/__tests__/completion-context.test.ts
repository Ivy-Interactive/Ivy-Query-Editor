/**
 * Tests for completion context detection
 */

import { describe, test, expect } from 'vitest';
import { getCompletionContext, type CompletionContext } from '../components/extensions/completion-context';
import type { ColumnDef } from '../types/column';

const testColumns: ColumnDef[] = [
  { id: 'status', type: 'string' },
  { id: 'price', type: 'number' },
  { id: 'createdAt', type: 'date' },
  { id: 'active', type: 'boolean' },
  { id: 'category', type: 'enum', enumValues: ['electronics', 'books', 'clothing'] },
];

describe('getCompletionContext - Column Context', () => {
  test('empty string returns column context', () => {
    const context = getCompletionContext('', 0, testColumns);
    expect(context).toEqual({ type: 'column', from: 0 });
  });

  test('whitespace only returns column context', () => {
    const context = getCompletionContext('   ', 3, testColumns);
    expect(context).toEqual({ type: 'column', from: 0 });
  });

  test('cursor at start returns column context', () => {
    const context = getCompletionContext('test', 0, testColumns);
    expect(context).toEqual({ type: 'column', from: 0 });
  });

  test('typing opening bracket returns column context', () => {
    const context = getCompletionContext('[', 1, testColumns);
    expect(context).toEqual({ type: 'column', from: 1 });
  });

  test('cursor inside partial column name returns column context', () => {
    const context = getCompletionContext('[sta', 4, testColumns);
    // Incomplete field token, returns default column context from cursor position
    expect(context?.type).toBe('column');
  });

  test('cursor inside complete column brackets returns column context', () => {
    const context = getCompletionContext('[status]', 4, testColumns);
    expect(context).toEqual({ type: 'column', from: 0 });
  });

  test('after logical operator AND returns column context', () => {
    const context = getCompletionContext('[status] equals "open" AND ', 27, testColumns);
    expect(context).toEqual({ type: 'column', from: 27 });
  });

  test('after logical operator OR returns column context', () => {
    const context = getCompletionContext('[status] equals "open" OR ', 26, testColumns);
    expect(context).toEqual({ type: 'column', from: 26 });
  });
});

describe('getCompletionContext - Operator Context', () => {
  test('after complete column returns operator context', () => {
    const context = getCompletionContext('[status] ', 9, testColumns);
    expect(context).toMatchObject({
      type: 'operator',
      columnId: 'status',
      from: 9
    });
    expect(context?.column).toBeDefined();
    expect(context?.column?.id).toBe('status');
  });

  test('immediately after closing bracket with space returns operator context', () => {
    const context = getCompletionContext('[price] ', 8, testColumns);
    expect(context).toMatchObject({
      type: 'operator',
      columnId: 'price',
      from: 8
    });
  });

  test('after unknown column still returns operator context', () => {
    const context = getCompletionContext('[unknown] ', 10, testColumns);
    expect(context).toMatchObject({
      type: 'operator',
      columnId: 'unknown',
      from: 10
    });
    expect(context?.column).toBeUndefined();
  });
});

describe('getCompletionContext - Value Context', () => {
  test('after equals operator returns value context', () => {
    const context = getCompletionContext('[status] equals ', 16, testColumns);
    expect(context).toMatchObject({
      type: 'value',
      columnId: 'status',
      from: 16
    });
  });

  test('after symbolic operator = returns value context', () => {
    const context = getCompletionContext('[price] = ', 10, testColumns);
    expect(context).toMatchObject({
      type: 'value',
      columnId: 'price',
      from: 10
    });
  });

  test('after greater than operator returns value context', () => {
    const context = getCompletionContext('[price] > ', 10, testColumns);
    expect(context).toMatchObject({
      type: 'value',
      columnId: 'price',
      from: 10
    });
  });

  test('after less than operator returns value context', () => {
    const context = getCompletionContext('[price] < ', 10, testColumns);
    expect(context).toMatchObject({
      type: 'value',
      columnId: 'price',
      from: 10
    });
  });

  test('after contains operator returns value context', () => {
    const context = getCompletionContext('[status] contains ', 18, testColumns);
    expect(context).toMatchObject({
      type: 'value',
      columnId: 'status',
      from: 18
    });
  });
});

describe('getCompletionContext - Logical Context', () => {
  test('after complete condition returns logical context', () => {
    const context = getCompletionContext('[status] equals "open" ', 23, testColumns);
    expect(context).toMatchObject({
      type: 'logical',
      from: 23
    });
  });

  test('after condition with symbolic operator returns logical context', () => {
    const context = getCompletionContext('[price] > 100 ', 14, testColumns);
    expect(context).toMatchObject({
      type: 'logical',
      from: 14
    });
  });

  test('after boolean value returns logical context', () => {
    const context = getCompletionContext('[active] = true ', 16, testColumns);
    expect(context).toMatchObject({
      type: 'logical',
      from: 16
    });
  });
});

describe('getCompletionContext - Null/Ambiguous Cases', () => {
  test('cursor inside complete string literal returns null', () => {
    const context = getCompletionContext('[status] equals "open"', 20, testColumns);
    expect(context).toBeNull();
  });

  test('cursor right after opening quote of incomplete string returns null', () => {
    const context = getCompletionContext('[status] equals "', 17, testColumns);
    expect(context).toBeNull();
  });
});

describe('getCompletionContext - Complex Queries', () => {
  test('handles multiple conditions with AND', () => {
    const query = '[status] equals "open" AND [price] > ';
    const context = getCompletionContext(query, query.length, testColumns);
    expect(context).toMatchObject({
      type: 'value',
      columnId: 'price'
    });
  });

  test('handles multiple conditions with OR', () => {
    const query = '[status] equals "open" OR [category] equals ';
    const context = getCompletionContext(query, query.length, testColumns);
    expect(context).toMatchObject({
      type: 'value',
      columnId: 'category'
    });
  });

  test('after second complete condition suggests logical', () => {
    const query = '[status] = "open" AND [price] > 100 ';
    const context = getCompletionContext(query, query.length, testColumns);
    expect(context).toMatchObject({
      type: 'logical'
    });
  });
});

describe('getCompletionContext - Edge Cases', () => {
  test('handles multiple spaces after column', () => {
    const context = getCompletionContext('[status]   ', 11, testColumns);
    expect(context?.type).toBe('operator');
  });

  test('handles tabs and whitespace', () => {
    const context = getCompletionContext('[status]\t', 9, testColumns);
    expect(context?.type).toBe('operator');
  });

  test('handles incomplete operators gracefully', () => {
    const context = getCompletionContext('[status] eq', 11, testColumns);
    // Should still suggest operator context since "eq" isn't complete
    expect(context?.type).toBe('operator');
  });
});

describe('getCompletionContext - Performance', () => {
  test('completes in under 50ms for typical query', () => {
    const query = '[status] equals "open" AND [price] > 100';
    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      getCompletionContext(query, 20, testColumns);
    }

    const end = performance.now();
    const avgTime = (end - start) / 100;

    expect(avgTime).toBeLessThan(50);
  });

  test('handles large column sets efficiently', () => {
    const largeColumnSet: ColumnDef[] = Array.from({ length: 100 }, (_, i) => ({
      id: `column${i}`,
      type: 'string'
    }));

    const start = performance.now();
    getCompletionContext('[column50] equals ', 18, largeColumnSet);
    const end = performance.now();

    expect(end - start).toBeLessThan(50);
  });
});
