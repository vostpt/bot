module.exports = {
    env: {
        commonjs: true,
        es2021: true,
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
    plugins: ["jest"],
    rules: {
        "linebreak-style": "off",
        "no-unsafe-optional-chaining": "off",
        "no-console": ["error", { allow: ["warn", "error"] }],
        "max-len": ["warn", { "code": 300 }],
    },
};