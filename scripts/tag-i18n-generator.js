'use strict';

const fs = require('fs');
const path = require('path');

function hasLanguagePostDirs(hexo, languages) {
  const sourceDir = hexo.source_dir || path.join(hexo.base_dir || process.cwd(), 'source');
  return languages.some((lang) => fs.existsSync(path.join(sourceDir, lang, '_posts')));
}

function themeConfig(hexo) {
  return (hexo.theme && (hexo.theme.config || hexo.theme)) || {};
}

function slugify(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/^\/+|\/+$/g, '');
}

function normalize(value) {
  return slugify(value).toLowerCase();
}

function getPostLang(post, cfg) {
  const field = cfg.article_lang_field || 'lang';
  return post[field] || post.lang || cfg.default_lang || 'zh-CN';
}

function postHasTag(post, aliases) {
  const rawTags = post.tags && post.tags.data ? post.tags.data : (Array.isArray(post.tags) ? post.tags : []);
  const tags = rawTags.map((tag) => (typeof tag === 'string' ? { name: tag, slug: tag } : tag));
  return tags.some((tag) => aliases.includes(normalize(tag.name)) || aliases.includes(normalize(tag.slug || tag.name)));
}

function collectionTagFromPath(path) {
  const parts = String(path || '').split('/').filter(Boolean);
  const tagIndex = parts.findIndex((part) => part.toLowerCase() === 'tags');
  return tagIndex >= 0 ? parts[tagIndex + 1] : '';
}

hexo.extend.generator.register('midnight_i18n_tags', function midnightI18nTags(locals) {
  const theme = themeConfig(this);
  const cfg = theme.i18n || {};
  const languages = Array.isArray(cfg.languages) && cfg.languages.length ? cfg.languages : [cfg.default_lang || this.config.language || 'zh-CN'];
  const tags = new Map();
  const configured = theme.inner_pages && Array.isArray(theme.inner_pages.collections) ? theme.inner_pages.collections : [];

  configured.forEach((item) => {
    const slug = collectionTagFromPath(item.path);
    if (slug) tags.set(normalize(slug), { name: item.name || slug, slug, collection: item, aliases: [slug] });
  });

  if (locals.tags && locals.tags.each) {
    locals.tags.each((tag) => {
      const slug = slugify(tag.slug || collectionTagFromPath(tag.path) || tag.name);
      if (slug) {
        const prev = tags.get(normalize(slug)) || {};
        tags.set(normalize(slug), { name: tag.name, slug, collection: prev.collection, aliases: prev.aliases || [slug] });
      }
    });
  }

  const posts = locals.posts && locals.posts.toArray ? locals.posts.toArray() : [];
  if (!posts.length && hasLanguagePostDirs(this, languages)) return [];
  const pages = [];

  // Per-language tag index page (/<lang>/tags/index.html)
  languages.forEach((lang) => {
    const tagList = Array.from(tags.values()).map((tag) => {
      const aliases = Array.from(new Set([
        tag.name,
        tag.slug,
        ...(tag.aliases || []),
        tag.collection && tag.collection.path && collectionTagFromPath(tag.collection.path)
      ].filter(Boolean).map(normalize)));
      const taggedCount = posts
        .filter((post) => getPostLang(post, cfg) === lang)
        .filter((post) => postHasTag(post, aliases)).length;
      return { ...tag, count: taggedCount };
    });

    pages.push({
      path: `${lang}/tags/index.html`,
      layout: ['tag-index', 'page', 'index'],
      data: {
        title: 'tags',
        lang,
        path: `${lang}/tags/`,
        tag_index: true,
        tag_collection: tagList
      }
    });
  });

  tags.forEach((tag) => {
    languages.forEach((lang) => {
      const tagAliases = Array.from(new Set([
        tag.name,
        tag.slug,
        ...(tag.aliases || []),
        tag.collection && tag.collection.path && collectionTagFromPath(tag.collection.path)
      ].filter(Boolean).map(normalize)));
      const taggedPosts = posts
        .filter((post) => getPostLang(post, cfg) === lang)
        .filter((post) => postHasTag(post, tagAliases))
        .sort((a, b) => b.date - a.date);

      const basePath = `${lang}/tags/${encodeURIComponent(tag.slug)}/`;

      pages.push({
        path: `${basePath}index.html`,
        layout: ['tag', 'archive', 'index'],
        data: {
          tag: tag.name,
          tag_slug: tag.slug,
          lang,
          title: tag.name,
          path: basePath,
          posts: taggedPosts,
          all_posts: taggedPosts
        }
      });
    });
  });

  return pages;
});
