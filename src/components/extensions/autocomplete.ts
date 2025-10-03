/**
 * CodeMirror 6 autocomplete extension
 * Provides context-aware autocompletion for filter queries
 */

import { Extension } from '@codemirror/state';
import {
  autocompletion,
  CompletionContext,
  CompletionResult,
  Completion
} from '@codemirror/autocomplete';
import { ColumnDef } from '../../types/column';
import { getCompletionContext, CompletionContextType } from './completion-context';
import { getOperatorsForType } from './operator-mapping';

/**
 * Create autocomplete extension for filter queries
 *
 * @param columns - Schema of available columns
 * @returns CodeMirror 6 extension
 *
 * @example
 * ```ts
 * const extensions = [
 *   autocompleteExtension(columns)
 * ];
 * ```
 */
export function autocompleteExtension(columns: ColumnDef[]): Extension {
  return autocompletion({
    activateOnTyping: true,
    override: [createCompletionSource(columns)],
    maxRenderedOptions: 20,
    closeOnBlur: true,
  });
}

/**
 * Create completion source function
 */
function createCompletionSource(columns: ColumnDef[]) {
  return async (context: CompletionContext): Promise<CompletionResult | null> => {
    const { state, pos, explicit } = context;
    const text = state.doc.toString();

    // Get completion context at cursor position
    const completionCtx = getCompletionContext(text, pos, columns);

    if (!completionCtx) {
      return null; // No suggestions
    }

    const { type, from, columnId, column } = completionCtx;

    // Generate completions based on context type
    let options: Completion[] = [];
    let replaceFrom = from;

    switch (type) {
      case 'column':
        const columnResult = getColumnCompletions(columns, text, from);
        options = columnResult.options;
        replaceFrom = columnResult.from;
        break;

      case 'operator':
        if (column) {
          options = getOperatorCompletions(column);
        }
        break;

      case 'value':
        if (column) {
          options = getValueCompletions(column);
        }
        break;

      case 'logical':
        options = getLogicalCompletions();
        break;
    }

    if (options.length === 0) {
      return null;
    }

    return {
      from: replaceFrom,
      options,
      validFor: /^[\w\[\]"<>=\s]*$/, // Re-evaluate completions on these characters
    };
  };
}

/**
 * Get column completions
 */
function getColumnCompletions(
  columns: ColumnDef[],
  text: string,
  from: number
): { options: Completion[]; from: number } {
  // Look backwards from 'from' position to find the actual start of the token
  let tokenStart = from;
  let tokenEnd = from;

  // Check if there's a '[' before the cursor and find its range
  for (let i = from - 1; i >= 0; i--) {
    const char = text[i];
    if (char === '[') {
      tokenStart = i;
      // Now look forward to see if there's a closing ']'
      for (let j = from; j < text.length; j++) {
        const forwardChar = text[j];
        if (forwardChar === ']') {
          tokenEnd = j + 1; // Include the ']'
          break;
        }
        if (forwardChar === ' ' || forwardChar === ')' || forwardChar === '(') {
          break;
        }
      }
      break;
    }
    if (char === ' ' || char === ')' || char === '(' || i === 0) {
      // Hit whitespace or start, check if current position has text
      if (i === 0 && char !== ' ' && char !== '[') {
        tokenStart = i;
      }
      break;
    }
  }

  // Extract the partial text (including any letters typed)
  const partialText = text.substring(tokenStart, from);
  const hasBracket = partialText.startsWith('[');
  const filter = hasBracket ? partialText.substring(1).toLowerCase() : partialText.toLowerCase();

  const options = columns
    .filter(col => {
      // Filter by partial match if any
      if (filter) {
        return (
          col.id.toLowerCase().includes(filter) ||
          col.name?.toLowerCase().includes(filter)
        );
      }
      return true;
    })
    .map(col => ({
      label: `[${col.id}]`,
      type: 'variable',
      detail: col.displayName || col.type,
      apply: (view: any, completion: any, from: any, to: any) => {
        // Replace from tokenStart to tokenEnd to handle incomplete brackets
        view.dispatch({
          changes: { from: tokenStart, to: tokenEnd, insert: `[${col.id}] ` },
          selection: { anchor: tokenStart + col.id.length + 3 }, // Position after "] "
        });
      },
      boost: col.id.toLowerCase().startsWith(filter) ? 2 : 1, // Boost prefix matches
    }))
    .sort((a, b) => {
      // Sort by boost first, then alphabetically
      if (a.boost !== b.boost) {
        return (b.boost || 0) - (a.boost || 0);
      }
      return a.label.localeCompare(b.label);
    });

  return { options, from: tokenStart };
}

/**
 * Get operator completions
 */
function getOperatorCompletions(column: ColumnDef): Completion[] {
  const operators = getOperatorsForType(column.type);

  return operators.map(op => ({
    label: op.label || op.symbol,
    type: 'keyword',
    detail: op.functionName,
    apply: ` ${op.symbol} `,
  }));
}

/**
 * Get value completions
 */
function getValueCompletions(column: ColumnDef): Completion[] {
  const completions: Completion[] = [];

  switch (column.type) {
    case 'enum':
      // Show enum values
      if (column.enumValues && column.enumValues.length > 0) {
        column.enumValues.forEach(value => {
          completions.push({
            label: `"${value}"`,
            type: 'text',
            apply: `"${value}" `,
          });
        });
      } else {
        // Fallback to empty string snippet
        completions.push({
          label: '""',
          type: 'text',
          info: 'Enter a value',
          apply: (view, completion, from, to) => {
            view.dispatch({
              changes: { from, to, insert: '""' },
              selection: { anchor: from + 1 }, // Position cursor inside quotes
            });
          },
        });
      }
      break;

    case 'boolean':
      // Show true/false
      completions.push(
        {
          label: 'true',
          type: 'keyword',
          apply: 'true ',
        },
        {
          label: 'false',
          type: 'keyword',
          apply: 'false ',
        }
      );
      break;

    case 'string':
      // Show empty string snippet with cursor inside
      completions.push({
        label: '""',
        type: 'text',
        info: 'Enter a string value',
        apply: (view, completion, from, to) => {
          view.dispatch({
            changes: { from, to, insert: '""' },
            selection: { anchor: from + 1 }, // Position cursor inside quotes
          });
        },
      });
      break;

    case 'number':
      // Show placeholder
      completions.push({
        label: 'number',
        type: 'text',
        info: 'Enter a numeric value',
        apply: '', // No actual insertion, just a hint
      });
      break;

    case 'date':
      // Show date placeholder
      completions.push({
        label: '"YYYY-MM-DD"',
        type: 'text',
        info: 'Enter a date',
        apply: (view, completion, from, to) => {
          view.dispatch({
            changes: { from, to, insert: '""' },
            selection: { anchor: from + 1 }, // Position cursor inside quotes
          });
        },
      });
      break;
  }

  return completions;
}

/**
 * Get logical operator completions
 */
function getLogicalCompletions(): Completion[] {
  return [
    {
      label: 'AND',
      type: 'keyword',
      apply: ' AND ',
    },
    {
      label: 'OR',
      type: 'keyword',
      apply: ' OR ',
    },
  ];
}
