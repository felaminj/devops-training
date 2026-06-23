module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  extends: [
    '../../.eslintrc.cjs',
    'plugin:vue/vue3-recommended',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
    extraFileExtensions: ['.vue'],
  },
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/max-attributes-per-line': 'off',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.d.ts'],
};
