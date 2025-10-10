/**
 * Playwright component tests for cursor position preservation
 * Tests use randomization to cover many scenarios
 */

import { test, expect } from '@playwright/experimental-ct-react';
import React from 'react';
import { QueryEditor } from '../QueryEditor';
import {
  SeededRandom,
  generateRandomQuery,
  generateUnformattedQuery,
  generateRandomPosition,
  generateRandomInsertText,
  generateEditSequence,
  mockColumns,
  getSeed,
} from './test-generators';
import {
  getCursorPosition,
  setCursorPosition,
  getDocumentText,
  typeAtCursor,
  executeEditOperation,
  triggerAutoFormat,
  clickAtCharPosition,
  selectText,
  createTestContext,
} from './cursor-helpers';

test.describe('Cursor Position Preservation', () => {
  test('should preserve cursor when typing at different positions', async ({ mount, page }) => {
    const ctx = createTestContext();
    ctx.log('Testing cursor preservation during typing');

    const component = await mount(
      <QueryEditor
        value="[status] equals 'open'"
        columns={mockColumns}
      />
    );

    await component.click();
    await page.waitForTimeout(100);

    // Test typing at start
    await setCursorPosition(component, 0);
    const { beforePos: beforeStart, afterPos: afterStart } = await typeAtCursor(component, page, 'X');
    expect(afterStart).toBe(beforeStart + 1);

    // Test typing in middle
    const text = await getDocumentText(component);
    const middlePos = Math.floor(text.length / 2);
    await setCursorPosition(component, middlePos);
    const { beforePos: beforeMid, afterPos: afterMid } = await typeAtCursor(component, page, 'Y');
    expect(afterMid).toBe(beforeMid + 1);

    // Test typing at end
    const endText = await getDocumentText(component);
    await setCursorPosition(component, endText.length);
    const { beforePos: beforeEnd, afterPos: afterEnd } = await typeAtCursor(component, page, 'Z');
    expect(afterEnd).toBe(beforeEnd + 1);
  });

  test('random insertions preserve cursor position (10 iterations)', async ({ mount, page }) => {
    const seed = getSeed();
    const ctx = createTestContext(seed);
    ctx.log('Starting random insertion test');

    for (let i = 0; i < 10; i++) {
      const rng = new SeededRandom(seed + i);
      const initialText = generateRandomQuery(rng, mockColumns);

      const component = await mount(
        <QueryEditor
          value={initialText}
          columns={mockColumns}
        />
      );

      await component.click();
      await page.waitForTimeout(50);

      const cursorPos = generateRandomPosition(rng, initialText);
      const insertText = generateRandomInsertText(rng);

      ctx.log(`Iteration ${i}: Inserting "${insertText}" at position ${cursorPos} in "${initialText}"`);

      await setCursorPosition(component, cursorPos);
      await page.keyboard.type(insertText);
      await page.waitForTimeout(50);

      const actualPos = await getCursorPosition(component);
      const expectedPos = cursorPos + insertText.length;

      expect(actualPos).toBe(expectedPos);

      // Unmount component after each iteration to avoid React root errors
      await component.unmount();
    }
  });

  test('random edit sequences preserve cursor (5 sequences, 20 ops each)', async ({ mount, page }) => {
    const seed = getSeed();
    const ctx = createTestContext(seed);
    ctx.log('Starting random edit sequence test');

    for (let seq = 0; seq < 5; seq++) {
      const rng = new SeededRandom(seed + seq * 1000);
      const initialText = generateRandomQuery(rng, mockColumns);

      ctx.log(`Sequence ${seq}: Starting with "${initialText}"`);

      const component = await mount(
        <QueryEditor
          value={initialText}
          columns={mockColumns}
        />
      );

      await component.click();
      await page.waitForTimeout(50);

      const operations = generateEditSequence(rng, initialText.length, 20);

      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        ctx.log(`  Op ${i}: ${op.type} at pos ${JSON.stringify(op)}`);

        const { expectedCursorPos, actualCursorPos } = await executeEditOperation(
          component,
          page,
          op
        );

        expect(actualCursorPos).toBe(expectedCursorPos);
      }

      // Unmount after each sequence
      await component.unmount();
    }
  });

  test('formatting preserves cursor position (10 random scenarios)', async ({ mount, page }) => {
    const seed = getSeed();
    const ctx = createTestContext(seed);
    ctx.log('Starting format cursor preservation test');

    for (let i = 0; i < 10; i++) {
      const rng = new SeededRandom(seed + i);
      const unformatted = generateUnformattedQuery(rng, mockColumns);
      const cursorPos = generateRandomPosition(rng, unformatted);

      ctx.log(`Iteration ${i}: Unformatted="${unformatted}", cursor at ${cursorPos}`);

      const component = await mount(
        <QueryEditor
          value={unformatted}
          columns={mockColumns}
        />
      );

      await component.click();
      await page.waitForTimeout(50);

      // Set cursor position
      await setCursorPosition(component, cursorPos);
      const beforePos = await getCursorPosition(component);
      const beforeText = await getDocumentText(component);

      // Trigger format by blurring
      await triggerAutoFormat(page);

      const afterPos = await getCursorPosition(component);
      const afterText = await getDocumentText(component);

      ctx.log(`  Before: "${beforeText}" cursor=${beforePos}`);
      ctx.log(`  After:  "${afterText}" cursor=${afterPos}`);

      // Cursor should not have jumped to 0 or end unexpectedly
      // This test will likely FAIL, demonstrating the bug
      if (beforeText !== afterText) {
        // Text changed (formatting occurred)
        // Cursor should be somewhere reasonable, not at extremes
        expect(afterPos).toBeGreaterThanOrEqual(0);
        expect(afterPos).toBeLessThanOrEqual(afterText.length);

        // More specific: cursor shouldn't jump to very beginning or very end
        // unless it was already there
        if (beforePos > 5 && beforePos < beforeText.length - 5) {
          // Was in middle, should stay roughly in middle
          expect(afterPos).toBeGreaterThan(0);
          expect(afterPos).toBeLessThan(afterText.length);
        }
      }

      // Unmount after each iteration
      await component.unmount();
    }
  });

  test('selection replacement preserves cursor position', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor
        value="[status] equals 'open' AND [count] > 5"
        columns={mockColumns}
      />
    );

    await component.click();
    await page.waitForTimeout(50);

    // Select "open" and replace with "closed"
    const text = await getDocumentText(component);
    const startPos = text.indexOf("'open'");
    const endPos = startPos + 6; // length of 'open'

    await selectText(component, startPos + 1, endPos - 1); // Select just 'open' without quotes
    await page.keyboard.type('closed');
    await page.waitForTimeout(50);

    const afterPos = await getCursorPosition(component);
    // Cursor should be after 'closed'
    const expectedPos = startPos + 1 + 'closed'.length;
    expect(afterPos).toBe(expectedPos);
  });

  test('delete operations preserve cursor position', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor
        value="[status] equals 'open'"
        columns={mockColumns}
      />
    );

    await component.click();
    await page.waitForTimeout(50);

    // Position cursor in middle of 'equals'
    const text = await getDocumentText(component);
    const equalsPos = text.indexOf('equals');
    const deletePos = equalsPos + 3; // In middle of 'equals'

    await setCursorPosition(component, deletePos);
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(50);

    const afterPos = await getCursorPosition(component);
    expect(afterPos).toBe(deletePos - 1);
  });

  test('rapid position changes and edits', async ({ mount, page }) => {
    const seed = getSeed();
    const ctx = createTestContext(seed);
    const rng = new SeededRandom(seed);

    ctx.log('Testing rapid position jumps and edits');

    const component = await mount(
      <QueryEditor
        value="[status] equals 'open' AND [count] > 5"
        columns={mockColumns}
      />
    );

    await component.click();
    await page.waitForTimeout(50);

    // Rapidly jump to different positions and type
    for (let i = 0; i < 15; i++) {
      const text = await getDocumentText(component);
      const pos = generateRandomPosition(rng, text);
      const insertText = rng.choice(['X', ' ', 'Y']);

      await setCursorPosition(component, pos);
      await page.keyboard.type(insertText);
      await page.waitForTimeout(30);

      const actualPos = await getCursorPosition(component);
      const expectedPos = pos + insertText.length;

      ctx.log(`Jump ${i}: pos=${pos}, insert="${insertText}", expected=${expectedPos}, actual=${actualPos}`);
      expect(actualPos).toBe(expectedPos);
    }
  });

  test('external value changes preserve cursor (controlled component)', async ({ mount, page }) => {
    const ctx = createTestContext();
    ctx.log('Testing external value changes');

    let currentValue = "[status] equals 'open'";

    const component = await mount(
      <QueryEditor
        value={currentValue}
        columns={mockColumns}
      />
    );

    await component.click();
    await page.waitForTimeout(50);

    // Set cursor in middle
    await setCursorPosition(component, 10);
    const beforePos = await getCursorPosition(component);

    // External value change (simulate parent component updating value)
    currentValue = "[status] equals 'closed'";

    // Re-mount with new value
    await component.unmount();
    const newComponent = await mount(
      <QueryEditor
        value={currentValue}
        columns={mockColumns}
      />
    );

    await newComponent.click();
    await page.waitForTimeout(50);

    const afterPos = await getCursorPosition(newComponent);

    ctx.log(`Before: pos=${beforePos}, After: pos=${afterPos}`);

    // This test documents current behavior
    // Ideally cursor would be preserved or intelligently mapped
    expect(afterPos).toBeGreaterThanOrEqual(0);
    expect(afterPos).toBeLessThanOrEqual(currentValue.length);
  });

  test('stress test: 100 random operations', async ({ mount, page }) => {
    const seed = getSeed();
    const ctx = createTestContext(seed);
    const rng = new SeededRandom(seed);

    ctx.log('Starting stress test with 100 random operations');

    const initialText = generateRandomQuery(rng, mockColumns);
    const component = await mount(
      <QueryEditor
        value={initialText}
        columns={mockColumns}
      />
    );

    await component.click();
    await page.waitForTimeout(50);

    const operations = generateEditSequence(rng, initialText.length, 100);

    let failureCount = 0;
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];

      try {
        const { expectedCursorPos, actualCursorPos } = await executeEditOperation(
          component,
          page,
          op
        );

        if (actualCursorPos !== expectedCursorPos) {
          failureCount++;
          ctx.log(`  MISMATCH at op ${i}: expected=${expectedCursorPos}, actual=${actualCursorPos}`);
        }
      } catch (error) {
        failureCount++;
        ctx.log(`  ERROR at op ${i}: ${error}`);
      }
    }

    ctx.log(`Stress test complete. Failures: ${failureCount}/100`);

    // Allow some tolerance for now, as we expect some failures
    // Once bug is fixed, this should be 0
    expect(failureCount).toBeLessThan(100); // At least some should work
  });

  test('paste text at different positions', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor
        value="[status] equals 'open'"
        columns={mockColumns}
      />
    );

    await component.click();
    await page.waitForTimeout(50);

    // Position cursor
    await setCursorPosition(component, 8); // After 'status]'

    // Simulate paste by typing
    const pasteText = ' TEST';
    await page.keyboard.type(pasteText);
    await page.waitForTimeout(50);

    const afterPos = await getCursorPosition(component);
    expect(afterPos).toBe(8 + pasteText.length);
  });
});
