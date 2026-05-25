'use strict';

if (require.main !== module) {
  return;
}

const fs = require('fs');
const path = require('path');

const required = [
  '_config.yml',
  'layout/layout.ejs',
  'layout/index.ejs',
  'layout/post.ejs',
  'layout/page.ejs',
  'layout/404.ejs',
  'layout/archive.ejs',
  'layout/about.ejs',
  'layout/advertise.ejs',
  'layout/newsletter.ejs',
  'layout/privacy.ejs',
  'layout/tag.ejs',
  'layout/tag-index.ejs',
  'layout/category.ejs',
  'layout/_partial/head.ejs',
  'layout/_partial/header.ejs',
  'layout/_partial/footer.ejs',
  'layout/_partial/analytics.ejs',
  'layout/_partial/pagination.ejs',
  'layout/_partial/newsletter-form.ejs',
  'layout/_partial/collection-page.ejs',
  'layout/_partial/inner-sidebar.ejs',
  'layout/_partial/language-switcher.ejs',
  'layout/_partial/model-session.ejs',
  'layout/_partial/comments.ejs',
  'source/css/main.css',
  'source/js/main.js',
  'source/js/model-session.js',
  'scripts/i18n-helpers.js',
  'scripts/check-example-site.js',
  'scripts/check-example-output.js',
  'scripts/check-config-driven-content.js',
  'scripts/check-a11y-static.js',
  'scripts/check-comments-render.js',
  'scripts/check-analytics-render.js',
  'scripts/check-model-session-render.js',
  'scripts/check-newsletter-render.js',
  'scripts/check-excerpt-helper.js',
  'scripts/inner-page-i18n-generator.js',
  'scripts/tag-i18n-generator.js',
  'scripts/not-found-generator.js',
  'scripts/not-found-server-fallback.js',
  'languages/zh-CN.yml',
  'languages/en.yml'
];

const themeRoot = path.resolve(__dirname, '..');
const missing = required.filter((file) => !fs.existsSync(path.join(themeRoot, file)));

if (missing.length) {
  console.error(`Missing required files:\n${missing.join('\n')}`);
  process.exit(1);
}

console.log('Theme structure OK');
