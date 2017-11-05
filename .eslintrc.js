module.exports = {
  extends: "airbnb-base",
  rules: {
    "no-console": "off",
    "spaced-comment": "off",
    "no-underscore-dangle": "off",
    "no-param-reassign": ["error", { "props": false }],
    "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }],
  },
  env: {
    node: true,
    mocha: true,
  }
}
