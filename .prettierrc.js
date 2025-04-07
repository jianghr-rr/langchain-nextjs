// @ts-check

const { getPrettierConfig } = require('@bid-np/eslint-config-bases/helpers');

const { overrides = [], ...prettierConfig } = getPrettierConfig();

/**
 * @type {import('prettier').Config}
 */
const config = {
  ...prettierConfig,
  overrides: [
    ...overrides,
    ...[
      {
        files: '*.md',
        options: {
          quoteProps: 'preserve',
        },
      },
    ],
  ],
};

module.exports = config;
