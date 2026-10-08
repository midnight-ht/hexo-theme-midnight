'use strict';
if (require.main !== module) return;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const deps = require('node:module').createRequire(path.resolve(__dirname, '../example-site/package.json'));
const ejs = deps('ejs');
const { JSDOM } = deps('jsdom');
const template = fs.readFileSync(path.join(__dirname, '../layout/_partial/comments.ejs'), 'utf8');
const client = fs.readFileSync(path.join(__dirname, '../source/js/comments.js'), 'utf8');
function render(comments, page = {}) {
  return ejs.render(template, { theme: { comments }, page, __: key => key, midnight_page_lang: () => 'en', midnight_value: value => typeof value === 'string' ? value : '' });
}
for (const cfg of [{}, { enabled: true, provider: 'giscus', giscus: { repo: 'owner/repo' } }, { enabled: true, provider: 'waline' }, { enabled: true, provider: 'utterances', utterances: { repo: 'invalid' } }]) {
  assert(!render(cfg).includes('<section'));
}
const giscus = { enabled: true, provider: 'giscus', giscus: { repo: 'owner/repo', repo_id: 'R_test', category: 'Comments', category_id: 'DIC_test', theme: 'auto' } };
const g = new JSDOM(render(giscus, { comment_id: 'stable-id' })).window.document;
assert.equal(g.querySelector('script[data-repo]').dataset.mapping, 'specific');
assert.equal(g.querySelector('script[data-repo]').dataset.term, 'stable-id');
assert.equal(g.querySelector('script[data-repo]').dataset.lang, 'en');
assert(!render(giscus, { comments: false }).includes('<section'));
const waline = { enabled: true, provider: 'waline', waline: { server_url: 'https://comments.example.com', placeholder: "Say 'hello' </script><script>bad()</script>", page_size: -5 } };
const w = new JSDOM(render(waline, { comment_id: 'shared-post', comments_title: 'Guestbook' })).window.document;
assert.equal(w.querySelector('h2').textContent, 'Guestbook');
assert.equal(w.querySelectorAll('script').length, 1);
const moduleCode = w.querySelector('script').textContent.replace(/^\s*import[^;]+;/, '');
let options;
vm.runInNewContext(moduleCode, { init: value => options = value });
assert.equal(options.serverURL, waline.waline.server_url);
assert.equal(options.locale.placeholder, waline.waline.placeholder);
assert.equal(options.pageSize, 1);
assert.equal(options.lang, 'en');
assert.equal(options.path, 'shared-post');
assert.equal(options.dark, 'html[data-theme="dark"]');
assert(!render({ ...waline, waline: { server_url: 'javascript:alert(1)' } }).includes('<section'));
const utterances = { enable: true, type: 'utterances', utterances: { repo: 'owner/repo', theme: 'auto', label: '"><script>bad()</script>' } };
const u = new JSDOM(render(utterances)).window.document;
assert.equal(u.querySelector('script[repo]').getAttribute('label'), utterances.utterances.label);
assert.equal(u.querySelectorAll('script').length, 2);
async function themeTest(config, provider, origin, light, dark) {
  const dom = new JSDOM(render(config));
  const section = dom.window.document.querySelector('section');
  const frame = dom.window.document.createElement('iframe');
  section.append(frame);
  const messages = [];
  frame.contentWindow.postMessage = (message, target) => messages.push({ message, target });
  vm.runInNewContext(client, { document: dom.window.document, MutationObserver: dom.window.MutationObserver });
  assert.equal(messages.at(-1).target, origin);
  const theme = () => provider === 'giscus' ? messages.at(-1).message.giscus.setConfig.theme : messages.at(-1).message.theme;
  assert.equal(theme(), light);
  dom.window.document.documentElement.dataset.theme = 'dark';
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(theme(), dark);
  frame.dispatchEvent(new dom.window.Event('load'));
  assert.equal(theme(), dark);
  dom.window.close();
}
(async () => {
  await themeTest(giscus, 'giscus', 'https://giscus.app', 'light', 'dark');
  await themeTest(utterances, 'utterances', 'https://utteranc.es', 'github-light', 'github-dark');
  console.log('Comments checks OK: provider readiness, disabled pages, escaping, stable IDs, language and live theme sync');
})().catch(error => { console.error(error); process.exitCode = 1; });
