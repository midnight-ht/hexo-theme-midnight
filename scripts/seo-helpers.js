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
  const route = String(page.path || '').replace(/index\.html?$/i, '').split('/').filter(Boolean);
  const collection = Boolean(page.archive || page.tag || page.category || page.tag_index || route.includes('tags') || route.includes('categories'));
  const aboutPage = route[route.length - 1] === 'about';
  const pageType = aboutPage ? 'AboutPage' : (collection ? 'CollectionPage' : 'WebPage');
  const graph = [
    { '@type': 'WebSite', '@id': root + '#website', url: root, name: this.config.title },
    { '@type': pageType, '@id': url + '#webpage', url, name: title, description, inLanguage: lang,
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
    const tags = page.tags && Array.isArray(page.tags.data) ? page.tags.data.map(tag => String(tag.name || '')).filter(Boolean) : [];
    if (tags.length) article.keywords = tags.join(', ');
    graph.push(article);
    graph[1].mainEntity = { '@id': article['@id'] };
  }
  if (aboutPage && this.config.author) {
    graph[1].mainEntity = { '@type': 'Person', name: String(this.config.author), url };
  }
  // Only describe the posts actually rendered on this page, never a fabricated catalog.
  if (!isPost && page.posts) {
    const values = page.posts.toArray ? page.posts.toArray() : (Array.isArray(page.posts.data) ? page.posts.data : (Array.isArray(page.posts) ? page.posts : []));
    const entries = values.filter(post => this.midnight_page_lang(post) === lang).sort((a,b) => b.date - a.date);
    const visible = collection ? entries : entries.slice(0, 6);
    if (visible.length) {
      const list = { '@type': 'ItemList', '@id': url + '#posts', itemListElement: visible.map((post, index) => ({ '@type': 'ListItem', position: index + 1, name: String(post.title || ''), url: this.full_url_for(this.midnight_i18n_url(post.path)) })) };
      graph.push(list); graph[1].mainEntity = { '@id': list['@id'] };
    }
  }
  const crumbs = [{ '@type': 'ListItem', position: 1, name: this.__('home'), item: home }];
  if (isPost) crumbs.push({ '@type': 'ListItem', position: 2, name: this.__('archive'), item: this.full_url_for(this.midnight_i18n_url('/archives/')) });
  if (url !== home) crumbs.push({ '@type': 'ListItem', position: crumbs.length + 1, name: isPost ? String(page.title || title) : String(title || page.title).split((this.theme && this.theme.tab_title_separator) || ' | ')[0], item: url });
  if (crumbs.length > 1) {
    graph.push({ '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: crumbs });
    graph[1].breadcrumb = { '@id': url + '#breadcrumb' };
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
});
