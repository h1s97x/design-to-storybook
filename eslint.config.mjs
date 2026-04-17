import js from '@eslint/js';

export default [
  { ignores: ['**/dist/**', '**/node_modules/**', '**/.git/**'] },
  { files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.mjs'] },
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'off',
      'no-explicit-any': 'off'
    }
  }
];
