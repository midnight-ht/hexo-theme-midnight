'use strict';

// Metadata is derived from the same visible content used by the templates.
function httpUrl(ctx, value) {
  if (!value || typeof value !== 'string') return '';
  try {
    const url = new URL(value, ctx.full_url_for('/'));
    return /^https?:$/.test(url.protocol) ? url.href : '';
  } catch (_) { return ''; }
}
function author(ctx, page) {
  const name = String(typeof page.author === 'string' && page.author.trim() ? page.author : ctx.config.author || '').trim();
  const url = httpUrl(ctx, page.author_url) || (name === String(ctx.config.author || '').trim() ? ctx.full_url_for(ctx.midnight_i18n_url('/about/')) : '');
  return { name, url };
}
function sources(ctx, page) {
  const list = Array.isArray(page.sources) ? page.sources : [];
  return list.flatMap(item => {
    const value = typeof item === 'string' ? { url: item } : item || {};
    const url = httpUrl(ctx, value.url);
    return url ? [{ url, title: String(value.title || url) }] : [];
  });
}
function isoDate(value) {
  if (!value) return '';
  const date = new Date(value.valueOf ? value.valueOf() : value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : '';
}
hexo.extend.helper.register('midnight_author', function(page = this.page) { return author(this, page); });
hexo.extend.helper.register('midnight_sources', function(page = this.page) { return sources(this, page); });
hexo.extend.helper.register('midnight_structured_data', function(page, title, description, image) {
  const url = this.midnight_canonical_url(page);
  const root = this.full_url_for('/');
  const lang = this.midnight_page_lang(page);
  const home = this.full_url_for(this.midnight_i18n_url('/'));
  const isPost = page.layout === 'post' || page.__post || /_posts/.test(page.source || '');
  const graph = [
    { '@type': 'WebSite', '@id': root + '#website', url: root, name: this.config.title },
    { '@type': 'WebPage', '@id': url + '#webpage', url, name: title, description, inLanguage: lang,
      isPartOf: { '@id': root + '#website' } }
  ];
  if (isPost) {
    const byline = author(this, page);
    const article = { '@type': 'BlogPosting', '@id': url + '#article', mainEntityOfPage: { '@id': url + '#webpage' },
      url, headline: String(page.title || ''), description, inLanguage: lang };
    const published = isoDate(page.date);
    const modified = isoDate(page.updated);
    if (published) article.datePublished = published;
    if (modified && (!published || modified >= published)) article.dateModified = modified;
    if (byline.name) article.author = { '@type': 'Person', name: byline.name, ...(byline.url ? { url: byline.url } : {}) };
    // A generic site OG image is not necessarily representative of the article.
    const cover = httpUrl(this, page.og_image || page.cover);
    if (cover) article.image = [cover];
    const references = sources(this, page);
    if (references.length) article.citation = references.map(item => item.url);
    graph.push(article);
    graph[1].mainEntity = { '@id': article['@id'] };
  }
  const crumbs = [{ '@type': 'ListItem', position: 1, name: this.__('home'), item: home }];
  if (isPost) crumbs.push({ '@type': 'ListItem', position: 2, name: this.__('archive'), item: this.full_url_for(this.midnight_i18n_url('/archives/')) });
  if (url !== home) crumbs.push({ '@type': 'ListItem', position: crumbs.length + 1, name: String(page.title || title), item: url });
  if (crumbs.length > 1) {
    graph.push({ '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: crumbs });
    graph[1].breadcrumb = { '@id': url + '#breadcrumb' };
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
});
