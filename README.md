# Midnight

[中文自述](README.zh-CN.md)

Midnight is a modern Hexo theme for technology writing, product notes, AI-focused blogs, and multilingual publishing. It provides an editorial homepage, article templates, language-aware routes, configurable comments, SEO metadata, and an optional browser-side model session panel.

## Features

- Editorial homepage with hero stories, featured posts, channels, sidebar modules, sponsorship slots, and topic cards.
- Light and dark appearance tokens with a browser-side theme switcher.
- Theme-level `zh-CN` and `en` interface strings.
- Article language switching through shared `translation_key` front matter.
- Language-aware internal links for routes such as `/zh-CN/` and `/en/`.
- Archive, tag, category, about, newsletter, privacy, advertise, and 404 templates.
- Canonical and alternate-language metadata for SEO and sitemap-friendly publishing.
- Pluggable comments with Giscus, Waline, or Utterances.
- Optional model session UI that calls your own server-side proxy endpoint.

## Installation

Install the theme in your Hexo site:

```bash
npm install hexo-theme-midnight
```

Then set the theme in the site `_config.yml`:

```yaml
theme: midnight
```

If your Hexo setup does not automatically resolve npm-installed themes, copy or link the package into `themes/midnight`.

Recommended site plugins:

```bash
npm install hexo-generator-sitemap hexo-generator-feed
```

## Demo Site

Run the bundled example site locally:

```bash
cd example-site
npm install
npm run server
```

Then open `http://localhost:4000`.

## Configuration

Copy the theme `_config.yml` into your site's theme config location, then adjust values for your site. Keep provider secrets out of the theme config and frontend code.

```yaml
appearance:
  logo: ""
  logo_text: Midnight
  nick: Midnight
  default_scheme: light

i18n:
  default_lang: zh-CN
  route_strategy: auto
  languages:
    - zh-CN
    - en

model_session:
  enabled: true
  endpoint: ""

comments:
  enabled: false
  provider: giscus
```

## Article i18n

Use the same `translation_key` for translated versions. During generation, Midnight looks up every post with that key and uses each post's real `path`, so translated articles can have different slugs:

```yaml
---
title: Hello Midnight
lang: en
translation_key: hello-midnight
---
```

```yaml
---
title: 你好 Midnight
lang: zh-CN
translation_key: hello-midnight
---
```

If you cannot share a key, declare explicit translation routes in front matter:

```yaml
---
title: Hello Midnight
lang: en
translations:
  zh-CN: /zh-CN/2026/05/19/ni-hao-midnight/
  en: /en/2026/05/19/hello-midnight/
---
```

On post pages, missing translations are not fabricated by replacing only the language prefix. This avoids sending readers to non-existent localized slugs.

Midnight also supports language-scoped source posts such as `source/zh-CN/_posts/*.md` and `source/en/_posts/*.md` during `hexo generate`. When those folders exist, the theme generates language home, archive, tag, category, post, feed, and sitemap routes from them so the site does not need a separate project-level i18n generator.

## Navigation

Navbar order is `Home -> custom items -> Archives -> About`. Add custom buttons through `nav.items`:

```yaml
nav:
  home:
    name: home
    path: /
  items:
    - name: AI Agent
      path: /tags/AI-Agent/
      style: underline
    - name:
        zh-CN: 商业观察
        en: Business
      path: /tags/Business/
      style: pill
  archives:
    name: archives
    path: /archives/
  about:
    name: about
    path: /about/
```

Supported `style` values are `underline`, `text`, `pill`, `ghost`, `outline`, and `solid`. Internal paths are passed through the i18n-aware route helper, so tag links can resolve to routes such as `/zh-CN/tags/AI-Agent/`.

## Model Session

The theme only provides the browser UI. Configure `model_session.endpoint` to call your own server-side proxy. Provider API keys must stay on the server.

## Development

Run checks from the theme root:

```bash
npm run lint:structure
npm run lint:config-content
npm run lint:a11y
npm run lint:comments
npm run lint:model-session
```

Before publishing, preview the package contents:

```bash
npm pack --dry-run
```

## npm Release

This repository includes a GitHub Actions workflow that creates a GitHub Release and publishes the package to npm when a version tag is pushed.

Add an npm automation token as the repository secret `NPM_TOKEN`, update `package.json`, then push a matching tag:

```bash
npm version patch
git push origin master --follow-tags
```

The tag must use the `v*.*.*` format and match the package version, for example `v0.1.1`.

The release workflow runs package-safe checks only. Checks that require a generated example site, such as `npm run lint:a11y`, should be run locally after building the example site.

## License

MIT

## Appearance in 0.2.0

Choose `appearance.skin: ocean`, `jade`, or `violet`. Each palette supports light and dark modes. Set `appearance.default_scheme: system` to follow the operating system. Desktop navigation and the mobile menu let readers choose their appearance and palette; preferences persist across navigation and reloads.

The old global `appearance.accent` override is deprecated and no longer applied. Use the built-in palettes or configure `accent_light` and `accent_dark` separately with six-digit hex colors and verify contrast for your custom colors.

Optional statistics, search, comments, subscriptions, and AI modules only render when their required configuration is present. Sponsored placements require explicit opt-in. Article statistics default to hidden; the endpoint contract and configuration are documented in the Chinese README.

## Editorial layout and SEO / GEO (0.3)

The homepage, reading view, archives and topic pages use open grids, fine rules and a consistent type scale. Covers render only when supplied. Explicit `editor_pick` flags select editorial recommendations; popularity lists require measured reads. Ocean, jade and violet palettes retain light, dark and system preferences.

The theme emits WebSite, WebPage, BlogPosting and breadcrumb JSON-LD from visible titles, authors, dates and descriptions. Translation links use actual counterpart paths with `x-default`; 404 pages are `noindex`. Index sitemap entries no longer receive synthetic build-time modification dates. Set `seo.structured_data: false` to disable theme JSON-LD. Existing schema injectors should skip pages containing `id="midnight-seo-jsonld"` to avoid duplicate article entities.

Optional article front matter:

```yaml
author: Author name
author_url: https://example.com/about/
summary: A concise description of the article
key_takeaways:
  - A conclusion supported by the article
sources:
  - title: Original reference
    url: https://example.com/source
cover: /images/actual-cover.jpg
cover_alt: Describe the image
cover_caption: Caption or credit
```

Missing takeaways, sources and covers produce no corresponding module. The site author links to the localized about page; guest authors require their own URL. Generic site images are not substituted for article images. `seo.description` and `appearance.tagline` accept localized mappings.

GEO follows [Google's AI features guidance](https://developers.google.com/search/docs/appearance/ai-features): crawlable text, useful internal links, clear structure, verifiable sources and metadata consistent with visible content. No invented FAQ, metrics, sources, dates, indexing promises or special AI text files. Article metadata follows the [Article documentation](https://developers.google.com/search/docs/appearance/structured-data/article).

Run `npm run lint:seo` to validate generated canonical/language metadata, main landmarks, article titles, JSON-LD, visible citations and script escaping. Pass a public output directory to `node scripts/check-seo.js` to check a real site's build.
