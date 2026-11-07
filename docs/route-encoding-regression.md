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

## Review follow-up: consumer util 4.0 hreflang

The initial test dependency resolved to the example site's `hexo-util@3.3.0`. The consuming Hexo 8 blog resolves `hexo-util@4.0.0`. Read-only probes confirmed that `full_url_for('/tags/A%2FB/')` keeps `%2F` with 3.3.0 but produces `%252F` with 4.0.0. Thus the absolute-helper behavior described above specifically refers to the consumer's 4.0.0, and the initial passing suite was insufficient evidence of consumer hreflang correctness.

Review independently found earlier unprotected `full_url_for` calls in translation permalink construction: the current-page insertion, explicit string/object translations, source-file posts and indexed posts. Later canonical processing cannot infer whether `%252F` was deliberate literal text or an earlier unwanted extra encoding.

The test now declares exact dev-only npm aliases `hexo-util-v3` (3.3.0) and `hexo-util-v4` (4.0.0), with a root package lock. After installing the root and example-site dependencies, ordinary `npm test` always runs the complete route fixture against both implementations; it does not depend on a sibling blog checkout. The added 4.0.0 run failed before the follow-up implementation with:

```text
Hexo URL implementation 3.3.0 passed
AssertionError: hreflang absolute: A%2FB%E6%B5%8B%E8%AF%95
actual:   https://example.test/zh-CN/tags/A%252FB%E6%B5%8B%E8%AF%95/
expected: https://example.test/zh-CN/tags/A%2FB%E6%B5%8B%E8%AF%95/
```

All internal translation permalink creation now uses the shared protected canonical route resolver before any encoding information is lost. Already external permalinks are preserved and used directly in hreflang. Tests additionally exercise explicit string/object/internal-permalink forms, current-page insertion, source-file translation indexing, locals-post indexing, and exact external permalink preservation. Both implementation versions, both root configurations and the original reserved-character matrix pass in the final full `npm test` run. Version remains the unreleased 0.4.9.

An additional assertion for an explicit external translation's clickable `url` first failed with `https%3A//other.test/...` instead of `https://other.test/...`. `routeUrl` now returns external values directly, matching the existing external-link policy of `midnight_i18n_url`; both the link and absolute hreflang remain exact.
