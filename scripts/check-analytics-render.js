'use strict';
if (require.main !== module) return;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const deps = require('node:module').createRequire(path.resolve(__dirname, '../example-site/package.json'));
const ejs = deps('ejs');
const { JSDOM } = deps('jsdom');
const template = fs.readFileSync(path.join(__dirname, '../layout/_partial/analytics.ejs'), 'utf8');
const render = (analytics, footer = {}) => new JSDOM(ejs.render(template, { theme: { web_analytics: analytics, footer } })).window.document;
assert.equal(render({}).querySelectorAll('script').length, 0);
const settings = { enabled: true, baidu: 'baidu-token', gtag: 'G-TEST123', cnzz: '1234', woyaola: 'test51',
  umami: { script_url: 'https://stats.example.com/script.js', website_id: 'website-id', domains: 'example.com' }, clarity: 'testproject' };
assert.equal(render({ ...settings, enabled: false }).querySelectorAll('script').length, 0);
assert.equal(render({ enabled: true, umami: { script_url: 'https://stats.example.com/script.js' } }).querySelectorAll('script').length, 0);
assert.equal(render({ enabled: true, umami: { script_url: 'javascript:bad()', website_id: 'id' } }).querySelectorAll('script').length, 0);
const document = render(settings);
const tracker = document.querySelector('script[data-website-id]');
assert.equal(tracker.src, settings.umami.script_url);
assert.equal(tracker.dataset.websiteId, 'website-id');
assert.equal(tracker.dataset.domains, 'example.com');
assert(tracker.defer);
assert.equal(document.querySelectorAll('script[src*="googletagmanager.com"]').length, 1);
assert(!document.querySelector('script[src*="analytics.js"]'));
const calls = [];
for (const script of document.querySelectorAll('script:not([src])')) {
  const context = { Date, document: {
    createElement: () => ({}), getElementsByTagName: () => [{ parentNode: { insertBefore: node => calls.push(node.src) } }]
  } };
  context.window = context;
  vm.runInNewContext(script.textContent, context);
}
assert(calls.includes('https://hm.baidu.com/hm.js?baidu-token'));
assert(calls.includes('https://www.clarity.ms/tag/testproject'));
assert.equal(render({ enabled: true, google: 'G-TEST123' }).querySelectorAll('script[src*="gtag/js"]').length, 1);
assert.equal(render({ enabled: true, google: 'G-TEST123', gtag: 'G-TEST123' }).querySelectorAll('script[src*="gtag/js"]').length, 1);
assert(render({ enabled: true, google: 'UA-123-1' }).querySelector('script[src*="analytics.js"]'));
const payload = '</script><script>bad()</script>';
const attack = render({ enabled: true, gtag: payload, baidu: payload, umami: { script_url: 'https://stats.example.com/script.js', website_id: '\" onload=\"bad()' } });
assert.equal(attack.querySelectorAll('script').length, 4);
assert(!attack.querySelector('[onload]'));
assert.equal(render({}, { statistics: { enabled: true } }).querySelectorAll('script[src*="busuanzi"]').length, 1);
console.log('Analytics checks OK: explicit enablement, GA4, Umami, Clarity, legacy compatibility and escaping');
