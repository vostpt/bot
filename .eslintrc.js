module.exports = {
    env: {
        commonjs: true,
        es2021: true,
        node: true,
        'jest/globals': true
    },
    extends: [
        "eslint:recommended"
    ],
    globals: {
        Atomics: "readonly",
        SharedArrayBuffer: "readonly"
    },
    plugins: ["jest"],
    rules: {
        "no-unsafe-optional-chaining": "off",
        "no-console": ["error", { allow: ["warn", "error"] }],
        "max-len": ["warn", { "code": 300 }],
        "eol-last": ["error", "always"],
        "linebreak-style": "off"
    },
};