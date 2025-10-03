/**
 * Context detection for autocomplete and dropdown suggestions
 * Analyzes cursor position using ANTLR token stream to determine
 * what type of suggestions should be shown
 */

import { CharStream, CommonTokenStream, Token } from 'antlr4ng';
import { FiltersLexer } from '../../generated/FiltersLexer';
import { ColumnDef } from '../../types/column';

/**
 * Type of completion context
 */
export type CompletionContextType = 'column' | 'operator' | 'value' | 'logical';

/**
 * Completion context with position information
 */
export interface CompletionContext {
  /** Type of context */
  type: CompletionContextType;
  /** Start position for text replacement */
  from: number;
  /** Column ID if context is operator or value */
  columnId?: string;
  /** Column definition if columnId is found */
  column?: ColumnDef;
}

/**
 * Determine completion context at a given cursor position.
 * Uses ANTLR lexer to analyze token stream and identify context.
 *
 * @param text - The query text
 * @param pos - Cursor position (0-indexed)
 * @param columns - Schema of available columns
 * @returns CompletionContext or null if no context
 *
 * @example
 * ```ts
 * const context = getCompletionContext('[', 1, columns);
 * // Returns: { type: 'column', from: 0 }
 *
 * const context = getCompletionContext('[status] ', 9, columns);
 * // Returns: { type: 'operator', columnId: 'status', from: 9 }
 * ```
 */
export function getCompletionContext(
  text: string,
  pos: number,
  columns: ColumnDef[]
): CompletionContext | null {
  // Handle empty or whitespace-only input
  if (!text || text.trim().length === 0) {
    return { type: 'column', from: 0 };
  }

  // Handle cursor at start
  if (pos === 0) {
    return { type: 'column', from: 0 };
  }

  try {
    // Create lexer and tokenize
    const charStream = CharStream.fromString(text);
    const lexer = new FiltersLexer(charStream);
    lexer.removeErrorListeners(); // Suppress errors for partial input
    const tokenStream = new CommonTokenStream(lexer);
    tokenStream.fill();

    const tokens = tokenStream.getTokens();

    // Filter out EOF and whitespace tokens for analysis
    const meaningfulTokens = tokens.filter(
      t => t.type !== Token.EOF && t.type !== FiltersLexer.WS
    );

    // If no tokens yet, we're at the start
    if (meaningfulTokens.length === 0) {
      return { type: 'column', from: pos };
    }

    // Find the token at or before cursor position
    const tokenAtCursor = findTokenAtPosition(meaningfulTokens, pos);
    const tokenBeforeCursor = findTokenBeforePosition(meaningfulTokens, pos);

    // Case 1: Cursor inside a string literal - no suggestions
    if (tokenAtCursor && tokenAtCursor.type === FiltersLexer.STRING) {
      const tokenStart = tokenAtCursor.start;
      const tokenEnd = tokenAtCursor.stop + 1;
      if (pos > tokenStart && pos < tokenEnd) {
        return null; // Inside string, no autocomplete
      }
    }

    // Case 1b: Cursor at position where incomplete string exists
    // Check if we're after an operator and text is not a complete string
    if (text[pos - 1] === '"' && !text.substring(pos).includes('"')) {
      // Incomplete string, likely still typing
      return null;
    }

    // Case 2: Cursor at or inside a FIELD token (column reference)
    if (tokenAtCursor && tokenAtCursor.type === FiltersLexer.FIELD) {
      const tokenStart = tokenAtCursor.start;
      // If cursor is inside the field brackets, suggest columns
      return { type: 'column', from: tokenStart };
    }

    // Case 3: Just finished a FIELD token - suggest operators
    if (tokenBeforeCursor && tokenBeforeCursor.type === FiltersLexer.FIELD) {
      const columnId = extractColumnId(tokenBeforeCursor.text);
      const column = columns.find(c => c.id === columnId || c.name === columnId);

      return {
        type: 'operator',
        from: pos,
        columnId,
        column
      };
    }

    // Case 4: After an operator - suggest values
    if (tokenBeforeCursor && isOperatorToken(tokenBeforeCursor)) {
      // Find the field token that precedes this operator
      const fieldToken = findPrecedingFieldToken(meaningfulTokens, tokenBeforeCursor);
      if (fieldToken) {
        const columnId = extractColumnId(fieldToken.text);
        const column = columns.find(c => c.id === columnId || c.name === columnId);

        return {
          type: 'value',
          from: pos,
          columnId,
          column
        };
      }
    }

    // Case 5: After a complete condition (field + operator + value) - suggest logical operators
    if (tokenBeforeCursor && isValueToken(tokenBeforeCursor)) {
      // Check if we have a complete condition before this
      if (hasCompleteCondition(meaningfulTokens, pos)) {
        return {
          type: 'logical',
          from: pos
        };
      }
    }

    // Case 6: After a logical operator (AND/OR) - suggest columns
    if (tokenBeforeCursor && isLogicalOperator(tokenBeforeCursor)) {
      return { type: 'column', from: pos };
    }

    // Case 7: Starting fresh or at an ambiguous position
    // If we're at the beginning or after whitespace with no clear context
    if (pos === text.length || text[pos - 1] === ' ') {
      // Try to infer from previous tokens
      if (tokenBeforeCursor) {
        if (tokenBeforeCursor.type === FiltersLexer.FIELD) {
          const columnId = extractColumnId(tokenBeforeCursor.text);
          const column = columns.find(c => c.id === columnId || c.name === columnId);
          return { type: 'operator', from: pos, columnId, column };
        }
        if (isOperatorToken(tokenBeforeCursor)) {
          const fieldToken = findPrecedingFieldToken(meaningfulTokens, tokenBeforeCursor);
          if (fieldToken) {
            const columnId = extractColumnId(fieldToken.text);
            const column = columns.find(c => c.id === columnId || c.name === columnId);
            return { type: 'value', from: pos, columnId, column };
          }
        }
        if (isValueToken(tokenBeforeCursor) && hasCompleteCondition(meaningfulTokens, pos)) {
          return { type: 'logical', from: pos };
        }
      }
    }

    // Default: if nothing else matches, suggest columns
    return { type: 'column', from: pos };

  } catch (error) {
    // On any error during parsing, return null
    console.error('Context detection error:', error);
    return null;
  }
}

