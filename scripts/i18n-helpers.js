'use strict';

let midnightTranslationIndex = {};

function getThemeConfig(ctx) {
  return (ctx.theme && (ctx.theme.config || ctx.theme)) || {};
}

function postTranslationItem(post, helper, cfg, langField) {
  const path = post.path || '/';
  const permalink = post.permalink || (helper && typeof helper.full_url_for === 'function' ? helper.full_url_for(path) : path);

  return {
    title: post.title,
    lang: post[langField] || post.lang || cfg.default_lang || 'zh-CN',
    path,
    permalink
  };
}

hexo.extend.generator.register('midnight_i18n_translation_index', function midnightI18nTranslationIndex(locals) {
  const themeConfig = getThemeConfig(this);
  const cfg = themeConfig.i18n || {};
  const keyField = cfg.translation_key_field || 'translation_key';
  const langField = cfg.article_lang_field || 'lang';
  const posts = locals.posts && locals.posts.toArray ? locals.posts.toArray() : [];
  const index = {};

  posts.forEach((post) => {
    const key = post && post[keyField];
    if (!key) return;

    if (!index[key]) index[key] = [];
    index[key].push(postTranslationItem(post, this, cfg, langField));
  });

  midnightTranslationIndex = index;
  return [];
});

hexo.extend.helper.register('midnight_page_lang', function midnightPageLang(page) {
  const themeConfig = getThemeConfig(this);
  const cfg = themeConfig.i18n || {};
  const field = cfg.article_lang_field || 'lang';
  const siteLanguage = Array.isArray(this.config.language) ? this.config.language[0] : this.config.language;
  return (page && (page[field] || page.lang)) || cfg.default_lang || siteLanguage || 'zh-CN';
});

hexo.extend.helper.register('midnight_translations', function midnightTranslations(page) {
  const themeConfig = getThemeConfig(this);
  const cfg = themeConfig.i18n || {};
  const keyField = cfg.translation_key_field || 'translation_key';
  const langField = cfg.article_lang_field || 'lang';
  const translations = [];

  getExplicitTranslations(page, this, langField).forEach((item) => translations.push(item));

  const key = page && page[keyField];
  if (page && (translations.length || key)) {
    translations.push({
      title: page.title,
      lang: page[langField] || page.lang || cfg.default_lang || 'zh-CN',
      path: page.path,
      permalink: page.permalink || this.full_url_for(page.path || '/')
    });
  }

  if (key) {
    (midnightTranslationIndex[key] || [])
      .forEach((item) => translations.push(item));

    if (!midnightTranslationIndex[key] && this.site && this.site.posts) {
      this.site.posts
        .filter((post) => post[keyField] === key)
        .forEach((post) => {
          translations.push(postTranslationItem(post, this, cfg, langField));
        });
    }
  }

  return uniqueTranslations(translations, page)
    .sort((a, b) => a.lang.localeCompare(b.lang));
});

hexo.extend.helper.register('midnight_canonical_url', function midnightCanonicalUrl(page) {
  return page.canonical || page.permalink || this.full_url_for(page.path || '/');
});

function isExternalUrl(path) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(String(path || ''));
}

function normalizeRoute(path) {
  const raw = String(path || '/');
  if (raw === '/') return '/';
  return `/${raw.replace(/^\/+/, '').replace(/index\.html?$/i, '')}`;
}

function getSupportedLanguages(helper) {
  const themeConfig = (helper.theme && (helper.theme.config || helper.theme)) || {};
  const cfg = themeConfig.i18n || {};
  const language = helper.config.language;
  const configured = Array.isArray(cfg.languages) ? cfg.languages : [];
  const siteLanguages = Array.isArray(language) ? language : (language ? [language] : []);
  return Array.from(new Set([...configured, ...siteLanguages, cfg.default_lang].filter(Boolean)));
}

