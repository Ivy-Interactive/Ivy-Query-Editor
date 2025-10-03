# Testing Guide

This project uses a dual testing strategy:
- **Vitest** for unit tests (parser, formatter, evaluator)
- **Playwright** for component tests (React components with CodeMirror in real browsers)

## Running Tests

### All Tests
```bash
npm run test:all
```

### Unit Tests (Vitest)
```bash
# Run once
npm run test:unit

# Watch mode
npm test

# With coverage
npm run test:coverage
```

### Component Tests (Playwright)
```bash
# Run in headless mode
npm run test:component

# Run with UI (interactive)
npm run test:component:ui

# Run in debug mode (step-by-step)
npm run test:component:debug

# Run specific browser
npm run test:component -- --project=chromium
npm run test:component -- --project=firefox
npm run test:component -- --project=webkit
```

## Test Structure

### Unit Tests (Vitest + jsdom)
- `src/__tests__/parser.test.ts` - Parser and AST builder tests
- `src/__tests__/formatter.test.ts` - Query formatter tests
- `src/__tests__/evaluator.test.ts` - Filter evaluator tests
- `src/__tests__/validator.test.ts` - Semantic validation tests

**Total: 111 tests**

### Component Tests (Playwright)
- `src/components/__tests__/QueryEditor.playwright.tsx` - React component tests in real browser

**Total: 16 tests**

Tests include:
- ✅ Rendering and display
- ✅ Text input and typing
- ✅ Read-only mode
- ✅ Syntax highlighting
- ✅ Validation errors
- ✅ Auto-formatting on blur
- ✅ Keyboard shortcuts (Cmd+Shift+F)
- ✅ Theme switching (light/dark)
- ✅ onChange callbacks
- ✅ Custom height (number/string)
- ✅ Single-line enforcement (no line breaks)

## Why Two Test Frameworks?

### Vitest (jsdom)
- ✅ Fast execution
- ✅ Great for logic/algorithms
- ✅ Works well for headless testing
- ❌ Cannot fully emulate CodeMirror DOM APIs

### Playwright
- ✅ Real browser environment
- ✅ Full CodeMirror functionality
- ✅ Tests actual user interactions
- ✅ Visual regression testing capability
- ❌ Slower than unit tests

## Test Results Summary

**Unit Tests:** ✅ 111/111 passing  
**Component Tests:** ✅ 16/16 passing (Chromium)

**Total:** ✅ 127/127 tests passing

## Continuous Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Run unit tests
  run: npm run test:unit

- name: Run component tests
  run: npm run test:component -- --project=chromium
```

## Writing New Tests

### Unit Test (Vitest)
```typescript
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expectedValue);
  });
});
```

### Component Test (Playwright)
```typescript
import { test, expect } from '@playwright/experimental-ct-react';

test('should render component', async ({ mount }) => {
  const component = await mount(<MyComponent />);
  await expect(component).toBeVisible();
});
```

## Troubleshooting

### "jest is not defined"
- You're using Jest syntax in Vitest tests
- Replace `jest.fn()` with `vi.fn()`
- Replace `jest.mock()` with `vi.mock()`
- Import: `import { vi } from 'vitest'`

### "getClientRects is not a function" (jsdom)
- CodeMirror needs real browser APIs
- Use Playwright tests for CodeMirror components
- Keep Vitest for logic/algorithms

### Component tests not found
- Ensure `playwright.config.ts` has correct `testMatch` pattern
- Component tests use `.playwright.tsx` extension
- Unit tests use `.test.ts` extension

### Browser not installed
```bash
npx playwright install chromium
```

## Coverage Reports

Run with coverage:
```bash
npm run test:coverage
```

View HTML report:
```bash
open coverage/index.html
```
