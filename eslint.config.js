const base = require('@creo-team/eslint-config')

module.exports = [
  ...base,
  { ignores: ['eslint.config.js', 'vitest.config.ts'] },
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        { format: ['camelCase'], selector: 'default' },
        { format: ['camelCase', 'PascalCase', 'UPPER_CASE'], selector: 'variable' },
        { format: ['PascalCase'], selector: 'typeLike' },
        { format: ['PascalCase'], selector: 'enumMember' },
        { format: null, selector: 'objectLiteralProperty' },
        { format: null, selector: 'typeProperty' },
        { format: ['camelCase'], selector: 'parameter', filter: { regex: '^_', match: false } },
        { format: null, selector: 'parameter', filter: { regex: '^_', match: true } },
      ],
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      'max-lines': ['warn', { max: 500 }],
      'max-lines-per-function': ['warn', { max: 300 }],
      'perfectionist/sort-objects': 'off',
      'perfectionist/sort-interfaces': 'off',
    },
  },
  {
    files: ['**/__tests__/**/*.ts'],
    rules: {
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-yields': 'off',
    },
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-description-complete-sentence': 'off',
      'complexity': 'off',
    },
  },
  {
    files: ['src/index.ts'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
    },
  },
]