function getRouteLanguage(helper, page) {
  const themeConfig = (helper.theme && (helper.theme.config || helper.theme)) || {};
  const cfg = themeConfig.i18n || {};
  const field = cfg.article_lang_field || 'lang';
  const siteLanguage = Array.isArray(helper.config.language) ? helper.config.language[0] : helper.config.language;
  const explicitLang = page && (page[field] || page.lang);
  if (explicitLang) return explicitLang;

  const languages = getSupportedLanguages(helper);
  const currentPath = normalizeRoute((page && page.path) || '/');
  const firstSegment = currentPath.split('/').filter(Boolean)[0];
  if (languages.includes(firstSegment)) return firstSegment;

  return cfg.default_lang || siteLanguage || 'zh-CN';
}

function getCurrentLanguagePrefix(helper, page) {
  const themeConfig = (helper.theme && (helper.theme.config || helper.theme)) || {};
  const cfg = themeConfig.i18n || {};
  const strategy = cfg.route_strategy || 'auto';
  const languages = getSupportedLanguages(helper);
  const lang = getRouteLanguage(helper, page);
  const defaultLang = cfg.default_lang || languages[0];

  if (strategy === 'none') return '';
  if (strategy === 'language_prefix') return lang;
  if (strategy === 'default_root') return lang === defaultLang ? '' : lang;

  const currentPath = normalizeRoute((page && page.path) || '/');
  const firstSegment = currentPath.split('/').filter(Boolean)[0];
  return languages.includes(firstSegment) ? firstSegment : '';
}

function stripLanguagePrefix(path, languages) {
  const route = normalizeRoute(path);
  const parts = route.split('/').filter(Boolean);
  if (parts.length && languages.includes(parts[0])) {
    return `/${parts.slice(1).join('/')}${route.endsWith('/') && parts.length > 1 ? '/' : ''}`;
  }
  return route;
}

function routeForLanguage(helper, path, lang, page) {
  const themeConfig = (helper.theme && (helper.theme.config || helper.theme)) || {};
  const cfg = themeConfig.i18n || {};
  const strategy = cfg.route_strategy || 'auto';
  const languages = getSupportedLanguages(helper);
  const defaultLang = cfg.default_lang || languages[0];
  const currentPrefix = getCurrentLanguagePrefix(helper, page);
  const cleanRoute = stripLanguagePrefix(path || '/', languages);
  const shouldPrefix =
    strategy === 'language_prefix' ||
    (strategy === 'default_root' && lang !== defaultLang) ||
    (strategy === 'auto' && (Boolean(currentPrefix) || lang !== defaultLang));

  if (strategy === 'none' || !shouldPrefix) return cleanRoute;
  if (cleanRoute === '/') return `/${lang}/`;
  return `/${lang}${cleanRoute}`;
}

function isPostPage(page) {
  if (!page) return false;
  if (page.layout === 'post') return true;
  if (page.__post) return true;
  return Boolean(page.source && String(page.source).includes('_posts'));
}

function explicitTranslationItem(lang, value, helper, langField) {
  if (!lang || !value) return null;

  if (typeof value === 'string') {
    return {
      lang,
      title: lang,
      path: value,
      permalink: isExternalUrl(value) ? value : helper.full_url_for(value)
    };
  }

  if (typeof value !== 'object') return null;

  const itemLang = value[langField] || value.lang || lang;
  const itemPath = value.path || value.url || value.permalink;
  if (!itemLang || !itemPath) return null;

  return {
    lang: itemLang,
    title: value.title || itemLang,
    path: itemPath,
    permalink: value.permalink || (isExternalUrl(itemPath) ? itemPath : helper.full_url_for(itemPath))
  };
}

function getExplicitTranslations(page, helper, langField) {
  const raw = page && (page.translations || page.translation || page.alternates || page.alternate);
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item) => explicitTranslationItem(item && (item[langField] || item.lang), item, helper, langField))
      .filter(Boolean);
  }

  if (typeof raw === 'object') {
    return Object.keys(raw)
      .map((lang) => explicitTranslationItem(lang, raw[lang], helper, langField))
      .filter(Boolean);
  }

  return [];
}

