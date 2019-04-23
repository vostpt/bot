module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
    'jest/globals': true
  },
  extends: [
    "airbnb-base",
    "plugin:jest/recommended",
  ],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  "plugins": ["jest"]
  // "rules": {
  //   "prettier/prettier": "error",
  // },
};
