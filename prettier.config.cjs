// @ts-check
import prettier from 'prettier';

/** @type {import('prettier').Options} */
const config = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',
  printWidth: 80,
  endOfLine: 'auto',
  jsxSingleQuote: false,
  bracketSameLine: false,
  proseWrap: 'preserve',
  plugins: [
    // Ajoutez vos plugins ici si nécessaire
    // 'prettier-plugin-tailwindcss'
  ],
  overrides: [
    {
      files: '*.json',
      options: { parser: 'json' }
    },
    {
      files: '*.ts',
      options: { parser: 'typescript' }
    },
    {
      files: '*.jsx',
      options: { parser: 'babel' }
    }
  ]
};

export default config;