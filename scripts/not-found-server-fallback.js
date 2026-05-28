'use strict';

function normalizeRoot(root) {
  const value = String(root || '/');
  return value.endsWith('/') ? value : `${value}/`;
}

function stripRoot(path, root) {
  const normalizedRoot = normalizeRoot(root);
  const value = String(path || '/');
  if (normalizedRoot === '/') return value.replace(/^\/+/, '');
  return value.startsWith(normalizedRoot) ? value.slice(normalizedRoot.length) : value.replace(/^\/+/, '');
}

function routeLooksLikeContent(path, languages) {
  const parts = String(path || '').split('/').filter(Boolean);
  const routeParts = languages.includes(parts[0]) ? parts.slice(1) : parts;
  const first = routeParts[0] || '';

  return first === 'tags' ||
    first === 'categories' ||
    /^\d{4}$/.test(first);
}

function findNotFoundRoute(route, path, languages) {
  const lang = String(path || '').split('/').filter(Boolean)[0];
  const candidates = [];

  if (languages.includes(lang)) {
    candidates.push(`${lang}/404/index.html`, `${lang}/404.html`);
  }

  candidates.push('404.html', '404/index.html');
  return candidates.find((candidate) => route.get(candidate));
}

function getLanguages(config, theme) {
  const i18n = theme.i18n || {};
  const configuredLanguages = Array.isArray(i18n.languages) ? i18n.languages : [];
  const siteLanguages = Array.isArray(config.language) ? config.language : (config.language ? [config.language] : []);
  return Array.from(new Set([...configuredLanguages, ...siteLanguages, i18n.default_lang].filter(Boolean)));
}

hexo.extend.filter.register('server_middleware', function midnightNotFoundServerFallback(app) {
  const { config, route } = this;
  const root = normalizeRoot(config.root || '/');
  const theme = (this.theme && (this.theme.config || this.theme)) || {};
  const languages = getLanguages(config, theme);

  app.use(root, (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();

    const requestPath = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
    const relativePath = stripRoot(requestPath, root);

    if (!routeLooksLikeContent(relativePath, languages)) return next();

    const notFoundRoute = findNotFoundRoute(route, relativePath, languages);
    if (!notFoundRoute) return next();

    const data = route.get(notFoundRoute);
    if (!data) return next();

    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    data.pipe(res).on('error', next);
  });
}, 100);
