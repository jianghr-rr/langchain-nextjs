/**
 * Specific eslint rules for this workspace, learn how to compose
 * @link https://github.com/belgattitude/nextjs-monorepo-example/tree/main/packages/eslint-config-bases
 */

const {
  getDefaultIgnorePatterns,
} = require('@bid-np/eslint-config-bases/helpers');

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: 'tsconfig.json',
  },
  ignorePatterns: [...getDefaultIgnorePatterns()],
  extends: [
    '@bid-np/eslint-config-bases/typescript',
    '@bid-np/eslint-config-bases/sonar',
    '@bid-np/eslint-config-bases/regexp',
    '@bid-np/eslint-config-bases/jest',
    // Apply prettier and disable incompatible rules
    '@bid-np/eslint-config-bases/prettier-plugin',
  ],
  rules: {
    // optional overrides per project
  },
  overrides: [
    // optional overrides per project file match
  ],
};
