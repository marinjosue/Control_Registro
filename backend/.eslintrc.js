module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    // Reglas personalizadas para tu proyecto
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'no-undef': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'quote-props': ['error', 'as-needed'],
    'no-array-constructor': 'error',
    'prefer-template': 'error',
    'template-curly-spacing': 'error',
    'prefer-rest-params': 'error',
    'no-new-func': 'error',
    'space-before-function-paren': ['error', 'never'],
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'prefer-destructuring': 'error',
    'object-curly-spacing': ['error', 'always'],
    'max-len': ['error', { code: 120 }],
    complexity: ['error', 10]
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '*.min.js',
    'migrations/'
  ]
}
