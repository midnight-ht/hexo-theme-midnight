'use strict';
if (require.main !== module) return;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const deps = require('node:module').createRequire(path.resolve(__dirname, '../example-site/package.json'));
const versions = [['3.3.0', require('hexo-util-v3')], ['4.0.0', require('hexo-util-v4')]];
const helpers = {}, generators = {};
const fixtureHexo = { extend: {
  helper: { register: (name, fn) => { helpers[name] = fn; } },
  generator: { register: (name, fn) => { generators[name] = fn; } }
} };
for (const file of ['i18n-helpers.js', 'source-i18n-generator.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), { hexo: fixtureHexo, require: deps, URL, console }, { filename: file });
}
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'midnight-route-encoding-'));
const languages = ['zh-CN', 'en'];
const names = ['A/B测试', 'A/B-testing', '中文', 'ASCII', 'literal%2F', 'x#y?z', 'x&y', 'midnightRouteEscape%2F', 'GitHub', 'github'];
const expectedSlugs = ['A%2FB%E6%B5%8B%E8%AF%95', 'A%2FB-testing', '%E4%B8%AD%E6%96%87', 'ASCII', 'literal%252F', 'x%23y%3Fz', 'x%26y', 'midnightRouteEscape%252F', 'GitHub'];
(async () => {
  try {
    for (const lang of languages) {
      const dir = path.join(temp, lang, '_posts');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'fixture.md'), `---\ntitle: Fixture\ndate: "2026-11-08"\nlang: ${lang}\ntags: ${JSON.stringify(names)}\ncategories: ["A/B测试"]\n---\nBody.\n`);
    }
    const sourcePosts = path.join(temp, '_posts');
    fs.mkdirSync(sourcePosts, { recursive: true });
    for (const lang of languages) {
      fs.writeFileSync(path.join(sourcePosts, `${lang}.md`), `---\ntitle: Source translation\ndate: "2026-11-08"\nlang: ${lang}\ntranslation_key: source-pair\npermalink: ${lang}/source/A%2FB/\n---\nBody.\n`);
    }
    for (const [version, util] of versions) {
    for (const root of ['/', '/blog/']) {
      const origin = 'https://example.test' + root.replace(/\/$/, '');
      const ctx = {
        source_dir: temp,
        config: { language: languages, url: origin, root },
        theme: { config: { i18n: { languages, default_lang: 'zh-CN', canonical_tag_slugs: { 'zh-CN': { github: 'GitHub' }, en: { github: 'github' } } } } },
        render: { render: async ({ text }) => text },
        url_for: util.url_for, full_url_for: util.full_url_for
      };
      for (const [name, fn] of Object.entries(helpers)) ctx[name] = (...args) => fn.call(ctx, ...args);
      const routes = await generators.midnight_source_i18n_pages.call(ctx);
      const sitemap = generators.midnight_source_i18n_sitemap.call(ctx).data;
      for (const lang of languages) {
        const post = routes.find(route => route.data.slug === 'fixture' && route.data.lang === lang).data;
        for (const encoded of expectedSlugs) {
          const slug = encoded === 'GitHub' && lang === 'en' ? 'github' : encoded;
          const route = routes.find(item => item.path === `${lang}/tags/${slug}/index.html`);
          assert(route, `actual generator must emit ${slug}`);
          assert(sitemap.includes(`${origin}/${lang}/tags/${slug}/`), `sitemap: ${slug}`);
          const relative = `${root}${lang}/tags/${slug}/`;
          assert.equal(ctx.midnight_tag_url(route.data.tag, post), relative, `tag link must preserve one segment: ${slug}`);
          assert.equal(ctx.midnight_i18n_url(`/${lang}/tags/${slug}/`, post), relative, `i18n link: ${slug}`);
          assert.equal(route.data.path, `${lang}/tags/${slug}/`, 'page identity must match the emitted file');
          assert.equal(ctx.midnight_canonical_url(route.data), `${origin}/${lang}/tags/${slug}/`, `canonical: ${slug}`);
          const links = ctx.midnight_language_links(route.data);
          for (const link of links) {
            const destination = slug === 'GitHub' || slug === 'github' ? (link.lang === 'zh-CN' ? 'GitHub' : 'github') : slug;
            assert.equal(link.url, `${root}${link.lang}/tags/${destination}/`, `hreflang relative: ${slug}`);
            assert.equal(link.absolute_url, `${origin}/${link.lang}/tags/${destination}/`, `hreflang absolute: ${slug}`);
          }
        }
        const category = routes.find(item => item.path === `${lang}/categories/A%2FB%E6%B5%8B%E8%AF%95/index.html`);
        assert.equal(category.data.path, `${lang}/categories/A%2FB%E6%B5%8B%E8%AF%95/`);
        assert.equal(ctx.midnight_canonical_url(category.data), `${origin}/${category.data.path}`);
        assert.equal(ctx.midnight_i18n_url('/about/?q=one#part', { lang, path: `${lang}/` }), `${root}${lang}/about/?q=one#part`);
      }
      generators.midnight_i18n_translation_index.call(ctx, { posts: { toArray: () => languages.map(lang => ({ title: 'Indexed translation', lang, translation_key: 'indexed-pair', path: `${lang}/indexed/A%2FB/` })) } });
      for (const kind of ['source', 'indexed']) {
        const page = { lang: 'zh-CN', path: `zh-CN/${kind}/A%2FB/`, translation_key: `${kind}-pair` };
        const link = ctx.midnight_language_links(page).find(item => item.lang === 'en');
        assert.equal(link.absolute_url, `${origin}/en/${kind}/A%2FB/`, `${version}: ${kind} translation index permalink`);
      }
      const target = 'en/tags/A%2FB-testing/';
      for (const translation of [target, { path: target }, { path: target, permalink: target }]) {
        const page = { lang: 'zh-CN', path: 'zh-CN/tags/A%2FB-testing/', translations: { en: translation } };
        const link = ctx.midnight_language_links(page).find(item => item.lang === 'en');
        assert.equal(link.absolute_url, `${origin}/${target}`, `${version}: explicit translation preserves escapes`);
      }
      const external = 'https://other.test/a%2Fb/?q=one#part';
      for (const translation of [external, { path: target, permalink: external }]) {
        const page = { lang: 'zh-CN', path: 'zh-CN/tags/A%2FB-testing/', translations: { en: translation } };
        assert.equal(ctx.midnight_translations(page).find(item => item.lang === 'en').permalink, external, 'external permalink stays untouched');
        assert.equal(ctx.midnight_language_links(page).find(item => item.lang === 'en').absolute_url, external, 'external hreflang stays untouched');
        if (typeof translation === 'string') assert.equal(ctx.midnight_language_links(page).find(item => item.lang === 'en').url, external, 'external translation link stays untouched');
      }
      assert.equal(ctx.midnight_canonical_url({ permalink: 'https://other.test/a%2Fb/?q=one#part' }), 'https://other.test/a%2Fb/?q=one#part');
    }
    console.log(`Hexo URL implementation ${version} passed`);
    }
    console.log('Route encoding regression passed: actual Hexo helpers, generated files, canonical/hreflang, reserved characters, literal escapes, Unicode, ASCII, case aliases and subpath roots');
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
