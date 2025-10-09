/**
 * Tests for the main parser integration
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { parseQuery } from '../parser/QueryParser';
import { ColumnDef } from '../types/column';

// Test column definitions
const testColumns: ColumnDef[] = [
  { name: 'status', type: 'enum', width: 100 },
  { name: 'price', type: 'number', width: 100 },
  { name: 'name', type: 'string', width: 100 },
  { name: 'isActive', type: 'boolean', width: 100 },
  { name: 'createdAt', type: 'date', width: 100 },
  { name: 'description', type: 'string', width: 100 }
];

describe('QueryParser', () => {
  describe('Empty Input', () => {
    it('should handle empty string', () => {
      const result = parseQuery('', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters).toEqual({ op: 'AND', filters: [] });
    });

    it('should handle whitespace-only string', () => {
      const result = parseQuery('   \n\t  ', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters).toEqual({ op: 'AND', filters: [] });
    });
  });

  describe('Simple Conditions', () => {
    it('should parse equality condition', () => {
      const result = parseQuery('[status] equals "open"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters).toEqual({
        op: 'AND',
        filters: [{
          condition: {
            column: 'status',
            function: 'equals',
            args: ['open']
          }
        }]
      });
    });

    it('should parse numeric comparison', () => {
      const result = parseQuery('[price] > 100', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters?.filters[0]).toMatchObject({
        condition: {
          column: 'price',
          function: 'greaterThan',
          args: [100]
        }
      });
    });

    it('should parse text contains', () => {
      const result = parseQuery('[name] contains "test"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters?.filters[0]).toMatchObject({
        condition: {
          column: 'name',
          function: 'contains',
          args: ['test']
        }
      });
    });

    it('should parse boolean equality', () => {
      const result = parseQuery('[isActive] equals true', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters?.filters[0]).toMatchObject({
        condition: {
          column: 'isActive',
          function: 'equals',
          args: [true]
        }
      });
    });

    it('should parse date comparison', () => {
      const result = parseQuery('[createdAt] > "2024-01-01"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters?.filters[0]).toMatchObject({
        condition: {
          column: 'createdAt',
          function: 'greaterThan',
          args: ['2024-01-01']
        }
      });
    });
  });

  describe('Logical Operators', () => {
    it('should parse AND expression', () => {
      const result = parseQuery('[price] > 100 AND [status] equals "open"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters).toMatchObject({
        op: 'AND',
        filters: [
          { condition: { column: 'price', function: 'greaterThan', args: [100] } },
          { condition: { column: 'status', function: 'equals', args: ['open'] } }
        ]
      });
    });

    it('should parse OR expression', () => {
      const result = parseQuery('[status] equals "open" OR [status] equals "pending"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters).toMatchObject({
        op: 'OR',
        filters: [
          { condition: { column: 'status', function: 'equals', args: ['open'] } },
          { condition: { column: 'status', function: 'equals', args: ['pending'] } }
        ]
      });
    });

    it('should parse NOT expression', () => {
      const result = parseQuery('NOT [status] equals "closed"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters?.filters[0]).toMatchObject({
        condition: { column: 'status', function: 'equals', args: ['closed'] },
        negate: true
      });
    });
  });

  describe('Grouping', () => {
    it('should parse grouped expressions', () => {
      const result = parseQuery('([price] > 100 OR [price] < 10) AND [status] equals "open"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters).toMatchObject({
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
      });
    });
  });

  describe('Blank Operations', () => {
    it('should parse IS BLANK', () => {
      const result = parseQuery('[description] IS BLANK', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters?.filters[0]).toMatchObject({
        condition: {
          column: 'description',
          function: 'isBlank',
          args: []
        }
      });
    });

    it('should parse IS NOT BLANK', () => {
      const result = parseQuery('[description] IS NOT BLANK', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters?.filters[0]).toMatchObject({
        condition: {
          column: 'description',
          function: 'isNotBlank',
          args: []
        }
      });
    });
  });

  describe('Text Operations', () => {
    it('should parse starts with', () => {
      const result = parseQuery('[name] starts with "John"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters?.filters[0]).toMatchObject({
        condition: {
          column: 'name',
          function: 'startsWith',
          args: ['John']
        }
      });
    });

    it('should parse ends with', () => {
      const result = parseQuery('[name] ends with "Smith"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters?.filters[0]).toMatchObject({
        condition: {
          column: 'name',
          function: 'endsWith',
          args: ['Smith']
        }
      });
    });

    it('should parse NOT contains', () => {
      const result = parseQuery('[name] NOT contains "test"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters?.filters[0]).toMatchObject({
        condition: {
          column: 'name',
          function: 'contains',
          args: ['test']
        },
        negate: true
      });
    });
  });

  describe('Operator Synonyms', () => {
    it('should parse = as equals', () => {
      const result = parseQuery('[status] = "open"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters?.filters[0]).toMatchObject({
        condition: { function: 'equals' }
      });
    });

    it('should parse == as equals', () => {
      const result = parseQuery('[status] == "open"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters?.filters[0]).toMatchObject({
        condition: { function: 'equals' }
      });
    });

    it('should parse greater than as greaterThan', () => {
      const result = parseQuery('[price] greater than 100', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters?.filters[0]).toMatchObject({
        condition: { function: 'greaterThan' }
      });
    });

    it('should parse less than as lessThan', () => {
      const result = parseQuery('[price] less than 100', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters?.filters[0]).toMatchObject({
        condition: { function: 'lessThan' }
      });
    });
  });

  describe('Case Insensitivity', () => {
    it('should handle case-insensitive AND', () => {
      const result = parseQuery('[price] > 100 and [status] = "open"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters?.op).toBe('AND');
    });

    it('should handle case-insensitive OR', () => {
      const result = parseQuery('[price] > 100 or [price] < 10', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters?.op).toBe('OR');
    });

    it('should handle case-insensitive NOT', () => {
      const result = parseQuery('not [status] equals "closed"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.filters?.filters[0].negate).toBe(true);
    });
  });
});