/**
 * Find token at exact position
 */
function findTokenAtPosition(tokens: Token[], pos: number): Token | null {
  for (const token of tokens) {
    if (pos >= token.start && pos <= token.stop + 1) {
      return token;
    }
  }
  return null;
}

/**
 * Find the last token before position
 */
function findTokenBeforePosition(tokens: Token[], pos: number): Token | null {
  let lastToken: Token | null = null;
  for (const token of tokens) {
    if (token.stop + 1 <= pos) {
      lastToken = token;
    } else {
      break;
    }
  }
  return lastToken;
}

/**
 * Extract column ID from FIELD token (removes brackets)
 */
function extractColumnId(fieldText: string | null | undefined): string {
  if (!fieldText) return '';
  // FIELD token is like "[columnId]"
  return fieldText.replace(/^\[|\]$/g, '');
}

/**
 * Check if token is an operator
 */
function isOperatorToken(token: Token): boolean {
  return (
    token.type === FiltersLexer.EQ ||
    token.type === FiltersLexer.EQ2 ||
    token.type === FiltersLexer.NEQ ||
    token.type === FiltersLexer.GT ||
    token.type === FiltersLexer.GE ||
    token.type === FiltersLexer.LT ||
    token.type === FiltersLexer.LE ||
    token.type === FiltersLexer.EQUALS ||
    token.type === FiltersLexer.CONTAINS ||
    token.type === FiltersLexer.GREATER ||
    token.type === FiltersLexer.LESS ||
    token.type === FiltersLexer.STARTS ||
    token.type === FiltersLexer.ENDS
  );
}

/**
 * Check if token is a value (string, number, boolean)
 */
function isValueToken(token: Token): boolean {
  return (
    token.type === FiltersLexer.STRING ||
    token.type === FiltersLexer.DIGITS ||
    token.type === FiltersLexer.TRUE ||
    token.type === FiltersLexer.FALSE
  );
}

/**
 * Check if token is a logical operator (AND/OR)
 */
function isLogicalOperator(token: Token): boolean {
  return token.type === FiltersLexer.AND || token.type === FiltersLexer.OR;
}

/**
 * Find the field token that precedes an operator
 */
function findPrecedingFieldToken(tokens: Token[], operatorToken: Token): Token | null {
  const operatorIndex = tokens.indexOf(operatorToken);
  if (operatorIndex <= 0) return null;

  // Look backwards for a FIELD token
  for (let i = operatorIndex - 1; i >= 0; i--) {
    if (tokens[i].type === FiltersLexer.FIELD) {
      return tokens[i];
    }
    // Stop if we hit a logical operator
    if (isLogicalOperator(tokens[i])) {
      break;
    }
  }
  return null;
}

/**
 * Check if there's a complete condition (field + operator + value) before position
 */
function hasCompleteCondition(tokens: Token[], pos: number): boolean {
  // A complete condition needs at least 3 tokens: FIELD, operator, value
  if (tokens.length < 3) return false;

  // Get tokens before position
  const tokensBeforePos = tokens.filter(t => t.stop + 1 <= pos);
  if (tokensBeforePos.length < 3) return false;

  // Check last 3 tokens form a pattern: FIELD, operator, value
  const last3 = tokensBeforePos.slice(-3);
  if (last3.length < 3) return false;

  return (
    last3[0].type === FiltersLexer.FIELD &&
    isOperatorToken(last3[1]) &&
    isValueToken(last3[2])
  );
}
