import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      /**
       * `motion` is exempt because this config has no JSX-aware React plugin,
       * so `<motion.div>` is not recognised as a use of the import and every
       * framer-motion file reports a false positive. Deleting those imports
       * would break the site.
       */
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^([A-Z_]|motion$)', args: 'none' },
      ],
    },
  },
])
