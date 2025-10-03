import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Use node for unit tests only
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/generated/',
        '*.config.ts',
        'scripts/',
        'src/components/**' // Exclude components - tested with Playwright
      ]
    },
    include: ['src/**/*.{test,spec}.{js,ts}'], // Only .ts files (not .tsx)
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.playwright.{ts,tsx}', // Exclude Playwright tests
      '**/src/components/**' // Exclude component tests
    ]
  }
});