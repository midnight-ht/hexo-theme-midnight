'use strict';
if (require.main !== module) return;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const deps = createRequire(path.resolve(__dirname, '../example-site/package.json'));

// Runs actual source generators and URL helpers against source fixtures. This
// catches routes that look equal on macOS but differ on a case-sensitive host.
const generators = {};
const helpers = {};
const fixtureHexo = { extend: {
  generator: { register: (name, fn) => { generators[name] = fn; } },
  helper: { register: (name, fn) => { helpers[name] = fn; } }
} };
for (const script of ['source-i18n-generator.js', 'i18n-helpers.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, script), 'utf8'), { hexo: fixtureHexo, require: deps, URL, console }, { filename: script });
}
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'midnight-tag-case-'));
const languages = ['zh-CN', 'en'];
function writePost(lang, slug, date, tags) {
  const dir = path.join(temp, lang, '_posts');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, slug + '.md'), `---\ntitle: ${slug}\ndate: "${date}"\nlang: ${lang}\ntags: ${JSON.stringify(tags)}\n---\nFixture body.\n`);
}
const ctx = {
  source_dir: temp,
  config: { language: languages, title: 'Fixture', url: 'https://example.test/blog', root: '/blog/' },
  theme: { config: { i18n: { languages, default_lang: 'zh-CN', canonical_tag_slugs: { 'zh-CN': { github: 'GitHub' }, en: { github: 'github' } } }, inner_pages: { collections: [{ name: 'Development', path: '/tags/Development/' }, { name: 'GitHub', path: '/tags/GitHub/' }] } } },
  render: { render: async ({ text }) => text },
  url_for: value => '/blog/' + String(value).replace(/^\//, ''),
  full_url_for: value => new URL(String(value).replace(/^\//, ''), 'https://example.test/blog/').href
};
for (const [name, fn] of Object.entries(helpers)) ctx[name] = (...args) => fn.call(ctx, ...args);
(async () => {
  try {
    for (const lang of languages) {
      writePost(lang, 'new', '2026-10-23', ['Git', 'Development', 'NodeJS', 'two words', 'GitHub']);
      writePost(lang, 'old', '2026-10-01', ['git', 'development', 'github']);
    }
    const routes = await generators.midnight_source_i18n_pages.call(ctx);
    const sitemap = generators.midnight_source_i18n_sitemap.call(ctx).data;
    for (const lang of languages) {
      assert(routes.some(route => route.path === `${lang}/tags/git/index.html`), 'existing lowercase alias must own the generated Git/git route');
      assert(!routes.some(route => route.path === `${lang}/tags/Git/index.html`), 'do not emit case-only duplicate directories');
      const githubSlug = lang === 'zh-CN' ? 'GitHub' : 'github';
      const otherSlug = lang === 'zh-CN' ? 'github' : 'GitHub';
      const github = routes.find(route => route.path === `${lang}/tags/${githubSlug}/index.html`);
      assert(github, 'per-language canonical_tag_slugs must preserve each established GitHub spelling');
      assert(!routes.some(route => route.path === `${lang}/tags/${otherSlug}/index.html`));
      assert.equal(github.data.posts.length, 2);
      assert.equal(github.data.tag_slug, githubSlug);
      assert.equal(github.data.path, `${lang}/tags/${githubSlug}/`);
      assert(sitemap.includes(`/${lang}/tags/${githubSlug}/`));
      assert(!sitemap.includes(`/${lang}/tags/${otherSlug}/`));
      const links = helpers.midnight_language_links.call(ctx, github.data);
      assert.equal(links.find(link => link.lang === 'zh-CN').url, '/blog/zh-CN/tags/GitHub/', 'hreflang uses the destination language canonical slug');
      assert.equal(links.find(link => link.lang === 'en').url, '/blog/en/tags/github/');
      assert.equal(links.find(link => link.lang === 'zh-CN').absolute_url, 'https://example.test/blog/zh-CN/tags/GitHub/');
      assert.equal(links.find(link => link.lang === 'en').absolute_url, 'https://example.test/blog/en/tags/github/');
      const topic = routes.find(route => route.path === `${lang}/tags/git/index.html`);
      assert.equal(topic.data.posts.length, 2, 'merged aliases include both posts');
      assert(routes.some(route => route.path === `${lang}/tags/Development/index.html`), 'configured uppercase collection remains canonical');
      assert(!routes.some(route => route.path === `${lang}/tags/development/index.html`));
      const index = routes.find(route => route.path === `${lang}/tags/index.html`).data;
      assert.equal(index.tag_collection.filter(tag => tag.slug === 'git').length, 1);
      assert.equal(index.tag_collection.find(tag => tag.slug === 'git').count, 2);
      for (const slug of ['new', 'old']) {
        const post = routes.find(route => route.data.slug === slug && route.data.lang === lang).data;
        const githubTag = post.tags.data.find(tag => tag.name.toLowerCase() === 'github');
        assert.equal(githubTag.slug, githubSlug);
        assert.equal(githubTag.path, `/${lang}/tags/${githubSlug}/`);
        assert.equal(helpers.midnight_i18n_url.call(ctx, `/tags/${githubTag.name}/`, post), `/blog/${lang}/tags/${githubSlug}/`);
        const tag = post.tags.data[0];
        assert.equal(tag.name, slug === 'new' ? 'Git' : 'git', 'preserve per-post display names');
        assert.equal(tag.slug, 'git');
        assert.equal(tag.path, `/${lang}/tags/git/`, 'footer links consume canonical paths');
        assert.equal(helpers.midnight_tag_url.call(ctx, tag.name, post), `/blog/${lang}/tags/git/`);
        assert.equal(helpers.midnight_i18n_url.call(ctx, `/tags/${tag.name}/`, post), `/blog/${lang}/tags/git/`, 'sidebar raw-name links resolve the same alias');
        assert.equal(helpers.midnight_tag_url.call(ctx, 'development', post), `/blog/${lang}/tags/Development/`);
      }
      assert.equal(index.tag_collection.find(tag => tag.slug === githubSlug).count, 2);
      const home = routes.find(route => route.path === `${lang}/index.html`).data;
      assert.equal(helpers.midnight_tag_url.call(ctx, 'GitHub', home), `/blog/${lang}/tags/${githubSlug}/`);
      assert.equal(helpers.midnight_tag_url.call(ctx, 'Git', home), `/blog/${lang}/tags/git/`, 'homepage post labels resolve through generated post tags');
      assert.equal(helpers.midnight_tag_url.call(ctx, 'NodeJS', home), `/blog/${lang}/tags/NodeJS/`, 'single-case tags retain case');
      assert.equal(helpers.midnight_tag_url.call(ctx, 'two words', home), `/blog/${lang}/tags/two-words/`);
      assert.equal(helpers.midnight_tag_url.call(ctx, '', home), `/blog/${lang}/tags/`);
      assert.equal(helpers.midnight_tag_url.call(ctx, 'Unknown', { lang }), `/blog/${lang}/tags/Unknown/`, 'unknown names retain fallback behavior');
      assert.equal((sitemap.match(new RegExp(`https://example.test/blog/${lang}/tags/git/`, 'g')) || []).length, 1);
      assert(!sitemap.includes(`/${lang}/tags/Git/`));
      assert(sitemap.includes(`/${lang}/tags/Development/`));
      assert(!sitemap.includes(`/${lang}/tags/development/`));
    }
    assert.equal(helpers.midnight_tag_url.call(ctx, '', {}), '/blog/zh-CN/tags/', 'default language and empty-tag index stay unchanged');
    assert.equal(helpers.midnight_i18n_url.call(ctx, '/about/', { lang: 'en' }), '/blog/en/about/', 'non-tag navigation is unchanged');
    // Reversing which alias is newest must not change canonical routes.
    for (const lang of languages) {
      writePost(lang, 'old', '2026-10-24', ['git', 'development', 'github']);
    }
    const reordered = await generators.midnight_source_i18n_pages.call(ctx);
    assert(reordered.some(route => route.path === 'en/tags/git/index.html'));
    assert(!reordered.some(route => route.path === 'en/tags/Git/index.html'));
    // Removing the locale map restores global collection defaults.
    delete ctx.theme.config.i18n.canonical_tag_slugs;
    const unmapped = await generators.midnight_source_i18n_pages.call(ctx);
    assert(unmapped.some(route => route.path === 'en/tags/GitHub/index.html'));
    // With no global GitHub collection either, reuse the existing lowercase alias.
    ctx.theme.config.inner_pages.collections.pop();
    const unconfigured = await generators.midnight_source_i18n_pages.call(ctx);
    assert(unconfigured.some(route => route.path === 'zh-CN/tags/github/index.html'));
    assert(!unconfigured.some(route => route.path === 'zh-CN/tags/GitHub/index.html'));
    console.log('Tag case aliases: canonical routes, both URL helpers, post paths, indexes, sitemap, configured/single-case defaults and locale-specific alternate URLs OK');
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
