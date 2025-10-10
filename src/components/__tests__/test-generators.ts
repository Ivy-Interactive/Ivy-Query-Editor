/**
 * Random test data generators for cursor position testing
 * Provides seeded randomness for reproducible tests
 */

import { ColumnDef, DataType } from '../../types/column';

/**
 * Seeded random number generator for reproducible tests
 * Uses Linear Congruential Generator (LCG) algorithm
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 2 ** 32;
    return this.seed / 2 ** 32;
  }

  /**
   * Generate random integer between min (inclusive) and max (exclusive)
   */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Choose random element from array
   */
  choice<T>(array: T[]): T {
    return array[this.int(0, array.length)];
  }

  /**
   * Generate random boolean
   */
  bool(): boolean {
    return this.next() < 0.5;
  }

  /**
   * Generate random string of given length
   */
  string(length: number, charset = 'abcdefghijklmnopqrstuvwxyz'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[this.int(0, charset.length)];
    }
    return result;
  }
}

/**
 * Edit operation types for random editing
 */
export type EditOperation =
  | { type: 'insert'; pos: number; text: string }
  | { type: 'delete'; from: number; to: number }
  | { type: 'replace'; from: number; to: number; text: string }
  | { type: 'move-cursor'; pos: number };

/**
 * Generate random valid filter query
 */
export function generateRandomQuery(rng: SeededRandom, columns: ColumnDef[]): string {
  const numConditions = rng.int(1, 4);
  const conditions: string[] = [];

  for (let i = 0; i < numConditions; i++) {
    const column = rng.choice(columns);
    const condition = generateRandomCondition(rng, column);
    conditions.push(condition);
  }

  // Join with random operators
  return conditions.join(rng.bool() ? ' AND ' : ' OR ');
}

/**
 * Generate random condition for a column
 */
function generateRandomCondition(rng: SeededRandom, column: ColumnDef): string {
  const columnRef = `[${column.name}]`;

  switch (column.type) {
    case DataType.STRING:
    case 'string':
    case 'Text':
      const stringOps = ['equals', 'contains', 'startsWith', 'endsWith'];
      const stringOp = rng.choice(stringOps);
      const stringValue = `'${rng.string(rng.int(3, 10))}'`;
      return `${columnRef} ${stringOp} ${stringValue}`;

    case DataType.NUMBER:
    case 'number':
    case 'Int32':
    case 'Number':
      const numberOps = ['equals', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual'];
      const numberOp = rng.choice(numberOps);
      const numberValue = rng.int(1, 100);
      return `${columnRef} ${numberOp} ${numberValue}`;

    case DataType.BOOLEAN:
    case 'boolean':
    case 'Boolean':
      return `${columnRef} equals ${rng.bool()}`;

    case DataType.DATE:
    case 'date':
    case 'Date':
      const dateOps = ['equals', 'greaterThan', 'lessThan'];
      const dateOp = rng.choice(dateOps);
      const year = rng.int(2020, 2025);
      const month = String(rng.int(1, 13)).padStart(2, '0');
      const day = String(rng.int(1, 29)).padStart(2, '0');
      return `${columnRef} ${dateOp} '${year}-${month}-${day}'`;

    default:
      return `${columnRef} equals 'value'`;
  }
}

/**
 * Generate unformatted query (for testing auto-format)
 */
export function generateUnformattedQuery(rng: SeededRandom, columns: ColumnDef[]): string {
  const query = generateRandomQuery(rng, columns);

  // Randomly add/remove spaces to make it unformatted
  let unformatted = query;

  // Remove random spaces
  if (rng.bool()) {
    unformatted = unformatted.replace(/ = /g, rng.choice(['=', ' =', '= ']));
  }

  // Add extra spaces
  if (rng.bool()) {
    unformatted = unformatted.replace(/ AND /g, rng.choice([' AND ', '  AND  ', 'AND']));
    unformatted = unformatted.replace(/ OR /g, rng.choice([' OR ', '  OR  ', 'OR']));
  }

  return unformatted;
}

/**
 * Generate random cursor position within text
 */
export function generateRandomPosition(rng: SeededRandom, text: string): number {
  if (text.length === 0) return 0;
  return rng.int(0, text.length + 1);
}

/**
 * Generate random text to insert
 */
export function generateRandomInsertText(rng: SeededRandom): string {
  const options = [
    ' ',           // space
    'AND',         // operator
    'OR',          // operator
    '[field]',     // column reference
    '[status]',    // common column
    '[count]',     // common column
    '=',           // comparison
    '>',           // comparison
    '<',           // comparison
    "'value'",     // string value
    '5',           // number
    'true',        // boolean
    'equals',      // function
    'contains',    // function
  ];

  return rng.choice(options);
}

/**
 * Generate random edit operation
 */
export function generateRandomEdit(rng: SeededRandom, textLength: number): EditOperation {
  const opType = rng.choice(['insert', 'delete', 'replace', 'move-cursor'] as const);

  switch (opType) {
    case 'insert': {
      const pos = rng.int(0, textLength + 1);
      const text = generateRandomInsertText(rng);
      return { type: 'insert', pos, text };
    }

    case 'delete': {
      if (textLength === 0) {
        // Can't delete from empty text, return move-cursor instead
        return { type: 'move-cursor', pos: 0 };
      }
      const from = rng.int(0, textLength);
      const to = rng.int(from + 1, Math.min(from + 10, textLength + 1));
      return { type: 'delete', from, to };
    }

    case 'replace': {
      if (textLength === 0) {
        // Can't replace in empty text, return insert instead
        return { type: 'insert', pos: 0, text: generateRandomInsertText(rng) };
      }
      const from = rng.int(0, textLength);
      const to = rng.int(from + 1, Math.min(from + 10, textLength + 1));
      const text = generateRandomInsertText(rng);
      return { type: 'replace', from, to, text };
    }

    case 'move-cursor': {
      const pos = rng.int(0, textLength + 1);
      return { type: 'move-cursor', pos };
    }
  }
}

/**
 * Generate a sequence of random edit operations
 */
export function generateEditSequence(
  rng: SeededRandom,
  initialTextLength: number,
  numOperations: number
): EditOperation[] {
  const operations: EditOperation[] = [];
  let currentLength = initialTextLength;

  for (let i = 0; i < numOperations; i++) {
    const op = generateRandomEdit(rng, currentLength);
    operations.push(op);

    // Update length based on operation
    switch (op.type) {
      case 'insert':
        currentLength += op.text.length;
        break;
      case 'delete':
        currentLength -= op.to - op.from;
        break;
      case 'replace':
        currentLength += op.text.length - (op.to - op.from);
        break;
    }
  }

  return operations;
}

/**
 * Mock columns for testing
 */
export const mockColumns: ColumnDef[] = [
  { name: 'status', type: DataType.STRING, width: 100 },
  { name: 'priority', type: DataType.STRING, width: 100 },
  { name: 'count', type: DataType.NUMBER, width: 100 },
  { name: 'age', type: DataType.NUMBER, width: 100 },
  { name: 'active', type: DataType.BOOLEAN, width: 100 },
  { name: 'createdDate', type: DataType.DATE, width: 100 },
];

/**
 * Get current timestamp as seed (useful for logging)
 */
export function getTimestampSeed(): number {
  return Date.now();
}

/**
 * Get seed from environment variable or generate new one
 */
export function getSeed(): number {
  const envSeed = process.env.TEST_SEED;
  if (envSeed) {
    return parseInt(envSeed, 10);
  }
  return getTimestampSeed();
}
