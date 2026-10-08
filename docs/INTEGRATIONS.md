# Webmaster verification, analytics and comments

[中文](INTEGRATIONS.zh-CN.md) · [Full configuration](../README.md#custom-meta-and-webmaster-verification) · [Copyable configuration template](examples/integrations.yml)

Configure your Hexo site's root `_config.midnight.yml`. Do not edit the installed package or generated example theme copy. The template contains no real account credentials and leaves integrations disabled.

## 1. Merge configuration

Merge the needed fields from [integrations.yml](examples/integrations.yml) into your existing configuration. Keep one top-level `seo`, `comments`, `web_analytics`, etc. block per YAML file. Preserve existing descriptions, ownership tokens, navigation and unrelated settings. Leave unused tokens empty and switches off.

## 2. Verification and meta tags

Dedicated fields cover Google, Baidu, Bing, Shenma, Sogou, 360, Yandex and Pinterest. Enter each platform's `content` token, not HTML. Arrays support multiple owners. Other platforms can use `seo.meta` entries with `name` or `property` and `content`.

Page front matter `seo.meta` overrides matching custom entries; `content: false` removes an inherited entry. Use dedicated description, robots and Open Graph settings for built-in metadata to avoid duplicates.

For file verification, `seo.verification_files` emits the exact configured contents at the output root. Copy the platform's exact filename and contents. Only root-level `.html`, `.txt` and `.xml` files are allowed; conflicts and reserved filenames fail the build. Hexo `source/` with `skip_render` is an alternative, but do not use the same filename both ways.

DNS verification belongs in your DNS provider. After deployment, complete verification on the platform and submit the actual sitemap URL. Theme configuration alone does not verify an account or guarantee indexing. See the [verification field reference](../README.md#custom-meta-and-webmaster-verification).

## 3. Analytics

Set `web_analytics.enabled: true`, then configure one or more services:

| Service | Required configuration |
| --- | --- |
| GA4 | `gtag: G-...` |
| Baidu Analytics | `baidu`: the ID after `hm.js?` |
| Umami | `umami.script_url` and `umami.website_id`; optional `domains` |
| Microsoft Clarity | `clarity`: project ID |

Use the exact Umami dashboard script URL and correct domain filters, including `www` when applicable. Legacy `google: UA-...` rendering remains for compatibility, but migrate to GA4. Never put reporting API secrets in browser configuration.

Dashboard tracking, article counters and footer PV/UV are separate:

- `web_analytics` loads dashboard trackers.
- `article_statistics` reads real endpoints returning `{"reads":120}` or `{"comments":3}`. `record_reads` explicitly enables POST counting on article visits.
- `footer.statistics.enabled: true` with `source: busuanzi` enables site-wide PV/UV.

Unavailable article values stay hidden; a genuine zero is displayed. See the [statistics protocol](#article-counter-protocol).

### Article counter protocol

The site supplies the backend; the theme does not create one. Query `GET endpoint?path=/article/path/` and return a JSON numeric `reads` or `comments` field. With `record_reads: true`, an article visit sends `POST endpoint?path=...` with JSON body `{"path":"/article/path/"}`; return the updated `reads`. List pages only query.

The backend owns persistence, deduplication, rate limiting and bot filtering. These are page views, not unique readers or completed reads. Return only non-negative safe integers; missing, invalid, failed or timed-out values stay hidden. Cross-origin endpoints must permit the site origin and required GET/POST methods. Keep service credentials server-side.

Use the same article identifier as the comment service and define whether replies or pending comments are included. If a custom `comment_id` differs from the article path, the backend must map those identifiers consistently. Automatic mode never falls back to front matter. For explicit manual snapshots only, select `provider: frontmatter` and use `views`, `comment_count`, `stats.views` or `stats.comments`; page `comments: true/false` is a switch, not a count.

## 4. Comments and a guestbook

Set `comments.enabled: true` and choose one `comments.provider`:

| Provider | Preparation | Required fields |
| --- | --- | --- |
| Giscus | Public GitHub repository with Discussions enabled and Giscus App installed | `repo`, `repo_id`, `category`, `category_id` |
| Waline | A deployed service with database and moderation configured | `server_url` |
| Utterances | Public GitHub repository with Utterances App installed | `repo` |

Giscus / Utterances `theme: auto` follows the site's light/dark mode; a fixed theme disables synchronization. Waline loads matching styles and follows the site's palette. Empty Giscus / Waline `lang` follows the page language.

Create an ordinary Hexo page at `source/guestbook/index.md`:

```markdown
---
title: Guestbook
layout: page
comments: true
comments_title: Leave a message
---
Questions and feedback are welcome.
```

For multilingual sites, create pages using the existing language directory convention, then add their actual generated URLs to navigation. `comments: false` disables a single page. Optional `comment_id` provides a stable discussion identifier; pages sharing it share a discussion. Plan migrations before changing existing identifiers. See [full provider examples](../README.md#analytics-and-comments--guestbook).

## 5. Build and deployment verification

Run inside your Hexo site:

```bash
npx hexo clean
npx hexo generate
npx hexo server
```

Locally inspect homepage metadata, comment rendering and appearance controls. Domain filters may exclude localhost, so validate collection on the deployed domain.

After deployment:

1. Confirm homepage verification meta tags are in `<head>`; verification files return HTTP 200 with exact contents.
2. Complete platform ownership verification and submit the generated sitemap URL.
3. Check analytics network requests and real-time dashboard events.
4. Submit a real comment, reload and confirm persistence and moderation in the service dashboard.
5. Check mobile overflow and comment appearance after changing the site's mode.

Local service doubles prove integration behavior, not real account verification, analytics ingestion or comment persistence.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| No comment widget | Enablement, provider, required fields and page `comments: false` |
| Giscus repository/category error | App permissions, Discussions and platform-generated IDs |
| Waline request failure | Service reachability, HTTPS, CORS, database and server logs |
| Comment theme stays fixed | `theme: auto` for Giscus / Utterances, browser cache |
| No analytics requests | Switches, IDs, domain filters, blockers and CSP |
| Dashboard works, article counters empty | Separate article endpoint configuration, JSON and path identifiers |
| Changes do not appear | Site-root config, duplicate YAML keys, rebuild and deployment |
| Verification file build failure | Invalid or reserved filename, duplicate configuration, existing source asset |

Official references: [Search Console](https://support.google.com/webmasters/answer/9008080?hl=en), [GA4](https://developers.google.com/analytics/devguides/collection/ga4/tag-options), [Umami](https://docs.umami.is/docs/tracker-configuration), [Clarity](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup), [Giscus](https://giscus.app/), [Waline](https://waline.js.org/en/guide/get-started/), [Utterances](https://utteranc.es/).
