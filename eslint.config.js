import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      'spaced-comment': 'off',
      'no-underscore-dangle': 'off',
      'no-param-reassign': 'off',
      'no-plusplus': 'off',
      'max-len': ['warn', 100, 2, {
        ignoreUrls: true,
        ignoreComments: true,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      }],
      'no-console': 'off',
      'default-param-last': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['dist/', 'coverage/', 'node_modules/'],
  },
];
