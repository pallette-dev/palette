import { config } from '@pallette/eslint-config/base';
import globals from 'globals';

/** @type {import("eslint").Linter.Config[]} */
export default [
  { ignores: ['.astro/**', 'dist/**'] },
  ...config,
  {
    files: ['astro.config.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
];
