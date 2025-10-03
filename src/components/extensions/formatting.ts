/**
 * Auto-formatting extension for CodeMirror
 * Formats query text on blur or via keyboard shortcut
 */

import { Extension } from '@codemirror/state';
import { EditorView, ViewPlugin, ViewUpdate, keymap } from '@codemirror/view';
import { ColumnDef } from '../../types/column';
import { formatQueryString } from '../../formatter/QueryFormatter';

/**
 * Format the current document
 */
function formatDocument(view: EditorView, columns: ColumnDef[]): boolean {
  const text = view.state.doc.toString();

  // Skip formatting for empty text
  if (!text.trim()) {
    return false;
  }

  try {
    // Format the query
    const formatted = formatQueryString(text, columns);

    // Only update if the text changed
    if (formatted !== text) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: formatted,
        },
      });
    }

    return true;
  } catch (error) {
    // Silently ignore formatting errors
    // The validation extension will show the actual errors
    return false;
  }
}

/**
 * ViewPlugin that handles auto-formatting on blur
 */
class FormattingPlugin {
  private formatOnBlur: boolean;
  private lastFormattedText: string = '';

  constructor(
    private view: EditorView,
    private columns: ColumnDef[],
    options: { formatOnBlur?: boolean } = {}
  ) {
    this.formatOnBlur = options.formatOnBlur !== false;  // Default to true
  }

  update(update: ViewUpdate) {
    // Format on blur if enabled
    if (this.formatOnBlur && update.focusChanged && !update.view.hasFocus) {
      const currentText = update.view.state.doc.toString();

      // Only format if text changed since last format
      if (currentText !== this.lastFormattedText) {
        if (formatDocument(update.view, this.columns)) {
          this.lastFormattedText = update.view.state.doc.toString();
        }
      }
    }
  }

  destroy() {
    // Cleanup if needed
  }
}

/**
 * Create keyboard shortcuts for formatting
 */
function createFormatKeymap(columns: ColumnDef[]) {
  return keymap.of([
    {
      // Cmd/Ctrl + Shift + F to format
      key: 'Mod-Shift-f',
      preventDefault: true,
      run: (view) => {
        formatDocument(view, columns);
        return true;
      },
    },
    {
      // Alt + Shift + F (VSCode format shortcut)
      key: 'Alt-Shift-f',
      preventDefault: true,
      run: (view) => {
        formatDocument(view, columns);
        return true;
      },
    },
  ]);
}

/**
 * Create auto-formatting extension
 * Formats on blur and provides keyboard shortcuts
 */
export function createFormattingExtension(
  columns: ColumnDef[],
  options: { formatOnBlur?: boolean } = {}
): Extension {
  return [
    // ViewPlugin for auto-format on blur
    ViewPlugin.define(
      (view) => new FormattingPlugin(view, columns, options),
    ),

    // Keyboard shortcuts for manual formatting
    createFormatKeymap(columns),

    // Visual feedback for formatting
    EditorView.domEventHandlers({
      // Optional: Add visual feedback when formatting
      keydown: (event, view) => {
        // Check if format shortcut was pressed
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'f') {
          // Could add a brief flash or indicator here
          return false;
        }
        return false;
      },
    }),
  ];
}