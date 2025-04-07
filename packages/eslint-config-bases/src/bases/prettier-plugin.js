/**
 * Custom config base for projects using prettier.
 * @see https://github.com/belgattitude/nextjs-monorepo-example/tree/main/packages/eslint-config-bases
 */

const { getPrettierConfig } = require('../helpers');
const { ...prettierConfig } = getPrettierConfig();

module.exports = {
  extends: ['prettier'], // 使用eslinst-config-prettier中的配置项
  plugins: ['prettier'], // 注册该prettier插件
  rules: {
    'prettier/prettier': ['error', prettierConfig], // 在eslint中运行prettier，并启用该插件提供的规则
    'arrow-body-style': 'off', // 关闭规则
    'prefer-arrow-callback': 'off', // 关闭规则
  },
};

// 这样配置后，ESLint进行格式化时就会忽略跟Prettier重叠的格式规则，
// 这些交由Prettier来进行格式化，这样二者可以愉快地一起分工协作了。
