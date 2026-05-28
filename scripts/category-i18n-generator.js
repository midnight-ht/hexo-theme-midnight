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

function postHasCategory(post, aliases) {
  const rawCategories = post.categories && post.categories.data ? post.categories.data : (Array.isArray(post.categories) ? post.categories : []);
  const categories = rawCategories.map((category) => (typeof category === 'string' ? { name: category, slug: category } : category));
  return categories.some((category) => aliases.includes(normalize(category.name)) || aliases.includes(normalize(category.slug || category.name)));
}

function collectionCategoryFromPath(path) {
  const parts = String(path || '').split('/').filter(Boolean);
  const categoryIndex = parts.findIndex((part) => part.toLowerCase() === 'categories');
  return categoryIndex >= 0 ? parts[categoryIndex + 1] : '';
}

hexo.extend.generator.register('midnight_i18n_categories', function midnightI18nCategories(locals) {
  const theme = themeConfig(this);
  const cfg = theme.i18n || {};
  const languages = Array.isArray(cfg.languages) && cfg.languages.length ? cfg.languages : [cfg.default_lang || this.config.language || 'zh-CN'];
  const categories = new Map();
  const configured = theme.inner_pages && Array.isArray(theme.inner_pages.collections) ? theme.inner_pages.collections : [];

  configured.forEach((item) => {
    const slug = collectionCategoryFromPath(item.path);
    if (slug) categories.set(normalize(slug), { name: item.name || slug, slug, collection: item, aliases: [slug] });
  });

  if (locals.categories && locals.categories.each) {
    locals.categories.each((category) => {
      const slug = slugify(category.slug || collectionCategoryFromPath(category.path) || category.name);
      if (slug) {
        const prev = categories.get(normalize(slug)) || {};
        categories.set(normalize(slug), { name: category.name, slug, collection: prev.collection, aliases: prev.aliases || [slug] });
      }
    });
  }

  const posts = locals.posts && locals.posts.toArray ? locals.posts.toArray() : [];
  if (!posts.length && hasLanguagePostDirs(this, languages)) return [];
  const pages = [];

  categories.forEach((category) => {
    languages.forEach((lang) => {
      const categoryAliases = Array.from(new Set([
        category.name,
        category.slug,
        ...(category.aliases || []),
        category.collection && category.collection.path && collectionCategoryFromPath(category.collection.path)
      ].filter(Boolean).map(normalize)));
      const categoryPosts = posts
        .filter((post) => getPostLang(post, cfg) === lang)
        .filter((post) => postHasCategory(post, categoryAliases))
        .sort((a, b) => b.date - a.date);

      const basePath = `${lang}/categories/${encodeURIComponent(category.slug)}/`;

      pages.push({
        path: `${basePath}index.html`,
        layout: ['category', 'archive', 'index'],
        data: {
          category: category.name,
          category_slug: category.slug,
          lang,
          title: category.name,
          path: basePath,
          posts: categoryPosts,
          all_posts: categoryPosts
        }
      });
    });
  });

  return pages;
});
