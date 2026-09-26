import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'dist-single/**', 'release/**', 'android/**', 'ios/**', 'coverage/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'tests/**/*.js', '*.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser, ...globals.node } },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
  // src/core must stay pure: no DOM, no Three.js, so it runs in Node tests.
  {
    files: ['src/core/**/*.js'],
    languageOptions: { globals: { ...globals.es2022 } },
    rules: {
      'no-restricted-imports': ['error', { paths: [{ name: 'three', message: 'src/core must stay renderer-free.' }] }],
      'no-restricted-globals': ['error', 'document', 'window', 'localStorage', 'requestAnimationFrame'],
    },
  },
  { files: ['electron/**/*.cjs'], languageOptions: { sourceType: 'commonjs', globals: globals.node } },
];
