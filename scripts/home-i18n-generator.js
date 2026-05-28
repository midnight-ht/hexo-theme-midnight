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

function getPostLang(post, cfg) {
  const field = cfg.article_lang_field || 'lang';
  return post[field] || post.lang || cfg.default_lang || 'zh-CN';
}

hexo.extend.generator.register('midnight_i18n_home', function midnightI18nHome(locals) {
  const theme = themeConfig(this);
  const cfg = theme.i18n || {};
  const languages = Array.isArray(cfg.languages) && cfg.languages.length
    ? cfg.languages
    : [cfg.default_lang || this.config.language || 'zh-CN'];
  const posts = locals.posts && locals.posts.toArray ? locals.posts.toArray() : [];
  if (!posts.length && hasLanguagePostDirs(this, languages)) return [];

  return languages.map((lang) => {
    const langPosts = posts
      .filter((post) => getPostLang(post, cfg) === lang)
      .sort((a, b) => b.date - a.date);
    const basePath = `${lang}/`;

    return {
      path: `${basePath}index.html`,
      layout: ['index'],
      data: {
        title: this.config.title,
        lang,
        path: basePath,
        posts: {
          toArray: () => langPosts.slice(),
          length: langPosts.length
        }
      }
    };
  });
});
