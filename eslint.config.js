import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'backend-patch/**', 'test-results/**', 'playwright-report/**', '*.timestamp-*.mjs'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['src/**/*.{ts,tsx}'], plugins: { 'react-hooks': hooks }, rules: { 'react-hooks/rules-of-hooks': 'error', '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^(React|_)' }], 'no-empty': ['error', { allowEmptyCatch: true }] } },
  { files: ['**/*.{mjs,js}'], languageOptions: { globals: { console: 'readonly', process: 'readonly', setTimeout: 'readonly', fetch: 'readonly', URL: 'readonly', Buffer: 'readonly', AbortController: 'readonly' } } }
);
