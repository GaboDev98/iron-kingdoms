import { defineConfig } from 'vitest/config';

// Unit tests cover the pure rules in src/core and the content in src/data.js.
// The Three.js runtime (src/game.js) is covered by the Playwright E2E suite instead.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/data.js'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: { lines: 90, functions: 90, branches: 80, statements: 90 },
    },
  },
});