function translationIdentity(item) {
  return normalizeRoute(item.path || item.permalink || '/');
}

function uniqueTranslations(items, page) {
  const byLang = {};
  const currentPath = normalizeRoute((page && page.path) || '/');

  items.forEach((item) => {
    if (!item || !item.lang) return;

    const candidate = {
      title: item.title || item.lang,
      lang: item.lang,
      path: item.path || '/',
      permalink: item.permalink
    };

    const previous = byLang[candidate.lang];
    if (!previous || translationIdentity(candidate) === currentPath) {
      byLang[candidate.lang] = candidate;
    }
  });

  return Object.values(byLang);
}

hexo.extend.helper.register('midnight_i18n_url', function midnightI18nUrl(path, page = this.page) {
  if (!path || isExternalUrl(path)) return path || '#';

  const route = normalizeRoute(path);
  const languages = getSupportedLanguages(this);
  const firstSegment = route.split('/').filter(Boolean)[0];

  if (languages.includes(firstSegment)) {
    return this.url_for(route);
  }

  const prefix = getCurrentLanguagePrefix(this, page);
  if (!prefix) return this.url_for(route);
  if (route === '/') return this.url_for(`/${prefix}/`);
  return this.url_for(`/${prefix}${route}`);
});

hexo.extend.helper.register('midnight_tag_url', function midnightTagUrl(tagValue = '', page = this.page) {
  const lang = getRouteLanguage(this, page);
  const value = String(tagValue || '').trim().replace(/^\/+|\/+$/g, '').replace(/\s+/g, '-');
  if (!value) return this.url_for(`/${lang}/tags/`);
  return this.url_for(`/${lang}/tags/${encodeURIComponent(value)}/`);
});

hexo.extend.helper.register('midnight_language_links', function midnightLanguageLinks(page = this.page) {
  const languages = getSupportedLanguages(this);
  const currentLang = getRouteLanguage(this, page);
  const translations = this.midnight_translations(page);
  const byLang = {};

  translations.forEach((item) => {
    byLang[item.lang] = {
      lang: item.lang,
      title: item.title,
      path: item.path,
      url: this.url_for(item.path || '/'),
      absolute_url: item.permalink || this.full_url_for(item.path || '/')
    };
  });

  return languages.reduce((links, lang) => {
    const translated = byLang[lang];
    if (translated) {
      links.push({
        ...translated,
        active: translated.path === page.path || lang === currentLang
      });
      return links;
    }

    if (isPostPage(page)) return links;

    const route = routeForLanguage(this, page.path || '/', lang, page);
    links.push({
      lang,
      title: lang,
      path: route,
      url: this.url_for(route),
      absolute_url: this.full_url_for(route),
      active: lang === currentLang
    });
    return links;
  }, []);
});

function getByPath(source, path) {
  return String(path || '')
    .split('.')
    .filter(Boolean)
    .reduce((value, key) => (value && Object.prototype.hasOwnProperty.call(value, key) ? value[key] : undefined), source);
}

function resolveLocalizedValue(helper, value, fallback) {
  const lang = getRouteLanguage(helper, helper.page);
  const languages = getSupportedLanguages(helper);

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value[lang] || value[lang.toLowerCase()] || value[fallback] || value.default || value.en || value['zh-CN'] || Object.values(value)[0] || '';
  }

  if (typeof value === 'string' && value) {
    const translated = helper.__(value);
    return translated && translated !== value ? translated : value;
  }

  if (fallback && typeof fallback === 'object' && !Array.isArray(fallback)) {
    return resolveLocalizedValue(helper, fallback, '');
  }

  if (typeof fallback === 'string' && fallback) {
    const translated = helper.__(fallback);
    return translated && translated !== fallback ? translated : fallback;
  }

  return fallback || '';
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => {
      const value = Number(code);
      return Number.isFinite(value) ? String.fromCharCode(value) : '';
    });
}

