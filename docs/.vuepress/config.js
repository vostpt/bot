const pt = require('../pt');
const en = require('../en');

const PTthemeConfig = require('../pt/theme');
const ENthemeConfig = require('../en/theme');

module.exports = {
  title: 'VOSTPT',
  base: '/bot/',
  serviceWorker: true,
  locales: {
    '/en/': en,
    '/pt/': pt,
  },
  themeConfig: {
    repo: 'vostpt/bot',
    docsDir: 'docs',
    sidebar: 'auto',
    lastUpdated: true,
    editLinks: true,
    locales: {
      '/en/': ENthemeConfig,
      '/pt/': PTthemeConfig,
    },
  },
};
