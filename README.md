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

Use the same `translation_key` for translated versions:

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
