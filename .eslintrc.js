const path = require('path');

module.exports = {
  extends: 'airbnb-base',
  plugins: [
    'jsdoc',
  ],
  rules: {
    'spaced-comment': 'off',
    'no-underscore-dangle': 'off',
    'no-param-reassign': ['error', { 'props': false }],
    'no-plusplus': ['error', { 'allowForLoopAfterthoughts': true }],
    'max-len': ['warn', 100, 2, {
      ignoreUrls: true,
      ignoreComments: true,
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    }],
    'jsdoc/check-param-names': 'warn',
    'jsdoc/check-tag-names': 'warn',
    'jsdoc/check-types': 'warn',
    'jsdoc/newline-after-description': 'warn',
    'jsdoc/no-undefined-types': 'warn',
    'jsdoc/require-description-complete-sentence': 'warn',
    'jsdoc/require-example': 'off',
    'jsdoc/require-hyphen-before-param-description': 'warn',
    'jsdoc/require-param': 'warn',
    'jsdoc/require-param-description': 'warn',
    'jsdoc/require-param-name': 'warn',
    'jsdoc/require-param-type': 'warn',
    'jsdoc/require-returns-description': 'warn',
    'jsdoc/require-returns-type': 'warn',
    'jsdoc/valid-types': 'warn',
  },
  env: {
    node: true,
    mocha: true,
  },
  settings: {
    'import/resolver': {
      alias: [
        ['@root', path.resolve(__dirname, 'src')],
        ['@commands', path.resolve(__dirname, 'src/commands')],
        ['@db', path.resolve(__dirname, 'src/db')],
        ['@lib', path.resolve(__dirname, 'src/lib')],
        ['@model', path.resolve(__dirname, 'src/model')],
        ['@utils', path.resolve(__dirname, 'src/utils')],
      ],
    }
  }
}
