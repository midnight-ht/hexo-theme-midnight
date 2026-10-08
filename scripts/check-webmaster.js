'use strict';
if (require.main !== module) return;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const deps = require('node:module').createRequire(path.resolve(__dirname, '../example-site/package.json'));
const ejs = deps('ejs');
const { JSDOM } = deps('jsdom');
let helper, generator;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'webmaster.js'), 'utf8'), {
  hexo: { extend: { helper: { register: (_, fn) => helper = fn }, generator: { register: (_, fn) => generator = fn } } }
});
assert.equal(helper.call({ theme: {} }, {}).length, 0);
const seo = { meta: [{ name: 'referrer', content: 'origin' }, { property: 'fb:app_id', content: '123' },
  { name: 'robots', content: 'index' }, { name: 'description', content: 'duplicate' }, { name: 'empty', content: '' }],
  google_site_verification: ['owner-1', 'owner-2', 'owner-1'], bing_site_verification: 'bing-token',
  baidu_site_verification: 'baidu-token', shenma_site_verification: 'sm-token', sogou_site_verification: 'sogou-token',
  so_site_verification: '360-token', yandex_site_verification: 'yandex-token', pinterest_site_verification: 'pin-token' };
const page = { seo: { meta: [{ name: 'referrer', content: 'no-referrer' }, { property: 'fb:app_id', content: false },
  { name: 'custom', content: '\"><script>alert(1)</script>' }, { name: 'bad" onclick', content: 'bad' }] } };
const tags = helper.call({ theme: { seo } }, page);
assert.equal(tags.filter(tag => tag.name === 'google-site-verification').length, 2);
assert.equal(tags.filter(tag => tag.name === 'referrer')[0].content, 'no-referrer');
assert(!tags.some(tag => tag.property === 'fb:app_id' || ['robots', 'description', 'empty'].includes(tag.name)));
const template = fs.readFileSync(path.join(__dirname, '../layout/_partial/head.ejs'), 'utf8');
const start = template.indexOf('  <% midnight_meta_tags(page)');
const end = template.indexOf('  <% }) %>', start) + '  <% }) %>'.length;
assert(start >= 0 && end > start);
const rendered = ejs.render('<head>' + template.slice(start, end) + '</head>', { page, midnight_meta_tags: () => tags });
const document = new JSDOM(rendered).window.document;
assert.equal(document.querySelectorAll('script').length, 0);
assert.equal(document.querySelector('meta[name="custom"]').content, '\"><script>alert(1)</script>');
for (const name of ['baidu-site-verification', 'msvalidate.01', 'shenma-site-verification', 'sogou-site-verification', 'verify-v1', 'yandex-verification', 'p:domain_verify']) {
  assert.equal(document.querySelectorAll(`meta[name="${name}"]`).length, 1, name);
}
const generate = (files, locals) => generator.call({ theme: { config: { seo: { verification_files: files } } } }, locals);
assert.equal(generate([]).length, 0);
const content = '<?xml version="1.0"?><users><user>token</user></users>\n';
assert.equal(generate([{ path: 'BingSiteAuth.xml', content }])[0].data, content);
for (const name of ['../evil.html', '/google.html', 'dir/token.txt', 'index.html', '404.html', 'robots.txt', 'sitemap-en.xml', 'atom.xml']) {
  assert.throws(() => generate([{ path: name, content: 'token' }]));
}
assert.throws(() => generate([{ path: 'verify.txt', content: 'a' }, { path: 'VERIFY.txt', content: 'b' }]));
assert.throws(() => generate([{ path: 'verify.txt', content: 'a' }], { assets: [{ path: 'verify.txt' }] }));
assert.throws(() => generate([{ path: 'verify.txt', content: '' }]));
console.log('Webmaster checks OK: optional tokens, overrides, escaping, verification files and collisions');
