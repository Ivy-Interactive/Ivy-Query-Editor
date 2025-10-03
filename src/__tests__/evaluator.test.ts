/**
 * Tests for Filter Evaluator
 */

import { describe, it, expect } from 'vitest';
import { evaluateFilter, evaluateFilterBatch, countMatches, findFirstMatch } from '../evaluator/FilterEvaluator';
import { FilterGroup, Filter } from '../types/filter';
import { ColumnDef } from '../types/column';

// Test column definitions
const testColumns: ColumnDef[] = [
  { id: 'status', type: 'string' },
  { id: 'price', type: 'number' },
  { id: 'active', type: 'boolean' },
  { id: 'createdAt', type: 'date' },
  { id: 'category', type: 'enum', enumValues: ['electronics', 'clothing', 'food'] },
  { id: 'name', type: 'string' },
  { id: 'description', type: 'string' }
];

describe('Filter Evaluator', () => {
  describe('Equals Operator', () => {
    it('should match equal strings', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'status', function: 'equals', args: ['open'] } }]
      };
      expect(evaluateFilter(filter, { status: 'open' }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { status: 'closed' }, testColumns)).toBe(false);
    });

    it('should match equal numbers', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'price', function: 'equals', args: [100] } }]
      };
      expect(evaluateFilter(filter, { price: 100 }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { price: 99 }, testColumns)).toBe(false);
    });

    it('should match equal booleans', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'active', function: 'equals', args: [true] } }]
      };
      expect(evaluateFilter(filter, { active: true }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { active: false }, testColumns)).toBe(false);
    });

    it('should not coerce types', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'price', function: 'equals', args: ['100'] } }]
      };
      expect(evaluateFilter(filter, { price: 100 }, testColumns)).toBe(false); // string "100" !== number 100
    });

    it('should handle null values', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'status', function: 'equals', args: [null] } }]
      };
      expect(evaluateFilter(filter, { status: null }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { status: 'open' }, testColumns)).toBe(false);
    });
  });

  describe('Greater Than Operator', () => {
    it('should compare numbers', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'price', function: 'greaterThan', args: [100] } }]
      };
      expect(evaluateFilter(filter, { price: 150 }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { price: 100 }, testColumns)).toBe(false);
      expect(evaluateFilter(filter, { price: 50 }, testColumns)).toBe(false);
    });

    it('should compare dates', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'createdAt', function: 'greaterThan', args: ['2024-01-01'] } }]
      };
      expect(evaluateFilter(filter, { createdAt: '2024-06-01' }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { createdAt: '2023-12-01' }, testColumns)).toBe(false);
    });

    it('should return false for invalid types', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'status', function: 'greaterThan', args: [100] } }]
      };
      expect(evaluateFilter(filter, { status: 'open' }, testColumns)).toBe(false);
    });
  });

  describe('Less Than Operator', () => {
    it('should compare numbers', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'price', function: 'lessThan', args: [100] } }]
      };
      expect(evaluateFilter(filter, { price: 50 }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { price: 100 }, testColumns)).toBe(false);
      expect(evaluateFilter(filter, { price: 150 }, testColumns)).toBe(false);
    });

    it('should compare dates', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'createdAt', function: 'lessThan', args: ['2024-01-01'] } }]
      };
      expect(evaluateFilter(filter, { createdAt: '2023-06-01' }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { createdAt: '2024-06-01' }, testColumns)).toBe(false);
    });
  });

  describe('Contains Operator', () => {
    it('should match substring (case-sensitive)', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'name', function: 'contains', args: ['test'] } }]
      };
      expect(evaluateFilter(filter, { name: 'this is a test' }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { name: 'testing' }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { name: 'no match' }, testColumns)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'name', function: 'contains', args: ['Test'] } }]
      };
      expect(evaluateFilter(filter, { name: 'Test' }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { name: 'test' }, testColumns)).toBe(false);
    });

    it('should return false for non-string columns', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'price', function: 'contains', args: ['100'] } }]
      };
      expect(evaluateFilter(filter, { price: 100 }, testColumns)).toBe(false);
    });
  });

  describe('Starts With Operator', () => {
    it('should match prefix', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'name', function: 'startsWith', args: ['John'] } }]
      };
      expect(evaluateFilter(filter, { name: 'John Doe' }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { name: 'Johnny' }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { name: 'Bob John' }, testColumns)).toBe(false);
    });
  });

  describe('Ends With Operator', () => {
    it('should match suffix', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'name', function: 'endsWith', args: ['Smith'] } }]
      };
      expect(evaluateFilter(filter, { name: 'John Smith' }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { name: 'Blacksmith' }, testColumns)).toBe(false); // case-sensitive
      expect(evaluateFilter(filter, { name: 'Smith John' }, testColumns)).toBe(false);
    });

    it('should be case-sensitive for endsWith', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'name', function: 'endsWith', args: ['smith'] } }]
      };
      expect(evaluateFilter(filter, { name: 'Blacksmith' }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { name: 'BlackSmith' }, testColumns)).toBe(false);
    });
  });

  describe('Blank Operators', () => {
    it('should match null with isBlank', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'name', function: 'isBlank', args: [] } }]
      };
      expect(evaluateFilter(filter, { name: null }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { name: undefined }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { name: '' }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { name: 'value' }, testColumns)).toBe(false);
    });

    it('should match non-null with isNotBlank', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'name', function: 'isNotBlank', args: [] } }]
      };
      expect(evaluateFilter(filter, { name: 'value' }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { name: null }, testColumns)).toBe(false);
      expect(evaluateFilter(filter, { name: undefined }, testColumns)).toBe(false);
      expect(evaluateFilter(filter, { name: '' }, testColumns)).toBe(false);
    });
  });

  describe('AND Logic', () => {
    it('should require all conditions to be true', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [
          { condition: { column: 'price', function: 'greaterThan', args: [100] } },
          { condition: { column: 'active', function: 'equals', args: [true] } }
        ]
      };
      expect(evaluateFilter(filter, { price: 150, active: true }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { price: 150, active: false }, testColumns)).toBe(false);
      expect(evaluateFilter(filter, { price: 50, active: true }, testColumns)).toBe(false);
      expect(evaluateFilter(filter, { price: 50, active: false }, testColumns)).toBe(false);
    });
  });

  describe('OR Logic', () => {
    it('should require at least one condition to be true', () => {
      const filter: FilterGroup = {
        op: 'OR',
        filters: [
          { condition: { column: 'price', function: 'greaterThan', args: [100] } },
          { condition: { column: 'active', function: 'equals', args: [true] } }
        ]
      };
      expect(evaluateFilter(filter, { price: 150, active: false }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { price: 50, active: true }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { price: 150, active: true }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { price: 50, active: false }, testColumns)).toBe(false);
    });
  });

  describe('Negation', () => {
    it('should negate condition result', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [
          { negate: true, condition: { column: 'active', function: 'equals', args: [true] } }
        ]
      };
      expect(evaluateFilter(filter, { active: false }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { active: true }, testColumns)).toBe(false);
    });

    it('should negate group result', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [
          {
            negate: true,
            group: {
              op: 'OR',
              filters: [
                { condition: { column: 'price', function: 'greaterThan', args: [100] } },
                { condition: { column: 'active', function: 'equals', args: [true] } }
              ]
            }
          }
        ]
      };
      expect(evaluateFilter(filter, { price: 50, active: false }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { price: 150, active: false }, testColumns)).toBe(false);
    });
  });

  describe('Nested Groups', () => {
    it('should evaluate nested groups recursively', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [
          {
            group: {
              op: 'OR',
              filters: [
                { condition: { column: 'price', function: 'greaterThan', args: [100] } },
                { condition: { column: 'price', function: 'lessThan', args: [10] } }
              ]
            }
          },
          { condition: { column: 'status', function: 'equals', args: ['open'] } }
        ]
      };
      expect(evaluateFilter(filter, { price: 150, status: 'open' }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { price: 5, status: 'open' }, testColumns)).toBe(true);
      expect(evaluateFilter(filter, { price: 50, status: 'open' }, testColumns)).toBe(false);
      expect(evaluateFilter(filter, { price: 150, status: 'closed' }, testColumns)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should return true for empty filter group', () => {
      const filter: FilterGroup = { op: 'AND', filters: [] };
      expect(evaluateFilter(filter, { any: 'data' }, testColumns)).toBe(true);
    });

    it('should return false for unknown columns', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'unknownCol', function: 'equals', args: ['value'] } }]
      };
      expect(evaluateFilter(filter, { status: 'open' }, testColumns)).toBe(false);
    });

    it('should return false for type mismatches', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'price', function: 'contains', args: ['100'] } }]
      };
      expect(evaluateFilter(filter, { price: 100 }, testColumns)).toBe(false);
    });

    it('should handle missing column values', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'status', function: 'equals', args: ['open'] } }]
      };
      expect(evaluateFilter(filter, { price: 100 }, testColumns)).toBe(false);
    });

    it('should handle invalid dates', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'createdAt', function: 'greaterThan', args: ['2024-01-01'] } }]
      };
      expect(evaluateFilter(filter, { createdAt: 'invalid-date' }, testColumns)).toBe(false);
    });
  });

  describe('Batch Operations', () => {
    const rows = [
      { id: 1, price: 150, active: true, status: 'open' },
      { id: 2, price: 50, active: false, status: 'closed' },
      { id: 3, price: 200, active: true, status: 'pending' },
      { id: 4, price: 75, active: true, status: 'open' }
    ];

    it('should filter batch of rows', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [
          { condition: { column: 'price', function: 'greaterThan', args: [100] } },
          { condition: { column: 'active', function: 'equals', args: [true] } }
        ]
      };
      const filtered = evaluateFilterBatch(filter, rows, testColumns);
      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe(1);
      expect(filtered[1].id).toBe(3);
    });

    it('should count matching rows', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'status', function: 'equals', args: ['open'] } }]
      };
      const count = countMatches(filter, rows, testColumns);
      expect(count).toBe(2);
    });

    it('should find first matching row', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'price', function: 'greaterThan', args: [100] } }]
      };
      const first = findFirstMatch(filter, rows, testColumns);
      expect(first?.id).toBe(1);
    });

    it('should return undefined if no match found', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [{ condition: { column: 'price', function: 'greaterThan', args: [500] } }]
      };
      const first = findFirstMatch(filter, rows, testColumns);
      expect(first).toBeUndefined();
    });
  });

  describe('Performance', () => {
    it('should evaluate 10,000 rows quickly', () => {
      const filter: FilterGroup = {
        op: 'AND',
        filters: [
          { condition: { column: 'price', function: 'greaterThan', args: [100] } },
          { condition: { column: 'active', function: 'equals', args: [true] } }
        ]
      };

      const rows = Array.from({ length: 10000 }, (_, i) => ({
        price: Math.random() * 200,
        active: Math.random() > 0.5,
        status: 'open'
      }));

      const start = performance.now();
      const filtered = evaluateFilterBatch(filter, rows, testColumns);
      const duration = performance.now() - start;

      // Should be < 100ms for 10k rows (< 0.01ms per row)
      expect(duration).toBeLessThan(100);

      // Verify some results were found
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.length).toBeLessThan(rows.length);
    });
  });
});