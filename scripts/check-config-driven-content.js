'use strict';

if (require.main !== module) {
  return;
}

const fs = require('fs');
const path = require('path');

const themeRoot = path.resolve(__dirname, '..');
const configOnlyPages = [
  'layout/advertise.ejs',
  'layout/newsletter.ejs',
  'layout/privacy.ejs'
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

configOnlyPages.forEach((relativePath) => {
  const content = fs.readFileSync(path.join(themeRoot, relativePath), 'utf8');
  ['page.content', 'page.title ||', 'page.description ||', 'page.contact_email', 'page.contact_url'].forEach((needle) => {
    if (content.includes(needle)) fail(`${relativePath} should not use ${needle}; dedicated inner-page content must come from _config.yml.`);
  });
});

const aboutTemplate = fs.readFileSync(path.join(themeRoot, 'layout/about.ejs'), 'utf8');
['page.title ||', 'page.description ||', 'page.content'].forEach((needle) => {
  if (!aboutTemplate.includes(needle)) fail(`layout/about.ejs should inherit Hexo about page data via ${needle}.`);
});

const config = fs.readFileSync(path.join(themeRoot, '_config.yml'), 'utf8');
[
  'contact:',
  'email:',
  'inner_pages:',
  'about:',
  'advertise:',
  'newsletter:',
  'privacy:'
].forEach((needle) => {
  if (!config.includes(needle)) fail(`_config.yml is missing ${needle}`);
});

console.log('Config-driven content checks OK');
