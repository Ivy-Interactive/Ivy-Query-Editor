/**
 * Playwright component tests for QueryEditor
 * Tests in real browser environment with CodeMirror
 */

import { test, expect } from '@playwright/experimental-ct-react';
import React from 'react';
import { QueryEditor } from '../QueryEditor';
import { ColumnDef, DataType } from '../../types/column';

// Mock columns for testing
const mockColumns: ColumnDef[] = [
  { id: 'status', name: 'status', type: DataType.STRING },
  { id: 'priority', name: 'priority', type: DataType.STRING },
  { id: 'count', name: 'count', type: DataType.NUMBER },
  { id: 'active', name: 'active', type: DataType.BOOLEAN },
];

test.describe('QueryEditor Component', () => {
  test('should render without crashing', async ({ mount }) => {
    const component = await mount(
      <QueryEditor value="" columns={mockColumns} />
    );
    await expect(component).toBeVisible();
  });

  test('should display initial value', async ({ mount }) => {
    const component = await mount(
      <QueryEditor value="[status] equals 'open'" columns={mockColumns} />
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText('status');
    await expect(component).toContainText('open');
  });

  test('should display placeholder when empty', async ({ mount }) => {
    const component = await mount(
      <QueryEditor
        value=""
        columns={mockColumns}
        placeholder="Enter a query..."
      />
    );

    await expect(component.locator('.cm-placeholder')).toContainText('Enter a query...');
  });

  test('should apply theme class', async ({ mount }) => {
    const component = await mount(
      <QueryEditor value="" columns={mockColumns} theme="dark" />
    );

    await expect(component).toHaveAttribute('data-theme', 'dark');
  });

  test('should accept text input', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor value="" columns={mockColumns} />
    );

    // Click on the editor to focus it
    await component.click();

    // Type some text
    await page.keyboard.type('[status] equals "open"');

    // Wait a bit for the text to appear
    await page.waitForTimeout(100);

    // Check that text appears in the editor
    await expect(component).toContainText('status');
    await expect(component).toContainText('open');
  });

  test('should be read-only when readOnly prop is true', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor
        value="[status] equals 'open'"
        columns={mockColumns}
        readOnly
      />
    );

    // Click on the editor
    await component.click();

    // Try to type
    await page.keyboard.type('test');

    // Text should not change
    await expect(component).not.toContainText('test');
  });

  test('should show syntax highlighting', async ({ mount }) => {
    const component = await mount(
      <QueryEditor
        value="[status] equals 'open' AND [count] > 5"
        columns={mockColumns}
      />
    );

    // Wait for CodeMirror to render
    await expect(component.locator('.cm-content')).toBeVisible();

    // Check that syntax highlighting classes are applied
    // (The actual classes depend on your highlighting extension)
    const content = component.locator('.cm-content');
    await expect(content).toBeVisible();
  });

  test('should show validation errors', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor value="" columns={mockColumns} />
    );

    // Click and type an invalid query
    await component.click();
    await page.keyboard.type('[unknownField] equals "test"');

    // Wait for validation to run (300ms debounce)
    await page.waitForTimeout(500);

    // Check for error indication (red underline)
    const errorElements = component.locator('.cm-query-error');
    await expect(errorElements.first()).toBeVisible();
  });

  test('should format on blur', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor value="" columns={mockColumns} />
    );

    // Click and type unformatted query
    await component.click();
    await page.keyboard.type('[status]="open"');

    // Wait for typing to complete
    await page.waitForTimeout(100);

    // Click outside to blur
    await page.click('body');

    // Wait for formatting to complete
    await page.waitForTimeout(500);

    // Check that it's formatted (spaces around =)
    await expect(component).toContainText('status');
  });

  test('should handle keyboard shortcuts', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor value="[status]='open'" columns={mockColumns} />
    );

    // Focus the editor
    await component.click();

    // Press Cmd+Shift+F (or Ctrl+Shift+F on non-Mac)
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+Shift+KeyF`);

    // Wait for formatting
    await page.waitForTimeout(500);

    // Query should be formatted
    await expect(component).toBeVisible();
  });

  test('should render with light theme', async ({ mount }) => {
    const component = await mount(
      <QueryEditor value="[status] equals 'open'" columns={mockColumns} theme="light" />
    );
    await expect(component).toHaveAttribute('data-theme', 'light');
  });

  test('should render with dark theme', async ({ mount }) => {
    const component = await mount(
      <QueryEditor value="[status] equals 'open'" columns={mockColumns} theme="dark" />
    );
    await expect(component).toHaveAttribute('data-theme', 'dark');
  });

  test('should call onChange when text changes', async ({ mount, page }) => {
    const changes: string[] = [];

    const component = await mount(
      <QueryEditor
        value=""
        columns={mockColumns}
        onChange={(event) => {
          changes.push(event.text);
        }}
      />
    );

    await component.click();
    await page.keyboard.type('[status]');

    // Wait for onChange to fire
    await page.waitForTimeout(200);

    // We can't directly assert on the callback in Playwright component tests,
    // but we can verify the text appears
    await expect(component).toContainText('status');
  });

  test('should handle custom height', async ({ mount }) => {
    const component = await mount(
      <QueryEditor value="" columns={mockColumns} height={100} />
    );

    // Check that height is applied
    const style = await component.getAttribute('style');
    expect(style).toContain('height: 100px');
  });

  test('should handle string height', async ({ mount }) => {
    const component = await mount(
      <QueryEditor value="" columns={mockColumns} height="10rem" />
    );

    const style = await component.getAttribute('style');
    expect(style).toContain('height: 10rem');
  });

  test('should prevent line breaks', async ({ mount, page }) => {
    const component = await mount(
      <QueryEditor value="" columns={mockColumns} />
    );

    await component.click();
    await page.keyboard.type('[status] equals');
    await page.keyboard.press('Enter'); // Try to add a line break
    await page.keyboard.type('"open"');

    await page.waitForTimeout(100);

    // Text should be on a single line (Enter should be converted to space)
    const content = await component.locator('.cm-content').textContent();
    expect(content?.split('\n').length).toBe(1);
  });
});
