import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['build/', 'dist/', 'node_modules/']
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{js,jsx,ts,tsx}'],

    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },

    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefresh,
      'simple-import-sort': simpleImportSort
    },

    settings: {
      react: {
        version: 'detect'
      }
    },

    rules: {
      // Enforce the project's 5-tier import hierarchy:
      // 1) React core  2) external npm  3) absolute @ aliases
      // 4) local utils/shared + relative  5) styles
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^react$', '^react/', '^react-dom'],
            ['^@?\\w'],
            [
              '^@/',
              '^@components',
              '^@pages',
              '^@contexts',
              '^@hooks',
              '^@constants',
              '^@app-types'
            ],
            ['^@utils', '^@shared', '^\\.'],
            ['^.+\\.css$']
          ]
        }
      ],
      'simple-import-sort/exports': 'error',

      'react/prop-types': 'off',
      'react/display-name': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      'react/jsx-key': 'error',
      'react/jsx-no-target-blank': ['error', { allowReferrer: false }],
      'react/no-array-index-key': 'warn',

      'react/jsx-uses-vars': 'error',

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps':
        process.env.NODE_ENV === 'production' ? 'error' : 'warn',

      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],

      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      'no-useless-escape': 'error',

      'no-console':
        process.env.NODE_ENV === 'production'
          ? ['error', { allow: ['log', 'warn', 'error'] }]
          : 'off',

      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',

      'no-var': 'error',
      'prefer-const': 'warn',
      eqeqeq: ['error', 'always', { null: 'ignore' }]
    }
  }
);
