import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  {
    ignores: ['build/', 'dist/', '.tmp/', 'node_modules/']
  },

  js.configs.recommended,

  {
    files: ['**/*.{js,jsx}'],

    languageOptions: {
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
      'react-refresh': reactRefresh
    },

    settings: {
      react: {
        version: 'detect'
      }
    },

    rules: {
      'react/prop-types': 'off',
      'react/display-name': 'warn',
      'react-refresh/only-export-components': 'warn',
      'react/jsx-key': 'error',
      'react/jsx-no-target-blank': ['error', { allowReferrer: false }],
      'react/no-array-index-key': 'warn',

      'react/jsx-uses-vars': 'error',

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps':
        process.env.NODE_ENV === 'production' ? 'error' : 'warn',

      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],

      'no-console': 'error',

      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',

      'no-var': 'error',
      'prefer-const': 'warn',
      eqeqeq: ['error', 'always', { null: 'ignore' }]
    }
  },

  {
    files: ['**/*.{ts,tsx}'],

    languageOptions: {
      parser: tsParser,
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
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefresh
    },

    settings: {
      react: {
        version: 'detect'
      }
    },

    rules: {
      'react/prop-types': 'off',
      'react/display-name': 'warn',
      'react-refresh/only-export-components': 'warn',
      'react/jsx-key': 'error',
      'react/jsx-no-target-blank': ['error', { allowReferrer: false }],
      'react/no-array-index-key': 'warn',

      'react/jsx-uses-vars': 'error',

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps':
        process.env.NODE_ENV === 'production' ? 'error' : 'warn',

      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],

      'no-console': 'error',

      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',

      'no-var': 'error',
      'prefer-const': 'warn',
      eqeqeq: ['error', 'always', { null: 'ignore' }]
    }
  },

  {
    files: ['src/utils/logger.js'],
    rules: {
      'no-console': ['error', { allow: ['log', 'warn', 'error'] }]
    }
  }
];
