'use strict';

if (require.main !== module) {
  return;
}

const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(path.resolve(__dirname, '..', 'layout', '_partial', 'analytics.ejs'), 'utf8');

function fail(message) {
  console.error(message);
  process.exit(1);
}

[
  'theme.web_analytics',
  'analytics.baidu',
  'analytics.google',
  'analytics.gtag',
  'analytics.cnzz',
  'analytics.woyaola',
  'busuanzi.pure.mini.js'
].forEach((needle) => {
  if (!template.includes(needle)) fail(`Analytics partial is missing ${needle}`);
});

console.log('Analytics template checks OK');