function stripExcerptHtml(value) {
  return decodeHtmlEntities(String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<figure[^>]*class=["'][^"']*highlight[^"']*["'][\s\S]*?<\/figure>/gi, ' ')
    .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<code[\s\S]*?<\/code>/gi, ' ')
    .replace(/<table[\s\S]*?<\/table>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeCode(value) {
  const text = String(value || '').trim();
  if (!text) return true;
  const asciiSymbols = (text.match(/[{}[\]();=<>]|=&gt;|&lt;|&#\d+;/g) || []).length;
  const codeWords = /\b(?:const|let|var|function|class|return|constructor|resolve|reject|console\.log|import|export|async|await|this\.)\b/.test(text);
  const codeDensity = asciiSymbols / Math.max(text.length, 1);
  const longUrl = /https?:\/\/\S{32,}/.test(text);
  return codeWords || codeDensity > 0.08 || longUrl;
}

function splitParagraphs(html) {
  const source = String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<figure[^>]*class=["'][^"']*highlight[^"']*["'][\s\S]*?<\/figure>/gi, ' ')
    .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<code[\s\S]*?<\/code>/gi, ' ')
    .replace(/<table[\s\S]*?<\/table>/gi, ' ');
  const matches = Array.from(source.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)).map((match) => match[1]);
  if (matches.length) return matches;
  return source
    .split(/\n{2,}|<\/(?:h[1-6]|li|blockquote|div|section)>/i)
    .map((item) => item.trim())
    .filter(Boolean);
}

function trimExcerpt(value, limit) {
  const text = stripExcerptHtml(value);
  if (!text || looksLikeCode(text)) return '';
  const max = Number(limit) || 150;
  if (Array.from(text).length <= max) return text;

  const chars = Array.from(text);
  const clipped = chars.slice(0, max).join('');
  const sentenceEnd = Math.max(
    clipped.lastIndexOf('。'),
    clipped.lastIndexOf('！'),
    clipped.lastIndexOf('？'),
    clipped.lastIndexOf('. '),
    clipped.lastIndexOf('! '),
    clipped.lastIndexOf('? ')
  );
  if (sentenceEnd >= 30) return clipped.slice(0, sentenceEnd + 1).trim();

  const softEnd = Math.max(clipped.lastIndexOf('，'), clipped.lastIndexOf('、'), clipped.lastIndexOf(','), clipped.lastIndexOf(';'));
  if (softEnd >= 50) return clipped.slice(0, softEnd).trim();

  return clipped.trim();
}

function preferredLead(post, helper, limit) {
  const fields = ['lead', 'lede', 'intro', 'summary', 'description', 'excerpt'];
  for (const field of fields) {
    const value = post && post[field];
    const localized = resolveLocalizedValue(helper, value, '');
    const excerpt = trimExcerpt(localized, limit);
    if (excerpt) return excerpt;
  }

  const paragraphs = splitParagraphs((post && post.content) || '');
  for (const paragraph of paragraphs) {
    const excerpt = trimExcerpt(paragraph, limit);
    if (excerpt) return excerpt;
  }

  return '';
}

hexo.extend.helper.register('midnight_config', function midnightConfig(path, fallback) {
  const themeConfig = (this.theme && (this.theme.config || this.theme)) || {};
  const value = getByPath(themeConfig, path);
  return value === undefined ? fallback : value;
});

hexo.extend.helper.register('midnight_text', function midnightText(path, fallback = '') {
  const themeConfig = (this.theme && (this.theme.config || this.theme)) || {};
  return resolveLocalizedValue(this, getByPath(themeConfig, path), fallback);
});

hexo.extend.helper.register('midnight_value', function midnightValue(value, fallback = '') {
  return resolveLocalizedValue(this, value, fallback);
});

hexo.extend.helper.register('midnight_excerpt', function midnightExcerpt(post, limit = 150) {
  return preferredLead(post, this, limit);
});
