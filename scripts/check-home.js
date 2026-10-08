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
let doc = render([post('latest'), post('false', { editor_pick: 'false' }), post('empty', { editor_pick: '' }), post('arbitrary', { editor_pick: 'garbage' })]);
assert.equal(doc.querySelectorAll('.home-selected').length, 0);
assert.equal(doc.querySelectorAll('.latest-list__item').length, 4);
assert(doc.querySelector('.latest-card__meta').textContent.includes('测试与安全'));
const posts = [post('first', { editor_pick: true, editor_pick_order: 1 }), post('second', { editor_pick: true, editor_pick_order: 2 }), post('third', { editor_pick: true, editor_pick_order: 3 }), post('ordinary'), post('english', { lang: 'en', editor_pick: true, editor_pick_order: 0 })];
doc = render(posts);
assert.deepEqual([...doc.querySelectorAll('.home-selected h3')].map(node => node.textContent), ['first', 'second']);
assert.deepEqual([...doc.querySelectorAll('.latest-list h3')].map(node => node.textContent), ['third', 'ordinary']);
assert.equal(doc.querySelectorAll('h1').length, 1);
doc = render([post('only', { editor_pick: true })]);
assert.equal(doc.querySelectorAll('.home-selected__story').length, 1);
assert.equal(doc.querySelectorAll('.latest-list__item').length, 0);
assert.equal(render([]).querySelectorAll('.home-selected').length, 0);
console.log('Homepage selection, language, localization and deduplication OK');
