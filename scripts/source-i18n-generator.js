'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function themeConfig(hexo) {
  return (hexo.theme && (hexo.theme.config || hexo.theme)) || {};
}

function getI18nLanguages(hexo) {
  const theme = themeConfig(hexo);
  const themeI18n = theme.i18n || {};
  const configured = Array.isArray(themeI18n.languages) ? themeI18n.languages : [];
  const siteI18n = Array.isArray(hexo.config.i18n)
    ? hexo.config.i18n.map((item) => item && item.language).filter(Boolean)
    : [];
  const siteLanguages = Array.isArray(hexo.config.language)
    ? hexo.config.language
    : (hexo.config.language ? [hexo.config.language] : []);

  return Array.from(new Set([
    ...configured,
    ...siteI18n,
    ...siteLanguages,
    themeI18n.default_lang
  ].filter(Boolean)));
}

function sourceDir(hexo) {
  return hexo.source_dir || path.join(hexo.base_dir || process.cwd(), 'source');
}

function hasLanguagePostDirs(hexo, languages) {
  const root = sourceDir(hexo);
  return languages.some((lang) => fs.existsSync(path.join(root, lang, '_posts')));
}

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).reduce((files, entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return files.concat(listMarkdownFiles(file));
    if (entry.isFile() && /\.(?:md|markdown|mkd|mkdn|mdwn|mdtxt|mdtext)$/i.test(entry.name)) files.push(file);
    return files;
  }, []);
}

function parseFrontMatter(raw) {
  const match = String(raw).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  return {
    data: yaml.load(match[1]) || {},
    frontMatter: match[1],
    content: match[2] || ''
  };
}

