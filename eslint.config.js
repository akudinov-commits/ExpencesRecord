import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['**/dist/**', '**/node_modules/**', '.vercel/**', 'coverage/**', 'tests/architecture/fixtures/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: ['**/*.{ts,tsx}'] })),
  { languageOptions: { globals: globals.node } },
  { files: ['apps/web/src/**/*.{ts,tsx}', 'apps/web/test/**/*.{ts,tsx}'], languageOptions: { globals: globals.browser } },
  { files: ['apps/api/src/application/**/*.ts'], rules: { 'no-restricted-globals': ['error', 'process', 'fetch', 'window', 'localStorage'] } },
];
