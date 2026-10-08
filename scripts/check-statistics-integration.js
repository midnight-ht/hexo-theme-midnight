'use strict';
if (require.main !== module) return;
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const exampleRequire = require('module').createRequire(path.join(root, 'example-site/package.json'));
const ejs = exampleRequire('ejs');
const { JSDOM } = exampleRequire('jsdom');
const template = fs.readFileSync(path.join(root, 'layout/_partial/metric.ejs'), 'utf8');
const source = fs.readFileSync(path.join(root, 'source/js/statistics.js'), 'utf8');
function render(config, article = true) {
  const item = { path: 'en/story/', layout: 'post', views: 999 };
  return ejs.render(template, { item, kind: 'reads', metricTag: 'span', page: article ? item : {},
    midnight_config: () => config, midnight_metric: () => 999,
    midnight_i18n_url: p => '/' + p, midnight_text: () => 'Reads' });
}
async function check(response, article, failure = false) {
  const config = { enabled: true, provider: 'endpoint', reads_endpoint: '/api/reads', record_reads: true };
  const html = render(config, article);
  const dom = new JSDOM(html, { url: 'https://example.com/en/story/' });
  const calls = [];
  const node = dom.window.document.querySelector('[data-article-metric]');
  assert(node.hidden);
  vm.runInNewContext(source, { document: dom.window.document, window: dom.window, URL, AbortController, setTimeout, clearTimeout,
    fetch: async (url, options) => { calls.push({ url, options }); if (failure) throw Error('offline'); return { ok: true, json: async () => response }; } });
  await new Promise(resolve => setImmediate(resolve));
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].options.method, article ? 'POST' : 'GET');
  assert.strictEqual(new URL(calls[0].url).searchParams.get('path'), '/en/story/');
  assert.strictEqual(node.hidden, failure || !Number.isSafeInteger(response.reads) || response.reads < 0);
  if (!node.hidden) assert.strictEqual(node.querySelector('[data-metric-value]').textContent, String(response.reads));
  dom.window.close();
}
(async () => {
  assert(!render({}).includes('data-article-metric'));
  assert(!render({ enabled: true, provider: 'endpoint' }).includes('data-article-metric'));
  assert(!render({ enabled: false, provider: 'frontmatter' }).includes('999'));
  assert(render({ enabled: true, provider: 'frontmatter' }).includes('999'));
  await check({ reads: 0 }, true);
  await check({ reads: 12 }, false);
  await check({ reads: -1 }, true);
  await check({ reads: '12' }, false);
  await check({}, false);
  await check({}, true, true);
  const comments = fs.readFileSync(path.join(root, 'layout/_partial/comments.ejs'), 'utf8');
  const base = { page: {}, __: x => x, midnight_text: x => x };
  for (const config of [{}, { enabled: true, provider: 'giscus', giscus: { repo: 'owner/repo' } }, { enabled: true, provider: 'waline' }]) {
    assert(!ejs.render(comments, { ...base, theme: { comments: config } }).includes('<section'));
  }
  assert(ejs.render(comments, { ...base, theme: { comments: { enabled: true, provider: 'waline', waline: { server_url: 'https://comments.example.com' } } } }).includes('id="waline"'));
  console.log('Statistics integration and module visibility OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
