'use strict';

function themeConfig(hexo) {
  return (hexo.theme && (hexo.theme.config || hexo.theme)) || {};
}

function localized(value, lang, fallback) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value[lang] || value[lang.toLowerCase()] || value.default || value.en || value['zh-CN'] || Object.values(value)[0] || fallback || '';
  }

  return value || fallback || '';
}

function normalizePath(path) {
  return String(path || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/index\.html?$/i, '')
    .replace(/\/?$/, '/');
}

hexo.extend.generator.register('midnight_i18n_inner_pages', function midnightI18nInnerPages(locals) {
  const theme = themeConfig(this);
  const cfg = theme.i18n || {};
  const languages = Array.isArray(cfg.languages) && cfg.languages.length
    ? cfg.languages
    : [cfg.default_lang || this.config.language || 'zh-CN'];

  const innerPages = theme.inner_pages || {};
  const pageDefs = [
    { slug: 'about', layout: ['page', 'about', 'index'], fallbackTitle: 'About' },
    { slug: 'advertise', layout: ['page', 'advertise', 'index'], fallbackTitle: 'Advertise' },
    { slug: 'newsletter', layout: ['page', 'newsletter', 'index'], fallbackTitle: 'Newsletter' },
    { slug: 'privacy', layout: ['page', 'privacy', 'index'], fallbackTitle: 'Privacy' }
  ];

  const existing = new Set();
  if (locals.pages && locals.pages.each) {
    locals.pages.each((page) => existing.add(normalizePath(page.path)));
  }

  const pages = [];

  pageDefs.forEach((def) => {
    const pageConfig = innerPages[def.slug] || {};

    languages.forEach((lang) => {
      const route = `${lang}/${def.slug}/`;
      if (existing.has(normalizePath(route))) return;

      pages.push({
        path: `${route}index.html`,
        layout: def.layout,
        data: {
          title: localized(pageConfig.title, lang, def.fallbackTitle),
          description: localized(pageConfig.description, lang, ''),
          lang,
          path: route,
          comments: false,
          content: ''
        }
      });
    });
  });

  return pages;
});
