module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  parserOptions: {
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
  ],
  rules: {
    'indent': [2, 2, { SwitchCase: 1 }],
    'no-plusplus': 'off',
    'no-param-reassign': 'off',
    'no-void': 'off',
    'no-nested-ternary': 'off',
    'max-classes-per-file': 'off',
    'object-curly-spacing': ['error', 'always'],
    'space-in-parens': ['error', 'never'],
    'no-shadow': 'off',
    'import/first': 'off',
    'import/named': 'error',
    'import/namespace': 'error',
    'import/default': 'error',
    'import/export': 'error',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',

    'prefer-promise-reject-errors': 'off',

    'quotes': ['warn', 'single', { avoidEscape: true }],
    'semi': ['error', 'never', { beforeStatementContinuationChars: 'never' }],
    'max-len': ['error', { code: 350 }],
    'vue/multi-word-component-names': 'off',
    'default-case': 'off',
    'no-return-assign': 'off',
    '@typescript-eslint/no-shadow': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'object-curly-newline': 'off',
    'no-use-before-define': 'off',
    'class-methods-use-this': 'off',
    '@typescript-eslint/no-unused-vars': 'off',

    // this rule, if on, would require explicit return type on the `render` function
    '@typescript-eslint/explicit-function-return-type': 'off',

    // in plain CommonJS modules, you can't use `import foo = require('foo')` to pass this rule, so it has to be disabled
    '@typescript-eslint/no-var-requires': 'off',

    // The core 'no-unused-vars' rules (in the eslint:recommended ruleset)
    // does not work with type definitions
    'no-unused-vars': 'off',

    // allow debugger during development only
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  },
}
