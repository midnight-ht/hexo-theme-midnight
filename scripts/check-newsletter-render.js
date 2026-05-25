'use strict';

if (require.main !== module) {
  return;
}

const fs = require('fs');
const path = require('path');

const themeRoot = path.resolve(__dirname, '..');
const partial = fs.readFileSync(path.join(themeRoot, 'layout/_partial/newsletter-form.ejs'), 'utf8');
const header = fs.readFileSync(path.join(themeRoot, 'layout/_partial/header.ejs'), 'utf8');
const footer = fs.readFileSync(path.join(themeRoot, 'layout/_partial/footer.ejs'), 'utf8');

function fail(message) {
  console.error(message);
  process.exit(1);
}

[
  'newsletterFormAction',
  'if (newsletterFormAction)',
  'action="<%- newsletterFormAction %>"'
].forEach((needle) => {
  if (!partial.includes(needle)) fail(`Newsletter form partial is missing ${needle}`);
});

if (!header.includes('headerNewsletterAction')) fail('Header should gate newsletter links by configured action.');
if (!footer.includes('footerNewsletterAction')) fail('Footer should gate newsletter links by configured action.');

console.log('Newsletter render checks OK');
