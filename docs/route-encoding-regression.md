# Route segment encoding regression (0.4.9)

## Observed failure and cause

The blog's 2026-11-08 build emitted `zh-CN/tags/A%2FB%E6%B5%8B%E8%AF%95/index.html` and `en/tags/A%2FB-testing/index.html`, but rendered relative links contained `A/B` as two segments. Read-only filesystem checks confirmed the encoded Chinese file existed and `zh-CN/tags/A/B%E6%B5%8B%E8%AF%95/index.html` did not. The blog's `source/vercel.json` contains five exact case rewrites, not a general slash or Unicode rewrite.

The real Hexo URL helpers reproduce two different transformations with `root: /blog/` and `url: https://example.test/blog`:

- `url_for('/tags/A%2FB/')` returns `/blog/tags/A/B/`.
- `full_url_for('/tags/A%2FB/')` returns `https://example.test/blog/tags/A%252FB/`.

The theme's existing `encodeRoutePath` runs after those helpers. Re-encoding each segment cannot recover a slash that has already become a separator. The source generator also emitted encoded filenames but supplied raw term slugs in tag/category page `data.path`, which made canonical page identity disagree with the file route.

## Regression and fix

`node scripts/check-route-encoding.js` runs the actual source generator and the real `hexo-util.url_for` / `full_url_for` implementations used by Hexo's URL helpers. Its first run failed with:

```text
AssertionError: tag link must preserve one segment: A%2FB%E6%B5%8B%E8%AF%95
actual:   /zh-CN/tags/A/B%E6%B5%8B%E8%AF%95/
expected: /zh-CN/tags/A%2FB%E6%B5%8B%E8%AF%95/
```

The fix shields existing percent triplets with collision-checked temporary tokens while Hexo applies its root and pretty-URL rules, then restores them before normalizing each segment. Both relative URLs and canonical URLs use that step. Generated tag/category `data.path` now uses the same `encodeURIComponent(slug)` as its emitted filename. The filename generation, tag names, aliases and case policy are unchanged.

Assertions cover slash plus Chinese/ASCII labels, plain Chinese, plain ASCII, literal `%2F` (which must remain `%252F`, distinct from a slash), `#`, `?`, `&`, a label containing the temporary-token prefix, locale-specific GitHub/github aliases, tag links, i18n links, page identity, canonical, hreflang and sitemap. Both `/` and `/blog/` roots run. Ordinary query/fragment suffixes and external canonical origins are retained.

Fresh final verification: `npm test` passed all five regression scripts, including the Hexo theme-loader wrapper compilation check. The first full-suite attempt caught a test-local `const hexo` colliding with that wrapper parameter; the fixture was renamed before the passing run.

This is local generator/helper evidence. It does not establish how the deployed host routes encoded slashes. After the consuming site upgrades and builds, verify each new encoded-slash URL on its deployed host and inspect title, canonical, hreflang and body. Keep ordinary Unicode routes once-encoded in canonical URLs; no Vercel rewrite or broader static filename strategy was changed here.
