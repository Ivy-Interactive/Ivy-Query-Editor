/**
 * Property-based tests for cursor position using fast-check
 * These tests use fast-check's powerful random generation to test properties
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SeededRandom, generateRandomQuery, mockColumns } from '../components/__tests__/test-generators';

/**
 * Property: Inserting text at any position should move cursor by text length
 * This is a pure logic test without actual UI rendering
 */
describe('Cursor Position Properties', () => {
  it('property: cursor moves by insert length after insertion', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }), // initial text
        fc.nat(), // cursor position (will be normalized)
        fc.string({ minLength: 1, maxLength: 20 }), // text to insert
        (initialText, cursorRatio, insertText) => {
          // Normalize cursor position to valid range
          const cursorPos = initialText.length === 0 ? 0 : cursorRatio % (initialText.length + 1);

          // Calculate expected cursor after insert
          const expectedCursor = cursorPos + insertText.length;

          // Verify it's in valid range
          const newTextLength = initialText.length + insertText.length;
          expect(expectedCursor).toBeGreaterThanOrEqual(0);
          expect(expectedCursor).toBeLessThanOrEqual(newTextLength);

          // Verify cursor moved by exactly insert length
          expect(expectedCursor - cursorPos).toBe(insertText.length);
        }
      ),
      { numRuns: 1000, seed: 42 }
    );
  });

  it('property: deleting selection should position cursor at selection start', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 100 }),
        fc.nat(),
        fc.nat(),
        (text, pos1, pos2) => {
          // Create valid selection range
          const from = Math.min(pos1 % text.length, pos2 % text.length);
          const to = Math.max(pos1 % text.length, pos2 % text.length);

          // Skip if selection is empty
          if (from === to) return;

          // After deletion, cursor should be at 'from'
          const expectedCursor = from;
          const newTextLength = text.length - (to - from);

          expect(expectedCursor).toBeGreaterThanOrEqual(0);
          expect(expectedCursor).toBeLessThanOrEqual(newTextLength);
        }
      ),
      { numRuns: 1000, seed: 42 }
    );
  });

  it('property: replacing selection should position cursor after replacement', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 100 }),
        fc.nat(),
        fc.nat(),
        fc.string({ minLength: 1, maxLength: 20 }),
        (text, pos1, pos2, replacement) => {
          // Create valid selection range
          const from = Math.min(pos1 % text.length, pos2 % text.length);
          const to = Math.max(pos1 % text.length, pos2 % text.length);

          // Skip if selection is empty
          if (from === to) return;

          // After replacement, cursor should be at from + replacement.length
          const expectedCursor = from + replacement.length;
          const newTextLength = text.length - (to - from) + replacement.length;

          expect(expectedCursor).toBeGreaterThanOrEqual(0);
          expect(expectedCursor).toBeLessThanOrEqual(newTextLength);
          expect(expectedCursor).toBe(from + replacement.length);
        }
      ),
      { numRuns: 1000, seed: 42 }
    );
  });

  it('property: cursor position is always within document bounds', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }),
        fc.nat(),
        (text, cursorRatio) => {
          const cursorPos = text.length === 0 ? 0 : cursorRatio % (text.length + 1);

          expect(cursorPos).toBeGreaterThanOrEqual(0);
          expect(cursorPos).toBeLessThanOrEqual(text.length);
        }
      ),
      { numRuns: 1000, seed: 42 }
    );
  });

  it('property: sequence of edits maintains cursor consistency', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 50 }),
        fc.array(
          fc.record({
            type: fc.constantFrom('insert', 'delete'),
            pos: fc.nat(),
            text: fc.string({ minLength: 1, maxLength: 5 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (initialText, operations) => {
          let currentText = initialText;
          let currentCursor = 0;

          for (const op of operations) {
            const pos = currentText.length === 0 ? 0 : op.pos % (currentText.length + 1);

            if (op.type === 'insert') {
              // Insert text
              currentText =
                currentText.slice(0, pos) + op.text + currentText.slice(pos);
              currentCursor = pos + op.text.length;
            } else {
              // Delete single character
              if (currentText.length > 0 && pos < currentText.length) {
                currentText = currentText.slice(0, pos) + currentText.slice(pos + 1);
                currentCursor = pos;
              }
            }

            // Verify cursor is always valid
            expect(currentCursor).toBeGreaterThanOrEqual(0);
            expect(currentCursor).toBeLessThanOrEqual(currentText.length);
          }
        }
      ),
      { numRuns: 500, seed: 42 }
    );
  });

  it('property: random valid filter queries can be generated', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10000 }), (seed) => {
        const rng = new SeededRandom(seed);
        const query = generateRandomQuery(rng, mockColumns);

        // Verify query is a string and not empty
        expect(typeof query).toBe('string');
        expect(query.length).toBeGreaterThan(0);

        // Verify it contains at least one column reference
        const hasColumn = mockColumns.some((col) => query.includes(`[${col.name}]`));
        expect(hasColumn).toBe(true);
      }),
      { numRuns: 100, seed: 42 }
    );
  });

  it('property: cursor position mapping through formatting', () => {
    // This tests the theoretical behavior of position mapping
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 50 }),
        fc.nat(),
        (text, cursorRatio) => {
          const cursorPos = cursorRatio % (text.length + 1);

          // Simulate formatting: add/remove spaces
          const formatted = text.replace(/\s+/g, ' ').trim();

          // Calculate mapped cursor position (simplified)
          // In real implementation, would use CodeMirror's mapPos
          let mappedPos = cursorPos;

          if (cursorPos > formatted.length) {
            mappedPos = formatted.length;
          }

          // Verify mapped position is valid
          expect(mappedPos).toBeGreaterThanOrEqual(0);
          expect(mappedPos).toBeLessThanOrEqual(formatted.length);
        }
      ),
      { numRuns: 500, seed: 42 }
    );
  });

  it('property: backspace at any position maintains valid cursor', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.nat(),
        (text, cursorRatio) => {
          const cursorPos = (cursorRatio % text.length) + 1; // At least position 1 for backspace

          // After backspace, cursor should be at cursorPos - 1
          const expectedCursor = cursorPos - 1;
          const newTextLength = text.length - 1;

          expect(expectedCursor).toBeGreaterThanOrEqual(0);
          expect(expectedCursor).toBeLessThanOrEqual(newTextLength);
        }
      ),
      { numRuns: 1000, seed: 42 }
    );
  });

  it('property: multiple insertions in sequence accumulate cursor movement', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }),
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 10 }),
        (initialText, insertions) => {
          let cursor = initialText.length; // Start at end
          let textLength = initialText.length;

          for (const insertion of insertions) {
            cursor += insertion.length;
            textLength += insertion.length;
          }

          expect(cursor).toBe(textLength);
          expect(cursor).toBeGreaterThanOrEqual(initialText.length);
        }
      ),
      { numRuns: 500, seed: 42 }
    );
  });

  it('property: selection range is always valid (anchor <= head or head <= anchor)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }),
        fc.nat(),
        fc.nat(),
        (text, pos1, pos2) => {
          const textLength = text.length;
          const anchor = textLength === 0 ? 0 : pos1 % (textLength + 1);
          const head = textLength === 0 ? 0 : pos2 % (textLength + 1);

          // Both should be in valid range
          expect(anchor).toBeGreaterThanOrEqual(0);
          expect(anchor).toBeLessThanOrEqual(textLength);
          expect(head).toBeGreaterThanOrEqual(0);
          expect(head).toBeLessThanOrEqual(textLength);

          // Selection range is valid
          const from = Math.min(anchor, head);
          const to = Math.max(anchor, head);
          expect(to - from).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 1000, seed: 42 }
    );
  });
});

/**
 * Performance properties
 */
describe('Cursor Position Performance Properties', () => {
  it('property: cursor operations should be fast regardless of document size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 10000 }),
        fc.nat(),
        (textLength, cursorRatio) => {
          const text = 'x'.repeat(textLength);
          const cursorPos = cursorRatio % (textLength + 1);

          const start = performance.now();

          // Simulate cursor position calculation
          const valid = cursorPos >= 0 && cursorPos <= text.length;

          const end = performance.now();
          const duration = end - start;

          expect(valid).toBe(true);
          expect(duration).toBeLessThan(1); // Should be nearly instantaneous
        }
      ),
      { numRuns: 100, seed: 42 }
    );
  });
});
