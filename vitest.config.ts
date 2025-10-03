import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // Changed from 'node' to support React components
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/generated/',
        '*.config.ts',
        'scripts/'
      ]
    },
    include: ['src/**/*.{test,spec}.{js,ts,tsx}'] // Added .tsx for component tests
  }
});