'use strict';
if (require.main !== module) return;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { createRequire } = require('node:module');
const deps = createRequire(path.resolve(__dirname, '../example-site/package.json'));
const { JSDOM } = deps('jsdom');
const helpers = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'seo-helpers.js'), 'utf8'), { URL, hexo: { extend: { helper: { register: (key, fn) => helpers[key] = fn } } } });
const ctx = { config: { title: 'Journal', author: 'Author' }, __: key => key,
  full_url_for: value => new URL(value, 'https://example.com/blog/').href,
  midnight_canonical_url: page => 'https://example.com/blog/' + page.path,
  midnight_page_lang: () => 'en', midnight_i18n_url: value => '/blog/en' + value };
const post = { layout: 'post', path: 'en/test/', title: '</script><script>alert(1)</script>', date: '2026-01-02', updated: 'invalid', sources: [{ url: 'https://example.org/report', title: 'Report' }, { url: 'javascript:alert(1)' }] };
const raw = helpers.midnight_structured_data.call(ctx, post, post.title, 'Description');
assert(!raw.includes('</script>'));
const article = JSON.parse(raw)['@graph'].find(item => item['@type'] === 'BlogPosting');
assert.equal(article.author.name, 'Author');
assert.equal(article.datePublished, '2026-01-02T00:00:00.000Z');
assert(!article.dateModified && !article.image);
assert.equal(article.citation.length, 1);
assert.equal(helpers.midnight_author.call(ctx, { author: 'Guest' }).url, '');
assert.equal(helpers.midnight_sources.call(ctx, { sources: ['data:text/html,test'] }).length, 0);
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../example-site/public');
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : entry.name.endsWith('.html') ? [path.join(dir, entry.name)] : []); }
let count = 0;
const articleByLanguage = new Map();
const archives = [];
for (const file of walk(root)) {
  const document = new JSDOM(fs.readFileSync(file, 'utf8')).window.document;
  // Root verification documents are emitted verbatim, without the theme layout.
  const standalone = path.dirname(file) === root && !/^(index|404)\.html$/i.test(path.basename(file));
  if (standalone && !document.querySelector('main, #midnight-seo-jsonld, link[href*="main.css"]')) continue;
  assert.equal(document.querySelectorAll('main').length, 1, `${file}: exactly one main landmark`);
  assert(!document.querySelector('link[hreflang="default"]'), `${file}: invalid language`);
  if (/[/\\]archives[/\\]index.html$/.test(file)) archives.push({ file, document });
  const canonical = document.querySelector('link[rel="canonical"]');
  assert(canonical && /^https?:/.test(canonical.href));
  for (const link of document.querySelectorAll('a[href^="/"], link[hreflang]')) {
    const href = link.getAttribute('href');
    if (href.startsWith('//')) continue;
    const targetUrl = new URL(href, 'https://example.com');
    if (link.tagName === 'LINK' && targetUrl.origin !== new URL(canonical.href).origin) continue;
    const pathname = targetUrl.pathname;
    const suffix = pathname.endsWith('/') ? 'index.html' : '';
    let decoded = pathname;
    try { decoded = decodeURIComponent(pathname); } catch (_) {}
    assert(fs.existsSync(path.join(root, pathname, suffix)) || fs.existsSync(path.join(root, decoded, suffix)), `${file}: broken internal link ${href}`);
  }
  const articleIds = new Set();
  const blocks = [...document.querySelectorAll('script[type="application/ld+json"]')];
  if (file.endsWith('404.html')) {
    assert(document.querySelector('meta[name="robots"]').content.includes('noindex'));
  }
  for (const block of blocks) {
    const data = JSON.parse(block.textContent);
    const graph = data['@graph'] || [data];
    const article = graph.find(item => item['@type'] === 'BlogPosting');
    if (article) {
      assert(!articleIds.has(article['@id']), `${file}: duplicate article schema`);
      articleIds.add(article['@id']);
      assert.equal(document.querySelectorAll('h1').length, 1, `${file}: single article title`);
      assert.equal(article.headline, document.querySelector('h1').textContent);
      assert(document.querySelector('.post-author-card').textContent.includes(article.author.name));
      assert.equal(article.url, canonical.href);
      for (const citation of article.citation || []) assert([...document.querySelectorAll('.article-sources a')].some(link => link.href === citation));
      assert(document.querySelector('.article-content').textContent.trim().length > 0);
      const entries = articleByLanguage.get(article.inLanguage) || new Map();
      entries.set(article.url, article.author.name);
      articleByLanguage.set(article.inLanguage, entries);
      count++;
    }
  }
}
for (const { file, document } of archives) {
  const articles = articleByLanguage.get(document.documentElement.lang);
  const metrics = [...document.querySelectorAll('.channel-map__metric')].map(node => Number(node.textContent));
  if (articles && metrics.length >= 3) {
    assert.equal(metrics[0], articles.size, `${file}: archive total must use all language-scoped posts`);
    assert.equal(metrics[2], new Set(articles.values()).size, `${file}: real author total`);
  }
}
assert(count >= 2, 'Generated bilingual articles must contain structured data');
console.log(`SEO checks OK: safe metadata, canonical, language, landmarks, ${count} articles`);
