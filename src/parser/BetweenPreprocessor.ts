/**
 * Preprocessor for BETWEEN operator
 *
 * Transforms BETWEEN syntax into equivalent >= and <= expressions
 * since the grammar doesn't support BETWEEN directly.
 *
 * Features:
 * - Automatically swaps values if they're in descending order
 * - Works with dates and numbers
 *
 * Examples:
 * - [HireDate] BETWEEN "2022-01-01" AND "2022-12-31"
 *   becomes: [HireDate] >= "2022-01-01" AND [HireDate] <= "2022-12-31"
 *
 * - [HireDate] BETWEEN "2022-12-31" AND "2022-01-01" (descending)
 *   becomes: [HireDate] >= "2022-01-01" AND [HireDate] <= "2022-12-31"
 *
 * - [Age] BETWEEN 65 AND 18 (descending)
 *   becomes: [Age] >= 18 AND [Age] <= 65
 */

/**
 * Compare two values and determine if they need to be swapped
 */
function shouldSwapValues(lowerBound: string, upperBound: string): boolean {
  // Remove quotes for comparison
  const cleanLower = lowerBound.replace(/"/g, '');
  const cleanUpper = upperBound.replace(/"/g, '');

  // Try to parse as numbers
  const lowerNum = parseFloat(cleanLower);
  const upperNum = parseFloat(cleanUpper);

  // If both are valid numbers, compare numerically
  if (!isNaN(lowerNum) && !isNaN(upperNum)) {
    return lowerNum > upperNum;
  }

  // Try to parse as dates
  const lowerDate = new Date(cleanLower);
  const upperDate = new Date(cleanUpper);

  // If both are valid dates, compare by timestamp
  if (!isNaN(lowerDate.getTime()) && !isNaN(upperDate.getTime())) {
    return lowerDate > upperDate;
  }

  // For strings or other types, do lexical comparison
  return cleanLower > cleanUpper;
}

/**
 * Pattern to match BETWEEN expressions:
 * - Field reference: [FieldName]
 * - Operator: BETWEEN (case-insensitive)
 * - Lower bound: string literal or number
 * - AND keyword
 * - Upper bound: string literal or number
 */
const BETWEEN_PATTERN = /(\[[^\]]+\])\s+BETWEEN\s+((?:"[^"]*")|(?:[+-]?\d+(?:\.\d+)?))\s+AND\s+((?:"[^"]*")|(?:[+-]?\d+(?:\.\d+)?))/gi;

/**
 * Transforms BETWEEN syntax into equivalent comparison operators
 * Automatically swaps values if they're in descending order
 *
 * @param query - The input query string
 * @returns The transformed query with BETWEEN converted to >= and <=
 */
export function preprocessBetween(query: string): string {
  // Replace all BETWEEN expressions with equivalent range expressions
  return query.replace(BETWEEN_PATTERN, (match, field, lowerBound, upperBound) => {
    // Check if values need to be swapped
    let lower = lowerBound;
    let upper = upperBound;

    if (shouldSwapValues(lowerBound, upperBound)) {
      // Swap them
      lower = upperBound;
      upper = lowerBound;
    }

    // Construct the equivalent expression: field >= lower AND field <= upper
    return `${field} >= ${lower} AND ${field} <= ${upper}`;
  });
}

/**
 * Checks if a query contains BETWEEN syntax
 *
 * @param query - The input query string
 * @returns True if the query contains BETWEEN expressions
 */
export function hasBetweenSyntax(query: string): boolean {
  return BETWEEN_PATTERN.test(query);
}
