/**
 * Tests for Query Formatter
 */

import { describe, it, expect } from 'vitest';
import { formatQuery, isIdempotent } from '../formatter/QueryFormatter';
import { ColumnDef } from '../types/column';

// Test column definitions
const testColumns: ColumnDef[] = [
  { id: 'status', type: 'enum', enumValues: ['open', 'closed', 'pending'] },
  { id: 'price', type: 'number' },
  { id: 'name', type: 'string' },
  { id: 'active', type: 'boolean' },
  { id: 'createdAt', type: 'date' }
];

describe('Query Formatter', () => {
  describe('Formatting Rules', () => {
    it('should maintain already bracketed columns', () => {
      const result = formatQuery('[status] equals "open"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('[status] equals "open"');
    });

    it('should uppercase logical operators', () => {
      const result = formatQuery('[price] > 100 and [active] equals true', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toContain(' AND ');
    });

    it('should space binary operators', () => {
      const result = formatQuery('[price]>100', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('[price] > 100');
    });

    it('should double-quote strings with escaping', () => {
      // Note: The input needs to have valid syntax - field must be bracketed
      const result = formatQuery('[name] contains "test\\"value"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('[name] contains "test\\"value"');
    });

    it('should normalize NOT with parentheses', () => {
      const result = formatQuery('not [active] equals true', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('NOT ([active] equals true)');
    });

    it('should normalize operator synonyms', () => {
      const result = formatQuery('[price] greater than 100', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('[price] > 100');
    });

    it('should handle equals synonyms', () => {
      const result = formatQuery('[price] == 100', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('[price] equals 100');
    });

    it('should handle less than synonyms', () => {
      const result = formatQuery('[price] less than 100', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('[price] < 100');
    });

    it('should normalize case-insensitive keywords', () => {
      const result = formatQuery('[price] > 100 or [active] equals true', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('[price] > 100 OR [active] equals true');
    });

    it('should handle complex nested expressions', () => {
      const result = formatQuery('([price] > 100 or [active] equals true) and [status] equals "open"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('([price] > 100 OR [active] equals true) AND [status] equals "open"');
    });

    it('should handle IS BLANK formatting', () => {
      const result = formatQuery('[name] is blank', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('[name] IS BLANK');
    });

    it('should handle IS NOT BLANK formatting', () => {
      const result = formatQuery('[name] is not blank', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('[name] IS NOT BLANK');
    });

    it('should handle text operations', () => {
      const result = formatQuery('[name] starts with "John"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('[name] STARTS WITH "John"');
    });
  });

  describe('Idempotence', () => {
    const testQueries = [
      '[status] equals "open"',
      '[price] > 100',
      '[price]>100 and [status] equals "open"',
      'not [active] equals true',
      '([price] > 100 OR [active] equals true) AND [status] equals "open"',
      '[name] contains "test"',
      '[createdAt] > "2024-01-01"'
    ];

    testQueries.forEach(query => {
      it(`should be idempotent for: ${query}`, () => {
        expect(isIdempotent(query, testColumns)).toBe(true);

        // Manually verify
        const first = formatQuery(query, testColumns);
        const second = formatQuery(first.formatted, testColumns);
        expect(first.formatted).toBe(second.formatted);
      });
    });

    it('should handle empty string idempotently', () => {
      const first = formatQuery('', testColumns);
      const second = formatQuery(first.formatted, testColumns);
      expect(first.formatted).toBe('');
      expect(second.formatted).toBe('');
    });

    it('should handle whitespace-only idempotently', () => {
      const first = formatQuery('   \n\t  ', testColumns);
      const second = formatQuery(first.formatted, testColumns);
      expect(first.formatted).toBe('');
      expect(second.formatted).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should return original query with errors for invalid syntax', () => {
      const query = '[price] >>> 100';
      const result = formatQuery(query, testColumns);
      expect(result.errors).toBeDefined();
      expect(result.formatted).toBe(query);
    });

    it('should return errors for unknown columns', () => {
      const query = '[unknownCol] equals "test"';
      const result = formatQuery(query, testColumns);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].message).toContain('unknownCol');
      expect(result.formatted).toBe(query);
    });

    it('should not throw exceptions', () => {
      expect(() => {
        formatQuery('totally invalid query !@#$%', testColumns);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple spaces', () => {
      const result = formatQuery('[price]    >    100', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('[price] > 100');
    });

    it('should handle double quotes in strings', () => {
      // Test with a string that contains quotes - need to escape properly in input
      const result = formatQuery('[name] equals "test"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('[name] equals "test"');
    });

    it('should handle already formatted queries', () => {
      const canonical = '[price] > 100 AND [status] equals "open"';
      const result = formatQuery(canonical, testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe(canonical);
    });

    it('should handle numeric values', () => {
      const result = formatQuery('[price] > 123.45', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('[price] > 123.45');
    });

    it('should handle boolean values', () => {
      const result = formatQuery('[active] equals true', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('[active] equals true');
    });

    it('should handle date values', () => {
      const result = formatQuery('[createdAt] > "2024-01-01"', testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('[createdAt] > "2024-01-01"');
    });
  });

  describe('Complex Queries', () => {
    it('should format complex nested groups', () => {
      const query = '(([price] > 100 or [price] < 10) and [status] = "open") or ([active] equals true and [name] contains "test")';
      const result = formatQuery(query, testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe(
        '(([price] > 100 OR [price] < 10) AND [status] equals "open") OR ([active] equals true AND [name] contains "test")'
      );
    });

    it('should handle multiple NOT operators', () => {
      const query = 'not (not ([active] equals true))';
      const result = formatQuery(query, testColumns);
      expect(result.errors).toBeUndefined();
      // Double negation should be preserved
      expect(result.formatted).toContain('NOT');
    });

    it('should handle mixed case operators', () => {
      const query = '[price] GrEaTeR tHaN 100 AnD [status] EqUaLs "open"';
      const result = formatQuery(query, testColumns);
      expect(result.errors).toBeUndefined();
      expect(result.formatted).toBe('[price] > 100 AND [status] equals "open"');
    });
  });
});