'use strict';

function themeConfig(hexo) {
  return (hexo.theme && (hexo.theme.config || hexo.theme)) || {};
}

function getPostLang(post, cfg) {
  const field = cfg.article_lang_field || 'lang';
  return post[field] || post.lang || cfg.default_lang || 'zh-CN';
}

function getPerPage(hexo) {
  const archiveCfg = (hexo.config && hexo.config.archive_generator) || {};
  const perPage = Number(archiveCfg.per_page);
  if (Number.isFinite(perPage) && perPage > 0) return perPage;
  const sitePerPage = Number(hexo.config && hexo.config.per_page);
  return Number.isFinite(sitePerPage) && sitePerPage > 0 ? sitePerPage : 10;
}

hexo.extend.generator.register('midnight_i18n_archive', function midnightI18nArchive(locals) {
  const theme = themeConfig(this);
  const cfg = theme.i18n || {};
  const languages = Array.isArray(cfg.languages) && cfg.languages.length
    ? cfg.languages
    : [cfg.default_lang || this.config.language || 'zh-CN'];

  const allPosts = locals.posts && locals.posts.toArray ? locals.posts.toArray() : [];
  if (!allPosts.length) return [];
  const perPage = getPerPage(this);
  const pages = [];

  languages.forEach((lang) => {
    const posts = allPosts
      .filter((post) => getPostLang(post, cfg) === lang)
      .sort((a, b) => b.date - a.date);

    const total = perPage > 0 ? Math.max(1, Math.ceil(posts.length / perPage)) : 1;

    for (let current = 1; current <= total; current += 1) {
      const start = perPage > 0 ? (current - 1) * perPage : 0;
      const end = perPage > 0 ? start + perPage : posts.length;
      const slice = posts.slice(start, end);

      const basePath = `${lang}/archives/`;
      const path = current === 1
        ? `${basePath}index.html`
        : `${basePath}page/${current}/index.html`;

      pages.push({
        path,
        layout: ['archive', 'index'],
        data: {
          title: 'archive',
          lang,
          archive: true,
          path: current === 1 ? basePath : `${basePath}page/${current}/`,
          posts: {
            toArray: () => slice.slice(),
            length: slice.length
          },
          all_posts: {
            toArray: () => posts.slice(),
            length: posts.length
          },
          per_page: perPage,
          current,
          total,
          prev: current > 1 ? current - 1 : 0,
          next: current < total ? current + 1 : 0,
          prev_link: current === 2
            ? basePath
            : (current > 2 ? `${basePath}page/${current - 1}/` : ''),
          next_link: current < total ? `${basePath}page/${current + 1}/` : ''
        }
      });
    }
  });

  return pages;
});
