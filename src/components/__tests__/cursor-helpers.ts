/**
 * Cursor position test utilities for Playwright component tests
 * Provides helpers for getting/setting cursor position and performing edits
 */

import { Locator, Page } from '@playwright/experimental-ct-react';
import { EditOperation } from './test-generators';

/**
 * Get current cursor position from CodeMirror editor
 * Returns the main selection's head position
 */
export async function getCursorPosition(component: Locator): Promise<number> {
  return await component.evaluate((el) => {
    const cmEditor = el.querySelector('.cm-content');
    if (!cmEditor) {
      throw new Error('CodeMirror editor not found');
    }

    // Access CodeMirror view from the editor element
    const view = (cmEditor as any).cmView?.view;
    if (!view) {
      throw new Error('CodeMirror view not found');
    }

    return view.state.selection.main.head;
  });
}

/**
 * Get current selection range from CodeMirror editor
 * Returns { anchor, head } representing the selection
 */
export async function getSelection(component: Locator): Promise<{ anchor: number; head: number }> {
  return await component.evaluate((el) => {
    const cmEditor = el.querySelector('.cm-content');
    if (!cmEditor) {
      throw new Error('CodeMirror editor not found');
    }

    const view = (cmEditor as any).cmView?.view;
    if (!view) {
      throw new Error('CodeMirror view not found');
    }

    const selection = view.state.selection.main;
    return {
      anchor: selection.anchor,
      head: selection.head,
    };
  });
}

/**
 * Get current document text from CodeMirror editor
 */
export async function getDocumentText(component: Locator): Promise<string> {
  return await component.evaluate((el) => {
    const cmEditor = el.querySelector('.cm-content');
    if (!cmEditor) {
      throw new Error('CodeMirror editor not found');
    }

    const view = (cmEditor as any).cmView?.view;
    if (!view) {
      throw new Error('CodeMirror view not found');
    }

    return view.state.doc.toString();
  });
}

/**
 * Set cursor position in CodeMirror editor
 */
export async function setCursorPosition(component: Locator, position: number): Promise<void> {
  await component.evaluate((el, pos) => {
    const cmEditor = el.querySelector('.cm-content');
    if (!cmEditor) {
      throw new Error('CodeMirror editor not found');
    }

    const view = (cmEditor as any).cmView?.view;
    if (!view) {
      throw new Error('CodeMirror view not found');
    }

    // Ensure position is within bounds
    const docLength = view.state.doc.length;
    const safePos = Math.max(0, Math.min(pos, docLength));

    view.dispatch({
      selection: { anchor: safePos, head: safePos },
    });
  }, position);
}

/**
 * Set selection range in CodeMirror editor
 */
export async function setSelection(
  component: Locator,
  anchor: number,
  head: number
): Promise<void> {
  await component.evaluate(
    (el, { anchor, head }) => {
      const cmEditor = el.querySelector('.cm-content');
      if (!cmEditor) {
        throw new Error('CodeMirror editor not found');
      }

      const view = (cmEditor as any).cmView?.view;
      if (!view) {
        throw new Error('CodeMirror view not found');
      }

      // Ensure positions are within bounds
      const docLength = view.state.doc.length;
      const safeAnchor = Math.max(0, Math.min(anchor, docLength));
      const safeHead = Math.max(0, Math.min(head, docLength));

      view.dispatch({
        selection: { anchor: safeAnchor, head: safeHead },
      });
    },
    { anchor, head }
  );
}

/**
 * Click at a specific character position in the editor
 * Note: This is approximate as it calculates pixel position
 */
export async function clickAtCharPosition(
  component: Locator,
  page: Page,
  position: number
): Promise<void> {
  // First, set cursor position programmatically (more reliable than pixel clicking)
  await setCursorPosition(component, position);

  // Also click to focus if needed
  await component.click();
}

/**
 * Type text at current cursor position and verify cursor moved correctly
 */
