module.exports = {
  extends: "airbnb-base",
  rules: {
    "spaced-comment": "off",
    "no-underscore-dangle": "off",
    "no-param-reassign": ["error", { "props": false }],
    "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }],
    "max-len": ["warn", 100, 2, {
      ignoreUrls: true,
      ignoreComments: true,
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    }],
    // Babel handles mixed ES6 imports with module.exports fine
    "import/no-import-module-exports": "off",
    // Allow console in CLI application
    "no-console": "off",
    // Allow default params in any position (existing pattern)
    "default-param-last": "off",
  },
  env: {
    node: true,
    jest: true,
  }
}
