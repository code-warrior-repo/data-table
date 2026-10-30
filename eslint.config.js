import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**', 'coverage/**', 'playwright-report/**', 'test-results/**', '**/node_modules/**', '**/.next/**'] },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node },
    rules: { 'no-unused-vars': 'error' }
  },
  {
    files: ['src/**/*.{js,jsx}', 'tests/**/*.{js,jsx}', 'examples/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest', sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    plugins: { 'react-hooks': hooks },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^React$' }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error'
    }
  }
];