export async function typeAtCursor(
  component: Locator,
  page: Page,
  text: string
): Promise<{ beforePos: number; afterPos: number }> {
  const beforePos = await getCursorPosition(component);

  await page.keyboard.type(text);

  // Wait a bit for the change to be processed
  await page.waitForTimeout(50);

  const afterPos = await getCursorPosition(component);

  return { beforePos, afterPos };
}

/**
 * Delete text at current cursor position
 */
export async function deleteAtCursor(
  component: Locator,
  page: Page,
  numChars: number
): Promise<void> {
  for (let i = 0; i < numChars; i++) {
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(10);
  }
}

/**
 * Select text from position 'from' to 'to'
 */
export async function selectText(
  component: Locator,
  from: number,
  to: number
): Promise<void> {
  await setSelection(component, from, to);
}

/**
 * Execute a random edit operation
 */
export async function executeEditOperation(
  component: Locator,
  page: Page,
  operation: EditOperation
): Promise<{ expectedCursorPos: number; actualCursorPos: number }> {
  let expectedCursorPos: number;

  switch (operation.type) {
    case 'insert': {
      await setCursorPosition(component, operation.pos);
      await page.keyboard.type(operation.text);
      expectedCursorPos = operation.pos + operation.text.length;
      break;
    }

    case 'delete': {
      await setSelection(component, operation.from, operation.to);
      await page.keyboard.press('Backspace');
      expectedCursorPos = operation.from;
      break;
    }

    case 'replace': {
      await setSelection(component, operation.from, operation.to);
      await page.keyboard.type(operation.text);
      expectedCursorPos = operation.from + operation.text.length;
      break;
    }

    case 'move-cursor': {
      await setCursorPosition(component, operation.pos);
      expectedCursorPos = operation.pos;
      break;
    }
  }

  // Wait for changes to be processed
  await page.waitForTimeout(50);

  const actualCursorPos = await getCursorPosition(component);

  return { expectedCursorPos, actualCursorPos };
}

/**
 * Trigger auto-format by blurring the editor
 */
export async function triggerAutoFormat(page: Page): Promise<void> {
  // Click outside the editor to trigger blur/format
  await page.click('body');
  await page.waitForTimeout(200); // Wait for format to complete
}

/**
 * Assert cursor is at expected position
 */
export async function assertCursorAt(
  component: Locator,
  expectedPos: number,
  message?: string
): Promise<void> {
  const actualPos = await getCursorPosition(component);
  if (actualPos !== expectedPos) {
    throw new Error(
      message ||
        `Expected cursor at position ${expectedPos}, but got ${actualPos}`
    );
  }
}

/**
 * Calculate expected cursor position after formatting
 * This is a simplified version - real implementation would need to diff
 */
export function calculateCursorAfterFormat(
  originalText: string,
  formattedText: string,
  cursorPos: number
): number {
  // Simple heuristic: try to maintain relative position
  // In practice, would need to implement proper diff and position mapping

  if (cursorPos >= originalText.length) {
    return formattedText.length;
  }

  // Try to find the same context around cursor
  const contextBefore = originalText.slice(Math.max(0, cursorPos - 10), cursorPos);
  const contextAfter = originalText.slice(cursorPos, Math.min(originalText.length, cursorPos + 10));

  // Find similar context in formatted text
  const beforeIndex = formattedText.indexOf(contextBefore);
  if (beforeIndex >= 0) {
    return beforeIndex + contextBefore.length;
  }

  // Fallback: proportional position
  const ratio = cursorPos / originalText.length;
  return Math.floor(ratio * formattedText.length);
}

/**
 * Log test information for debugging
 */
export function logTestInfo(seed: number, operation: string, details?: any): void {
  console.log(`[Seed: ${seed}] ${operation}`, details || '');
}

/**
 * Create a reproducible test context with seed
 */
export function createTestContext(seed?: number): { seed: number; log: (msg: string) => void } {
  const actualSeed = seed || Date.now();

  return {
    seed: actualSeed,
    log: (msg: string) => logTestInfo(actualSeed, msg),
  };
}
