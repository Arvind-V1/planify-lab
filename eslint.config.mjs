// @ts-check
import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

const MAX_FUNCTION_LINES = 50;

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', '**/*.js'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    rules: {
      eqeqeq: 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'max-lines-per-function': [
        'error',
        { max: MAX_FUNCTION_LINES, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: ['src/cli.ts'],
    rules: { 'no-console': 'error' },
  },
);
