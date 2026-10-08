# Search and AI-readable publication

Midnight renders article text, author details, dates, headings, sources, topic links and navigation as ordinary server-generated HTML. Appearance and motion never gate the content behind JavaScript.

## Article front matter

Use real editorial information. Omit fields that are unknown rather than supplying generated facts or invented citations.

```yaml
title: A specific question or descriptive article title
lang: en
date: 2026-10-08 10:00:00
updated: 2026-10-08 11:00:00
author: Actual author name
author_url: https://example.com/en/about/
description: A concise description of the article's actual scope and conclusion.
key_takeaways:
  - A conclusion supported by the article.
sources:
  - title: Original source title
    url: https://example.org/original-source
cover: /images/article-cover.webp
cover_alt: A useful description of the cover
```

`key_takeaways` and `sources` render only when supplied. The same validated source URLs appear in BlogPosting citations. Publication/update dates must describe actual publication and meaningful editorial changes. A theme change is not a reason to reset every article's update date. Keep translations connected with the existing translation key configuration.

## Content structure

The theme supplies the article H1; begin Markdown sections with H2 and subsections with H3. State the answer or scope early, explain the method and constraints, use descriptive link text, and cite original evidence close to claims. Tables, lists and code should clarify the argument. Do not add repetitive FAQs, hidden answers, invented author credentials, keyword blocks or instructions aimed at manipulating AI systems.

The article directory is derived from actual headings. Related reading is selected from actual articles in the same language. Reading and comment counts remain configuration-gated; genuine zero values are preserved.

## Technical behavior

- Unique route canonical URLs, available-language alternates, localized titles and descriptions.
- WebSite and WebPage graphs; AboutPage for author/about routes and CollectionPage for indexes.
- BlogPosting for articles with author, valid dates, optional representative image, real tags and validated citations.
- ItemList describes posts rendered on the current index page, including pagination scope.
- BreadcrumbList accompanies visible breadcrumbs. Error pages are noindex and omit structured data.
- Existing sitemap, RSS, webmaster verification and configured analytics integrations are retained.
- Static HTML, ordinary links, keyboard navigation and reduced-motion support.

Run `npm run lint:seo` against the example build, or `node scripts/check-seo.js /absolute/path/to/site/public` against the deployment build. This verifies generated HTML, internal links, article metadata and visible citation consistency. Use Search Console and Bing Webmaster Tools after deployment to verify crawl/index status; theme checks cannot establish ranking or AI citation performance.

## References

- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Google: Structured data introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a)

No special AI schema is required by Google's AI Search guidance. Structured data should match visible content, and eligibility does not guarantee indexing, rich results or inclusion in AI answers.
