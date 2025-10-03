/**
 * Validation extension for CodeMirror
 * Provides real-time error highlighting and diagnostics
 */

import { Extension } from '@codemirror/state';
import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { linter, Diagnostic } from '@codemirror/lint';
import { ColumnDef } from '../../types/column';
import { parseQuery } from '../../parser/QueryParser';
import { ParseError } from '../../types/parser';

/**
 * Convert parse errors to CodeMirror diagnostics
 */
function errorToDiagnostic(error: ParseError, doc: any): Diagnostic {
  // Calculate positions
  const from = Math.min(error.start, doc.length);
  const to = Math.min(error.end || error.start + 1, doc.length);

  return {
    from,
    to,
    severity: 'error',
    message: error.message,
  };
}

/**
 * Create linter for query validation
 */
function createQueryLinter(columns: ColumnDef[]) {
  return linter(async (view) => {
    const text = view.state.doc.toString();

    // Skip validation for empty text
    if (!text.trim()) {
      return [];
    }

    // Parse and validate
    const result = parseQuery(text, columns);

    // Convert errors to diagnostics
    if (result.errors && result.errors.length > 0) {
      return result.errors.map(error => errorToDiagnostic(error, view.state.doc));
    }

    return [];
  }, {
    delay: 300,  // Debounce validation by 300ms
  });
}

/**
 * ViewPlugin for managing error decorations (underlines)
 */
class ValidationPlugin {
  decorations: DecorationSet;
  private timeoutId: number | null = null;

  constructor(private view: EditorView, private columns: ColumnDef[]) {
    this.decorations = this.computeDecorations();
  }

  private computeDecorations(): DecorationSet {
    const text = this.view.state.doc.toString();

    // Skip for empty text
    if (!text.trim()) {
      return Decoration.none;
    }

    const result = parseQuery(text, this.columns);

    if (!result.errors || result.errors.length === 0) {
      return Decoration.none;
    }

    // Create error underline decorations
    const decorations: Array<ReturnType<ReturnType<typeof Decoration.mark>['range']>> = [];

    for (const error of result.errors) {
      const from = Math.min(error.start, this.view.state.doc.length);
      let to = Math.min(error.end || error.start + 1, this.view.state.doc.length);

      // Ensure we never create an empty decoration
      if (to <= from) {
        to = Math.min(from + 1, this.view.state.doc.length);
      }

      // Skip if still invalid (e.g., at the very end of an empty document)
      if (from >= this.view.state.doc.length || to <= from) {
        continue;
      }

      decorations.push(Decoration.mark({
        class: 'cm-query-error',
        attributes: {
          title: error.message,
        },
      }).range(from, to));
    }

    return Decoration.set(decorations);
  }

  update(update: ViewUpdate) {
    if (update.docChanged) {
      // Debounce validation updates
      if (this.timeoutId !== null) {
        clearTimeout(this.timeoutId);
      }

      this.timeoutId = window.setTimeout(() => {
        this.decorations = this.computeDecorations();
        this.view.update([]);  // Force view update
        this.timeoutId = null;
      }, 300);
    }
  }

  destroy() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
  }
}

/**
 * Create validation extension with linting and error highlighting
 */
export function createValidationExtension(columns: ColumnDef[]): Extension {
  return [
    // Linter for showing diagnostics in the gutter
    createQueryLinter(columns),

    // ViewPlugin for error underlines
    ViewPlugin.define(
      (view) => new ValidationPlugin(view, columns),
      {
        decorations: (plugin) => plugin.decorations,
      }
    ),

    // CSS styles for error highlighting
    EditorView.baseTheme({
      '.cm-query-error': {
        textDecoration: 'underline wavy red',
        textUnderlineOffset: '3px',
      },
      '.cm-lintRange-error': {
        backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="6" height="3"><path d="m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0" stroke="%23d73a49" fill="none" stroke-width=".7"/></svg>')`,
        backgroundPosition: 'left bottom',
        backgroundRepeat: 'repeat-x',
        paddingBottom: '3px',
      },
      '.cm-diagnostic-error': {
        borderLeft: '3px solid #d73a49',
      },
      '.cm-tooltip.cm-tooltip-lint': {
        backgroundColor: '#fafafa',
        border: '1px solid #e1e4e8',
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '13px',
      },
    }),
  ];
}