# Midnight

[中文自述](README.zh-CN.md)

[Webmaster, analytics and comments guide](docs/INTEGRATIONS.md) · [Configuration template](docs/examples/integrations.yml)

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

The homepage, reading view, archives and topic pages use open grids, fine rules and a consistent type scale. Covers render only when supplied. The homepage uses a distinct ink-and-paper identity, an original SVG loop, and a single chronological article stream. Ocean, jade and violet palettes retain light, dark and system preferences.

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


## Custom meta and webmaster verification

Configure the site's `_config.midnight.yml`. Empty values produce no tags. Verification fields accept the platform's `content` token (not HTML), or an array of tokens for multiple owners.

```yaml
seo:
  google_site_verification: "your-token"
  baidu_site_verification: ""
  bing_site_verification: ""
  shenma_site_verification: ""
  sogou_site_verification: ""
  so_site_verification: ""
  yandex_site_verification: ""
  pinterest_site_verification: ""
  meta:
    - name: referrer
      content: strict-origin-when-cross-origin
    - property: fb:app_id
      content: "your-app-id"
  verification_files: []
```

The verification names are respectively `google-site-verification`, `baidu-site-verification`, `msvalidate.01`, `shenma-site-verification`, `sogou-site-verification`, `verify-v1`, `yandex-verification`, and `p:domain_verify`. Use `seo.meta` for additional platforms. Each custom entry accepts exactly one of `name` or `property`, plus `content`; values are HTML-escaped. Raw HTML, scripts and `http-equiv` are unsupported. Check each platform's current instructions when obtaining tokens.

Page front matter `seo.meta` overrides matching site custom entries; `content: false` removes an inherited custom tag. Site ownership tokens cannot be overridden by a page. Built-in description, keywords, robots, viewport, theme-color and existing Open Graph/Twitter fields are ignored in the custom list to prevent duplicates. Use their dedicated options and page `noindex: true` instead.

For file verification, copy the exact platform filename and contents:

```yaml
seo:
  verification_files:
    - path: googleYOUR_TOKEN.html
      content: "google-site-verification: googleYOUR_TOKEN.html"
    - path: BingSiteAuth.xml
      content: |
        <?xml version="1.0"?>
        <users><user>YOUR_TOKEN</user></users>
```

These are format examples, not valid credentials. Files are emitted verbatim at the output root, without layout or Markdown processing. Only root-level `.html`, `.txt` and `.xml` filenames are accepted. Invalid paths, duplicate filenames, existing page/asset collisions and reserved index/404/robots/sitemap/feed names fail the build. For subdirectory hosting, check the platform's required verification URL. Alternatively, put original files in Hexo `source/` with `skip_render`; do not configure the same filename both ways.

After deploying, inspect the homepage source and confirm verification file contents and HTTP 200, then complete verification on the platform. DNS TXT verification belongs in your DNS provider. Configuration alone does not verify accounts, submit URLs or guarantee indexing. Keep ownership credentials after verification and submit the actual sitemap URL through the platforms. Analytics stays in `web_analytics`. Server-side submission credentials for Baidu push or IndexNow belong in the deployment workflow, never in public meta or browser scripts.

References: [Google](https://support.google.com/webmasters/answer/9008080?hl=en), [Bing](https://learn.microsoft.com/en-us/bingwebmaster/verifying-wordpress), [Sogou](https://zhanzhang.sogou.com/index.php/help/siteVerify), [Yandex](https://yandex.ru/support/webmaster/en/service/quick-start). Run `npm run lint:webmaster` to check optional tokens, multiple owners, overrides, escaping and verification file validation.


## Analytics and comments / guestbook

Configure the site's `_config.midnight.yml`. Integrations are disabled by default; incomplete settings do not emit a widget or tracker.

```yaml
web_analytics:
  enabled: true
  gtag: "G-YOUR_GA4_ID"
  baidu: ""
  clarity: "" # Microsoft Clarity project ID
  umami:
    script_url: "" # Exact tracker URL from your dashboard
    website_id: ""
    domains: "" # Optional comma-separated allowed hostnames
comments:
  enabled: true
  provider: waline
  waline:
    server_url: "https://your-waline-service.example.com"
    lang: "" # Follow the page language
    placeholder: "Share your questions or experience"
    page_size: 10
```

Choose individual analytics services as needed. GA4 uses `gtag`; a `G-...` ID in `google` also uses GA4 and is not loaded twice when both fields match. Legacy `UA-...` rendering is retained for compatibility, but Universal Analytics no longer processes new data; migrate to GA4. Existing Baidu, CNZZ and legacy 51.LA script-path settings remain available. Footer PV/UV can be enabled separately with `footer.statistics.enabled: true` and `source: busuanzi`.

Analytics dashboards do not automatically supply article counters. Article reads/comments still use real `article_statistics` endpoints; unavailable values stay hidden and a genuine zero is shown. Do not expose reporting secrets in browser configuration.

Comments support one of:

- **Giscus**: configure `giscus.repo`, `repo_id`, `category`, `category_id` using [giscus.app](https://giscus.app/). Enable Discussions and install the Giscus App on the public repository. Visitors sign in with GitHub.
- **Waline**: configure `waline.server_url` for your deployed service. Visitor login and moderation are controlled by that service.
- **Utterances**: configure `utterances.repo`, install the [Utterances App](https://github.com/apps/utterances) on the public repository; visitors sign in with GitHub and comments are stored in Issues.

Giscus and Utterances `theme: auto` follow the site's light/dark selection; `theme_light` and `theme_dark` customize those modes. A fixed provider `theme` disables automatic switching. Waline loads matching v3 CSS and follows the site's appearance and skin. Empty Giscus/Waline `lang` follows the page language.

Create an ordinary Hexo page at `source/guestbook/index.md` (or in the relevant language's page directory):

```markdown
---
title: Guestbook
layout: page
comments: true
comments_title: Leave a message
---
Questions, feedback and ideas are welcome.
```

Add its actual generated URL to navigation. `comments: false` disables comments for a page; global enablement and valid service configuration are always required. Optional front matter `comment_id` gives a page a stable discussion identifier. Reusing an ID across translations shares their discussion, so do so intentionally. Plan migrations before changing paths or titles.

After deployment, verify actual analytics requests and real-time dashboard events. Submit a real comment, reload, and confirm persistence and moderation in the service dashboard. Local tests use service doubles and do not prove connectivity to a real account.

References: [GA4](https://developers.google.com/analytics/devguides/collection/ga4/tag-options), [Umami](https://docs.umami.is/docs/tracker-configuration), [Clarity](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup), [Waline](https://waline.js.org/en/guide/get-started/), [Utterances](https://utteranc.es/).

[SEO / GEO editorial guide](docs/seo-geo.md)
