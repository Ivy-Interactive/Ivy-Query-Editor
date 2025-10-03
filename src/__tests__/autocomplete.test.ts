/**
 * Tests for autocomplete extension
 * Note: These tests verify the extension can be created and integrated.
 * Full autocomplete behavior testing requires EditorView and is better done
 * via component tests with Playwright.
 */

import { describe, test, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { autocompleteExtension } from '../components/extensions/autocomplete';
import type { ColumnDef } from '../types/column';

const testColumns: ColumnDef[] = [
  { id: 'age', type: 'number' },
  { id: 'name', type: 'string' },
  { id: 'status', type: 'enum', enumValues: ['active', 'inactive'] },
];

describe('Autocomplete Extension', () => {
  test('can be added to editor state without errors', () => {
    expect(() => {
      EditorState.create({
        doc: '[',
        selection: { anchor: 1 },
        extensions: [autocompleteExtension(testColumns)],
      });
    }).not.toThrow();
  });

  test('works with different column types', () => {
    expect(() => {
      EditorState.create({
        doc: '[age] ',
        extensions: [autocompleteExtension(testColumns)],
      });
    }).not.toThrow();
  });

  test('works with enum columns', () => {
    expect(() => {
      EditorState.create({
        doc: '[status] equals ',
        extensions: [autocompleteExtension(testColumns)],
      });
    }).not.toThrow();
  });

  test('works with empty document', () => {
    expect(() => {
      EditorState.create({
        doc: '',
        extensions: [autocompleteExtension(testColumns)],
      });
    }).not.toThrow();
  });

  test('handles large column sets', () => {
    const largeColumns: ColumnDef[] = Array.from({ length: 100 }, (_, i) => ({
      id: `column${i}`,
      type: 'string' as const,
    }));

    expect(() => {
      EditorState.create({
        doc: '[col',
        extensions: [autocompleteExtension(largeColumns)],
      });
    }).not.toThrow();
  });
});
