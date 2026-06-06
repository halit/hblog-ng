import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// eslint-config-next v16 exports a flat config array directly (no FlatCompat needed)
const nextConfig = require('eslint-config-next');
const prettierConfig = require('eslint-config-prettier');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

const eslintConfig = [
  {
    ignores: [
      '**/node_modules/',
      '.next/',
      '.open-next/',
      'out/',
      'public/',
      'dist/',
      'build/',
      'coverage/',
      '**/*.d.ts',
      'data/',
    ],
  },

  // Next.js flat config (core-web-vitals + typescript rules + ignores)
  ...nextConfig,

  // Disable Prettier-conflicting formatting rules
  { rules: prettierConfig.rules },

  // Global rule overrides (no plugin reference needed)
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
      'no-unused-vars': 'off', // replaced by @typescript-eslint version below

      // React Compiler preview rules — this project does not adopt the compiler,
      // and these flag intentional patterns (mount-time hydration, icon lookups,
      // canvas/simulation mutation). Keep rules-of-hooks / exhaustive-deps on.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/static-components': 'off',
    },
  },

  // TypeScript-specific rule overrides — scoped to .ts/.tsx files so the
  // @typescript-eslint plugin is available in the same config object.
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
    },
  },
];

export default eslintConfig;
