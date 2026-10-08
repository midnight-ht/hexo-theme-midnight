'use strict';
if (require.main !== module) return;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const deps = createRequire(path.resolve(__dirname, '../example-site/package.json'));
const ejs = deps('ejs');
const { JSDOM } = deps('jsdom');
const template = fs.readFileSync(path.join(__dirname, '../layout/index.ejs'), 'utf8');
function render(posts) {
  return new JSDOM(ejs.render(template, {
    page: { posts: { toArray: () => posts } }, config: { title: 'Journal', author: 'Author' }, theme: {},
    midnight_page_lang: post => post.lang || 'zh-CN',
    midnight_config: (key, fallback) => key === 'inner_pages.collections' ? [{ name: 'Quality', label: { 'zh-CN': '测试与安全' }, path: '/tags/Quality/' }] : fallback,
    midnight_value: (value, fallback) => value && typeof value === 'object' ? value['zh-CN'] : value || fallback,
    midnight_text: (key, fallback) => fallback, midnight_metric: () => null,
    midnight_i18n_url: value => '/' + String(value).replace(/^\//, ''), midnight_tag_url: value => '/tags/' + value + '/',
    midnight_excerpt: post => post.description || '', __: key => key, date: () => '2026-10-08', date_xml: () => '2026-10-08T00:00:00Z', partial: () => ''
  })).window.document;
}
const post = (id, extra = {}) => ({ title: id, path: id + '/', lang: 'zh-CN', date: new Date('2026-10-08'), description: 'A real summary', tags: [{ name: 'Quality' }], ...extra });
let doc = render([post('latest'), post('false', { editor_pick: 'false' }), post('empty', { editor_pick: '' })]);
assert.equal(doc.querySelectorAll('.home-selected,.home-sidebar').length, 0);
assert.equal(doc.querySelectorAll('.studio-entry').length, 3);
assert(doc.querySelector('.studio-entry__topic').textContent.includes('测试与安全'));
const posts = [post('first', { editor_pick: true }), post('second', { editor_pick: true }), post('third'), post('english', { lang: 'en', editor_pick: true })];
doc = render(posts);
assert.deepEqual([...doc.querySelectorAll('.studio-entry h3')].map(node => node.textContent), ['first', 'second', 'third']);
assert.equal(doc.querySelectorAll('.studio-entry--lead').length, 1);
assert.equal(doc.querySelectorAll('h1').length, 1);
assert.equal(render([post('only', { editor_pick: true })]).querySelectorAll('.studio-entry').length, 1);
assert.equal(render([]).querySelectorAll('.studio-entry').length, 0);
assert.equal(render(Array.from({length: 10}, (_, i) => post(String(i)))).querySelectorAll('.studio-entry').length, 6);
console.log('Studio homepage language, localized topics, empty state and nonduplicated stream OK');
