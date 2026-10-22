# Tag case aliases in 0.4.2

Language-source posts can contain both `Git` and the historical `git` tag. The source generator already grouped them without regard to case, but selected the first spelling after sorting posts by date. A new uppercase label could therefore replace an existing lowercase route. macOS could resolve the resulting links locally while a case-sensitive static deployment returned 404. The sitemap separately emitted raw names, and some article links used display labels rather than the selected route.

For tags with an existing all-lowercase slug, source generation now keeps that slug as the canonical route. Configured collection slugs take precedence over automatic selection, preserving routes such as `/tags/Development/`; version 0.4.3 adds an explicit per-language spelling override below. A single-case unconfigured tag such as `NodeJS` keeps its spelling. This is not a global lowercase migration and does not write case-only alias directories or redirects.

The generated in-memory tag `slug` and `path` use that canonical route; per-post display names remain unchanged. Both URL helpers resolve known display-name aliases from page tags, tag indexes, or the page's posts. This also covers article sidebar links that enter through `midnight_i18n_url`. The sitemap collects the same canonical tag terms as the tag index and topic routes. Category behavior is unchanged.

## Regression and verification

`npm test` (also `npm run lint:tag-case`) runs the actual source-page generator, source sitemap generator and registered URL helpers against temporary bilingual Markdown fixtures. It checks one merged `git` route, both posts, article footer paths, both helper paths, homepage labels, tag index and sitemap agreement, configured `Development`, single-case `NodeJS`, whitespace, empty/default/unknown tags, non-tag links and reversed post ordering. Fixtures are outside the repository and are removed after the run.

Before the production change, the regression failed with:

```
AssertionError [ERR_ASSERTION]: existing lowercase alias must own the generated Git/git route
actual: false
expected: true
```

After the change, it prints:

```
Tag case aliases: canonical routes, both URL helpers, post paths, indexes, sitemap, configured and single-case defaults OK
```

The full existing `lint:*` set was also executed successfully with the example site's dependencies available through `NODE_PATH`. Its output checks use the existing example build; the isolated regression generates fresh fixture routes in memory. A fresh consuming-site build and public URL verification remain deployment checks. This patch does not modify article files, dates, content or front matter and does not claim the public 404 has been resolved before redeployment.

## Per-language canonical spellings in 0.4.3

A shared tag can have differently cased historical URLs by language. Configure the override in the site's theme configuration (for example `_config.midnight.yml`):

```yaml
i18n:
  canonical_tag_slugs:
    zh-CN:
      github: GitHub
    en:
      github: github
```

Each language maps a case-insensitive tag slug to its canonical spelling. These overrides are applied after configured collection defaults and affect only that language. They do not change display names or article front matter. The target must be a nonempty string with the same case-folded slug as its key; this configuration cannot rename a tag to a different identity or generate a missing tag. Unknown tags, invalid entries and missing language mappings retain existing behavior.

The source page and sitemap generators pass the destination language into the same canonical-term merge. Generated article tag paths, topic paths and tag index entries therefore agree. Topic pages also carry explicit per-language translation paths, so the language switcher and hreflang metadata can point to `/zh-CN/tags/GitHub/` and `/en/tags/github/` rather than copying the current locale's spelling into every locale.

The extended regression failed against 0.4.2 at `per-language canonical_tag_slugs must preserve each established GitHub spelling` (actual undefined, expected true). It now exercises both locale spellings in the actual generators, post paths and URL helpers, index, sitemap and actual `midnight_language_links` results from each topic page. It also removes the mapping to verify that global configured defaults remain authoritative, then removes that collection to verify the existing lowercase-alias fallback. Existing `Development`, `NodeJS`, `Git/git`, default language and non-tag checks remain in place.

This is a theme implementation check. Consuming-site configuration, clean generation, installation pin and public URL checks remain required before claiming the historical routes are live.