function frontMatterValue(frontMatter, key) {
  const match = String(frontMatter || '').match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm'));
  return match ? match[1].replace(/^['"]|['"]$/g, '') : '';
}

function parseLocalDate(value, fallbackValue) {
  const rawValue = typeof value === 'string' ? value : fallbackValue;

  if (rawValue) {
    const match = String(rawValue).match(
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
    );

    if (match) {
      return new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        Number(match[4] || 0),
        Number(match[5] || 0),
        Number(match[6] || 0)
      );
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
      value.getUTCHours(),
      value.getUTCMinutes(),
      value.getUTCSeconds()
    );
  }

  return new Date();
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function collection(items, basePath) {
  const data = toArray(items).filter(Boolean).map((name) => ({
    name,
    slug: String(name).replace(/\s+/g, '-'),
    path: `${basePath}/${encodeURIComponent(String(name))}/`
  }));

  return { data };
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function postPath(lang, date, slug) {
  return [
    lang,
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    slug,
    ''
  ].join('/');
}

function postsForLanguage(hexo, lang) {
  const postsDir = path.join(sourceDir(hexo), lang, '_posts');
  const root = sourceDir(hexo);

  return listMarkdownFiles(postsDir)
    .map((file) => {
      const relative = path.relative(postsDir, file).replace(/\\/g, '/');
      const source = path.relative(root, file).replace(/\\/g, '/');
      const raw = fs.readFileSync(file, 'utf8');
      const parsed = parseFrontMatter(raw);
      const slug = relative.replace(/\.[^.]+$/, '');
      const date = parseLocalDate(parsed.data.date, frontMatterValue(parsed.frontMatter, 'date'));
      const routePath = parsed.data.permalink
        ? normalizePermalink(parsed.data.permalink)
        : postPath(lang, date, slug);

      return {
        ...parsed.data,
        title: parsed.data.title || slug,
        date,
        updated: parsed.data.updated
          ? parseLocalDate(parsed.data.updated, frontMatterValue(parsed.frontMatter, 'updated'))
          : date,
        source,
        slug,
        path: routePath,
        lang,
        rawContent: parsed.content,
        excerpt: parsed.data.excerpt || '',
        comments: parsed.data.comments,
        tags: collection(parsed.data.tags || parsed.data.tag, `/${lang}/tags`),
        categories: collection(parsed.data.categories || parsed.data.category, `/${lang}/categories`)
      };
    })
    .sort((a, b) => b.date - a.date);
}

function normalizePermalink(value) {
  const permalink = String(value || '/').replace(/^\/+/, '');
  if (!permalink) return '/';
  return permalink.endsWith('/') || /\.[a-z0-9]+$/i.test(permalink) ? permalink : `${permalink}/`;
}

function postsCollection(posts) {
  const sorted = posts.slice().sort((a, b) => b.date - a.date);
  return {
    data: sorted,
    length: sorted.length,
    toArray: () => sorted.slice(),
    sort: (field) => {
      if (field === '-date') return postsCollection(sorted);
      if (field === 'date') return postsCollection(sorted.slice().reverse());
      return postsCollection(sorted);
    },
    filter: (fn) => postsCollection(sorted.filter(fn)),
    each: (fn) => sorted.forEach(fn)
  };
}

function termSlug(value) {
  return String(value || '').trim().replace(/\s+/g, '-').replace(/^\/+|\/+$/g, '');
}

function collectionValueFromPath(pathValue, collectionName) {
  const parts = String(pathValue || '').split('/').filter(Boolean);
  const index = parts.findIndex((part) => part.toLowerCase() === collectionName);
  return index >= 0 ? parts[index + 1] : '';
}

function collectTermDetails(posts, key) {
  const map = new Map();

  posts.forEach((post) => {
    const values = post[key] && post[key].data ? post[key].data : [];
    values.forEach((item) => {
      const name = item.name || item.slug;
      const slug = termSlug(item.slug || name);
      if (!slug) return;

      const mapKey = slug.toLowerCase();
      const current = map.get(mapKey) || {
        name,
        slug,
        path: item.path,
        count: 0,
        posts: [],
        aliases: []
      };

      if (!current.aliases.includes(slug)) current.aliases.push(slug);
      current.count += 1;
      current.posts.push(post);
      map.set(mapKey, current);
    });
  });

  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function mergeConfiguredTerms(terms, hexo, collectionName) {
  const map = new Map(terms.map((term) => [term.slug.toLowerCase(), term]));
  const theme = themeConfig(hexo);
  const collections = theme.inner_pages && Array.isArray(theme.inner_pages.collections)
    ? theme.inner_pages.collections
    : [];

  collections.forEach((item) => {
    const slug = termSlug(collectionValueFromPath(item.path, collectionName));
    if (!slug) return;

    const key = slug.toLowerCase();
    if (map.has(key)) {
      const term = map.get(key);
      map.set(key, {
        ...term,
        configured: true,
        path: term.path || item.path
      });
    } else {
      map.set(key, {
        name: item.name || slug,
        slug,
        path: item.path,
        count: 0,
        posts: [],
        configured: true
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function translationItem(hexo, post) {
  return {
    title: post.title,
    lang: post.lang,
    path: post.path,
    permalink: hexo.full_url_for ? hexo.full_url_for(post.path) : siteUrl(hexo, post.path)
  };
}

function translationsForPost(hexo, post, postsByTranslationKey) {
  const key = post && post.translation_key;
  if (!key) return [];

  return (postsByTranslationKey.get(key) || [])
    .map((translation) => translationItem(hexo, translation));
}

function siteUrl(hexo, routePath) {
  const base = String(hexo.config.url || '').replace(/\/+$/, '');
  const normalized = String(routePath || '').replace(/^\/+/, '');
  return normalized ? `${base}/${normalized}` : `${base}/`;
}

function makeRedirectHtml(target) {
  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '  <meta charset="utf-8">',
    `  <meta http-equiv="refresh" content="0;url=${target}">`,
    `  <link rel="canonical" href="${target}">`,
    '  <title>Redirecting...</title>',
    '</head>',
    '<body>',
    `  <p>Redirecting to <a href="${target}">${target}</a></p>`,
    '</body>',
    '</html>'
  ].join('\n');
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function postSummary(post) {
  return stripHtml(post.excerpt || post.rawContent).slice(0, 280);
}

function collectTerms(posts, key) {
  const terms = new Set();
  posts.forEach((post) => {
    const values = post[key] && post[key].data ? post[key].data : [];
    values.forEach((item) => terms.add(item.name));
  });
  return Array.from(terms);
}

function uniqueItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.loc)) return false;
    seen.add(item.loc);
    return true;
  });
}

function sitemapXml(items) {
  const body = uniqueItems(items)
    .map((item) => [
      '  <url>',
      `    <loc>${xmlEscape(item.loc)}</loc>`,
      item.lastmod ? `    <lastmod>${xmlEscape(item.lastmod)}</lastmod>` : '',
      '  </url>'
    ].filter(Boolean).join('\n'))
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    '</urlset>'
  ].join('\n');
}

function feedTitle(hexo, options) {
  const parts = [hexo.config.title || 'Blog'];
  if (options && options.lang) parts.push(options.lang);
  if (options && options.rangeLabel) parts.push(options.rangeLabel);
  return parts.join(' - ');
}

function feedDescription(hexo, options) {
  const parts = [hexo.config.description || ''];
  if (options && options.lang) parts.push(`Language: ${options.lang}`);
  if (options && options.rangeLabel) parts.push(`Range: ${options.rangeLabel}`);
  return parts.filter(Boolean).join(' | ');
}

function rssXml(hexo, posts, options = {}) {
  const title = feedTitle(hexo, options);
  const description = feedDescription(hexo, options);
  const site = siteUrl(hexo, '');
  const latestDate = posts[0] ? posts[0].updated || posts[0].date : new Date();
  const items = posts.map((post) => {
    const link = siteUrl(hexo, post.path);
    const categories = (post.tags.data || [])
      .map((tag) => `      <category>${xmlEscape(tag.name)}</category>`)
      .join('\n');

    return [
      '    <item>',
      `      <title>${xmlEscape(post.title)}</title>`,
      `      <link>${xmlEscape(link)}</link>`,
      `      <guid isPermaLink="true">${xmlEscape(link)}</guid>`,
      `      <pubDate>${post.date.toUTCString()}</pubDate>`,
      `      <description>${xmlEscape(postSummary(post))}</description>`,
      categories,
      '    </item>'
    ].filter(Boolean).join('\n');
  }).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${xmlEscape(title)}</title>`,
    `    <link>${xmlEscape(site)}</link>`,
    `    <description>${xmlEscape(description)}</description>`,
    `    <language>${xmlEscape(options.lang || hexo.config.language || 'zh-CN')}</language>`,
    `    <lastBuildDate>${latestDate.toUTCString()}</lastBuildDate>`,
    '    <generator>hexo-theme-midnight</generator>',
    items,
    '  </channel>',
    '</rss>'
  ].join('\n');
}

function atomXml(hexo, posts, options = {}) {
  const title = feedTitle(hexo, options);
  const site = siteUrl(hexo, '');
  const feed = siteUrl(hexo, options.path || 'atom.xml');
  const latestDate = posts[0] ? posts[0].updated || posts[0].date : new Date();
  const entries = posts.map((post) => {
    const link = siteUrl(hexo, post.path);
    const updated = post.updated || post.date;

    return [
      '  <entry>',
      `    <title>${xmlEscape(post.title)}</title>`,
      `    <link href="${xmlEscape(link)}"/>`,
      `    <id>${xmlEscape(link)}</id>`,
      `    <published>${post.date.toISOString()}</published>`,
      `    <updated>${updated.toISOString()}</updated>`,
      `    <summary>${xmlEscape(postSummary(post))}</summary>`,
      '  </entry>'
    ].join('\n');
  }).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <title>${xmlEscape(title)}</title>`,
    `  <link href="${xmlEscape(site)}"/>`,
    `  <link href="${xmlEscape(feed)}" rel="self"/>`,
    `  <id>${xmlEscape(site)}</id>`,
    `  <updated>${latestDate.toISOString()}</updated>`,
    entries,
    '</feed>'
  ].join('\n');
}

function postsSince(posts, days) {
  const latest = posts[0] ? posts[0].date : new Date();
  const threshold = new Date(latest.getTime() - days * 24 * 60 * 60 * 1000);
  return posts.filter((post) => post.date >= threshold);
}

function allLanguagePosts(hexo, languages) {
  return languages
    .flatMap((lang) => postsForLanguage(hexo, lang))
    .sort((a, b) => b.date - a.date);
}

hexo.extend.generator.register('midnight_source_i18n_pages', function midnightSourceI18nPages() {
  const languages = getI18nLanguages(this);
  if (!hasLanguagePostDirs(this, languages)) return [];

  const defaultLanguage = Array.isArray(this.config.language)
    ? this.config.language[0]
    : this.config.language;
  const routes = [];
  const postsByLanguage = new Map(languages.map((lang) => [lang, postsForLanguage(this, lang)]));
  const postsByTranslationKey = new Map();

  postsByLanguage.forEach((posts) => {
    posts.forEach((post) => {
      if (!post.translation_key) return;

      const translations = postsByTranslationKey.get(post.translation_key) || [];
      translations.push(post);
      postsByTranslationKey.set(post.translation_key, translations);
    });
  });

  return Promise.all(languages.map(async (lang) => {
    const posts = postsByLanguage.get(lang) || [];

    routes.push({
      path: `${lang}/index.html`,
      layout: ['index'],
      data: {
        title: this.config.title,
        lang,
        path: `${lang}/`,
        posts: postsCollection(posts)
      }
    });

    const tags = mergeConfiguredTerms(collectTermDetails(posts, 'tags'), this, 'tags');
    const categories = mergeConfiguredTerms(collectTermDetails(posts, 'categories'), this, 'categories');

    routes.push({
      path: `${lang}/tags/index.html`,
      layout: ['tag-index', 'page', 'index'],
      data: {
        title: 'tags',
        lang,
        path: `${lang}/tags/`,
        tag_index: true,
        all_posts: postsCollection(posts),
        tag_collection: tags.map((tag) => ({
          name: tag.name,
          slug: tag.slug,
          count: tag.count
        }))
      }
    });

    tags.filter((tag) => tag.count > 0 || tag.configured).forEach((tag) => {
      routes.push({
        path: `${lang}/tags/${encodeURIComponent(tag.slug)}/index.html`,
        layout: ['tag', 'archive', 'index'],
        data: {
          tag: tag.name,
          tag_slug: tag.slug,
          lang,
          title: tag.name,
          path: `${lang}/tags/${tag.slug}/`,
          all_posts: postsCollection(posts),
          posts: postsCollection(tag.posts)
        }
      });
    });

    categories.filter((category) => category.count > 0 || category.configured).forEach((category) => {
      const categorySlugs = Array.from(new Set([category.slug, ...(category.aliases || [])].filter(Boolean)));
      categorySlugs.forEach((categorySlug) => {
        routes.push({
          path: `${lang}/categories/${encodeURIComponent(categorySlug)}/index.html`,
          layout: ['category', 'archive', 'index'],
          data: {
            category: category.name,
            category_slug: categorySlug,
            lang,
            title: category.name,
            path: `${lang}/categories/${categorySlug}/`,
            all_posts: postsCollection(posts),
            posts: postsCollection(category.posts)
          }
        });
      });
    });

    routes.push({
      path: `${lang}/archives/index.html`,
      layout: ['archive', 'index'],
      data: {
        title: 'archive',
        lang,
        archive: true,
        path: `${lang}/archives/`,
        all_posts: postsCollection(posts),
        posts: postsCollection(posts),
        current: 1,
        total: 1,
        prev: 0,
        next: 0,
        prev_link: '',
        next_link: ''
      }
    });

    const postRoutes = await Promise.all(posts.map(async (post) => {
      const content = await this.render.render({
        text: post.rawContent,
        engine: 'md'
      });

      return {
        path: `${post.path}index.html`,
        layout: ['post'],
        data: {
          ...post,
          translations: translationsForPost(this, post, postsByTranslationKey),
          content,
          excerpt: post.excerpt || content.split('<!-- more -->')[0]
        }
      };
    }));

    routes.push(...postRoutes);
  })).then(() => {
    if (defaultLanguage && languages.includes(defaultLanguage)) {
      routes.push({
        path: 'index.html',
        layout: false,
        data: makeRedirectHtml(`/${defaultLanguage}/`)
      });
    }

    return routes;
  });
});

hexo.extend.generator.register('midnight_source_i18n_sitemap', function midnightSourceI18nSitemap() {
  const languages = getI18nLanguages(this);
  if (!hasLanguagePostDirs(this, languages)) return [];

  const now = new Date().toISOString();
  const items = [{ loc: siteUrl(this, ''), lastmod: now }];

  languages.forEach((lang) => {
    const posts = postsForLanguage(this, lang);

    ['', 'about/', 'links/', 'archives/', 'tags/'].forEach((route) => {
      items.push({
        loc: siteUrl(this, `${lang}/${route}`),
        lastmod: now
      });
    });

    collectTerms(posts, 'tags').forEach((tag) => {
      items.push({
        loc: siteUrl(this, `${lang}/tags/${encodeURIComponent(termSlug(tag))}/`),
        lastmod: now
      });
    });

    collectTerms(posts, 'categories').forEach((category) => {
      items.push({
        loc: siteUrl(this, `${lang}/categories/${encodeURIComponent(termSlug(category))}/`),
        lastmod: now
      });
    });

    posts.forEach((post) => {
      items.push({
        loc: siteUrl(this, post.path),
        lastmod: (post.updated || post.date || new Date()).toISOString()
      });
    });
  });

  return {
    path: 'sitemap.xml',
    data: sitemapXml(items)
  };
});

hexo.extend.generator.register('midnight_source_i18n_feed', function midnightSourceI18nFeed() {
  const languages = getI18nLanguages(this);
  if (!hasLanguagePostDirs(this, languages)) return [];

  const posts = allLanguagePosts(this, languages);
  const ranges = [
    { slug: '7d', days: 7, label: 'Last 7 days' },
    { slug: '30d', days: 30, label: 'Last 30 days' },
    { slug: '365d', days: 365, label: 'Last 365 days' }
  ];
  const feeds = [
    {
      path: 'rss.xml',
      data: rssXml(this, posts)
    },
    {
      path: 'atom.xml',
      data: atomXml(this, posts)
    }
  ];

  languages.forEach((lang) => {
    const langPosts = posts.filter((post) => post.lang === lang);

    feeds.push({
      path: `feeds/${lang}/rss.xml`,
      data: rssXml(this, langPosts, { lang })
    });

    feeds.push({
      path: `feeds/${lang}/atom.xml`,
      data: atomXml(this, langPosts, { lang, path: `feeds/${lang}/atom.xml` })
    });

    ranges.forEach((range) => {
      const rangedLangPosts = postsSince(langPosts, range.days);

      feeds.push({
        path: `feeds/${lang}/${range.slug}/rss.xml`,
        data: rssXml(this, rangedLangPosts, { lang, rangeLabel: range.label })
      });

      feeds.push({
        path: `feeds/${lang}/${range.slug}/atom.xml`,
        data: atomXml(this, rangedLangPosts, {
          lang,
          rangeLabel: range.label,
          path: `feeds/${lang}/${range.slug}/atom.xml`
        })
      });
    });
  });

  ranges.forEach((range) => {
    const rangedPosts = postsSince(posts, range.days);

    feeds.push({
      path: `feeds/${range.slug}/rss.xml`,
      data: rssXml(this, rangedPosts, { rangeLabel: range.label })
    });

    feeds.push({
      path: `feeds/${range.slug}/atom.xml`,
      data: atomXml(this, rangedPosts, {
        rangeLabel: range.label,
        path: `feeds/${range.slug}/atom.xml`
      })
    });
  });

  return feeds;
});
