/**
 * Playwright tests for autocomplete bracket duplication bug
 * Tests the scenario where selecting a column from autocomplete duplicates the closing bracket
 */

import { test, expect } from '@playwright/experimental-ct-react';
import React from 'react';
import { QueryEditor } from '../QueryEditor';
import { ColumnDef, DataType } from '../../types/column';
import { getDocumentText } from './cursor-helpers';

const mockColumns: ColumnDef[] = [
  { name: 'status', type: DataType.STRING, width: 100 },
  { name: 'priority', type: DataType.STRING, width: 100 },
  { name: 'count', type: DataType.NUMBER, width: 100 },
  { name: 'active', type: DataType.BOOLEAN, width: 100 },
];

test.describe('Autocomplete Bracket Duplication Bug', () => {
  test('should not duplicate closing bracket when completing inside brackets', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor
        value=""
        columns={mockColumns}
      />
    );

    await component.click();
    await page.waitForTimeout(100);

    // Type opening bracket
    await page.keyboard.type('[');
    await page.waitForTimeout(300); // Wait for autocomplete to appear

    // Check if autocomplete dropdown is visible
    const autocompletePanel = page.locator('.cm-tooltip-autocomplete');
    await expect(autocompletePanel).toBeVisible();

    // Select first option from the list (whatever it is)
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    // Get the resulting text
    const text = await getDocumentText(component);

    // Should have one column reference without duplicate brackets
    expect(text).toMatch(/^\[\w+\]$/); // Matches [word]
    expect(text).not.toContain(']]');
  });

  test('should not duplicate bracket when typing partial column name', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor
        value=""
        columns={mockColumns}
      />
    );

    await component.click();
    await page.waitForTimeout(100);

    // Type opening bracket and partial column name
    await page.keyboard.type('[sta');
    await page.waitForTimeout(200);

    // Check if autocomplete dropdown is visible
    const autocompletePanel = page.locator('.cm-tooltip-autocomplete');
    await expect(autocompletePanel).toBeVisible();

    // Select the completion
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    const text = await getDocumentText(component);

    // Should be [status] not [status]]
    expect(text).toBe('[status]');
    expect(text).not.toContain(']]');
  });

  test('should not duplicate bracket when user manually types closing bracket first', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor
        value=""
        columns={mockColumns}
      />
    );

    await component.click();
    await page.waitForTimeout(100);

    // Type [status] manually
    await page.keyboard.type('[status]');
    await page.waitForTimeout(100);

    const text = await getDocumentText(component);

    // Should be [status] not [status]]
    expect(text).toBe('[status]');
    expect(text).not.toContain(']]');
  });

  test('should not duplicate bracket when completing with partial match', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor
        value=""
        columns={mockColumns}
      />
    );

    await component.click();
    await page.waitForTimeout(100);

    // Type bracket and partial column name that matches 'status'
    await page.keyboard.type('[sta');
    await page.waitForTimeout(300);

    // Check if autocomplete is visible
    const autocompletePanel = page.locator('.cm-tooltip-autocomplete');
    if (await autocompletePanel.isVisible()) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      const text = await getDocumentText(component);

      // Should complete to [status] without duplicate brackets
      expect(text).toMatch(/^\[status\]$/);
      expect(text).not.toContain(']]');
    }
  });

  test('should handle multiple column completions without bracket duplication', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor
        value=""
        columns={mockColumns}
      />
    );

    await component.click();
    await page.waitForTimeout(100);

    // Complete first column
    await page.keyboard.type('[');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter'); // Select first option
    await page.waitForTimeout(100);

    let text = await getDocumentText(component);
    expect(text).toMatch(/^\[\w+\]$/); // Should be a single column reference
    expect(text).not.toContain(']]');

    // Add operator and value
    await page.keyboard.type(' = "test"');
    await page.waitForTimeout(100);

    // Add AND operator
    await page.keyboard.type(' AND ');
    await page.waitForTimeout(100);

    // Complete second column
    await page.keyboard.type('[');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowDown'); // Move to second option
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    text = await getDocumentText(component);

    // Should have two column references, neither with duplicate brackets
    expect(text).not.toContain(']]');
    const columnMatches = text.match(/\[\w+\]/g);
    expect(columnMatches).toHaveLength(2);
  });

  test('should show correct options when typing in column context', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor
        value=""
        columns={mockColumns}
      />
    );

    await component.click();
    await page.waitForTimeout(100);

    // Type opening bracket
    await page.keyboard.type('[');
    await page.waitForTimeout(200);

    // Check that autocomplete shows column names
    const autocompletePanel = page.locator('.cm-tooltip-autocomplete');
    await expect(autocompletePanel).toBeVisible();

    // Check that it contains our columns
    const options = page.locator('.cm-completionLabel');
    const optionTexts = await options.allTextContents();

    expect(optionTexts).toContain('status');
    expect(optionTexts).toContain('priority');
    expect(optionTexts).toContain('count');
    expect(optionTexts).toContain('active');
  });

  test('should handle arrow key navigation without bracket issues', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor
        value=""
        columns={mockColumns}
      />
    );

    await component.click();
    await page.waitForTimeout(100);

    // Type bracket and navigate dropdown
    await page.keyboard.type('[');
    await page.waitForTimeout(200);

    // Navigate down in dropdown
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);

    // Select 'count' (third option)
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    const text = await getDocumentText(component);

    // Should be [count] without duplication
    expect(text).toBe('[count]');
    expect(text).not.toContain(']]');
  });

  test('should handle Escape to cancel autocomplete', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor
        value=""
        columns={mockColumns}
      />
    );

    await component.click();
    await page.waitForTimeout(100);

    // Type bracket to trigger autocomplete
    await page.keyboard.type('[sta');
    await page.waitForTimeout(200);

    const autocompletePanel = page.locator('.cm-tooltip-autocomplete');
    await expect(autocompletePanel).toBeVisible();

    // Press Escape to cancel
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Autocomplete should be hidden
    await expect(autocompletePanel).not.toBeVisible();

    // Text should remain as typed
    const text = await getDocumentText(component);
    expect(text).toBe('[sta');
  });

  test('should handle Tab to accept completion', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor
        value=""
        columns={mockColumns}
      />
    );

    await component.click();
    await page.waitForTimeout(100);

    // Type bracket
    await page.keyboard.type('[');
    await page.waitForTimeout(200);

    // Accept with Tab
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const text = await getDocumentText(component);

    // Should complete without bracket duplication
    expect(text).toBe('[status]');
    expect(text).not.toContain(']]');
  });

  test('should handle clicking on autocomplete option', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor
        value=""
        columns={mockColumns}
      />
    );

    await component.click();
    await page.waitForTimeout(100);

    // Type bracket
    await page.keyboard.type('[');
    await page.waitForTimeout(300);

    // Find and click on a specific option
    const priorityOption = page.locator('.cm-completionLabel', { hasText: 'priority' });
    await priorityOption.click();
    await page.waitForTimeout(100);

    const text = await getDocumentText(component);

    // Should be [priority] without duplication
    expect(text).toBe('[priority]');
    expect(text).not.toContain(']]');
  });
});
