'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const deps = require('node:module').createRequire(path.resolve(__dirname, '../example-site/package.json'));
const ejs = deps('ejs');
const template = fs.readFileSync(path.join(__dirname, '../layout/_partial/head.ejs'), 'utf8');
const start = template.indexOf('  <% if (seoCfg.structured_data');
const end = template.indexOf('  <% } %>', start) + '  <% } %>'.length;
assert(start >= 0 && end > start);
function rendersSchema(route, options = {}) {
  return ejs.render(template.slice(start, end), {
    page: { path: route, noindex: options.noindex },
    seoCfg: { structured_data: options.enabled !== false },
    pageTitle: 'Article', pageDescription: 'Description', ogImage: '',
    midnight_structured_data: () => '{"@type":"BlogPosting"}'
  }).includes('midnight-seo-jsonld');
}
for (const route of ['zh-CN/2026/10/18/http-410-404-lifecycle/', 'en/2026/10/18/http-404-cache/', 'en/2026/10/25/error404/index.html']) {
  assert(rendersSchema(route), `Article route must retain schema: ${route}`);
}
for (const route of ['404.html', '404/', 'en/404.html', 'zh-CN/404/']) {
  assert(!rendersSchema(route), `Error route must omit schema: ${route}`);
}
assert(!rendersSchema('en/article/', { noindex: true }));
assert(!rendersSchema('en/article/', { enabled: false }));
console.log('Schema route regression passed: article slug digits, actual 404, noindex and disabled setting');
