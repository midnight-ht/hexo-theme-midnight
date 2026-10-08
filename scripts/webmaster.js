'use strict';

const verificationNames = {
  baidu: 'baidu-site-verification', google: 'google-site-verification',
  bing: 'msvalidate.01', shenma: 'shenma-site-verification',
  sogou: 'sogou-site-verification', so: 'verify-v1',
  yandex: 'yandex-verification', pinterest: 'p:domain_verify'
};
const text = value => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
// These tags have dedicated rendering and must not be duplicated by the extension list.
const reserved = new Set(['viewport', 'description', 'keywords', 'robots', 'theme-color',
  'twitter:card', 'og:title', 'og:description', 'og:type', 'og:url', 'og:site_name', 'og:locale', 'og:image']);

hexo.extend.helper.register('midnight_meta_tags', function(page = this.page) {
  const seo = ((this.theme && (this.theme.config || this.theme)) || {}).seo || {};
  const tags = new Map();
  for (const [platform, name] of Object.entries(verificationNames)) {
    const values = seo[platform + '_site_verification'];
    for (const value of Array.isArray(values) ? values : [values]) {
      const content = text(value);
      if (content) tags.set(`name:${name}:${content}`, { name, content });
    }
  }
  // One custom value per key; page values override site values, false removes a tag.
  const custom = new Map();
  for (const entries of [seo.meta, page && page.seo && page.seo.meta]) {
    for (const item of Array.isArray(entries) ? entries : []) {
      if (!item || typeof item !== 'object') continue;
      const attribute = item.name && !item.property ? 'name' : item.property && !item.name ? 'property' : '';
      const key = text(item[attribute]).toLowerCase();
      if (!attribute || !/^[a-z][a-z0-9_.:-]*$/.test(key) || reserved.has(key)) continue;
      // Verification tokens belong to the site and can have multiple owners.
      if (Object.values(verificationNames).includes(key)) continue;
      const content = text(item.content);
      if (content) custom.set(`${attribute}:${key}`, { [attribute]: key, content });
      else if (item.content === false) custom.delete(`${attribute}:${key}`);
    }
  }
  return [...tags.values(), ...custom.values()];
});

hexo.extend.generator.register('midnight_verification_files', function(locals = {}) {
  const files = (this.theme.config.seo || {}).verification_files;
  const seen = new Set();
  const occupied = new Set(['pages', 'assets'].flatMap(key => {
    const collection = locals[key];
    const entries = Array.isArray(collection) ? collection : collection && collection.toArray ? collection.toArray() : [];
    return entries.map(item => String(item.path || '').toLowerCase());
  }));
  return (Array.isArray(files) ? files : []).map(file => {
    // Only root-level verification documents; never overwrite site entry points.
    const path = file && file.path;
    if (typeof path !== 'string' || !/^[a-z0-9][a-z0-9_.-]*\.(html|txt|xml)$/i.test(path) ||
        /^(index|404|robots|sitemap(?:[_.-].*)?|atom|feed|rss)\./i.test(path) || seen.has(path.toLowerCase()) || occupied.has(path.toLowerCase()) ||
        typeof file.content !== 'string' || !file.content.trim()) {
      throw new Error('Midnight: invalid or duplicate seo.verification_files entry');
    }
    seen.add(path.toLowerCase());
    return { path, data: file.content };
  });
});
